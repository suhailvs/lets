import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const ErrorMessage = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <View style={styles.container}>
      {/* Icon wrap */}
      <View style={styles.iconWrap}>
        <Icon name="alert-circle-outline" size={18} color="#c62828" />
      </View>

      {/* Message */}
      <Text style={styles.text} numberOfLines={3}>{message}</Text>

      {/* Close */}
      <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={8}>
        <Icon name="close" size={15} color="#c62828" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    borderLeftWidth: 3,
    borderLeftColor: "#c62828",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 10,
    gap: 10,
  },

  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#ffcdd2",
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#b71c1c",
    lineHeight: 18,
  },

  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#ffcdd2",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ErrorMessage;