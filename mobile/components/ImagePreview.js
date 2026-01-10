import { Pressable,Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useState } from 'react';

export default function ImagePreview({ imageUri }) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      {/* Thumbnail */}
      <TouchableOpacity onPress={() => setVisible(true)}>
        <Image source={{ uri: imageUri }} contentFit="contain" style={{ width: 300, aspectRatio: 1 }} />
      </TouchableOpacity>

      {/* Fullscreen preview */}
      <Modal visible={visible} animationType="fade">
        <TouchableOpacity
          style={styles.modal}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          {/* Close Button */}
          <Pressable style={styles.close} onPress={() => setVisible(false)}>
            <Text style={{ color: 'white', fontSize: 18 }}>✕</Text>
          </Pressable>
          <Image
            source={imageUri}
            style={styles.fullImage}
            contentFit="contain"
            transition={200}
          />
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  close: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
