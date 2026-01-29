import { Ionicons } from '@expo/vector-icons';
import { endOfWeek, format, startOfWeek } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import * as LocalAuthentication from 'expo-local-authentication';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
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
import RevenueCatUI from 'react-native-purchases-ui';
import { usePurchase } from '../context/PurchaseContext';
import { useSettings } from '../context/SettingsContext';
import { clearAllData } from '../database/db';
import { TaskService } from '../services/TaskService';
import PaywallScreen from './PaywallScreen';
import PurchaseTestScreen from './PurchaseTestScreen';

const SettingSection = ({ title, children, styles }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
    </View>
);

const SettingItem = ({ icon, title, subtitle, rightComponent, onPress, darkMode, styles }) => (
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

const TargetHoursModal = ({ visible, onClose, onSave, value, setValue, styles, darkMode }) => (
    <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
    >
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, darkMode && { backgroundColor: '#1e293b' }]}>
                <Text style={[styles.modalTitle, darkMode && { color: '#f1f5f9' }]}>Set Weekly Target Hours</Text>
                <Text style={[styles.modalSubtitle, darkMode && { color: '#94a3b8' }]}>
                    Enter your target work hours per week
                </Text>
                <TextInput
                    style={[styles.modalInput, darkMode && { backgroundColor: '#334155', borderColor: '#475569', color: '#f1f5f9' }]}
                    value={value}
                    onChangeText={setValue}
                    keyboardType="decimal-pad"
                    placeholder="40"
                    placeholderTextColor={darkMode ? "#64748b" : "#9ca3af"}
                    autoFocus
                />
                <View style={styles.modalButtons}>
                    <TouchableOpacity
                        style={[styles.modalButton, styles.modalButtonCancel, darkMode && { backgroundColor: '#334155' }]}
                        onPress={onClose}
                    >
                        <Text style={[styles.modalButtonTextCancel, darkMode && { color: '#94a3b8' }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modalButton, styles.modalButtonSave]}
                        onPress={onSave}
                    >
                        <Text style={styles.modalButtonTextSave}>Save</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

