import { useState } from 'react';
import { Pressable, Text, Modal, TouchableOpacity, StyleSheet, View, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Palette } from "@/constants/Colors";

export default function ImagePreview({ imageUri }) {
  const [visible, setVisible] = useState(false);

  if (!imageUri) return null;

  return (
    <>
      {/* ── Thumbnail card ──────────────────────────────── */}
      <TouchableOpacity
        style={styles.thumbnailCard}
        onPress={() => setVisible(true)}
        activeOpacity={0.88}
      >
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          style={styles.thumbnail}
          transition={200}
        />
        {/* Tap-to-expand hint */}
        <View style={styles.expandHint}>
          <Icon name="arrow-expand" size={13} color="#fff" />
          <Text style={styles.expandHintText}>Tap to view</Text>
        </View>
      </TouchableOpacity>

      {/* ── Fullscreen modal ────────────────────────────── */}
      <Modal visible={visible} animationType="fade" statusBarTranslucent>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.modalBg}>

          {/* Top bar */}
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTitle}>PHOTO</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setVisible(false)}>
              <Icon name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Full image */}
          <Image
            source={imageUri}
            style={styles.fullImage}
            contentFit="contain"
            transition={200}
          />

          {/* Bottom dismiss hint */}
          <View style={styles.modalBottom}>
            <View style={styles.dismissPill}>
              <Text style={styles.dismissText}>Tap anywhere to close</Text>
            </View>
          </View>

          {/* Tap anywhere to close */}
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setVisible(false)}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Thumbnail ─────────────────────────────────────────────
  thumbnailCard: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f2f5',
  },

  thumbnail: {
    width: '100%',
    height: '100%',
  },

  expandHint: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  expandHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },

  // ── Modal ─────────────────────────────────────────────────
  modalBg: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
  },

  modalTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modalTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fullImage: {
    width: '100%',
    height: '100%',
  },

  modalBottom: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },

  dismissPill: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  dismissText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});