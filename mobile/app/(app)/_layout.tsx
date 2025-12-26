import { Redirect, Stack } from 'expo-router';
import { Text } from 'react-native';

import { useSession } from "@/login_extras/ctx";

export default function AppLayout() {
  const { session, isLoading } = useSession();
  if (isLoading) {
    return <Text>Loading...</Text>;
  }
  if (!session) {
    return <Redirect href="/login" />;
  }

  // This layout can be deferred because it's not the root layout.
  return (
  <Stack screenOptions={{
    animation: 'slide_from_bottom', // orslide_from_bottom 'fade', 'slide_from_right', 'none'
  }}>
    <Stack.Screen name="index" options={{headerShown: false}} />
  </Stack>
  );
}
