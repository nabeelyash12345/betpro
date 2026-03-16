import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

export default function LoginScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        
        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          style={styles.input}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity style={styles.loginBtn}>
          <Text style={styles.loginText}>LOGIN</Text>
        </TouchableOpacity>
<TouchableOpacity 
  style={styles.signupBtn}
  onPress={() => navigation.navigate("SignupScreen")}
>
  <Text style={styles.signupText}>GO TO SIGNUP</Text>
</TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#dfe3e8",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "85%",
    backgroundColor: "#dfe3e8",
   
   
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#fff",
  },

  loginBtn: {
    backgroundColor: "#9C27B0",
    padding: 14,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 12,
  },

  loginText: {
    color: "#fff",
    fontWeight: "600",
    letterSpacing: 1,
  },

  signupBtn: {
    backgroundColor: "#1ABC9C",
    padding: 14,
    borderRadius: 25,
    alignItems: "center",
  },

  signupText: {
    color: "#fff",
    fontWeight: "600",
    letterSpacing: 1,
  },
});