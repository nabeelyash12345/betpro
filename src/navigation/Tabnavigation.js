import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Withdrawal from '../Screens/Withdrawal';
import HomeScreen from '../Screens/HomeScreen';
import HistroyDeposit from '../Screens/HistroyDeposit';



const Tab = createBottomTabNavigator();

export default function TabNavigation() {

    const insets = useSafeAreaInsets();

  return (
    <SafeAreaProvider>
   
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Deposit History') {
                iconName = focused ? 'remove-circle' : 'remove-circle';
              } else if (route.name === 'Withdrawal History') {
                iconName = focused ? 'swap-horizontal' : 'swap-horizontal';
              }

              // You can return any component here
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            headerShown:false,
            tabBarHideOnKeyboard: true,
            tabBarActiveTintColor: '#000',
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: {
              backgroundColor: 'white',
              borderTopWidth: 1,
              borderTopColor: '#e0e0e0',
              height: 70 + insets.bottom,
              paddingBottom: insets.bottom,
              paddingTop: 5,
              borderTopRightRadius:20,
              borderTopLeftRadius:20,
             
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
            },
            headerStyle: {
              backgroundColor: '#FF6B6B',
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: 'white',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 20,
            },
          })}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeScreen} 
           
          />
            <Tab.Screen 
            name="Deposit History" 
            component={HistroyDeposit} 
           
          />
         
          <Tab.Screen 
            name="Withdrawal History" 
            component={Withdrawal} 
           
          />
        </Tab.Navigator>
        
     
    </SafeAreaProvider>
  );
}