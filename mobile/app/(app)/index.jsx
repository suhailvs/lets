// Home page with user balance, logout button and some userlisting
import { View,  StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Avatar, Text, Card, Button  } from 'react-native-paper';
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { MaterialIcons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import api from '@/constants/api'

import SkeletonLoader from "@/components/SkeletonLoader";

export default function Index() {
  const [balance, setBalance] = useState(null);
  const [authuser, setAuthUser] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchBalance();
    getAuthUser();
    fetchUsers();
  }, []);
  const fetchUsers = async () => {
    try {
        const response = await api.get('/exchangeusers/');
        setUsers(response.data);
    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        setLoading(false);
    }
  };
  const getAuthUser = async () => {
    try {
      const jsonValue = await SecureStore.getItemAsync('user_data');
      setAuthUser(JSON.parse(jsonValue));
    } catch (e) {
      setAuthUser({});
    }
  };
  const fetchBalance = async () => {    
    try {
        const response = await api.get('/ajax/?purpose=userbalance');
        setBalance(response.data['data']);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
  };
  
  const handleShowUser = (userid,is_mine='no') => {
    router.navigate({ pathname: '/(tabs)', params: { id: userid, is_mine}});
  };
  return (
    <ScrollView>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerText}>{authuser.firstname}({authuser.exchange_name})</Text>
        <View style={{flexDirection: "row"}}>
          <Text variant="displayLarge" style={styles.headerText}>{balance != null ? `₹${balance}`:'****'}</Text>        
          <TouchableOpacity onPress={fetchBalance}>
            <MaterialIcons name="refresh" size={55} style={[styles.headerText,styles.headerIcon]} />
          </TouchableOpacity>       
        </View>
      </View>
      <View style={styles.container}>
        <Card>
          <Card.Actions>
            {/* <Button icon={({ size }) => (<FontAwesome6 name="list-alt" size={size} color="white" />)}
               mode="contained" onPress={() => router.push({ pathname: 'screens/all_listings'})}>All Listings</Button>
            <Button icon={({ size }) => (<FontAwesome6 name="users" size={size} color="white" />)}
               mode="contained" onPress={() => router.push({ pathname: 'screens/users'})}>All Users</Button> */}
            <Button icon={({ size }) => (<FontAwesome6 name="user" size={size} color="white" />)} mode="contained"
              onPress={() => handleShowUser(authuser.user_id, 'yes')}>My Account</Button>
                        
          </Card.Actions>
        </Card>
        <Text variant="headlineSmall" style={{marginTop:20}}>People</Text>
        
        {loading ? (
          <View>
            <SkeletonLoader width={100} height={20} />
            <SkeletonLoader width={200} height={15} />
            <SkeletonLoader width={250} height={15} />
          </View>
        ) : (
          <View style={styles.peopleRow}>
            {users.map((user, i) => (
              <View style={styles.person} key={i}>
                <TouchableOpacity onPress={() => handleShowUser(user.id)}>
                <Avatar.Image size={60} source={{ uri: user.thumbnail }} />
                <Text variant="bodyMedium" style={[styles.personText, !user.is_active && styles.in_active]}>{user.first_name}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          )}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  header: { backgroundColor: "#007C8A",paddingBottom: 30, paddingTop:80, paddingHorizontal: 10,position: "relative" },
  headerText: {color: "#99C9CE"},
  headerIcon: { padding: 5 },
  container: { flex: 1, backgroundColor:"#fff", padding:10, paddingBottom:100 },
  peopleRow: { flexDirection: 'row', flexWrap: 'wrap' },
  person: { width: 70, alignItems: 'center', margin: 10 },
  personText: {textAlign: 'center'},
  in_active:{ color: "red" },
});
