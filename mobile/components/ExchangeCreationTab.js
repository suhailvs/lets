import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from '@/constants/api';
import { Palette } from "@/constants/Colors";

// ── Reusable field row (same as RegisterScreen) ──────────────
function FieldRow({ icon, label, last = false, children }) {
  return (
    <View style={[field.row, last && { borderBottomWidth: 0, paddingBottom: 0 }]}>
      <View style={field.iconWrap}>
        <Icon name={icon} size={17} color={Palette.primary} />
      </View>
      <View style={[field.body, last && { borderBottomWidth: 0 }]}>
        <Text style={field.label}>{label}</Text>
        {children}
      </View>
    </View>
  );
}

const field = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  body: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#e8eaed',
    paddingBottom: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Palette.textMid,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
});

// ── Picker wrapper styled to match ──────────────────────────
function StyledPicker({ selectedValue, onValueChange, enabled = true, children }) {
  return (
    <View style={[styles.pickerWrap, !enabled && styles.pickerDisabled]}>
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        enabled={enabled}
        style={styles.picker}
      >
        {children}
      </Picker>
    </View>
  );
}

export default function ExchangeCreationTab({ onExchangeSelected }) {
  const [activeTab, setActiveTab]             = useState("join");
  const [exchanges, setExchanges]             = useState([]);
  const [countries, setCountries]             = useState([]);
  const [states, setStates]                   = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState]     = useState("");
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
    } else {
      onExchangeSelected(createPayload(createForm));
    }
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
    if (!countryCode) { setStates([]); return; }
    try {
      const response = await api.get(`/ajax/?purpose=states&country=${countryCode}`);
      setStates(response.data["data"] || []);
    } catch { setStates([]); }
  };

  const handleStateChange = (stateCode) => {
    setSelectedState(stateCode);
    onExchangeSelected({ ...createPayload(createForm), exchange_country_city: stateCode });
  };

  const fetchExchanges = async () => {
    try {
      const response = await api.get('/ajax/?purpose=exchanges');
      setExchanges(response.data['data']);
    } catch (e) { console.error(e); }
  };

  const fetchCountries = async () => {
    try {
      const response = await api.get('/ajax/?purpose=countries');
      setCountries(response.data['data'] || []);
    } catch (e) { console.error(e); }
  };

  return (
    <View style={styles.wrapper}>

      {/* ── Tab toggle ──────────────────────────────────── */}
      <View style={styles.tabRow}>
        {[
          { key: 'join',   icon: 'account-arrow-right-outline', label: 'Join'   },
          { key: 'create', icon: 'plus-circle-outline',          label: 'Create' },
        ].map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => handleTabChange(tab.key)}
              activeOpacity={0.8}
            >
              <Icon
                name={tab.icon}
                size={16}
                color={active ? Palette.primary : Palette.textMid}
              />
              <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Join panel ──────────────────────────────────── */}
      {activeTab === "join" && (
        <View style={styles.panel}>
          <Text style={styles.sectionLabel}>SELECT EXCHANGE</Text>

          <FieldRow icon="swap-horizontal" label="Exchange" last>
            <StyledPicker
              selectedValue={selectedExchange}
              onValueChange={handleJoinExchangeChange}
            >
              <Picker.Item label="Choose an exchange…" value="" />
              {exchanges.map((item) => (
                <Picker.Item key={item[0]} label={item[1]} value={item[0]} />
              ))}
            </StyledPicker>
          </FieldRow>
        </View>
      )}

      {/* ── Create panel ────────────────────────────────── */}
      {activeTab === "create" && (
        <View style={styles.panel}>
          <Text style={styles.sectionLabel}>NEW EXCHANGE DETAILS</Text>

          <FieldRow icon="identifier" label="Exchange Code (4 chars)">
            <TextInput
              style={styles.input}
              placeholder="e.g. LETS"
              placeholderTextColor="#b0bec5"
              value={createForm.exchange_code}
              onChangeText={(v) => handleCreateFieldChange("exchange_code", v)}
              autoCapitalize="characters"
              maxLength={4}
            />
          </FieldRow>

          <FieldRow icon="office-building-outline" label="Exchange Name">
            <TextInput
              style={styles.input}
              placeholder="e.g. Kozhikode LETS"
              placeholderTextColor="#b0bec5"
              value={createForm.exchange_name}
              onChangeText={(v) => handleCreateFieldChange("exchange_name", v)}
            />
          </FieldRow>

          <FieldRow icon="map-marker-outline" label="Address">
            <TextInput
              style={styles.input}
              placeholder="Street / locality"
              placeholderTextColor="#b0bec5"
              value={createForm.exchange_address}
              onChangeText={(v) => handleCreateFieldChange("exchange_address", v)}
            />
          </FieldRow>

          <FieldRow icon="earth" label="Country">
            <StyledPicker
              selectedValue={selectedCountry}
              onValueChange={handleCountryChange}
            >
              <Picker.Item label="Select country…" value="" />
              {countries.map((item) => (
                <Picker.Item key={item[0]} label={item[1]} value={item[0]} />
              ))}
            </StyledPicker>
          </FieldRow>

          <FieldRow icon="map-outline" label="State / Region">
            <StyledPicker
              selectedValue={selectedState}
              onValueChange={handleStateChange}
              enabled={!!selectedCountry}
            >
              <Picker.Item label={selectedCountry ? "Select state…" : "Select country first"} value="" />
              {states.map((item) => (
                <Picker.Item key={item[0]} label={item[1]} value={item[0]} />
              ))}
            </StyledPicker>
          </FieldRow>

          <FieldRow icon="mailbox-outline" label="Postal Code" last>
            <TextInput
              style={styles.input}
              placeholder="e.g. 673001"
              placeholderTextColor="#b0bec5"
              value={createForm.exchange_postal_code}
              onChangeText={(v) => handleCreateFieldChange("exchange_postal_code", v)}
              keyboardType="numeric"
            />
          </FieldRow>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },

  // ── Tab toggle ────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f2f5',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },

  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    borderRadius: 11,
  },

  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.textMid,
  },

  tabBtnTextActive: {
    color: Palette.primary,
    fontWeight: '700',
  },

  // ── Panel ─────────────────────────────────────────────────
  panel: {
    gap: 0,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: Palette.textMid,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  // ── Input ─────────────────────────────────────────────────
  input: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.textDark,
    paddingVertical: 2,
  },

  // ── Picker wrapper ────────────────────────────────────────
  pickerWrap: {
    backgroundColor: '#f5f6f8',
    borderRadius: 10,
    marginTop: 2,
    overflow: 'hidden',
  },

  pickerDisabled: {
    opacity: 0.45,
  },

  picker: {
    color: Palette.textDark,
  },
});