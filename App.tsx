import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "./global.css";

import SettingsTab from './src/components/SettingsTab';
import TimesheetTab from './src/components/TimesheetTab';
import TodoTab from './src/components/TodoTab';
import VaultTab from './src/components/VaultTab';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { initDB } from './src/database/db';
import { createTables } from './src/database/schema';


const Tab = createBottomTabNavigator();

const MainNavigator = () => {
    const { darkMode } = useSettings();
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;
                        if (route.name === 'Timesheet') {
                            iconName = focused ? 'time' : 'time-outline';
                        } else if (route.name === 'Todo') {
                            iconName = focused ? 'checkbox' : 'checkbox-outline';
                        } else if (route.name === 'Vault') {
                            iconName = focused ? 'shield' : 'shield-outline';
                        } else if (route.name === 'Settings') {
                            iconName = focused ? 'settings' : 'settings-outline';
                        }
                        // @ts-ignore
                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: '#6366f1', // primary color
                    tabBarInactiveTintColor: '#6b7280',
                    tabBarStyle: {
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        borderTopColor: darkMode ? '#374151' : '#e5e7eb',
                        paddingBottom: 5,
                        paddingTop: 5,
                        height: 60,
                    },
                    headerShown: false,
                })}
            >
                <Tab.Screen name="Timesheet" component={TimesheetTab} options={{ title: 'Timesheet' }} />
                <Tab.Screen name="Todo" component={TodoTab} options={{ title: 'To-Do' }} />
                <Tab.Screen name="Vault" component={VaultTab} options={{ title: 'Vault' }} />
                <Tab.Screen name="Settings" component={SettingsTab} options={{ title: 'Settings' }} />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

export default function App() {
    const [isDBReady, setIsDBReady] = useState(false);

    useEffect(() => {
        const setupDB = async () => {
            try {
                await initDB();
                await createTables();
                setIsDBReady(true);
            } catch (e) {
                console.error('Database setup failed:', e);
            }
        };
        setupDB();
    }, []);

    if (!isDBReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    return (
        <SettingsProvider>
            <SafeAreaProvider>
                <MainNavigator />
                <StatusBar style="auto" />
            </SafeAreaProvider>
        </SettingsProvider>
    );
}

import { registerRootComponent } from 'expo';
registerRootComponent(App);
