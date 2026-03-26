import { Platform } from 'react-native';

// RevenueCat Configuration
export const REVENUECAT_CONFIG = {
    // API Keys
    apiKey: Platform.select({
        ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
        android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    }) || '',

    // Entitlements
    entitlements: {
        MANAGESELF_PRO: 'ManageSelf Pro',
    },

    // Product IDs
    products: {
        MONTHLY: 'monthly',
        YEARLY: 'yearly',
        LIFETIME: 'lifetime',
    },

    // Feature flags
    features: {
        ENABLE_CUSTOMER_CENTER: true,
        ENABLE_PAYWALL: true,
    },
};
