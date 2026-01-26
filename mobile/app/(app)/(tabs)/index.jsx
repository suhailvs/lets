import { View, StyleSheet, ScrollView,Linking } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { List, Button, Avatar, Card, HelperText, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import SkeletonLoader from '@/components/SkeletonLoader';
import api from '@/constants/api';
import { formatDate } from '@/utils/formatDate';
import ImagePreview from "@/components/ImagePreview";
import i18n from '@/constants/i18n';
import { useSession } from "@/login_extras/ctx";
import { MaterialIcons } from "@expo/vector-icons";
const UserDetails = () => {
  const { id,is_mine } = useLocalSearchParams();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { signOut } = useSession();
  useEffect(() => {
    fetchData();
  }, []);
  global.selectedUserId = id;
  global.isMe = is_mine;
  const fetchData = async () => {
    try {
      const response = await api.get(`/users/${id}/`);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async () => {
    setError('');
    setVerifyLoading(true);
    try {
      await api.post('/verifyuser/', { candidate_id: data.id });      
    } catch (error) {
      if (error.response) {
        setError(JSON.stringify(error.response.data) || 'Invalid credentials');
      } else if (error.request) {
        setError('Network error. Please try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {      
      setVerifyLoading(false);
      fetchData();
    }
  };
  
  const openWhatsApp = () => {
    const message = 'Hello from LETS app';
    const url = `whatsapp://send?phone=${data.phone}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      alert('WhatsApp is not installed');
    });
  };
  return (
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <View>
            <SkeletonLoader width={100} height={20} />
            <SkeletonLoader width={200} height={15} />
            <SkeletonLoader width={250} height={15} />
          </View>
        ) : (
          <View>
            <Text variant="headlineSmall">{data.first_name}</Text>
            {!data.is_active ? (
              <Button
                mode="contained"
                onPress={handleVerifyUser}
                loading={verifyLoading}
                disabled={verifyLoading}
              >
                {verifyLoading ? 'Verifying...' : 'Verify User'}
              </Button>
            ):(
              <>
              {global.isMe=='yes' ? (
                <>
                <Button mode="contained" icon={({ size }) => (<MaterialIcons name="logout" size={size} color="white" />)} onPress={signOut}>
                  Logout</Button>
                <Button mode="contained" icon={'plus'} onPress={() => router.push({ pathname: 'screens/new_listing', params:{'ltype':'O'} })}
                  style={{marginTop: 15}}>{i18n.t('newoffering')}</Button>
                <Button mode="contained" icon={'plus'} onPress={() => router.push({ pathname: 'screens/new_listing', params:{'ltype':'W'} })} 
                  style={{marginTop: 15}}>{i18n.t('newwant')}</Button>
                </>
              ):(
                <Button
                  mode="contained-tonal"
                  icon={({ size, color }) => (
                    <Ionicons name="send" size={size} color={color} />
                  )}
                  onPress={() => router.navigate({ pathname: 'screens/sendmoney/amount', params: { id: data.id, username: data.username, first_name: data.first_name } })}
                >
                  Send Money
                </Button>
              )}
              </>
            )}
          
            <Card mode="outlined" style={styles.card}>
              
              <Card.Title
                title={data.username || 'User'}
                subtitle={`ID: ${data.id}`}
                left={(props) => <Avatar.Image size={50} source={{ uri: data.thumbnail }} />}
              />
              <Card.Content>
                
                <List.Item
                  title="Whatsapp"
                  description={data.phone || '-'}
                  left={(props) => <List.Icon {...props} icon="whatsapp" />}
                  onPress={openWhatsApp}
                />
                <List.Item
                  title="Email"
                  description={data.email || '-'}
                  left={(props) => <List.Icon {...props} icon="email" />}
                />
                <List.Item
                  title="Balance"
                  description={`₹${data.balance ?? 0}`}
                  left={(props) => <List.Icon {...props} icon="wallet" />}
                />
                {/* <List.Item
                  title="Date of Birth"
                  description={data.date_of_birth || '-'}
                  left={(props) => <List.Icon {...props} icon="calendar" />}
                />
                <List.Item
                  title="Last Login"
                  description={formatDate(data.last_login) || '-'}
                  left={(props) => <List.Icon {...props} icon="clock" />}
                />*/}
                {error ? <HelperText type="error">{error}</HelperText> : null}
                <ImagePreview imageUri={data.image}/>
              </Card.Content>
            </Card>
          </View>
        )}
      </ScrollView>
  );
};

export default UserDetails;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f6f6f6',
    flexGrow: 1,
  },
  card: {
    marginTop: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
});