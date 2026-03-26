import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getHosts, API_BASE } from '../services/api';

const HostListScreen = () => {
    const { userToken, userInfo } = useContext(AuthContext);
    const [hosts, setHosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('All');

    // Form State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [department, setDepartment] = useState('');
    const [staffId, setStaffId] = useState('');
    const [type, setType] = useState('staff'); // 'staff' or 'nonstaff'

    const fetchHosts = async () => {
        setLoading(true);
        try {
            const data = await getHosts(userToken);
            setHosts(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch hosts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHosts();
    }, []);

    const handleAddHost = async () => {
        if (!name || !phone || (type === 'staff' && !staffId)) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        const payload = {
            type,
            name,
            phoneNumber: phone,
            department,
            staff_id: type === 'staff' ? staffId : undefined,
        };

        try {
            const response = await fetch(`${API_BASE}/hosts/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to add host');

            Alert.alert('Success', 'Host added successfully');
            setModalVisible(false);
            resetForm();
            fetchHosts();
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleDeleteHost = async (hostId, hostType) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this host?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(`${API_BASE}/hosts/delete/${hostId}?type=${hostType.toLowerCase()}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${userToken}` },
                            });
                            const data = await response.json();
                            if (!response.ok) throw new Error(data.message || 'Failed to delete host');

                            Alert.alert('Success', 'Host deleted');
                            fetchHosts();
                        } catch (error) {
                            Alert.alert('Error', error.message);
                        }
                    },
                },
            ]
        );
    };

    const resetForm = () => {
        setName('');
        setPhone('');
        setDepartment('');
        setStaffId('');
        setType('staff');
    };

    const renderHostItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.hostName}>{item.host_name}</Text>
                <Text style={[styles.badge, item.host_type === 'Staff' ? styles.staffBadge : styles.nonStaffBadge]}>
                    {item.host_type}
                </Text>
            </View>
            <Text style={styles.detail}>{item.host_phoneNumber}</Text>
            <Text style={styles.detail}>{item.department || 'No Dept'}</Text>
            {userInfo?.role !== 'receptionist' && (
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteHost(item.host_ID, item.host_type)}
                >
                    <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const filteredHosts = hosts.filter(host => {
        const matchesSearch = host.host_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            host.host_phoneNumber.includes(searchQuery) ||
            (host.department && host.department.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesDept = selectedDepartment === 'All' || host.department === selectedDepartment;

        return matchesSearch && matchesDept;
    });

    // Extract unique departments
    const departments = ['All', ...new Set(hosts.map(h => h.department).filter(d => d))];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Phonebook</Text>
                {userInfo?.role !== 'receptionist' && (
                    <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                        <Text style={styles.addButtonText}>+ Add Host</Text>
                    </TouchableOpacity>
                )}
            </View>

            <TextInput
                style={styles.searchBar}
                placeholder="Search by name, phone, or dept..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            <View style={{ marginBottom: 10 }}>
                <FlatList
                    horizontal
                    data={departments}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.filterChip, selectedDepartment === item && styles.activeFilterChip]}
                            onPress={() => setSelectedDepartment(item)}
                        >
                            <Text style={[styles.filterText, selectedDepartment === item && styles.activeFilterText]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={{ paddingHorizontal: 5 }}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={filteredHosts}
                    keyExtractor={(item) => `${item.host_type}-${item.host_ID}`}
                    renderItem={renderHostItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={fetchHosts}
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New Host</Text>

                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeButton, type === 'staff' && styles.activeType]}
                                onPress={() => setType('staff')}
                            >
                                <Text style={[styles.typeText, type === 'staff' && styles.activeTypeText]}>Staff</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeButton, type === 'nonstaff' && styles.activeType]}
                                onPress={() => setType('nonstaff')}
                            >
                                <Text style={[styles.typeText, type === 'nonstaff' && styles.activeTypeText]}>Non-Staff</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput style={styles.input} placeholder="Name *" value={name} onChangeText={setName} />
                        <TextInput style={styles.input} placeholder="Phone Number *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                        <TextInput style={styles.input} placeholder="Department" value={department} onChangeText={setDepartment} />

                        {type === 'staff' && (
                            <TextInput style={styles.input} placeholder="Staff ID *" value={staffId} onChangeText={setStaffId} keyboardType="numeric" />
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleAddHost}>
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 20 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
    addButton: { backgroundColor: '#6366F1', padding: 10, borderRadius: 8 },
    addButtonText: { color: '#fff', fontWeight: '600' },
    list: { paddingBottom: 20, paddingTop: 10 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    hostName: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
    badge: { paddingHorizontal: 8, borderRadius: 4, fontSize: 12, overflow: 'hidden' },
    staffBadge: { backgroundColor: '#E0E7FF', color: '#4338CA' },
    nonStaffBadge: { backgroundColor: '#FEF3C7', color: '#D97706' },
    detail: { color: '#6B7280', fontSize: 14 },
    deleteButton: { marginTop: 10, alignSelf: 'flex-end' },
    deleteText: { color: '#EF4444', fontSize: 12, fontWeight: 'bold' },

    modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    button: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#9CA3AF' },
    submitButton: { backgroundColor: '#6366F1' },
    buttonText: { color: '#fff', fontWeight: 'bold' },

    typeSelector: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4 },
    typeButton: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 6 },
    activeType: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, elevation: 1 },
    typeText: { color: '#6B7280', fontWeight: '600' },
    activeTypeText: { color: '#6366F1' },
    searchBar: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB' },
    filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#E5E7EB', marginRight: 8 },
    activeFilterChip: { backgroundColor: '#6366F1' },
    filterText: { color: '#4B5563', fontSize: 14, fontWeight: '500' },
    activeFilterText: { color: '#fff' },
});

export default HostListScreen;
