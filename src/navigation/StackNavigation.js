// src/navigation/StackNavigation.js
import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../Screens/LoginScreen';
import SignupScreen from '../Screens/SignupScreen';
import HomeInActiveUser from '../Screens/HomeInActiveUser';
import SplashScreen from '../Screens/Splash';
import Deposit from '../Screens/DepositScreen';
import TabNavigation from './Tabnavigation';
import PaymentWithdrawal from '../Screens/PaymentWithdrawal';
import ChangePasswordScreen from '../Screens/ChnagePassword';
import OrderDetails from '../Screens/OrderDetails';
import TermsScreen from '../Screens/TermsScreen';
import PrivacyPolicyScreen from "../Screens/PrivacyPolicyScreen";
import ForgotPasswordScreen from "../Screens/ForgotPasswordScreen";

const Stack = createNativeStackNavigator();

export default function RootStack() {
  const { user, loading, userProfile, profileNotFound } = useAuth();

  // Show splash while loading
  // Stop showing splash if profileNotFound (deleted account) — go to login
  if (loading || (user && !userProfile && !profileNotFound)) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user || profileNotFound ? (
        // Not logged in OR account deleted from database — show auth screens
        <>
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="SignupScreen" component={SignupScreen} />
          <Stack.Screen name="TermsScreen" component={TermsScreen} />
          <Stack.Screen name="PrivacyPolicyScreen" component={PrivacyPolicyScreen} />
          <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
        </>
      ) : (
        // Logged in — show app screens
        <>
          {!userProfile?.isAccepted ? (
            <Stack.Screen name="HomeInActiveUser" component={HomeInActiveUser} />
          ) : (
            <>
              <Stack.Screen name="TabNavigation" component={TabNavigation} />
              <Stack.Screen name="Deposit" component={Deposit} />
              <Stack.Screen name="PaymentWithdrawal" component={PaymentWithdrawal} />
              <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
              <Stack.Screen name="OrderDetails" component={OrderDetails} />
            </>
          )}
        </>
      )}
    </Stack.Navigator>
  );
}