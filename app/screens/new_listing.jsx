import { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";

import { Text, TextInput, Button, Snackbar, useTheme } from "react-native-paper";

import ImagePickerComponent from "@/components/ImagePickerComponent";
import Dropdown from "@/components/Dropdown";
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from "axios";
import api from '@/constants/api'


const AddListingScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const [category, setCategory] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState("");
  const [image, setSelectedImage] = useState(null);
  const [loadingDescription, setLoadingDescription] = useState(false);
  const [showDescription, setShowDescription] = useState(false);  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { ltype } = useLocalSearchParams();
  const categories = ["Electronics","Clothing"];
  //   { label: "Electronics", value: "electronics" },
  //   { label: "Clothing", value: "clothing" },
  //   { label: "Books", value: "books" },
  // ];
  // Handle Form Submission
  const handleSubmit = async () => {
    if (!category || !title || !description || !rate || !image) {
      setError("Please fill all fields.");
      return;
    }
    setError("");
    setLoading(true);

    let formData = new FormData();
    formData.append("image", {uri: image,name: "upload.jpg",type: "image/jpeg"});
    formData.append("category", category);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("rate", rate);
    formData.append("listing_type", ltype);
    try {
      await api.post('/listings/', formData, { headers: { "Content-Type": "multipart/form-data" } });
      router.replace({ pathname: '/' });
    } catch (error) {
      setError(error.response?.data || "Something went wrong.");
    } finally {
      setLoading(false);
    }   
  };

  const handleGenerateDetail = async () => {
    setLoadingDescription(true);
    let url = "https://shihas.stackschools.com/ajax/stackcoinai/"; 
    try {
      const response = await axios.get(`${url}?details=${title}`);
      // const response = {data: 'This is a Dummy description for testing purpose'};
      setDescription(response.data);
      setShowDescription(true);
    } catch (error) {
      setError("Failed to generate description.");
    } finally {
    setLoadingDescription(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="titleLarge">Add a New {ltype==='O'? 'Offering':'Want'}</Text>
      <Dropdown
        label="Select Category"
        items={categories}
        // selectedValue={selectedCategory}
        onSelect={setCategory}
      />
      {/* Title Input */}
      <TextInput mode="outlined" label="Title" style={styles.input} value={title} onChangeText={setTitle} />

      {showDescription ? (
        <>
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            style={[styles.input, styles.textArea]}
          />
          <TextInput label="Rate" value={rate} onChangeText={setRate} mode="outlined" style={styles.input} />
          <ImagePickerComponent onImageSelected={setSelectedImage} />
          <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading} style={styles.submitButton}>
            Add Listing
          </Button>
        </>
      ) : (
        <Button 
          mode="contained" 
          loading={loadingDescription} 
          disabled={loadingDescription} 
          onPress={handleGenerateDetail}
        >
          {loadingDescription ? "Processing..." : "Generate description from title"}
        </Button>
      )}

      <Snackbar visible={!!error} onDismiss={() => setError("")} action={{ label: "OK" }}>
        {error}
      </Snackbar>
      <Text></Text><Text></Text><Text></Text>
    </ScrollView>
  );
};

export default AddListingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f4f4",
  },
  input: {
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
  },
  textArea: {
    height: 380,
    textAlignVertical: "top",
  },
  submitButton: {
    marginTop: 12,
  },
});