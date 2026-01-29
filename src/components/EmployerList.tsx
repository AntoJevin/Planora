import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Employer } from '../types/employer';

interface EmployerListProps {
    employers: Employer[];
    onEdit: (employer: Employer) => void;
    onDelete: (id: string) => void;
    onAdd: () => void;
}

export default function EmployerList({ employers, onEdit, onDelete, onAdd }: EmployerListProps) {
    const handleDelete = (employer: Employer) => {
        Alert.alert(
            'Delete Employer',
            `Are you sure you want to delete ${employer.companyName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDelete(employer.id)
                }
            ]
        );
    };

    const renderEmployer = ({ item }: { item: Employer }) => (
        <View style={styles.employerCard}>
            <View style={styles.employerInfo}>
                {item.logoUri ? (
                    <Image source={{ uri: item.logoUri }} style={styles.logo} />
                ) : (
                    <View style={styles.logoPlaceholder}>
                        <Ionicons name="business" size={24} color="#9ca3af" />
                    </View>
                )}
                <View style={styles.details}>
                    <Text style={styles.companyName}>{item.companyName}</Text>
                    {item.supervisorName && (
                        <Text style={styles.supervisor}>Supervisor: {item.supervisorName}</Text>
                    )}
                    {item.phoneNumber && (
                        <Text style={styles.contact}>{item.phoneNumber}</Text>
                    )}
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onEdit(item)}
                >
                    <Ionicons name="create-outline" size={20} color="#6366f1" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDelete(item)}
                >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Employers</Text>
                <TouchableOpacity style={styles.addButton} onPress={onAdd}>
                    <Ionicons name="add" size={20} color="white" />
                    <Text style={styles.addButtonText}>Add Employer</Text>
                </TouchableOpacity>
            </View>

            {employers.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="business-outline" size={48} color="#9ca3af" />
                    <Text style={styles.emptyText}>No employers added yet</Text>
                    <Text style={styles.emptySubtext}>Tap "Add Employer" to get started</Text>
                </View>
            ) : (
                <FlatList
                    data={employers}
                    renderItem={renderEmployer}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6366f1',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    addButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    list: {
        padding: 16,
    },
    employerCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    employerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    logo: {
        width: 56,
        height: 56,
        borderRadius: 8,
        marginRight: 12,
    },
    logoPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    details: {
        flex: 1,
    },
    companyName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    supervisor: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 2,
    },
    contact: {
        fontSize: 13,
        color: '#6b7280',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
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
});
