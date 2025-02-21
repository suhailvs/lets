import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useSession } from "@/login_extras/ctx";

import AccountBalance from "@/components/AccountBalance";
const transactions = [
  { id: "1", title: "Amazon Order", amount: "-$25.99", date: "Feb 5, 2025" },
  { id: "2", title: "Received from John", amount: "+$50.00", date: "Feb 4, 2025" },
  { id: "3", title: "Electricity Bill", amount: "-$100.00", date: "Feb 3, 2025" },
];

export default function HomeScreen() {
  const { signOut } = useSession();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: () => signOut() }, // Replace with actual logout logic
    ]);
  };
  return (
    <View style={styles.container}>
      {/* Account Balance */}
      <AccountBalance />
      

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={28} color="#FF9900" />
          <Text style={styles.actionText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="send" size={28} color="#FF9900" />
          <Text style={styles.actionText}>Send Money</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="add-circle-outline" size={28} color="#FF9900" />
          <Text style={styles.actionText}>Add Money</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="qrcode-scan" size={28} color="#FF9900" />
          <Text style={styles.actionText}>Scan QR</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Transactions */}
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.transactionItem}>
            <Text style={styles.transactionTitle}>{item.title}</Text>
            <Text style={[styles.transactionAmount, item.amount.startsWith("+") ? styles.positive : styles.negative]}>
              {item.amount}
            </Text>
            <Text style={styles.transactionDate}>{item.date}</Text>
          </View>
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  
  quickActions: { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  actionButton: { alignItems: "center" },
  actionText: { marginTop: 5, fontSize: 14, fontWeight: "500", color: "#333" },

  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },

  transactionItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#ddd" },
  transactionTitle: { fontSize: 16, fontWeight: "500" },
  transactionAmount: { fontSize: 16, fontWeight: "bold", position: "absolute", right: 10, top: 15 },
  transactionDate: { fontSize: 12, color: "gray", marginTop: 2 },
  positive: { color: "green" },
  negative: { color: "red" },
});