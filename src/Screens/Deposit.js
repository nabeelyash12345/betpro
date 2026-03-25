import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
} from "react-native";
import { Entypo, Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function Withdraw({ navigation }) {
  const [selectedMethod, setSelectedMethod] = useState("easypaisa"); // easypaisa, jazzcash, bank
  const [accountHolder, setAccountHolder] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!accountHolder.trim()) {
      Alert.alert("Error", "Please enter account holder name");
      return;
    }
    if (selectedMethod === "easypaisa" || selectedMethod === "jazzcash") {
      if (!mobileNumber.trim() || mobileNumber.length < 10) {
        Alert.alert("Error", "Please enter a valid mobile number");
        return;
      }
    } else if (selectedMethod === "bank") {
      if (!bankName.trim()) {
        Alert.alert("Error", "Please enter bank name");
        return;
      }
      if (!bankAccountNumber.trim()) {
        Alert.alert("Error", "Please enter account number");
        return;
      }
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 500) {
      Alert.alert("Error", "Amount must be at least PKR 500");
      return;
    }

    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        "Success",
        "Withdrawal request submitted successfully. Funds will be transferred within 30 minutes.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Entypo name="chevron-left" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Withdraw Funds</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Instructions Section (English & Urdu) */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Instructions:</Text>
          <Text style={styles.instructionsText}>
            1. Select either EasyPaisa, JazzCash, or Bank Transfer.{'\n'}
            2. Enter the account holder name.{'\n'}
            3. For EasyPaisa/JazzCash, enter your mobile number. For Bank Transfer, enter your bank name and account number.{'\n'}
            4. Enter the amount (minimum PKR 500).{'\n'}
            5. Submit the withdrawal request.{'\n'}
            6. Funds will be transferred within 30 minutes after approval.
          </Text>
          <View style={styles.divider} />
          <Text style={styles.instructionsTitleUrdu}>ہدایات:</Text>
          <Text style={styles.instructionsTextUrdu}>
            1. ایزی پیسہ، جاز کیش یا بینک ٹرانسفر منتخب کریں۔{'\n'}
            2. اکاؤنٹ ہولڈر کا نام درج کریں۔{'\n'}
            3. ایزی پیسہ/جاز کیش کے لیے اپنا موبائل نمبر درج کریں۔ بینک ٹرانسفر کے لیے بینک کا نام اور اکاؤنٹ نمبر درج کریں۔{'\n'}
            4. رقم درج کریں (کم از کم 500 روپے)۔{'\n'}
            5. واپسی کی درخواست جمع کریں۔{'\n'}
            6. منظوری کے بعد 30 منٹ کے اندر فنڈز منتقل کیے جائیں گے۔
          </Text>
        </View>

        {/* Payment Method Selector */}
        <View style={styles.methodSection}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <View style={styles.methodButtons}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                selectedMethod === "easypaisa" && styles.methodButtonActive,
              ]}
              onPress={() => setSelectedMethod("easypaisa")}
            >
              <FontAwesome5 name="mobile-alt" size={20} color={selectedMethod === "easypaisa" ? "#fff" : "#6B7280"} />
              <Text style={[styles.methodText, selectedMethod === "easypaisa" && styles.methodTextActive]}>
                EasyPaisa
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.methodButton,
                selectedMethod === "jazzcash" && styles.methodButtonActive,
              ]}
              onPress={() => setSelectedMethod("jazzcash")}
            >
              <FontAwesome5 name="mobile-alt" size={20} color={selectedMethod === "jazzcash" ? "#fff" : "#6B7280"} />
              <Text style={[styles.methodText, selectedMethod === "jazzcash" && styles.methodTextActive]}>
                JazzCash
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.methodButton,
                selectedMethod === "bank" && styles.methodButtonActive,
              ]}
              onPress={() => setSelectedMethod("bank")}
            >
              <MaterialIcons name="account-balance" size={20} color={selectedMethod === "bank" ? "#fff" : "#6B7280"} />
              <Text style={[styles.methodText, selectedMethod === "bank" && styles.methodTextActive]}>
                Bank Transfer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Account Holder Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            value={accountHolder}
            onChangeText={setAccountHolder}
          />

          {(selectedMethod === "easypaisa" || selectedMethod === "jazzcash") ? (
            <>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                placeholder="03xxxxxxxxx"
                keyboardType="phone-pad"
                value={mobileNumber}
                onChangeText={setMobileNumber}
              />
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>Bank Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., HBL, UBL, etc."
                value={bankName}
                onChangeText={setBankName}
              />
              <Text style={styles.inputLabel}>Account Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter account number"
                keyboardType="numeric"
                value={bankAccountNumber}
                onChangeText={setBankAccountNumber}
              />
            </>
          )}

          <Text style={styles.inputLabel}>Amount (PKR)</Text>
          <TextInput
            style={styles.input}
            placeholder="Minimum 500"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            <Text style={styles.submitText}>
              {submitting ? "Submitting..." : "Submit Withdrawal Request"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* EasyPaisa Logo Placeholder (if needed) */}
        <View style={styles.logoContainer}>
          <FontAwesome5 name="mobile-alt" size={24} color="#10B981" />
          <Text style={styles.logoText}>EasyPaisa • JazzCash • Bank</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop:20
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  instructionsTitleUrdu: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'right',
  },
  instructionsTextUrdu: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    textAlign: 'right',
  },
  methodSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  methodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
  },
  methodButtonActive: {
    backgroundColor: '#10B981',
  },
  methodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  methodTextActive: {
    color: '#FFFFFF',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  submitGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  logoText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});