// src/Screens/HomeScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  RefreshControl,
  ActivityIndicator
} from "react-native";
import { Entypo, Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { getUserOrders, listenToUserOrders } from "../services/orderService";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const { user, userProfile, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const username = userProfile?.bpUsername ?? "N/A";
  const password = userProfile?.bpPassword ?? "";

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
    // Listener will automatically update
  };

  const handleLogout = async () => {
    await logout();
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
            <Text style={styles.headertext}>Betpro Zone</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Entypo name="log-out" size={20} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.userCard}>
          <View style={{ flexDirection: "row", alignItems: 'center' }} >
            <View style={styles.logostyes}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>BP</Text>
            </View>
            <Text style={styles.title}>Betpro Zone</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username:</Text>
            <Text style={styles.infoValue}>{username}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Password:</Text>
            <Text style={styles.infoValue}>{password}</Text>
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
              onPress={() => navigation.navigate("Withdraw")}
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

        {/* Trusted Platform Message */}
        {/* <View style={styles.trustMessage}>
          <Text style={styles.trustText}>🔒 The Most Trusted Betting Platform Instar</Text>
        </View> */}

        {/* Recent Orders Section */}
        {/* <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            {orders.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate("Orders")}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
          ) : recentOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No orders yet</Text>
              <Text style={styles.emptySubText}>
                Tap on Deposit or Withdrawal to create your first order
              </Text>
            </View>
          ) : (
            <View style={styles.ordersList}>
              {recentOrders.map((order) => {
                const type = getTransactionType(order);
                return (
                  <TouchableOpacity 
                    key={order.id} 
                    style={styles.orderCard}
                 
                  >
                    <View style={styles.orderHeader}>
                      <View style={styles.orderTypeContainer}>
                        <View style={[styles.orderIcon, { backgroundColor: type.color + '20' }]}>
                          <Ionicons name={type.icon === 'arrow-down' ? 'arrow-down-outline' : 'arrow-up-outline'} size={20} color={type.color} />
                        </View>
                        <View>
                          <Text style={styles.orderType}>{type.text}</Text>
                          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                        <FontAwesome5 name={getStatusIcon(order.status)} size={10} color="#fff" />
                        <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                      </View>
                    </View>

                    <View style={styles.orderDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Amount:</Text>
                        <Text style={[styles.detailValue, { fontWeight: 'bold', color: type.color }]}>
                          {formatAmount(order.amount)}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Method:</Text>
                        <Text style={styles.detailValue}>{order.paymentMethod}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date:</Text>
                        <Text style={styles.detailValue}>{formatDate(order.createdAt)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View> */}

        <View style={styles.transactionsSection}>
          <TouchableOpacity style={styles.trustMessage}>
            <Text style={styles.trustText}>Our Service</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
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
});