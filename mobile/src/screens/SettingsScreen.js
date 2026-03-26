import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { changePassword, getProfile, updateProfile } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = ({ navigation }) => {
    const { logout, userInfo, userToken } = useContext(AuthContext);

    // Modals
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [helpModalVisible, setHelpModalVisible] = useState(false);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Profile State
    const [profileData, setProfileData] = useState({ fullName: '', email: '', phone: '' });

    useEffect(() => {
        fetchProfile();
    }, [userInfo]);

    const fetchProfile = async () => {
        try {
            const data = await getProfile(userToken);
            setProfileData({
                fullName: data.fullName || userInfo?.username || 'User',
                email: data.email || userInfo?.email || '',
                phone: data.phone || ''
            });
        } catch (error) {
            console.log('Failed to load profile', error);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout },
            ]
        );
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        try {
            await changePassword(userToken, currentPassword, newPassword);
            Alert.alert('Success', 'Password changed successfully');
            setPasswordModalVisible(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            await updateProfile(userToken, profileData);
            Alert.alert('Success', 'Profile updated successfully');
            setProfileModalVisible(false);
            fetchProfile(); // Refresh data
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const MenuOption = ({ icon, title, onPress }) => (
        <TouchableOpacity style={styles.menuOption} onPress={onPress}>
            <View style={styles.menuIconContainer}>
                <Ionicons name={icon} size={24} color="#555" />
            </View>
            <Text style={styles.menuOptionText}>{title}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <ScrollView style={styles.container}>
                <Text style={styles.pageTitle}>Settings</Text>

                {/* User Info Card */}
                <View style={styles.userCard}>
                    <Image source={require('../../assets/vra_logo.jpeg')} style={styles.profileImage} />
                    <View style={styles.userInfoContent}>
                        <Text style={styles.userEmail}>Username: <Text style={styles.emailValue}>{profileData.fullName}</Text></Text>
                        <Text style={styles.userEmail}>Email: <Text style={styles.emailValue}>{profileData.email}</Text></Text>
                        <Text style={styles.userEmail}>Role: <Text style={styles.emailValue}>{userInfo?.role || userInfo?.role_name || 'None'}</Text></Text>
                    </View>
                </View>

                {/* Menu Options */}
                <View style={styles.menuContainer}>
                    <MenuOption
                        icon="person"
                        title="Profile"
                        onPress={() => setProfileModalVisible(true)}
                    />

                    <MenuOption
                        icon="lock-closed"
                        title="Change Password"
                        onPress={() => setPasswordModalVisible(true)}
                    />

                    <MenuOption
                        icon="bar-chart"
                        title="Reports"
                        onPress={() => navigation.navigate('Reports')}
                    />

                    {userInfo?.role?.toLowerCase() === 'admin' && (
                        <MenuOption
                            icon="people"
                            title="User & Role Management"
                            onPress={() => navigation.navigate('UserList')}
                        />
                    )}

                    <MenuOption
                        icon="tablet-landscape-outline"
                        title="Launch Kiosk Mode"
                        onPress={() => {
                            Alert.alert(
                                'Launch Kiosk Mode',
                                'This will switch the app to Kiosk Mode. To exit, you will need to log out.',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Launch', onPress: () => navigation.navigate('KioskHome') }
                                ]
                            );
                        }}
                    />

                    <MenuOption
                        icon="help-circle-outline"
                        title="Help & Support"
                        onPress={() => setHelpModalVisible(true)}
                    />
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>App Version: 1.0.0</Text>

                {/* Change Password Modal */}
                <Modal visible={passwordModalVisible} animationType="slide" transparent={true}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Change Password</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Current Password"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setPasswordModalVisible(false)}>
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleChangePassword}>
                                    <Text style={styles.buttonText}>Submit</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Edit Profile Modal */}
                <Modal visible={profileModalVisible} animationType="slide" transparent={true}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                value={profileData.fullName}
                                onChangeText={(text) => setProfileData({ ...profileData, fullName: text })}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                value={profileData.email}
                                onChangeText={(text) => setProfileData({ ...profileData, email: text })}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Phone"
                                value={profileData.phone}
                                onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
                                keyboardType="phone-pad"
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setProfileModalVisible(false)}>
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleUpdateProfile}>
                                    <Text style={styles.buttonText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Help & Support Modal */}
                <Modal visible={helpModalVisible} animationType="slide" transparent={true}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Help & Support</Text>
                                <TouchableOpacity onPress={() => setHelpModalVisible(false)} style={styles.closeIcon}>
                                    <Ionicons name="close" size={24} color="#374151" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ paddingBottom: 20 }}>
                                <View style={styles.faqItem}>
                                    <Text style={styles.faqQuestion}>How do I reset my password?</Text>
                                    <Text style={styles.faqAnswer}>Go to Settings &gt; Change Password to update your credentials.</Text>
                                </View>

                                <View style={styles.faqItem}>
                                    <Text style={styles.faqQuestion}>How do I add a visitor?</Text>
                                    <Text style={styles.faqAnswer}>Navigate to the Dashboard or Visitor Log and tap "Log Visitor".</Text>
                                </View>

                                <View style={styles.faqItem}>
                                    <Text style={styles.faqQuestion}>Who do I contact for support?</Text>
                                    <Text style={styles.faqAnswer}>Please contact the IT department at support@example.com.</Text>
                                </View>
                            </ScrollView>

                            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => setHelpModalVisible(false)}>
                                <Text style={styles.buttonText}>Got it</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
    pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 20, marginTop: 10 },

    userCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
    },
    userInfoContent: {
        flex: 1,
    },
    userName: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 5 },
    userEmail: { fontSize: 14, color: '#6B7280' },
    emailValue: { color: '#4B5563' },

    menuContainer: { marginBottom: 30 },
    menuOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    menuIconContainer: { marginRight: 15 },
    menuOptionText: { fontSize: 16, color: '#374151', fontWeight: '500' },

    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center text if no icon
        padding: 15,
        // backgroundColor: '#fff', // Or transparent if just text like screenshot
        // For mobile, a button look is often better, but let's match the "Log Out" link style if desired.
        // Screenshot shows "Log Out" as a sidebar item. Here it's a button.
        // Let's keep it simple text or a button.
        marginTop: 10,
    },
    logoutText: { color: '#4B5563', fontSize: 16, fontWeight: '500' }, // Matching sidebar style roughly

    // Modal Styles
    modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', flex: 1 },
    closeIcon: { padding: 5 },

    input: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    button: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#9CA3AF' },
    submitButton: { backgroundColor: '#6366F1' },
    primaryButton: { backgroundColor: '#6366F1', marginTop: 10 },
    buttonText: { color: '#fff', fontWeight: 'bold' },

    versionText: { textAlign: 'center', color: '#9CA3AF', marginTop: 20, marginBottom: 20, fontSize: 12 },

    faqItem: { marginBottom: 15, padding: 10, backgroundColor: '#F9FAFB', borderRadius: 8 },
    faqQuestion: { fontWeight: 'bold', color: '#374151', marginBottom: 5 },
    faqAnswer: { color: '#6B7280' },
});

export default SettingsScreen;
