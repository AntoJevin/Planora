import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { FileService } from '../services/FileService';
import { ProfileService } from '../services/ProfileService';
import { darkColors } from '../theme/darkTheme';
import { UserProfile } from '../types/userProfile';

export default function ProfileTab() {
    const { darkMode } = useSettings();
    const colors = darkMode ? darkColors : {
        background: '#f8fafc',
        surface: 'white',
        primary: '#6366f1',
        text: '#111827',
        subtext: '#6b7280',
        border: '#e5e7eb',
    };

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState<UserProfile>({
        id: 'user_primary',
        name: '',
        address: '',
        email: '',
        phone: '',
        profilePictureUri: '',
    });

    const loadProfile = async () => {
        try {
            const data = await ProfileService.getProfile();
            if (data) {
                setProfile(data);
                setFormData(data);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    const handleSave = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }

        try {
            await ProfileService.saveProfile(formData);
            await loadProfile();
            setShowEditModal(false);
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', 'Failed to save profile details');
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions to upload a profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            const permanentUri = await FileService.saveImageToPermanentStorage(result.assets[0].uri, 'profile');
            setFormData({ ...formData, profilePictureUri: permanentUri });
        }
    };

    const formatPhone = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (match) {
            let formatted = match[1];
            if (match[2]) formatted += `-${match[2]}`;
            if (match[3]) formatted += `-${match[3]}`;
            return formatted;
        }
        return text;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.imageContainer}>
                        {profile?.profilePictureUri ? (
                            <Image source={{ uri: profile.profilePictureUri }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Ionicons name="person" size={80} color="#9ca3af" />
                            </View>
                        )}
                    </View>

                    <Text style={[styles.profileName, { color: colors.text }]}>
                        {profile?.name || 'Your Name'}
                    </Text>
                    <Text style={[styles.profileEmail, { color: colors.subtext }]}>
                        {profile?.email || 'Email Address'}
                    </Text>

                    <View style={styles.infoList}>
                        <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
                            <Ionicons name="call-outline" size={20} color={colors.primary} />
                            <View style={styles.infoTextContainer}>
                                <Text style={[styles.infoLabel, { color: colors.subtext }]}>Phone</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>{profile?.phone || 'Not set'}</Text>
                            </View>
                        </View>
                        <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
                            <Ionicons name="location-outline" size={20} color={colors.primary} />
                            <View style={styles.infoTextContainer}>
                                <Text style={[styles.infoLabel, { color: colors.subtext }]}>Address</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>{profile?.address || 'Not set'}</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.editButton, { backgroundColor: colors.primary }]}
                        onPress={() => setShowEditModal(true)}
                    >
                        <Ionicons name="create-outline" size={20} color="white" />
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Edit Modal */}
            <Modal visible={showEditModal} animationType="slide">
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={() => setShowEditModal(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
                        <TouchableOpacity onPress={handleSave}>
                            <Text style={[styles.saveButton, { color: colors.primary }]}>Save</Text>
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}>
                    <ScrollView style={styles.formContent}>
                        <TouchableOpacity style={styles.modalImageContainer} onPress={pickImage}>
                            {formData.profilePictureUri ? (
                                <Image source={{ uri: formData.profilePictureUri }} style={styles.modalProfileImage} />
                            ) : (
                                <View style={styles.modalImagePlaceholder}>
                                    <Ionicons name="camera" size={40} color="#9ca3af" />
                                    <Text style={styles.uploadText}>Upload Picture</Text>
                                </View>
                            )}
                            <View style={styles.imageEditBadge}>
                                <Ionicons name="pencil" size={16} color="white" />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.subtext }]}>Full Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                value={formData.name}
                                onChangeText={(text) => setFormData({ ...formData, name: text })}
                                placeholder="Enter your full name"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.subtext }]}>Email Address</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                value={formData.email}
                                onChangeText={(text) => setFormData({ ...formData, email: text })}
                                placeholder="example@email.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.subtext }]}>Phone Number</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: formatPhone(text) })}
                                placeholder="000-000-0000"
                                keyboardType="phone-pad"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.subtext }]}>Address</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                value={formData.address}
                                onChangeText={(text) => setFormData({ ...formData, address: text })}
                                placeholder="Street, City, State, ZIP"
                                multiline
                                numberOfLines={3}
                                placeholderTextColor="#9ca3af"
                            />
                        </View>
                    </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
    },
    profileCard: {
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    imageContainer: {
        marginBottom: 20,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    imagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 16,
        marginBottom: 24,
    },
    infoList: {
        width: '100%',
        marginBottom: 32,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    infoTextContainer: {
        marginLeft: 16,
    },
    infoLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '500',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
    },
    editButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    saveButton: {
        fontSize: 16,
        fontWeight: '600',
    },
    formContent: {
        padding: 20,
    },
    modalImageContainer: {
        alignItems: 'center',
        marginBottom: 32,
        alignSelf: 'center',
    },
    modalProfileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    modalImagePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
    },
    uploadText: {
        fontSize: 10,
        color: '#9ca3af',
        marginTop: 4,
    },
    imageEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#6366f1',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
});
