import { Linking } from 'react-native';
export function openWhatsApp(phone,message='') {
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      alert('WhatsApp is not installed');
    });
  };