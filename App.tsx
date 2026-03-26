import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import "./global.css";

import ProfileTab from './src/components/ProfileTab';
import SettingsTab from './src/components/SettingsTab';
import SubscriptionGuard from './src/components/SubscriptionGuard';
import TimesheetTab from './src/components/TimesheetTab';
import TodoTab from './src/components/TodoTab';
import VaultTab from './src/components/VaultTab';
import { PurchaseProvider } from './src/context/PurchaseContext';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { initDB } from './src/database/db';
import { createTables } from './src/database/schema';
import PurchaseService from './src/services/PurchaseService';


const Tab = createBottomTabNavigator();

const MainNavigator = () => {
    const { darkMode } = useSettings();
    const insets = useSafeAreaInsets();

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
                        } else if (route.name === 'Profile') {
                            iconName = focused ? 'person' : 'person-outline';
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
                        paddingBottom: Math.max(insets.bottom, 5),
                        paddingTop: 5,
                        height: 55 + Math.max(insets.bottom, 5),
                    },
                    headerShown: false,
                })}
            >
                <Tab.Screen name="Timesheet" component={TimesheetTab} options={{ title: 'Timesheet' }} />
                <Tab.Screen name="Todo" component={TodoTab} options={{ title: 'To-Do' }} />
                <Tab.Screen name="Vault" component={VaultTab} options={{ title: 'Vault' }} />
                <Tab.Screen name="Profile" component={ProfileTab} options={{ title: 'Profile' }} />
                <Tab.Screen name="Settings" component={SettingsTab} options={{ title: 'Settings' }} />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

export default function App() {
    const [isDBReady, setIsDBReady] = useState(false);
    const [isRevenueCatReady, setIsRevenueCatReady] = useState(false);

    useEffect(() => {
        const setupApp = async () => {
            // 1. Initialize database (Critical)
            try {
                await initDB();
                await createTables();
                setIsDBReady(true);
            } catch (e) {
                console.error('Database setup failed:', e);
                // We still set ready so the app can show an error or blank state
                // rather than hanging forever on the splash screen
                setIsDBReady(true);
            }

            // 2. Initialize RevenueCat (Non-blocking)
            try {
                await PurchaseService.configure();
            } catch (e) {
                console.error('RevenueCat configuration failed:', e);
            } finally {
                setIsRevenueCatReady(true);
            }
        };
        setupApp();
    }, []);

    if (!isDBReady || !isRevenueCatReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    return (
        <SettingsProvider>
            <PurchaseProvider>
                <SafeAreaProvider>
                    <SubscriptionGuard>
                        <MainNavigator />
                    </SubscriptionGuard>
                    <StatusBar style="auto" />
                </SafeAreaProvider>
            </PurchaseProvider>
        </SettingsProvider>
    );
}

import { registerRootComponent } from 'expo';
registerRootComponent(App);
