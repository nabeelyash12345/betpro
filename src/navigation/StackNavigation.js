// src/navigation/StackNavigation.js
import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../Screens/HomeScreen';
import LoginScreen from '../Screens/LoginScreen';
import SignupScreen from '../Screens/SignupScreen';
import HomeInActiveUser from '../Screens/HomeInActiveUser';
import SplashScreen from '../Screens/Splash';
import Deposit  from '../Screens/Deposit'
import TabNavigation from './Tabnavigation';
import PaymentWithdrawal from '../Screens/PaymentWithdrawal';
import ChangePasswordScreen from '../Screens/ChnagePassword';

const Stack = createNativeStackNavigator();

export default function RootStack() {
  const { user, loading,userProfile } = useAuth();

   if (loading || (user && !userProfile)) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Not logged in - show auth screens
        <>
       
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
         

          <Stack.Screen name="SignupScreen" component={SignupScreen} />
        </>
      ) : (
        // Logged in - show home screen
        <>
        {
          !userProfile?.isAccepted ? (
            <Stack.Screen name="HomeInActiveUser" component={HomeInActiveUser} />
          ) : (
            <>
            <Stack.Screen name="TabNavigation" component={TabNavigation} />
            
            <Stack.Screen name="Deposit" component={Deposit} />
            <Stack.Screen name="PaymentWithdrawal" component={PaymentWithdrawal} />
            <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
            
            
            </>
            
          )
        }
        </>
      
      )}
    </Stack.Navigator>
  );
}