import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { getDashboardStats, checkOutVisitor } from '../services/api';
import { useNavigation } from '@react-navigation/native';

const DashboardScreen = () => {
    const { userToken, userInfo } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation();

    const fetchStats = async () => {
        try {
            const data = await getDashboardStats(userToken);
            setStats(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleCheckOut = async (visitorId) => {
        try {
            await checkOutVisitor(userToken, visitorId);
            fetchStats(); // Refresh data
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    const recentActivities = stats?.recent_activities || [];
    const activeVisitorsCount = stats?.active_visitors_count || 0;
    const callsTodayCount = stats?.calls_today_count || 0;
    const activeVisitorsList = stats?.active_visitors_list || [];

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>{greeting}, {userInfo?.username || 'User'}!</Text>
                    <Text style={styles.date}>{today}</Text>
                </View>

            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{activeVisitorsCount}</Text>
                    <Text style={styles.statLabel}>Active Visitors</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{callsTodayCount}</Text>
                    <Text style={styles.statLabel}>Calls Today</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('Visitors')}
                    >
                        <Ionicons name="person-add-outline" size={20} color="#fff" style={{ marginBottom: 5 }} />
                        <Text style={styles.actionButtonText}>Log Visitor</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.secondaryButton]}
                        onPress={() => navigation.navigate('Calls')}
                    >
                        <Ionicons name="call-outline" size={20} color="#374151" style={{ marginBottom: 5 }} />
                        <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Log Call</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {activeVisitorsList.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pending Actions</Text>
                    {activeVisitorsList.map((visitor) => (
                        <View key={visitor.id} style={styles.pendingItem}>
                            <View>
                                <Text style={styles.visitorName}>{visitor.name}</Text>
                                <Text style={styles.visitorDate}>In since {new Date(visitor.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                            <TouchableOpacity style={styles.checkOutButton} onPress={() => handleCheckOut(visitor.id)}>
                                <Text style={styles.checkOutButtonText}>Check Out</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                {recentActivities.map((item, index) => (
                    <View key={index} style={styles.activityItem}>
                        <View style={styles.activityIconContainer}>
                            <Ionicons
                                name={item.type === 'visitor' ? "people" : "call"}
                                size={20}
                                color={item.type === 'visitor' ? "#6366F1" : "#10B981"}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.visitorName}>{item.name}</Text>
                            <Text style={styles.visitorDate}>
                                {new Date(item.date).toLocaleDateString()} • {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                        <View>
                            {item.type === 'visitor' ? (
                                <Text style={[styles.status, item.status_info ? styles.statusOut : styles.statusIn]}>
                                    {item.status_info ? 'Out' : 'In'}
                                </Text>
                            ) : (
                                <Text style={[styles.status, styles.statusCall]}>Call</Text>
                            )}
                        </View>
                    </View>
                ))}
                {recentActivities.length === 0 && (
                    <Text style={styles.emptyText}>No recent activity</Text>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: 40,
        marginBottom: 20,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    date: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },

    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
        gap: 15,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 15,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 15,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#6366F1',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    secondaryButtonText: {
        color: '#374151',
    },
    pendingItem: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    checkOutButton: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    checkOutButtonText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '600',
    },
    activityItem: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    activityIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    visitorName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    visitorDate: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    status: {
        fontSize: 12,
        fontWeight: '500',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    statusIn: {
        color: '#059669',
        backgroundColor: '#D1FAE5',
    },
    statusOut: {
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
    },
    statusCall: {
        color: '#059669',
        backgroundColor: '#D1FAE5',
    },
    emptyText: {
        color: '#9CA3AF',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 10,
    },
});

export default DashboardScreen;
