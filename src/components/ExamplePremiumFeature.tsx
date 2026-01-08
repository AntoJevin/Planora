import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PaywallScreen from './PaywallScreen';
import PremiumGate from './PremiumGate';

/**
 * Example: Premium Feature with Gate
 * This demonstrates how to wrap a premium feature with PremiumGate
 */
const ExamplePremiumFeature = () => {
    const [showPaywall, setShowPaywall] = useState(false);

    // Your premium feature content
    const PremiumContent = () => (
        <View style={styles.container}>
            <Text style={styles.title}>🎉 Premium Feature</Text>
            <Text style={styles.description}>
                This is a premium-only feature. You have access!
            </Text>
            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Use Premium Feature</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <>
            <PremiumGate
                featureName="Advanced Export"
                onUpgradePress={() => setShowPaywall(true)}
            >
                <PremiumContent />
            </PremiumGate>

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
                        Alert.alert('Success', 'Welcome to Premium!');
                    }}
                />
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#f8fafc',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    button: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ExamplePremiumFeature;
