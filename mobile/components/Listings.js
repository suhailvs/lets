import { useState, useEffect } from "react";
import { StyleSheet, FlatList, View, Image, SafeAreaView } from "react-native";
import { Text, List, Searchbar, FAB } from "react-native-paper";
import { useRouter } from "expo-router";
import SkeletonLoader from "@/components/SkeletonLoader";
import api from "@/constants/api"; 

export default function Listings({ltype}) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    try {
        const response = await api.get(`/listings/?type=${ltype}&page=${page}&user=${global.selectedUserId}`);
        setData(response.data);
    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        setLoading(false);
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
    <View style={styles.container}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search"
        style={styles.searchBar}
        icon="magnify"
      />

      {/* Product Listing */}
      {loading && <View>
          <SkeletonLoader width={100} height={20} />
          <SkeletonLoader width={200} height={15} />
          <SkeletonLoader width={250} height={15} />
        </View>}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        onEndReached={() => setPage(page + 1)}
        onEndReachedThreshold={0.5}
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
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  searchBar: {
    margin: 10,
    borderRadius: 10,
  },
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