// src/Screens/SignupScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();

  const handleSignup = async () => {
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setModalMessage("Please fill in all fields");
      setModalVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      setModalMessage("Passwords do not match");
      setModalVisible(true);
      return;
    }

    if (password.length < 6) {
      setModalMessage("Password must be at least 6 characters");
      setModalVisible(true);
      return;
    }

    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);

    if (!result.success) {
      // Show error message
      let errorMessage = "Registration failed";
      if (result.error.includes("auth/email-already-in-use")) {
        errorMessage = "Email already registered";
      } else if (result.error.includes("auth/invalid-email")) {
        errorMessage = "Invalid email format";
      } else if (result.error.includes("auth/weak-password")) {
        errorMessage = "Password is too weak";
      } else {
        errorMessage = result.error;
      }
      setModalMessage(errorMessage);
      setModalVisible(true);
    } else {
      // Registration successful - user will be automatically logged in
      setModalMessage("Account created successfully!");
      setModalVisible(true);
      // Navigation will happen automatically due to auth state change
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        placeholder="Full Name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password (min 6 characters)"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        placeholder="Confirm Password"
        style={styles.input}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>SIGN UP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.loginLink}
        onPress={() => navigation.navigate("LoginScreen")}
      >
        <Text style={styles.loginText}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>

      {/* Error Modal */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                // If registration was successful, we don't need to navigate
                // as auth state change will handle it
              }}
            >
              <Text style={{ color: "#fff" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    padding: 25
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 40,
    color: "#374151"
  },
  input: {
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  button: {
    backgroundColor: "#9C27B0",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold"
  },
  loginLink: {
    marginTop: 15,
    alignItems: "center",
  },
  loginText: {
    color: "#6B7280"
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)"
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 10,
    width: "75%",
    alignItems: "center"
  },
  modalText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center"
  },
  modalButton: {
    backgroundColor: "#9C27B0",
    padding: 10,
    borderRadius: 6,
    width: 80,
    alignItems: "center"
  }
});