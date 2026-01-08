import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { usePurchase } from '../context/PurchaseContext';

interface PaywallScreenProps {
    onDismiss?: () => void;
    onPurchaseCompleted?: () => void;
}

/**
 * RevenueCat Paywall Screen
 * Displays subscription offerings using RevenueCat's pre-built paywall UI
 */
const PaywallScreen: React.FC<PaywallScreenProps> = ({ onDismiss, onPurchaseCompleted }) => {
    const { refreshCustomerInfo } = usePurchase();
    const [isLoading, setIsLoading] = useState(false);

    const handlePaywallResult = async (result: PAYWALL_RESULT) => {
        switch (result) {
            case PAYWALL_RESULT.PURCHASED:
            case PAYWALL_RESULT.RESTORED:
                console.log('✅ Purchase/Restore successful');
                setIsLoading(true);
                await refreshCustomerInfo();
                setIsLoading(false);

                Alert.alert(
                    'Success!',
                    'Your subscription is now active. Enjoy premium features!',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                onPurchaseCompleted?.();
                                onDismiss?.();
                            },
                        },
                    ]
                );
                break;

            case PAYWALL_RESULT.CANCELLED:
                console.log('User cancelled paywall');
                onDismiss?.();
                break;

            case PAYWALL_RESULT.ERROR:
                console.log('Paywall error occurred');
                Alert.alert('Error', 'Something went wrong. Please try again.');
                break;

            case PAYWALL_RESULT.NOT_PRESENTED:
                console.log('Paywall not presented');
                onDismiss?.();
                break;
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <RevenueCatUI.Paywall
                onPurchaseCompleted={async () => {
                    await handlePaywallResult(PAYWALL_RESULT.PURCHASED);
                }}
                onRestoreCompleted={async () => {
                    await handlePaywallResult(PAYWALL_RESULT.RESTORED);
                }}
                onDismiss={() => {
                    handlePaywallResult(PAYWALL_RESULT.CANCELLED);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
});

export default PaywallScreen;
