import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, HelperText, Text } from 'react-native-paper';
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
              <Pressable
                style={styles.verifyCard}
                onPress={handleVerifyUser}
                disabled={verifyLoading}
              >
                <View style={styles.verifyIconWrap}>
                  <MaterialIcons name="verified" size={20} color={Palette.coral} />
                </View>
                <View style={styles.verifyText}>
                  <Text style={styles.verifyTitle}>
                    {verifyLoading ? 'Verifying...' : 'Verify User'}
                  </Text>
                  <Text style={styles.verifySub}>Confirm profile and enable transfers</Text>
                </View>
              </Pressable>
            ):(
              <>
              {global.isMe=='yes' ? (
                <>
                <View style={styles.quickActions}>
                  <Pressable style={[styles.qaBtn, styles.qaPrimary]} onPress={() => router.push({ pathname: 'screens/new_listing', params:{'ltype':'O'} })}>
                    <View style={[styles.qaIcon, styles.qaIconTeal]}>
                      <MaterialIcons name="add-circle" size={18} color={Palette.teal} />
                    </View>
                    <View>
                      <Text style={styles.qaTitle}>{i18n.t('newoffering')}</Text>
                      <Text style={styles.qaSub}>Share something to offer</Text>
                    </View>
                  </Pressable>
                  <Pressable style={styles.qaBtn} onPress={() => router.push({ pathname: 'screens/new_listing', params:{'ltype':'W'} })}>
                    <View style={[styles.qaIcon, styles.qaIconYellow]}>
                      <MaterialIcons name="add-shopping-cart" size={18} color={Palette.warningText} />
                    </View>
                    <View>
                      <Text style={styles.qaTitle}>{i18n.t('newwant')}</Text>
                      <Text style={styles.qaSub}>Request something you need</Text>
                    </View>
                  </Pressable>
                </View>

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Language</Text>
                  <Text style={styles.sectionLink}>{languages.find((lang) => lang[0] === language)?.[1]}</Text>
                </View>
                <View style={styles.pickerWrap}>
                  <Picker selectedValue={language} onValueChange={(value) => changeLanguage(value)} >
                    {languages.map((item) => (
                      <Picker.Item key={item[0]} label={item[1]} value={item[0]} />
                    ))}
                  </Picker>
                </View>
                </>
              ):(
                <View style={styles.quickActions}>
                  <Pressable
                    style={[styles.qaBtn, styles.qaPrimary]}
                    onPress={() => router.navigate({ pathname: 'screens/sendmoney/amount', params: { id: data.id, username: data.username, first_name: data.first_name, txn_type: 'buyer' } })}
                  >
                    <View style={[styles.qaIcon, styles.qaIconTeal]}>
                      <Ionicons name="send" size={18} color={Palette.teal} />
                    </View>
                    <View>
                      <Text style={styles.qaTitle}>Send</Text>
                      <Text style={styles.qaSub}>Transfer credits</Text>
                    </View>
                  </Pressable>
                  <Pressable
                    style={styles.qaBtn}
                    onPress={() => router.navigate({ pathname: 'screens/sendmoney/amount', params: { id: data.id, username: data.username, first_name: data.first_name, txn_type: 'seller' } })}
                  >
                    <View style={[styles.qaIcon, styles.qaIconYellow]}>
                      <Ionicons name="download" size={18} color={Palette.warningText} />
                    </View>
                    <View>
                      <Text style={styles.qaTitle}>Receive</Text>
                      <Text style={styles.qaSub}>Request credits</Text>
                    </View>
                  </Pressable>
                </View>
              )}
              </>
            )}
          
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Profile details</Text>
              <Text style={styles.sectionLink}>Overview</Text>
            </View>

            <View style={styles.detailCard}>
              <Pressable style={styles.detailRow} onPress={() => openWhatsApp(data.phone,'')}>
                <View style={[styles.detailIcon, styles.detailIconTeal]}>
                  <Ionicons name="logo-whatsapp" size={16} color={Palette.teal} />
                </View>
                <View style={styles.detailMeta}>
                  <Text style={styles.detailLabel}>Whatsapp</Text>
                  <Text style={styles.detailValue}>{data.phone || '-'}</Text>
                </View>
              </Pressable>

              <View style={styles.detailRow}>
                <View style={[styles.detailIcon, styles.detailIconPurple]}>
                  <MaterialIcons name="email" size={16} color={Palette.purple} />
                </View>
                <View style={styles.detailMeta}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{data.email || '-'}</Text>
                </View>
              </View>

              <View style={[styles.detailRow, styles.detailRowLast]}>
                <View style={[styles.detailIcon, styles.detailIconGreen]}>
                  <MaterialIcons name="account-balance-wallet" size={16} color={Palette.green} />
                </View>
                <View style={styles.detailMeta}>
                  <Text style={styles.detailLabel}>Balance</Text>
                  <Text style={styles.detailValue}>{`₹${data.balance ?? 0}`}</Text>
                </View>
              </View>
            </View>

            {error ? <HelperText type="error">{error}</HelperText> : null}
            <View style={styles.previewWrap}>
              <ImagePreview imageUri={data.image}/>
            </View>
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
  verifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Palette.card,
    shadowColor: Palette.black,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 18,
  },
  verifyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Palette.coralLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyText: {
    flex: 1,
  },
  verifyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.textDark,
  },
  verifySub: {
    fontSize: 12,
    color: Palette.textMid,
    marginTop: 3,
  },
  quickActions: {
    gap: 10,
    marginBottom: 18,
  },
  qaBtn: {
    backgroundColor: Palette.card,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: Palette.black,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  qaPrimary: {
    borderWidth: 1,
    borderColor: Palette.coralLight,
  },
  qaIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaIconTeal: {
    backgroundColor: Palette.tealLight,
  },
  qaIconYellow: {
    backgroundColor: Palette.yellowLight,
  },
  qaTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.textDark,
  },
  qaSub: {
    fontSize: 11,
    color: Palette.textSoft,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Palette.textDark,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.coral,
  },
  pickerWrap: {
    backgroundColor: Palette.card,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: Palette.black,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  detailCard: {
    backgroundColor: Palette.card,
    borderRadius: 22,
    paddingVertical: 6,
    marginBottom: 18,
    shadowColor: Palette.black,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF8',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailIconTeal: {
    backgroundColor: Palette.tealLight,
  },
  detailIconPurple: {
    backgroundColor: Palette.purpleLight,
  },
  detailIconGreen: {
    backgroundColor: Palette.greenLight,
  },
  detailMeta: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: Palette.textSoft,
    fontWeight: '700',
  },
  detailValue: {
    fontSize: 14,
    color: Palette.textDark,
    fontWeight: '700',
    marginTop: 2,
  },
  previewWrap: {
    backgroundColor: Palette.card,
    borderRadius: 18,
    padding: 12,
    shadowColor: Palette.black,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
});
