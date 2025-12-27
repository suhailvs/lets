import { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View, Image } from "react-native";
import { Text, List } from "react-native-paper";
import { useRouter } from "expo-router";
import SkeletonLoader from "@/components/SkeletonLoader";
import globalStyles from "@/components/Styles"; 
import api from "@/constants/api"; 
// import Toast from 'react-native-toast-message';

export default function UserList (){
  const [page, setPage] = useState(1);
  const [totalusers, setTotalUsers] = useState(0);
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
        const res = await api.get(`/users/?page=${pageNumber}`);
        if (pageNumber === 1) {
          setData(res.data.results);
        } else {
          setData(prev => [...prev, ...res.data.results]);
        }
        setTotalUsers(res.data.count);
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
      const res = await api.get(`/users/?page=1`);
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
            <Text variant="bodyMedium">{item.first_name}</Text>
            <Text variant="bodySmall" style={styles.rating}>{item.username}</Text>
          </View>
        )}
        left={() => <Image source={{ uri: item.thumbnail }} style={styles.productImage} /> }
        style={styles.listItem}
        onPress={() => router.navigate({ pathname: '/(tabs)', params:{'id':item.id, 'is_mine':'no'}})}
      />
    );

  return (
    <View style={[globalStyles.container,{paddingTop:20}]}>
      <Text>Total Users: {totalusers}</Text>
      {/* User Listing */}      
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        onEndReached={() => fetchData(page)}
        onEndReachedThreshold={0.2}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={loading ? <SkeletonLoader width={100} height={20} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 80,
  },
  listItem: {
    margin:5,
    backgroundColor: "#fff",
  },
  
  productImage: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  loader: {
    marginTop: 20,
  },
});