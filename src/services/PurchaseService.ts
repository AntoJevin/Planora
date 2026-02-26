import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, {
    CustomerInfo,
    LOG_LEVEL,
    PurchasesOfferings,
    PurchasesPackage,
} from 'react-native-purchases';
import { REVENUECAT_CONFIG } from '../config/revenuecat';

const INITIAL_LAUNCH_DATE_KEY = 'initial_launch_date';
const PURCHASED_DAYS_KEY = 'purchased_subscription_days';
const TRIAL_DAYS = 365;

/**
 * RevenueCat Purchase Service
 * Handles all subscription and purchase operations
 */
class PurchaseService {
    private static instance: PurchaseService;
    private isConfigured: boolean = false;

    private constructor() { }

    static getInstance(): PurchaseService {
        if (!PurchaseService.instance) {
            PurchaseService.instance = new PurchaseService();
        }
        return PurchaseService.instance;
    }

    /**
     * Initialize RevenueCat SDK
     * Should be called once at app startup
     */
    async configure(): Promise<void> {
        if (this.isConfigured) {
            console.log('RevenueCat already configured');
            return;
        }

        try {
            // Track initial launch date for trial
            await this.trackInitialLaunch();

            // Enable debug logs in development
            if (__DEV__) {
                Purchases.setLogLevel(LOG_LEVEL.DEBUG);
            }

            // Configure the SDK
            Purchases.configure({
                apiKey: REVENUECAT_CONFIG.apiKey,
            });

            this.isConfigured = true;
            console.log('✅ RevenueCat configured successfully');
        } catch (error) {
            console.error('❌ Error configuring RevenueCat:', error);
            throw error;
        }
    }

    /**
     * Track the first time the app was opened
     */
    private async trackInitialLaunch(): Promise<void> {
        try {
            const storedDate = await AsyncStorage.getItem(INITIAL_LAUNCH_DATE_KEY);
            if (!storedDate) {
                const now = new Date().toISOString();
                await AsyncStorage.setItem(INITIAL_LAUNCH_DATE_KEY, now);
                console.log('🚀 Initial launch date set:', now);
            }
        } catch (error) {
            console.error('Error tracking initial launch:', error);
        }
    }

