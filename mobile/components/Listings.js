import { useState, useEffect } from "react";
import { StyleSheet, FlatList, View, Image, Pressable, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import SkeletonLoader from "@/components/SkeletonLoader";
import api from "@/constants/api";
import i18n from '@/constants/i18n';
import { formatDate } from '@/utils/formatDate';
import { Palette } from "@/constants/Colors";

export default function Listings({ ltype }) {
  const [page, setPage]                   = useState(1);
  const [totallistings, setTotalListings] = useState(0);
  const [hasNext, setHasNext]             = useState(true);
  const [data, setData]                   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [refreshing, setRefreshing]       = useState(false);
  const router = useRouter();

  useEffect(() => { fetchData(1); }, []);

  const fetchData = async (pageNumber = page) => {
    if (loading || refreshing || !hasNext) return;
    setLoading(true);
    try {
      const res = await api.get(`/listings/?type=${ltype}&user=${global.selectedUserId}&page=${pageNumber}`);
      if (pageNumber === 1) setData(res.data.results);
      else setData(prev => [...prev, ...res.data.results]);
      setTotalListings(res.data.count);
      if (res.data.next) setPage(pageNumber + 1);
      else setHasNext(false);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await api.get(`/listings/?type=${ltype}&user=${global.selectedUserId}&page=1`);
      setData(res.data.results);
      setPage(2);
      setHasNext(!!res.data.next);
    } catch (err) {
      console.log(err);
    } finally {
      setRefreshing(false);
    }
  };

  const isOffering = ltype === 'O';

  const renderItem = ({ item }) => {
    const listingTitle = item?.title || '';
    const listingDate  = item?.created_at ? formatDate(item.created_at) : '';

    return (
      <Pressable
        style={styles.card}
        onPress={() => router.push({
          pathname: 'screens/listing_details',
          params: { id: item.id, category: item.category },
        })}
      >
        {/* Image / fallback */}
        <View style={styles.imageWrap}>
          {item?.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imageFallback}>
              <Text style={styles.imageFallbackText}>{listingTitle?.[0]?.toUpperCase() || 'L'}</Text>
            </View>
          )}
        </View>

        {/* Meta */}
        <View style={styles.meta}>
          {listingTitle ? (
            <Text style={styles.title} numberOfLines={2}>{listingTitle}</Text>
          ) : null}

          {item.rate ? (
            <View style={styles.rateRow}>
              <Text style={styles.currencySymbol}>ℏ</Text>
              <Text style={styles.rate}>{item.rate}</Text>
            </View>
          ) : null}

          {listingDate ? (
            <Text style={styles.date}>{listingDate}</Text>
          ) : null}
        </View>

        {/* Chevron */}
        <Icon name="chevron-right" size={18} color={Palette.textMid} style={styles.chevron} />
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        onEndReached={() => fetchData(page)}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContainer}

        ListHeaderComponent={
          <View style={styles.headerCard}>
            {/* Section label */}
            <Text style={styles.sectionLabel}>
              {isOffering ? 'OFFERINGS' : 'WANTS'}
            </Text>

            {/* Title + count */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerTitle}>
                  {isOffering ? i18n.t('offerings') : i18n.t('wants')}
                </Text>
                <Text style={styles.headerSub}>Browse the latest listings</Text>
              </View>

              {/* Total badge */}
              <View style={styles.totalBadge}>
                <Text style={styles.totalNum}>{totallistings}</Text>
                <Text style={styles.totalLabel}>total</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Type tag */}
            <View style={[styles.typeTag, isOffering ? styles.typeTagOffering : styles.typeTagWant]}>
              <Icon
                name={isOffering ? "tag-outline" : "heart-outline"}
                size={12}
                color={isOffering ? Palette.primary : '#c62828'}
              />
              <Text style={[styles.typeTagText, isOffering ? styles.typeTagOfferingText : styles.typeTagWantText]}>
                {isOffering ? 'Available to offer' : 'Looking for'}
              </Text>
            </View>
          </View>
        }

        ListEmptyComponent={!loading ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Icon
                name={isOffering ? "tag-off-outline" : "heart-off-outline"}
                size={28}
                color={Palette.textMid}
              />
            </View>
            <Text style={styles.emptyTitle}>No listings yet</Text>
            <Text style={styles.emptySub}>Check back soon or add a new one.</Text>

            {/* Tear-off */}
            <View style={styles.tearOff}>
              {Array.from({ length: 22 }).map((_, i) => <View key={i} style={styles.dash} />)}
            </View>
          </View>
        ) : null}

        ListFooterComponent={loading ? (
          <View style={styles.loader}>
            <SkeletonLoader width={300} height={72} />
            <SkeletonLoader width={300} height={72} />
          </View>
        ) : null}
      />

      {/* FAB — add new listing */}
      {global.isMe === 'yes' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push({ pathname: 'screens/new_listing', params: { ltype } })}
          activeOpacity={0.85}
        >
          <Icon name="plus" size={22} color="#fff" />
          <Text style={styles.fabLabel}>
            {isOffering ? i18n.t('newoffering') : i18n.t('newwant')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },

  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 20,
    gap: 10,
  },

  // ── Header card ───────────────────────────────────────────
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: Palette.textMid,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Palette.textDark,
    letterSpacing: -0.3,
  },

  headerSub: {
    fontSize: 12,
    color: Palette.textMid,
    marginTop: 3,
    fontWeight: '500',
  },

  totalBadge: {
    alignItems: 'center',
    backgroundColor: '#f5f6f8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  totalNum: {
    fontSize: 20,
    fontWeight: '900',
    color: Palette.textDark,
    lineHeight: 24,
  },

  totalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.textMid,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  divider: {
    height: 1,
    backgroundColor: '#e8eaed',
    marginVertical: 14,
  },

  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  typeTagOffering: { backgroundColor: Palette.primaryLight },
  typeTagWant:     { backgroundColor: '#ffebee' },

  typeTagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  typeTagOfferingText: { color: Palette.primary },
  typeTagWantText:     { color: '#c62828' },

  // ── Listing card ──────────────────────────────────────────
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  imageWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f2f5',
    flexShrink: 0,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primaryLight,
  },

  imageFallbackText: {
    fontSize: 20,
    fontWeight: '900',
    color: Palette.primary,
  },

  meta: {
    flex: 1,
    gap: 3,
  },

  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textDark,
    lineHeight: 19,
  },

  rateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },

  currencySymbol: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2e7d32',
  },

  rate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2e7d32',
  },

  date: {
    fontSize: 11,
    color: Palette.textMid,
    fontWeight: '500',
  },

  chevron: {
    flexShrink: 0,
  },

  // ── Empty state ───────────────────────────────────────────
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    gap: 8,
  },

  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f5f6f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.textDark,
  },

  emptySub: {
    fontSize: 12,
    color: Palette.textMid,
    textAlign: 'center',
  },

  tearOff: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '108%',
    marginTop: 16,
  },

  dash: {
    width: 6,
    height: 1,
    backgroundColor: '#e0e4ea',
  },

  // ── Loader ────────────────────────────────────────────────
  loader: {
    gap: 10,
    paddingTop: 4,
  },

  // ── FAB ───────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.primary,
    borderRadius: 40,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: Palette.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  fabLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
});