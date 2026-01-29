import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Employer } from '../types/employer';

interface EmployerFormProps {
    visible: boolean;
    employer?: Employer | null;
    onSave: (employer: Employer) => void;
    onCancel: () => void;
    darkMode?: boolean;
}

export default function EmployerForm({ visible, employer, onSave, onCancel, darkMode }: EmployerFormProps) {
    const [formData, setFormData] = useState<Employer>({
        id: 'employer_primary', // Always use the same ID
        companyName: employer?.companyName || '',
        address: employer?.address || '',
        ein: employer?.ein || '',
        phoneNumber: employer?.phoneNumber || '',
        logoUri: employer?.logoUri || '',
        supervisorName: employer?.supervisorName || '',
    });

    // Update form data when employer prop changes
    React.useEffect(() => {
        if (employer) {
            setFormData({
                id: 'employer_primary',
                companyName: employer.companyName || '',
                address: employer.address || '',
                ein: employer.ein || '',
                phoneNumber: employer.phoneNumber || '',
                logoUri: employer.logoUri || '',
                supervisorName: employer.supervisorName || '',
            });
        }
    }, [employer]);

    const pickImage = async () => {
        // Request permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please grant camera roll permissions to upload a logo.');
            return;
        }

        // Launch image picker
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setFormData({ ...formData, logoUri: result.assets[0].uri });
        }
    };

    const handleSave = () => {
        if (!formData.companyName.trim()) {
            Alert.alert('Error', 'Please enter a company name');
            return;
        }

        onSave(formData);
    };

    const formatEIN = (text: string) => {
        // Format as XX-XXXXXXX
        const numbers = text.replace(/\D/g, '');
        if (numbers.length <= 2) return numbers;
        return `${numbers.slice(0, 2)}-${numbers.slice(2, 9)}`;
    };

    const formatPhone = (text: string) => {
        // Format as (XXX) XXX-XXXX
        const numbers = text.replace(/\D/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
        return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onCancel}
        >
            <View style={[styles.container, darkMode && { backgroundColor: '#0f172a' }]}>
                <View style={[styles.header, darkMode && { borderBottomColor: '#1e293b' }]}>
                    <TouchableOpacity onPress={onCancel}>
                        <Ionicons name="close" size={24} color={darkMode ? "#94a3b8" : "#374151"} />
                    </TouchableOpacity>
                    <Text style={[styles.title, darkMode && { color: '#f1f5f9' }]}>Employer Details</Text>
                    <TouchableOpacity onPress={handleSave}>
                        <Text style={styles.saveButton}>Save</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content}>
                    {/* Company Logo */}
                    <View style={styles.logoSection}>
                        <Text style={[styles.label, darkMode && { color: '#94a3b8' }]}>Company Logo</Text>
                        <TouchableOpacity style={styles.logoButton} onPress={pickImage}>
                            {formData.logoUri ? (
                                <Image source={{ uri: formData.logoUri }} style={styles.logoImage} />
                            ) : (
                                <View style={[styles.logoPlaceholder, darkMode && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                                    <Ionicons name="business" size={40} color={darkMode ? "#475569" : "#9ca3af"} />
                                    <Text style={[styles.logoPlaceholderText, darkMode && { color: '#64748b' }]}>Tap to upload logo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Company Name */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, darkMode && { color: '#94a3b8' }]}>Company Name *</Text>
                        <TextInput
                            style={[styles.input, darkMode && { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }]}
                            value={formData.companyName}
                            onChangeText={(text) => setFormData({ ...formData, companyName: text })}
                            placeholder="Enter company name"
                            placeholderTextColor={darkMode ? "#64748b" : "#9ca3af"}
                        />
                    </View>

                    {/* Address */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, darkMode && { color: '#94a3b8' }]}>Address</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, darkMode && { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }]}
                            value={formData.address}
                            onChangeText={(text) => setFormData({ ...formData, address: text })}
                            placeholder="Enter company address"
                            placeholderTextColor={darkMode ? "#64748b" : "#9ca3af"}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {/* EIN Number */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, darkMode && { color: '#94a3b8' }]}>EIN Number</Text>
                        <TextInput
                            style={[styles.input, darkMode && { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }]}
                            value={formData.ein}
                            onChangeText={(text) => setFormData({ ...formData, ein: formatEIN(text) })}
                            placeholder="XX-XXXXXXX"
                            placeholderTextColor={darkMode ? "#64748b" : "#9ca3af"}
                            keyboardType="number-pad"
                            maxLength={10}
                        />
                    </View>

                    {/* Phone Number */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, darkMode && { color: '#94a3b8' }]}>Phone Number</Text>
                        <TextInput
                            style={[styles.input, darkMode && { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }]}
                            value={formData.phoneNumber}
                            onChangeText={(text) => setFormData({ ...formData, phoneNumber: formatPhone(text) })}
                            placeholder="(XXX) XXX-XXXX"
                            placeholderTextColor={darkMode ? "#64748b" : "#9ca3af"}
                            keyboardType="phone-pad"
                            maxLength={14}
                        />
                    </View>

                    {/* Supervisor Name */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, darkMode && { color: '#94a3b8' }]}>Supervisor Name</Text>
                        <TextInput
                            style={[styles.input, darkMode && { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }]}
                            value={formData.supervisorName}
                            onChangeText={(text) => setFormData({ ...formData, supervisorName: text })}
                            placeholder="Enter supervisor name"
                            placeholderTextColor={darkMode ? "#64748b" : "#9ca3af"}
                        />
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    saveButton: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6366f1',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    logoSection: {
        marginBottom: 24,
        alignItems: 'center',
    },
    logoButton: {
        marginTop: 12,
    },
    logoImage: {
        width: 120,
        height: 120,
        borderRadius: 12,
    },
    logoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
    },
    logoPlaceholderText: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 8,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
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
});
