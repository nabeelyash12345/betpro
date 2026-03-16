import React, { useState } from "react";
import {
View,
Text,
TextInput,
TouchableOpacity,
StyleSheet,
Linking,
Modal
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

export default function SignupScreen({ navigation }) {

const [name,setName] = useState("");
const [email,setEmail] = useState("");
const [password,setPassword] = useState("");
const [confirmPassword,setConfirmPassword] = useState("");

const [modalVisible,setModalVisible] = useState(false);
const [modalMessage,setModalMessage] = useState("");

const phone = "+923021810133";

const sendToWhatsapp = () => {

const message =
`

Name: ${name}
Email: ${email}`;

const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

Linking.openURL(url);

};

const handleSignup = () => {

if(!name || !email || !password || !confirmPassword){
setModalMessage("Please enter your information");
setModalVisible(true);
return;
}

if(password !== confirmPassword){
setModalMessage("Passwords do not match");
setModalVisible(true);
return;
}



navigation.navigate("Home",{name,email});

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

<TouchableOpacity style={styles.button} onPress={handleSignup}>
<Text style={styles.buttonText}>SIGN UP</Text>
</TouchableOpacity>

<Text style={styles.loginText}>
Already have an account? Login
</Text>

{/* Floating WhatsApp Button */}

<TouchableOpacity
style={styles.whatsappBtn}
onPress={handleSignup}
>
<FontAwesome name="whatsapp" size={30} color="black" />
</TouchableOpacity>

{/* Modal */}

<Modal
transparent={true}
visible={modalVisible}
animationType="fade"
>

<View style={styles.modalContainer}>
<View style={styles.modalBox}>

<Text style={styles.modalText}>
{modalMessage}
</Text>

<TouchableOpacity
style={styles.modalButton}
onPress={() => setModalVisible(false)}
>
<Text style={{color:"#fff"}}>OK</Text>
</TouchableOpacity>

</View>
</View>

</Modal>

</View>

);
}

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#E5E7EB",
justifyContent:"center",
padding:25
},

title:{
fontSize:22,
fontWeight:"600",
textAlign:"center",
marginBottom:40,
color:"#374151"
},

input:{
backgroundColor:"#F3F4F6",
padding:15,
borderRadius:10,
marginBottom:15,
borderWidth:1,
borderColor:"#E5E7EB"
},

button:{
backgroundColor:"#9C27B0",
padding:15,
borderRadius:30,
alignItems:"center",
marginTop:10
},

buttonText:{
color:"#fff",
fontWeight:"bold"
},

loginText:{
textAlign:"center",
marginTop:15,
color:"#6B7280"
},

whatsappBtn:{
position:"absolute",
bottom:30,
right:20,
backgroundColor:"#1ABC9C",
width:60,
height:60,
borderRadius:30,
justifyContent:"center",
alignItems:"center",
elevation:6
},

modalContainer:{
flex:1,
justifyContent:"center",
alignItems:"center",
backgroundColor:"rgba(0,0,0,0.4)"
},

modalBox:{
backgroundColor:"#fff",
padding:25,
borderRadius:10,
width:"75%",
alignItems:"center"
},

modalText:{
fontSize:16,
marginBottom:15,
textAlign:"center"
},

modalButton:{
backgroundColor:"#9C27B0",
padding:10,
borderRadius:6,
width:80,
alignItems:"center"
}

});