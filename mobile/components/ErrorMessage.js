import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const ErrorMessage = ({ message, onClose }) => {
  if (!message) return null; // Don't render if there's no error

  return (
    <View style={styles.container}>
      <Icon name="alert-circle" size={20} color="white" style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
      <TouchableOpacity onPress={onClose}>
        <Icon name="close" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF4D4D",
    padding: 12,
    borderRadius: 8,
    marginTop: 10
  },
  text: {
    color: "white",
    fontSize: 14,
    flex: 1,
    marginLeft: 10,
  },
  icon: {
    marginRight: 5,
  },
});

export default ErrorMessage;