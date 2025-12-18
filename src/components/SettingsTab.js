import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { clearAllData } from '../database/db';

const SettingsTab = () => {
    const { targetHours, setTargetHours, darkMode, setDarkMode } = useSettings();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [dailyReminder, setDailyReminder] = useState(true);
    const [taskReminders, setTaskReminders] = useState(true);

    const [showTargetHoursInput, setShowTargetHoursInput] = useState(false);
    const [tempTargetHours, setTempTargetHours] = useState(targetHours.toString());

    const handleSaveTargetHours = () => {
        const hours = parseFloat(tempTargetHours);
        if (isNaN(hours) || hours <= 0 || hours > 24) {
            Alert.alert('Invalid Input', 'Please enter a valid number between 1 and 24');
            return;
        }
        setTargetHours(hours);
        setShowTargetHoursInput(false);
        Alert.alert('Success', `Target hours set to ${hours} hours per day`);
    };

    const handleClearData = () => {
        Alert.alert(
            'Clear All Data',
            'This will delete all your tasks, todos, and timesheet entries. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear Data',
                    style: 'destructive',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await clearAllData();
                            Alert.alert('Success', 'All data has been cleared');
                        } catch (error) {
                            console.error('Error clearing data:', error);
                            Alert.alert('Error', 'Failed to clear data');
                        }
                    },
                },
            ]
        );
    };

    const handleExportData = () => {
        Alert.alert('Export Data', 'Data export feature coming soon!');
    };

    const handleRateApp = () => {
        Alert.alert('Rate App', 'Thank you for your support!');
    };

    const handleContactSupport = () => {
        Linking.openURL('mailto:contact@qministries.com');
    };

    const SettingSection = ({ title, children }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );

    const SettingItem = ({ icon, title, subtitle, rightComponent, onPress }) => (
        <TouchableOpacity
            style={[styles.settingItem, darkMode && { backgroundColor: '#2d3748' }]}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={20} color="#6366f1" />
                </View>
                <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, darkMode && { color: '#f3f4f6' }]}>{title}</Text>
                    {subtitle && <Text style={[styles.settingSubtitle, darkMode && { color: '#d1d5db' }]}>{subtitle}</Text>}
                </View>
            </View>
            {rightComponent}
        </TouchableOpacity>
    );

    return (
        <View style={darkMode ? styles.containerDark : styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Ionicons name="settings" size={24} color="white" />
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* Notifications */}
                <SettingSection title="Notifications">
                    <SettingItem
                        icon="notifications-outline"
                        title="Enable Notifications"
                        subtitle="Receive app notifications"
                        rightComponent={
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                                thumbColor={notificationsEnabled ? '#6366f1' : '#f3f4f6'}
                            />
                        }
                    />
                    <SettingItem
                        icon="alarm-outline"
                        title="Daily Reminder"
                        subtitle="Get reminded to plan your day"
                        rightComponent={
                            <Switch
                                value={dailyReminder}
                                onValueChange={setDailyReminder}
                                trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                                thumbColor={dailyReminder ? '#6366f1' : '#f3f4f6'}
                                disabled={!notificationsEnabled}
                            />
                        }
                    />
                    <SettingItem
                        icon="time-outline"
                        title="Task Reminders"
                        subtitle="Reminders for upcoming tasks"
                        rightComponent={
                            <Switch
                                value={taskReminders}
                                onValueChange={setTaskReminders}
                                trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                                thumbColor={taskReminders ? '#6366f1' : '#f3f4f6'}
                                disabled={!notificationsEnabled}
                            />
                        }
                    />
                </SettingSection>

                {/* Appearance */}
                <SettingSection title="Appearance">
                    <SettingItem
                        icon="moon-outline"
                        title="Dark Mode"
                        subtitle="Enable dark theme"
                        rightComponent={
                            <Switch
                                value={darkMode}
                                onValueChange={setDarkMode}
                                trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                                thumbColor={darkMode ? '#6366f1' : '#f3f4f6'}

                            />
                        }
                    />
                </SettingSection>

                {/* Timesheet Settings */}
                <SettingSection title="Timesheet Settings">
                    <SettingItem
                        icon="calendar-outline"
                        title="Daily Target Hours"
                        subtitle={`Current: ${targetHours} hours per day`}
                        onPress={() => {
                            setTempTargetHours(targetHours.toString());
                            setShowTargetHoursInput(true);
                        }}
                        rightComponent={
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        }
                    />
                </SettingSection>

                {/* Data Management */}
                <SettingSection title="Data Management">
                    <SettingItem
                        icon="download-outline"
                        title="Export Data"
                        subtitle="Download your data"
                        onPress={handleExportData}
                        rightComponent={
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        }
                    />
                    <SettingItem
                        icon="trash-outline"
                        title="Clear All Data"
                        subtitle="Delete all tasks and entries"
                        onPress={handleClearData}
                        rightComponent={
                            <Ionicons name="chevron-forward" size={20} color="#ef4444" />
                        }
                    />
                </SettingSection>

                {/* About */}
                <SettingSection title="About">
                    <SettingItem
                        icon="information-circle-outline"
                        title="App Version"
                        subtitle="1.0.0"
                        rightComponent={null}
                    />
                    <SettingItem
                        icon="star-outline"
                        title="Rate App"
                        subtitle="Share your feedback"
                        onPress={handleRateApp}
                        rightComponent={
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        }
                    />
                    <SettingItem
                        icon="mail-outline"
                        title="Contact Support"
                        subtitle="contact@qministries.com"
                        onPress={handleContactSupport}
                        rightComponent={
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        }
                    />
                    <SettingItem
                        icon="document-text-outline"
                        title="Privacy Policy"
                        subtitle="View our privacy policy"
                        onPress={() => Alert.alert('Privacy Policy', 'Privacy policy coming soon')}
                        rightComponent={
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        }
                    />
                    <SettingItem
                        icon="shield-checkmark-outline"
                        title="Terms of Service"
                        subtitle="View terms and conditions"
                        onPress={() => Alert.alert('Terms of Service', 'Terms coming soon')}
                        rightComponent={
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        }
                    />
                </SettingSection>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>ManageSelf</Text>
                    <Text style={styles.footerSubtext}>Made by Q's Ministry / BHITS</Text>
                </View>
            </ScrollView>

            {/* Target Hours Input Modal */}
            <Modal
                visible={showTargetHoursInput}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowTargetHoursInput(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Set Daily Target Hours</Text>
                        <Text style={styles.modalSubtitle}>
                            Enter your target work hours per day
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            value={tempTargetHours}
                            onChangeText={setTempTargetHours}
                            keyboardType="decimal-pad"
                            placeholder="8"
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setShowTargetHoursInput(false)}
                            >
                                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSave]}
                                onPress={handleSaveTargetHours}
                            >
                                <Text style={styles.modalButtonTextSave}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    containerDark: {
        flex: 1,
        backgroundColor: '#1f2937',
    },
    header: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        flex: 1,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eef2ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    settingText: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 13,
        color: '#6b7280',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    footerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    footerSubtext: {
        fontSize: 14,
        color: '#9ca3af',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '80%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 20,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#f3f4f6',
    },
    modalButtonSave: {
        backgroundColor: '#6366f1',
    },
    modalButtonTextCancel: {
        color: '#374151',
        fontWeight: '600',
    },
    modalButtonTextSave: {
        color: 'white',
        fontWeight: '600',
    },
});

export default SettingsTab;