const PasscodeModal = ({
    visible,
    onClose,
    onSubmit,
    mode,
    lockoutTime,
    passcodeIn,
    setPasscodeIn,
    newPasscode,
    setNewPasscode,
    confirmPasscode,
    setConfirmPasscode,
    styles,
    darkMode
}) => (
    <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
    >
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, darkMode && { backgroundColor: '#1e293b' }]}>
                <Text style={[styles.modalTitle, darkMode && { color: '#f1f5f9' }]}>
                    {lockoutTime > 0
                        ? `Locked (${lockoutTime}s)`
                        : (mode === 'verify' ? 'Enter Current Passcode' : 'Set New Passcode')}
                </Text>

                {mode === 'verify' ? (
                    <TextInput
                        style={[styles.modalInput, lockoutTime > 0 && { opacity: 0.5 }, darkMode && { backgroundColor: '#334155', borderColor: '#475569', color: '#f1f5f9' }]}
                        value={passcodeIn}
                        onChangeText={setPasscodeIn}
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry
                        placeholder="••••"
                        placeholderTextColor={darkMode ? "#64748b" : "#9ca3af"}
                        autoFocus
                        editable={lockoutTime === 0}
                    />
                ) : (
                    <View>
                        <Text style={[styles.inputLabel, darkMode && { color: '#94a3b8' }]}>New Passcode</Text>
                        <TextInput
                            style={[styles.modalInput, darkMode && { backgroundColor: '#334155', borderColor: '#475569', color: '#f1f5f9' }]}
                            value={newPasscode}
                            onChangeText={setNewPasscode}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                            placeholder="••••"
                            placeholderTextColor={darkMode ? "#64748b" : "#9ca3af"}
                            autoFocus
                        />
                        <Text style={[styles.inputLabel, darkMode && { color: '#94a3b8' }]}>Confirm New Passcode</Text>
                        <TextInput
                            style={[styles.modalInput, darkMode && { backgroundColor: '#334155', borderColor: '#475569', color: '#f1f5f9' }]}
                            value={confirmPasscode}
                            onChangeText={setConfirmPasscode}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                            placeholder="••••"
                            placeholderTextColor={darkMode ? "#64748b" : "#9ca3af"}
                        />
                    </View>
                )}

                <View style={styles.modalButtons}>
                    <TouchableOpacity
                        style={[styles.modalButton, styles.modalButtonCancel, darkMode && { backgroundColor: '#334155' }]}
                        onPress={onClose}
                    >
                        <Text style={[styles.modalButtonTextCancel, darkMode && { color: '#94a3b8' }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.modalButton,
                            styles.modalButtonSave,
                            lockoutTime > 0 && { opacity: 0.5 }
                        ]}
                        onPress={onSubmit}
                        disabled={lockoutTime > 0}
                    >
                        <Text style={styles.modalButtonTextSave}>
                            {mode === 'verify' ? 'Verify' : 'Update'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

const SettingsTab = () => {
    const {
        targetHours,
        setTargetHours,
        darkMode,
        setDarkMode,
        vaultPasscode,
        setVaultPasscode,
        biometricsEnabled,
        setBiometricsEnabled
    } = useSettings();
    const { isPremium, hasAccessRenewal, customerInfo, restorePurchases, isLoading } = usePurchase();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [dailyReminder, setDailyReminder] = useState(true);
    const [taskReminders, setTaskReminders] = useState(true);
    const [showPaywall, setShowPaywall] = useState(false);
    const [showPurchaseTest, setShowPurchaseTest] = useState(false);

    const [showTargetHoursInput, setShowTargetHoursInput] = useState(false);
    const [tempTargetHours, setTempTargetHours] = useState(targetHours.toString());

    // Security states
    const [showPasscodeModal, setShowPasscodeModal] = useState(false);
    const [passcodeMode, setPasscodeMode] = useState('verify'); // 'verify' or 'new'
    const [passcodeType, setPasscodeType] = useState('change'); // 'change' or 'toggle'
    const [passcodeIn, setPasscodeIn] = useState('');
    const [newPasscode, setNewPasscode] = useState('');
    const [confirmPasscode, setConfirmPasscode] = useState('');
    const [securityAttempts, setSecurityAttempts] = useState(0);
    const [securityLockoutTime, setSecurityLockoutTime] = useState(0);

    React.useEffect(() => {
        let timer;
        if (securityLockoutTime > 0) {
            timer = setInterval(() => {
                setSecurityLockoutTime((prev) => prev - 1);
            }, 1000);
        } else if (securityLockoutTime === 0 && securityAttempts >= 3) {
            setSecurityAttempts(0);
        }
        return () => clearInterval(timer);
    }, [securityLockoutTime, securityAttempts]);

    const handleSaveTargetHours = () => {
        const hours = parseFloat(tempTargetHours);
        if (isNaN(hours) || hours <= 0 || hours > 168) {
            Alert.alert('Invalid Input', 'Please enter a valid number between 1 and 168');
            return;
        }
        setTargetHours(hours);
        setShowTargetHoursInput(false);
        Alert.alert('Success', `Target hours set to ${hours} hours per week`);
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

    const handleExportData = async () => {
        Alert.alert('Export Started', 'Generating PDF...');
        try {
            const allTasks = await TaskService.getAllTasks();
            const today = new Date();
            const weekStart = startOfWeek(today, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

            const weeklyTasks = allTasks.filter(task => {
                const taskDate = new Date(task.date);
                return taskDate >= weekStart && taskDate <= weekEnd;
            });

            const totalHours = weeklyTasks.reduce((sum, task) => sum + (parseFloat(task.hoursSpent) || 0), 0);
            const completedTasks = weeklyTasks.filter(task => task.completed).length;
            const totalTasks = weeklyTasks.length;
            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            const html = `
                <html>
                  <head>
                    <style>
                      body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; }
                      h1 { color: #111827; }
                      h2 { color: #4b5563; font-size: 16px; margin-bottom: 30px; }
                      .summary { display: flex; gap: 20px; margin-bottom: 30px; }
                      .card { background: #f3f4f6; padding: 15px; border-radius: 8px; flex: 1; }
                      .value { font-size: 24px; font-weight: bold; color: #111827; }
                      .label { font-size: 12px; color: #6b7280; }
                      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                      th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }
                      th { color: #6b7280; font-size: 12px; text-transform: uppercase; }
                      td { color: #111827; }
                    </style>
                  </head>
                  <body>
                    <h1>Weekly Report</h1>
                    <h2>${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}</h2>
                    <div class="summary">
                      <div class="card">
                        <div class="value">${totalHours.toFixed(1)}h</div>
                        <div class="label">Total Hours</div>
                      </div>
                      <div class="card">
                        <div class="value">${completedTasks}</div>
                        <div class="label">Completed Tasks</div>
                      </div>
                      <div class="card">
                        <div class="value">${completionRate.toFixed(0)}%</div>
                        <div class="label">Completion Rate</div>
                      </div>
                      <div class="card">
                        <div class="value">${totalHours >= targetHours ? 'Met' : 'Missed'}</div>
                        <div class="label">Weekly Target</div>
                      </div>
                    </div>
                    <h3>Task Details</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Task</th>
                          <th>Hours</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${weeklyTasks.map(task => `
                          <tr>
                            <td>${format(new Date(task.date), 'EEE, MMM d')}</td>
                            <td>${task.title}</td>
                            <td>${parseFloat(task.hoursSpent || 0).toFixed(1)}h</td>
                            <td>${task.completed ? 'Complete' : 'Pending'}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </body>
                </html>
            `;

            const { uri } = await printToFileAsync({ html });
            const fileName = `Weekly_Report_${format(weekStart, 'MMM_d')}_to_${format(weekEnd, 'd')}.pdf`;
            const newUri = FileSystem.documentDirectory + fileName;
            await FileSystem.moveAsync({ from: uri, to: newUri });
            await shareAsync(newUri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error('Error exporting data:', error);
            Alert.alert('Error', `Failed to export data: ${error.message || 'Unknown error'}`);
        }
    };

    const handleRateApp = () => {
        Alert.alert('Rate App', 'Thank you for your support!');
    };

    const handleContactSupport = () => {
        const subject = encodeURIComponent('ManageSelf Support Request');
        const body = encodeURIComponent('Hi Support Team,\n\n');
        Linking.openURL(`mailto:contact@qministry.com?subject=${subject}&body=${body}`);
    };

    const handleUpgradeToPremium = () => {
        setShowPaywall(true);
    };

    const handleRestorePurchases = async () => {
        try {
            await restorePurchases();
            Alert.alert('Success', 'Your purchases have been restored!');
        } catch (error) {
            Alert.alert('Error', 'Failed to restore purchases. Please try again.');
        }
    };

    const handleManageSubscription = async () => {
        try {
            const result = await RevenueCatUI.presentCustomerCenter();
            console.log('Customer Center result:', result);
        } catch (error) {
            console.error('Error presenting Customer Center:', error);
            Alert.alert('Error', 'Unable to open subscription management');
        }
    };

    const handleSecurityAction = async (type) => {
        setPasscodeType(type);
        setPasscodeIn('');
        setNewPasscode('');
        setConfirmPasscode('');

        // Try biometrics first if enabled
        if (biometricsEnabled) {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (hasHardware && isEnrolled) {
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Authenticate to continue',
                    fallbackLabel: 'Use Passcode',
                });

                if (result.success) {
                    if (type === 'change') {
                        setPasscodeMode('new');
                        setShowPasscodeModal(true);
                    } else if (type === 'toggle') {
                        await setBiometricsEnabled(!biometricsEnabled);
                        Alert.alert('Success', `Biometric unlock ${!biometricsEnabled ? 'enabled' : 'disabled'}`);
                    }
                    return;
                }
            }
        }

        // Fallback to manual passcode
        setPasscodeMode('verify');
        setShowPasscodeModal(true);
    };

    const handlePasscodeSubmit = async () => {
        if (securityLockoutTime > 0) return;

        if (passcodeMode === 'verify') {
            if (passcodeIn === vaultPasscode) {
                setSecurityAttempts(0);
                if (passcodeType === 'change') {
                    setPasscodeMode('new');
                    setPasscodeIn('');
                } else {
                    await setBiometricsEnabled(!biometricsEnabled);
                    setShowPasscodeModal(false);
                    Alert.alert('Success', `Biometric unlock ${!biometricsEnabled ? 'enabled' : 'disabled'}`);
                }
            } else {
                const newAttempts = securityAttempts + 1;
                setSecurityAttempts(newAttempts);
                setPasscodeIn('');

                if (newAttempts >= 3) {
                    setSecurityLockoutTime(30);
                    Alert.alert('Security Locked', 'Too many incorrect attempts. Please try again in 30 seconds.');
                } else {
                    Alert.alert('Incorrect Passcode', `Try again (${3 - newAttempts} attempts left)`);
                }
            }
        } else {
            // New passcode mode
            if (newPasscode.length !== 4) {
                Alert.alert('Error', 'Passcode must be 4 digits');
                return;
            }
            if (newPasscode === confirmPasscode) {
                await setVaultPasscode(newPasscode);
                setShowPasscodeModal(false);
                Alert.alert('Success', 'Vault passcode updated');
            } else {
                Alert.alert('Error', 'Passcodes do not match');
            }
        }
    };

    const getSubscriptionStatus = () => {
        if (isLoading) return 'Loading...';
        if (isPremium || hasAccessRenewal) {
            return 'Premium Active';
        }
        return 'Free';
    };

    return (
        <View style={darkMode ? styles.containerDark : styles.container}>
            <View style={styles.header}>
                <Ionicons name="settings" size={24} color="white" />
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView style={styles.content}>
                <SettingSection title="Notifications" styles={styles}>
                    <SettingItem
                        icon="notifications-outline"
                        title="Enable Notifications"
                        subtitle="Receive app notifications"
                        darkMode={darkMode}
                        styles={styles}
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
                        darkMode={darkMode}
                        styles={styles}
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
                        darkMode={darkMode}
                        styles={styles}
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

                <SettingSection title="Appearance" styles={styles}>
                    <SettingItem
                        icon="moon-outline"
                        title="Dark Mode"
                        subtitle="Enable dark theme"
                        darkMode={darkMode}
                        styles={styles}
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

                <SettingSection title="Security" styles={styles}>
                    <SettingItem
                        icon="key-outline"
                        title="Change Vault Passcode"
                        subtitle="Update your 4-digit security code"
                        onPress={() => handleSecurityAction('change')}
                        darkMode={darkMode}
                        styles={styles}
                        rightComponent={
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        }
                    />
                    <SettingItem
                        icon="finger-print-outline"
                        title="Biometric Unlock"
                        subtitle="Use FaceID/Fingerprint for Vault"
                        darkMode={darkMode}
                        styles={styles}
                        rightComponent={
                            <Switch
                                value={biometricsEnabled}
                                onValueChange={() => handleSecurityAction('toggle')}
                                trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                                thumbColor={biometricsEnabled ? '#6366f1' : '#f3f4f6'}
                            />
                        }
                    />
                </SettingSection>

                <SettingSection title="Subscription" styles={styles}>
                    <SettingItem
                        icon="star"
                        title="Subscription Status"
                        subtitle={getSubscriptionStatus()}
                        darkMode={darkMode}
                        styles={styles}
                        rightComponent={
                            (isPremium || hasAccessRenewal) ? (
                                <View style={styles.premiumBadge}>
                                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                </View>
                            ) : null
                        }
                    />
                    {!(isPremium || hasAccessRenewal) && (
                        <SettingItem
                            icon="rocket-outline"
                            title="Upgrade to Premium"
                            subtitle="Unlock all features"
                            onPress={handleUpgradeToPremium}
                            darkMode={darkMode}
                            styles={styles}
                            rightComponent={
                                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                            }
                        />
                    )}
                    {(isPremium || hasAccessRenewal) && (
                        <SettingItem
                            icon="settings-outline"
                            title="Manage Subscription"
                            subtitle="View and manage your subscription"
                            onPress={handleManageSubscription}
                            darkMode={darkMode}
                            styles={styles}
                            rightComponent={
                                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                            }
                        />
                    )}
                    <SettingItem
                        icon="refresh-outline"
                        title="Restore Purchases"
                        subtitle="Restore previous purchases"
                        onPress={handleRestorePurchases}
                        darkMode={darkMode}
                        styles={styles}
                        rightComponent={
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        }
                    />
                    {__DEV__ && (
                        <SettingItem
                            icon="flask"
                            title="Test Purchases"
                            subtitle="Development testing tools"
                            onPress={() => setShowPurchaseTest(true)}
                            darkMode={darkMode}
                            styles={styles}
                            rightComponent={
                                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                            }
                        />
                    )}
                </SettingSection>

                <SettingSection title="Timesheet Settings" styles={styles}>
                    <SettingItem
                        icon="calendar-outline"
                        title="Weekly Target Hours"
                        subtitle={`Current: ${targetHours} hours per week`}
                        onPress={() => {
                            setTempTargetHours(targetHours.toString());
                            setShowTargetHoursInput(true);
                        }}
                        darkMode={darkMode}
                        styles={styles}
                        rightComponent={
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        }
                    />
                </SettingSection>

                <SettingSection title="Data Management" styles={styles}>
                    <SettingItem
                        icon="download-outline"
                        title="Export Data"
                        subtitle="Download your data"
                        onPress={handleExportData}
                        darkMode={darkMode}
                        styles={styles}
                        rightComponent={
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        }
                    />
                    <SettingItem
                        icon="trash-outline"
                        title="Clear All Data"
                        subtitle="Delete all tasks and entries"
                        onPress={handleClearData}
                        darkMode={darkMode}
                        styles={styles}
                        rightComponent={
                            <Ionicons name="chevron-forward" size={20} color="#ef4444" />
                        }
                    />
                </SettingSection>

                <SettingSection title="About" styles={styles}>
                    <SettingItem
                        icon="information-circle-outline"
                        title="App Version"
                        subtitle="1.0.0"
                        darkMode={darkMode}
                        styles={styles}
                        rightComponent={null}
                    />
                    <SettingItem
                        icon="mail-outline"
                        title="Contact Support"
                        subtitle="contact@qministry.com"
                        onPress={handleContactSupport}
                        darkMode={darkMode}
                        styles={styles}
                        rightComponent={
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        }
                    />
                </SettingSection>
            </ScrollView>

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
                    }}
                />
            </Modal>

            <TargetHoursModal
                visible={showTargetHoursInput}
                onClose={() => setShowTargetHoursInput(false)}
                onSave={handleSaveTargetHours}
                value={tempTargetHours}
                setValue={setTempTargetHours}
                styles={styles}
                darkMode={darkMode}
            />

            {__DEV__ && (
                <Modal
                    visible={showPurchaseTest}
                    animationType="slide"
                    presentationStyle="fullScreen"
                    onRequestClose={() => setShowPurchaseTest(false)}
                >
                    <View style={{ flex: 1 }}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => setShowPurchaseTest(false)}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Purchase Testing</Text>
                        </View>
                        <PurchaseTestScreen />
                    </View>
                </Modal>
            )}

            <PasscodeModal
                visible={showPasscodeModal}
                onClose={() => setShowPasscodeModal(false)}
                onSubmit={handlePasscodeSubmit}
                mode={passcodeMode}
                lockoutTime={securityLockoutTime}
                passcodeIn={passcodeIn}
                setPasscodeIn={setPasscodeIn}
                newPasscode={newPasscode}
                setNewPasscode={setNewPasscode}
                confirmPasscode={confirmPasscode}
                setConfirmPasscode={setConfirmPasscode}
                styles={styles}
                darkMode={darkMode}
            />
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
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
        marginTop: 12,
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
    premiumBadge: {
        padding: 4,
    },
});

export default SettingsTab;
