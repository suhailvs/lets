import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from "react-native";

import { Text, TextInput, Button, Snackbar, useTheme } from "react-native-paper";

import ImagePickerComponent from "@/components/ImagePickerComponent";
import Dropdown from "@/components/Dropdown";
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/constants/api'


const AddListingScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const [category, setCategory] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState("");
  const [image, setSelectedImage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { ltype } = useLocalSearchParams();
  const [categories, setCategories] = useState([]);


  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
      try {
        const response = await api.get('/ajax/?purpose=categories');
        setCategories(response.data['data']);
      } catch (error) {
          console.error('Error fetching data:', error);
      } finally {
          // setLoading(false);
      }
  };

  // Handle Form Submission
  const handleSubmit = async () => {
    if (!category || !title || !description || !rate) {
      setError("Please fill all fields.");
      return;
    }
    setError("");
    setLoading(true);

    let formData = new FormData();
    if(image){
      formData.append("image", {uri: image,name: "listing.jpg",type: "image/jpeg"});
    }    
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
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="titleLarge">Add a New {ltype==='O'? 'Offering':'Want'}</Text>
      
      {image && (
        <>
          <Dropdown label="Select Category" items={categories} onSelect={setCategory} />
          {/* Title Input */}
          <TextInput mode="outlined" label="Title" style={styles.input} value={title} onChangeText={setTitle} />
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            style={[styles.input, styles.textArea]}
          />
          <TextInput label="Rate" value={rate} onChangeText={setRate} mode="outlined" style={styles.input} />
        </>
      )}
      <ImagePickerComponent onImageSelected={setSelectedImage} />

      <Snackbar visible={!!error} onDismiss={() => setError("")} action={{ label: "OK" }}>
        {error}
      </Snackbar>
      {image && 
        <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading} style={styles.submitButton}> Add Listing </Button>}
      <Text></Text><Text></Text><Text></Text>
    </ScrollView>
  );
};

export default AddListingScreen;

const styles = StyleSheet.create({
  container: {flex: 1,padding: 20,backgroundColor: "#f4f4f4"},
  input: {marginBottom: 12},
  textArea: { height: 80 },
  submitButton: { marginTop: 12 },
});