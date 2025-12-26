
import { View,  StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Avatar, Text, Card, Button, Searchbar  } from 'react-native-paper';
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { MaterialIcons } from "@expo/vector-icons";

import api from '@/constants/api'
import { useSession } from "@/login_extras/ctx";
import SkeletonLoader from "@/components/SkeletonLoader";

export default function Index() {
  const [balance, setBalance] = useState(null);
  const [authuser, setAuthUser] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchBalance();
    getAuthUser();
    fetchUsers();
  }, []);
  const fetchUsers = async () => {
    try {
        const response = await api.get('/users/');
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
  const filteredContacts = users.filter(contact =>
    contact.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.username.includes(searchQuery)
  );
  const { signOut } = useSession();
  const handleShowUser = (userid,is_mine='no') => {
    router.navigate({ pathname: '/(tabs)', params: { id: userid, is_mine}});
  };
  return (
    <ScrollView>
      <View style={styles.header}>
        <Text variant="labelLarge" style={styles.headerText}>Hi {authuser.firstname}, welcome to {authuser.exchange_name} exchange.</Text>
        <Text variant="headlineSmall" style={styles.headerText}>Your Balance:</Text>
        
        <View style={{flexDirection: "row"}}>
          <Text variant="displayLarge" style={styles.headerText}>{balance != null ? `${balance}`:'****'}</Text>        
          <TouchableOpacity onPress={fetchBalance}>
            <MaterialIcons name="refresh" size={55} style={[styles.headerText,styles.headerIcon]} />
          </TouchableOpacity>       
        </View>
      </View>
      <View style={styles.container}>
        <Card>
          <Card.Actions>
            <Button onPress={signOut}>Logout</Button>
            <Button onPress={() => handleShowUser(authuser.user_id, 'yes')}>My Account</Button>
          </Card.Actions>
        </Card>
        <Text variant="headlineSmall" style={{marginTop:20}}>People</Text>
        <Searchbar placeholder="Search by name/phonenumber" onChangeText={setSearchQuery} value={searchQuery}/>
        
        {loading ? (
          <View>
            <SkeletonLoader width={100} height={20} />
            <SkeletonLoader width={200} height={15} />
            <SkeletonLoader width={250} height={15} />
          </View>
        ) : (
          <View style={styles.peopleRow}>
            {filteredContacts.map((user, i) => (
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
