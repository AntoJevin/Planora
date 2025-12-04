import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface SettingsContextType {
    targetHours: number;
    setTargetHours: (hours: number) => Promise<void>;
    darkMode: boolean;
    setDarkMode: (value: boolean) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
    targetHours: 8,
    setTargetHours: async () => { },
    darkMode: false,
    setDarkMode: async () => { },
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [targetHours, setTargetHoursState] = useState(8);
    const [darkMode, setDarkModeState] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedTargetHours = await AsyncStorage.getItem('targetHours');
            if (savedTargetHours !== null) {
                setTargetHoursState(parseFloat(savedTargetHours));
            }
            const savedDarkMode = await AsyncStorage.getItem('darkMode');
            if (savedDarkMode !== null) {
                setDarkModeState(savedDarkMode === 'true');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const setTargetHours = async (hours: number) => {
        try {
            await AsyncStorage.setItem('targetHours', hours.toString());
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

    return (
        <SettingsContext.Provider value={{ targetHours, setTargetHours, darkMode, setDarkMode }}>
            {children}
        </SettingsContext.Provider>
    );
};
