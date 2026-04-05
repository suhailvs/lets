import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { MaterialIcons } from "@expo/vector-icons";
import * as SecureStore from 'expo-secure-store';
import { openWhatsApp } from '@/utils/openWhatsApp';
import SkeletonLoader from "@/components/SkeletonLoader";
import ImagePreview from "@/components/ImagePreview";
import api from '@/constants/api';
import Markdown from 'react-native-markdown-display';
import { Palette } from '@/constants/Colors';

const OfferingDetailPage = () => {
  const [offering, setOffering] = useState({});
  const [userdata, setUserData] = useState({});
  const [loading, setLoading]   = useState(true);

  const { id } = useLocalSearchParams();
  const router  = useRouter();

  useEffect(() => { fetchData(); getUser(); }, []);

  const fetchData = async () => {
    try {
      const response = await api.get(`/listings/${id}/`);
      setOffering(response.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getUser = async () => {
    try {
      const jsonValue = await SecureStore.getItemAsync('user_data');
      setUserData(JSON.parse(jsonValue));
    } catch (e) { setUserData({}); }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric", month: "long", day: "2-digit",
    }).format(new Date(dateString));
  };

  const handleShowUser = (userid) =>
    router.navigate({ pathname: '/(tabs)', params: { id: userid, is_mine: 'no' } });

  const handleDelete = async () => {
    try {
      await api.delete(`/listings/${offering.id}/`);
      router.replace("/");
    } catch (e) { console.error(e); }
  };

  const handleActivateListing = async (is_active) => {
    try {
      await api.patch(`/listings/${offering.id}/`, { is_active },
        { headers: { 'Content-Type': 'application/json' } });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const isOwner    = offering?.user?.id == userdata?.user_id;
  const isPositive = Number(offering?.user?.balance ?? 0) >= 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>

      {loading ? (
        <View style={{ gap: 12 }}>
          <SkeletonLoader width="100%" height={120} />
          <SkeletonLoader width="100%" height={80} />
          <SkeletonLoader width="100%" height={80} />
        </View>
      ) : (
        <View style={styles.content}>

          {/* ── Title card ─────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>
              {offering.listing_type === 'O' ? 'OFFERING' : 'WANT'}
            </Text>

            <Text style={styles.title}>{offering.title}</Text>

            {/* Rate */}
            <View style={styles.rateRow}>
              <Text style={styles.rateCurrency}>ℏ</Text>
              <Text style={styles.rateAmount}>{offering.rate}</Text>
            </View>

            <View style={styles.divider} />

            {/* Date */}
            <View style={styles.metaRow}>
              <View style={styles.metaIconWrap}>
                <Icon name="calendar-outline" size={15} color={Palette.primary} />
              </View>
              <Text style={styles.metaText}>Added {formatDate(offering.created_at)}</Text>
            </View>

            {/* Active status badge */}
            <View style={[styles.statusBadge, offering.is_active ? styles.statusActive : styles.statusInactive]}>
              <Icon
                name={offering.is_active ? "check-circle-outline" : "close-circle-outline"}
                size={13}
                color={offering.is_active ? '#2e7d32' : '#c62828'}
              />
              <Text style={[styles.statusText, offering.is_active ? styles.statusActiveText : styles.statusInactiveText]}>
                {offering.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {/* ── Image ──────────────────────────────────── */}
          {offering.image && (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>PHOTO</Text>
              <ImagePreview imageUri={offering.image} />
            </View>
          )}

          {/* ── Description ────────────────────────────── */}
          {offering.description ? (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>DESCRIPTION</Text>
              <Markdown style={markdownStyles}>{offering.description}</Markdown>
            </View>
          ) : null}

          {/* ── Advertiser card ────────────────────────── */}
          {offering.user && (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>ADVERTISER</Text>

              {/* Name + balance */}
              <View style={styles.advertiserRow}>
                <View style={styles.advertiserAvatar}>
                  <Text style={styles.advertiserAvatarText}>
                    {offering.user.first_name?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.advertiserMeta}>
                  <Text style={styles.advertiserName}>{offering.user.first_name}</Text>
                  <Text style={[styles.advertiserBalance, isPositive ? styles.balancePos : styles.balanceNeg]}>
                    ℏ{offering.user.balance}
                  </Text>
                </View>
                <View style={styles.lastLoginWrap}>
                  <Text style={styles.lastLoginLabel}>Last login</Text>
                  <Text style={styles.lastLoginDate}>{formatDate(offering.user.last_login)}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Contact row */}
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${offering.user.phone}`)}
                activeOpacity={0.8}
              >
                <View style={[styles.metaIconWrap, { backgroundColor: '#e8f5e9' }]}>
                  <Icon name="phone-outline" size={15} color="#2e7d32" />
                </View>
                <Text style={styles.contactPhone}>{offering.user.phone}</Text>
                <Icon name="chevron-right" size={18} color={Palette.textMid} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Actions ────────────────────────────────── */}
          {isOwner ? (
            <View style={styles.actionsCard}>
              <Text style={styles.sectionLabel}>MANAGE LISTING</Text>

              <TouchableOpacity
                style={[styles.actionRow, { borderBottomWidth: 1, borderColor: '#f0f2f5', paddingBottom: 14 }]}
                onPress={() => handleActivateListing(!offering.is_active)}
              >
                <View style={[styles.metaIconWrap, { backgroundColor: offering.is_active ? '#fff8e1' : '#e8f5e9' }]}>
                  <Icon
                    name={offering.is_active ? "pause-circle-outline" : "play-circle-outline"}
                    size={18}
                    color={offering.is_active ? '#e65100' : '#2e7d32'}
                  />
                </View>
                <Text style={styles.actionRowText}>
                  {offering.is_active ? 'Deactivate Listing' : 'Activate Listing'}
                </Text>
                <Icon name="chevron-right" size={18} color={Palette.textMid} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionRow, { paddingTop: 14 }]}
                onPress={handleDelete}
              >
                <View style={[styles.metaIconWrap, { backgroundColor: '#ffebee' }]}>
                  <Icon name="trash-can-outline" size={18} color="#c62828" />
                </View>
                <Text style={[styles.actionRowText, { color: '#c62828' }]}>Delete Listing</Text>
                <Icon name="chevron-right" size={18} color="#c62828" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.buyActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary]}
                onPress={() => openWhatsApp(offering.user?.phone, `I am interested in your advertisement ${offering.title}.`)}
              >
                <Icon name="whatsapp" size={18} color="#fff" />
                <Text style={styles.actionBtnPrimaryText}>WhatsApp Seller</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnOutline]}
                onPress={() => handleShowUser(offering.user?.id)}
              >
                <Icon name="account-outline" size={18} color={Palette.primary} />
                <Text style={styles.actionBtnOutlineText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tear-off + footer */}
          <View style={styles.tearOff}>
            {Array.from({ length: 28 }).map((_, i) => <View key={i} style={styles.dash} />)}
          </View>
          <Text style={styles.footerNote}>LETS · Community Exchange</Text>

        </View>
      )}
    </ScrollView>
  );
};

export default OfferingDetailPage;

// ── Markdown styles ───────────────────────────────────────────
const markdownStyles = {
  body:      { fontSize: 14, color: '#37474f', lineHeight: 22 },
  heading1:  { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  heading2:  { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  paragraph: { marginBottom: 8 },
  code_inline: {
    backgroundColor: '#f5f6f8',
    borderRadius: 4,
    paddingHorizontal: 4,
    fontFamily: 'monospace',
    fontSize: 13,
  },
};

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  container: {
    padding: 16,
    paddingBottom: 60,
  },
  content: {
    gap: 14,
  },

  // ── Card shell ────────────────────────────────────────────
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
    marginBottom: 12,
  },

  divider: {
    height: 1,
    backgroundColor: '#e8eaed',
    marginVertical: 14,
  },

  // ── Title card ────────────────────────────────────────────
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Palette.textDark,
    letterSpacing: -0.3,
    lineHeight: 28,
    marginBottom: 10,
  },

  rateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 4,
  },

  rateCurrency: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2e7d32',
  },

  rateAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2e7d32',
    letterSpacing: -1,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },

  metaIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  metaText: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textMid,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusActive:   { backgroundColor: '#e8f5e9' },
  statusInactive: { backgroundColor: '#ffebee' },

  statusText:         { fontSize: 11, fontWeight: '700' },
  statusActiveText:   { color: '#2e7d32' },
  statusInactiveText: { color: '#c62828' },

  // ── Advertiser ────────────────────────────────────────────
  advertiserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  advertiserAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  advertiserAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },

  advertiserMeta: {
    flex: 1,
    gap: 3,
  },

  advertiserName: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.textDark,
  },

  advertiserBalance: {
    fontSize: 14,
    fontWeight: '700',
  },

  balancePos: { color: '#2e7d32' },
  balanceNeg: { color: '#c62828' },

  lastLoginWrap: {
    alignItems: 'flex-end',
  },

  lastLoginLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: Palette.textMid,
    textTransform: 'uppercase',
  },

  lastLoginDate: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textDark,
    marginTop: 2,
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  contactPhone: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textDark,
  },

  // ── Owner actions card ─────────────────────────────────────
  actionsCard: {
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

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  actionRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textDark,
  },

  // ── Buyer actions ─────────────────────────────────────────
  buyActions: {
    gap: 10,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: 40,
  },

  actionBtnPrimary: {
    backgroundColor: '#25d366',
    shadowColor: '#25d366',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  actionBtnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  actionBtnOutline: {
    borderWidth: 1.5,
    borderColor: Palette.primary,
    backgroundColor: '#fff',
  },

  actionBtnOutlineText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.primary,
  },

  // ── Tear-off footer ───────────────────────────────────────
  tearOff: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 8,
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
  },
});