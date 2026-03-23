import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { Button } from 'react-native-paper';
import { useLocalSearchParams,useRouter } from 'expo-router';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from '@/constants/api'

import ErrorMessage from "@/components/ErrorMessage";
import { Colors, Palette } from "@/constants/Colors";
const EnterAmountScreen = () => { // { route, navigation }
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { id, username, first_name,txn_type } = useLocalSearchParams();
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
        message: message,
        transaction_type: txn_type
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
      <View style={styles.contactWrapper}>
        <View style={styles.contactContainer}>
          <Icon name="account-circle" size={50} color={Palette.secondary} />
          <View>
            <Text style={styles.contactName}>{first_name} ({username})</Text>
            <Text style={styles.contactDetails}>{txn_type==='seller'? "Receive":"Send"} money on LETS</Text>
          </View>
        </View>
      </View>
      <View style={styles.formContainer}>
      {/* Amount Input */}
      <View style={styles.amountContainer}>
        <Text style={styles.currency}>KC</Text>
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
        <Text style={styles.proceedButtonText}>{txn_type==='seller'? "Receive":"Pay"} {amount || "0"} KC</Text>
      </TouchableOpacity>
      </View>
      {/* Confirmation Modal */}
      <Modal transparent={true} animationType="fade" visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Icon name="check-circle" size={60} color={Palette.success} />
            <Text style={styles.modalTitle}>Confirm Payment</Text>
            <Text style={styles.modalText}>{txn_type==='seller'? `Receive ${amount} KC from`:`Pay ${amount} KC to`} {first_name} ({username})?</Text>
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
    backgroundColor: Colors.light.background, 
    alignItems: "center", 
    // justifyContent: "center", 
    paddingHorizontal: 20 
  },
  contactWrapper: {
    width: '100%',
    // position: 'absolute',
    
    backgroundColor: Colors.light.background,
    zIndex: 10,
    borderBottomWidth: 1,
    borderColor: Colors.light.border,
  },
  
  
  contactContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: Palette.secondaryLight, 
    padding: 15, 
    borderRadius: 10, 
    width: "100%"
    // marginBottom: 30 
  },
  contactName: { fontSize: 18, fontWeight: "bold", color: Palette.textDark, marginLeft: 10 },
  contactDetails: { fontSize: 14, color: Palette.textMid, marginLeft: 10 },
  

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
  currency: { fontSize: 50, fontWeight: "bold", color: Palette.textDark },
  amountInput: { 
    fontSize: 50, 
    fontWeight: "bold", 
    color: Palette.textDark, 
    borderBottomWidth: 2, 
    borderColor: Palette.primary, 
    width: 200, 
    textAlign: "left",
    paddingLeft: 10,
  },

  messageInput: { 
    backgroundColor: Palette.primaryLight, 
    padding: 12, 
    borderRadius: 8, 
    fontSize: 16, 
    width: "100%", 
    marginBottom: 20 
  },

  proceedButton: { 
    backgroundColor: Palette.primary, 
    padding: 15, 
    borderRadius: 30, 
    alignItems: "center", 
    width: "80%", 
    marginTop: 10 
  },
  proceedButtonText: { color: Palette.white, fontSize: 18, fontWeight: "bold" },

  // Modal Styles
  modalContainer: { flex: 1, justifyContent: "center",alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: Colors.light.card, padding: 20, borderRadius: 15, alignItems: "center", width: "85%" },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginTop: 10, color: Palette.textDark },
  modalText: { fontSize: 18, marginTop: 10, color: Palette.textMid },
  modalMessage: { fontSize: 16, fontStyle: "italic", marginTop: 5, color: Palette.textMid },
  modalButtons: { flexDirection: "row", marginTop: 20, width: "100%" },  
  cancelButton: { flex: 1, padding: 12, backgroundColor: Palette.accentLight, marginRight: 5 },
  confirmButton: { flex: 1, padding: 12, backgroundColor: Palette.success, marginLeft: 5 },
  cancelText: {color: Palette.textDark, fontWeight: "bold",},
  confirmText: {color: Palette.white, fontWeight: "bold",},
});

export default EnterAmountScreen;