    /**
     * Get total bonus days purchased
     */
    private async getPurchasedDays(): Promise<number> {
        try {
            const stored = await AsyncStorage.getItem(PURCHASED_DAYS_KEY);
            return stored ? parseInt(stored, 10) : 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Increment purchased days
     */
    private async addPurchasedDays(days: number): Promise<void> {
        try {
            const current = await this.getPurchasedDays();
            await AsyncStorage.setItem(PURCHASED_DAYS_KEY, (current + days).toString());
            console.log(`✅ Stored bonus days incremented: ${current} -> ${current + days}`);
        } catch (error) {
            console.error('Error adding purchased days:', error);
        }
    }

    /**
     * Get the date when the initial trial expires
     */
    async getTrialExpirationDate(): Promise<Date> {
        try {
            const storedDate = await AsyncStorage.getItem(INITIAL_LAUNCH_DATE_KEY);
            const launchDate = storedDate ? new Date(storedDate) : new Date();
            const expirationDate = new Date(launchDate);
            expirationDate.setDate(expirationDate.getDate() + TRIAL_DAYS);
            return expirationDate;
        } catch (error) {
            console.error('Error getting trial expiration:', error);
            return new Date(); // Fallback to now (expired) if error
        }
    }

    /**
     * Get current customer info
     * Includes subscription status and entitlements
     */
    async getCustomerInfo(): Promise<CustomerInfo> {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            return customerInfo;
        } catch (error) {
            console.error('Error getting customer info:', error);
            throw error;
        }
    }

    /**
     * Check if user has active entitlement
     * @param entitlementId - The entitlement identifier to check
     */
    async hasEntitlement(entitlementId: string): Promise<boolean> {
        try {
            const customerInfo = await this.getCustomerInfo();
            const entitlement = customerInfo.entitlements.active[entitlementId];
            return entitlement !== undefined && entitlement !== null;
        } catch (error) {
            console.error('Error checking entitlement:', error);
            return false;
        }
    }

    /**
     * Check if user has "Access Renewal - 1 Year" entitlement
     */
    async hasAccessRenewal(): Promise<boolean> {
        return this.hasEntitlement(REVENUECAT_CONFIG.entitlements.ACCESS_RENEWAL);
    }



    /**
     * Check if user is a premium subscriber (has any active entitlement)
     */
    async isPremium(): Promise<boolean> {
        try {
            const customerInfo = await this.getCustomerInfo();
            const activeEntitlements = Object.keys(customerInfo.entitlements.active);
            return activeEntitlements.length > 0;
        } catch (error) {
            console.error('Error checking premium status:', error);
            return false;
        }
    }

    /**
     * Get available offerings
     * Returns all subscription packages configured in RevenueCat
     */
    async getOfferings(): Promise<PurchasesOfferings | null> {
        try {
            const offerings = await Purchases.getOfferings();
            return offerings;
        } catch (error) {
            console.error('Error getting offerings:', error);
            return null;
        }
    }

    /**
     * Purchase a package
     * @param packageToPurchase - The package to purchase
     */
    async purchasePackage(packageToPurchase: PurchasesPackage): Promise<{
        customerInfo: CustomerInfo;
        productIdentifier: string;
    }> {
        try {
            const { customerInfo, productIdentifier } = await Purchases.purchasePackage(
                packageToPurchase
            );

            // Increment purchased days (stacking logic)
            await this.addPurchasedDays(TRIAL_DAYS);

            // Also reset trial launch date to today for safety
            await AsyncStorage.setItem(INITIAL_LAUNCH_DATE_KEY, new Date().toISOString());

            console.log('✅ Purchase successful:', productIdentifier);
            return { customerInfo, productIdentifier };
        } catch (error: any) {
            if (error.userCancelled) {
                console.log('User cancelled purchase');
            } else {
                console.error('Error purchasing package:', error);
            }
            throw error;
        }
    }

    /**
     * Restore previous purchases
     * Useful when user reinstalls app or switches devices
     */
    async restorePurchases(): Promise<CustomerInfo> {
        try {
            const customerInfo = await Purchases.restorePurchases();

            // Also reset trial launch date to today for safety
            await AsyncStorage.setItem(INITIAL_LAUNCH_DATE_KEY, new Date().toISOString());

            console.log('✅ Purchases restored successfully');
            return customerInfo;
        } catch (error) {
            console.error('Error restoring purchases:', error);
            throw error;
        }
    }

    /**
     * Identify user with custom ID
     * @param userId - Your app's user identifier
     */
    async identifyUser(userId: string): Promise<void> {
        try {
            await Purchases.logIn(userId);
            console.log('✅ User identified:', userId);
        } catch (error) {
            console.error('Error identifying user:', error);
            throw error;
        }
    }

    /**
     * Log out current user
     */
    async logoutUser(): Promise<void> {
        try {
            await Purchases.logOut();
            console.log('✅ User logged out');
        } catch (error) {
            console.error('Error logging out user:', error);
            throw error;
        }
    }

    /**
     * Get subscription expiration date
     */
    async getExpirationDate(): Promise<Date | null> {
        try {
            const customerInfo = await this.getCustomerInfo();
            const entitlement = customerInfo.entitlements.active[
                REVENUECAT_CONFIG.entitlements.ACCESS_RENEWAL
            ];

            let revenueCatExpiry: Date | null = null;
            if (entitlement && entitlement.expirationDate) {
                revenueCatExpiry = new Date(entitlement.expirationDate);
            }

            const trialExpiry = await this.getTrialExpirationDate();

            // Add any bonus days purchased
            const bonusDays = await this.getPurchasedDays();
            const finalLocalExpiry = new Date(trialExpiry);
            finalLocalExpiry.setDate(finalLocalExpiry.getDate() + bonusDays);

            // Total access is whichever is later
            if (!revenueCatExpiry) return finalLocalExpiry;
            return revenueCatExpiry > finalLocalExpiry ? revenueCatExpiry : finalLocalExpiry;
        } catch (error) {
            console.error('Error getting expiration date:', error);
            return null;
        }
    }

    /**
     * Calculate remaining active days
     */
    async getDaysRemaining(): Promise<number> {
        const expiry = await this.getExpirationDate();
        if (!expiry) return 0;

        const now = new Date();
        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    }


}

export default PurchaseService.getInstance();
