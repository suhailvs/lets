import { useRef, useState } from "react";
import { Image } from "expo-image";
import {
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { Button, Pressable, StyleSheet, Text, View } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";


export default function ImagePickerScreen({ onImageSelected }) {
  // const [image, setImage] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef(null);
  const [uri, setUri] = useState(null);
  const [facing, setFacing] = useState("back");
  
  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to use the camera
        </Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }
  
  const takePicture = async () => {
    const photo = await ref.current?.takePictureAsync();
    if (photo?.uri) {
      setUri(photo.uri);
      onImageSelected(photo.uri);
    }
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const renderPicture = (uri) => {    
    return (<Image source={{ uri }} contentFit="contain" style={{ width: 300, aspectRatio: 1 }} />);
  };

  const renderCamera = () => {
    return (
      <View style={{ width: "100%", aspectRatio: 3 / 4 }}>
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            ref={ref}
            mode={"picture"}
            facing={facing}
            mute={false}
            responsiveOrientationWhenOrientationLocked
          />
          <View style={styles.shutterContainer}>
            <AntDesign name="picture" size={32} color="white" />
            <Pressable onPress={takePicture}>
              {({ pressed }) => (
                <View style={[styles.shutterBtn,{opacity: pressed ? 0.5 : 1,},]}>
                  <View style={[styles.shutterBtnInner,  { backgroundColor: "white" }, ]} />
                </View>
              )}
            </Pressable>
            <Pressable onPress={toggleFacing}>
              <FontAwesome6 name="rotate-left" size={32} color="white" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };
  
  
  return (
    <View>
      {uri ? renderPicture(uri) : renderCamera()}
    </View>
  );
}
  

const styles = StyleSheet.create({
  cameraContainer: StyleSheet.absoluteFillObject,
  camera: StyleSheet.absoluteFillObject,
  shutterContainer: {
    position: "absolute",
    bottom: 44,
    left: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
});
  
  
  
  
  
  
  