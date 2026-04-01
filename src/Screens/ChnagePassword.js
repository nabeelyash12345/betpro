// src/Screens/ChangePasswordScreen.js
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
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("error");
  const [loading, setLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const backButtonAnim = useRef(new Animated.Value(0)).current;
  
  // Staggered animations for inputs
  const inputAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  
  const { user } = useAuth();

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

  // Animation refs for each input
  const currentScale = useRef(new Animated.Value(1)).current;
  const newScale = useRef(new Animated.Value(1)).current;
  const confirmScale = useRef(new Animated.Value(1)).current;

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

  // Validate password strength
  const validatePassword = (password) => {
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    // Optional: Add more password strength checks
    // if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    // if (!/[0-9]/.test(password)) return "Password must contain at least one number";
    return null;
  };

  const handleChangePassword = async () => {
    animateButton();
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setModalType("error");
      setModalMessage("Please fill in all fields");
      setModalVisible(true);
      return;
    }

    // Check if new password matches confirmation
    if (newPassword !== confirmPassword) {
      setModalType("error");
      setModalMessage("New passwords do not match");
      setModalVisible(true);
      return;
    }

    // Validate new password strength
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setModalType("error");
      setModalMessage(passwordError);
      setModalVisible(true);
      return;
    }

    // Check if new password is same as current
    if (newPassword === currentPassword) {
      setModalType("error");
      setModalMessage("New password must be different from current password");
      setModalVisible(true);
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser || !currentUser.email) {
        throw new Error("User not authenticated");
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, newPassword);
      
      // Success
      setLoading(false);
      setModalType("success");
      setModalMessage("Password changed successfully!");
      setModalVisible(true);
      
    } catch (error) {
      setLoading(false);
      console.error("Password change error:", error);
      
      let errorMessage = "Failed to change password";
      if (error.code === "auth/wrong-password") {
        errorMessage = "Current password is incorrect";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please log in again to change your password";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "New password is too weak. Please use at least 6 characters";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "User not found. Please log in again";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setModalType("error");
      setModalMessage(errorMessage);
      setModalVisible(true);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalVisible(false);
    if (modalType === "success") {
      navigation.goBack();
    }
  };

  // Clear form
  const clearForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#E5E7EB" />
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

            {/* Header */}
            <Animated.Text style={[styles.title, {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            }]}>
              Change Password
            </Animated.Text>

            <Animated.Text style={[styles.subtitle, {
              opacity: fadeAnim,
            }]}>
              Enter your current password and choose a new one
            </Animated.Text>

            {/* Current Password Input */}
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
              <Animated.View style={{ transform: [{ scale: currentScale }] }}>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Current Password"
                    style={styles.input}
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onFocus={() => onFocusAnimation(currentScale)}
                    onBlur={() => onBlurAnimation(currentScale)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </Animated.View>
            </Animated.View>

            {/* New Password Input */}
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
              <Animated.View style={{ transform: [{ scale: newScale }] }}>
                <View style={styles.inputContainer}>
                  <Ionicons name="key-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    placeholder="New Password (min 6 characters)"
                    style={styles.input}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onFocus={() => onFocusAnimation(newScale)}
                    onBlur={() => onBlurAnimation(newScale)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </Animated.View>
            </Animated.View>

            {/* Confirm Password Input */}
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
              <Animated.View style={{ transform: [{ scale: confirmScale }] }}>
                <View style={styles.inputContainer}>
                  <Ionicons name="checkmark-done-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Confirm New Password"
                    style={styles.input}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    returnKeyType="done"
                    onFocus={() => onFocusAnimation(confirmScale)}
                    onBlur={() => onBlurAnimation(confirmScale)}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </Animated.View>
            </Animated.View>

            {/* Password Requirements */}
            <Animated.View
              style={[
                styles.requirementsContainer,
                {
                  opacity: inputAnimations[2],
                }
              ]}
            >
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <View style={styles.requirementRow}>
                <Ionicons 
                  name={newPassword.length >= 6 ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={newPassword.length >= 6 ? "#4CAF50" : "#9CA3AF"} 
                />
                <Text style={styles.requirementText}>At least 6 characters</Text>
              </View>
              <View style={styles.requirementRow}>
                <Ionicons 
                  name={newPassword && newPassword !== currentPassword ? "checkmark-circle" : "ellipse-outline"} 
                  size={16} 
                  color={newPassword && newPassword !== currentPassword ? "#4CAF50" : "#9CA3AF"} 
                />
                <Text style={styles.requirementText}>Different from current password</Text>
              </View>
            </Animated.View>

            {/* Change Password Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity 
                style={styles.button} 
                onPress={handleChangePassword}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>CHANGE PASSWORD</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Custom Modal */}
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
                    modalType === "success" ? styles.successModalBox : styles.errorModalBox,
                    {
                      transform: [{ scale: scaleAnim }],
                      opacity: fadeAnim
                    }
                  ]}
                >
                  {/* Icon based on modal type */}
                  <View style={styles.modalIconContainer}>
                    <Text style={modalType === "success" ? styles.successIcon : styles.errorIcon}>
                      {modalType === "success" ? "✓" : "✗"}
                    </Text>
                  </View>
                  
                  <Text style={[
                    styles.modalText,
                    modalType === "success" ? styles.successText : styles.errorText
                  ]}>
                    {modalMessage}
                  </Text>
                  
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      modalType === "success" ? styles.successButton : styles.errorButton
                    ]}
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
    backgroundColor: "#E5E7EB",
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
    marginBottom: 10,
    color: "#374151",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 40,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: "#1F2937",
  },
  requirementsContainer: {
    marginTop: 10,
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  requirementText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 8,
  },
  button: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
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
  successModalBox: {
    borderTopWidth: 4,
    borderTopColor: "#4CAF50",
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
  successIcon: {
    fontSize: 40,
    color: "#4CAF50",
    fontWeight: "bold",
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
  successText: {
    color: "#2E7D32",
  },
  errorText: {
    color: "#C62828",
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  successButton: {
    backgroundColor: "#4CAF50",
  },
  errorButton: {
    backgroundColor: "#9C27B0",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});