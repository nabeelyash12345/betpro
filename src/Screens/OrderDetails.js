import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get("window");

const OrderDetails = ({ route, navigation }) => {
  const { order } = route.params;

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
        return 'clock';
      case 'approved':
        return 'check-circle';
      case 'rejected':
        return 'times-circle';
      case 'completed':
        return 'check-circle-double';
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
    return date.toLocaleString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return `PKR ${amount?.toLocaleString() || 0}`;
  };

  const DetailRow = ({ label, value, isImportant = false }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, isImportant && styles.importantValue]}>
        {value || 'N/A'}
      </Text>
    </View>
  );

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIconContainer, { backgroundColor: getStatusColor(order.status) + '20' }]}>
            <FontAwesome5 name={getStatusIcon(order.status)} size={32} color={getStatusColor(order.status)} />
          </View>
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
            {getStatusText(order.status)}
          </Text>
          <Text style={styles.orderNumberText}>{order.orderNumber}</Text>
        </View>

        {/* Transaction Details */}
        <Section title="Transaction Details">
          <DetailRow label="Type" value={order.isDeposit ? 'Deposit' : 'Withdrawal'} isImportant />
          <DetailRow label="Amount" value={formatAmount(order.amount)} isImportant />
          <DetailRow label="Payment Method" value={order.paymentMethod} />
          <DetailRow label="Account Number" value={order.accountNumber} />
          {order.bpId && <DetailRow label="BP ID" value={order.bpId} />}
          {order.bpPassword && <DetailRow label="BP Password" value="••••••••" />}
        </Section>

        {/* User Information */}
        <Section title="User Information">
          <DetailRow label="User ID" value={order.userId} />
          <DetailRow label="Name" value={order.userName} />
          <DetailRow label="Email" value={order.userEmail} />
        </Section>

        {/* Order Information */}
        <Section title="Order Information">
          <DetailRow label="Order ID" value={order.id} />
          <DetailRow label="Order Number" value={order.orderNumber} />
          <DetailRow label="Created At" value={formatDate(order.createdAt)} />
          <DetailRow label="Last Updated" value={formatDate(order.updatedAt)} />
        </Section>

        {/* Additional Notes */}
        {order.notes && (
          <Section title="Notes">
            <Text style={styles.notesText}>{order.notes}</Text>
          </Section>
        )}

        {/* Admin Section - Only show if screenshotAdmin exists */}
        {order.screenshotAdmin && (
          <Section title="Admin Information">
            <DetailRow label="Admin Screenshot" value="Uploaded" />
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  scrollContent: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  orderNumberText: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionContent: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  importantValue: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    padding: 16,
  },
});

export default OrderDetails;