import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { getVisitors, checkOutVisitor } from '../../services/api';

const KioskCheckOutScreen = ({ navigation }) => {
    const { userToken } = useContext(AuthContext);
    const [visitors, setVisitors] = useState([]);
    const [filteredVisitors, setFilteredVisitors] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [checkingOut, setCheckingOut] = useState(null);

    useEffect(() => {
        loadVisitors();
    }, []);

    const loadVisitors = async () => {
        setLoading(true);
        try {
            // Fetch a large number of visitors to ensure we get all active ones
            // In a real app, we should probably have a dedicated endpoint for "active visitors"
            const response = await getVisitors(userToken, 1, 1000);

            // Handle paginated response structure
            const visitorList = response.data || [];

            // Filter only currently checked-in visitors (check_out_time is null)
            // Note: Backend uses 'check_out_time', make sure property name matches
            const active = visitorList.filter(v => !v.check_out_time);

            setVisitors(active);
            setFilteredVisitors([]); // Start empty
        } catch (error) {
            console.log('Failed to load visitors', error);
            Alert.alert('Error', 'Failed to load visitor list.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (text) {
            const filtered = visitors.filter(v =>
                v.guest_firstname.toLowerCase().includes(text.toLowerCase()) ||
                v.guest_lastname.toLowerCase().includes(text.toLowerCase()) ||
                (v.badge_number && v.badge_number.toString().includes(text))
            );
            setFilteredVisitors(filtered);
        } else {
            setFilteredVisitors([]); // Clear list if search is empty
        }
    };

    const handleCheckOut = (visitor) => {
        Alert.alert(
            'Confirm Check Out',
            `Check out ${visitor.guest_firstname} ${visitor.guest_lastname}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Check Out',
                    style: 'destructive',
                    onPress: async () => {
                        setCheckingOut(visitor.visitorLog_ID);
                        try {
                            await checkOutVisitor(userToken, visitor.visitorLog_ID);
                            Alert.alert('Success', 'You have been checked out. Have a great day!', [
                                { text: 'OK', onPress: () => loadVisitors() }
                            ]);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to check out. Please try again.');
                        } finally {
                            setCheckingOut(null);
                        }
                    }
                }
            ]
        );
    };

    const renderVisitorItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => handleCheckOut(item)} disabled={checkingOut === item.visitorLog_ID}>
            <View>
                <Text style={styles.visitorName}>{item.guest_firstname} {item.guest_lastname}</Text>
                <Text style={styles.detail}>Badge: {item.badge_number}</Text>
            </View>
            {checkingOut === item.visitorLog_ID ? (
                <ActivityIndicator color="#EF4444" size="small" />
            ) : (
                <Ionicons name="log-out-outline" size={32} color="#EF4444" />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#374151" />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Visitor Check Out</Text>
                <View style={{ width: 70 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.instructionText}>Find your name to check out</Text>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={24} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or badge number..."
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={filteredVisitors}
                        keyExtractor={(item) => item.visitorLog_ID.toString()}
                        renderItem={renderVisitorItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>
                                {searchQuery ? `No active visitors found matching "${searchQuery}"` : "Start typing your name to find your check-in"}
                            </Text>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24 },
    backButton: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, backgroundColor: '#fff' },
    backText: { fontSize: 16, color: '#4B5563', marginLeft: 4, fontWeight: '600' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },

    content: { flex: 1, padding: 24 },
    instructionText: { fontSize: 18, color: '#6B7280', textAlign: 'center', marginBottom: 24 },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 32,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%'
    },
    searchIcon: { marginRight: 12 },
    searchInput: { flex: 1, paddingVertical: 16, fontSize: 18, color: '#1F2937' },

    list: { alignSelf: 'center', width: '100%', maxWidth: 600 },
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
        borderWidth: 1, borderColor: '#F3F4F6'
    },
    visitorName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
    detail: { fontSize: 14, color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, overflow: 'hidden', alignSelf: 'flex-start' },
    emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 16 },
});

export default KioskCheckOutScreen;
