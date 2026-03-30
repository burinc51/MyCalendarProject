import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    TextInput,
    KeyboardAvoidingView,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeProvider';
import { useAuthStore } from '@/stores/useAuthStore';
import { emailSignUp } from '@/services/authService';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_W } = Dimensions.get('window');

export default function SignUpScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const { setAuth } = useAuthStore();
    
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!name.trim() || !username.trim() || !email.trim() || !password || !confirmPassword) {
            Alert.alert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('รหัสผ่านไม่ตรงกัน', 'กรุณายืนยันรหัสผ่านให้ถูกต้อง');
            return;
        }

        try {
            setLoading(true);
            const authResponse = await emailSignUp(email, password, name, username);
            
            const isAdmin = authResponse.role === 'ADMIN' || authResponse.roles?.some((r: any) => r.name === 'ADMIN' || r === 'ADMIN') ? 'ADMIN' : 'USER';
            
            await setAuth(
                {
                    id: authResponse.userId,
                    email: authResponse.email,
                    name: authResponse.name,
                    photoUrl: authResponse.pictureUrl,
                    role: isAdmin,
                },
                authResponse.accessToken,
                authResponse.refreshToken,
            );

            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Sign Up error:', error);
            const msg = error.response?.data?.message || 'ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง';
            Alert.alert('ข้อผิดพลาด', msg);
        } finally {
            setLoading(false);
        }
    };

    const C = {
        bg: isDark ? '#0a0a0a' : '#f8fafc',
        card: isDark ? '#18181b' : '#ffffff',
        cardBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        text: isDark ? '#fafafa' : '#18181b',
        subText: isDark ? '#a1a1aa' : '#71717a',
        accent: '#2ecc71',
        inputBg: isDark ? '#27272a' : '#f1f5f9',
        inputBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        inputText: isDark ? '#fafafa' : '#18181b',
    };

    return (
        <KeyboardAvoidingView 
            style={[styles.container, { backgroundColor: C.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Header Section */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={C.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: C.text }]}>สร้างบัญชีผู้ใช้</Text>
                    <Text style={[styles.subtitle, { color: C.subText }]}>สมัครสมาชิกเพื่อเริ่มต้นวางแผน</Text>
                </View>

                {/* Form Section */}
                <View style={[styles.formCard, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
                    
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: C.subText }]}>ชื่อ - นามสกุล</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.inputText }]}
                            placeholder="พิมพ์ชื่อจริงของคุณ"
                            placeholderTextColor={C.subText}
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: C.subText }]}>ชื่อผู้ใช้ (Username)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.inputText }]}
                            placeholder="พิมพ์ชื่อผู้ใช้ของคุณ"
                            placeholderTextColor={C.subText}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: C.subText }]}>อีเมล</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.inputText }]}
                            placeholder="email@example.com"
                            placeholderTextColor={C.subText}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: C.subText }]}>รหัสผ่าน</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.inputText }]}
                            placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                            placeholderTextColor={C.subText}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: C.subText }]}>ยืนยันรหัสผ่าน</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.inputText }]}
                            placeholder="กรอกรหัสผ่านอีกครั้ง"
                            placeholderTextColor={C.subText}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: C.accent }]}
                        onPress={handleSignUp}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitText}>ลงทะเบียน</Text>
                        )}
                    </TouchableOpacity>

                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: C.subText }]}>
                        มีบัญชีอยู่แล้ว? 
                    </Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={[styles.footerLink, { color: C.accent }]}> เข้าสู่ระบบ</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 40,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 32,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    title: {
        fontFamily: 'Kanit-Bold',
        fontSize: 28,
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: 'Kanit-Regular',
        fontSize: 15,
    },
    formCard: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontFamily: 'Kanit-Regular',
        fontSize: 13,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        fontFamily: 'Kanit-Regular',
        fontSize: 15,
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 16,
        borderWidth: 1,
    },
    submitButton: {
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#2ecc71',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    submitText: {
        color: '#fff',
        fontFamily: 'Kanit-Bold',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    footerText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 14,
    },
    footerLink: {
        fontFamily: 'Kanit-Bold',
        fontSize: 14,
    },
});
