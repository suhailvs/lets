import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from "react-native";
import { TextInput } from "react-native-paper";

const Dropdown = ({ label, items, onSelect }) => {
  const [selectedValue, setSelectedValue] = useState(''); 
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (item) => {
    setSelectedValue(item[1]);
    onSelect(item[0]);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        label={label}
        value={selectedValue}
        mode="outlined"
        editable={false} // Prevent manual text input
        right={<TextInput.Icon icon="menu-down" onPress={() => setModalVisible(true)} />}
      />

      {/* Modal for Dropdown Options */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <FlatList
              data={items}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.option} onPress={() => handleSelect(item)}>
                  <Text style={styles.optionText}>{item[1]}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default Dropdown;

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 10,
    padding: 10,
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  optionText: {
    fontSize: 16,
  },
});
