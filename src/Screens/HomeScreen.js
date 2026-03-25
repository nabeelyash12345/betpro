import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Entypo, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const { user, userProfile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // Mock data – replace with real data later
  const username = "Zone80390";
  const password = "Zone80390";

  const recentTransactions = []; // Empty for now

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      
     <View style={styles.headerstyles}>
      <View>
        
      <Text style={styles.headertext}>Betpro Zone</Text>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Entypo name="log-out" size={20} color="black" />
        </TouchableOpacity>
     </View>

       
        <View style={styles.userCard}>
          <View style={{flexDirection:"row", alignItems:'center'}} >
            <View style={styles.logostyes}>
          <Text>BP</Text>
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
            <TouchableOpacity style={styles.actionButton}>
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

            <TouchableOpacity style={styles.actionButton}>
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
        <View style={styles.trustMessage}>
          <Text style={styles.trustText}>🔒 The Most Trusted Betting Platform Instar</Text>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          ) : (
            // If there are transactions, map them here
            <></>
          )}
        </View>

        {/* Logout Button */}
        

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
  logostyes:{
     backgroundColor:"red",
     height:30,
     width:30,
     borderRadius:100,
     justifyContent:'center',
     alignItems:'center'
     
  },
  headerstyles:{
  justifyContent:'space-between',
  flexDirection:'row',
  marginTop:20,
  marginBottom:20
  },
  headertext:{
    fontSize:25
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 1,
    marginLeft:10
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
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
    fontSize: 14,
    color: '#9CA3AF',
  },
  logoutBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  logoutGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  footerSpacer: {
    height: 20,
  },
});