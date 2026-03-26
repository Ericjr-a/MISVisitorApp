import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';

const KioskHomeScreen = ({ navigation }) => {
    const { logout } = useContext(AuthContext);

    const handleExit = () => {
        Alert.alert(
            'Exit Kiosk Mode',
            'Are you sure you want to exit to the login screen?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Exit', style: 'destructive', onPress: logout }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>VisiLog</Text>
                    <Text style={styles.subtitle}>Visitor Kiosk</Text>
                </View>
                <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
                    <Ionicons name="log-out-outline" size={24} color="#6B7280" />
                    <Text style={styles.exitText}>Exit</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.welcomeText}>Welcome to VRA</Text>
                <Text style={styles.instructionText}>Please select an option to continue</Text>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.bigButton, styles.checkInButton]}
                        onPress={() => navigation.navigate('KioskCheckIn')}
                    >
                        <Ionicons name="log-in" size={80} color="#fff" />
                        <Text style={[styles.buttonText, styles.checkInText]}>Check In</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.bigButton, styles.checkOutButton]}
                        onPress={() => navigation.navigate('KioskCheckOut')}
                    >
                        <Ionicons name="log-out-outline" size={80} color="#4F46E5" />
                        <Text style={[styles.buttonText, styles.checkOutText]}>Check Out</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Powered by VisiLog</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
    logoContainer: { flexDirection: 'row', alignItems: 'center' },
    logoText: { fontSize: 28, fontWeight: 'bold', color: '#4F46E5', letterSpacing: 1 },
    subtitle: { fontSize: 16, color: '#6B7280', marginLeft: 10, fontWeight: '500' },
    exitButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.8)' },
    exitText: { marginLeft: 6, color: '#6B7280', fontWeight: '600', fontSize: 16 },

    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    welcomeText: { fontSize: 48, fontWeight: '800', color: '#111827', marginBottom: 16, textAlign: 'center' },
    instructionText: { fontSize: 20, color: '#6B7280', marginBottom: 60, textAlign: 'center', maxWidth: 400 },

    buttonContainer: { flexDirection: 'row', gap: 32, width: '100%', maxWidth: 800, justifyContent: 'center' },
    bigButton: {
        flex: 1,
        aspectRatio: 1.2,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)'
    },
    checkInButton: { backgroundColor: '#4F46E5' },
    checkOutButton: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#4F46E5' },

    buttonText: { fontSize: 28, fontWeight: 'bold', marginTop: 20 },
    checkInText: { color: '#fff' },
    checkOutText: { color: '#4F46E5' },

    footer: { padding: 24, alignItems: 'center' },
    footerText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' }
});

export default KioskHomeScreen;
