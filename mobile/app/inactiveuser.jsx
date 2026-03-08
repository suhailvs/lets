import { View, StyleSheet } from 'react-native';
import { Button,Text, Card } from 'react-native-paper';
import { useLocalSearchParams,useRouter } from 'expo-router';
const InactiveUser = () => {  
    let confirmationsLeft='some';//5;
    const router = useRouter();
    const { username,is_active } = useLocalSearchParams();
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">🎉 Signup Successful!</Text>
          <Text variant="bodyMedium">
            Welcome {username}! Your account has been created successfully. Please note down your username below.
          </Text>
          <Text variant="titleMedium">username: {username}</Text>
          {is_active==='false' && <Card style={styles.inactiveCard}>
            <Card.Content>
            <Text style={styles.inactiveTitle}>Inactive User 🚫</Text>
            <Text style={styles.inactiveText}>
                You need {confirmationsLeft} more confirmations to activate your account.
            </Text>
            </Card.Content>
          </Card>}
          <Button
            mode="contained"
            onPress={() => router.replace('/login')}
            style={styles.button}
          >
            Go to Login
          </Button>
        </Card.Content>
      </Card>
    </View>
  )
}

export default InactiveUser

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f6f6f6',
      justifyContent: 'center',
      padding: 20,
    },
    card: {
      padding: 20,
      borderRadius: 10,
      elevation: 5,
    },    
    inactiveCard: {
      backgroundColor: '#fff3cd',
      marginVertical: 15,
      borderRadius: 8,
      padding: 10,
      elevation: 2,
    },
    inactiveTitle: {
      fontWeight: 'bold',
      fontSize: 18,
      color: '#856404',
      marginBottom: 5,
    },
    inactiveText: {
      color: '#856404',
      fontSize: 15,
    },
    button: {
      marginTop: 10,
      borderRadius: 5,
    },
  });
