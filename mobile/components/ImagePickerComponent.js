import React, { useState } from "react";
import { View, Image,Text, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
// import Button from "@/components/Button";
import { Button } from 'react-native-paper';

export default function ImagePickerScreen({ onImageSelected }) {
  const [image, setImage] = useState(null);

  // Request Permissions for Camera & Gallery
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera access is needed to take pictures.");
      return false;
    }
    return true;
  };
  const loadImage = (result) => {
    if (!result.canceled) {
        setImage(result.assets[0].uri);
        onImageSelected(result.assets[0].uri);
    }
  }

  // Capture Image from Camera
  const openCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, // Enables cropping
      aspect: [4, 3], // Crop aspect ratio
      quality: 1, // High-quality image
    });
    loadImage(result);
    
  };

  // Pick Image from Gallery
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    loadImage(result);
  };

  return (
    <View style={styles.container}>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <View style={styles.buttonContainer}>
        <Button icon="camera" mode="elevated"  onPress={openCamera}>Open Camera</Button>
        
        {/* Image Picker */}
        <Button mode="elevated" onPress={pickImage}>Pick from Gallery</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },  
  buttonContainer: { 
    marginTop:10,
    flexDirection: "row", 
    justifyContent: "space-between" 
  },
  image: {
    width: "100%",
    height: 200,
  },
});