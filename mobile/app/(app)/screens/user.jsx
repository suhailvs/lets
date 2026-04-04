import { View, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { Text, FAB,Avatar } from "react-native-paper";
import { useEffect, useState, useRef, useCallback } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import SkeletonLoader from "@/components/SkeletonLoader";
import api from '@/constants/api';

// ─── Palette ──────────────────────────────────────────────────────────────────
const WA = {
  chatBg: '#ECE5DD',
  incomingBubble: '#FFFFFF',
  outgoingBubble: '#DCF8C6',
  textPrimary: '#111B21',
  textSecondary: '#667781',
  amountIn: '#00A884',
  amountOut: '#111B21',
  datePill: 'rgba(0,0,0,0.35)',
  datePillText: '#FFFFFF',
  headerBg: '#075E54',
  headerText: '#FFFFFF',
  fabReceive: '#25D366',
  fabPay: '#075E54',
  tickColor: '#53BDEB',
};

const PAGE_SIZE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDateLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function getTimeLabel(dateStr) {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

/**
 * Merges date-separator rows between transactions.
 * Input must be sorted oldest → newest.
 */
function buildListItems(transactions) {
  const items = [];
  let lastLabel = null;
  for (const txn of transactions) {
    const label = getDateLabel(txn.created_at);
    if (label !== lastLabel) {
      items.push({ type: 'date', label, _key: `date-${label}` });
      lastLabel = label;
    }
    items.push({ type: 'txn', ...txn, _key: `txn-${txn.id}` });
  }
  return items;
}

// ─── Date separator ───────────────────────────────────────────────────────────
function DateSeparator({ label }) {
  return (
    <View style={s.dateSepWrap}>
      <View style={s.dateSepPill}>
        <Text style={s.dateSepText}>{label}</Text>
      </View>
    </View>
  );
}

// ─── Bubble ───────────────────────────────────────────────────────────────────
function TxnBubble({ item }) {
  const isReceived = !Boolean(item.is_received);// since is_received = seller == given user(non request.user)
  
  return (
    <View style={[s.bubbleRow, isReceived ? s.rowLeft : s.rowRight]}>
      <View style={[s.tail, isReceived ? s.tailLeft : s.tailRight]} />
      <View style={[s.bubble, isReceived ? s.bubbleIn : s.bubbleOut]}>
        <Text style={[s.counterparty, isReceived ? s.nameIn : s.nameOut]}>
          {isReceived ? 'Payment to you' : `Payment to ${item.seller_name}`}
        </Text>
        <Text style={[s.amount, isReceived ? s.amountIn : s.amountOut]}>
          {isReceived ? '+' : '-'} {item.amount}ℏ
        </Text>
        {item.description ? <Text style={s.desc}>{item.description}</Text> : null}
        <View style={s.meta}>
          <Text style={s.time}>{getTimeLabel(item.created_at)}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Skeleton (initial load only) ────────────────────────────────────────────
function SkeletonBubbles() {
  return (
    <View style={{ padding: 12, gap: 10 }}>
      {[false, true, false, false, true, false, true].map((right, i) => (
        <View key={i} style={{ alignItems: right ? 'flex-end' : 'flex-start' }}>
          <SkeletonLoader
            width={160 + (i % 3) * 30}
            height={72}
            style={{ borderRadius: 10 }}
          />
        </View>
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function UserScreen() {
  const { id, username, name,thumbnail,balance, is_mine } = useLocalSearchParams();
  const router = useRouter();

  const [transactions, setTransactions]   = useState([]);   // oldest → newest
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [hasMore, setHasMore]             = useState(true);

  // offset of the NEXT page to fetch (older items)
  // page 1 = most recent PAGE_SIZE items; page 2 = next older set, etc.
  const nextPageRef    = useRef(2);       // after first load, next older page is 2
  const fetchingRef    = useRef(false);

  const listRef        = useRef(null);
  const heightBeforeRef = useRef(0);      // contentSize.height before prepend
  const offsetBeforeRef = useRef(0);      // scrollOffset before prepend

  // ── fetch ─────────────────────────────────────────────────────────────────
  // Django APIView example — adjust params to match your endpoint.
  // Expected response shape: { results: [...], count: N }
  // or plain array (we handle both).
  // Pass `ordering=-created_at` so newest items come first.
  const fetchTransactions = useCallback(async (page) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const res = await api.get('/transactions/', {
        params: {
          show: 'mine', // is_mine === 'yes' ? 'all':'mine', show all txns if is mine == yes else show only mine
          user: id,
          page,
          page_size: PAGE_SIZE,
          ordering: '-created_at',
        },
      });

      const raw    = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
      const count  = Array.isArray(res.data) ? null      : (res.data.count ?? null);

      // API returns newest-first; reverse to get oldest-first for this chunk.
      const chunk  = [...raw].reverse();

      // No more older pages when:
      //   - fewer items than PAGE_SIZE returned, OR
      //   - we've loaded count items total
      const totalLoaded = (nextPageRef.current - 1) * PAGE_SIZE;  // rough
      const noMore = raw.length < PAGE_SIZE || (count !== null && totalLoaded >= count);

      // Prepend to the front (older items go before newer ones).
      setTransactions(prev => [...chunk, ...prev]);
      setHasMore(!noMore);
      nextPageRef.current = page + 1;
    } catch (err) {
      console.error('fetchTransactions error:', err);
    } finally {
      fetchingRef.current = false;
    }
  }, [id]);

  // ── initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      await fetchTransactions(1);
      setInitialLoading(false);
    })();
  }, [fetchTransactions]);

  // Scroll to bottom after first paint (latest message visible).
  useEffect(() => {
    if (!initialLoading && transactions.length > 0) {
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: false })
      );
    }
  }, [initialLoading]);  // run once after skeleton disappears

  // ── upward scroll → load older ────────────────────────────────────────────
  const handleScroll = useCallback((e) => {
    offsetBeforeRef.current = e.nativeEvent.contentOffset.y;
    heightBeforeRef.current = e.nativeEvent.contentSize.height;
  }, []);

  const loadOlder = useCallback(async () => {
    if (!hasMore || loadingMore || fetchingRef.current) return;
    setLoadingMore(true);
    // Snapshot scroll state right before we mutate the list.
    // (handleScroll keeps offsetBeforeRef / heightBeforeRef current.)
    await fetchTransactions(nextPageRef.current);
    setLoadingMore(false);
  }, [hasMore, loadingMore, fetchTransactions]);

  // After prepend, restore scroll position so the view doesn't jump.
  const handleContentSizeChange = useCallback((_w, newHeight) => {
    if (loadingMore) return;            // still animating; skip
    const delta = newHeight - heightBeforeRef.current;
    if (delta > 0 && offsetBeforeRef.current < 120) {
      listRef.current?.scrollToOffset({
        offset: offsetBeforeRef.current + delta,
        animated: false,
      });
    }
    heightBeforeRef.current = newHeight;
  }, [loadingMore]);

  // Trigger load when user reaches the very top.
  const handleScrollEndDrag = useCallback((e) => {
    if (e.nativeEvent.contentOffset.y < 60) loadOlder();
  }, [loadOlder]);

  const handleMomentumScrollEnd = useCallback((e) => {
    if (e.nativeEvent.contentOffset.y < 60) loadOlder();
  }, [loadOlder]);

  const listItems = buildListItems(transactions);

  return (
    <>
      {/* <Stack.Screen
        options={{
          title: is_mine === 'yes' ? 'My Transactions' : name,
          // headerStyle: { backgroundColor: WA.headerBg },
          // headerTintColor: WA.headerText,
          // headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          // headerShadowVisible: false,
        }}
      /> */}
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={s.StackheaderContainer}>
              <Avatar.Image 
                size={50} 
                source={{ uri: thumbnail }} 
                style={s.Stackavatar}
              />
              <View style={s.StacktextContainer}>
                <Text style={s.Stackname}>{name}</Text>
                <Text style={s.Stackbalance}>Balance: ℏ{balance}</Text>
              </View>
            </View>
          ),
          headerTitleAlign: "left",
        }}
      />


      <View style={s.screen}>
        {initialLoading ? (
          <SkeletonBubbles />
        ) : (
          <FlatList
            ref={listRef}
            data={listItems}
            keyExtractor={(item) => item._key}
            contentContainerStyle={s.listContainer}
            scrollEventThrottle={16}
            onScroll={handleScroll}
            onScrollEndDrag={handleScrollEndDrag}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            onContentSizeChange={handleContentSizeChange}
            // Top edge: spinner while loading older items, or a hint/end label.
            ListHeaderComponent={
              loadingMore ? (
                <View style={s.topSpinner}>
                  <ActivityIndicator size="small" color={WA.headerBg} />
                </View>
              ) : hasMore ? (
                <View style={s.topHint}>
                  <Text style={s.topHintText}>↑ Scroll up to load older</Text>
                </View>
              ) : (
                <View style={s.topHint}>
                  <Text style={s.topHintText}>— Beginning of transactions —</Text>
                </View>
              )
            }
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <View style={s.emptyCard}>
                  <Text style={s.emptyTitle}>No transactions yet</Text>
                  <Text style={s.emptySub}>
                    Payments you send or receive will appear here.
                  </Text>
                </View>
              </View>
            }
            renderItem={({ item }) =>
              item.type === 'date'
                ? <DateSeparator label={item.label} />
                : <TxnBubble item={item} />
            }
          />
        )}

        {is_mine !== 'yes' && (
          <View style={s.fabGroup}>
            <FAB
              icon="arrow-down"
              label="Receive"
              color="#FFF"
              style={s.fabReceive}
              onPress={() =>
                router.navigate({
                  pathname: 'screens/sendmoney/amount',
                  params: { id, username, first_name: name, txn_type: 'seller' },
                })
              }
            />
            <FAB
              icon="arrow-up"
              label="Pay"
              color="#FFF"
              style={s.fabPay}
              onPress={() =>
                router.navigate({
                  pathname: 'screens/sendmoney/amount',
                  params: { id, username, first_name: name, txn_type: 'buyer' },
                })
              }
            />
          </View>
        )}
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const TAIL = 8;
const RADIUS = 10;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: WA.chatBg },
  StackheaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  Stackavatar: {
    marginRight: 4,
  },
  StacktextContainer: {
    justifyContent: "center",
  },
  Stackname: {
    fontWeight: "500",
    fontSize: 28,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  Stackbalance: {
    fontWeight: "400",
    fontSize: 20,
    opacity: 0.7,
  },
  listContainer: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    paddingBottom: 120,
  },

  // Top edge UI
  topSpinner: { alignItems: 'center', paddingVertical: 14 },
  topHint:    { alignItems: 'center', paddingVertical: 10 },
  topHintText: { fontSize: 11, color: 'rgba(0,0,0,0.3)', fontWeight: '500' },

  // Date separator
  dateSepWrap: { alignItems: 'center', marginVertical: 10 },
  dateSepPill: {
    backgroundColor: WA.datePill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  dateSepText: { color: WA.datePillText, fontSize: 11, fontWeight: '600' },

  // Bubble rows
  bubbleRow: { flexDirection: 'row', marginVertical: 2, maxWidth: '80%' },
  rowLeft:  { alignSelf: 'flex-start', marginLeft: TAIL },
  rowRight: { alignSelf: 'flex-end', flexDirection: 'row-reverse', marginRight: TAIL },

  // Tail
  tail: {
    width: 0, height: 0,
    borderTopWidth: TAIL, borderBottomWidth: 0,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    marginTop: 6,
  },
  tailLeft:  { borderRightWidth: TAIL, borderRightColor: WA.incomingBubble, borderLeftWidth: 0 },
  tailRight: { borderLeftWidth: TAIL,  borderLeftColor: WA.outgoingBubble,  borderRightWidth: 0 },

  // Bubble body
  bubble: {
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6,
    borderRadius: RADIUS, minWidth: 150,
    shadowColor: '#000', shadowOpacity: 0.07,
    shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  bubbleIn:  { backgroundColor: WA.incomingBubble, borderTopLeftRadius: 2 },
  bubbleOut: { backgroundColor: WA.outgoingBubble, borderTopRightRadius: 2 },

  counterparty: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  nameIn:  { color: '#00A884' },
  nameOut: { color: '#7B61FF' },

  amount: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginBottom: 2 },
  amountIn:  { color: WA.amountIn },
  amountOut: { color: WA.amountOut },

  desc: { fontSize: 12, color: WA.textSecondary, marginBottom: 3 },

  meta: {
    flexDirection: 'row', justifyContent: 'flex-end',
    alignItems: 'center', gap: 3, marginTop: 4,
  },
  time: { fontSize: 10, color: WA.textSecondary },
  tick: { fontSize: 11, color: WA.tickColor, fontWeight: '700' },

  // Empty state
  emptyWrap: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    paddingHorizontal: 20, paddingVertical: 16,
    borderRadius: 12, alignItems: 'center',
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: WA.textPrimary, marginBottom: 4 },
  emptySub:   { fontSize: 12, color: WA.textSecondary, textAlign: 'center' },

  // FABs
  fabGroup:   { position: 'absolute', right: 16, bottom: 24, alignItems: 'flex-end', gap: 12 },
  fabReceive: { backgroundColor: WA.fabReceive, borderRadius: 100 },
  fabPay:     { backgroundColor: WA.fabPay, borderRadius: 100 },
});