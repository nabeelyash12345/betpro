// src/Screens/HomeInActiveUser.js
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Alert, ScrollView, Linking } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useAuth } from "../context/AuthContext";
import { FontAwesome } from "@expo/vector-icons";
import { getSupportNumber } from "../services/support";

const HomeInActiveUser = ({ navigation }) => {
    const { user, userProfile, logout, loading } = useAuth();
    const [menuVisible, setMenuVisible] = useState(false);
    const [isSupported,setSupport] = useState("");
  

    const handleLogout = async () => {
        setMenuVisible(false);
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Logout",
                    onPress: async () => {
                        await logout();
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const handleRefresh = () => {
        setMenuVisible(false);
        Alert.alert("Refresh", "Checking for updates...");
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9C27B0" />
            </View>
        );
    }

     const loadBanks = async () => {
       
        const result = await getSupportNumber();
        
        if (result.success) {
          setSupport(result.data);
        
        } 
         
      };


        useEffect(() => {
       
      
          loadBanks()
          // Set up real-time listener for orders
          
        }, []);
        
    
    return (
        <View style={styles.container}>
            {/* Header with Three Dots Menu - Fixed at top */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Account Status</Text>
                <TouchableOpacity 
                    style={styles.menuButton}
                    onPress={() => setMenuVisible(true)}
                >
                    <FontAwesome name="ellipsis-v" size={24} color="#374151" />
                </TouchableOpacity>
            </View>

            {/* Three Dots Menu Modal */}
            <Modal
                transparent={true}
                visible={menuVisible}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={styles.modalMenu}>
                        <TouchableOpacity 
                            style={styles.menuItem}
                            onPress={handleRefresh}
                        >
                            <FontAwesome name="refresh" size={18} color="#2196F3" />
                            <Text style={styles.menuItemText}>Refresh Status</Text>
                        </TouchableOpacity>
                        
                        <View style={styles.menuDivider} />
                        
                        <TouchableOpacity 
                            style={[styles.menuItem, styles.logoutMenuItem]}
                            onPress={handleLogout}
                        >
                            <FontAwesome name="sign-out" size={18} color="#F44336" />
                            <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Scrollable Content */}
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Status Card - Matching Image Design */}
                <View style={styles.statusCard}>
                    {/* Hourglass Icon */}
                    <View style={styles.iconContainer}>
                        <FontAwesome name="hourglass-half" size={70} color="#FF9800" />
                    </View>
                    
                    {/* Status Text - Exactly as in image */}
                    <Text style={styles.statusTitle}>Status: Pending</Text>
                    <Text style={styles.statusMessage}>
                        Be patient, your account is under verification
                    </Text>
                    <Text style={styles.statusSubMessage}>
                        You can access all features, once your account is approved.
                    </Text>

                    {/* Separator Line */}
                    <View style={styles.separator} />

                    {/* Urdu Text - Exactly as in image */}
                    <Text style={styles.urduText}>
                        تحمل رکھیں آپ کے اکاؤنٹ کی تصدیق ہو رہی ہے۔
                    </Text>
                    <Text style={styles.urduSubText}>
                        آپ تمام فیچرز کا استعمال کر سکتے ہیں جب آپکا اکاؤنٹ منظور شدہ ہو جائے گا۔
                    </Text>
                </View>

                {/* User Info Section */}
                <View style={styles.userInfoCard}>
                    <View style={styles.userInfoRow}>
                        <FontAwesome name="user-circle-o" size={20} color="#6B7280" />
                        <Text style={styles.userInfoText}>
                            {user?.displayName || 'User Name'}
                        </Text>
                    </View>
                    <View style={styles.userInfoRow}>
                        <FontAwesome name="envelope-o" size={18} color="#6B7280" />
                        <Text style={styles.userInfoText}>
                            {user?.email || 'user@example.com'}
                        </Text>
                    </View>
                    {userProfile?.phoneNumber && (
                        <View style={styles.userInfoRow}>
                            <FontAwesome name="phone" size={18} color="#6B7280" />
                            <Text style={styles.userInfoText}>
                                {userProfile.phoneNumber}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Instructions Section */}
                {/* <View style={styles.instructionsCard}>
                    <Text style={styles.instructionsTitle}>What's Next?</Text>
                    <View style={styles.instructionItem}>
                        <FontAwesome name="check-circle" size={18} color="#4CAF50" />
                        <Text style={styles.instructionText}>
                            Complete your payment to activate account
                        </Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <FontAwesome name="check-circle" size={18} color="#4CAF50" />
                        <Text style={styles.instructionText}>
                            Send payment proof via WhatsApp
                        </Text>
                    </View>
                    <View style={styles.instructionItem}>
                        <FontAwesome name="check-circle" size={18} color="#4CAF50" />
                        <Text style={styles.instructionText}>
                            Wait for admin verification (24-48 hours)
                        </Text>
                    </View>
                </View> */}

                {/* WhatsApp Button */}
                <TouchableOpacity
  style={styles.whatsappButton}
  onPress={() => {
    // Get the first support number
    const supportItem = isSupported.find(item => item?.supportNumber);
    const number = supportItem?.supportNumber;

    if (number) {
      const url = `https://wa.me/${number.replace(/\D/g, "")}`;
      Linking.openURL(url).catch(() => alert("Unable to open WhatsApp"));
    } else {
      alert("No WhatsApp number available");
    }
  }}
>
  <FontAwesome name="whatsapp" size={24} color="#fff" />
  <Text style={styles.whatsappButtonText}>Contact Here</Text>
</TouchableOpacity>

                {/* Extra bottom padding for better scrolling experience */}
                {/* <View style={styles.bottomPadding} /> */}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 38,
        paddingBottom: 12,
        backgroundColor: "#F3F4F6",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
    },
    menuButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    modalMenu: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginTop: 60,
        marginRight: 20,
        width: 180,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    menuItemText: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    logoutMenuItem: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    logoutText: {
        color: '#EF4444',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
    },
    statusCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    iconContainer: {
        marginBottom: 20,
    },
    statusTitle: {
        fontSize: 22,
        fontWeight: "600",
        color: "#F59E0B",
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    statusMessage: {
        fontSize: 16,
        color: "#1F2937",
        textAlign: "center",
        marginBottom: 6,
        fontWeight: "500",
    },
    statusSubMessage: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 20,
        lineHeight: 20,
    },
    separator: {
        width: "100%",
        height: 1,
        backgroundColor: "#E5E7EB",
        marginVertical: 20,
    },
    urduText: {
        fontSize: 15,
        color: "#1F2937",
        textAlign: "center",
        marginBottom: 6,
        fontFamily: "sans-serif",
        lineHeight: 22,
    },
    urduSubText: {
        fontSize: 13,
        color: "#6B7280",
        textAlign: "center",
        fontFamily: "sans-serif",
        lineHeight: 20,
    },
    userInfoCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    userInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    userInfoText: {
        fontSize: 14,
        color: "#374151",
        marginLeft: 12,
        flex: 1,
    },
    instructionsCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1F2937",
        marginBottom: 14,
    },
    instructionItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    instructionText: {
        fontSize: 14,
        color: "#4B5563",
        marginLeft: 12,
        flex: 1,
        lineHeight: 20,
    },
    whatsappButton: {
        backgroundColor: "#25D366",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        borderRadius: 12,
        gap: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    whatsappButtonText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 16,
        letterSpacing: 0.3,
    },
    bottomPadding: {
        height: 20,
    },
});

export default HomeInActiveUser;