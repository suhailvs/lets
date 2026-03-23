
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import i18n from '@/constants/i18n';
import { Colors, Palette } from '@/constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.primary,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Icon name="home" size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="offerings"
        options={{
          title: `${i18n.t('offerings')}`,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Icon name="cart" size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="wants"
        options={{
          title: `${i18n.t('wants')}`,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Icon name="shopping" size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: `${i18n.t('transactions')}`,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Icon name="file-document" size={20} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Palette.card,
    // borderTopWidth: 0,
    // marginHorizontal: 16,
    // marginBottom: 16,
    height: 80,
    // borderRadius: 26,
    // paddingBottom: 26,
    paddingTop: 10,
    // position: 'absolute',
    // shadowColor: Palette.black,
    // shadowOpacity: 0.08,
    // shadowRadius: 18,
    // shadowOffset: { width: 0, height: 8 },
    // elevation: 6,
  },
  tabItem: {
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    paddingBottom: 0,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Palette.primaryLight,
  },
});
