import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';

// Import our screens
import { ObservationForm } from './src/components/ObservationForm';
import { OutboxScreen } from './src/components/OutboxScreen';
import { SettingsScreen } from './src/components/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof MaterialIcons.glyphMap = 'add-circle';

            if (route.name === 'Observe') {
              iconName = 'add-circle';
            } else if (route.name === 'Outbox') {
              iconName = 'inbox';
            } else if (route.name === 'Settings') {
              iconName = 'settings';
            }

            return <MaterialIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen
          name="Observe"
          component={ObservationForm}
          options={{
            title: 'New Observation',
            headerTitle: 'Wildlife Tracker',
          }}
        />
        <Tab.Screen
          name="Outbox"
          component={OutboxScreen}
          options={{
            title: 'Outbox',
            headerTitle: 'Sync Queue',
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
            headerTitle: 'Settings',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
