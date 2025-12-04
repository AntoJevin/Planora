import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { VaultService } from '../services/VaultService';
import { darkColors } from '../theme/darkTheme';

const VaultTab = () => {
  const { darkMode } = useSettings();
  const colors = darkMode ? darkColors : {
    background: '#f8fafc',
    surface: 'white',
    primary: '#6366f1',
    onPrimary: '#111827',
    onSurface: '#111827',
    secondary: '#4b5563',
    onSecondary: '#111827',
    text: '#111827',
    subtext: '#6b7280',
    border: '#e5e7eb',
  };
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [entries, setEntries] = useState([]);

  useFocusEffect(
    useCallback(() => {
      if (isUnlocked) {
        loadEntries();
      }
    }, [isUnlocked])
  );

  const loadEntries = async () => {
    try {
      const loadedEntries = await VaultService.getAllEntries();
      setEntries(loadedEntries);
    } catch (error) {
      console.error('Error loading vault entries:', error);
      Alert.alert('Error', 'Failed to load vault entries');
    }
  };
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newEntry, setNewEntry] = useState({
    title: '',
    username: '',
    password: '',
    notes: '',
    category: 'Email',
  });
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const categories = ['Email', 'Finance', 'Social', 'Work', 'Personal', 'Other'];
  const categoryColors = {
    'Email': '#3b82f6',
    'Finance': '#10b981',
    'Social': '#8b5cf6',
    'Work': '#f59e0b',
    'Personal': '#ef4444',
    'Other': '#6b7280',
  };

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addEntry = async () => {
    if (!newEntry.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    const entry = {
      ...newEntry,
      id: Date.now().toString(),
    };

    try {
      await VaultService.addEntry(entry);
      await loadEntries();
      setNewEntry({
        title: '',
        username: '',
        password: '',
        notes: '',
        category: 'Email',
      });
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error adding vault entry:', error);
      Alert.alert('Error', 'Failed to add vault entry');
    }
  };

  const deleteEntry = (id) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await VaultService.deleteEntry(id);
              await loadEntries();
            } catch (error) {
              console.error('Error deleting vault entry:', error);
              Alert.alert('Error', 'Failed to delete vault entry');
            }
          }
        },
      ]
    );
  };

  const copyToClipboard = async (text, type) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${type} copied to clipboard`);
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const PasscodeEntry = ({ onUnlock }) => {
    const [passcode, setPasscode] = useState('');
    const [attempts, setAttempts] = useState(0);

    const handleSubmit = () => {
      // Simple passcode check - in real app, this would be more secure
      if (passcode === '1234') {
        onUnlock();
      } else {
        setAttempts(attempts + 1);
        setPasscode('');
        if (attempts >= 2) {
          Alert.alert('Too Many Attempts', 'Please try again later');
          setAttempts(0);
        } else {
          Alert.alert('Incorrect Passcode', `Try again (${2 - attempts} attempts left)`);
        }
      }
    };

    return (
      <View style={[styles.passcodeContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.passcodeContent, { backgroundColor: colors.surface }]}>
          <Ionicons name="shield" size={64} color="#6366f1" />
          <Text style={[styles.passcodeTitle, { color: colors.onSurface }]}>Secure Vault</Text>
          <Text style={[styles.passcodeSubtitle, { color: colors.subtext }]}>Enter your passcode to continue</Text>

          <View style={styles.passcodeInputContainer}>
            <TextInput
              style={[styles.passcodeInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={passcode}
              onChangeText={setPasscode}
              placeholder="Enter passcode"
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              textAlign="center"
            />
          </View>

          <TouchableOpacity
            style={styles.unlockButton}
            onPress={handleSubmit}
          >
            <Ionicons name="lock-open" size={20} color="white" />
            <Text style={styles.unlockButtonText}>Unlock Vault</Text>
          </TouchableOpacity>

          <Text style={styles.passcodeHint}>Default passcode: 1234</Text>
        </View>
      </View>
    );
  };

  const VaultItem = ({ entry, onDelete }) => {
    const isPasswordVisible = visiblePasswords[entry.id];

    return (
      <View style={[styles.vaultItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.vaultItemHeader}>
          <View style={styles.vaultItemTitle}>
            <Text style={[styles.vaultTitle, { color: colors.onSurface }]}>{entry.title}</Text>
            <View style={[
              styles.categoryBadge,
              { backgroundColor: categoryColors[entry.category] + '20' }
            ]}>
              <Text style={[
                styles.categoryText,
                { color: categoryColors[entry.category] }
              ]}>
                {entry.category}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(entry.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {entry.username && (
          <View style={styles.credentialRow}>
            <Text style={[styles.credentialLabel, { color: colors.subtext }]}>Username:</Text>
            <View style={[styles.credentialValue, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.credentialText, { color: colors.text }]}>{entry.username}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(entry.username, 'Username')}
              >
                <Ionicons name="copy-outline" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {entry.password && (
          <View style={styles.credentialRow}>
            <Text style={[styles.credentialLabel, { color: colors.subtext }]}>Password:</Text>
            <View style={[styles.credentialValue, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.credentialText, { color: colors.text }]}>
                {isPasswordVisible ? entry.password : '••••••••'}
              </Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(entry.password, 'Password')}
              >
                <Ionicons name="copy-outline" size={16} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => togglePasswordVisibility(entry.id)}
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                  size={16}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {entry.notes && (
          <View style={[styles.notesContainer, { borderTopColor: colors.border }]}>
            <Text style={[styles.notesLabel, { color: colors.subtext }]}>Notes:</Text>
            <Text style={[styles.notesText, { color: colors.text }]}>{entry.notes}</Text>
          </View>
        )}
      </View>
    );
  };

  const AddVaultModal = () => (
    <Modal
      visible={showAddDialog}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setShowAddDialog(false)}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Add Vault Entry</Text>
          <TouchableOpacity onPress={addEntry}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.subtext }]}>Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={newEntry.title}
              onChangeText={(text) => setNewEntry({ ...newEntry, title: text })}
              placeholder="Enter entry title"
              placeholderTextColor={colors.subtext}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.subtext }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryOption,
                    newEntry.category === category && styles.selectedCategoryOption,
                    { borderColor: categoryColors[category], backgroundColor: colors.surface }
                  ]}
                  onPress={() => setNewEntry({ ...newEntry, category })}
                >
                  <View style={[
                    styles.categoryColorIndicator,
                    { backgroundColor: categoryColors[category] }
                  ]} />
                  <Text style={[
                    styles.categoryOptionText,
                    { color: colors.subtext },
                    newEntry.category === category && styles.selectedCategoryOptionText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.subtext }]}>Username</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={newEntry.username}
              onChangeText={(text) => setNewEntry({ ...newEntry, username: text })}
              placeholder="Enter username"
              placeholderTextColor={colors.subtext}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.subtext }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={newEntry.password}
              onChangeText={(text) => setNewEntry({ ...newEntry, password: text })}
              placeholder="Enter password"
              placeholderTextColor={colors.subtext}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.subtext }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={newEntry.notes}
              onChangeText={(text) => setNewEntry({ ...newEntry, notes: text })}
              placeholder="Enter notes (optional)"
              placeholderTextColor={colors.subtext}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (!isUnlocked) {
    return <PasscodeEntry onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <Ionicons name="shield" size={24} color="white" />
          <View>
            <Text style={styles.headerTitle}>Secure Vault</Text>
            <Text style={styles.headerSubtitle}>
              {entries.length} item{entries.length !== 1 ? 's' : ''} stored
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddDialog(true)}
          >
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.lockButton}
            onPress={() => setIsUnlocked(false)}
          >
            <Ionicons name="lock-closed" size={16} color="white" />
            <Text style={styles.lockText}>Lock</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="key" size={16} color={colors.subtext} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search vault entries..."
            placeholderTextColor={colors.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Vault Entries */}
        <View style={[styles.vaultContainer, { backgroundColor: colors.surface }]}>
          <View style={[styles.vaultHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.vaultStatus}>
              <Ionicons name="lock-open" size={20} color="#10b981" />
              <Text style={[styles.vaultStatusText, { color: colors.onSurface }]}>Vault Unlocked</Text>
            </View>
          </View>

          {filteredEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="shield" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No vault entries found</Text>
              <Text style={styles.emptySubtext}>Add your first secure entry</Text>
            </View>
          ) : (
            <View style={styles.vaultList}>
              {filteredEntries.map((entry) => (
                <VaultItem
                  key={entry.id}
                  entry={entry}
                  onDelete={deleteEntry}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <AddVaultModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginLeft: 8,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
  },
  lockButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 20,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  vaultContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vaultHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  vaultStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vaultStatusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  vaultList: {
    padding: 20,
  },
  vaultItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  vaultItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vaultItemTitle: {
    flex: 1,
  },
  vaultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  credentialRow: {
    marginBottom: 8,
  },
  credentialLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  credentialValue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  credentialText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  copyButton: {
    padding: 4,
    marginLeft: 8,
  },
  notesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#111827',
    fontStyle: 'italic',
  },
  passcodeContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  passcodeContent: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  passcodeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  passcodeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  passcodeInputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  passcodeInput: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    backgroundColor: 'white',
    letterSpacing: 4,
  },
  unlockButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  unlockButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  passcodeHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'white',
  },
  selectedCategoryOption: {
    backgroundColor: '#f0f9ff',
  },
  categoryColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedCategoryOptionText: {
    color: '#6366f1',
    fontWeight: '500',
  },
});

export default VaultTab;
