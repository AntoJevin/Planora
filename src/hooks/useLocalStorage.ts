import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(initialValue);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStoredValue = async () => {
            try {
                const item = await AsyncStorage.getItem(key);
                if (item) {
                    setStoredValue(JSON.parse(item));
                }
            } catch (error) {
                console.error('Error loading data from AsyncStorage:', error);
            } finally {
                setLoading(false);
            }
        };

        loadStoredValue();
    }, [key]);

    const setValue = async (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error('Error saving data to AsyncStorage:', error);
        }
    };

    return [storedValue, setValue, loading] as const;
}
