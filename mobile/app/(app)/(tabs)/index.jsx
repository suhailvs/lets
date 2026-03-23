import { View, StyleSheet, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { List, Button, Avatar, Card, HelperText, Text } from 'react-native-paper';
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from '@expo/vector-icons';
import SkeletonLoader from '@/components/SkeletonLoader';
import api from '@/constants/api';
import { formatDate } from '@/utils/formatDate';
import { openWhatsApp } from '@/utils/openWhatsApp';
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
  const [language, setLanguage] = useState(i18n.locale);
  const router = useRouter();
  const { signOut } = useSession();
  useEffect(() => {
    fetchData();
  }, []);
  global.selectedUserId = id;
  global.isMe = is_mine;

  const languages = [["en","English"],["ml","Malayalam"]];
  const changeLanguage = (lang) => {
    i18n.locale = lang;      // change i18n language
    setLanguage(lang);       // trigger React re-render
  };
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
  
  const balanceValue = Number(data.balance ?? 0);

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
                mode="contained-tonal"
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
                <Button mode="contained-tonal" icon={({ size }) => (<MaterialIcons name="logout" size={size} color="black" />)} onPress={signOut}>
                  Logout</Button>
                <Button mode="contained-tonal" icon={'plus'} onPress={() => router.push({ pathname: 'screens/new_listing', params:{'ltype':'O'} })}
                  style={{marginTop: 15}}>{i18n.t('newoffering')}</Button>
                <Button mode="contained-tonal" icon={'plus'} onPress={() => router.push({ pathname: 'screens/new_listing', params:{'ltype':'W'} })} 
                  style={{marginTop: 15}}>{i18n.t('newwant')}</Button>
                <Text>Select Language:</Text>
                <Picker selectedValue={language} onValueChange={(value) => changeLanguage(value)} >
                  {languages.map((item) => (
                    <Picker.Item key={item[0]} label={item[1]} value={item[0]} />
                  ))}
                </Picker>
                </>
              ):(
                <Card>
                  <Card.Actions>
                    <Button mode="contained-tonal" icon={({ size, color }) => (<Ionicons name="send" size={size} color={color} />)}
                      onPress={() => router.navigate({ pathname: 'screens/sendmoney/amount', params: { id: data.id, username: data.username, first_name: data.first_name, txn_type: 'buyer' } })}
                    > Send</Button>
                    <Button mode="contained-tonal"
                      icon={({ size, color }) => (<Ionicons name="download" size={size} color={color} />)}
                      onPress={() => router.navigate({ pathname: 'screens/sendmoney/amount', params: { id: data.id, username: data.username, first_name: data.first_name, txn_type: 'seller' } })}
                    > Receive</Button>
                  </Card.Actions>
                </Card>
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
                  onPress={() => openWhatsApp(data.phone,'')}
                />
                <List.Item
                  title="Email"
                  description={data.email || '-'}
                  left={(props) => <List.Icon {...props} icon="email" />}
                />
                <List.Item
                  title="Balance"
                  description={`${balanceValue} KC`}
                  left={(props) => <List.Icon {...props} icon="wallet" />}
                  style={styles.balanceItem}
                  titleStyle={styles.balanceTitle}
                  descriptionStyle={[
                    styles.balanceValue,
                    balanceValue < 0 ? styles.balanceNegative : styles.balancePositive,
                  ]}
                />
                {/* 
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
  balanceItem: {
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#e8f4ff',
  },
  balanceTitle: {
    fontWeight: '700',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  balancePositive: {
    color: '#0b5a2b',
  },
  balanceNegative: {
    color: '#b00020',
  },
});
