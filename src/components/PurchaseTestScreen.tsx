import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { usePurchase } from '../context/PurchaseContext';
import PurchaseService from '../services/PurchaseService';
import PaywallScreen from './PaywallScreen';

/**
 * Purchase Test Screen
 * Comprehensive testing interface for RevenueCat purchase flows
 */
const PurchaseTestScreen: React.FC = () => {
    const { customerInfo, offerings, isPremium, hasAccessRenewal, isLoading, refreshCustomerInfo } = usePurchase();
    const [showPaywall, setShowPaywall] = useState(false);
    const [testingPurchase, setTestingPurchase] = useState(false);

    // Test: Direct Package Purchase
    const testDirectPurchase = async (pkg: PurchasesPackage) => {
        try {
            setTestingPurchase(true);
            console.log('🧪 Testing purchase for:', pkg.identifier);

            const result = await PurchaseService.purchasePackage(pkg);

            Alert.alert(
                '✅ Purchase Successful',
                `Product: ${result.productIdentifier}\nEntitlements: ${Object.keys(result.customerInfo.entitlements.active).join(', ') || 'None'}`,
                [{ text: 'OK', onPress: () => refreshCustomerInfo() }]
            );
        } catch (error: any) {
            if (error.userCancelled) {
                Alert.alert('🚫 Purchase Cancelled', 'User cancelled the purchase');
            } else {
                Alert.alert(
                    '❌ Purchase Failed',
                    `Error: ${error.message || 'Unknown error'}\nCode: ${error.code || 'N/A'}`
                );
            }
        } finally {
            setTestingPurchase(false);
        }
    };

    // Test: Restore Purchases
    const testRestorePurchases = async () => {
        try {
            setTestingPurchase(true);
            console.log('🧪 Testing restore purchases');

            const customerInfo = await PurchaseService.restorePurchases();
            const activeEntitlements = Object.keys(customerInfo.entitlements.active);

            Alert.alert(
                '✅ Restore Successful',
                activeEntitlements.length > 0
                    ? `Restored entitlements: ${activeEntitlements.join(', ')}`
                    : 'No purchases to restore',
                [{ text: 'OK', onPress: () => refreshCustomerInfo() }]
            );
        } catch (error: any) {
            Alert.alert('❌ Restore Failed', error.message || 'Unknown error');
        } finally {
            setTestingPurchase(false);
        }
    };

    // Test: Get Customer Info
    const testGetCustomerInfo = async () => {
        try {
            setTestingPurchase(true);
            const info = await PurchaseService.getCustomerInfo();
            const activeEntitlements = Object.keys(info.entitlements.active);

            Alert.alert(
                'ℹ️ Customer Info',
                `User ID: ${info.originalAppUserId}\nActive Entitlements: ${activeEntitlements.join(', ') || 'None'}\nAll Entitlements: ${Object.keys(info.entitlements.all).join(', ')}`
            );
        } catch (error: any) {
            Alert.alert('❌ Error', error.message || 'Unknown error');
        } finally {
            setTestingPurchase(false);
        }
    };

    const renderStatusCard = () => (
        <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
                <Ionicons
                    name={isPremium ? "checkmark-circle" : "close-circle"}
                    size={24}
                    color={isPremium ? "#10b981" : "#ef4444"}
                />
                <Text style={styles.statusTitle}>
                    {isPremium ? 'Premium Active' : 'Free User'}
                </Text>
            </View>

            <View style={styles.statusDetails}>
                <StatusRow label="Has Access Renewal" value={hasAccessRenewal} />
                <StatusRow label="Is Premium" value={isPremium} />
                <StatusRow
                    label="Active Entitlements"
                    value={customerInfo ? Object.keys(customerInfo.entitlements.active).length : 0}
                />
                <StatusRow
                    label="User ID"
                    value={customerInfo?.originalAppUserId.substring(0, 20) + '...' || 'N/A'}
                />
            </View>
        </View>
    );

    const renderPackages = () => {
        if (!offerings?.current?.availablePackages) {
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>No Packages Available</Text>
                    <Text style={styles.errorText}>Configure offerings in RevenueCat dashboard</Text>
                </View>
            );
        }

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Test Direct Purchase</Text>
                <Text style={styles.sectionSubtitle}>Tap to purchase individual packages</Text>

                {offerings.current.availablePackages.map((pkg) => (
                    <TouchableOpacity
                        key={pkg.identifier}
                        style={styles.packageButton}
                        onPress={() => testDirectPurchase(pkg)}
                        disabled={testingPurchase}
                    >
                        <View style={styles.packageInfo}>
                            <Text style={styles.packageTitle}>{pkg.product.title}</Text>
                            <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
                        </View>
                        <Ionicons name="arrow-forward" size={20} color="#6366f1" />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Ionicons name="flask" size={32} color="#6366f1" />
                    <Text style={styles.title}>Purchase Testing</Text>
                    <Text style={styles.subtitle}>Test RevenueCat purchase flows</Text>
                </View>

                {renderStatusCard()}

                {/* Test Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Test Actions</Text>

                    <TestButton
                        icon="card"
                        title="Show Paywall"
                        description="Test RevenueCat UI paywall"
                        onPress={() => setShowPaywall(true)}
                        disabled={testingPurchase}
                    />

                    <TestButton
                        icon="refresh"
                        title="Restore Purchases"
                        description="Test restore functionality"
                        onPress={testRestorePurchases}
                        disabled={testingPurchase}
                    />

                    <TestButton
                        icon="information-circle"
                        title="Get Customer Info"
                        description="View current subscription status"
                        onPress={testGetCustomerInfo}
                        disabled={testingPurchase}
                    />

                    <TestButton
                        icon="sync"
                        title="Refresh Status"
                        description="Manually refresh subscription state"
                        onPress={refreshCustomerInfo}
                        disabled={testingPurchase}
                    />
                </View>

                {renderPackages()}

                {/* Testing Tips */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>💡 Testing Tips</Text>
                    <Text style={styles.tipText}>• Use StoreKit Configuration for testing in simulator</Text>
                    <Text style={styles.tipText}>• Cancel purchase dialog to test cancellation</Text>
                    <Text style={styles.tipText}>• Check console for detailed RevenueCat logs</Text>
                    <Text style={styles.tipText}>• Test restore after making a purchase</Text>
                </View>
            </ScrollView>

            {/* Paywall Modal */}
            <Modal
                visible={showPaywall}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowPaywall(false)}
            >
                <PaywallScreen
                    onDismiss={() => setShowPaywall(false)}
                    onPurchaseCompleted={() => {
                        setShowPaywall(false);
                        refreshCustomerInfo();
                    }}
                />
            </Modal>

            {/* Loading Overlay */}
            {testingPurchase && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.overlayText}>Processing...</Text>
                </View>
            )}
        </View>
    );
};

