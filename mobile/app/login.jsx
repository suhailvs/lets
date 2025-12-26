import ErrorMessage from "@/components/ErrorMessage";
import Logo from "@/components/Logo";
import { useSession } from "@/login_extras/ctx";
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";

export default function Login() {
  const { signIn } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const [error, setError] = useState("");
  const theme = useTheme(); // Get Paper Theme Colors 
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }
    setError("");  // Clear previous errors
    setLoading(true);
    
    try {
      const userData = await signIn(username, password);  
      router.replace("/");    
    } catch (err) {
      if (err.message.includes("is_active")){
        // user and password is correct, but user is inactive
        router.navigate({ pathname: '/inactiveuser',params:{'username':username}});
      }
      else{
        setError(err.message); // Show error message
      }
      
    } finally {
      setLoading(false);
    }
  };

  return (
  <View style={styles.container}>
    <Logo/>
    <Text variant="headlineMedium" style={{ color: theme.colors.primary, textAlign: "center", marginBottom:20 }}>
        Login to LETS
    </Text>
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
    <Button style={{marginTop: 15}} mode="contained" onPress={handleLogin} loading={loading} disabled={loading}>
      {loading ? 'Loading...' : 'Login'}
    </Button>
    <Text variant="bodyLarge" style={{ textAlign: "center", marginTop:20 }}>Or New user?</Text>
    <Button style={{marginTop: 15}} onPress={() => router.navigate('/registration')} mode="outlined">Sign up for LETS</Button>
    <Text></Text><Text></Text><Text></Text>
  </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  input: {
    marginBottom: 15,
  },
});