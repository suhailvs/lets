import { useState,useEffect } from "react";
import { StyleSheet, ScrollView } from "react-native";
import { useRouter } from 'expo-router';
import { TextInput, Button, useTheme,Text} from "react-native-paper";
import api from '@/constants/api'
import ErrorMessage from "@/components/ErrorMessage";
import Logo from "@/components/Logo";
import Dropdown from "@/components/Dropdown";
import ImagePickerComponent from "@/components/ImagePickerComponent";
export default function RegisterScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [first_name, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [date_of_birth, setDateOfBirth] = useState('');
  const [exchange, setExchange] = useState('');
  const [image, setSelectedImage] = useState(null);
  const [secureText, setSecureText] = useState(true);
  const theme = useTheme();
  const router = useRouter();

  const [exchanges, setExchanges] = useState([]);


  useEffect(() => {
    fetchExchanges();
  }, []);

  const fetchExchanges = async () => {
    try {
      const response = await api.get('/ajax/?purpose=exchanges');
      setExchanges(response.data['data']);
    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        // setLoading(false);
    }
  };
  const handleRegistration = async () => {
    if (!first_name || !phone || !password  || !email || !date_of_birth || !exchange || !image) {
      if(!image){
        setError("Please upload your profile picture.");
      } else {
        setError("Please fill all fields.");
      }      
      return;
    }
    setError("");  // Clear previous errors
    setLoading(true);
    let formData = new FormData();
    formData.append("image", {uri: image,name: "user.jpg",type: "image/jpeg"});
    formData.append("first_name", first_name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("password", password);
    formData.append("date_of_birth", date_of_birth);
    formData.append("exchange", exchange);
    try {      
      const response = await api.post('/registration/', formData, { headers: { "Content-Type": "multipart/form-data" } });
      router.replace({ pathname: '/inactiveuser',params:{'username':response.data['username']} });
    } catch (error) {
      setError(JSON.stringify(error.response?.data) || "Something went wrong.");
    } finally {
      setLoading(false);
    }   
  };
  return (
    <ScrollView style={styles.container}>
      <Logo/>
      <Text variant="headlineMedium" style={{ color: theme.colors.primary, textAlign: "center", marginBottom:20 }}>Sign up to LETS</Text>
      <TextInput
        label="First Name"
        value={first_name}
        onChangeText={setFirstName}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        label="Phone Number"
        value={phone}
        onChangeText={setPhone}
        mode="outlined"
        keyboardType="numeric"
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
      <TextInput
        label="Date Of Birth(YYYY-MM-DD)"
        value={date_of_birth}
        onChangeText={setDateOfBirth}
        mode="outlined"
        style={styles.input}
      />
      <Dropdown
        label="Select Exchange"
        items={exchanges}
        onSelect={setExchange}
      />
      <Text variant="bodyLarge">Profile Picture</Text>
      <ImagePickerComponent onImageSelected={setSelectedImage} />
      <ErrorMessage message={error} onClose={() => setError("")} />
      <Button style={{marginTop: 15}} mode="contained" onPress={handleRegistration} loading={loading} disabled={loading}>
        {loading ? 'Loading...' : 'Sign Up'}
      </Button>


      <Text variant="bodyLarge" style={{ textAlign: "center", marginTop:20 }}>I already have an account !</Text>
      <Button style={{marginTop: 15}} onPress={() => router.navigate('/login')} mode="outlined">Log In</Button>
      <Text></Text><Text></Text><Text></Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    marginBottom: 15,
  },
});