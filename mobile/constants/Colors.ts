/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

export const Palette = {

  bg: '#F8F9FA',
  card: '#FFFFFF',
  border: '#E0E3E7',

  primary: '#4285F4',        // Google Pay blue
  primaryLight: '#E8F0FE',

  secondary: '#34A853',      // Google green
  secondaryLight: '#E6F4EA',

  accent: '#FBBC04',         // Google yellow
  accentLight: '#FEF7E0',

  textDark: '#202124',
  textMid: '#5F6368',
  textSoft: '#9AA0A6',

  success: '#34A853',
  danger: '#EA4335',
  warning: '#FBBC04',

  white: '#FFFFFF',
  black: '#000000',
  
  
  successLight: '#E6F4EA',
  blob1: '#E8F0FE',
  blob2: '#E6F4EA',
  blob3: '#FEF7E0',
  warningBg: '#FEF7E0',
  warningText: '#9A6B00',
  whiteAlpha10: 'rgba(255,255,255,0.1)',
  whiteAlpha12: 'rgba(255,255,255,0.12)',
  whiteAlpha22: 'rgba(255,255,255,0.22)',
  whiteAlpha70: 'rgba(255,255,255,0.7)',
  whiteAlpha75: 'rgba(255,255,255,0.75)',
};

export const Colors = {
  light: {
    text: Palette.textDark,
    background: Palette.bg,
    tint: Palette.primary,
    icon: Palette.textMid,
    tabIconDefault: Palette.textSoft,
    tabIconSelected: Palette.primary,
    card: Palette.card,
    border: Palette.border,
    accent: Palette.primary,
    accentAlt: Palette.secondary,
    success: Palette.success,
    warning: Palette.accent,
    danger: Palette.danger,
  },
  dark: {
    text: Palette.textDark,
    background: Palette.bg,
    tint: Palette.primary,
    icon: Palette.textMid,
    tabIconDefault: Palette.textSoft,
    tabIconSelected: Palette.primary,
    card: Palette.card,
    border: Palette.border,
    accent: Palette.primary,
    accentAlt: Palette.secondary,
    success: Palette.success,
    warning: Palette.accent,
    danger: Palette.danger,
  },
};
