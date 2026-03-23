// Home page with user balance, logout button and some userlisting
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Avatar, Text, Button } from 'react-native-paper';
import { useState, useEffect, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { MaterialIcons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import NetInfo from '@react-native-community/netinfo';
import api from '@/constants/api'
import SkeletonLoader from "@/components/SkeletonLoader";
import { Palette } from '@/constants/Colors';

export default function Index() {
  const [balance, setBalance] = useState(null);
  const [authuser, setAuthUser] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const wasOfflineRef = useRef(false);
  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    try {
        const response = await api.get('/users/');
        setUsers(response.data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
  }, []);

  const getAuthUser = useCallback(async () => {
    try {
      const jsonValue = await SecureStore.getItemAsync('user_data');
      const parsed = jsonValue ? JSON.parse(jsonValue) : {};
      setAuthUser(parsed || {});
    } catch (_e) {
      setAuthUser({});
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    try {
        const response = await api.get('/ajax/?purpose=userbalance');
        setBalance(response.data['data']);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchBalance(), fetchUsers()]);
    setLoading(false);
  }, [fetchBalance, fetchUsers]);

  useEffect(() => {
    getAuthUser();
    refreshData();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (!isOnline) {
        wasOfflineRef.current = true;
        return;
      }
      if (wasOfflineRef.current) {
        wasOfflineRef.current = false;
        refreshData();
      }
    });
    return () => unsubscribe();
  }, [getAuthUser, refreshData]);
  
  const handleShowUser = (userid,is_mine='no') => {
    router.navigate({ pathname: '/(tabs)', params: { id: userid, is_mine}});
  };
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      <View pointerEvents="none" style={styles.blobLayer}>
        <View style={[styles.blob, styles.blobA]} />
        <View style={[styles.blob, styles.blobB]} />
        <View style={[styles.blob, styles.blobC]} />
      </View>

      <View style={styles.content}>
        <View style={styles.topnav}>
          <Text style={styles.wordmark}>Koottam</Text>
          <View style={styles.navRight}>
            <TouchableOpacity onPress={fetchBalance} style={styles.iconBtn}>
              <MaterialIcons name="refresh" size={20} color={Palette.textDark} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleShowUser(authuser.user_id, 'yes')}>
              {authuser?.thumbnail ? (
                <Avatar.Image size={38} source={{ uri: authuser.thumbnail }} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>{authuser?.firstname?.[0] || 'U'}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.greetingArea}>
          <Text style={styles.greetingWave}>
            Hello, {authuser?.firstname || authuser?.username || 'there'}
          </Text>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceCircleLarge} />
          <View style={styles.balanceCircleSmall} />
          <View style={styles.balanceTop}>
            <View>
              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={styles.balanceAmount}>{balance != null ? `${balance} KC` : '****'}</Text>
            </View>
            <Text style={styles.hubBadge}>{authuser?.exchange_name}</Text>
          </View>
          <View style={styles.balanceActions}>
            <Button
              icon={({ size }) => (<FontAwesome6 name="list-alt" size={size} color={Palette.textDark} />)}
              mode="contained"
              buttonColor={Palette.bg}
              textColor={Palette.textDark}
              onPress={() => router.push({ pathname: 'screens/all_listings' })}
              style={styles.primaryCta}
              labelStyle={styles.primaryCtaLabel}
            >
              All Listings
            </Button>
          </View>
        </View>

        <View style={styles.peopleHeader}>
          <Text style={styles.peopleTitle}>People</Text>
          <Text style={styles.peopleSub}>Tap a profile to open details</Text>
        </View>

        {loading ? (
          <View style={styles.skeletonBlock}>
            <SkeletonLoader width={120} height={20} />
            <SkeletonLoader width={200} height={15} />
            <SkeletonLoader width={250} height={15} />
          </View>
        ) : (
          <View style={styles.peopleRow}>
            {users.map((user, i) => (
              <View style={styles.person} key={i}>
                <TouchableOpacity onPress={() => handleShowUser(user.id)} style={styles.personTap}>
                  <Avatar.Image size={60} source={{ uri: user.thumbnail }} />
                  <Text style={[styles.personText, !user.is_active && styles.inActive]}>{user.first_name}</Text>
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
  screen: { backgroundColor: Palette.bg },
  contentContainer: { paddingBottom: 120 },
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
    bottom: 180,
    right: -30,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  topnav: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    fontSize: 22,
    fontWeight: '900',
    color: Palette.textDark,
    letterSpacing: -0.5,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Palette.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: Palette.black,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: Palette.white,
    fontWeight: '800',
  },
  greetingArea: {
    paddingHorizontal: 22,
    paddingBottom: 20,
  },
  greetingWave: {
    fontSize: 26,
    fontWeight: '900',
    color: Palette.textDark,
    letterSpacing: -0.5,
  },
  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: Palette.primary,
    borderRadius: 26,
    padding: 22,
    overflow: 'hidden',
    shadowColor: Palette.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  balanceCircleLarge: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Palette.whiteAlpha12,
    top: -80,
    right: -50,
  },
  balanceCircleSmall: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Palette.whiteAlpha10,
    bottom: -30,
    left: 30,
  },
  balanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.whiteAlpha75,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '900',
    color: Palette.white,
    letterSpacing: -1.5,
    marginTop: 6,
  },
  hubBadge: {
    backgroundColor: Palette.whiteAlpha22,
    color: Palette.white,
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  balanceActions: {
    marginTop: 6,
    alignItems: 'flex-start',
  },
  primaryCta: {
    borderRadius: 18,
  },
  primaryCtaLabel: {
    fontWeight: '700',
  },
  peopleHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  peopleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.textDark,
  },
  peopleSub: {
    fontSize: 13,
    color: Palette.textMid,
    marginTop: 4,
  },
  skeletonBlock: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  peopleRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
  person: { width: 84, alignItems: 'center', marginVertical: 14 },
  personTap: { alignItems: 'center' },
  personText: { textAlign: 'center', marginTop: 6, color: Palette.textDark },
  inActive: { color: Palette.danger },
});
