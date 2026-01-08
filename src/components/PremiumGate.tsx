import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePurchase } from '../context/PurchaseContext';

interface PremiumGateProps {
    children: React.ReactNode;
    featureName: string;
    onUpgradePress: () => void;
}

/**
 * Premium Feature Gate
 * Wraps premium features and shows upgrade prompt for free users
 */
const PremiumGate: React.FC<PremiumGateProps> = ({
    children,
    featureName,
    onUpgradePress
}) => {
    const { isPremium, hasAccessRenewal, isLoading } = usePurchase();

    // Show loading state
    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    // If user has premium access, show the feature
    if (isPremium || hasAccessRenewal) {
        return <>{children}</>;
    }

    // Show upgrade prompt for free users
    return (
        <View style={styles.container}>
            <View style={styles.lockContainer}>
                <View style={styles.iconCircle}>
                    <Ionicons name="lock-closed" size={32} color="#6366f1" />
                </View>

                <Text style={styles.title}>Premium Feature</Text>
                <Text style={styles.description}>
                    {featureName} is available for premium subscribers
                </Text>

                <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={onUpgradePress}
                >
                    <Ionicons name="star" size={20} color="white" />
                    <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                </TouchableOpacity>

                <Text style={styles.benefitsTitle}>Premium Benefits:</Text>
                <View style={styles.benefitsList}>
                    <BenefitItem text="Export data to PDF" />
                    <BenefitItem text="Unlimited tasks" />
                    <BenefitItem text="Advanced reports" />
                    <BenefitItem text="Priority support" />
                </View>
            </View>
        </View>
    );
};

const BenefitItem: React.FC<{ text: string }> = ({ text }) => (
    <View style={styles.benefitItem}>
        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
        <Text style={styles.benefitText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    lockContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    upgradeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6366f1',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        marginBottom: 32,
    },
    upgradeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    benefitsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
    },
    benefitsList: {
        alignSelf: 'stretch',
        gap: 12,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    benefitText: {
        fontSize: 16,
        color: '#374151',
    },
    loadingText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 24,
    },
});

export default PremiumGate;
