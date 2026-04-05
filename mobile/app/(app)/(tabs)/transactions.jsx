import { View, FlatList, StyleSheet, Text } from "react-native";
import { useEffect, useState } from 'react';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import SkeletonLoader from "@/components/SkeletonLoader";
import api from '@/constants/api';
import { formatDate } from '@/utils/formatDate';
import i18n from '@/constants/i18n';
import { Palette } from '@/constants/Colors';

export default function TransactionScreen() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const response = await api.get(`/transactions/?user=${global.selectedUserId}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Derived totals
  const totalIn  = data.filter(t =>  t.is_received).reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = data.filter(t => !t.is_received).reduce((s, t) => s + Number(t.amount), 0);

  return (
    <View style={styles.screen}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <SkeletonLoader width="100%" height={110} />
          <SkeletonLoader width="100%" height={72} />
          <SkeletonLoader width="100%" height={72} />
          <SkeletonLoader width="100%" height={72} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}

          ListHeaderComponent={
            <>
              {/* ── Summary card ──────────────────────── */}
              <View style={styles.summaryCard}>
                <Text style={styles.sectionLabel}>TRANSACTIONS</Text>

                <View style={styles.summaryRow}>
                  <View style={styles.summaryCol}>
                    <Text style={styles.summarySubLabel}>RECEIVED</Text>
                    <View style={styles.summaryAmountRow}>
                      <Text style={styles.summaryCurrency}>ℏ</Text>
                      <Text style={[styles.summaryAmount, styles.amountIn]}>{totalIn}</Text>
                    </View>
                  </View>

                  <View style={styles.summaryDividerV} />

                  <View style={styles.summaryCol}>
                    <Text style={styles.summarySubLabel}>PAID</Text>
                    <View style={styles.summaryAmountRow}>
                      <Text style={styles.summaryCurrency}>ℏ</Text>
                      <Text style={[styles.summaryAmount, styles.amountOut]}>{totalOut}</Text>
                    </View>
                  </View>

                  <View style={styles.summaryDividerV} />

                  <View style={styles.summaryCol}>
                    <Text style={styles.summarySubLabel}>COUNT</Text>
                    <Text style={styles.summaryCount}>{data.length}</Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />
                <Text style={styles.subheadNote}>Recent activity and payouts</Text>
              </View>
            </>
          }

          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Icon name="swap-horizontal" size={28} color={Palette.textMid} />
              </View>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySub}>New activity will show up here.</Text>
              <View style={styles.tearOff}>
                {Array.from({ length: 22 }).map((_, i) => <View key={i} style={styles.dash} />)}
              </View>
            </View>
          }

          renderItem={({ item, index }) => {
            const isFirst    = index === 0;
            const isLast     = index === data.length - 1;
            const isReceived = Boolean(item.is_received);

            return (
              <View style={[
                styles.txRow,
                isFirst && styles.txRowFirst,
                isLast  && styles.txRowLast,
              ]}>
                {/* Direction icon */}
                <View style={[styles.txIconWrap, isReceived ? styles.txIconIn : styles.txIconOut]}>
                  <Icon
                    name={isReceived ? "arrow-down-left" : "arrow-up-right"}
                    size={18}
                    color={isReceived ? '#2e7d32' : Palette.primary}
                  />
                </View>

                {/* Info */}
                <View style={styles.txInfo}>
                  <Text style={styles.txName}>
                    {isReceived ? item.buyer_name : item.seller_name}
                  </Text>
                  <Text style={styles.txDirection}>
                    {isReceived ? 'Received' : 'Paid'}
                  </Text>
                  {item.description ? (
                    <Text style={styles.txDesc} numberOfLines={1}>"{item.description}"</Text>
                  ) : null}
                  <Text style={styles.txTime}>{formatDate(item.created_at)}</Text>
                </View>

                {/* Amount */}
                <View style={styles.txAmountCol}>
                  <Text style={[styles.txAmount, isReceived ? styles.amountIn : styles.amountOut]}>
                    {isReceived ? '+' : '-'}ℏ{item.amount}
                  </Text>
                </View>

                {/* Row divider (not on last) */}
                {!isLast && <View style={styles.txRowDivider} />}
              </View>
            );
          }}

          ListFooterComponent={
            data.length > 0 ? (
              <View style={styles.footer}>
                <View style={styles.tearOff}>
                  {Array.from({ length: 28 }).map((_, i) => <View key={i} style={styles.dash} />)}
                </View>
                <Text style={styles.footerNote}>LETS · Community Exchange</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },

  loadingWrap: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 10,
  },

  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120,
  },

  // ── Summary card ──────────────────────────────────────────
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    marginBottom: 12,
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
    marginBottom: 14,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  summaryCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },

  summarySubLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Palette.textMid,
    textTransform: 'uppercase',
  },

  summaryAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },

  summaryCurrency: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textMid,
  },

  summaryAmount: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  summaryCount: {
    fontSize: 22,
    fontWeight: '900',
    color: Palette.textDark,
    letterSpacing: -0.5,
  },

  summaryDividerV: {
    width: 1,
    height: 36,
    backgroundColor: '#e8eaed',
  },

  divider: {
    height: 1,
    backgroundColor: '#e8eaed',
    marginVertical: 14,
  },

  subheadNote: {
    fontSize: 12,
    color: Palette.textMid,
    fontWeight: '500',
  },

  amountIn:  { color: '#2e7d32' },
  amountOut: { color: Palette.primary },

  // ── Transaction rows — grouped in one card ────────────────
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    position: 'relative',
  },

  txRowFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  txRowLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },

  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  txIconIn:  { backgroundColor: '#e8f5e9' },
  txIconOut: { backgroundColor: Palette.primaryLight },

  txInfo: {
    flex: 1,
    gap: 2,
  },

  txName: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textDark,
  },

  txDirection: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  txDesc: {
    fontSize: 11,
    color: Palette.textMid,
    fontStyle: 'italic',
  },

  txTime: {
    fontSize: 11,
    color: Palette.textMid,
  },

  txAmountCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },

  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },

  txRowDivider: {
    position: 'absolute',
    bottom: 0,
    left: 70,
    right: 16,
    height: 1,
    backgroundColor: '#f0f2f5',
  },

  // ── Empty state ───────────────────────────────────────────
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
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

  // ── Footer ────────────────────────────────────────────────
  footer: {
    marginTop: 16,
    alignItems: 'center',
    gap: 10,
  },

  tearOff: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },

  dash: {
    width: 6,
    height: 1,
    backgroundColor: '#e0e4ea',
  },

  footerNote: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#b0bec5',
    textTransform: 'uppercase',
  },
});