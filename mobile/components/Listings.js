import { useState, useEffect } from "react";
import { StyleSheet, FlatList, View, Image, Pressable } from "react-native";
import { Text, FAB } from "react-native-paper";
import { useRouter } from "expo-router";
import SkeletonLoader from "@/components/SkeletonLoader";
import api from "@/constants/api"; 
import i18n from '@/constants/i18n';
import { formatDate } from '@/utils/formatDate';
import { Palette } from "@/constants/Colors";

export default function Listings({ltype}) {
  const [page, setPage] = useState(1);
  const [totallistings, setTotalListings] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  useEffect(() => {
    fetchData(1);
  }, []);

  const fetchData = async (pageNumber = page) => {
    if (loading || refreshing || !hasNext) return;
    setLoading(true);
    try {
        const res = await api.get(`/listings/?type=${ltype}&user=${global.selectedUserId}&page=${pageNumber}`);
        if (pageNumber === 1) {
          setData(res.data.results);
        } else {
          setData(prev => [...prev, ...res.data.results]);
        }
        setTotalListings(res.data.count);
        if (res.data.next) {
          setPage(pageNumber + 1);
        } else {
          setHasNext(false);   // last page reached
        }
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
      setPage(2);                   // next page is 2
      setHasNext(!!res.data.next);  // true if next exists
    } catch (err) {
      console.log(err);
    } finally {
      setRefreshing(false);
    }
  };
  const toneByIndex = (index) => {
    const tones = [
      {
        card: Palette.tealLight,
        pillBg: Palette.tealLight,
        pillText: Palette.teal,
        tagBg: Palette.teal,
      },
      {
        card: Palette.yellowLight,
        pillBg: Palette.yellowLight,
        pillText: Palette.warningText,
        tagBg: Palette.yellow,
      },
      {
        card: Palette.purpleLight,
        pillBg: Palette.purpleLight,
        pillText: Palette.purple,
        tagBg: Palette.purple,
      },
      {
        card: Palette.greenLight,
        pillBg: Palette.greenLight,
        pillText: Palette.green,
        tagBg: Palette.green,
      },
    ];
    return tones[index % tones.length];
  };

  const renderItem = ({ item, index }) => {
    const tone = toneByIndex(index);
    const listingTitle = item?.title || '';
    const listingDate = item?.created_at ? formatDate(item.created_at) : '';
    const typeLabel = ltype === 'O' ? i18n.t('offerings') : i18n.t('wants');

    return (
      <Pressable
        style={styles.listingCard}
        onPress={() => router.push({ pathname: 'screens/listing_details', params:{'id':item.id, 'category':item.category}})}
      >
        <View style={[styles.listingImageWrap, { backgroundColor: tone.card }]}>
          {item?.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <Text style={styles.listingEmojiFallback}>{listingTitle?.[0] || 'L'}</Text>
          )}
        </View>

        <View style={styles.listingMeta}>
          {listingTitle ? (
            <Text style={styles.listingPerson} numberOfLines={2}>{listingTitle}</Text>
          ) : null}
          {listingDate ? (
            <Text style={styles.listingDate}>{listingDate}</Text>
          ) : null}
        </View>

        <View style={styles.listingRight}>
          <View style={[styles.creditPill, { backgroundColor: tone.pillBg }]}>
            <Text style={[styles.creditText, { color: tone.pillText }]}>
              {item?.rate ?? '—'}
            </Text>
          </View>
          <View style={[styles.typeTag, { backgroundColor: tone.tagBg }]}>
            <Text style={styles.typeTagText}>{item.category}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.blobLayer}>
        <View style={[styles.blob, styles.blobA]} />
        <View style={[styles.blob, styles.blobB]} />
        <View style={[styles.blob, styles.blobC]} />
      </View>

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
          <View style={styles.headerWrap}>
            <View>
              <Text style={styles.sectionTitle}>
                {ltype === 'O' ? i18n.t('offerings') : i18n.t('wants')}
              </Text>
              <Text style={styles.sectionSub}>Browse the latest listings</Text>
            </View>
            <View style={styles.totalPill}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{totallistings}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No listings yet</Text>
            <Text style={styles.emptySub}>Check back soon or add a new one.</Text>
          </View>
        ) : null}
        ListFooterComponent={loading ? (
          <View style={styles.loader}>
            <SkeletonLoader width={140} height={18} />
          </View>
        ) : null}
      />

      {/* Floating Cart Button */}
      {global.isMe=='yes' && (
        <FAB style={styles.fab} icon={'plus'} label={ltype==='O'? `${i18n.t('newoffering')}`:`${i18n.t('newwant')}`}
          onPress={() => router.push({ pathname: 'screens/new_listing', params:{'ltype':ltype} })}
        />)
      }
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
    paddingBottom: 120,
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
  listingCard: {
    backgroundColor: Palette.card,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    shadowColor: Palette.black,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  listingImageWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  listingEmojiFallback: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.textDark,
  },
  listingMeta: {
    flex: 1,
    minWidth: 0,
  },
  listingPerson: {
    fontSize: 12,
    color: Palette.textSoft,
    marginTop: 2,
  },
  listingDate: {
    fontSize: 11,
    color: Palette.textMid,
    marginTop: 4,
  },
  listingRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  creditPill: {
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  creditText: {
    fontSize: 14,
    fontWeight: '800',
  },
  typeTag: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: Palette.white,
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
  loader: {
    marginTop: 20,
    alignItems: 'center',
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: Palette.coral,
  },
});
