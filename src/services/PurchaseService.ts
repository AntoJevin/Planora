import Purchases, {
    CustomerInfo,
    LOG_LEVEL,
    PurchasesOfferings,
    PurchasesPackage,
} from 'react-native-purchases';
import { REVENUECAT_CONFIG } from '../config/revenuecat';

const YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * RevenueCat Purchase Service
 * Handles all subscription and purchase operations with Cloud Sync
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
     */
    async configure(): Promise<void> {
        if (this.isConfigured) {
            return;
        }

        try {
            if (__DEV__) {
                Purchases.setLogLevel(LOG_LEVEL.DEBUG);
            }

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
     */
    async getCustomerInfo(): Promise<CustomerInfo> {
        try {
            return await Purchases.getCustomerInfo();
        } catch (error) {
            console.error('Error getting customer info:', error);
            throw error;
        }
    }

    /**
     * Check if user has active entitlement
     */
    async hasEntitlement(entitlementId: string, info?: CustomerInfo): Promise<boolean> {
        try {
            const customerInfo = info || await this.getCustomerInfo();
            const entitlement = customerInfo.entitlements.active[entitlementId];
            return entitlement !== undefined && entitlement !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if user has "ManageSelf Pro" entitlement
     */
    async hasManageSelfPro(info?: CustomerInfo): Promise<boolean> {
        return this.hasEntitlement(REVENUECAT_CONFIG.entitlements.MANAGESELF_PRO, info);
    }

    /**
     * Check if user is a premium subscriber
     */
    async isPremium(info?: CustomerInfo): Promise<boolean> {
        try {
            const customerInfo = info || await this.getCustomerInfo();
            return Object.keys(customerInfo.entitlements.active).length > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get available offerings
     */
    async getOfferings(): Promise<PurchasesOfferings | null> {
        try {
            if (!this.isConfigured) return null;
            return await Purchases.getOfferings();
        } catch (error) {
            console.error('Error getting offerings:', error);
            return null;
        }
    }

    /**
     * Purchase a package
     */
    async purchasePackage(packageToPurchase: PurchasesPackage): Promise<{
        customerInfo: CustomerInfo;
        productIdentifier: string;
    }> {
        try {
            if (!this.isConfigured) throw new Error('RevenueCat not configured');
            const { customerInfo, productIdentifier } = await Purchases.purchasePackage(
                packageToPurchase
            );
            console.log('✅ Purchase successful:', productIdentifier);
            return { customerInfo, productIdentifier };
        } catch (error: any) {
            if (!error.userCancelled) {
                console.error('Error purchasing package:', error);
            }
            throw error;
        }
    }

    /**
     * Restore previous purchases
     */
    async restorePurchases(): Promise<CustomerInfo> {
        try {
            if (!this.isConfigured) throw new Error('RevenueCat not configured');
            const customerInfo = await Purchases.restorePurchases();
            console.log('✅ Purchases restored successfully');
            return customerInfo;
        } catch (error) {
            console.error('Error restoring purchases:', error);
            throw error;
        }
    }

    /**
     * Calculate and return the final expiration date
     * Combines the initial "Paid-for" year with any active IAP subscriptions
     */
    async getExpirationDate(info?: CustomerInfo): Promise<Date | null> {
        try {
            const customerInfo = info || await this.getCustomerInfo();

            // 1. Calculate Base Expiry (Original App Purchase + 1 Year)
            // Strictly use originalPurchaseDate from the Store (Apple/Google)
            // as this is persistent across reinstalls.
            const originalDateStr = customerInfo.originalPurchaseDate;

            if (!originalDateStr) {
                // If there's no store purchase date, we use firstSeen as a fallback
                // but note that this can be reset on reinstall for anonymous users.
                // For a paid app or once a user is identified, originalPurchaseDate is the source of truth.
                const fallbackDate = new Date(customerInfo.firstSeen);
                const fallbackExpiry = new Date(fallbackDate.getTime() + YEAR_IN_MS);

                // If they have an IAP, that will still be checked in step 2
                const iapExpiry = await this.getIapExpiryDate(customerInfo);
                if (!iapExpiry) return fallbackExpiry;
                return iapExpiry > fallbackExpiry ? iapExpiry : fallbackExpiry;
            }

            const basePurchaseDate = new Date(originalDateStr);
            if (isNaN(basePurchaseDate.getTime())) return null;

            const baseExpiryDate = new Date(basePurchaseDate.getTime() + YEAR_IN_MS);


            // 2. Check for IAP Entitlements (Successive Years)
            const iapExpiryDate = await this.getIapExpiryDate(customerInfo);

            // 3. Final expiry is whichever is later
            if (!iapExpiryDate) return baseExpiryDate;
            return iapExpiryDate > baseExpiryDate ? iapExpiryDate : baseExpiryDate;
        } catch (error) {
            console.error('Error getting expiration date:', error);
            return null;
        }
    }

    /**
     * Helper to get the expiry date of the ManageSelf Pro IAP
     */
    private async getIapExpiryDate(info: CustomerInfo): Promise<Date | null> {
        const entitlement = info.entitlements.active[
            REVENUECAT_CONFIG.entitlements.MANAGESELF_PRO
        ];

        if (entitlement && entitlement.expirationDate) {
            const date = new Date(entitlement.expirationDate);
            return isNaN(date.getTime()) ? null : date;
        }
        return null;
    }

    async getDaysRemaining(info?: CustomerInfo): Promise<number> {
        try {
            const expiry = await this.getExpirationDate(info);
            if (!expiry) return 0;

            const now = new Date();
            const diffTime = expiry.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return Math.max(0, diffDays);
        } catch (err) {
            console.error('Error calculating days remaining:', err);
            return 0;
        }
    }
}

export default PurchaseService.getInstance();