// Helper Components
const StatusRow: React.FC<{ label: string; value: any }> = ({ label, value }) => (
    <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>{label}:</Text>
        <Text style={styles.statusValue}>
            {typeof value === 'boolean' ? (value ? '✅' : '❌') : value}
        </Text>
    </View>
);

interface TestButtonProps {
    icon: any;
    title: string;
    description: string;
    onPress: () => void;
    disabled?: boolean;
}

const TestButton: React.FC<TestButtonProps> = ({ icon, title, description, onPress, disabled }) => (
    <TouchableOpacity
        style={[styles.testButton, disabled && styles.testButtonDisabled]}
        onPress={onPress}
        disabled={disabled}
    >
        <Ionicons name={icon} size={24} color={disabled ? "#9ca3af" : "#6366f1"} />
        <View style={styles.testButtonText}>
            <Text style={[styles.testButtonTitle, disabled && styles.testButtonTitleDisabled]}>
                {title}
            </Text>
            <Text style={styles.testButtonDescription}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b7280',
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 4,
    },
    statusCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    statusTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
    },
    statusDetails: {
        gap: 8,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    statusLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    statusValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 12,
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    testButtonDisabled: {
        opacity: 0.5,
    },
    testButtonText: {
        flex: 1,
    },
    testButtonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    testButtonTitleDisabled: {
        color: '#9ca3af',
    },
    testButtonDescription: {
        fontSize: 14,
        color: '#6b7280',
    },
    packageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    packageInfo: {
        flex: 1,
    },
    packageTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    packagePrice: {
        fontSize: 14,
        color: '#6366f1',
        fontWeight: '500',
    },
    tipsCard: {
        backgroundColor: '#eef2ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    tipText: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 6,
    },
    errorText: {
        fontSize: 14,
        color: '#ef4444',
        textAlign: 'center',
        marginTop: 8,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayText: {
        marginTop: 12,
        fontSize: 16,
        color: 'white',
        fontWeight: '500',
    },
});

export default PurchaseTestScreen;
