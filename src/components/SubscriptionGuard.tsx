import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePurchase } from '../context/PurchaseContext';
import PaywallScreen from './PaywallScreen';

interface SubscriptionGuardProps {
    children: React.ReactNode;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
    const { daysRemaining, isPremium, hasManageSelfPro, isLoading, error, refreshCustomerInfo } = usePurchase();

    if (daysRemaining > 0 || isPremium || hasManageSelfPro) {
        return <>{children}</>;
    }

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={[styles.title, { marginTop: 12 }]}>Checking subscription...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Something went wrong</Text>
                <Text style={styles.subtitle}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={refreshCustomerInfo}
                >
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
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
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    retryButton: {
        marginTop: 24,
        backgroundColor: '#6366f1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: '600',
    },
});

export default SubscriptionGuard;
