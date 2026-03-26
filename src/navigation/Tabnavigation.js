import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Withdrawal from '../Screens/Withdrawal';
import HomeScreen from '../Screens/HomeScreen';
import HistroyDeposit from '../Screens/HistroyDeposit';



const Tab = createBottomTabNavigator();

export default function TabNavigation() {
  return (
    <SafeAreaProvider>
   
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Withdrawal History') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Deposit History') {
                iconName = focused ? 'person' : 'person-outline';
              } else if (route.name === 'BetFlow Login') {
                iconName = focused ? 'settings' : 'settings-outline';
              }

              // You can return any component here
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            headerShown:false,
            tabBarActiveTintColor: '#FF6B6B',
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: {
              backgroundColor: 'white',
              borderTopWidth: 1,
              borderTopColor: '#e0e0e0',
              height: 80,
              paddingBottom: 10,
              paddingTop: 5,
              borderTopRightRadius:20,
              borderTopLeftRadius:20
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
            name="Withdrawal History" 
            component={HomeScreen} 
           
          />
            <Tab.Screen 
            name="Deposit History" 
            component={HistroyDeposit} 
           
          />
         
          <Tab.Screen 
            name="BetFlow Login" 
            component={Withdrawal} 
           
          />
        </Tab.Navigator>
        
     
    </SafeAreaProvider>
  );
}