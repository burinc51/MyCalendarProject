/**
 * หน้าจอเข้าสู่ระบบ — เวอร์ชัน 2
 * ปรับปรุง: แยก loading state, ตรวจสอบแบบ inline, แสดง/ซ่อนรหัสผ่าน,
 *           ลืมรหัสผ่าน, โลโก้ Google หลายสี, ออกแบบใหม่
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    KeyboardAvoidingView,
    TextInput,
    ScrollView,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeProvider';
import { useAuthStore } from '@/stores/useAuthStore';
import { googleSignIn, emailSignIn } from '@/services/authService';
import { StatusBar } from 'expo-status-bar';

// ──────────────────────────────────────────────────────────────────
// โมดูล Google Sign-In เสริม (ไม่รองรับใน Expo Go)
// ──────────────────────────────────────────────────────────────────
let GoogleSignin: any = null;
try {
    const mod = require('@react-native-google-signin/google-signin');
    GoogleSignin = mod.GoogleSignin;
} catch {
    console.log('ไม่พบโมดูล GoogleSignin (ใช้งานผ่าน Expo Go)');
}

const { width: SCREEN_W } = Dimensions.get('window');

// ──────────────────────────────────────────────────────────────────
// ฟังก์ชันช่วยเหลือ
// ──────────────────────────────────────────────────────────────────
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// ──────────────────────────────────────────────────────────────────
// คอมโพเนนต์หลัก
// ──────────────────────────────────────────────────────────────────
export default function LoginScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const { setAuth } = useAuthStore();

    // แยก loading ของแต่ละปุ่มออกจากกัน
    const [emailLoading, setEmailLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // การตรวจสอบความถูกต้องแบบ inline
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // ── ตั้งค่า Google Sign-In ────────────────────────────────────────
    useEffect(() => {
        if (!GoogleSignin) return;
        try {
            GoogleSignin.configure({
                webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
                offlineAccess: true,
                forceCodeForRefreshToken: true,
            });
        } catch (err) {
            console.warn('GoogleSignin configure error:', err);
        }
    }, []);

    // ── ตรวจสอบความถูกต้อง ────────────────────────────────────────
    const validateForm = (): boolean => {
        let valid = true;

        if (!email.trim()) {
            setEmailError('กรุณากรอกอีเมล');
            valid = false;
        } else if (!isValidEmail(email)) {
            setEmailError('รูปแบบอีเมลไม่ถูกต้อง');
            valid = false;
        } else {
            setEmailError('');
        }

        if (!password) {
            setPasswordError('กรุณากรอกรหัสผ่าน');
            valid = false;
        } else if (password.length < 6) {
            setPasswordError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            valid = false;
        } else {
            setPasswordError('');
        }

        return valid;
    };

    // ── ฟังก์ชันจัดการเหตุการณ์ ───────────────────────────────────────
    const handleEmailSignIn = useCallback(async () => {
        if (!validateForm()) return;

        try {
            setEmailLoading(true);
            const res = await emailSignIn(email.trim(), password);
            console.log("idToken: ", res);
            await setAuth({ id: res.userId, email: res.email, name: res.name, photoUrl: res.pictureUrl, role: res.isAdmin ? 'ADMIN' : 'USER' },
                res.accessToken,
                res.refreshToken
            );
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Email Sign-In error:', error);
            const msg = error.response?.data?.message ?? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
            Alert.alert('เข้าสู่ระบบไม่สำเร็จ', msg);
        } finally {
            setEmailLoading(false);
        }
    }, [email, password]);

    const handleGoogleSignIn = useCallback(async () => {
        if (!GoogleSignin) {
            Alert.alert(
                'ไม่รองรับใน Expo Go',
                'การเข้าสู่ระบบด้วย Google ต้องใช้ Development Build',
            );
            return;
        }

        try {
            setGoogleLoading(true);
            await GoogleSignin.hasPlayServices();
            const result = await GoogleSignin.signIn();

            // Handle version 14+ response format
            let idToken = null;
            if (result.type === 'success') {
                idToken = result.data.idToken;
            } else if (result.type === 'cancelled') {
                return; // ผู้ใช้ยกเลิก
            } else {
                // รองรัปไลบรารีเวอร์ชันเก่า
                idToken = (result as any).idToken;
            }

            if (!idToken) throw new Error('ไม่พบ idToken จาก Google');
            console.log("idToken found:", idToken);
            const res = await googleSignIn(idToken);
            await setAuth(
                { id: res.userId, email: res.email, name: res.name, photoUrl: res.pictureUrl, role: res.isAdmin ? 'ADMIN' : 'USER' },
                res.accessToken,
                res.refreshToken,
            );

            console.log('✅ เข้าสู่ระบบด้วย Google สำเร็จ:', res.email);
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Google Sign-In error:', error);
            const cancelled = error?.code === 'SIGN_IN_CANCELLED' || error?.code === '12501';
            if (!cancelled) {
                Alert.alert('เข้าสู่ระบบไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
            }
        } finally {
            setGoogleLoading(false);
        }
    }, []);

    const anyLoading = emailLoading || googleLoading;

    // ── สีใช้งาน ────────────────────────────────────────────────
    const C = {
        bg: isDark ? '#0a0a0a' : '#f8fafc',
        card: isDark ? '#18181b' : '#ffffff',
        cardBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        text: isDark ? '#fafafa' : '#18181b',
        subText: isDark ? '#a1a1aa' : '#71717a',
        accent: '#2ecc71',
        accentGlow: isDark ? 'rgba(46,204,113,0.15)' : 'rgba(46,204,113,0.10)',
        googleBg: isDark ? '#1f1f23' : '#ffffff',
        googleBorder: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)',
        googleText: isDark ? '#e4e4e7' : '#3c4043',
        divider: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        inputBg: isDark ? '#27272a' : '#f1f5f9',
        inputBorder: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
        inputText: isDark ? '#fafafa' : '#18181b',
        error: '#ef4444',
    } as const;

    // ── เรนเดอร์หน้าจอ ─────────────────────────────────────────────
    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: C.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                bounces={false}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── ส่วนเด็กอรเติฟด้านบน ── */}
                <View style={styles.topSection}>
                    <View style={[styles.glowCircle, { backgroundColor: C.accentGlow }]} />
                    <View style={[styles.glowCircle2, { backgroundColor: isDark ? 'rgba(220,255,238,0.06)' : 'rgba(99,102,241,0.06)' }]} />

                    <View style={[styles.iconContainer, { backgroundColor: C.accent }]}>
                        <Ionicons name="calendar-outline" size={36} color="#fff" />
                    </View>

                    <Text style={[styles.appName, { color: C.text }]}>GRPlan</Text>
                    <Text style={[styles.tagline, { color: C.subText }]}>
                        วางแผน • บันทึก • จัดการ
                    </Text>
                </View>

                {/* ── ส่วนการ์ดด้านล่าง ── */}
                <View style={[styles.bottomSection, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
                    <Text style={[styles.welcomeTitle, { color: C.text }]}>ยินดีต้อนรับ</Text>
                    <Text style={[styles.welcomeSub, { color: C.subText }]}>เข้าสู่ระบบเพื่อเริ่มใช้งาน</Text>

                    {/* ช่องกรอกอีเมล */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: C.subText }]}>อีเมล</Text>
                        <TextInput
                            style={[
                                styles.input,
                                { backgroundColor: C.inputBg, borderColor: emailError ? C.error : C.inputBorder, color: C.inputText },
                            ]}
                            placeholder="email@example.com"
                            placeholderTextColor={C.subText}
                            value={email}
                            onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(''); }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!anyLoading}
                            returnKeyType="next"
                        />
                        {!!emailError && (
                            <Text style={[styles.errorText, { color: C.error }]}>{emailError}</Text>
                        )}
                    </View>

                    {/* ช่องกรอกรหัสผ่าน */}
                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Text style={[styles.label, { color: C.subText }]}>รหัสผ่าน</Text>
                            <TouchableOpacity
                                onPress={() => router.push("/forgot-password")}
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                                <Text style={[styles.forgotText, { color: C.accent }]}>ลืมรหัสผ่าน?</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.passwordWrap}>
                            <TextInput
                                style={[
                                    styles.input,
                                    styles.passwordInput,
                                    { backgroundColor: C.inputBg, borderColor: passwordError ? C.error : C.inputBorder, color: C.inputText },
                                ]}
                                placeholder="รหัสผ่านของคุณ"
                                placeholderTextColor={C.subText}
                                value={password}
                                onChangeText={(v) => { setPassword(v); if (passwordError) setPasswordError(''); }}
                                secureTextEntry={!showPassword}
                                editable={!anyLoading}
                                returnKeyType="done"
                                onSubmitEditing={handleEmailSignIn}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowPassword((p) => !p)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={C.subText}
                                />
                            </TouchableOpacity>
                        </View>
                        {!!passwordError && (
                            <Text style={[styles.errorText, { color: C.error }]}>{passwordError}</Text>
                        )}
                    </View>

                    {/* ปุ่มเข้าสู่ระบบด้วยอีเมล */}
                    <TouchableOpacity
                        style={[styles.loginButton, { backgroundColor: C.accent, opacity: anyLoading ? 0.7 : 1 }]}
                        onPress={handleEmailSignIn}
                        disabled={anyLoading}
                        activeOpacity={0.8}
                    >
                        {emailLoading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.loginButtonText}>เข้าสู่ระบบ</Text>
                        }
                    </TouchableOpacity>

                    {/* เส้นคั่น หรือ */}
                    <View style={styles.orDividerWrap}>
                        <View style={[styles.orDividerLine, { backgroundColor: C.divider }]} />
                        <Text style={[styles.orDividerText, { color: C.subText }]}>หรือ</Text>
                        <View style={[styles.orDividerLine, { backgroundColor: C.divider }]} />
                    </View>

                    {/* ปุ่มเข้าสู่ระบบด้วย Google */}
                    <TouchableOpacity
                        style={[
                            styles.googleButton,
                            { backgroundColor: C.googleBg, borderColor: C.googleBorder, opacity: anyLoading ? 0.7 : 1 },
                        ]}
                        onPress={handleGoogleSignIn}
                        disabled={anyLoading}
                        activeOpacity={0.7}
                    >
                        {googleLoading ? (
                            <ActivityIndicator size="small" color={C.accent} />
                        ) : (
                            <>
                                <Image
                                    source={{ uri: 'https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_128dp.png' }}
                                    style={styles.googleIcon}
                                    resizeMode="contain"
                                />
                                <Text style={[styles.googleButtonText, { color: C.googleText }]}>
                                    เข้าสู่ระบบด้วย Google
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* หมายเหตุสำหรับ Expo Go */}
                    {!GoogleSignin && (
                        <View style={styles.devNote}>
                            <Ionicons name="information-circle-outline" size={14} color={C.subText} />
                            <Text style={[styles.devNoteText, { color: C.subText }]}>
                                การเข้าสู่ระบบด้วย Google ใช้ได้เฉพาะ Development Build
                            </Text>
                        </View>
                    )}

                    <View style={[styles.divider, { backgroundColor: C.divider }]} />

                    {/* ส่วนท้าย */}
                    <View style={styles.footerRow}>
                        <Text style={[styles.footerText, { color: C.subText }]}>ยังไม่มีบัญชี?</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/signup')}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        >
                            <Text style={[styles.footerText, { color: C.accent, fontFamily: 'Kanit-Bold' }]}>
                                {' '}สมัครสมาชิก
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={{ marginTop: 32, alignSelf: 'center', opacity: 0.7 }}
                        onPress={() => router.push({ pathname: '/report', params: { mode: 'login' } })}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={{ fontFamily: 'Kanit-Regular', fontSize: 13, color: C.subText, textDecorationLine: 'underline' }}>
                            พบปัญหาการใช้งาน? รายงานปัญหาที่นี่
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// ──────────────────────────────────────────────────────────────────
// สไตล์ชีต
// ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },

    // ส่วนบน
    topSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 220,
    },
    glowCircle: {
        position: 'absolute',
        width: SCREEN_W * 0.8,
        height: SCREEN_W * 0.8,
        borderRadius: SCREEN_W * 0.4,
        top: -SCREEN_W * 0.15,
        right: -SCREEN_W * 0.2,
    },
    glowCircle2: {
        position: 'absolute',
        width: SCREEN_W * 0.6,
        height: SCREEN_W * 0.6,
        borderRadius: SCREEN_W * 0.3,
        bottom: -SCREEN_W * 0.1,
        left: -SCREEN_W * 0.15,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#2ecc71',
        shadowOpacity: 0.35,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12,
    },
    appName: {
        fontFamily: 'Kanit-Bold',
        fontSize: 36,
        letterSpacing: 1,
        marginBottom: 6,
    },
    tagline: {
        fontFamily: 'Kanit-Regular',
        fontSize: 15,
        letterSpacing: 2,
    },

    // การ์ดส่วนล่าง
    bottomSection: {
        paddingHorizontal: 28,
        paddingTop: 32,
        paddingBottom: Platform.OS === 'ios' ? 50 : 36,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderWidth: 1,
        borderBottomWidth: 0,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: -4 },
        elevation: 16,
    },
    welcomeTitle: {
        fontFamily: 'Kanit-Bold',
        fontSize: 22,
        marginBottom: 4,
    },
    welcomeSub: {
        fontFamily: 'Kanit-Regular',
        fontSize: 14,
        marginBottom: 20,
    },

    // ช่องกรอกข้อมูล
    inputGroup: { marginBottom: 16 },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    label: {
        fontFamily: 'Kanit-Regular',
        fontSize: 13,
        marginLeft: 4,
    },
    forgotText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
    },
    input: {
        fontFamily: 'Kanit-Regular',
        fontSize: 15,
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 16,
        borderWidth: 1,
    },
    passwordWrap: { position: 'relative' },
    passwordInput: { paddingRight: 48 },
    eyeButton: {
        position: 'absolute',
        right: 14,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    },
    errorText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 11,
        marginTop: 5,
        marginLeft: 4,
    },

    // ปุ่มต่างๆ
    loginButton: {
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#2ecc71',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    loginButtonText: {
        color: '#fff',
        fontFamily: 'Kanit-Bold',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 14,
        borderWidth: 1.5,
        gap: 12,
        minHeight: 52,
    },
    googleButtonText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 16,
        letterSpacing: 0.3,
    },
    googleIcon: {
        width: 22,
        height: 22,
    },

    // เส้นคั่น หรือ
    orDividerWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 18,
        gap: 12,
    },
    orDividerLine: { flex: 1, height: 1 },
    orDividerText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 13,
    },

    // หมายเหตุสำหรับ Expo Go
    devNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 14,
    },
    devNoteText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
    },

    // เส้นคั่นแบ่งและส่วนท้าย
    divider: { height: 1, marginVertical: 22 },
    footerRow: { flexDirection: 'row', justifyContent: 'center' },
    footerText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
        lineHeight: 18,
    },
    reportLink: { alignItems: 'center', marginTop: 12 },
});