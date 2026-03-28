// src/Screens/HomeScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Animated,
  Alert,
  Image
} from "react-native";
import { Entypo, Ionicons, MaterialIcons, FontAwesome5, AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { getUserOrders, listenToUserOrders } from "../services/orderService";
import * as Clipboard from 'expo-clipboard';

const { width, height } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const { user, userProfile, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const username = userProfile?.bpUsername ?? "N/A";
  const password = userProfile?.bpPassword ?? "";


    const copyToClipboard = async (username) => {
      await Clipboard.setStringAsync(username);
    };

  useEffect(() => {
    if (!user) return;

    // Set up real-time listener for orders
    const unsubscribe = listenToUserOrders(user.uid, (result) => {
      if (result.success) {
        setOrders(result.orders);
      }
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
 

    setTimeout(() => {
      setRefreshing(false)
    }, 3000);
    // Listener will automatically update
  };

  const openMenu = () => {
    setMenuVisible(true);
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMenuVisible(false);
    });
  };

  const handleChangePassword = () => {
    closeMenu();
    // Navigate to change password screen
    navigation.navigate("ChangePasswordScreen");
  };

  const handleLogout = async () => {
    closeMenu();
    // Show confirmation dialog
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
          style: "destructive",
          onPress: async () => {
            setLogoutLoading(true);
            const result = await logout();
            setLogoutLoading(false);
            
            if (result.success) {
              // Navigate to login screen
              navigation.replace("LoginScreen");
            } else {
              Alert.alert("Logout Failed", result.error || "An error occurred");
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'completed':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'question-circle';
      case 'approved':
        return 'check-circle';
      case 'rejected':
        return 'times-circle';
      case 'completed':
        return 'check-circle';
      default:
        return 'question-circle';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const formatAmount = (amount) => {
    return `PKR ${amount.toLocaleString()}`;
  };

  const getTransactionType = (order) => {
    if (order.isDeposit) {
      return { text: 'Deposit', icon: 'arrow-down', color: '#10B981' };
    } else {
      return { text: 'Withdrawal', icon: 'arrow-up', color: '#EF4444' };
    }
  };

  // Get only the last 5 orders
  const recentOrders = orders.slice(0, 5);

  return (
    <>
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.headerstyles}>
            <View>
              <Text style={styles.headertext}>Betpro Officail</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={openMenu}>
              <Entypo name="log-out" size={20} color="black" />
            </TouchableOpacity>
          </View>

          <View style={styles.userCard}>
            <View style={{ flexDirection: "row", alignItems: 'center' }} >
              <View >
                <Image source={require("../../assets/bettpro.png")} resizeMode="cover" style={{height:60,width:100,borderRadius:5}}  />
              </View>
              <Text style={styles.title}>Betpro Officail</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Username:</Text>
              <TouchableOpacity onPress={() =>  copyToClipboard(username)} style={styles.copybtn}>
               <Text style={styles.infoValue}>{username}</Text>
              <AntDesign name="copy" size={10} color="#374151" />

              </TouchableOpacity>
             
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Password:</Text>
              <TouchableOpacity onPress={() => copyToClipboard(password)} style={styles.copybtn}>
              <Text style={styles.infoValue}>{password}</Text>
              <AntDesign name="copy" size={10} color="#374151" />

               </TouchableOpacity>
            </View>
          </View>

          {/* Easy Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Easy Actions</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("Deposit")}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionGradient}
                >
                  <MaterialIcons name="account-balance-wallet" size={20} color="white" />
                  <Text style={styles.actionText}>Deposit</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate("PaymentWithdrawal")}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionGradient}
                >
                  <Ionicons name="arrow-down-outline" size={20} color="white" />
                  <Text style={styles.actionText}>Withdrawal</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionGradient}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="white" />
                  <Text style={styles.actionText}>Support</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.transactionsSection}>
            <TouchableOpacity style={styles.trustMessage}>
              <Text style={styles.trustText}>Our Service</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerSpacer} />
        </ScrollView>
      </SafeAreaView>

      {/* Custom Slide-up Menu Modal */}
      <Modal
        transparent={true}
        visible={menuVisible}
        animationType="none"
        onRequestClose={closeMenu}
      >
        <View style={styles.modalContainer}>
          <Animated.View 
            style={[
              styles.overlay,
              {
                opacity: overlayAnim,
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.overlayTouchable}
              activeOpacity={1}
              onPress={closeMenu}
            />
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.menuContainer,
              {
                transform: [{ translateY: slideAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
            <View style={styles.menuHeader}>
              <View style={styles.menuHeaderContent}>
                <View style={styles.menuAvatar}>
                  <Text style={styles.menuAvatarText}>
                    {username !== "N/A" ? username[0].toUpperCase() : "U"}
                  </Text>
                </View>
                <View style={styles.menuUserInfo}>
                  <Text style={styles.menuUserName}>
                    {username !== "N/A" ? username : "User"}
                  </Text>
                  <Text style={styles.menuUserEmail}>
                    {user?.email || ""}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.menuItems}>
              {/* Change Password Option */}
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleChangePassword}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="key-outline" size={24} color="#9C27B0" />
                  <Text style={styles.menuItemText}>Change Password</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.menuDivider} />

              {/* Logout Option */}
              <TouchableOpacity 
                style={[styles.menuItem, styles.logoutItem]}
                onPress={handleLogout}
                activeOpacity={0.7}
                disabled={logoutLoading}
              >
                <View style={styles.menuItemLeft}>
                  {logoutLoading ? (
                    <ActivityIndicator size="small" color="#F44336" />
                  ) : (
                    <Ionicons name="log-out-outline" size={24} color="#F44336" />
                  )}
                  <Text style={[styles.menuItemText, styles.logoutText]}>
                    {logoutLoading ? "Logging out..." : "Logout"}
                  </Text>
                </View>
                {!logoutLoading && <Ionicons name="chevron-forward" size={20} color="#F44336" />}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  logostyes: {
    backgroundColor: "#9C27B0",
    height: 40,
    width: 40,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerstyles: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  headertext: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 1,
    marginLeft: 10
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    marginRight:2
  },
  actionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  trustMessage: {
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  trustText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  transactionsSection: {
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  ordersList: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  orderNumber: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
  },
  logoutBtn: {
    padding: 8,
  },
  footerSpacer: {
    height: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  overlayTouchable: {
    flex: 1,
  },
  menuContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: 30,
    maxHeight: height * 0.7,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  menuHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#9C27B0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuAvatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  menuUserInfo: {
    flex: 1,
  },
  menuUserName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  menuUserEmail: {
    fontSize: 12,
    color: "#6B7280",
  },
  closeButton: {
    padding: 8,
  },
  menuItems: {
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    color: "#374151",
    marginLeft: 12,
  },
  logoutItem: {
    marginTop: 5,
  },
  logoutText: {
    color: "#F44336",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 5,
    marginHorizontal: 20,
  },
  copybtn:{
    flexDirection:"row",
    justifyContent:"center",
    alignItems:"center",
    
  }
});