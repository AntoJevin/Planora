import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePurchase } from '../context/PurchaseContext';
import PaywallScreen from './PaywallScreen';

interface SubscriptionGuardProps {
    children: React.ReactNode;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
    const { daysRemaining, isPremium, hasAccessRenewal, isLoading, refreshCustomerInfo } = usePurchase();

    if (daysRemaining > 0 || isPremium || hasAccessRenewal) {
        return <>{children}</>;
    }

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Checking subscription...</Text>
            </View>
        );
    }

    return (
        <PaywallScreen
            onPurchaseCompleted={refreshCustomerInfo}
            onDismiss={refreshCustomerInfo}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
});

export default SubscriptionGuard;
