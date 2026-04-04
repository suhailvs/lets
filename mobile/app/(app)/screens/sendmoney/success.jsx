import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter,Stack } from "expo-router";
import { Colors, Palette } from "@/constants/Colors";

const PaymentSuccessScreen = () => {
  const { name, amount, username, txn_type } = useLocalSearchParams();
  const router = useRouter();
  const isSeller = txn_type === "seller";

  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.08,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    });
  }, []);

  const fromName  = isSeller ? name  : "You";
  const fromId    = isSeller ? username : "MY ACCOUNT";
  const fromColor = isSeller ? Palette.secondary : Palette.primary;
  const toName    = isSeller ? "You" : name;
  const toId      = isSeller ? "MY ACCOUNT" : username;
  const toColor   = isSeller ? Palette.primary : Palette.secondary;

  return (
    <>
    <Stack.Screen options={{ headerShown: false }} />
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Section label */}
        <Text style={styles.sectionLabel}>TRANSFER</Text>

        {/* Amount — left-aligned like the screenshot */}
        <View style={styles.amountRow}>
          <Text style={styles.currencySymbol}>ℏ</Text>
          <Text style={styles.amountText}>{amount}</Text>
        </View>

        {/* Animated status badge */}
        <Animated.View
          style={[
            styles.badgeRow,
            { transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }] },
          ]}
        >
          <MaterialIcons name="check-circle" size={14} color="#2e7d32" />
          <Text style={styles.badgeText}>Completed</Text>
        </Animated.View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* FROM / TO — identical structure to EnterAmountScreen */}
        <View style={styles.partiesContainer}>

          <View style={styles.partyRow}>
            <View style={styles.avatarWrapper}>
              <Icon name="account-circle" size={44} color={fromColor} />
            </View>
            <View style={styles.partyInfo}>
              <Text style={styles.partyLabel}>FROM</Text>
              <Text style={styles.partyName}>{fromName}</Text>
              <Text style={styles.partyId}>{fromId}</Text>
            </View>
          </View>

          {/* Dotted connector */}
          <View style={styles.connectorWrapper}>
            <View style={styles.connectorLine} />
            <View style={styles.connectorDot} />
            <View style={styles.connectorLine} />
          </View>

          <View style={styles.partyRow}>
            <View style={styles.avatarWrapper}>
              <Icon name="account-circle" size={44} color={toColor} />
            </View>
            <View style={styles.partyInfo}>
              <Text style={styles.partyLabel}>TO</Text>
              <Text style={styles.partyName}>{toName}</Text>
              <Text style={styles.partyId}>{toId}</Text>
            </View>
          </View>

        </View>

        {/* Tear-off dashes */}
        <View style={styles.tearOff}>
          {Array.from({ length: 28 }).map((_, i) => (
            <View key={i} style={styles.dash} />
          ))}
        </View>
        <Text style={styles.footerNote}>LETS · Community Exchange</Text>
      </Animated.View>

      {/* Done button */}
      <Animated.View style={[styles.buttonWrapper, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.button} onPress={() => router.replace("/")}>
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
    </>
  );
};

export default PaymentSuccessScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6f8",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 0,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: "center",
    marginBottom: 24,
    overflow: "hidden",
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: Palette.textMid,
    textTransform: "uppercase",
    alignSelf: "flex-start",
    marginBottom: 16,
  },

  amountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    alignSelf: "flex-start",
    marginBottom: 10,
  },

  currencySymbol: {
    fontSize: 34,
    fontWeight: "700",
    color: "#2e7d32",
    lineHeight: 52,
    marginRight: 4,
  },

  amountText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#2e7d32",
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
    marginBottom: 20,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2e7d32",
  },

  divider: {
    height: 1,
    backgroundColor: "#e8eaed",
    width: "100%",
    marginBottom: 20,
  },

  // ── Parties — pixel-identical to EnterAmountScreen ────────
  partiesContainer: {
    width: "100%",
    paddingLeft: 4,
    marginBottom: 24,
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

  connectorWrapper: {
    alignItems: "center",
    width: 48,
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

  // ── Tear-off ──────────────────────────────────────────────
  tearOff: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "108%",
    paddingHorizontal: 2,
    marginBottom: 16,
  },

  dash: {
    width: 6,
    height: 1,
    backgroundColor: "#e0e4ea",
  },

  footerNote: {
    fontSize: 11,
    letterSpacing: 2,
    color: "#b0bec5",
    textTransform: "uppercase",
    marginBottom: 20,
  },

  // ── Done button ───────────────────────────────────────────
  buttonWrapper: {
    width: "100%",
  },

  button: {
    backgroundColor: Palette.primary,
    borderRadius: 40,
    paddingVertical: 16,
    alignItems: "center",
    width: "100%",
    shadowColor: Palette.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  buttonText: {
    fontSize: 17,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});