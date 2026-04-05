import { useState } from "react";
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, TextInput } from "react-native";
import { useRouter } from 'expo-router';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from '@/constants/api';
import ErrorMessage from "@/components/ErrorMessage";
import ExchangeCreationTab from "@/components/ExchangeCreationTab";
import Logo from "@/components/Logo";
import ImagePickerComponent from "@/components/ImagePickerComponent";
import { Palette } from "@/constants/Colors";

// ── Reusable field row ───────────────────────────────────────
function FieldRow({ icon, label, children }) {
  return (
    <View style={field.row}>
      <View style={field.iconWrap}>
        <Icon name={icon} size={18} color={Palette.primary} />
      </View>
      <View style={field.body}>
        <Text style={field.label}>{label}</Text>
        {children}
      </View>
    </View>
  );
}

const field = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  body: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#e8eaed',
    paddingBottom: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Palette.textMid,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
});

export default function RegisterScreen() {
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [exchangeData, setExchangeData] = useState({ mode: 'join', exchange: '' });
  const [first_name, setFirstName]      = useState('');
  const [phone, setPhone]               = useState('');
  const [password, setPassword]         = useState('');
  const [email, setEmail]               = useState('');
  const [image, setSelectedImage]       = useState(null);
  const [secureText, setSecureText]     = useState(true);
  const router = useRouter();

  const handleRegistration = async () => {
    const joinInvalid   = exchangeData.mode === 'join' && !exchangeData.exchange;
    const createInvalid = exchangeData.mode === 'create' &&
      (!exchangeData.exchange_code || !exchangeData.exchange_name ||
       !exchangeData.exchange_address || !exchangeData.exchange_country_city);
    
    const cleanPhone = phone.replace(/\s/g, "");
    console.log(cleanPhone)
    const isValidPhone = /^\+[1-9]\d{1,14}$/.test(cleanPhone);

    if (!first_name || !phone || !password || !email || joinInvalid || createInvalid || !image) {
      if (!image)                      setError("Please upload your profile picture.");      
      else if (joinInvalid || createInvalid) setError("Please complete exchange details.");
      else                             setError("Please fill all fields.");
      return;
    } else if (!isValidPhone) {
      setError("Enter a valid phone number with country code (e.g. +91 9876543210)");
      return;
    }

    setError("");
    setLoading(true);

    let formData = new FormData();
    formData.append("image",      { uri: image, name: "user.jpg", type: "image/jpeg" });
    formData.append("first_name", first_name);
    formData.append("email",      email);
    formData.append("phone",      cleanPhone);
    formData.append("password",   password);

    if (exchangeData.mode === 'join') {
      formData.append("exchange", exchangeData.exchange);
    } else {
      formData.append("exchange_code",         exchangeData.exchange_code.toUpperCase());
      formData.append("exchange_name",         exchangeData.exchange_name);
      formData.append("exchange_address",      exchangeData.exchange_address);
      formData.append("exchange_country_city", exchangeData.exchange_country_city.toUpperCase());
      formData.append("exchange_postal_code",  exchangeData.exchange_postal_code || "");
    }

    try {
      const response = await api.post('/registration/', formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      router.replace({
        pathname: '/inactiveuser',
        params: { username: response.data['username'], is_active: response.data['is_active'] },
      });
    } catch (err) {
      setError(JSON.stringify(err.response?.data) || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>

      {/* ── Logo / wordmark ────────────────────────────── */}
      <View style={styles.logoArea}>
        <Logo page="registration" />
        <Text style={styles.pageTitle}>Create Account</Text>
        <Text style={styles.pageSubtitle}>Join your local LETS exchange</Text>
      </View>

      {/* ── Exchange card ──────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>EXCHANGE</Text>
        <ExchangeCreationTab onExchangeSelected={setExchangeData} />
      </View>

      {/* ── Personal details card ─────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>PERSONAL DETAILS</Text>

        <FieldRow icon="account-outline" label="Full Name">
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#b0bec5"
            value={first_name}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
        </FieldRow>

        <FieldRow icon="email-outline" label="Email">
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#b0bec5"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </FieldRow>

        <FieldRow icon="whatsapp" label="Phone (WhatsApp)">
          <TextInput
            style={styles.input}
            placeholder="+91 0000000000"
            placeholderTextColor="#b0bec5"
            value={phone}
            onChangeText={setPhone}
          />
        </FieldRow>

        <FieldRow icon="lock-outline" label="Password">
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Create a password"
              placeholderTextColor="#b0bec5"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureText}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeBtn}>
              <Icon name={secureText ? "eye-off-outline" : "eye-outline"} size={20} color={Palette.textMid} />
            </TouchableOpacity>
          </View>
        </FieldRow>
      </View>

      {/* ── Profile photo card ────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>PROFILE PHOTO</Text>
        <View style={styles.photoRow}>
          <View style={styles.photoIconWrap}>
            <Icon name="camera-outline" size={22} color={Palette.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.photoLabel}>Upload a clear photo of yourself</Text>
            <Text style={styles.photoHint}>This helps members recognise you</Text>
          </View>
        </View>
        <ImagePickerComponent onImageSelected={setSelectedImage} />
      </View>

      {/* ── Error ─────────────────────────────────────── */}
      <ErrorMessage message={error} onClose={() => setError("")} />

      {/* ── Submit button ─────────────────────────────── */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleRegistration}
        disabled={loading}
      >
        {loading
          ? <Icon name="loading" size={20} color="#fff" />
          : <Icon name="account-plus-outline" size={20} color="#fff" />
        }
        <Text style={styles.submitBtnText}>{loading ? 'Creating account…' : 'Sign Up'}</Text>
      </TouchableOpacity>

      {/* Tear-off + footer */}
      <View style={styles.tearOff}>
        {Array.from({ length: 28 }).map((_, i) => <View key={i} style={styles.dash} />)}
      </View>
      <Text style={styles.footerNote}>LETS · Community Exchange</Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  container: {
    padding: 16,
    paddingBottom: 60,
    gap: 16,
  },

  // ── Logo area ─────────────────────────────────────────────
  logoArea: {
    paddingTop: 12,
    paddingBottom: 4,
    paddingHorizontal: 4,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Palette.textDark,
    letterSpacing: -0.5,
    marginTop: 12,
  },
  pageSubtitle: {
    fontSize: 13,
    color: Palette.textMid,
    fontWeight: '500',
    marginTop: 4,
  },

  // ── Card shell ────────────────────────────────────────────
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: Palette.textMid,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  // ── Inputs ────────────────────────────────────────────────
  input: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.textDark,
    paddingVertical: 2,
    paddingHorizontal: 0,
  },

  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  eyeBtn: {
    paddingLeft: 10,
    paddingBottom: 8,
  },

  // ── Photo row ─────────────────────────────────────────────
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },

  photoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textDark,
  },

  photoHint: {
    fontSize: 12,
    color: Palette.textMid,
    marginTop: 2,
  },

  // ── Submit button ─────────────────────────────────────────
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Palette.primary,
    borderRadius: 40,
    paddingVertical: 16,
    shadowColor: Palette.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  submitBtnDisabled: {
    opacity: 0.5,
  },

  submitBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },

  // ── Tear-off footer ───────────────────────────────────────
  tearOff: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 8,
  },

  dash: {
    width: 6,
    height: 1,
    backgroundColor: '#dde1e7',
  },

  footerNote: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#b0bec5',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 10,
  },
});
