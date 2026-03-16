import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking,


} from "react-native";
import * as Clipboard from "expo-clipboard";
import { FontAwesome } from "@expo/vector-icons";

export default function HomeScreen({ navigation }) {

  const [selectedTab, setSelectedTab] = useState("BANK");
  const [modalVisible, setModalVisible] = useState(false);

  const accounts = {
    BANK: {
      number: "03451234567",
      updated: "06 Sep 2023, 04:33 PM"
    },
    JAZZCASH: {
      number: "03001234567",
      updated: "06 Sep 2023, 04:33 PM"
    },
    EASYPAISA: {
      number: "03111234567",
      updated: "06 Sep 2023, 04:33 PM"
    }
  };

  const account = accounts[selectedTab];

  const copyNumber = async () => {
    await Clipboard.setStringAsync(account.number);
    alert("Copied!");
  };

  const sendWhatsapp = () => {

    const message = `Payment Submitted

Method: ${selectedTab}
Account: ${account.number}`;

    const url = `https://wa.me/+923021810133?text=${encodeURIComponent(message)}`;

    Linking.openURL(url);

    setModalVisible(false);
  };

  return (

    <View style={styles.container}>

      {/* Tabs */}

      <View style={styles.tabs}>

        <TouchableOpacity
          style={[styles.tab, selectedTab === "BANK" && styles.activeTab]}
          onPress={() => setSelectedTab("BANK")}
        >
          <Text style={styles.tabText}>BANK</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === "JAZZCASH" && styles.activeTab]}
          onPress={() => setSelectedTab("JAZZCASH")}
        >
          <Text style={styles.tabText}>JAZZCASH</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === "EASYPAISA" && styles.activeTab]}
          onPress={() => setSelectedTab("EASYPAISA")}
        >
          <Text style={styles.tabText}>EASYPAISA</Text>
        </TouchableOpacity>

      </View>

      {/* Account Info */}

      <View style={styles.infoBox}>

        <Text style={styles.label}>Account Number</Text>

        <View style={styles.row}>

          <Text style={styles.number}>{account.number}</Text>

          <TouchableOpacity style={styles.copyBtn} onPress={copyNumber}>
            <Text style={{ color: "#fff" }}>COPY</Text>
          </TouchableOpacity>

        </View>

        <Text style={styles.updated}>
          Last Updated: {account.updated}
        </Text>

      </View>

      {/* Submit WhatsApp */}

      <TouchableOpacity
        style={styles.whatsappBtn}
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>
          SUBMIT TO WHATSAPP
        </Text>
      </TouchableOpacity>

      {/* Note */}

      <View style={styles.noteRow}>
        <FontAwesome name="whatsapp" size={28} />
        <Text style={styles.noteText}>
          ⚠ Payment ka screenshot WhatsApp par submit karna zaroori hai.
          Uske baad hi Login enable hoga.
        </Text>
      </View>

      {/* Login Button */}

      <TouchableOpacity style={styles.loginBtn}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>
          LOGIN TO BPEXCH.NET
        </Text>
      </TouchableOpacity>

      {/* Logout */}

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={{ color: "#fff" }}>LOGOUT</Text>
      </TouchableOpacity>


      {/* Confirmation Modal */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
      >

        <View style={styles.modalBg}>

          <View style={styles.modalBox}>

            <Text style={styles.modalTitle}>
              Confirm Information
            </Text>

            <Text>
              Method: {selectedTab}
            </Text>

            <Text>
              Account: {account.number}
            </Text>

            <View style={styles.modalBtns}>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={sendWhatsapp}
              >
                <Text style={{ color: "#fff" }}>Send</Text>
              </TouchableOpacity>

            </View>

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
    padding: 20,

    
  },

  tabs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop:40
  },

  tab: {
    backgroundColor: "#5A6ACF",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 3,
    alignItems: "center"
  },

  activeTab: {
    backgroundColor: "#3F51B5"
  },

  tabText: {
    color: "#fff",
    fontWeight: "bold"
  },

  infoBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 6,
    marginBottom: 20
  },

  label: {
    color: "#888"
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8
  },

  number: {
    fontSize: 16
  },

  copyBtn: {
    backgroundColor: "#1ABC9C",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4
  },

  updated: {
    marginTop: 10,
    color: "#888"
  },

  whatsappBtn: {
    backgroundColor: "#2ECC71",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20
  },

  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20
  },

  noteText: {
    marginLeft: 10,
    flex: 1
  },

  loginBtn: {
    backgroundColor: "#0E9F8E",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20
  },

  logoutBtn: {
    backgroundColor: "#9C27B0",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    alignSelf: "center",
    width: 120
  },

  modalBg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)"
  },

  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    width: "80%"
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10
  },

  modalBtns: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 15
  },

  cancelBtn: {
    marginRight: 15
  },

  confirmBtn: {
    backgroundColor: "#2ECC71",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 4
  }

});