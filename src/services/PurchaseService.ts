import Purchases, {
    CustomerInfo,
    LOG_LEVEL,
    PurchasesOfferings,
    PurchasesPackage,
} from 'react-native-purchases';
import { REVENUECAT_CONFIG } from '../config/revenuecat';

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

            if (entitlement && entitlement.expirationDate) {
                return new Date(entitlement.expirationDate);
            }

            return null;
        } catch (error) {
            console.error('Error getting expiration date:', error);
            return null;
        }
    }
}

export default PurchaseService.getInstance();
