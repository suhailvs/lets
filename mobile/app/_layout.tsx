import { SessionProvider } from "@/login_extras/ctx";
import { Slot } from 'expo-router';
export default function RootLayout() {
  return (
    <SessionProvider>
      <Slot />
    </SessionProvider>
  );
}

