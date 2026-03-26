import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getVisitors, getHosts, addVisitor, checkOutVisitor, getGuests, getNextBadgeNumber } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const VisitorLogScreen = () => {
    const { userToken } = useContext(AuthContext);
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [hosts, setHosts] = useState([]);
    const [guests, setGuests] = useState([]);
    const [badgeNumber, setBadgeNumber] = useState('');
    const [arrivalTime, setArrivalTime] = useState('');
    const [guestSearchQuery, setGuestSearchQuery] = useState('');
    const [filteredGuests, setFilteredGuests] = useState([]);
    const [showGuestList, setShowGuestList] = useState(false);

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [purpose, setPurpose] = useState('');
    const [selectedHostId, setSelectedHostId] = useState(null);
    const [selectedHostName, setSelectedHostName] = useState(''); // For display
    // Host Search State
    const [hostSearchQuery, setHostSearchQuery] = useState('');
    const [filteredHosts, setFilteredHosts] = useState([]);
    const [showHostList, setShowHostList] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const vData = await getVisitors(userToken);
            setVisitors(vData);
            const hData = await getHosts(userToken);
            setHosts(hData);
            const gData = await getGuests(userToken);
            setGuests(gData);
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

    const openCheckInModal = async () => {
        setModalVisible(true);
        // Set Arrival Time
        const now = new Date();
        setArrivalTime(now.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }));

        // Fetch Next Badge
        try {
            const badge = await getNextBadgeNumber(userToken);
            setBadgeNumber(badge);
        } catch (error) {
            console.error("Failed to fetch badge", error);
        }
    };

    const handleGuestSearch = (text) => {
        setGuestSearchQuery(text);
        if (text.length > 0) {
            const filtered = guests.filter(g =>
                g.guest_firstname.toLowerCase().includes(text.toLowerCase()) ||
                g.guest_lastname.toLowerCase().includes(text.toLowerCase()) ||
                (g.guest_phonenumber && g.guest_phonenumber.includes(text))
            );
            setFilteredGuests(filtered);
            setShowGuestList(true);
        } else {
            setFilteredGuests([]);
            setShowGuestList(false);
        }
    };

    const selectGuest = (guest) => {
        setFirstName(guest.guest_firstname);
        setLastName(guest.guest_lastname);
        setPhone(guest.guest_phonenumber);
        setGuestSearchQuery(`${guest.guest_firstname} ${guest.guest_lastname}`);
        setShowGuestList(false);
    };

    const handleHostSearch = (text) => {
        setHostSearchQuery(text);
        if (text.length > 0) {
            const filtered = hosts.filter(h =>
                h.host_name.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredHosts(filtered);
            setShowHostList(true);
        } else {
            setFilteredHosts([]);
            setShowHostList(false);
        }
    };

    const selectHost = (host) => {
        setSelectedHostId(host.host_ID);
        setSelectedHostName(host.host_name);
        setHostSearchQuery(host.host_name);
        setShowHostList(false);
    };

    const handleAddVisitor = async () => {
        if (!firstName || !lastName || !purpose || !selectedHostId) {
            Alert.alert('Error', 'Please fill all required fields and select a host');
            return;
        }

        // Find host to get is_staff
        const host = hosts.find(h => h.host_ID === selectedHostId);
        const is_staff = host?.type === 'Staff' ? 1 : 0;

        const payload = {
            guest_firstname: firstName,
            guest_lastname: lastName,
            guest_phonenumber: phone,
            host_ID: selectedHostId,
            is_staff: is_staff,
            visit_purpose: purpose,
        };

        try {
            await addVisitor(userToken, payload);
            Alert.alert('Success', 'Visitor logged successfully');
            setModalVisible(false);
            resetForm();
            fetchData();
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setPhone('');
        setPurpose('');
        setSelectedHostId(null);
        setSelectedHostName('');
        setGuestSearchQuery('');
        setShowGuestList(false);
        setHostSearchQuery('');
        setShowHostList(false);
    };

    const handleCheckOut = async (id) => {
        try {
            await checkOutVisitor(userToken, id);
            Alert.alert('Success', 'Visitor checked out');
            fetchData();
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const renderVisitorItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.visitorName}>{item.guest_firstname} {item.guest_lastname}</Text>
                <Text style={styles.badge}>{item.badge_number}</Text>
            </View>
            <Text style={styles.detail}>Host: {item.host_name}</Text>
            <Text style={styles.detail}>Purpose: {item.visit_purpose}</Text>
            <View style={styles.timeContainer}>
                <Text style={styles.time}>In: {new Date(item.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                {item.check_out_time ? (
                    <Text style={styles.time}>Out: {new Date(item.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                ) : (
                    <TouchableOpacity style={styles.checkOutButton} onPress={() => handleCheckOut(item.visitorLog_ID)}>
                        <Text style={styles.checkOutText}>Check Out</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const [searchQuery, setSearchQuery] = useState('');

    const [checkOutModalVisible, setCheckOutModalVisible] = useState(false);

    const filteredVisitors = visitors.filter(v =>
        v.guest_firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.guest_lastname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.badge_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeVisitors = visitors.filter(v => !v.check_out_time && (
        v.guest_firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.guest_lastname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.badge_number.toLowerCase().includes(searchQuery.toLowerCase())
    ));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Visitor Log</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity style={[styles.actionButton, styles.checkInButton]} onPress={openCheckInModal}>
                        <Text style={styles.actionButtonText}>Check In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.checkOutButtonHeader]} onPress={() => setCheckOutModalVisible(true)}>
                        <Text style={styles.actionButtonText}>Check Out</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <TextInput
                style={styles.searchBar}
                placeholder="Search by name or badge..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            {loading ? (
                <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={filteredVisitors}
                    keyExtractor={(item) => item.visitorLog_ID.toString()}
                    renderItem={renderVisitorItem}
                    contentContainerStyle={styles.list}
                    refreshing={loading}
                    onRefresh={fetchData}
                    ListEmptyComponent={<Text style={styles.emptyText}>No visitors found</Text>}
                />
            )}

            {/* Check In Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Visitor Check-In</Text>
                        <Text style={styles.subText}>Quickly process visitor arrivals and assign badges.</Text>

                        {/* Find or Add Visitor */}
                        <Text style={styles.sectionLabel}>Find or Add Visitor</Text>
                        <View style={{ zIndex: 10 }}>
                            <TextInput
                                style={styles.input}
                                placeholder="Search visitor by name or phone..."
                                value={guestSearchQuery}
                                onChangeText={handleGuestSearch}
                            />
                            {showGuestList && (
                                <View style={styles.dropdown}>
                                    <FlatList
                                        data={filteredGuests}
                                        keyExtractor={(item) => item.guest_ID.toString()}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity style={styles.dropdownItem} onPress={() => selectGuest(item)}>
                                                <Text>{item.guest_firstname} {item.guest_lastname} ({item.guest_phonenumber})</Text>
                                            </TouchableOpacity>
                                        )}
                                        style={{ maxHeight: 150 }}
                                    />
                                    <TouchableOpacity style={styles.dropdownItem} onPress={() => {
                                        resetForm();
                                        setGuestSearchQuery(guestSearchQuery); // Keep what they typed as potential new name? No, clear it.
                                        setShowGuestList(false);
                                    }}>
                                        <Text style={{ color: '#6366F1', fontWeight: 'bold' }}>+ New Visitor</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Visitor Details */}
                        <Text style={styles.sectionLabel}>Visitor Details</Text>
                        <View style={styles.row}>
                            <TextInput style={[styles.input, { flex: 1, marginRight: 5 }]} placeholder="First Name *" value={firstName} onChangeText={setFirstName} />
                            <TextInput style={[styles.input, { flex: 1, marginLeft: 5 }]} placeholder="Last Name *" value={lastName} onChangeText={setLastName} />
                        </View>
                        <TextInput style={styles.input} placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

                        <Text style={styles.sectionLabel}>Person Visited *</Text>
                        <View style={{ zIndex: 5 }}>
                            <TextInput
                                style={styles.input}
                                placeholder="Search host by name..."
                                value={hostSearchQuery}
                                onChangeText={handleHostSearch}
                            />
                            {showHostList && (
                                <View style={styles.dropdown}>
                                    <FlatList
                                        data={filteredHosts}
                                        keyExtractor={(item) => item.host_ID.toString()}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity style={styles.dropdownItem} onPress={() => selectHost(item)}>
                                                <Text>{item.host_name} ({item.type})</Text>
                                            </TouchableOpacity>
                                        )}
                                        style={{ maxHeight: 150 }}
                                    />
                                </View>
                            )}
                        </View>

                        <Text style={styles.sectionLabel}>Purpose of visit *</Text>
                        <TextInput style={styles.input} placeholder="Enter purpose of visit" value={purpose} onChangeText={setPurpose} />

                        {/* Badge & Arrival */}
                        <Text style={styles.sectionLabel}>Badge & Arrival Details</Text>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 5 }}>
                                <Text style={styles.label}>Badge Number</Text>
                                <TextInput style={[styles.input, styles.readOnlyInput]} value={badgeNumber} editable={false} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 5 }}>
                                <Text style={styles.label}>Arrival Time</Text>
                                <TextInput style={[styles.input, styles.readOnlyInput]} value={arrivalTime} editable={false} />
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleAddVisitor}>
                                <Text style={styles.buttonText}>Check-In Visitor</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

            </Modal>

            {/* Check Out Modal */}
            <Modal visible={checkOutModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Check Out Visitor</Text>
                        <Text style={styles.subText}>Select a visitor to check out</Text>

                        <TextInput
                            style={[styles.searchBar, { marginTop: 10 }]}
                            placeholder="Search active visitors..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        <FlatList
                            data={activeVisitors}
                            keyExtractor={(item) => item.visitorLog_ID.toString()}
                            style={{ maxHeight: 300 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.checkOutItem} onPress={() => {
                                    Alert.alert(
                                        'Confirm Check Out',
                                        `Check out ${item.guest_firstname} ${item.guest_lastname}?`,
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Check Out',
                                                style: 'destructive',
                                                onPress: async () => {
                                                    await handleCheckOut(item.visitorLog_ID);
                                                    setCheckOutModalVisible(false);
                                                }
                                            }
                                        ]
                                    );
                                }}>
                                    <View>
                                        <Text style={styles.visitorName}>{item.guest_firstname} {item.guest_lastname}</Text>
                                        <Text style={styles.detail}>Badge: {item.badge_number}</Text>
                                    </View>
                                    <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={styles.emptyText}>No active visitors found</Text>}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setCheckOutModalVisible(false)}>
                                <Text style={styles.buttonText}>Close</Text>
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
        backgroundColor: '#F9FAFB',
        padding: 20
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
    headerButtons: { flexDirection: 'row', gap: 10 },
    actionButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    checkInButton: { backgroundColor: '#10B981' }, // Green
    checkOutButtonHeader: { backgroundColor: '#EF4444' }, // Red
    actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },

    searchBar: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB' },
    emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 20 },
    list: { paddingBottom: 20 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    visitorName: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
    badge: { backgroundColor: '#E0E7FF', color: '#4338CA', paddingHorizontal: 8, borderRadius: 4, fontSize: 12, overflow: 'hidden' },
    detail: { color: '#6B7280', fontSize: 14 },
    timeContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    time: { color: '#9CA3AF', fontSize: 12 },
    checkOutButton: { backgroundColor: '#EF4444', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5 },
    checkOutText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
    subText: { color: '#6B7280', marginBottom: 15, fontSize: 14 },
    sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 5, marginTop: 5 },
    label: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
    input: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
    readOnlyInput: { backgroundColor: '#F3F4F6', color: '#6B7280' },
    row: { flexDirection: 'row' },
    dropdown: { position: 'absolute', top: 75, left: 0, right: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
    dropdownItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 10 },
    button: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#9CA3AF' },
    submitButton: { backgroundColor: '#6366F1' },
    buttonText: { color: '#fff', fontWeight: 'bold' },

    checkOutItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },

    pickerContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 40 },
    pickerContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: 400 },
    pickerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    pickerItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    pickerItemText: { fontSize: 16 },
    closePickerButton: { marginTop: 15, padding: 10, alignItems: 'center' },
    closePickerText: { color: '#6366F1', fontWeight: 'bold' },
});

export default VisitorLogScreen;
