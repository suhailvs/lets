import { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { SegmentedButtons, TextInput } from 'react-native-paper';
import { Picker } from "@react-native-picker/picker";
import api from '@/constants/api'

export default function ExchangeCreationTab({onExchangeSelected}) {
  const [activeTab, setActiveTab] = useState("join");
  const [exchanges, setExchanges] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedExchange, setSelectedExchange] = useState("");
  const [createForm, setCreateForm] = useState({
    exchange_code: "",
    exchange_name: "",
    exchange_address: "",
    exchange_postal_code: "",
  });
  
  useEffect(() => {
    fetchExchanges();
    fetchCountries();
  }, []);

  const createPayload = (form, stateCode = selectedState) => ({
    mode: "create",
    ...form,
    exchange_country_city: stateCode,
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "join") {
      onExchangeSelected({ mode: "join", exchange: selectedExchange });
      return;
    }
    onExchangeSelected(createPayload(createForm));
  };

  const handleJoinExchangeChange = (value) => {
    setSelectedExchange(value);
    onExchangeSelected({ mode: "join", exchange: value });
  };

  const handleCreateFieldChange = (field, value) => {
    const next = { ...createForm, [field]: value };
    setCreateForm(next);
    onExchangeSelected(createPayload(next));
  };

  const handleCountryChange = async (countryCode) => {
    setSelectedCountry(countryCode);
    setSelectedState("");
    onExchangeSelected(createPayload(createForm, ""));
    if (!countryCode) {
      setStates([]);
      return;
    }
    try {
      const response = await api.get(`/ajax/?purpose=states&country=${countryCode}`);
      setStates(response.data["data"] || []);
    } catch (error) {
      console.error("Error fetching states:", error);
      setStates([]);
    }
  };

  const handleStateChange = (stateCode) => {
    setSelectedState(stateCode);
    onExchangeSelected({
      ...createPayload(createForm),
      exchange_country_city: stateCode,
    });
  };

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

  const fetchCountries = async () => {
    try {
      const response = await api.get('/ajax/?purpose=countries');
      setCountries(response.data['data'] || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
      setCountries([]);
    }
  };

  return (
    <View>
      <SegmentedButtons
        value={activeTab}
        onValueChange={handleTabChange}
        buttons={[
          { value: 'join', label: 'Join Exchange' },
          { value: 'create', label: 'Create New Exchange' },
        ]}
      />
      {/* Card Area */}
      <View style={{ marginTop: 30, padding: 20, borderWidth: 1 }}>
        {activeTab === "join" && <>
          <Text>Join Exchange</Text>
          <Picker selectedValue={selectedExchange} onValueChange={handleJoinExchangeChange} >
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
            value={createForm.exchange_code}
            onChangeText={(value) => handleCreateFieldChange("exchange_code", value)}
            mode="outlined"
            autoCapitalize="characters"
            style={{ marginTop: 10 }}
          />
          <TextInput
            label="Exchange Name"
            value={createForm.exchange_name}
            onChangeText={(value) => handleCreateFieldChange("exchange_name", value)}
            mode="outlined"
            style={{ marginTop: 10 }}
          />
          <TextInput
            label="Address"
            value={createForm.exchange_address}
            onChangeText={(value) => handleCreateFieldChange("exchange_address", value)}
            mode="outlined"
            style={{ marginTop: 10 }}
          />
          <Text style={{ marginTop: 12 }}>Country</Text>
          <Picker selectedValue={selectedCountry} onValueChange={handleCountryChange}>
            <Picker.Item key="" label="Select Country" value="" />
            {countries.map((item) => (
              <Picker.Item key={item[0]} label={item[1]} value={item[0]} />
            ))}
          </Picker>
          <Text style={{ marginTop: 8 }}>State</Text>
          <Picker selectedValue={selectedState} onValueChange={handleStateChange} enabled={!!selectedCountry}>
            <Picker.Item key="" label="Select State" value="" />
            {states.map((item) => (
              <Picker.Item key={item[0]} label={item[1]} value={item[0]} />
            ))}
          </Picker>
          <TextInput
            label="Postal Code"
            value={createForm.exchange_postal_code}
            onChangeText={(value) => handleCreateFieldChange("exchange_postal_code", value)}
            mode="outlined"
            style={{ marginTop: 10 }}
          />
        </>}
      </View>
    </View>
  );
}
