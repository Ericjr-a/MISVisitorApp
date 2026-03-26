import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getCalls, getHosts, addCall } from '../services/api';

const CallLogScreen = () => {
    const { userToken } = useContext(AuthContext);
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [hosts, setHosts] = useState([]);

    // Form State
    const [callerFirst, setCallerFirst] = useState('');
    const [callerLast, setCallerLast] = useState('');
    const [contact, setContact] = useState('');
    const [purpose, setPurpose] = useState('');
    const [duration, setDuration] = useState('');
    const [selectedHostId, setSelectedHostId] = useState(null);
    const [selectedHostName, setSelectedHostName] = useState('');
    const [showHostPicker, setShowHostPicker] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const cData = await getCalls(userToken);
            setCalls(cData);
            const hData = await getHosts(userToken);
            setHosts(hData);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddCall = async () => {
        if (!callerFirst || !callerLast || !contact || !purpose || !selectedHostId) {
            Alert.alert('Error', 'Please fill all required fields and select a host');
            return;
        }

        // Find host to get is_staff
        const host = hosts.find(h => h.host_ID === selectedHostId);
        const is_staff = host?.type === 'Staff' ? 1 : 0;

        const payload = {
            caller_firstname: callerFirst,
            caller_lastname: callerLast,
            contact: contact,
            host_ID: selectedHostId,
            is_staff: is_staff,
            purpose: purpose,
            call_duration: duration || '0',
        };

        try {
            await addCall(userToken, payload);
            Alert.alert('Success', 'Call logged successfully');
            setModalVisible(false);
            resetForm();
            fetchData();
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const resetForm = () => {
        setCallerFirst('');
        setCallerLast('');
        setContact('');
        setPurpose('');
        setDuration('');
        setSelectedHostId(null);
        setSelectedHostName('');
    };

    const renderCallItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.callerName}>{item.caller_firstname} {item.caller_lastname}</Text>
                <Text style={styles.badge}>{item.call_type || 'Call'}</Text>
            </View>
            <Text style={styles.detail}>Host: {item.host_name}</Text>
            <Text style={styles.detail}>Purpose: {item.purpose}</Text>
            <Text style={styles.detail}>Duration: {item.call_duration}</Text>
            <Text style={styles.time}>{new Date(item.call_time).toLocaleString()}</Text>
        </View>
    );

    const [searchQuery, setSearchQuery] = useState('');

    const filteredCalls = calls.filter(c =>
        c.caller_firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.caller_lastname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.host_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Call Log</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                    <Text style={styles.addButtonText}>+ Log Call</Text>
                </TouchableOpacity>
            </View>

            <TextInput
                style={styles.searchBar}
                placeholder="Search by caller or host..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            {loading ? (
                <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={filteredCalls}
                    keyExtractor={(item) => item.call_log_ID.toString()}
                    renderItem={renderCallItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={fetchData}
                    ListEmptyComponent={<Text style={styles.emptyText}>No calls found</Text>}
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Log New Call</Text>

                        <TextInput style={styles.input} placeholder="Caller First Name *" value={callerFirst} onChangeText={setCallerFirst} />
                        <TextInput style={styles.input} placeholder="Caller Last Name *" value={callerLast} onChangeText={setCallerLast} />
                        <TextInput style={styles.input} placeholder="Contact Info *" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
                        <TextInput style={styles.input} placeholder="Purpose *" value={purpose} onChangeText={setPurpose} />
                        <TextInput style={styles.input} placeholder="Duration (e.g. 5m)" value={duration} onChangeText={setDuration} />

                        <TouchableOpacity style={styles.input} onPress={() => setShowHostPicker(true)}>
                            <Text style={{ color: selectedHostName ? '#000' : '#999' }}>
                                {selectedHostName || 'Select Host *'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleAddCall}>
                                <Text style={styles.buttonText}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Simple Host Picker Modal */}
                <Modal visible={showHostPicker} animationType="fade" transparent={true}>
                    <View style={styles.pickerContainer}>
                        <View style={styles.pickerContent}>
                            <Text style={styles.pickerTitle}>Select Host</Text>
                            <FlatList
                                data={hosts}
                                keyExtractor={(item) => item.host_ID.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.pickerItem}
                                        onPress={() => {
                                            setSelectedHostId(item.host_ID);
                                            setSelectedHostName(item.host_name);
                                            setShowHostPicker(false);
                                        }}
                                    >
                                        <Text style={styles.pickerItemText}>{item.host_name}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                            <TouchableOpacity style={styles.closePickerButton} onPress={() => setShowHostPicker(false)}>
                                <Text style={styles.closePickerText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
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
    searchBar: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB' },
    emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 20 },
    list: { paddingBottom: 20 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    callerName: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
    badge: { backgroundColor: '#DEF7EC', color: '#047857', paddingHorizontal: 8, borderRadius: 4, fontSize: 12, overflow: 'hidden' },
    detail: { color: '#6B7280', fontSize: 14 },
    time: { color: '#9CA3AF', fontSize: 12, marginTop: 5, textAlign: 'right' },

    modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    button: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#9CA3AF' },
    submitButton: { backgroundColor: '#6366F1' },
    buttonText: { color: '#fff', fontWeight: 'bold' },

    pickerContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 40 },
    pickerContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: 400 },
    pickerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    pickerItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    pickerItemText: { fontSize: 16 },
    closePickerButton: { marginTop: 15, padding: 10, alignItems: 'center' },
    closePickerText: { color: '#6366F1', fontWeight: 'bold' },
});

export default CallLogScreen;
