import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Modal, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { getHosts, addVisitor } from '../../services/api';

const KioskCheckInScreen = ({ navigation }) => {
    const { userToken } = useContext(AuthContext);
    const [step, setStep] = useState(1); // 1: Name/Phone, 2: Visit Type, 3: Host/Purpose, 4: Success
    const [loading, setLoading] = useState(false);

    // Form Data
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [visitType, setVisitType] = useState(''); // 'host' or 'enquiry'
    const [purpose, setPurpose] = useState('');
    const [selectedHost, setSelectedHost] = useState(null);

    // Host/Department Data
    const [hosts, setHosts] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    // Search/Filter
    const [hostSearchQuery, setHostSearchQuery] = useState('');
    const [filteredHosts, setFilteredHosts] = useState([]);
    const [showHostList, setShowHostList] = useState(false);

    // Success Data
    const [completedVisitor, setCompletedVisitor] = useState(null);

    useEffect(() => {
        loadHosts();
    }, []);

    const loadHosts = async () => {
        try {
            const data = await getHosts(userToken);
            setHosts(data);

            // Extract unique departments
            const uniqueDepts = [...new Set(data.map(h => h.department).filter(d => d))];
            setDepartments(uniqueDepts.sort());
        } catch (error) {
            console.log('Failed to load hosts', error);
        }
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
        setSelectedHost(host);
        setHostSearchQuery(host.host_name);
        setShowHostList(false);
    };

    const selectDepartment = (dept) => {
        setSelectedDepartment(dept);

        // Filter hosts for this department
        const deptHosts = hosts.filter(h => h.department === dept);

        // Option A Logic: 
        // If there is a host that matches the department name (e.g. "HR" or "HR Desk"), auto-select?
        // For now, let's just filter the list so the user can pick the "Office Account".
        // If there's only one host in the department, auto-select them.
        if (deptHosts.length === 1) {
            selectHost(deptHosts[0]);
        } else {
            // Pre-filter the host list for the next view
            setFilteredHosts(deptHosts);
            setShowHostList(true);
            // We might need a slightly different UI flow here if we want to force selection from this list
            // For now, let's populate the search field with the department name to show it's filtered? 
            // Or better, just set the filtered list and let them pick.
        }
    };

    const handleNext = () => {
        if (step === 1) {
            if (!firstName || !lastName || !phone) {
                Alert.alert('Missing Information', 'Please fill in your name and phone number.');
                return;
            }

            // Phone Validation
            if (phone.length !== 10) {
                Alert.alert('Invalid Phone Number', 'Phone number must be exactly 10 digits.');
                return;
            }
            if (!phone.startsWith('0')) {
                Alert.alert('Invalid Phone Number', 'Phone number must start with 0.');
                return;
            }

            setStep(2);
        } else if (step === 2) {
            if (!visitType) {
                Alert.alert('Selection Required', 'Please select the purpose of your visit.');
                return;
            }
            setStep(3);
        }
    };

    const handleBack = () => {
        if (step === 4) {
            // Cannot go back from success screen, must finish
            return;
        }

        if (step === 3 && selectedDepartment) {
            // If in Department mode and a department is selected, go back to Department list
            setSelectedDepartment(null);
            setSelectedHost(null);
            setHostSearchQuery('');
            return;
        }

        if (step > 1) {
            setStep(step - 1);
            // Reset state when going back
            if (step === 3) {
                setSelectedDepartment(null);
                setSelectedHost(null);
                setHostSearchQuery('');
            }
        } else {
            navigation.goBack();
        }
    };

    const selectVisitType = (type) => {
        setVisitType(type);
        if (type === 'enquiry') {
            setPurpose('General Enquiry');
        } else {
            setPurpose('');
        }
        setStep(3);
    };

    const handleSubmit = async () => {
        if (!selectedHost || !purpose) {
            Alert.alert('Missing Information', 'Please select a host and enter the purpose of your visit.');
            return;
        }

        setLoading(true);
        try {
            const is_staff = selectedHost.host_type === 'Staff' ? 1 : 0;
            const payload = {
                guest_firstname: firstName,
                guest_lastname: lastName,
                guest_phonenumber: phone,
                host_ID: selectedHost.host_ID,
                is_staff: is_staff,
                visit_purpose: purpose,
            };

            const response = await addVisitor(userToken, payload);

            setCompletedVisitor({
                ...payload,
                badge_number: response.badge_number,
                host_name: selectedHost.host_name,
                department: selectedHost.department
            });

            setStep(4);

        } catch (error) {
            Alert.alert('Check In Failed', error.message || 'Please try again or ask for assistance.');
        } finally {
            setLoading(false);
        }
    };

    const handleDone = () => {
        navigation.navigate('KioskHome');
    };

    // Render Department List Item
    const renderDepartmentItem = ({ item }) => (
        <TouchableOpacity
            style={styles.deptCard}
            onPress={() => selectDepartment(item)}
        >
            <View style={styles.deptIcon}>
                <Ionicons name="business" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.deptText}>{item}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {step < 4 && (
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="#374151" />
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Visitor Check In</Text>
                    <View style={{ width: 70 }} />
                </View>
            )}

            <View style={styles.content}>
                {step < 4 && (
                    <View style={styles.progressBar}>
                        <View style={[styles.progressDot, step >= 1 && styles.activeDot]} />
                        <View style={[styles.progressLine, step >= 2 && styles.activeLine]} />
                        <View style={[styles.progressDot, step >= 2 && styles.activeDot]} />
                        <View style={[styles.progressLine, step >= 3 && styles.activeLine]} />
                        <View style={[styles.progressDot, step >= 3 && styles.activeDot]} />
                    </View>
                )}

                {step === 1 && (
                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Your Details</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="First Name"
                            value={firstName}
                            onChangeText={setFirstName}
                            autoFocus
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Last Name"
                            value={lastName}
                            onChangeText={setLastName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            maxLength={10}
                        />
                        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                            <Text style={styles.buttonText}>Next</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}

                {step === 2 && (
                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>What brings you here?</Text>
                        <View style={styles.selectionContainer}>
                            <TouchableOpacity
                                style={[styles.selectionCard, visitType === 'host' && styles.activeSelection]}
                                onPress={() => selectVisitType('host')}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
                                    <Ionicons name="person" size={40} color="#4F46E5" />
                                </View>
                                <Text style={styles.selectionTitle}>See a Host</Text>
                                <Text style={styles.selectionDesc}>I'm here to meet someone specific</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.selectionCard, visitType === 'enquiry' && styles.activeSelection]}
                                onPress={() => selectVisitType('enquiry')}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                                    <Ionicons name="information-circle" size={40} color="#10B981" />
                                </View>
                                <Text style={styles.selectionTitle}>Make an Enquiry</Text>
                                <Text style={styles.selectionDesc}>I have a general question or delivery</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {step === 3 && (
                    <View style={styles.formSection}>
                        {visitType === 'enquiry' && !selectedDepartment && !selectedHost ? (
                            <>
                                <Text style={styles.sectionTitle}>Select Department</Text>
                                <Text style={styles.subTitle}>Which department would you like to visit?</Text>
                                <View style={styles.deptListContainer}>
                                    <FlatList
                                        data={departments}
                                        keyExtractor={(item) => item}
                                        renderItem={renderDepartmentItem}
                                        style={{ width: '100%' }}
                                        contentContainerStyle={{ paddingBottom: 20 }}
                                    />
                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={styles.sectionTitle}>Visit Details</Text>

                                <View style={{ zIndex: 9999, elevation: 100, width: '100%', position: 'relative' }}>
                                    <Text style={styles.label}>
                                        {visitType === 'enquiry' ? 'Select Office / Staff' : 'Who are you visiting?'}
                                    </Text>

                                    {/* If Department is selected, show it as a badge or locked input */}
                                    {selectedDepartment && (
                                        <View style={styles.selectedDeptBadge}>
                                            <Text style={styles.selectedDeptText}>Department: {selectedDepartment}</Text>
                                            <TouchableOpacity onPress={() => { setSelectedDepartment(null); setSelectedHost(null); }}>
                                                <Text style={styles.changeDeptText}>Change</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    <TextInput
                                        style={styles.input}
                                        placeholder={visitType === 'enquiry' ? "Select office account..." : "Search host name..."}
                                        value={hostSearchQuery}
                                        onChangeText={handleHostSearch}
                                        onFocus={() => {
                                            if (visitType === 'enquiry' && selectedDepartment) {
                                                // If filtered by dept, show the filtered list immediately
                                                setShowHostList(true);
                                            }
                                        }}
                                    />
                                    {/* Always show list if we have filtered hosts from department selection */}
                                    {(showHostList || (visitType === 'enquiry' && selectedDepartment && filteredHosts.length > 0)) && (
                                        <View style={styles.dropdown}>
                                            <FlatList
                                                data={filteredHosts}
                                                keyExtractor={(item) => item.host_ID.toString()}
                                                renderItem={({ item }) => (
                                                    <TouchableOpacity style={styles.dropdownItem} onPress={() => selectHost(item)}>
                                                        <Text style={styles.dropdownText}>{item.host_name} ({item.department || item.host_type})</Text>
                                                    </TouchableOpacity>
                                                )}
                                                style={{ maxHeight: 200 }}
                                                nestedScrollEnabled={true}
                                            />
                                        </View>
                                    )}
                                </View>

                                <Text style={styles.label}>Purpose of Visit</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Meeting, Interview, Delivery"
                                    value={purpose}
                                    onChangeText={setPurpose}
                                />

                                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Complete Check In</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}

                {step === 4 && completedVisitor && (
                    <View style={styles.successSection}>
                        <View style={styles.successIconContainer}>
                            <Ionicons name="checkmark" size={60} color="#fff" />
                        </View>
                        <Text style={styles.successTitle}>Check In Successful!</Text>
                        <Text style={styles.successSubTitle}>Please take your badge</Text>

                        <View style={styles.badgeCard}>
                            <Text style={styles.badgeLabel}>BADGE NUMBER</Text>
                            <Text style={styles.badgeNumber}>{completedVisitor.badge_number}</Text>
                        </View>

                        <View style={styles.summaryContainer}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Visitor:</Text>
                                <Text style={styles.summaryValue}>{completedVisitor.guest_firstname} {completedVisitor.guest_lastname}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Visiting:</Text>
                                <Text style={styles.summaryValue}>
                                    {completedVisitor.host_name}
                                    {completedVisitor.department ? ` (${completedVisitor.department})` : ''}
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Purpose:</Text>
                                <Text style={styles.summaryValue}>{completedVisitor.visit_purpose}</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                            <Text style={styles.buttonText}>Done</Text>
                            <Ionicons name="checkmark-circle" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
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

    content: { flex: 1, padding: 24, alignItems: 'center' },
    progressBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, width: 300, justifyContent: 'center' },
    progressDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#E5E7EB' },
    activeDot: { backgroundColor: '#4F46E5', transform: [{ scale: 1.2 }] },
    progressLine: { flex: 1, height: 3, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
    activeLine: { backgroundColor: '#4F46E5' },

    formSection: {
        width: '100%',
        maxWidth: 600,
        backgroundColor: '#fff',
        padding: 40,
        borderRadius: 24,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        minHeight: 500, // Ensure consistent height
    },
    sectionTitle: { fontSize: 32, fontWeight: '800', marginBottom: 16, color: '#111827', textAlign: 'center' },
    subTitle: { fontSize: 16, color: '#6B7280', marginBottom: 32, textAlign: 'center' },

    input: {
        backgroundColor: '#F9FAFB',
        padding: 18,
        borderRadius: 12,
        marginBottom: 20,
        fontSize: 18,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        color: '#1F2937'
    },
    label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 8 },

    nextButton: {
        backgroundColor: '#4F46E5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 16,
        marginTop: 20,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    submitButton: {
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 16,
        marginTop: 30,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    buttonText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginRight: 8 },

    dropdown: {
        position: 'absolute',
        top: 85,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        elevation: 100,
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        maxHeight: 250
    },
    dropdownItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    dropdownText: { fontSize: 16, color: '#374151' },

    // Selection Cards
    selectionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 20,
    },
    selectionCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    activeSelection: {
        borderColor: '#4F46E5',
        backgroundColor: '#F5F3FF',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    selectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    selectionDesc: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },

    // Department List
    deptListContainer: {
        flex: 1,
        width: '100%',
    },
    deptCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 20,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    deptIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    deptText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        flex: 1,
    },
    selectedDeptBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#EEF2FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    selectedDeptText: {
        color: '#4F46E5',
        fontWeight: '600',
        fontSize: 14,
    },
    changeDeptText: {
        color: '#4F46E5',
        fontWeight: 'bold',
        fontSize: 14,
    },

    // Success Screen
    successSection: {
        width: '100%',
        maxWidth: 600,
        backgroundColor: '#fff',
        padding: 40,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    successIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    successTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    successSubTitle: {
        fontSize: 18,
        color: '#6B7280',
        marginBottom: 32,
        textAlign: 'center',
    },
    badgeCard: {
        backgroundColor: '#F3F4F6',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        width: '100%',
        marginBottom: 32,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    badgeLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
        letterSpacing: 1,
        marginBottom: 8,
    },
    badgeNumber: {
        fontSize: 48,
        fontWeight: '900',
        color: '#111827',
    },
    summaryContainer: {
        width: '100%',
        marginBottom: 32,
        backgroundColor: '#F9FAFB',
        padding: 20,
        borderRadius: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 12,
    },
    summaryLabel: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
        textAlign: 'right',
        flex: 1,
        marginLeft: 16,
    },
    doneButton: {
        backgroundColor: '#111827',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 16,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4
    },
});

export default KioskCheckInScreen;
