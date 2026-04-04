import { View, StyleSheet, ScrollView, Pressable, TouchableOpacity, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, HelperText } from 'react-native-paper';
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from '@expo/vector-icons';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { MaterialIcons } from "@expo/vector-icons";
import SkeletonLoader from '@/components/SkeletonLoader';
import api from '@/constants/api';
import { openWhatsApp } from '@/utils/openWhatsApp';
import ImagePreview from "@/components/ImagePreview";
import i18n from '@/constants/i18n';
import { useSession } from "@/login_extras/ctx";
import { Palette } from '@/constants/Colors';

const UserDetails = () => {
  const { id, is_mine } = useLocalSearchParams();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState(i18n.locale);
  const router = useRouter();
  const { signOut } = useSession();

  useEffect(() => { fetchData(); }, []);
  global.selectedUserId = id;
  global.isMe = is_mine;

  const languages = [["en", "English"], ["ml", "Malayalam"]];
  const changeLanguage = (lang) => { i18n.locale = lang; setLanguage(lang); };

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
      if (error.response) setError(JSON.stringify(error.response.data) || 'Invalid credentials');
      else if (error.request) setError('Network error. Please try again.');
      else setError('Something went wrong. Please try again.');
    } finally {
      setVerifyLoading(false);
      fetchData();
    }
  };

  const balanceValue = Number(data.balance ?? 0);
  const isPositive   = balanceValue >= 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>

      {loading ? (
        <View style={{ gap: 12, padding: 16 }}>
          <SkeletonLoader width={100} height={20} />
          <SkeletonLoader width={200} height={15} />
          <SkeletonLoader width={250} height={15} />
        </View>
      ) : (
        <View style={styles.content}>

          {/* ── Header card ─────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>MEMBER</Text>

            <View style={styles.headerRow}>
              {/* Avatar */}
              {data?.thumbnail ? (
                <Avatar.Image size={64} source={{ uri: data.thumbnail }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>{data?.first_name?.[0] || 'U'}</Text>
                </View>
              )}

              {/* Name + pills */}
              <View style={styles.headerMeta}>
                <Text style={styles.headerName}>{data.first_name || data.username || 'User'}</Text>
                <View style={styles.pillRow}>
                  <View style={styles.idPill}>
                    <Text style={styles.idPillText}>{data.username}</Text>
                  </View>
                  <View style={[styles.statusPill, data?.is_active ? styles.statusActive : styles.statusPending]}>
                    <Text style={[styles.statusText, data?.is_active ? styles.statusActiveText : styles.statusPendingText]}>
                      {data?.is_active ? 'Verified' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Logout button */}
              {global.isMe === 'yes' && (
                <Pressable style={styles.iconBtn} onPress={signOut}>
                  <MaterialIcons name="logout" size={18} color={Palette.textDark} />
                </Pressable>
              )}
            </View>

            {/* Balance row */}
            <View style={styles.divider} />
            <View style={styles.balanceRow}>
              <View style={styles.balanceLeft}>
                <Icon name="wallet-outline" size={16} color={Palette.textMid} />
                <Text style={styles.balanceLabel}>Balance</Text>
              </View>
              <Text style={[styles.balanceAmount, isPositive ? styles.balancePos : styles.balanceNeg]}>
                ℏ{balanceValue}
              </Text>
            </View>
          </View>

          {/* ── Action area ─────────────────────────────────── */}
          {!data.is_active ? (
            /* Verify button */
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonTonal]}
              onPress={handleVerifyUser}
              disabled={verifyLoading}
            >
              <Icon name="shield-check-outline" size={18} color={Palette.primary} />
              <Text style={styles.actionButtonTonalText}>
                {verifyLoading ? 'Verifying…' : 'Verify User'}
              </Text>
            </TouchableOpacity>
          ) : global.isMe === 'yes' ? (
            /* My profile actions */
            <View style={styles.actionsCard}>
              <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push({ pathname: 'screens/new_listing', params: { ltype: 'O' } })}
              >
                <View style={styles.actionIconWrap}>
                  <Icon name="tag-plus-outline" size={20} color={Palette.primary} />
                </View>
                <Text style={styles.actionRowText}>{i18n.t('newoffering')}</Text>
                <Icon name="chevron-right" size={20} color={Palette.textMid} />
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push({ pathname: 'screens/new_listing', params: { ltype: 'W' } })}
              >
                <View style={styles.actionIconWrap}>
                  <Icon name="heart-plus-outline" size={20} color={Palette.primary} />
                </View>
                <Text style={styles.actionRowText}>{i18n.t('newwant')}</Text>
                <Icon name="chevron-right" size={20} color={Palette.textMid} />
              </TouchableOpacity>

              {/* Language picker */}
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>LANGUAGE</Text>
              <View style={styles.pickerWrap}>
                <Icon name="translate" size={16} color={Palette.textMid} style={{ marginLeft: 12 }} />
                <Picker
                  selectedValue={language}
                  onValueChange={changeLanguage}
                  style={styles.picker}
                >
                  {languages.map(([val, label]) => (
                    <Picker.Item key={val} label={label} value={val} />
                  ))}
                </Picker>
              </View>
            </View>
          ) : (
            /* Pay / Receive buttons */
            <View style={styles.payRow}>
              <TouchableOpacity
                style={[styles.payBtn, styles.payBtnOutline]}
                onPress={() => router.navigate({
                  pathname: 'screens/sendmoney/amount',
                  params: { id: data.id, username: data.username, first_name: data.first_name, txn_type: 'buyer' },
                })}
              >
                <Ionicons name="send" size={16} color={Palette.primary} />
                <Text style={styles.payBtnOutlineText}>Pay</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payBtn, styles.payBtnFilled]}
                onPress={() => router.navigate({
                  pathname: 'screens/sendmoney/amount',
                  params: { id: data.id, username: data.username, first_name: data.first_name, txn_type: 'seller' },
                })}
              >
                <Ionicons name="download" size={16} color="#fff" />
                <Text style={styles.payBtnFilledText}>Receive</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Details card ─────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>DETAILS</Text>

            {/* WhatsApp */}
            <TouchableOpacity style={styles.detailRow} onPress={() => openWhatsApp(data.phone, '')}>
              <View style={[styles.detailIcon, { backgroundColor: '#e8f5e9' }]}>
                <Icon name="whatsapp" size={18} color="#2e7d32" />
              </View>
              <View style={styles.detailMeta}>
                <Text style={styles.detailLabel}>WhatsApp</Text>
                <Text style={styles.detailValue}>{data.phone || '—'}</Text>
              </View>
              <Icon name="chevron-right" size={18} color={Palette.textMid} />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            {/* Email */}
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: '#e3f2fd' }]}>
                <Icon name="email-outline" size={18} color="#1565c0" />
              </View>
              <View style={styles.detailMeta}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{data.email || '—'}</Text>
              </View>
            </View>

            {error ? (
              <HelperText type="error" style={{ marginTop: 8 }}>{error}</HelperText>
            ) : null}
          </View>

          {/* Profile image */}
          {data.image ? (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>PHOTO</Text>
              <ImagePreview imageUri={data.image} />
            </View>
          ) : null}

          {/* Tear-off footer */}
          <View style={styles.tearOff}>
            {Array.from({ length: 28 }).map((_, i) => <View key={i} style={styles.dash} />)}
          </View>
          <Text style={styles.footerNote}>LETS · Community Exchange</Text>

        </View>
      )}
    </ScrollView>
  );
};

