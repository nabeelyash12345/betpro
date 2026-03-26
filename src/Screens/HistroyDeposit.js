// src/Screens/HistoryDeposit.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Dimensions
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getUserOrders, listenToUserOrders } from '../services/orderService';

const { width } = Dimensions.get("window");

const HistoryDeposit = ({ navigation }) => {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Set up real-time listener for orders
    const unsubscribe = listenToUserOrders(user.uid, (result) => {
      if (result.success) {
        // Filter only deposits (isDeposit === true)
        const depositOrders = result.orders.filter(order => order.isDeposit === false);
        setDeposits(depositOrders);
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
  
  // Reset time to midnight for accurate day comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = nowOnly - dateOnly;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  // Format date (Mar 26, 2026)
  const formattedDate = date.toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
 
  // Format time (12:06 PM)
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (diffDays === 0) {
 
    return `${formattedDate} at ${timeString}`;
  }
};


  const formatAmount = (amount) => {
    return `PKR ${amount?.toLocaleString() || 0}`;
  };

  const getTransactionType = (order) => {
    if (order.isDeposit) {
      return { text: 'Deposit', icon: 'arrow-down', color: '#10B981' };
    } else {
      return { text: 'Withdrawal', icon: 'arrow-up', color: '#EF4444' };
    }
  };

  // Calculate total deposits
  const totalDeposits = deposits.reduce((sum, d) => sum + (d.amount || 0), 0);

  // Render deposit card (exactly same as home screen order card)
  const renderDepositCard = ({ item: deposit }) => {
    const type = getTransactionType(deposit);
  
    return (
      <TouchableOpacity 
        key={deposit.id} 
        style={styles.orderCard}
        onPress={() => navigation.navigate("OrderDetails", { orderId: deposit.id })}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderTypeContainer}>
            <View style={[styles.orderIcon, { backgroundColor: type.color + '20' }]}>
              <Ionicons 
                name={type.icon === 'arrow-down' ? 'arrow-down-outline' : 'arrow-up-outline'} 
                size={20} 
                color={type.color} 
              />
            </View>
            <View>
              <Text style={styles.orderType}>{type.text}</Text>
              <Text style={styles.orderNumber}>{deposit.orderNumber}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(deposit.status) }]}>
            <FontAwesome5 name={getStatusIcon(deposit.status)} size={10} color="#fff" />
            <Text style={styles.statusText}>{getStatusText(deposit.status)}</Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={[styles.detailValue, { fontWeight: 'bold', color: type.color }]}>
              {formatAmount(deposit.amount)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Method:</Text>
            <Text style={styles.detailValue}>{deposit.paymentMethod}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(deposit.createdAt)}</Text>
          </View>
          {deposit.accountNumber && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account:</Text>
              <Text style={styles.detailValue}>
                {deposit.accountNumber.length > 15 
                  ? `***${deposit.accountNumber.slice(-4)}` 
                  : deposit.accountNumber}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render header with stats
  const renderHeader = () => (
    <>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Deposits</Text>
          <Text style={styles.statValue}>
            {formatAmount(totalDeposits)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Transactions</Text>
          <Text style={styles.statValue}>{deposits.length}</Text>
        </View>
      </View>
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Deposit History</Text>
        {deposits.length > 0 && (
          <Text style={styles.countText}>{deposits.length} records</Text>
        )}
      </View>
    </>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cash-outline" size={48} color="#D1D5DB" />
      <Text style={styles.emptyText}>No Deposit History</Text>
      <Text style={styles.emptySubText}>
        Your deposit transactions will appear here
      </Text>
      <TouchableOpacity 
        style={styles.depositButton}
        onPress={() => navigation.navigate("Deposit")}
      >
        <View style={styles.depositButtonInner}>
          <Text style={styles.depositButtonText}>Make a Deposit</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
       
        <Text style={styles.headerTitle}>Deposit History</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading deposit history...</Text>
        </View>
      ) : (
        <FlatList
          data={deposits}
          keyExtractor={(item) => item.id}
          renderItem={renderDepositCard}
          ListHeaderComponent={deposits.length > 0 ? renderHeader : null}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={deposits.length > 0 ? styles.listContent : styles.emptyListContent}
          showsVerticalScrollIndicator={false}
         
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    marginTop:20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  listContent: {
    padding: 20,
  },
  emptyListContent: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  countText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
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
  depositButton: {
    marginTop: 24,
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  depositButtonInner: {
    alignItems: 'center',
  },
  depositButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HistoryDeposit;