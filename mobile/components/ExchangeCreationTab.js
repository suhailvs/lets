import { useState,useEffect } from "react";
import { View, Text } from "react-native";
import { SegmentedButtons } from 'react-native-paper';
import { Picker } from "@react-native-picker/picker";
import api from '@/constants/api'

export default function ExchangeCreationTab({onExchangeSelected}) {
  const [activeTab, setActiveTab] = useState("join");
  const [exchanges, setExchanges] = useState([]);
  
  useEffect(() => {
    fetchExchanges();
  }, []);

  const fetchExchanges = async () => {
    try {
      const response = await api.get('/ajax/?purpose=exchanges');
      setExchanges(response.data['data']);
    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        // setLoading(false);
    }
  };
  return (
    <View>
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'join', label: 'Join Exchange' },
          { value: 'create', label: 'Create New Exchange' },
        ]}
      />
      {/* Card Area */}
      <View style={{ marginTop: 30, padding: 20, borderWidth: 1 }}>
        {activeTab === "join" && <>
          <Text>Join Exchange</Text>
          <Picker onValueChange={onExchangeSelected} >
            <Picker.Item key="" label="Select an Exchange" value="" />
            {exchanges.map((item) => (
              <Picker.Item key={item[0]} label={item[1]} value={item[0]} />
            ))}
          </Picker>
        </>}
        {activeTab === "create" && <Text>Create New Exchange</Text>}
      </View>
    </View>
  );
}