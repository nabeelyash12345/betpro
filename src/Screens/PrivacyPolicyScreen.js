import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PrivacyPolicyScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Privacy Policy</Text>

        <View style={{ width: 24 }} /> 
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} style={{paddingHorizontal:20}}>
        
        <Text style={styles.sectionTitle}>Overview</Text>
        <Text style={styles.text}>
          Bprolive uses the device camera and media library to allow users to take
          photos or select images from their device.
        </Text>

        <Text style={styles.sectionTitle}>Data Usage</Text>
        <Text style={styles.text}>
          We do not collect, store, or share any personal data, images, or videos.
          All images are used only داخل التطبيق (within the app).
        </Text>

        <Text style={styles.sectionTitle}>Permissions</Text>
        <Text style={styles.text}>
          Camera permission is requested only when needed. Users can allow or deny
          access anytime through their device settings.
        </Text>

        <Text style={styles.sectionTitle}>Third Parties</Text>
        <Text style={styles.text}>
          We do not share any data with third parties.
        </Text>

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.text}>
          If you have any questions, please contact us.
        </Text>

      </ScrollView>
    </View>
  );
};

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginTop:50
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginTop: 20,
    marginBottom: 6,
  },

  text: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
  },

  containerInner: {
    padding: 16,
  },
});