import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
} from "react-native";
import { Button } from "react-native-paper";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from "@/constants/api";
import ErrorMessage from "@/components/ErrorMessage";
import { Colors, Palette } from "@/constants/Colors";

const EnterAmountScreen = () => {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { id, username, first_name, txn_type } = useLocalSearchParams();
  const router = useRouter();

  const isSeller = txn_type === "seller";

  const handleProceed = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setModalVisible(true);
  };

  const handleCancel = () => {
    setError("");
    setModalVisible(false);
  };

  const handleSendMoney = async () => {
    setError("");
    setLoading(true);
    try {
      await api.post("/transactions/", {
        user: id,
        amount,
        message,
        transaction_type: txn_type,
      });
      setModalVisible(false);
      router.replace({
        pathname: "screens/sendmoney/success",
        params: { name: first_name, amount },
      });
    } catch (err) {
      if (err.response) {
        setError(JSON.stringify(err.response.data) || "Invalid credentials");
      } else if (err.request) {
        setError("Network error. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, "").replace(/^0+/, "");
    setAmount(cleaned);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Transfer" }} />
      <View style={styles.container}>

        {/* ── Receipt card ─────────────────────────────────── */}
        <View style={styles.card}>

          {/* Section label */}
          <Text style={styles.sectionLabel}>TRANSFER</Text>

          {/* Note / message input */}
          <TextInput
            style={styles.noteInput}
            placeholder="Add a note (optional)"
            placeholderTextColor={Palette.textMid}
            value={message}
            onChangeText={setMessage}
          />

          {/* Amount row */}
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>ℏ</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#c8e6c9"
              keyboardType="numeric"
              value={amount}
              onChangeText={handleChange}
              autoFocus
            />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* FROM / TO party block */}
          <View style={styles.partiesContainer}>

            {/* FROM */}
            <View style={styles.partyRow}>
              <View style={styles.avatarWrapper}>
                <Icon name="account-circle" size={44} color={Palette.secondary} />
              </View>
              <View style={styles.partyInfo}>
                <Text style={styles.partyLabel}>FROM</Text>
                <Text style={styles.partyName}>
                  {isSeller ? first_name : "You"}
                </Text>
                <Text style={styles.partyId}>
                  {isSeller ? username : "MY ACCOUNT"}
                </Text>
              </View>
            </View>

            {/* Dotted connector */}
            <View style={styles.connectorWrapper}>
              <View style={styles.connectorLine} />
              <View style={styles.connectorDot} />
              <View style={styles.connectorLine} />
            </View>

            {/* TO */}
            <View style={styles.partyRow}>
              <View style={styles.avatarWrapper}>
                <Icon name="account-circle" size={44} color={Palette.primary} />
              </View>
              <View style={styles.partyInfo}>
                <Text style={styles.partyLabel}>TO</Text>
                <Text style={styles.partyName}>
                  {isSeller ? "You" : first_name}
                </Text>
                <Text style={styles.partyId}>
                  {isSeller ? "MY ACCOUNT" : username}
                </Text>
              </View>
            </View>

          </View>
        </View>

        {/* ── Action button ────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.proceedButton, (!amount || parseFloat(amount) <= 0) && styles.proceedButtonDisabled]}
          onPress={handleProceed}
          disabled={!amount || parseFloat(amount) <= 0}
        >
          <Text style={styles.proceedButtonText}>
            {isSeller ? "Receive" : "Pay"} {amount ? `ℏ${amount}` : "ℏ0"}
          </Text>
        </TouchableOpacity>

        {/* ── Confirmation Modal ───────────────────────────── */}
        <Modal transparent animationType="slide" visible={modalVisible}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>

              {/* Handle bar */}
              <View style={styles.sheetHandle} />

              <Icon name="check-circle-outline" size={52} color={Palette.success} style={{ marginBottom: 8 }} />
              <Text style={styles.modalTitle}>Confirm Transfer</Text>

              {/* Mini receipt inside modal */}
              <View style={styles.modalReceipt}>
                <View style={styles.modalReceiptRow}>
                  <Text style={styles.modalReceiptLabel}>Amount</Text>
                  <Text style={styles.modalReceiptValue}>ℏ{amount}</Text>
                </View>
                <View style={styles.modalReceiptRow}>
                  <Text style={styles.modalReceiptLabel}>{isSeller ? "From" : "To"}</Text>
                  <Text style={styles.modalReceiptValue}>{first_name}</Text>
                </View>
                <View style={styles.modalReceiptRow}>
                  <Text style={styles.modalReceiptLabel}>ID</Text>
                  <Text style={styles.modalReceiptValue}>{username}</Text>
                </View>
                {message ? (
                  <View style={styles.modalReceiptRow}>
                    <Text style={styles.modalReceiptLabel}>Note</Text>
                    <Text style={[styles.modalReceiptValue, { fontStyle: "italic" }]}>"{message}"</Text>
                  </View>
                ) : null}
              </View>

              <ErrorMessage message={error} onClose={() => setError("")} />

              <View style={styles.modalButtons}>
                <Button
                  style={styles.cancelButton}
                  labelStyle={styles.cancelText}
                  onPress={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  style={styles.confirmButton}
                  labelStyle={styles.confirmText}
                  onPress={handleSendMoney}
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? "Sending…" : "Confirm"}
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const CARD_RADIUS = 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6f8",
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: "center",
  },

  // ── Receipt card ──────────────────────────────────────────
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: CARD_RADIUS,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 24,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: Palette.textMid,
    marginBottom: 10,
    textTransform: "uppercase",
  },

  noteInput: {
    fontSize: 15,
    color: Palette.textDark,
    paddingVertical: 0,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: "#e8eaed",
    paddingBottom: 8,
  },

  amountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 20,
  },

  currencySymbol: {
    fontSize: 38,
    fontWeight: "700",
    color: "#2e7d32",          // forest green — matches screenshot
    lineHeight: 52,
    marginRight: 4,
  },

  amountInput: {
    fontSize: 48,
    fontWeight: "700",
    color: "#2e7d32",
    minWidth: 120,
    padding: 0,
  },

  divider: {
    height: 1,
    backgroundColor: "#e8eaed",
    marginBottom: 20,
  },

  // ── Parties ───────────────────────────────────────────────
  partiesContainer: {
    paddingLeft: 4,
  },

  partyRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarWrapper: {
    width: 48,
    alignItems: "center",
  },

  partyInfo: {
    marginLeft: 14,
  },

  partyLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: Palette.textMid,
    textTransform: "uppercase",
    marginBottom: 2,
  },

  partyName: {
    fontSize: 16,
    fontWeight: "700",
    color: Palette.textDark,
    lineHeight: 20,
  },

  partyId: {
    fontSize: 12,
    color: Palette.textMid,
    marginTop: 1,
  },

  // Dotted vertical connector between FROM and TO
  connectorWrapper: {
    alignItems: "center",
    width: 48,              // same width as avatarWrapper to align dots under avatar centre
    paddingVertical: 4,
    flexDirection: "column",
  },

  connectorLine: {
    width: 1,
    height: 10,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#b0bec5",
  },

  connectorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#b0bec5",
    marginVertical: 2,
  },

  // ── Proceed button ────────────────────────────────────────
  proceedButton: {
    backgroundColor: Palette.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 40,
    alignItems: "center",
    width: "100%",
    shadowColor: Palette.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  proceedButtonDisabled: {
    opacity: 0.45,
  },

  proceedButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // ── Modal / bottom sheet ──────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  modalSheet: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 40,
    alignItems: "center",
  },

  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#dde1e7",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Palette.textDark,
    marginBottom: 20,
  },

  // Mini receipt table inside modal
  modalReceipt: {
    width: "100%",
    backgroundColor: "#f5f6f8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },

  modalReceiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  modalReceiptLabel: {
    fontSize: 13,
    color: Palette.textMid,
    fontWeight: "500",
  },

  modalReceiptValue: {
    fontSize: 14,
    color: Palette.textDark,
    fontWeight: "700",
  },

  // Modal action buttons
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
    marginTop: 8,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    borderRadius: 12,
  },

  confirmButton: {
    flex: 1,
    backgroundColor: Palette.success,
    borderRadius: 12,
  },

  cancelText: {
    color: Palette.textDark,
    fontWeight: "700",
    fontSize: 15,
  },

  confirmText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});

export default EnterAmountScreen;