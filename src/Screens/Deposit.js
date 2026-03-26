// src/Screens/Withdraw.js
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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  Modal,
  Dimensions
} from "react-native";
import { Entypo, Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from "../context/AuthContext";
import { createOrder } from "../services/orderService";

const { width } = Dimensions.get('window');

export default function Withdraw({ navigation }) {
  const { user, userProfile } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState("easypaisa");
  const [accountHolder, setAccountHolder] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Request permission and pick image
  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Sorry, we need camera roll permissions to upload screenshots!');
        return;
      }

      // Launch image picker
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
        base64: true,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const base64Data = result.assets[0].base64;
        
        console.log('Image URI:', imageUri);
        console.log('Base64 length:', base64Data ? base64Data.length : 0);
        
        // Generate data URL from the image
        const dataUrl = base64Data ? `data:image/jpeg;base64,${base64Data}` : null;
        
        setScreenshot({
          uri: imageUri,
          dataUrl: dataUrl,
          base64: base64Data
        });
        setImageError(false);
      } else {
        console.log('Image selection cancelled or no image data');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setScreenshot(null);
    setImageError(false);
  };

  // Handle image loading error
  const handleImageError = (error) => {
    console.error('Image loading error:', error);
    setImageError(true);
  };

  // Map method names to match order service
  const getPaymentMethod = () => {
    switch(selectedMethod) {
      case "easypaisa":
        return "EASYPAISA";
      case "jazzcash":
        return "JAZZCASH";
      case "bank":
        return "BANK";
      default:
        return "BANK";
    }
  };

  // Get account number based on method
  const getAccountNumber = () => {
    switch(selectedMethod) {
      case "easypaisa":
        return mobileNumber;
      case "jazzcash":
        return mobileNumber;
      case "bank":
        return bankAccountNumber;
      default:
        return "";
    }
  };

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

    if (!user) {
      Alert.alert("Error", "You must be logged in to withdraw");
      return;
    }

    setSubmitting(true);

    // Prepare withdrawal note
    let withdrawalNote = `Withdrawal Request\n`;
    withdrawalNote += `Account Holder: ${accountHolder}\n`;
    withdrawalNote += `Method: ${selectedMethod.toUpperCase()}\n`;
    
    if (selectedMethod === "easypaisa" || selectedMethod === "jazzcash") {
      withdrawalNote += `Mobile Number: ${mobileNumber}\n`;
    } else {
      withdrawalNote += `Bank: ${bankName}\n`;
      withdrawalNote += `Account Number: ${bankAccountNumber}\n`;
    }
    withdrawalNote += `Amount: PKR ${numAmount}\n`;
    withdrawalNote += `User: ${user.email}\n`;
    withdrawalNote += notes ? `Additional Notes: ${notes}\n` : '';

    // Create order in database with screenshot URL
    const orderData = {
      type: getPaymentMethod(),
      amount: numAmount,
      accountNumber: getAccountNumber(),
      paymentMethod: getPaymentMethod(),
      notes: withdrawalNote,
      isDeposit: false,
      status: 'pending',
      screenshot: screenshot ? screenshot.dataUrl : null
    };

    const result = await createOrder(user.uid, orderData);

    setSubmitting(false);

    if (result.success) {
      Alert.alert(
        "Withdrawal Request Submitted",
        `Your withdrawal request #${result.order.orderNumber} has been submitted successfully.\n\nAmount: PKR ${numAmount}\nMethod: ${selectedMethod.toUpperCase()}\n\nFunds will be transferred within 30 minutes after approval.`,
        [
          { 
            text: "View Orders", 
            onPress: () => navigation.navigate("Orders") 
          },
          { 
            text: "OK", 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } else {
      Alert.alert("Error", "Failed to submit withdrawal request: " + result.error);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
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

              <Text style={styles.inputLabel}>Payment Screenshot (Optional)</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <FontAwesome5 name="camera" size={20} color="#10B981" />
                <Text style={styles.imagePickerText}>
                  {screenshot ? 'Change Screenshot' : 'Upload Payment Screenshot'}
                </Text>
              </TouchableOpacity>

              {screenshot && (
                <View style={styles.imagePreviewContainer}>
                  <TouchableOpacity onPress={() => setShowImageModal(true)}>
                    <Image 
                      source={{ uri: screenshot.uri }} 
                      style={styles.imagePreview}
                      resizeMode="cover"
                      onError={handleImageError}
                    />
                  </TouchableOpacity>
                  {imageError && (
                    <View style={styles.imageErrorContainer}>
                      <Text style={styles.imageErrorText}>Failed to load image</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any additional information..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
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
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Submit Withdrawal Request</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* EasyPaisa Logo Placeholder */}
            <View style={styles.logoContainer}>
              <FontAwesome5 name="mobile-alt" size={24} color="#10B981" />
              <Text style={styles.logoText}>EasyPaisa • JazzCash • Bank</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>

      {/* Image Modal for Full Screen Preview */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setShowImageModal(false)}
        >
          {screenshot && !imageError && (
            <Image 
              source={{ uri: screenshot.uri }} 
              style={styles.modalImage} 
              resizeMode="contain"
              onError={handleImageError}
            />
          )}
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  safeArea: {
    flex: 1,
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
    marginTop: 20
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
    alignItems: 'center',
  },
  imagePreview: {
    width: width - 72,
    height: 200,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  imageErrorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  imageErrorText: {
    color: '#EF4444',
    fontSize: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width,
    height: '100%',
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