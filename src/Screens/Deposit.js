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
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  Modal,
  Dimensions
} from "react-native";
import { Entypo, Ionicons, MaterialIcons, FontAwesome5, AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from "../context/AuthContext";
import { createOrder } from "../services/orderService";
import * as Clipboard from 'expo-clipboard';
import { getAllBanks } from "../services/PaymentDetails";


const { width } = Dimensions.get('window');

export default function Withdraw({ navigation }) {
  const { user, userProfile } = useAuth();

   const [banks, setBanks] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState("easypaisa");
  const [accountHolder, setAccountHolder] = useState(userProfile?.displayName);
  const [mobileNumber, setMobileNumber] = useState(userProfile?.phoneNumber);
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  const easyPaisaNumber = banks?.find(bank => bank?.category?.toLowerCase() === "easypaisa") ;
  const jazzCash = banks?.find(bank => bank?.category?.toLowerCase() === "jazzcash") ;
  const BankAccount = banks?.find(bank => bank?.category?.toLowerCase() === "Bank") ;


  // State for success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState({
    orderNumber: "",
    amount: "",
    method: ""
  });

   const [copiedText, setCopiedText] = useState('');

  const copyToClipboard = async (data) => {
    await Clipboard.setStringAsync(data);
  };


    React.useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
   
    const result = await getAllBanks();
    
    if (result.success) {
      setBanks(result.data);
    
    } 
     
  };



  const fetchCopiedText = async () => {
    const text = await Clipboard.getStringAsync();
    setCopiedText(text);
  };

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

     

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const base64Data = result.assets[0].base64;
        
   
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
    } 

   

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 500) {
      Alert.alert("Error", "Amount must be at least PKR 500");
      return;
    }
    if(screenshot == null) {
       Alert.alert("Error", "Please select screenshot");
        return
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
      notes: "",
      isDeposit: true,
      status: 'pending',
      screenshot: screenshot ? screenshot.dataUrl : null,
      bpId:userProfile?.bpPassword,
      bpPassword:userProfile?.bpUsername,
      userName:userProfile?.displayName,
      userEmail:userProfile?.email
    };

    const result = await createOrder(user.uid, orderData);

    setSubmitting(false);

    if (result.success) {
      // Show custom modal instead of Alert
      setSuccessData({
        orderNumber: result.order.orderNumber,
        amount: numAmount,
        method: selectedMethod.toUpperCase()
      });
      setShowSuccessModal(true);
    } else {
      Alert.alert("Error", "Failed to submit Deposit request: " + result.error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
          >
            {/* Header with back button */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Entypo name="chevron-left" size={28} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Deposit Funds</Text>
              <View style={{ width: 32 }} />
            </View>

            {/* Instructions Section (English & Urdu) */}
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>Account Details {selectedMethod}</Text>
              { selectedMethod === "easypaisa" &&(
              <Text style={styles.instructionsText}>Title: {easyPaisaNumber?.accountTitle }</Text>
 
              )

              }
               { selectedMethod === "jazzcash" &&(
              <Text style={styles.instructionsText}>Title: {jazzCash?.accountTitle ?? "" }</Text>
 
              )

              }
               { selectedMethod === "bank" &&(
              <Text style={styles.instructionsText}>Title: {BankAccount?.accountTitle ?? "" }</Text>
 
              )

              }

              { selectedMethod === "bank" &&(
              <TouchableOpacity style={styles.copyTextBtn} onPress={ () => copyToClipboard(bankAccountNumber?.accountNumber ?? "")}>
              
              <Text style={styles.instructionsText}>{bankAccountNumber?.accountNumber ?? ""}</Text>
              
              <AntDesign name="copy" size={20} color="#374151" />
             </TouchableOpacity>
              )

              }
                 { selectedMethod === "easypaisa" &&(
              <TouchableOpacity style={styles.copyTextBtn} onPress={ () => copyToClipboard(easyPaisaNumber?.accountNumber ?? "")}>
              
              <Text style={styles.instructionsText}>{easyPaisaNumber?.accountNumber ?? ""}</Text>
              
              <AntDesign name="copy" size={20} color="#374151" />
             </TouchableOpacity>
              )

              }
                 { selectedMethod === "jazzcash" &&(
              <TouchableOpacity style={styles.copyTextBtn} onPress={ () => copyToClipboard(jazzCash?.accountNumber ?? "")}>
              
              <Text style={styles.instructionsText}>{jazzCash?.accountNumber ?? ""}</Text>
              
              <AntDesign name="copy" size={20} color="#374151" />
             </TouchableOpacity>
              )

              }

            
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
                  <Text style={styles.submitText}>Submit Deposit Request</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* EasyPaisa Logo Placeholder */}
            <View style={styles.logoContainer}>
              <FontAwesome5 name="mobile-alt" size={24} color="#10B981" />
              <Text style={styles.logoText}>EasyPaisa • JazzCash • Bank</Text>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

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

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContainer}>
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={70} color="#10B981" />
            </View>
            
            <Text style={styles.successModalTitle}>Withdrawal Request Submitted!</Text>
            
            <View style={styles.successModalDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order Number:</Text>
                <Text style={styles.detailValue}>#{successData.orderNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={styles.detailValue}>PKR {successData.amount}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Method:</Text>
                <Text style={styles.detailValue}>{successData.method}</Text>
              </View>
            </View>
            
            <Text style={styles.successModalMessage}>
              Funds will be transferred within 30 minutes after approval.
            </Text>
            
            <View style={styles.successModalButtons}>
            
              <TouchableOpacity 
                style={[styles.successModalButton, styles.okButton]}
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingHorizontal: 20,
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
    fontSize: 10,
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
  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: width - 48,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  successModalDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  successModalMessage: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  successModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  successModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewOrdersButton: {
    backgroundColor: '#10B981',
  },
  viewOrdersButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  okButton: {
    backgroundColor: '#F3F4F6',
  },
  okButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  copyTextBtn:{
    flexDirection:"row",
    justifyContent:"space-between",
   
  }
});