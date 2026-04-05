import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Listings from "@/components/Listings";
import i18n from '@/constants/i18n';
import { Palette } from '@/constants/Colors';

const AllListingComponent = () => {
  const [value, setValue] = useState('offerings');
  global.selectedUserId = 'all';

  const tabs = [
    { key: 'offerings', ltype: 'O', icon: 'tag-outline',   label: i18n.t('offerings') },
    { key: 'wants',     ltype: 'W', icon: 'heart-outline',  label: i18n.t('wants')     },
  ];

  return (
    <View style={styles.container}>

      {/* ── Toggle ──────────────────────────────────────── */}
      <View style={styles.tabWrap}>
        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const active = value === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => setValue(tab.key)}
                activeOpacity={0.8}
              >
                <Icon
                  name={tab.icon}
                  size={15}
                  color={active ? Palette.primary : Palette.textMid}
                />
                <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Content ─────────────────────────────────────── */}
      <View style={styles.content}>
        {tabs.map((tab) =>
          value === tab.key ? <Listings key={tab.key} ltype={tab.ltype} /> : null
        )}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },

  tabWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    borderRadius: 11,
  },

  tabBtnActive: {
    backgroundColor: Palette.primaryLight,
  },

  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textMid,
  },

  tabBtnTextActive: {
    color: Palette.primary,
    fontWeight: '700',
  },

  content: {
    flex: 1,
  },
});

export default AllListingComponent;