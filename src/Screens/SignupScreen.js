// src/Screens/SignupScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("error");
  const [loading, setLoading] = useState(false);
  const [autoLoginLoading, setAutoLoginLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const backButtonAnim = useRef(new Animated.Value(0)).current;
  
  // Staggered animations for each input
  const inputAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  
  const { register, login } = useAuth();

  useEffect(() => {
    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(backButtonAnim, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered animations for input fields
    inputAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 200 + (index * 100),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // Validate phone number (Pakistan format)
  const validatePhoneNumber = (phone) => {
    const cleaned = phone.replace(/[^\d]/g, '');
    const phoneRegex = /^(03\d{9}|92\d{10}|0\d{10})$/;
    return phoneRegex.test(cleaned);
  };

  // Format phone number as user types
  const formatPhoneNumber = (text) => {
    let cleaned = text.replace(/[^\d]/g, '');
    
    if (cleaned.startsWith('92')) {
      if (cleaned.length > 2) {
        cleaned = '0' + cleaned.slice(2);
      }
    }
    
    if (cleaned.length > 11) {
      cleaned = cleaned.slice(0, 11);
    }
    
    return cleaned;
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  // Button animation
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalVisible(false);
  };

  // Handle back button press
  const handleBackPress = () => {
    Animated.timing(backButtonAnim, {
      toValue: 0.8,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(backButtonAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
      navigation.goBack();
    });
  };

  // Auto login after successful registration
  const autoLogin = async (email, password) => {
    setAutoLoginLoading(true);
    console.log("Attempting auto-login with:", email);
    
    const loginResult = await login(email, password);
    setAutoLoginLoading(false);
    
    if (loginResult.success) {
      console.log("Auto-login successful");
      // The auth state change will trigger navigation automatically
      // No need to manually navigate
    } else {
      console.log("Auto-login failed:", loginResult.error);
      setModalType("error");
      setModalMessage("Account created successfully! Please login manually.");
      setModalVisible(true);
    }
  };

  const handleSignup = async () => {
    animateButton();
    
    // Validation
    if (!name || !email || !phoneNumber || !password || !confirmPassword) {
      setModalType("error");
      setModalMessage("Please fill in all fields");
      setModalVisible(true);
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setModalType("error");
      setModalMessage("Please enter a valid phone number (e.g., 03XXXXXXXXX)");
      setModalVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      setModalType("error");
      setModalMessage("Passwords do not match");
      setModalVisible(true);
      return;
    }

    if (password.length < 6) {
      setModalType("error");
      setModalMessage("Password must be at least 6 characters");
      setModalVisible(true);
      return;
    }

    setLoading(true);
    console.log("Starting registration...");
    
    const result = await register(name, email, password, phoneNumber);
    console.log("Registration result:", result);
    
    setLoading(false);

    if (!result.success) {
      let errorMessage = "Registration failed";
      if (result.error.includes("auth/email-already-in-use")) {
        errorMessage = "Email already registered";
      } else if (result.error.includes("auth/invalid-email")) {
        errorMessage = "Invalid email format";
      } else if (result.error.includes("auth/weak-password")) {
        errorMessage = "Password is too weak";
      } else {
        errorMessage = result?.error;
      }
      setModalType("error");
      setModalMessage(errorMessage);
      setModalVisible(true);
    } else {
      // Registration successful - now auto login
      console.log("Registration successful, attempting auto-login...");
      await autoLogin(email, password);
    }
  };

  // Animation for input focus
  const onFocusAnimation = (value) => {
    Animated.spring(value, {
      toValue: 1.02,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const onBlurAnimation = (value) => {
    Animated.spring(value, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const inputScale = useRef(new Animated.Value(1)).current;
  const emailScale = useRef(new Animated.Value(1)).current;
  const phoneScale = useRef(new Animated.Value(1)).current;
  const passwordScale = useRef(new Animated.Value(1)).current;
  const confirmScale = useRef(new Animated.Value(1)).current;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.container,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            {/* Back Button */}
            <Animated.View 
              style={[
                styles.backButtonContainer,
                {
                  opacity: backButtonAnim,
                  transform: [
                    {
                      translateX: backButtonAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-50, 0]
                      })
                    }
                  ]
                }
              ]}
            >
              <TouchableOpacity 
                onPress={handleBackPress} 
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#374151" />
              </TouchableOpacity>
            </Animated.View>

            <Animated.Text style={[styles.title, {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            }]}>
              Create Account
            </Animated.Text>

            {/* Full Name Input */}
            <Animated.View
              style={[
                styles.inputWrapper,
                {
                  opacity: inputAnimations[0],
                  transform: [
                    { translateX: inputAnimations[0].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0]
                    })}
                  ]
                }
              ]}
            >
              <Animated.View style={{ transform: [{ scale: inputScale }] }}>
                <TextInput
                  placeholder="Full Name"
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onFocus={() => onFocusAnimation(inputScale)}
                  onBlur={() => onBlurAnimation(inputScale)}
                  placeholderTextColor="#9CA3AF"
                />
              </Animated.View>
            </Animated.View>

            {/* Email Input */}
            <Animated.View
              style={[
                styles.inputWrapper,
                {
                  opacity: inputAnimations[1],
                  transform: [
                    { translateX: inputAnimations[1].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0]
                    })}
                  ]
                }
              ]}
            >
              <Animated.View style={{ transform: [{ scale: emailScale }] }}>
                <TextInput
                  placeholder="Email"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onFocus={() => onFocusAnimation(emailScale)}
                  onBlur={() => onBlurAnimation(emailScale)}
                  placeholderTextColor="#9CA3AF"
                />
              </Animated.View>
            </Animated.View>

            {/* Phone Number Input */}
            <Animated.View
              style={[
                styles.inputWrapper,
                {
                  opacity: inputAnimations[2],
                  transform: [
                    { translateX: inputAnimations[2].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0]
                    })}
                  ]
                }
              ]}
            >
              <Animated.View style={{ transform: [{ scale: phoneScale }] }}>
                <TextInput
                  placeholder="Phone Number"
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onFocus={() => onFocusAnimation(phoneScale)}
                  onBlur={() => onBlurAnimation(phoneScale)}
                  placeholderTextColor="#9CA3AF"
                />
              </Animated.View>
            </Animated.View>

            {/* Password Input */}
            <Animated.View
              style={[
                styles.inputWrapper,
                {
                  opacity: inputAnimations[3],
                  transform: [
                    { translateX: inputAnimations[3].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0]
                    })}
                  ]
                }
              ]}
            >
              <Animated.View style={{ transform: [{ scale: passwordScale }] }}>
                <TextInput
                  placeholder="Password (min 6 characters)"
                  style={styles.input}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onFocus={() => onFocusAnimation(passwordScale)}
                  onBlur={() => onBlurAnimation(passwordScale)}
                  placeholderTextColor="#9CA3AF"
                />
              </Animated.View>
            </Animated.View>

            {/* Confirm Password Input */}
            <Animated.View
              style={[
                styles.inputWrapper,
                {
                  opacity: inputAnimations[4],
                  transform: [
                    { translateX: inputAnimations[4].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0]
                    })}
                  ]
                }
              ]}
            >
              <Animated.View style={{ transform: [{ scale: confirmScale }] }}>
                <TextInput
                  placeholder="Confirm Password"
                  style={styles.input}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  returnKeyType="done"
                  onFocus={() => onFocusAnimation(confirmScale)}
                  onBlur={() => onBlurAnimation(confirmScale)}
                  placeholderTextColor="#9CA3AF"
                />
              </Animated.View>
            </Animated.View>

            {/* Sign Up Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity 
                style={styles.button} 
                onPress={handleSignup}
                disabled={loading || autoLoginLoading}
                activeOpacity={0.8}
              >
                {loading || autoLoginLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>SIGN UP</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Login Link */}
            <Animated.View
              style={[
                styles.loginLink,
                {
                  opacity: inputAnimations[4],
                  transform: [
                    { translateY: inputAnimations[4].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    })}
                  ]
                }
              ]}
            >
              <TouchableOpacity 
                onPress={() => navigation.navigate("LoginScreen")}
                activeOpacity={0.6}
                disabled={loading || autoLoginLoading}
              >
                #9C27B0
                <Text style={styles.loginText}>
                  Already have an account?  
                  <Text style={{color:"#9C27B0",}} >
                    Login
                </Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Custom Modal - Only for errors */}
            <Modal
              transparent={true}
              visible={modalVisible}
              animationType="fade"
              onRequestClose={handleModalClose}
            >
              <View style={styles.modalContainer}>
                <Animated.View 
                  style={[
                    styles.modalBox,
                    styles.errorModalBox,
                    {
                      transform: [{ scale: scaleAnim }],
                      opacity: fadeAnim
                    }
                  ]}
                >
                  <View style={styles.modalIconContainer}>
                    <Text style={styles.errorIcon}>✗</Text>
                  </View>
                  
                  <Text style={[styles.modalText, styles.errorText]}>
                    {modalMessage}
                  </Text>
                  
                  <TouchableOpacity
                    style={styles.errorButton}
                    onPress={handleModalClose}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalButtonText}>OK</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </Modal>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    padding: 25,
    paddingTop: 60,
  },
  backButtonContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginTop: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 40,
    color: "#374151",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 14,
    color: "#1F2937",
  },
  button: {
    backgroundColor: "#9C27B0",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#9C27B0",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  loginLink: {
    marginTop: 20,
    alignItems: "center",
  },
  loginText: {
    color: "#6B7280",
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 15,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorModalBox: {
    borderTopWidth: 4,
    borderTopColor: "#F44336",
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  errorIcon: {
    fontSize: 40,
    color: "#F44336",
    fontWeight: "bold",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#374151",
  },
  errorText: {
    color: "#C62828",
  },
  errorButton: {
    backgroundColor: "#9C27B0",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});