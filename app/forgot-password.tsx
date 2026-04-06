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
import {
    forgotPassword,
    verifyForgotPasswordOtp,
    resetPassword,
    resendOtp
} from '@/services/authService';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_W } = Dimensions.get('window');

type Step = 'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS';

export default function ForgotPasswordScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();

    const [step, setStep] = useState<Step>('EMAIL');
    const [loading, setLoading] = useState(false);

    // ข้อมูลฟอร์ม
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // สถานะข้อผิดพลาด
    const [emailError, setEmailError] = useState('');
    const [otpError, setOtpError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

    // ── ฟังก์ชันจัดการเหตุการณ์ ─────────────────────────────────────

    const handleSendEmail = async () => {
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
            setStep('OTP');
        } catch (error: any) {
            const msg = error.response?.data?.message || 'ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่อีกครั้ง';
            Alert.alert('ข้อผิดพลาด', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length < 6) {
            setOtpError('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก');
            return;
        }

        try {
            setLoading(true);
            await verifyForgotPasswordOtp(email.trim(), otp);
            setStep('PASSWORD');
        } catch (error: any) {
            const msg = error.response?.data?.message || 'รหัส OTP ไม่ถูกต้อง';
            setOtpError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            setPasswordError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('รหัสผ่านไม่ตรงกัน');
            return;
        }

        try {
            setLoading(true);
            await resetPassword(email.trim(), otp, newPassword);
            setStep('SUCCESS');
        } catch (error: any) {
            const msg = error.response?.data?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้';
            Alert.alert('ข้อผิดพลาด', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            setLoading(true);
            await resendOtp(email.trim());
            Alert.alert('ส่งรหัสใหม่แล้ว', 'กรุณาตรวจสอบอีเมลของคุณอีกครั้ง');
        } catch (error: any) {
            Alert.alert('ข้อผิดพลาด', 'ไม่สามารถส่งรหัสได้ในขณะนี้');
        } finally {
            setLoading(false);
        }
    };

    // ── สีสันตามธีม ─────────────────────────────────────────────

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

    // ── ตัวช่วยเรนเดอร์ ───────────────────────────────────────────

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={() => {
                    if (step === 'OTP') setStep('EMAIL');
                    else if (step === 'PASSWORD') setStep('OTP');
                    else router.back();
                }}
                style={[styles.backButton, { backgroundColor: C.card, borderColor: C.cardBorder }]}
            >
                <Ionicons name="arrow-back" size={20} color={C.text} />
            </TouchableOpacity>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: C.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                bounces={false}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={[styles.glowCircle, { backgroundColor: C.accentGlow }]} />
                {step !== 'SUCCESS' && renderHeader()}

                <View style={styles.content}>
                    {/* ขั้นตอน: กรอกอีเมล */}
                    {step === 'EMAIL' && (
                        <>
                            <View style={[styles.iconContainer, { backgroundColor: C.accent }]}>
                                <Ionicons name="key-outline" size={40} color="#fff" />
                            </View>
                            <Text style={[styles.title, { color: C.text }]}>ลืมรหัสผ่าน?</Text>
                            <Text style={[styles.subtitle, { color: C.subText }]}>
                                ระบุอีเมลของคุณเพื่อรับรหัส OTP สำหรับตั้งรหัสผ่านใหม่
                            </Text>

                            <View style={[styles.formCard, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: C.subText }]}>อีเมล</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: C.inputBg, borderColor: emailError ? C.error : C.inputBorder, color: C.inputText }]}
                                        placeholder="email@example.com"
                                        placeholderTextColor={C.subText}
                                        value={email}
                                        onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(''); }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        editable={!loading}
                                    />
                                    {!!emailError && <Text style={[styles.errorText, { color: C.error }]}>{emailError}</Text>}
                                </View>
                                <TouchableOpacity
                                    style={[styles.submitButton, { backgroundColor: C.accent, opacity: loading ? 0.7 : 1 }]}
                                    onPress={handleSendEmail}
                                    disabled={loading}
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>ส่งรหัส OTP</Text>}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* ขั้นตอน: ยืนยัน OTP */}
                    {step === 'OTP' && (
                        <>
                            <View style={[styles.iconContainer, { backgroundColor: C.accent }]}>
                                <Ionicons name="shield-checkmark-outline" size={40} color="#fff" />
                            </View>
                            <Text style={[styles.title, { color: C.text }]}>ยืนยันตัวตน</Text>
                            <Text style={[styles.subtitle, { color: C.subText }]}>
                                กรอกรหัส OTP 6 หลักที่ส่งไปยัง {email}
                            </Text>

                            <View style={[styles.formCard, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: C.subText }]}>รหัส OTP</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: C.inputBg, borderColor: otpError ? C.error : C.inputBorder, color: C.inputText, textAlign: 'center', fontSize: 24, letterSpacing: 8 }]}
                                        placeholder="000000"
                                        placeholderTextColor={C.subText}
                                        value={otp}
                                        onChangeText={(v) => { setOtp(v.replace(/[^0-9]/g, '').slice(0, 6)); if (otpError) setOtpError(''); }}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        editable={!loading}
                                    />
                                    {!!otpError && <Text style={[styles.errorText, { color: C.error }]}>{otpError}</Text>}
                                </View>
                                <TouchableOpacity
                                    style={[styles.submitButton, { backgroundColor: C.accent, opacity: loading ? 0.7 : 1 }]}
                                    onPress={handleVerifyOtp}
                                    disabled={loading}
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>ยืนยันรหัส OTP</Text>}
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.resendBtn} onPress={handleResendOtp} disabled={loading}>
                                    <Text style={[styles.resendText, { color: C.subText }]}>
                                        ไม่ได้รับรหัส? <Text style={{ color: C.accent, fontFamily: 'Kanit-Bold' }}>ส่งอีกครั้ง</Text>
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* ขั้นตอน: ตั้งรหัสผ่านใหม่ */}
                    {step === 'PASSWORD' && (
                        <>
                            <View style={[styles.iconContainer, { backgroundColor: C.accent }]}>
                                <Ionicons name="lock-open-outline" size={40} color="#fff" />
                            </View>
                            <Text style={[styles.title, { color: C.text }]}>ตั้งรหัสผ่านใหม่</Text>
                            <Text style={[styles.subtitle, { color: C.subText }]}>
                                กรุณาระบุรหัสผ่านใหม่ที่คุณต้องการใช้งาน
                            </Text>

                            <View style={[styles.formCard, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: C.subText }]}>รหัสผ่านใหม่</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: C.inputBg, borderColor: passwordError ? C.error : C.inputBorder, color: C.inputText }]}
                                        placeholder="อย่างน้อย 6 ตัวอักษร"
                                        placeholderTextColor={C.subText}
                                        value={newPassword}
                                        onChangeText={(v) => { setNewPassword(v); if (passwordError) setPasswordError(''); }}
                                        secureTextEntry
                                        editable={!loading}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: C.subText }]}>ยืนยันรหัสผ่านใหม่</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: C.inputBg, borderColor: passwordError ? C.error : C.inputBorder, color: C.inputText }]}
                                        placeholder="กรอกรหัสผ่านอีกครั้ง"
                                        placeholderTextColor={C.subText}
                                        value={confirmPassword}
                                        onChangeText={(v) => { setConfirmPassword(v); if (passwordError) setPasswordError(''); }}
                                        secureTextEntry
                                        editable={!loading}
                                    />
                                    {!!passwordError && <Text style={[styles.errorText, { color: C.error }]}>{passwordError}</Text>}
                                </View>
                                <TouchableOpacity
                                    style={[styles.submitButton, { backgroundColor: C.accent, opacity: loading ? 0.7 : 1 }]}
                                    onPress={handleResetPassword}
                                    disabled={loading}
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>บันทึกรหัสผ่านใหม่</Text>}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* ขั้นตอน: สำเร็จ */}
                    {step === 'SUCCESS' && (
                        <>
                            <View style={[styles.iconContainer, { backgroundColor: C.accent }]}>
                                <Ionicons name="checkmark-circle-outline" size={50} color="#fff" />
                            </View>
                            <Text style={[styles.title, { color: C.text }]}>เปลี่ยนรหัสผ่านสำเร็จ!</Text>
                            <Text style={[styles.subtitle, { color: C.subText }]}>
                                คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที
                            </Text>

                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: C.accent, marginTop: 24 }]}
                                onPress={() => router.replace('/login')}
                            >
                                <Text style={styles.submitText}>ไปหน้าเข้าสู่ระบบ</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 40 },
    glowCircle: { position: 'absolute', width: SCREEN_W, height: SCREEN_W, borderRadius: SCREEN_W / 2, top: -SCREEN_W * 0.4, right: -SCREEN_W * 0.2 },
    header: { height: Platform.OS === 'ios' ? 100 : 80, justifyContent: 'center', paddingTop: Platform.OS === 'ios' ? 40 : 20 },
    backButton: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
    content: { alignItems: 'center', marginTop: 20 },
    iconContainer: { width: 90, height: 90, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 28, shadowColor: '#2ecc71', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
    title: { fontFamily: 'Kanit-Bold', fontSize: 26, textAlign: 'center', marginBottom: 10 },
    subtitle: { fontFamily: 'Kanit-Regular', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32, paddingHorizontal: 15 },
    formCard: { width: '100%', borderRadius: 24, padding: 24, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
    inputGroup: { marginBottom: 18 },
    label: { fontFamily: 'Kanit-Regular', fontSize: 13, marginBottom: 8, marginLeft: 4 },
    input: { fontFamily: 'Kanit-Regular', fontSize: 15, height: 54, borderRadius: 14, paddingHorizontal: 18, borderWidth: 1 },
    submitButton: { width: '100%', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#2ecc71', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
    submitText: { color: '#fff', fontFamily: 'Kanit-Bold', fontSize: 16, letterSpacing: 0.5 },
    errorText: { fontFamily: 'Kanit-Regular', fontSize: 12, marginTop: 6, marginLeft: 4 },
    resendBtn: { marginTop: 20, alignSelf: 'center' },
    resendText: { fontFamily: 'Kanit-Regular', fontSize: 14 },
});
