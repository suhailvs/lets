import { useState,useEffect } from "react";
import { View, Text } from "react-native";
import { SegmentedButtons, TextInput } from 'react-native-paper';
import { Picker } from "@react-native-picker/picker";
import api from '@/constants/api'

export default function ExchangeCreationTab({onExchangeSelected}) {
  const [activeTab, setActiveTab] = useState("join");
  const [exchanges, setExchanges] = useState([]);
  const [selectedExchange, setSelectedExchange] = useState("");
  const [exchangeCode, setExchangeCode] = useState("");
  const [exchangeName, setExchangeName] = useState("");
  const [exchangeAddress, setExchangeAddress] = useState("");
  const [exchangeCountryCity, setExchangeCountryCity] = useState("");
  const [exchangePostalCode, setExchangePostalCode] = useState("");
  
  useEffect(() => {
    fetchExchanges();
  }, []);

  useEffect(() => {
    if (activeTab === "join") {
      onExchangeSelected({ mode: "join", exchange: selectedExchange });
      return;
    }
    onExchangeSelected({
      mode: "create",
      exchange_code: exchangeCode,
      exchange_name: exchangeName,
      exchange_address: exchangeAddress,
      exchange_country_city: exchangeCountryCity,
      exchange_postal_code: exchangePostalCode,
    });
  }, [
    activeTab,
    selectedExchange,
    exchangeCode,
    exchangeName,
    exchangeAddress,
    exchangeCountryCity,
    exchangePostalCode,
    onExchangeSelected,
  ]);

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
          <Picker selectedValue={selectedExchange} onValueChange={setSelectedExchange} >
            <Picker.Item key="" label="Select an Exchange" value="" />
            {exchanges.map((item) => (
              <Picker.Item key={item[0]} label={item[1]} value={item[0]} />
            ))}
          </Picker>
        </>}
        {activeTab === "create" && <>
          <Text>Create New Exchange</Text>
          <TextInput
            label="Exchange Code (4 chars)"
            value={exchangeCode}
            onChangeText={setExchangeCode}
            mode="outlined"
            autoCapitalize="characters"
            style={{ marginTop: 10 }}
          />
          <TextInput
            label="Exchange Name"
            value={exchangeName}
            onChangeText={setExchangeName}
            mode="outlined"
            style={{ marginTop: 10 }}
          />
          <TextInput
            label="Address"
            value={exchangeAddress}
            onChangeText={setExchangeAddress}
            mode="outlined"
            style={{ marginTop: 10 }}
          />
          <TextInput
            label="Country/City Code"
            value={exchangeCountryCity}
            onChangeText={setExchangeCountryCity}
            mode="outlined"
            autoCapitalize="characters"
            placeholder="IN-KL"
            style={{ marginTop: 10 }}
          />
          <TextInput
            label="Postal Code"
            value={exchangePostalCode}
            onChangeText={setExchangePostalCode}
            mode="outlined"
            style={{ marginTop: 10 }}
          />
        </>}
      </View>
    </View>
  );
}
