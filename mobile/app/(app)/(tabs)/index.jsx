import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { List, Button, Avatar, Card, HelperText, Text } from 'react-native-paper';
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from '@expo/vector-icons';
import SkeletonLoader from '@/components/SkeletonLoader';
import api from '@/constants/api';
import { openWhatsApp } from '@/utils/openWhatsApp';
import ImagePreview from "@/components/ImagePreview";
import i18n from '@/constants/i18n';
import { useSession } from "@/login_extras/ctx";
import { MaterialIcons } from "@expo/vector-icons";
import { Palette } from '@/constants/Colors';
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
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <View pointerEvents="none" style={styles.blobLayer}>
          <View style={[styles.blob, styles.blobA]} />
          <View style={[styles.blob, styles.blobB]} />
          <View style={[styles.blob, styles.blobC]} />
        </View>
        {loading ? (
          <View>
            <SkeletonLoader width={100} height={20} />
            <SkeletonLoader width={200} height={15} />
            <SkeletonLoader width={250} height={15} />
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.headerWrap}>
              <View style={styles.headerLeft}>
                {data?.thumbnail ? (
                  <Avatar.Image size={64} source={{ uri: data.thumbnail }} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>{data?.first_name?.[0] || 'U'}</Text>
                  </View>
                )}
                <View style={styles.headerMeta}>
                  <Text style={styles.headerName}>{data.first_name || data.username || 'User'}</Text>
                  <View style={styles.headerPillRow}>
                    <View style={styles.headerPill}>
                      <Text style={styles.headerPillText}>ID {data.id}</Text>
                    </View>
                    {data?.is_active ? (
                      <View style={[styles.statusPill, styles.statusActive]}>
                        <Text style={styles.statusText}>Verified</Text>
                      </View>
                    ) : (
                      <View style={[styles.statusPill, styles.statusPending]}>
                        <Text style={styles.statusText}>Pending</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              {global.isMe == 'yes' ? (
                <Pressable style={styles.iconBtn} onPress={signOut}>
                  <MaterialIcons name="logout" size={20} color={Palette.textDark} />
                </Pressable>
              ) : null}
            </View>

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
  screen: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  container: {
    padding: 16,
    paddingBottom: 120,
    flexGrow: 1,
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
    bottom: 160,
    right: -30,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.coral,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.coral,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatarFallbackText: {
    color: Palette.white,
    fontSize: 20,
    fontWeight: '800',
  },
  headerMeta: {
    flex: 1,
  },
  headerName: {
    fontSize: 22,
    fontWeight: '900',
    color: Palette.textDark,
  },
  headerPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  headerPill: {
    backgroundColor: Palette.card,
    borderRadius: 18,
    paddingVertical: 4,
    paddingHorizontal: 10,
    shadowColor: Palette.black,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  headerPillText: {
    fontSize: 11,
    color: Palette.textMid,
    fontWeight: '700',
  },
  statusPill: {
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusActive: {
    backgroundColor: Palette.greenLight,
  },
  statusPending: {
    backgroundColor: Palette.yellowLight,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textDark,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Palette.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.black,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
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