export default UserDetails;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  container: {
    padding: 16,
    paddingBottom: 120,
    flexGrow: 1,
  },
  content: {
    gap: 16,
  },

  // ── Shared card shell ─────────────────────────────────────
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: Palette.textMid,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  divider: {
    height: 1,
    backgroundColor: '#e8eaed',
    marginVertical: 14,
  },

  rowDivider: {
    height: 1,
    backgroundColor: '#f0f2f5',
    marginVertical: 2,
  },

  // ── Header ────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  avatar: {
    backgroundColor: '#eee',
  },

  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarFallbackText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },

  headerMeta: {
    flex: 1,
    gap: 6,
  },

  headerName: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.textDark,
    lineHeight: 24,
  },

  pillRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },

  idPill: {
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },

  idPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textMid,
  },

  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },

  statusActive: { backgroundColor: '#e8f5e9' },
  statusPending: { backgroundColor: '#fff8e1' },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  statusActiveText: { color: '#2e7d32' },
  statusPendingText: { color: '#e65100' },

  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Balance ───────────────────────────────────────────────
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textMid,
  },

  balanceAmount: {
    fontSize: 26,
    fontWeight: '800',
  },

  balancePos: { color: '#2e7d32' },
  balanceNeg: { color: '#c62828' },

  // ── Pay / Receive ─────────────────────────────────────────
  payRow: {
    flexDirection: 'row',
    gap: 12,
  },

  payBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 40,
  },

  payBtnOutline: {
    borderWidth: 1.5,
    borderColor: Palette.primary,
    backgroundColor: '#fff',
  },

  payBtnFilled: {
    backgroundColor: Palette.primary,
    shadowColor: Palette.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  payBtnOutlineText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.primary,
  },

  payBtnFilledText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // ── Actions card (my profile) ─────────────────────────────
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },

  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Palette.textDark,
  },

  pickerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f6f8',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },

  picker: {
    flex: 1,
    color: Palette.textDark,
  },

  // ── Verify button ─────────────────────────────────────────
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 40,
    width: '100%',
  },

  actionButtonTonal: {
    backgroundColor: Palette.primaryLight,
  },

  actionButtonTonalText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.primary,
  },

  // ── Details rows ──────────────────────────────────────────
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },

  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailMeta: {
    flex: 1,
    gap: 2,
  },

  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Palette.textMid,
    textTransform: 'uppercase',
  },

  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textDark,
  },

  // ── Tear-off footer ───────────────────────────────────────
  tearOff: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 4,
  },

  dash: {
    width: 6,
    height: 1,
    backgroundColor: '#dde1e7',
  },

  footerNote: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#b0bec5',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
});