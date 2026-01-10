import { SegmentedButtons } from 'react-native-paper';
import { StyleSheet, View, Text } from 'react-native';
import { useState } from 'react';
import Listings from "@/components/Listings";
const AllListingComponent = () => {
  const [value, setValue] = useState('offerings');

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={value}
        onValueChange={setValue}
        buttons={[
          { value: 'offerings', label: 'Offerings', icon: 'cart', },
          { value: 'wants', label: 'Wants', icon: 'shopping' },
        ]}
      />
      <View style={styles.content}>
        {value === 'offerings' && <Listings ltype="O"/>}
        {value === 'wants' && <Listings ltype="W"/>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default AllListingComponent;