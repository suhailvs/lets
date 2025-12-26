import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams,useRouter } from 'expo-router';

const PaymentSuccessScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Fade-in effect
  const scaleAnim = useRef(new Animated.Value(0.8)).current; // Scale animation
  const { name, amount } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    Animated.loop(
    Animated.sequence([
      // Fade-In
      Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
      ]),
      Animated.parallel([
       // Fade-Out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
    ]),
      
    ])
  ).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      {/* Animated Success Icon */}
      <Animated.View style={[styles.iconContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <MaterialIcons name="check-circle" size={100} color="#34A853" />  
      </Animated.View>

      {/* Success Message */}
      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
        Payment Successful
      </Animated.Text>
      <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>
        £{amount} sent to {name}
      </Animated.Text>

      {/* Bottom Done Button */}
      <TouchableOpacity style={styles.button} onPress={() => router.replace("/")}>
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PaymentSuccessScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5", // Google Pay Light Gray
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#202124", // Dark text color
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#5F6368",
    marginTop: 5,
  },
  button: {
    position: "absolute",
    bottom: 40,
    backgroundColor: "#4285F4", // Google Blue
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 50,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "bold",
  },
});