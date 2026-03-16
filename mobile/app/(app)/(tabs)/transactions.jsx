import { View, FlatList, StyleSheet } from "react-native";
import { Text} from "react-native-paper";
import { useEffect, useState } from 'react';
import SkeletonLoader from "@/components/SkeletonLoader";
import api from '@/constants/api'
import { formatDate } from '@/utils/formatDate';
import i18n from '@/constants/i18n';
import { Palette } from '@/constants/Colors';
export default function TransactionScreen (){
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
      fetchData();
  }, []);

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
  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.blobLayer}>
        <View style={[styles.blob, styles.blobA]} />
        <View style={[styles.blob, styles.blobB]} />
        <View style={[styles.blob, styles.blobC]} />
      </View>
      {loading ? (
        <View style={styles.loadingWrap}>
          <SkeletonLoader width={100} height={20} />
          <SkeletonLoader width={200} height={15} />
          <SkeletonLoader width={250} height={15} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <View style={styles.headerWrap}>
              <View>
                <Text style={styles.sectionTitle}>{i18n.t('transactions')}</Text>
                <Text style={styles.sectionSub}>Recent activity and payouts</Text>
              </View>
              <View style={styles.totalPill}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{data.length}</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySub}>New activity will show up here.</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isLast = index === data.length - 1;
            const isReceived = Boolean(item.is_received);
            return (
              <View style={[styles.activityRow, isLast && styles.activityRowLast]}>
                <View style={[
                  styles.actDot,
                  isReceived ? styles.actDotIn : styles.actDotOut
                ]} />
                <View style={styles.actInfo}>
                  <Text style={styles.actName}>
                    {isReceived ? `Received from ${item.buyer_name}` : `Paid to ${item.seller_name}`}
                  </Text>
                  {item.description ? (
                    <Text style={styles.actDesc}>{item.description}</Text>
                  ) : null}
                  <Text style={styles.actTime}>{formatDate(item.created_at)}</Text>
                </View>
                <Text style={[styles.actAmount, isReceived ? styles.amountIn : styles.amountOut]}>
                  ₹{isReceived ? '+' : '-'}{item.amount}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  blobLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.55,
  },
  blobA: {
    width: 220,
    height: 220,
    backgroundColor: Palette.blob1,
    top: -80,
    right: -60,
  },
  blobB: {
    width: 160,
    height: 160,
    backgroundColor: Palette.blob2,
    top: 340,
    left: -50,
  },
  blobC: {
    width: 120,
    height: 120,
    backgroundColor: Palette.blob3,
    bottom: 180,
    right: -30,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 120,
  },
  loadingWrap: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Palette.textDark,
  },
  sectionSub: {
    fontSize: 12,
    color: Palette.textMid,
    marginTop: 4,
  },
  totalPill: {
    backgroundColor: Palette.card,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: Palette.black,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  totalLabel: {
    fontSize: 10,
    color: Palette.textSoft,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Palette.textDark,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Palette.card,
    borderRadius: 18,
    marginBottom: 10,
    shadowColor: Palette.black,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  activityRowLast: {
    marginBottom: 0,
  },
  actDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  actDotIn: {
    backgroundColor: Palette.green,
    shadowColor: Palette.green,
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  actDotOut: {
    backgroundColor: Palette.coral,
    shadowColor: Palette.coral,
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  actInfo: {
    flex: 1,
  },
  actName: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textDark,
  },
  actDesc: {
    fontSize: 11,
    color: Palette.textSoft,
    marginTop: 2,
  },
  actTime: {
    fontSize: 11,
    color: Palette.textSoft,
    marginTop: 2,
  },
  actAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  amountIn: {
    color: Palette.green,
  },
  amountOut: {
    color: Palette.coral,
  },
  emptyState: {
    backgroundColor: Palette.card,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Palette.black,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.textDark,
  },
  emptySub: {
    fontSize: 12,
    color: Palette.textMid,
    marginTop: 6,
  },
});
