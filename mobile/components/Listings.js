import { useState, useEffect } from "react";
import { StyleSheet, FlatList, View, Image } from "react-native";
import { Text, List, Searchbar, FAB } from "react-native-paper";
import { useRouter } from "expo-router";
import SkeletonLoader from "@/components/SkeletonLoader";
import api from "@/constants/api"; 
import globalStyles from "@/components/Styles"; 
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
  const renderItem = ({ item }) => (
    <List.Item
      title={item.category}
      description={() => (
        <View style={{flexGrow: 1}}>
          <Text variant="bodyMedium">{item.title}</Text>
          <Text variant="bodySmall" style={styles.rating}>{item.rate}</Text>
        </View>
      )}
      left={() => <Image source={{ uri: item.thumbnail }} style={styles.productImage} />}
      style={styles.listItem}
      onPress={() => router.push({ pathname: 'screens/listing_details', params:{'id':item.id, 'category':item.category}})}
    />
  );

  return (
    <View style={[globalStyles.container,{paddingTop:20}]}>
      {/* Search Bar */}
      <Text>Total Listings: {totallistings}</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        onEndReached={() => fetchData(page)}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={loading && <SkeletonLoader width={100} height={20} />}
      />

      {/* Floating Cart Button */}
      {global.isMe=='yes' && (
        <FAB style={styles.fab} icon={'plus'} label={ltype==='O'? 'New Offering':'New Want'}
          onPress={() => router.push({ pathname: 'screens/new_listing', params:{'ltype':ltype} })}
        />)
      }
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 80,
  },
  productImage: {
    width: 60,
    // height: 60,
  },
  loader: {
    marginTop: 20,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
});