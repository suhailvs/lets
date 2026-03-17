import { Image, StyleSheet,View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useRouter } from 'expo-router';
export default function Logo({page}) {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Image source={require("../assets/images/lets-icon.png")} style={styles.image} />
      <View style={{flexDirection:"row",alignItems: "center"}}>
        {page==='login' ?
          <>
          <Text>New User?</Text>
          <Button onPress={() => router.replace('/registration')} mode="text">SIGN UP HERE</Button>
          </>:
          <>
          <Text>Already a User?</Text>
          <Button onPress={() => router.replace('/login')} mode="text">SIGN IN HERE</Button>
          </>
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {      
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20, // optional spacing
    marginTop:40,
  },
  image: {
    width: 70,
    height: 70,
    marginBottom: 8,
  },
});