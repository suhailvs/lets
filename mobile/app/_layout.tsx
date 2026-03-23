import { SessionProvider } from "@/login_extras/ctx";
import { Slot } from 'expo-router';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { Colors, Palette } from '@/constants/Colors';
export default function RootLayout() {
  const paperTheme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: Colors.light.tint,
      secondary: Palette.secondary,
      tertiary: Palette.accent,
      background: Colors.light.background,
      surface: Colors.light.card,
      surfaceVariant: Palette.primaryLight,
      outline: Colors.light.border,
      onSurface: Colors.light.text,
      onSurfaceVariant: Palette.textMid,
      onBackground: Colors.light.text,
      error: Colors.light.danger,
    },
  };
  return (
    <SessionProvider>
      <PaperProvider theme={paperTheme}>
        <Slot />
      </PaperProvider>
    </SessionProvider>
  );
}
