import ErrorMessage from "@/components/ErrorMessage";
import Logo from "@/components/Logo";
import { useSession } from "@/login_extras/ctx";
import { Redirect, useRouter } from 'expo-router';
import { useEffect,useState } from 'react';
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Colors, Palette } from '@/constants/Colors';

export default function Login() {
  const { signIn, session } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [expoPushToken, setExpoPushToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  async function registerForPushNotificationsAsync() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;
  
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) return null;
  
    const token = (await Notifications.getExpoPushTokenAsync({projectId,})).data;
    return token;
  }

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then(token => setExpoPushToken(token ?? ''))
      .catch((error) => setExpoPushToken(''));
  }, []);
  const handleLogin = async () => {
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }
    setError("");  // Clear previous errors
    setLoading(true);
    
    try {
      const userData = await signIn(username, password, expoPushToken);  
      router.replace("/");    
    } catch (err) {
      if (err.message.includes("is_active")){
        // user and password is correct, but user is inactive
        router.navigate({ pathname: '/inactiveuser',params:{'username':username,'is_active':'false'}});
      }
      else{
        setError(err.message); // Show error message
      }
      
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    return <Redirect href="/" />;
  }

  return (
  <View style={styles.container}>
    <Logo page="login"/>
    <View style={styles.greetingArea}>
      <Text style={styles.greetingLabel}>WELCOME BACK</Text>
      <Text style={styles.greetingTitle}>Sign in to your account</Text>
    </View>
    <TextInput
      label="Username"
      value={username}
      onChangeText={setUsername}
      mode="outlined"
      autoCapitalize="characters"
      style={styles.input}
    />
    <TextInput
      label="Password"
      value={password}
      onChangeText={setPassword}
      autoCapitalize="none"
      secureTextEntry={secureText}
      mode="outlined"
      right={
        <TextInput.Icon
          icon={secureText ? "eye-off" : "eye"}
          onPress={() => setSecureText(!secureText)}
        />
      }
      style={styles.input}
    />

    <ErrorMessage message={error} onClose={() => setError("")} />
    <Button style={{marginTop: 15}} mode="contained-tonal" onPress={handleLogin} loading={loading} disabled={loading}>
      {loading ? 'Loading...' : 'Login'}
    </Button>
    <Text></Text><Text></Text><Text></Text>
  </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.light.background,
  },
  input: {
    marginBottom: 15,
  },
  // ── Greeting ───────────────────────────────────────────────
  greetingArea: {
    marginBottom: 20,
  },

  greetingLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: Palette.textMid,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  greetingTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Palette.textDark,
    letterSpacing: -0.5,
  },
});
