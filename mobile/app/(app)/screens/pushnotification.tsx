import { Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import api from '@/constants/api'

const sendPushNotification = () => { 
  const handleSend = async () => {
    try {
      const response = await api.post('/sendpushnotification/',{user: 1});
    } catch (error) { console.log('error')}
  }
  return (
    <View style={{ flex: 1, alignItems: 'center', padding: 20}}>
      <Text>Expo push Notification</Text>
      <Button mode="contained" onPress={handleSend}>Press to Send Notification</Button>
    </View>
  );
}
export default sendPushNotification;