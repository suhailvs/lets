import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { Button } from 'react-native-paper';
import { useLocalSearchParams,useRouter } from 'expo-router';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from '@/constants/api'

import ErrorMessage from "@/components/ErrorMessage";
const EnterAmountScreen = () => { // { route, navigation }
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { id, username, first_name } = useLocalSearchParams();
  const router = useRouter();
  const handleProceed = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setModalVisible(false);
      return;
    }
    setModalVisible(true); // Show the modal
  };
  const handleCancel = () => {
    setError("");
    setModalVisible(false);
  }
  const handleSendMoney = async () => {
    setError("");  // Clear previous errors
    setLoading(true);
    try {
      const response = await api.post('/transactions/',{
        user: id,
        amount: amount,
        message: message
      });
      setModalVisible(false); 
      router.replace({ pathname: 'screens/sendmoney/success',params: {name:first_name, amount:amount } });
      // setOffering(response.data);
    } catch (error) {
      if (error.response) {
        setError(JSON.stringify(error.response.data)|| "Invalid credentials");
      } else if (error.request) {
        setError("Network error. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }      
    } finally {
      setLoading(false);      
    }    
  };
  const handleChange = (text) => {
    // Remove non-digit characters and leading zeros
    const cleaned = text.replace(/[^0-9]/g, '').replace(/^0+/, '');
    setAmount(cleaned);
  };
  return (
    <View style={styles.container}>
      {/* Contact Info */}
      {/* <View style={styles.contactContainer}>
        <Icon name="account-circle" size={50} color="#4285F4" />
        <View>
          <Text style={styles.contactName}>{first_name} ({username})</Text>
          <Text style={styles.contactDetails}>Send money on LETS</Text>
        </View>
      </View> */}
      <View style={styles.contactWrapper}>
        <View style={styles.contactContainer}>
          <Icon name="account-circle" size={50} color="#4285F4" />
          <View>
            <Text style={styles.contactName}>{first_name} ({username})</Text>
            <Text style={styles.contactDetails}>Send money on LETS</Text>
          </View>
        </View>
      </View>
      <View style={styles.formContainer}>
      {/* Amount Input */}
      <View style={styles.amountContainer}>
        <Text style={styles.currency}>£</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0"
          keyboardType="numeric"
          value={amount}
          onChangeText={handleChange}
          autoFocus={true}
        />
      </View>

      {/* Message Input */}
      <TextInput
        style={styles.messageInput}
        placeholder="Add a note (optional)"
        value={message}
        onChangeText={setMessage}
      />

      {/* Proceed Button */}
      <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
        <Text style={styles.proceedButtonText}>Pay £{amount || "0"}</Text>
      </TouchableOpacity>
      </View>
      {/* Confirmation Modal */}
      <Modal transparent={true} animationType="fade" visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Icon name="check-circle" size={60} color="#34A853" />
            <Text style={styles.modalTitle}>Confirm Payment</Text>
            <Text style={styles.modalText}>Pay £{amount} to {first_name} ({username})?</Text>
            {message ? <Text style={styles.modalMessage}>"{message}"</Text> : null}
            <ErrorMessage message={error} onClose={() => setError("")} />
            
            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <Button style={styles.cancelButton} labelStyle={styles.cancelText} onPress={handleCancel}>
                Cancel
              </Button>
              <Button style={styles.confirmButton} labelStyle={styles.confirmText} onPress={handleSendMoney} loading={loading} disabled={loading}>
                {loading ? 'Loading...' : 'Confirm'}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff", 
    alignItems: "center", 
    // justifyContent: "center", 
    paddingHorizontal: 20 
  },
  contactWrapper: {
    width: '100%',
    // position: 'absolute',
    
    backgroundColor: '#fff',
    zIndex: 10,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  
  
  contactContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#F1F3F4", 
    padding: 15, 
    borderRadius: 10, 
    width: "100%"
    // marginBottom: 30 
  },
  contactName: { fontSize: 18, fontWeight: "bold", color: "#000", marginLeft: 10 },
  contactDetails: { fontSize: 14, color: "#5F6368", marginLeft: 10 },
  

  formContainer: {
    // marginTop: 100, // enough space below contactWrapper
    width: '100%',
    alignItems: 'center',
  },
  amountContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 20 
  },
  currency: { fontSize: 50, fontWeight: "bold", color: "#000" },
  amountInput: { 
    fontSize: 50, 
    fontWeight: "bold", 
    color: "#000", 
    borderBottomWidth: 2, 
    borderColor: "#4285F4", 
    width: 200, 
    textAlign: "left",
    paddingLeft: 10,
  },

  messageInput: { 
    backgroundColor: "#F1F3F4", 
    padding: 12, 
    borderRadius: 8, 
    fontSize: 16, 
    width: "100%", 
    marginBottom: 20 
  },

  proceedButton: { 
    backgroundColor: "#4285F4", 
    padding: 15, 
    borderRadius: 30, 
    alignItems: "center", 
    width: "80%", 
    marginTop: 10 
  },
  proceedButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  // Modal Styles
  modalContainer: { flex: 1, justifyContent: "center",alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 15, alignItems: "center", width: "85%" },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginTop: 10, color: "#000" },
  modalText: { fontSize: 18, marginTop: 10, color: "#5F6368" },
  modalMessage: { fontSize: 16, fontStyle: "italic", marginTop: 5, color: "#5F6368" },
  modalButtons: { flexDirection: "row", marginTop: 20, width: "100%" },  
  cancelButton: { flex: 1, padding: 12, backgroundColor: "#DADCE0", marginRight: 5 },
  confirmButton: { flex: 1, padding: 12, backgroundColor: "#34A853", marginLeft: 5 },
  cancelText: {color: "#000", fontWeight: "bold",},
  confirmText: {color: "#fff", fontWeight: "bold",},
});

export default EnterAmountScreen;