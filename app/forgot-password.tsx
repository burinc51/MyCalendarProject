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
import { forgotPassword } from '@/services/authService';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_W } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [emailError, setEmailError] = useState('');

    const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

    const handleResetPassword = async () => {
        if (!email.trim()) {
            setEmailError('กรุณากรอกอีเมล');
            return;
        }
        if (!isValidEmail(email)) {
            setEmailError('รูปแบบอีเมลไม่ถูกต้อง');
            return;
        }

        try {
            setLoading(true);
            await forgotPassword(email.trim());
            setIsSubmitted(true);
        } catch (error: any) {
            console.error('Forgot Password error:', error);
            const msg = error.response?.data?.message || 'ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่อีกครั้ง';
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
        accentGlow: isDark ? 'rgba(46,204,113,0.15)' : 'rgba(46,204,113,0.10)',
        inputBg: isDark ? '#27272a' : '#f1f5f9',
        inputBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        inputText: isDark ? '#fafafa' : '#18181b',
        error: '#ef4444',
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: C.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                bounces={false}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Decorative background circles */}
                <View style={[styles.glowCircle, { backgroundColor: C.accentGlow }]} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.backButton, { backgroundColor: C.card, borderColor: C.cardBorder }]}
                    >
                        <Ionicons name="arrow-back" size={20} color={C.text} />
                    </TouchableOpacity>
                </View>

                {!isSubmitted ? (
                    <View style={styles.content}>
                        {/* Icon */}
                        <View style={[styles.iconContainer, { backgroundColor: C.accent }]}>
                            <Ionicons name="key-outline" size={40} color="#fff" />
                        </View>

                        {/* Text */}
                        <Text style={[styles.title, { color: C.text }]}>ลืมรหัสผ่าน?</Text>
                        <Text style={[styles.subtitle, { color: C.subText }]}>
                            ระบุอีเมลของคุณเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
                        </Text>

                        {/* Form Card */}
                        <View style={[styles.formCard, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: C.subText }]}>อีเมลของคุณ</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: C.inputBg,
                                            borderColor: emailError ? C.error : C.inputBorder,
                                            color: C.inputText
                                        }
                                    ]}
                                    placeholder="email@example.com"
                                    placeholderTextColor={C.subText}
                                    value={email}
                                    onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(''); }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!loading}
                                />
                                {!!emailError && (
                                    <Text style={[styles.errorText, { color: C.error }]}>{emailError}</Text>
                                )}
                            </View>

                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: C.accent, opacity: loading ? 0.7 : 1 }]}
                                onPress={handleResetPassword}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitText}>ส่งลิงก์รีเซ็ตรหัสผ่าน</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.content}>
                        {/* Success Icon */}
                        <View style={[styles.iconContainer, { backgroundColor: C.accent }]}>
                            <Ionicons name="mail-open-outline" size={40} color="#fff" />
                        </View>

                        <Text style={[styles.title, { color: C.text }]}>ส่งลิงก์สำเร็จ!</Text>
                        <Text style={[styles.subtitle, { color: C.subText }]}>
                            เราได้ส่งลิงก์สำหรับเปลี่ยนรหัสผ่านไปยัง {email} แล้ว กรุณาตรวจสอบอีเมลของคุณ
                        </Text>

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: C.accent, marginTop: 24 }]}
                            onPress={() => router.replace('/login')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.submitText}>กลับสู่หน้าการเข้าสู่ระบบ</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.resendButton}
                            onPress={() => setIsSubmitted(false)}
                        >
                            <Text style={[styles.resendText, { color: C.subText }]}>
                                ไม่ได้รับอีเมล? <Text style={{ color: C.accent, fontFamily: 'Kanit-Bold' }}>ลองอีกครั้ง</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
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
        paddingHorizontal: 28,
        paddingBottom: 40,
    },
    glowCircle: {
        position: 'absolute',
        width: SCREEN_W,
        height: SCREEN_W,
        borderRadius: SCREEN_W / 2,
        top: -SCREEN_W * 0.4,
        right: -SCREEN_W * 0.2,
    },
    header: {
        height: Platform.OS === 'ios' ? 100 : 80,
        justifyContent: 'center',
        paddingTop: Platform.OS === 'ios' ? 40 : 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    iconContainer: {
        width: 90,
        height: 90,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 28,
        shadowColor: '#2ecc71',
        shadowOpacity: 0.3,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
    },
    title: {
        fontFamily: 'Kanit-Bold',
        fontSize: 28,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontFamily: 'Kanit-Regular',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
        paddingHorizontal: 10,
    },
    formCard: {
        width: '100%',
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
        height: 54,
        borderRadius: 14,
        paddingHorizontal: 18,
        borderWidth: 1,
    },
    submitButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2ecc71',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    submitText: {
        color: '#fff',
        fontFamily: 'Kanit-Bold',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    errorText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
        color: '#ef4444',
        marginTop: 6,
        marginLeft: 4,
    },
    resendButton: {
        marginTop: 32,
        padding: 10,
    },
    resendText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 14,
    },
});
