import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getUsers, addUser, deleteUser, updateUser, resetUserPassword } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const UserListScreen = () => {
    const { userToken, userInfo } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('receptionist');
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);

    useEffect(() => {
        if (userInfo?.role?.toLowerCase() === 'admin') {
            fetchUsers();
        }
    }, [userInfo]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers(userToken);
            setUsers(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        if (!username || !email || !role) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        if (!isEditing && !password) {
            Alert.alert('Error', 'Password is required for new users');
            return;
        }

        const payload = {
            username,
            email,
            role_name: role,
        };

        if (password) {
            payload.passwordd = password;
        }

        try {
            if (isEditing) {
                await updateUser(userToken, selectedUserId, payload);
                Alert.alert('Success', 'User updated successfully');
            } else {
                await addUser(userToken, payload);
                Alert.alert('Success', 'User added successfully');
            }
            setModalVisible(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleEditUser = (user) => {
        setUsername(user.username || '');
        setEmail(user.email);
        setRole(user.role_name);
        setSelectedUserId(user.user_ID);
        setIsEditing(true);
        setModalVisible(true);
    };

    const handleResetPassword = (userId) => {
        Alert.prompt(
            'Reset Password',
            'Enter new password for this user:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    onPress: async (newPassword) => {
                        if (!newPassword) return;
                        try {
                            await resetUserPassword(userToken, userId, newPassword);
                            Alert.alert('Success', 'Password reset successfully');
                        } catch (error) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ],
            'secure-text'
        );
    };

    const handleDeleteUser = async (id) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this user?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteUser(userToken, id);
                            Alert.alert('Success', 'User deleted');
                            fetchUsers();
                        } catch (error) {
                            Alert.alert('Error', error.message);
                        }
                    },
                },
            ]
        );
    };

    const resetForm = () => {
        setUsername('');
        setEmail('');
        setPassword('');
        setRole('receptionist');
        setIsEditing(false);
        setSelectedUserId(null);
    };

    const renderUserItem = ({ item }) => {
        const isAdmin = item.role_name === 'admin';
        return (
            <View style={[styles.card, isAdmin && styles.adminCard]}>
                <View style={styles.cardContent}>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{item.username || item.email.split('@')[0]}</Text>
                        <Text style={styles.userEmail}>{item.email}</Text>
                    </View>
                    <View style={styles.roleContainer}>
                        <View style={[styles.badge, isAdmin ? styles.adminBadge : styles.userBadge]}>
                            <Ionicons name={isAdmin ? "shield-checkmark" : "person"} size={12} color={isAdmin ? "#B91C1C" : "#4338CA"} style={{ marginRight: 4 }} />
                            <Text style={[styles.badgeText, isAdmin ? styles.adminBadgeText : styles.userBadgeText]}>
                                {item.role_name}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.statusContainer}>
                        <View style={styles.activeBadge}>
                            <Text style={styles.activeText}>Active</Text>
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => handleEditUser(item)}>
                            <Ionicons name="create-outline" size={20} color="#4B5563" />
                        </TouchableOpacity>

                        {userInfo.role === 'admin' && (
                            <TouchableOpacity style={styles.iconButton} onPress={() => handleResetPassword(item.user_ID)}>
                                <Ionicons name="key-outline" size={20} color="#F59E0B" />
                            </TouchableOpacity>
                        )}

                        {item.email !== userInfo.email && (
                            <TouchableOpacity style={styles.iconButton} onPress={() => handleDeleteUser(item.user_ID)}>
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    if (userInfo?.role?.toLowerCase() !== 'admin') {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Access Denied</Text>
                <Text style={styles.subText}>Only admins can manage users.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>User Management</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => { resetForm(); setModalVisible(true); }}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>New User</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>Manage users, roles, and permissions</Text>

            <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            {loading ? (
                <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={users.filter(u =>
                        (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                    )}
                    keyExtractor={(item) => item.user_ID.toString()}
                    renderItem={renderUserItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={fetchUsers}
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{isEditing ? 'Edit User' : 'Add New User'}</Text>

                        <TextInput style={styles.input} placeholder="Username *" value={username} onChangeText={setUsername} />
                        <TextInput style={styles.input} placeholder="Email *" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                        <TextInput style={styles.input} placeholder="Password (leave blank to keep current)" value={password} onChangeText={setPassword} secureTextEntry />

                        <View style={styles.roleSelector}>
                            <Text style={styles.roleLabel}>Role:</Text>
                            <View style={styles.roleButtons}>
                                {['admin', 'supervisor', 'receptionist'].map((r) => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[styles.roleButton, role === r && styles.activeRole]}
                                        onPress={() => setRole(r)}
                                    >
                                        <Text style={[styles.roleText, role === r && styles.activeRoleText]}>
                                            {r.charAt(0).toUpperCase() + r.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleAddUser}>
                                <Text style={styles.buttonText}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
    subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20, marginTop: 5 },

    addButton: {
        backgroundColor: '#6366F1',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
    addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },

    list: { paddingBottom: 20 },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: 'transparent'
    },
    adminCard: { borderLeftColor: '#EF4444' },
    cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 2 },
    userEmail: { fontSize: 14, color: '#6B7280' },

    roleContainer: { marginLeft: 10 },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    adminBadge: { backgroundColor: '#FEE2E2' },
    adminBadgeText: { color: '#B91C1C' },
    userBadge: { backgroundColor: '#E0E7FF' },
    userBadgeText: { color: '#4338CA' },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
    statusContainer: { flexDirection: 'row', alignItems: 'center' },
    statusLabel: { fontSize: 14, color: '#6B7280', marginRight: 5 },
    activeBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    activeText: { color: '#065F46', fontSize: 12, fontWeight: '600' },

    actions: { flexDirection: 'row', gap: 15 },
    iconButton: { padding: 5 },

    errorText: { fontSize: 20, fontWeight: 'bold', color: '#EF4444' },
    subText: { color: '#6B7280', marginTop: 10 },

    modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    button: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#9CA3AF' },
    submitButton: { backgroundColor: '#6366F1' },
    buttonText: { color: '#fff', fontWeight: 'bold' },

    roleSelector: { marginBottom: 20 },
    roleLabel: { fontWeight: 'bold', marginBottom: 10, color: '#374151' },
    roleButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    roleButton: { padding: 8, borderRadius: 6, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
    activeRole: { backgroundColor: '#E0E7FF', borderColor: '#6366F1' },
    roleText: { color: '#6B7280' },
    activeRoleText: { color: '#6366F1', fontWeight: 'bold' },
    searchInput: { backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 15 },
});

export default UserListScreen;
