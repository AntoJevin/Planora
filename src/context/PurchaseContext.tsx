import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { CustomerInfo, PurchasesOfferings } from 'react-native-purchases';
import PurchaseService from '../services/PurchaseService';

interface PurchaseContextType {
    // State
    customerInfo: CustomerInfo | null;
    offerings: PurchasesOfferings | null;
    isPremium: boolean;
    hasAccessRenewal: boolean;
    isLoading: boolean;
    error: string | null;

    // Methods
    refreshCustomerInfo: () => Promise<void>;
    restorePurchases: () => Promise<void>;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

interface PurchaseProviderProps {
    children: ReactNode;
}

export const PurchaseProvider: React.FC<PurchaseProviderProps> = ({ children }) => {
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
    const [isPremium, setIsPremium] = useState<boolean>(false);
    const [hasAccessRenewal, setHasAccessRenewal] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize and fetch customer info
    const refreshCustomerInfo = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const info = await PurchaseService.getCustomerInfo();
            setCustomerInfo(info);

            const premium = await PurchaseService.isPremium();
            setIsPremium(premium);

            const accessRenewal = await PurchaseService.hasAccessRenewal();
            setHasAccessRenewal(accessRenewal);
        } catch (err: any) {
            console.error('Error refreshing customer info:', err);
            setError(err.message || 'Failed to load subscription info');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch offerings
    const fetchOfferings = async () => {
        try {
            const offers = await PurchaseService.getOfferings();
            setOfferings(offers);
        } catch (err) {
            console.error('Error fetching offerings:', err);
        }
    };

    // Restore purchases
    const restorePurchases = async () => {
        try {
            setIsLoading(true);
            setError(null);
            await PurchaseService.restorePurchases();
            await refreshCustomerInfo();
        } catch (err: any) {
            console.error('Error restoring purchases:', err);
            setError(err.message || 'Failed to restore purchases');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize on mount
    useEffect(() => {
        const initialize = async () => {
            await refreshCustomerInfo();
            await fetchOfferings();
        };

        initialize();
    }, []);

    const value: PurchaseContextType = {
        customerInfo,
        offerings,
        isPremium,
        hasAccessRenewal,
        isLoading,
        error,
        refreshCustomerInfo,
        restorePurchases,
    };

    return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
};

// Custom hook to use purchase context
export const usePurchase = (): PurchaseContextType => {
    const context = useContext(PurchaseContext);
    if (context === undefined) {
        throw new Error('usePurchase must be used within a PurchaseProvider');
    }
    return context;
};
