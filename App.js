import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootStack from './src/navigation/StackNavigation';


export default function App() {
  return (
  
       <NavigationContainer>
            <RootStack />
          </NavigationContainer>
  
  );
}


