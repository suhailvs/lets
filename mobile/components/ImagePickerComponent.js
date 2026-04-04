import { useRef, useState } from "react";
import { Image } from "expo-image";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ImageManipulator } from "expo-image-manipulator";
import { Palette } from "@/constants/Colors";

export default function ImagePickerScreen({ onImageSelected }) {
  const [permission, requestPermission] = useCameraPermissions();
  const ref     = useRef(null);
  const [uri, setUri]       = useState(null);
  const [facing, setFacing] = useState("back");

  if (!permission) return null;

  // ── Permission gate ──────────────────────────────────────
  if (!permission.granted) {
    return (
      <View style={styles.permissionCard}>
        <View style={styles.permissionIconWrap}>
          <Icon name="camera-off-outline" size={32} color={Palette.primary} />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionSub}>
          We need your permission to take a profile photo
        </Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
          <Icon name="camera-outline" size={16} color="#fff" />
          <Text style={styles.grantBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    const photo = await ref.current?.takePictureAsync();
    if (photo?.uri) {
      const thumb = await createThumbnail(photo);
      setUri(thumb);
      onImageSelected(thumb);
    }
  };

  async function createThumbnail(photo) {
    const size    = Math.min(photo.width, photo.height);
    const originX = (photo.width  - size) / 2;
    const originY = (photo.height - size) / 2;
    const context = ImageManipulator.manipulate(photo.uri);
    context.crop({ originX, originY, width: size, height: size });
    context.resize({ width: 512, height: 512 });
    const image  = await context.renderAsync();
    const result = await image.saveAsync({ compress: 0.7, format: "jpeg" });
    return result.uri;
  }

  const toggleFacing = () =>
    setFacing((prev) => (prev === "back" ? "front" : "back"));

  // ── Preview after capture ────────────────────────────────
  if (uri) {
    return (
      <View style={styles.previewCard}>
        <Text style={styles.sectionLabel}>PREVIEW</Text>
        <View style={styles.previewImageWrap}>
          <Image
            source={{ uri }}
            contentFit="cover"
            style={styles.previewImage}
          />
          {/* Green check badge */}
          <View style={styles.checkBadge}>
            <Icon name="check" size={14} color="#fff" />
          </View>
        </View>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.retakeBtn} onPress={() => setUri(null)}>
          <Icon name="camera-retake-outline" size={16} color={Palette.primary} />
          <Text style={styles.retakeBtnText}>Retake Photo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Camera view ───────────────────────────────────────────
  return (
    <View style={styles.cameraCard}>
      {/* Viewfinder */}
      <View style={styles.viewfinderWrap}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          ref={ref}
          mode="picture"
          facing={facing}
          mute={false}
          responsiveOrientationWhenOrientationLocked
        />

        {/* Corner brackets */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        {/* Facing badge */}
        <View style={styles.facingBadge}>
          <Icon
            name={facing === "back" ? "camera-rear-variant" : "camera-front-variant"}
            size={12}
            color="#fff"
          />
          <Text style={styles.facingBadgeText}>
            {facing === "back" ? "REAR" : "FRONT"}
          </Text>
        </View>
      </View>

      {/* Controls row */}
      <View style={styles.controls}>

        {/* Gallery placeholder / icon */}
        <View style={styles.sideBtn}>
          <AntDesign name="picture" size={22} color={Palette.textMid} />
        </View>

        {/* Shutter */}
        <Pressable onPress={takePicture}>
          {({ pressed }) => (
            <View style={[styles.shutter, pressed && styles.shutterPressed]}>
              <View style={styles.shutterInner} />
            </View>
          )}
        </Pressable>

        {/* Flip */}
        <TouchableOpacity style={styles.sideBtn} onPress={toggleFacing}>
          <FontAwesome6 name="rotate-left" size={20} color={Palette.textMid} />
        </TouchableOpacity>

      </View>
    </View>
  );
}

const CORNER = 18;
const BORDER = 3;

const styles = StyleSheet.create({

  // ── Permission card ───────────────────────────────────────
  permissionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 10,
  },
  permissionIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.textDark,
  },
  permissionSub: {
    fontSize: 13,
    color: Palette.textMid,
    textAlign: 'center',
    lineHeight: 18,
  },
  grantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: Palette.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 40,
    shadowColor: Palette.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  grantBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // ── Preview card ──────────────────────────────────────────
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: Palette.textMid,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  previewImageWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  previewImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: '#e8eaed',
  },
  checkBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#e8eaed',
    width: '100%',
    marginVertical: 14,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retakeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.primary,
  },

  // ── Camera card ───────────────────────────────────────────
  cameraCard: {
    backgroundColor: '#111',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  viewfinderWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    position: 'relative',
    overflow: 'hidden',
  },

  // Corner bracket overlays
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
  },
  cornerTL: {
    top: 16, left: 16,
    borderTopWidth: BORDER, borderLeftWidth: BORDER,
    borderColor: '#fff', borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 16, right: 16,
    borderTopWidth: BORDER, borderRightWidth: BORDER,
    borderColor: '#fff', borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 16, left: 16,
    borderBottomWidth: BORDER, borderLeftWidth: BORDER,
    borderColor: '#fff', borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 16, right: 16,
    borderBottomWidth: BORDER, borderRightWidth: BORDER,
    borderColor: '#fff', borderBottomRightRadius: 6,
  },

  facingBadge: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  facingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#fff',
  },

  // Controls bar below camera
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 24,
    backgroundColor: '#111',
  },

  sideBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.94 }],
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
});