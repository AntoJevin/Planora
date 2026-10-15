import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { getDocumentAsync } from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as LocalAuthentication from "expo-local-authentication";
import { shareAsync } from "expo-sharing";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import RevenueCatUI from "react-native-purchases-ui";
import { usePurchase } from "../context/PurchaseContext";
import { useSettings } from "../context/SettingsContext";
import { clearAllData } from "../database/db";
import { EmployerService } from "../services/EmployerService";
import { ProfileService } from "../services/ProfileService";
import { TaskService } from "../services/TaskService";
import { TodoService } from "../services/TodoService";
import { VaultService } from "../services/VaultService";
import PaywallScreen from "./PaywallScreen";

const SettingSection = ({ title, children, styles }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const SettingItem = ({
  icon,
  title,
  subtitle,
  rightComponent,
  onPress,
  darkMode,
  styles,
}) => (
  <TouchableOpacity
    style={[styles.settingItem, darkMode && { backgroundColor: "#2d3748" }]}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.settingLeft}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={20} color="#6366f1" />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, darkMode && { color: "#f3f4f6" }]}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.settingSubtitle, darkMode && { color: "#d1d5db" }]}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
    {rightComponent}
  </TouchableOpacity>
);

const TargetHoursModal = ({
  visible,
  onClose,
  onSave,
  value,
  setValue,
  styles,
  darkMode,
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View
        style={[
          styles.modalContent,
          darkMode && { backgroundColor: "#1e293b" },
        ]}
      >
        <Text style={[styles.modalTitle, darkMode && { color: "#f1f5f9" }]}>
          Set Weekly Target Hours
        </Text>
        <Text style={[styles.modalSubtitle, darkMode && { color: "#94a3b8" }]}>
          Enter your target work hours per week
        </Text>
        <TextInput
          style={[
            styles.modalInput,
            darkMode && {
              backgroundColor: "#334155",
              borderColor: "#475569",
              color: "#f1f5f9",
            },
          ]}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          placeholder="40"
          placeholderTextColor={darkMode ? "#64748b" : "#9ca3af"}
          autoFocus
        />
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[
              styles.modalButton,
              styles.modalButtonCancel,
              darkMode && { backgroundColor: "#334155" },
            ]}
            onPress={onClose}
          >
            <Text
              style={[
                styles.modalButtonTextCancel,
                darkMode && { color: "#94a3b8" },
              ]}
            >
              Cancel
            </Text>
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

const DeleteConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  value,
  setValue,
  styles,
  darkMode,
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View
        style={[
          styles.modalContent,
          darkMode && { backgroundColor: "#1e293b" },
        ]}
      >
        <Text style={[styles.modalTitle, { color: "#ef4444" }]}>
          Confirm Deletion
        </Text>
        <Text style={[styles.modalSubtitle, darkMode && { color: "#94a3b8" }]}>
          This action is permanent and cannot be undone. Please type{" "}
          <Text style={{ fontWeight: "bold" }}>DELETE</Text> in the box below to
          confirm.
        </Text>
        <TextInput
          style={[
            styles.modalInput,
            darkMode && {
              backgroundColor: "#334155",
              borderColor: "#475569",
              color: "#f1f5f9",
            },
          ]}
          value={value}
          onChangeText={setValue}
          placeholder="Type DELETE"
          placeholderTextColor={darkMode ? "#64748b" : "#9ca3af"}
          autoCapitalize="characters"
          autoFocus
        />
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[
              styles.modalButton,
              styles.modalButtonCancel,
              darkMode && { backgroundColor: "#334155" },
            ]}
            onPress={onClose}
          >
            <Text
              style={[
                styles.modalButtonTextCancel,
                darkMode && { color: "#94a3b8" },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: "#ef4444" }]}
            onPress={onConfirm}
          >
            <Text style={styles.modalButtonTextSave}>Delete Everything</Text>
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
  darkMode,
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View
        style={[
          styles.modalContent,
          darkMode && { backgroundColor: "#1e293b" },
        ]}
      >
        <Text style={[styles.modalTitle, darkMode && { color: "#f1f5f9" }]}>
          {lockoutTime > 0
            ? `Locked (${lockoutTime}s)`
            : mode === "verify"
              ? "Enter Current Passcode"
              : "Set New Passcode"}
        </Text>

        {mode === "verify" ? (
          <TextInput
            style={[
              styles.modalInput,
              lockoutTime > 0 && { opacity: 0.5 },
              darkMode && {
                backgroundColor: "#334155",
                borderColor: "#475569",
                color: "#f1f5f9",
              },
            ]}
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
            <Text style={[styles.inputLabel, darkMode && { color: "#94a3b8" }]}>
              New Passcode
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                darkMode && {
                  backgroundColor: "#334155",
                  borderColor: "#475569",
                  color: "#f1f5f9",
                },
              ]}
              value={newPasscode}
              onChangeText={setNewPasscode}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              placeholder="••••"
              placeholderTextColor={darkMode ? "#64748b" : "#9ca3af"}
              autoFocus
            />
            <Text style={[styles.inputLabel, darkMode && { color: "#94a3b8" }]}>
              Confirm New Passcode
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                darkMode && {
                  backgroundColor: "#334155",
                  borderColor: "#475569",
                  color: "#f1f5f9",
                },
              ]}
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
            style={[
              styles.modalButton,
              styles.modalButtonCancel,
              darkMode && { backgroundColor: "#334155" },
            ]}
            onPress={onClose}
          >
            <Text
              style={[
                styles.modalButtonTextCancel,
                darkMode && { color: "#94a3b8" },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalButton,
              styles.modalButtonSave,
              lockoutTime > 0 && { opacity: 0.5 },
            ]}
            onPress={onSubmit}
            disabled={lockoutTime > 0}
          >
            <Text style={styles.modalButtonTextSave}>
              {mode === "verify" ? "Verify" : "Update"}
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
    setBiometricsEnabled,
  } = useSettings();
  const {
    isPremium,
    hasManageSelfPro,
    daysRemaining,
    customerInfo,
    restorePurchases,
    isLoading,
  } = usePurchase();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  const [showTargetHoursInput, setShowTargetHoursInput] = useState(false);
  const [tempTargetHours, setTempTargetHours] = useState(
    targetHours.toString(),
  );
  const [isRestoring, setIsRestoring] = useState(false);

  // Security states
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeMode, setPasscodeMode] = useState("verify"); // 'verify' or 'new'
  const [passcodeType, setPasscodeType] = useState("change"); // 'change' or 'toggle'
  const [passcodeIn, setPasscodeIn] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [securityAttempts, setSecurityAttempts] = useState(0);
  const [securityLockoutTime, setSecurityLockoutTime] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");

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
      Alert.alert(
        "Invalid Input",
        "Please enter a valid number between 1 and 168",
      );
      return;
    }
    setTargetHours(hours);
    setShowTargetHoursInput(false);
    Alert.alert("Success", `Target hours set to ${hours} hours per week`);
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will delete all your tasks, todos, and entries. Would you like to take a backup first?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Backup & Clear",
          onPress: async () => {
            try {
              await handleExportAllDataJSON();
              setDeleteConfirmInput("");
              setShowDeleteConfirm(true);
            } catch (error) {
              console.error("Error during backup:", error);
              Alert.alert("Error", "Backup failed. Data not cleared.");
            }
          },
        },
        {
          text: "Clear Without Backup",
          style: "destructive",
          onPress: () => {
            setDeleteConfirmInput("");
            setShowDeleteConfirm(true);
          },
        },
      ],
    );
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmInput.toUpperCase() === "DELETE") {
      try {
        await clearAllData();
        setShowDeleteConfirm(false);
        setDeleteConfirmInput("");
        Alert.alert("Success", "All data has been cleared");
      } catch (error) {
        console.error("Error clearing data:", error);
        Alert.alert("Error", "Failed to clear data");
      }
    } else {
      Alert.alert("Error", "Please type DELETE to confirm");
    }
  };

  const handleImportDataJSON = async () => {
    try {
      // Debug check
      console.log("DocumentPicker requested...");

      const result = await getDocumentAsync({
        type: ["application/json", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      const importedData = JSON.parse(content);

      // Validation
      if (!importedData.version || !importedData.data) {
        Alert.alert(
          "Invalid File",
          "This file does not appear to be a valid Planora backup.",
        );
        return;
      }

      Alert.alert(
        "Confirm Overwrite",
        "WARNING: This will replace ALL your current tasks, to-dos, profile, and settings with the data from this backup. This cannot be undone. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Yes, Overwrite My Data",
            style: "destructive",
            onPress: async () => {
              try {
                const { data } = importedData;

                // 1. Clear all current data
                await clearAllData();

                // 2. Restore all pieces
                if (data.profile) {
                  await ProfileService.saveProfile(data.profile);
                }
                if (data.employer) {
                  await EmployerService.saveEmployer(data.employer);
                }
                if (data.tasks) {
                  for (const task of data.tasks) {
                    await TaskService.addTask(task);
                  }
                }
                if (data.todos) {
                  for (const todo of data.todos) {
                    await TodoService.addTodo(todo);
                  }
                }
                if (data.vault) {
                  for (const entry of data.vault) {
                    await VaultService.addEntry(entry);
                  }
                }

                Alert.alert(
                  "Success",
                  "Data has been successfully imported. Please restart the app if you don't see the changes immediately.",
                );
              } catch (e) {
                console.error("Error during data restoration:", e);
                Alert.alert(
                  "Error",
                  "Failed to restore data from the backup file.",
                );
              }
            },
          },
        ],
      );
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to read the backup file.");
    }
  };

  const handleExportAllDataJSON = async () => {
    Alert.alert("Export Started", "Collecting all data...");
    try {
      const [tasks, todos, profile, employer, vault] = await Promise.all([
        TaskService.getAllTasks(),
        TodoService.getAllTodos(),
        ProfileService.getProfile(),
        EmployerService.getEmployer(),
        VaultService.getAllEntries(),
      ]);

      const exportData = {
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        data: {
          tasks,
          todos,
          profile,
          employer,
          vault,
        },
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `Planora_Full_Backup_${format(new Date(), "yyyy-MM-dd_HHmm")}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      await shareAsync(fileUri, {
        mimeType: "application/json",
        dialogTitle: "Export All Data",
        UTI: "public.json",
      });
    } catch (error) {
      console.error("Error exporting all data:", error);
      Alert.alert(
        "Error",
        `Failed to export all data: ${error.message || "Unknown error"}`,
      );
      throw error;
    }
  };

  const handleRateApp = () => {
    Alert.alert("Rate App", "Thank you for your support!");
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent("Planora Support Request");
    const body = encodeURIComponent("Hi Support Team,\n\n");
    Linking.openURL(
      `mailto:antojevin@gmail.com?subject=${subject}&body=${body}`,
    );
  };

  const handleUpgradeToPremium = () => {
    setShowPaywall(true);
  };

  const handleRestorePurchases = async () => {
    try {
      setIsRestoring(true);
      await restorePurchases();
      Alert.alert("Success", "Your purchases have been restored!");
    } catch (error) {
      Alert.alert("Error", "Failed to restore purchases. Please try again.");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const result = await RevenueCatUI.presentCustomerCenter();
      console.log("Customer Center result:", result);
    } catch (error) {
      console.error("Error presenting Customer Center:", error);
      Alert.alert("Error", "Unable to open subscription management");
    }
  };

  const handleSecurityAction = async (type) => {
    setPasscodeType(type);
    setPasscodeIn("");
    setNewPasscode("");
    setConfirmPasscode("");

    // Try biometrics first if enabled
    if (biometricsEnabled) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate to continue",
          fallbackLabel: "Use Passcode",
        });

        if (result.success) {
          if (type === "change") {
            setPasscodeMode("new");
            setShowPasscodeModal(true);
          } else if (type === "toggle") {
            await setBiometricsEnabled(!biometricsEnabled);
            Alert.alert(
              "Success",
              `Biometric unlock ${!biometricsEnabled ? "enabled" : "disabled"}`,
            );
          }
          return;
        }
      }
    }

    // Fallback to manual passcode
    setPasscodeMode("verify");
    setShowPasscodeModal(true);
  };

  const handlePasscodeSubmit = async () => {
    if (securityLockoutTime > 0) return;

    if (passcodeMode === "verify") {
      if (passcodeIn === vaultPasscode) {
        setSecurityAttempts(0);
        if (passcodeType === "change") {
          setPasscodeMode("new");
          setPasscodeIn("");
        } else {
          await setBiometricsEnabled(!biometricsEnabled);
          setShowPasscodeModal(false);
          Alert.alert(
            "Success",
            `Biometric unlock ${!biometricsEnabled ? "enabled" : "disabled"}`,
          );
        }
      } else {
        const newAttempts = securityAttempts + 1;
        setSecurityAttempts(newAttempts);
        setPasscodeIn("");

        if (newAttempts >= 3) {
          setSecurityLockoutTime(30);
          Alert.alert(
            "Security Locked",
            "Too many incorrect attempts. Please try again in 30 seconds.",
          );
        } else {
          Alert.alert(
            "Incorrect Passcode",
            `Try again (${3 - newAttempts} attempts left)`,
          );
        }
      }
    } else {
      // New passcode mode
      if (newPasscode.length !== 4) {
        Alert.alert("Error", "Passcode must be 4 digits");
        return;
      }
      if (newPasscode === confirmPasscode) {
        await setVaultPasscode(newPasscode);
        setShowPasscodeModal(false);
        Alert.alert("Success", "Vault passcode updated");
      } else {
        Alert.alert("Error", "Passcodes do not match");
      }
    }
  };

  const getSubscriptionStatus = () => {
    if (isLoading) return "Loading...";
    if (daysRemaining > 0) {
      return `Active (${daysRemaining} days left)`;
    }
    return "Expired";
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
                trackColor={{ false: "#d1d5db", true: "#a5b4fc" }}
                thumbColor={notificationsEnabled ? "#6366f1" : "#f3f4f6"}
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
                trackColor={{ false: "#d1d5db", true: "#a5b4fc" }}
                thumbColor={dailyReminder ? "#6366f1" : "#f3f4f6"}
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
                trackColor={{ false: "#d1d5db", true: "#a5b4fc" }}
                thumbColor={taskReminders ? "#6366f1" : "#f3f4f6"}
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
                trackColor={{ false: "#d1d5db", true: "#a5b4fc" }}
                thumbColor={darkMode ? "#6366f1" : "#f3f4f6"}
              />
            }
          />
        </SettingSection>

        <SettingSection title="Security" styles={styles}>
          <SettingItem
            icon="key-outline"
            title="Change Vault Passcode"
            subtitle="Update your 4-digit security code"
            onPress={() => handleSecurityAction("change")}
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
                onValueChange={() => handleSecurityAction("toggle")}
                trackColor={{ false: "#d1d5db", true: "#a5b4fc" }}
                thumbColor={biometricsEnabled ? "#6366f1" : "#f3f4f6"}
              />
            }
          />
        </SettingSection>

        <SettingSection title="App Access" styles={styles}>
          <SettingItem
            icon="star"
            title="Access Status"
            subtitle={getSubscriptionStatus()}
            darkMode={darkMode}
            styles={styles}
            rightComponent={
              isPremium || hasManageSelfPro ? (
                <View style={styles.premiumBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
              ) : null
            }
          />
          {!(isPremium || hasManageSelfPro) && (
            <SettingItem
              icon="rocket-outline"
              title="Renew Access for 1 Year"
              subtitle="Purchase another year of access"
              onPress={handleUpgradeToPremium}
              darkMode={darkMode}
              styles={styles}
              rightComponent={
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              }
            />
          )}
          <SettingItem
            icon="card-outline"
            title="Access Plans"
            subtitle="View and manage access plans"
            onPress={handleUpgradeToPremium}
            darkMode={darkMode}
            styles={styles}
            rightComponent={
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            }
          />
          {(isPremium || hasManageSelfPro) && (
            <SettingItem
              icon="settings-outline"
              title="Manage Access"
              subtitle="View and manage your access"
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
            subtitle={
              isRestoring
                ? "Restoring..."
                : "Recover your access if you've reinstalled or switched devices"
            }
            onPress={isRestoring ? null : handleRestorePurchases}
            darkMode={darkMode}
            styles={styles}
            rightComponent={
              isRestoring ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              )
            }
          />
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
            title="Export All Data (JSON)"
            subtitle="Complete backup of all app data"
            onPress={handleExportAllDataJSON}
            darkMode={darkMode}
            styles={styles}
            rightComponent={
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            }
          />
          <SettingItem
            icon="cloud-upload-outline"
            title="Import Data (JSON)"
            subtitle="Restore your data from a JSON backup"
            onPress={handleImportDataJSON}
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
            subtitle=""
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

      <DeleteConfirmationModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        value={deleteConfirmInput}
        setValue={setDeleteConfirmInput}
        styles={styles}
        darkMode={darkMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingBottom: 24,
  },
  containerDark: {
    flex: 1,
    backgroundColor: "#1f2937",
  },
  header: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
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
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  footerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: "#9ca3af",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#f3f4f6",
  },
  modalButtonSave: {
    backgroundColor: "#6366f1",
  },
  modalButtonTextCancel: {
    color: "#374151",
    fontWeight: "600",
  },
  modalButtonTextSave: {
    color: "white",
    fontWeight: "600",
  },
  premiumBadge: {
    padding: 4,
  },
});

export default SettingsTab;
