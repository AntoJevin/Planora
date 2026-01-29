import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface SettingsContextType {
    targetHours: number;
    setTargetHours: (hours: number) => Promise<void>;
    darkMode: boolean;
    setDarkMode: (value: boolean) => Promise<void>;
    vaultPasscode: string;
    setVaultPasscode: (passcode: string) => Promise<void>;
    biometricsEnabled: boolean;
    setBiometricsEnabled: (value: boolean) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
    targetHours: 40,
    setTargetHours: async () => { },
    darkMode: false,
    setDarkMode: async () => { },
    vaultPasscode: '1234',
    setVaultPasscode: async () => { },
    biometricsEnabled: false,
    setBiometricsEnabled: async () => { },
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [targetHours, setTargetHoursState] = useState(40);
    const [darkMode, setDarkModeState] = useState(false);
    const [vaultPasscode, setVaultPasscodeState] = useState('1234');
    const [biometricsEnabled, setBiometricsEnabledState] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            // Try to load weekly target hours first
            let savedTargetHours = await AsyncStorage.getItem('weeklyTargetHours');

            // If not found, check for old daily target hours and migrate
            if (savedTargetHours === null) {
                const oldDailyHours = await AsyncStorage.getItem('targetHours');
                if (oldDailyHours !== null) {
                    // Migrate: multiply daily hours by 7 to get weekly
                    const weeklyHours = parseFloat(oldDailyHours) * 7;
                    await AsyncStorage.setItem('weeklyTargetHours', weeklyHours.toString());
                    await AsyncStorage.removeItem('targetHours'); // Clean up old key
                    setTargetHoursState(weeklyHours);
                } else {
                    setTargetHoursState(40); // Default to 40 hours per week
                }
            } else {
                setTargetHoursState(parseFloat(savedTargetHours));
            }

            const savedDarkMode = await AsyncStorage.getItem('darkMode');
            if (savedDarkMode !== null) {
                setDarkModeState(savedDarkMode === 'true');
            }

            const savedPasscode = await AsyncStorage.getItem('vaultPasscode');
            if (savedPasscode !== null) {
                setVaultPasscodeState(savedPasscode);
            }

            const savedBiometrics = await AsyncStorage.getItem('biometricsEnabled');
            if (savedBiometrics !== null) {
                setBiometricsEnabledState(savedBiometrics === 'true');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const setTargetHours = async (hours: number) => {
        try {
            await AsyncStorage.setItem('weeklyTargetHours', hours.toString());
            setTargetHoursState(hours);
        } catch (error) {
            console.error('Error saving target hours:', error);
        }
    };

    const setDarkMode = async (value: boolean) => {
        try {
            await AsyncStorage.setItem('darkMode', value.toString());
            setDarkModeState(value);
        } catch (error) {
            console.error('Error saving dark mode:', error);
        }
    };

    const setVaultPasscode = async (passcode: string) => {
        try {
            await AsyncStorage.setItem('vaultPasscode', passcode);
            setVaultPasscodeState(passcode);
        } catch (error) {
            console.error('Error saving vault passcode:', error);
        }
    };

    const setBiometricsEnabled = async (value: boolean) => {
        try {
            await AsyncStorage.setItem('biometricsEnabled', value.toString());
            setBiometricsEnabledState(value);
        } catch (error) {
            console.error('Error saving biometrics setting:', error);
        }
    };

    return (
        <SettingsContext.Provider value={{
            targetHours,
            setTargetHours,
            darkMode,
            setDarkMode,
            vaultPasscode,
            setVaultPasscode,
            biometricsEnabled,
            setBiometricsEnabled
        }}>
            {children}
        </SettingsContext.Provider>
    );
};
