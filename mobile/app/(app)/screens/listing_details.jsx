import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, Pressable} from "react-native";
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { openWhatsApp } from '@/utils/openWhatsApp';
import SkeletonLoader from "@/components/SkeletonLoader";
import ImagePreview from "@/components/ImagePreview";
import api from '@/constants/api'
import Markdown from 'react-native-markdown-display';
import { MaterialIcons } from "@expo/vector-icons"; // Call icon
import { Palette } from '@/constants/Colors';

const OfferingDetailPage = ( ) => {
  const [offering, setOffering] = useState([]);
  const [userdata, setUserData] = useState({});
  const [loading, setLoading] = useState(true);

  const { id, category } = useLocalSearchParams(); // Get passed data
  const router = useRouter();
 
  // let userdata;
  useEffect(() => {
    fetchData();
    getUser();
  }, []);
  
  const fetchData = async () => {
      try {
          const response = await api.get(`/listings/${id}/`);
          setOffering(response.data);
      } catch (error) {
          console.error('Error fetching data:', error);
      } finally {
          setLoading(false);
      }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    }).format(date);
  };
  
  const getUser = async () => {
    try {
      const jsonValue = await SecureStore.getItemAsync('user_data');
      setUserData(JSON.parse(jsonValue));
    } catch (e) {
      console.error('Failed to load user:', e);
      setUserData({});
    }
  };
  
  const handleShowUser = (userid,is_mine='no') => {
    router.navigate({ pathname: '/(tabs)', params: { id: userid, is_mine}});
  };
  

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/listings/${offering.id}/`);
      console.log('Item deleted successfully:');
      router.replace("/")
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };
  const handleActivateListing = async (is_active) => {
    try {
      const response = await api.patch(`/listings/${offering.id}/`,{is_active},
        { headers: { 'Content-Type': 'application/json'}}
      );
      console.log('Item deactivated successfully:');
      // router.replace("/")
      fetchData();
    } catch (error) {
      console.error('Error deactivating item:', error);
    }
  };
  
  const handleCallPress = () => {
    Linking.openURL(`tel:${offering.user.phone}`);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View pointerEvents="none" style={styles.blobLayer}>
        <View style={[styles.blob, styles.blobA]} />
        <View style={[styles.blob, styles.blobB]} />
        <View style={[styles.blob, styles.blobC]} />
      </View>
      {loading ? (
        <View style={styles.loadingWrap}>
          <SkeletonLoader width={100} height={20} />
          <SkeletonLoader width={200} height={15} />
          <SkeletonLoader width={250} height={15} />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.heroMeta}>
                <Text style={styles.heroTitle}>{offering.title}</Text>
                <Text style={styles.heroDate}>Added on {formatDate(offering.created_at)}</Text>
              </View>
              <View style={styles.pricePill}>
                <Text style={styles.priceLabel}>Price</Text>
                <Text style={styles.priceValue}>₹{offering.rate}</Text>
              </View>
            </View>
            {offering.image ? (
              <View style={styles.imageCard}>
                <ImagePreview imageUri={offering.image}/>
              </View>
            ) : null}
          </View>
          
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionLink}>{category || 'Listing'}</Text>
          </View>
          <View style={styles.detailCard}>
            <Markdown style={markdownStyles}>{offering.description || 'No description provided.'}</Markdown>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Advertiser</Text>
            <Text style={styles.sectionLink}>Details</Text>
          </View>
          <View style={styles.advertiserCard}>
            <View style={styles.advertiserHeader}>
              <View style={styles.advertiserAvatar}>
                <Text style={styles.advertiserAvatarText}>{offering.user.first_name?.[0] || 'U'}</Text>
              </View>
              <View style={styles.advertiserMeta}>
                <Text style={styles.advertiserTitle}>{offering.user.first_name}</Text>
                <Text style={styles.advertiserDate}>Last login {formatDate(offering.user.last_login)}</Text>
              </View>
              <View style={[
                styles.balancePill,
                offering.user.balance > 0 ? styles.balancePositive : styles.balanceNegative
              ]}>
                <Text style={styles.balanceText}>₹{offering.user.balance}</Text>
              </View>
            </View>

            <Pressable onPress={handleCallPress} style={styles.phoneRow}>
              <View style={styles.phoneIcon}>
                <MaterialIcons name="phone" size={18} color={Palette.teal} />
              </View>
              <View style={styles.phoneMeta}>
                <Text style={styles.phoneLabel}>Call</Text>
                <Text style={styles.phoneText}>{offering.user.phone}</Text>
              </View>
            </Pressable>
          </View>

          {offering.user.id == userdata.user_id ? (
            <View style={styles.actionGroup}>
              {offering.is_active == true ? (
                <Pressable style={styles.actionOutline} onPress={() => handleActivateListing(false)}>
                  <MaterialIcons name="close" size={18} color={Palette.coral} />
                  <Text style={styles.actionOutlineText}>Deactivate</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.actionPrimary} onPress={() => handleActivateListing(true)}>
                  <MaterialIcons name="check-circle" size={18} color={Palette.white} />
                  <Text style={styles.actionPrimaryText}>Activate</Text>
                </Pressable>
              )}
              <Pressable style={styles.actionOutline} onPress={handleDelete}>
                <MaterialIcons name="delete" size={18} color={Palette.coral} />
                <Text style={styles.actionOutlineText}>Delete</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.actionGroup}>
              <Pressable
                style={styles.actionPrimary}
                onPress={() => openWhatsApp(offering.user.phone,`I am interested in your advertisement ${offering.title}.`)}
              >
                <MaterialIcons name="chat" size={18} color={Palette.white} />
                <Text style={styles.actionPrimaryText}>Send Whatsapp Message</Text>
              </Pressable>
              <Pressable style={styles.actionSecondary} onPress={() => handleShowUser(offering.user.id)}>
                <MaterialIcons name="person" size={18} color={Palette.coral} />
                <Text style={styles.actionSecondaryText}>View User</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  container: {
    padding: 16,
    paddingBottom: 120,
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
    bottom: 180,
    right: -30,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  loadingWrap: {
    paddingTop: 24,
  },
  heroCard: {
    backgroundColor: Palette.card,
    borderRadius: 26,
    padding: 16,
    shadowColor: Palette.black,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    marginBottom: 18,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroMeta: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Palette.textDark,
  },
  heroDate: {
    fontSize: 12,
    color: Palette.textMid,
    marginTop: 6,
  },
  pricePill: {
    backgroundColor: Palette.coral,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: Palette.coral,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  priceLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: Palette.whiteAlpha75,
    fontWeight: '700',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Palette.white,
  },
  imageCard: {
    marginTop: 14,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 6,
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
  detailCard: {
    backgroundColor: Palette.card,
    borderRadius: 20,
    padding: 16,
    shadowColor: Palette.black,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 18,
  },
  advertiserCard: {
    backgroundColor: Palette.card,
    borderRadius: 22,
    padding: 16,
    shadowColor: Palette.black,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 18,
  },
  advertiserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  advertiserAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Palette.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advertiserAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.teal,
  },
  advertiserMeta: {
    flex: 1,
  },
  advertiserTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.textDark,
  },
  advertiserDate: {
    fontSize: 11,
    color: Palette.textSoft,
    marginTop: 4,
  },
  balancePill: {
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  balancePositive: {
    backgroundColor: Palette.greenLight,
  },
  balanceNegative: {
    backgroundColor: Palette.coralLight,
  },
  balanceText: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.textDark,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0EEF8',
  },
  phoneIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Palette.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneMeta: {
    flex: 1,
  },
  phoneLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: Palette.textSoft,
    fontWeight: '700',
  },
  phoneText: {
    fontSize: 14,
    color: Palette.textDark,
    fontWeight: '700',
    marginTop: 2,
  },
  actionGroup: {
    gap: 10,
  },
  actionPrimary: {
    backgroundColor: Palette.coral,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    shadowColor: Palette.coral,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  actionPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.white,
  },
  actionSecondary: {
    backgroundColor: Palette.card,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.coralLight,
  },
  actionSecondaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.coral,
  },
  actionOutline: {
    backgroundColor: Palette.card,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.coralLight,
  },
  actionOutlineText: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.coral,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    color: Palette.textDark,
    fontSize: 13,
    lineHeight: 20,
  },
  link: {
    color: Palette.coral,
  },
});

export default OfferingDetailPage;
