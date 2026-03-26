import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthContext, AuthProvider } from './src/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import VisitorLogScreen from './src/screens/VisitorLogScreen';
import CallLogScreen from './src/screens/CallLogScreen';
import HostListScreen from './src/screens/HostListScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import UserListScreen from './src/screens/UserListScreen';
import ReportScreen from './src/screens/ReportScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import KioskHomeScreen from './src/screens/kiosk/KioskHomeScreen';
import KioskCheckInScreen from './src/screens/kiosk/KioskCheckInScreen';
import KioskCheckOutScreen from './src/screens/kiosk/KioskCheckOutScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366F1',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          )
        }}
      />
      <Tab.Screen
        name="Visitors"
        component={VisitorLogScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          )
        }}
      />
      <Tab.Screen
        name="Calls"
        component={CallLogScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="call-outline" size={size} color={color} />
          )
        }}
      />
      <Tab.Screen
        name="Phonebook"
        component={HostListScreen}
        options={{
          tabBarLabel: 'Phonebook',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          )
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          )
        }}
      />
    </Tab.Navigator>
  );
};

const AppNav = () => {
  const { isLoading, userToken, mustChangePassword } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {userToken ? (
        mustChangePassword ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator>
            <Stack.Screen name="Home" component={HomeTabs} options={{ headerShown: false }} />
            <Stack.Screen name="UserList" component={UserListScreen} options={{ title: 'User Management' }} />
            <Stack.Screen name="Reports" component={ReportScreen} options={{ title: 'Reports' }} />

            {/* Kiosk Mode Screens */}
            <Stack.Screen name="KioskHome" component={KioskHomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="KioskCheckIn" component={KioskCheckInScreen} options={{ headerShown: false }} />
            <Stack.Screen name="KioskCheckOut" component={KioskCheckOutScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        )
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppNav />
    </AuthProvider>
  );
}
