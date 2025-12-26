import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Linking} from "react-native";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import SkeletonLoader from "@/components/SkeletonLoader";

import api from '@/constants/api'
import Markdown from 'react-native-markdown-display';
import { MaterialIcons } from "@expo/vector-icons"; // Call icon

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
  
  const handleBuyNow = () => {
    // Navigate to payment screen
    // navigation.navigate("Checkout", { offering });
    router.push({ pathname: 'screens/sendmoney/amount', params:{'id':offering.user.id, 'username':offering.user.username, 'first_name':offering.user.first_name} })
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
  const handleDeactivate = async () => {
    try {
      const response = await api.patch(`/listings/${offering.id}/`,{is_active:false},
        { headers: { 'Content-Type': 'application/json'}}
      );
      console.log('Item deactivated successfully:');
      router.replace("/")
    } catch (error) {
      console.error('Error deactivating item:', error);
    }
  };
  
  const handleCallPress = () => {
    Linking.openURL(`tel:${offering.user.phone}`);
  };

  return (
    <ScrollView style={styles.container}>
      {loading ? (
        <View>
          <SkeletonLoader width={100} height={20} />
          <SkeletonLoader width={200} height={15} />
          <SkeletonLoader width={250} height={15} />
        </View>
      ) : (
        <View>
          {/* Product Title and Price */}
          <Text style={styles.productTitle}>{offering.title}</Text>
          <Text style={styles.productPrice}>£{offering.rate}</Text>
          {/* Formatted Date */}
          <Text style={styles.dateLabel}>Added on: {formatDate(offering.created_at)}</Text>
          {/* Product Image   */}
          {offering.image && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: offering.image }} style={styles.productImage} />
            </View>
          )}
          
          
          {/* Product Description */}          
          <Markdown>{offering.description}</Markdown>


          {/* Advertiser Details */}
          <View>
            <Text style={styles.advertiserItem}>Advertiser Details:</Text>
            
            <Text style={styles.advertiserTitle}>{offering.user.first_name}</Text>
            <Text style={[offering.user.balance > 0 ? styles.positive : styles.negative]}>
              Balance: £{offering.user.balance}
            </Text>
            <Text style={styles.advertiserDate}>Last login: {formatDate(offering.user.last_login)}</Text>
               

            <View style={styles.phoneView}>
              <Text style={styles.phoneLabel}>Contact Customer:</Text>
              <TouchableOpacity onPress={handleCallPress}  style={styles.phoneContainer}>
                <MaterialIcons name="phone" size={20} color="#fff" />
                <Text style={styles.phoneText}>{offering.user.phone}</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Add to Delete and Buy Now Buttons */}
          {offering.user.id == userdata.user_id && 
          <>{offering.is_active == false && <Button
            mode="outlined"
            onPress={handleDeactivate}
            style={styles.deleteButton}
            textColor="#D32F2F"
            icon={({ color, size }) => (
              <MaterialIcons name="close" color={color} size={size} />
            )}
          >Deactivate</Button>}<Button
            mode="outlined"
            onPress={handleDelete}
            style={styles.deleteButton}
            textColor="#D32F2F"
            icon={({ color, size }) => (
              <MaterialIcons name="delete" color={color} size={size} />
            )}
          >Delete</Button></>} 
          <Button
            mode="contained"
            onPress={handleBuyNow}
            style={styles.buyNowButton}
            labelStyle={styles.buttonText}
          >
            Buy Now
          </Button>
          
          {/* These 3 text boxes are to add some margin Bottom */}
          <Text></Text><Text></Text><Text></Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  imageContainer: { alignItems: "center", marginBottom: 20 },
  productImage: { width: "100%", height: 300, borderRadius: 10 },
  productTitle: { fontSize: 24, fontWeight: "bold", color: "#232F3E", marginTop: 10, borderBottomWidth: 1, borderBottomColor: "#ddd"},
  productPrice: { fontSize: 20, marginTop: 10 },
  dateLabel: {fontSize: 16,fontWeight: "bold",color: "gray",marginRight: 5,},
  deleteButton: {
    borderColor: '#D32F2F', // red outline
    borderRadius: 8,
    marginTop: 10,
  },
  buyNowButton: {
    marginVertical: 10,
    borderRadius: 8,
    paddingVertical: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  phoneView: {
    marginTop:10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000", // Amazon Pay Black
    padding: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5, // For Android shadow
    color: "#fff",
  },
  phoneLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginRight: 10,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  phoneText: {
    fontSize: 16,
    color: "#fff",
    marginLeft: 5,
    textDecorationLine: "underline",
  },

  advertiserItem: { fontSize: 20, borderBottomWidth: 1, borderBottomColor: "#ddd" },
  advertiserTitle: { fontSize: 16, fontWeight: "500" },
  
  advertiserDate: { fontSize: 12, color: "gray", marginTop: 2 },
  positive: { color: "green" },
  negative: { color: "red" },
});

export default OfferingDetailPage;