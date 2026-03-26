import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { usePurchase } from '../context/PurchaseContext';

interface PaywallScreenProps {
    onDismiss?: () => void;
    onPurchaseCompleted?: () => void;
}

/**
 * Custom Paywall Screen
 * Handles retrieving RevenueCat offerings, empty catalog checks, and processing
 */
const PaywallScreen: React.FC<PaywallScreenProps> = ({ onDismiss, onPurchaseCompleted }) => {
    const { refreshCustomerInfo } = usePurchase();
    const [isLoading, setIsLoading] = useState(true);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [hasEmptyOfferings, setHasEmptyOfferings] = useState(false);

    useEffect(() => {
        const fetchOfferings = async () => {
            try {
                const offerings = await Purchases.getOfferings();
                
                if (!offerings || !offerings.current || offerings.current.availablePackages.length === 0) {
                    setHasEmptyOfferings(true);
                } else {
                    setPackages(offerings.current.availablePackages);
                    setHasEmptyOfferings(false);
                }
            } catch (e) {
                console.log(e);
                setHasEmptyOfferings(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOfferings();
    }, []);

    const handleRestore = async () => {
        setIsLoading(true);
        try {
            await Purchases.restorePurchases();
            await refreshCustomerInfo();
            Alert.alert('Success', 'Purchases restored successfully.');
            onDismiss?.();
            onPurchaseCompleted?.();
        } catch (e: any) {
            console.log(e);
            Alert.alert('Error', 'Failed to restore purchases.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePurchase = async (pkg: PurchasesPackage) => {
        setIsLoading(true);
        try {
            await Purchases.purchasePackage(pkg);
            await refreshCustomerInfo();
            Alert.alert('Success!', 'Your subscription is now active. Enjoy premium features!');
            onPurchaseCompleted?.();
            onDismiss?.();
        } catch (e: any) {
            console.log(e);
            if (!e.userCancelled) {
                Alert.alert('Purchase Error', 'We could not complete your request. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    if (hasEmptyOfferings) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Loading plans... please try again</Text>
                
                <TouchableOpacity style={styles.button} onPress={handleRestore}>
                    <Text style={styles.buttonText}>Restore Purchases</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onDismiss}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Unlock Premium</Text>
            <Text style={styles.subtitle}>Supercharge your experience today.</Text>

            {packages.map((pkg) => (
                <TouchableOpacity 
                    key={pkg.identifier} 
                    style={styles.packageCard}
                    onPress={() => handlePurchase(pkg)}
                >
                    <View style={styles.packageInfo}>
                        <Text style={styles.packageName}>{pkg.product.title}</Text>
                        <Text style={styles.packageDesc}>{pkg.product.description}</Text>
                    </View>
                    <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
                </TouchableOpacity>
            ))}

            <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={handleRestore}>
                    <Text style={styles.buttonText}>Restore Purchases</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onDismiss}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        paddingTop: 60,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 24,
    },
    emptyText: {
        fontSize: 16,
        color: '#4b5563',
        marginBottom: 30,
        textAlign: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 40,
        textAlign: 'center',
    },
    packageCard: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    packageInfo: {
        flex: 1,
        paddingRight: 10,
    },
    packageName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    packageDesc: {
        fontSize: 14,
        color: '#64748b',
    },
    packagePrice: {
        fontSize: 18,
        fontWeight: '700',
        color: '#6366f1',
    },
    footer: {
        marginTop: 20,
        width: '100%',
        alignItems: 'center',
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: '#ebf4ff',
        marginBottom: 12,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4f46e5',
    },
    cancelButton: {
        backgroundColor: 'transparent',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#94a3b8',
    },
});

export default PaywallScreen;
