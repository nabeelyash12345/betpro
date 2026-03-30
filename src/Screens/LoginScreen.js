// src/Screens/LoginScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleLogin = async () => {
    // Validation
    if (!email || !password) {
      setModalMessage("Please enter email and password");
      setModalVisible(true);
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      // Show error message
      let errorMessage = "Login failed";
     
      if (result.error.includes("auth/user-not-found")) {
        errorMessage = "No account found with this email";
      } else if (result.error.includes("auth/wrong-password")) {
        errorMessage = "Incorrect password";
      } else if (result.error.includes("auth/invalid-email")) {
        errorMessage = "Invalid email format";
      } else if(result.error.includes("auth/invalid-credential")){
        errorMessage = "Incorrect Email or Password";
      }else{
        errorMessage = result.error;

      }
      setModalMessage(errorMessage);
      setModalVisible(true);
    }
  };

  return (
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
      
      <View style={styles.card}>
        <View  style={{justifyContent:'center', height:140, alignItems:'center', marginTop:80}}>
          <Image
            source={require("../../assets/logo_neww.png")}
            resizeMode="contain"
            style={{ height: 100, width: 100 }}
          />
          </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={{ marginBottom:10, fontSize:16}}>Email</Text>
        
        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Text style={{ marginBottom:10, fontSize:16}}>Password</Text>

        <TextInput
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity 
          style={styles.loginBtn} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginText}>LOGIN</Text>
          )}
        </TouchableOpacity>

        <View
        style={styles.signupBtn}
        >
          <Text>Don't have an account? </Text>
        <TouchableOpacity 
          
          onPress={() => navigation.navigate("SignupScreen")}
        >
          <Text style={styles.signupText}>SIGN UP</Text>
        </TouchableOpacity>
        </View>
      </View>

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
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#fff" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </ScrollView>
   </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
 keyboardAvoidingView: {
    flex: 1,
  },
   scrollContainer: {
    flexGrow: 1,
  },
  card: {
    width: "100%",
    flex:1,
      //  justifyContent: "center",
  
    backgroundColor:'red',
    padding: 20,
   backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 40,
    color: "#000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  loginBtn: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    marginTop:20
  },
  loginText: {
    color: "#fff",
    fontWeight: "600",
    letterSpacing: 1,
  },
  signupBtn: {
 
  
     flexDirection:'row',
     alignItems:'center',
     justifyContent:'center',
    marginTop:50,
  
    
  },
  signupText: {
    color: "#999",
    fontWeight: "600",
    letterSpacing: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 10,
    width: "75%",
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#9C27B0",
    padding: 10,
    borderRadius: 6,
    width: 80,
    alignItems: "center",
  },
});