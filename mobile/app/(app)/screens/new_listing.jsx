import { useEffect, useState } from 'react';
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

  const handleGenerateDetail = async () => {
    setLoadingDescription(true);
    let url = "https://shihas.stackschools.com/ajax/stackcoinai/"; 

    let text_startswith = "";
    if (ltype==='O') {
      text_startswith = "Create an offering description for local exchange trading system where I can offer activity or things like";
    } else {
      text_startswith = "Create a wants description for local exchange trading system where I want ";
    }
    try {
      // const response = await axios.get(`${url}?details=${text_startswith} ${title}`);
      const response = {data: ''};
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
          {loadingDescription ? "Processing..." : "Enter description"}
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