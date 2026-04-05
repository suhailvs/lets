import { Image, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useRouter } from 'expo-router';
import { Palette } from "@/constants/Colors";

export default function Logo({ page }) {
  const router  = useRouter();
  const isLogin = page === 'login';

  return (
    <View style={styles.container}>

      {/* Logo mark */}
      <Image
        source={require("../assets/images/lets-icon.png")}
        style={styles.image}
      />

      {/* Auth switch pill */}
      <TouchableOpacity
        style={styles.pill}
        onPress={() => router.replace(isLogin ? '/registration' : '/login')}
        activeOpacity={0.8}
      >
        <Text style={styles.pillLabel}>
          {isLogin ? 'New here?' : 'Have an account?'}
        </Text>
        <View style={styles.pillAction}>
          <Text style={styles.pillActionText}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </Text>
        </View>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },

  image: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },

  // ── Auth switch ───────────────────────────────────────────
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  pillLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Palette.textMid,
  },

  pillAction: {
    backgroundColor: Palette.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  pillActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.primary,
  },
});