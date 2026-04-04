import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TermsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Terms & Conditions</Text>
      </View>

      {/* Scrollable Terms */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <Text style={styles.text}>
          Please read these terms and conditions carefully before using the app.

1. You agree to use the app responsibly.
2. All payments are non-refundable.
3. We are not responsible for delays caused by third parties.
4. Your data will be handled securely.
5. By using this app, you accept all the terms listed above.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    padding: 6,
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: "#444",
  },
});