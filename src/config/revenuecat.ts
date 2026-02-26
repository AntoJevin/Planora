// RevenueCat Configuration
export const REVENUECAT_CONFIG = {
    // API Keys
    apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '',

    // Entitlements
    entitlements: {
        ACCESS_RENEWAL: 'Access Renewal - 1 Year',
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
