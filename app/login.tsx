/**
 * Login Screen
 * หน้า Login แบบเต็มจอ — Google Sign-In เป็นวิธีหลัก
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeProvider';
import { useAuthStore } from '@/stores/useAuthStore';
import { googleSignIn } from '@/services/authService';
import { StatusBar } from 'expo-status-bar';

let GoogleSignin: any = null;
try {
    const googleSigninModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSigninModule.GoogleSignin;
} catch (e) {
    console.log('GoogleSignin module not available (likely running in Expo Go)');
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function LoginScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const { setAuth, setGuest } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [isGoogleConfigured, setIsGoogleConfigured] = useState(false);

    const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;

    // Configure Google Sign-In
    useEffect(() => {
        if (GoogleSignin) {
            try {
                GoogleSignin.configure({
                    webClientId,
                    offlineAccess: true,
                    forceCodeForRefreshToken: true,
                });
                setIsGoogleConfigured(true);
            } catch (err) {
                console.log('GoogleSignin configure error:', err);
            }
        }
    }, []);

    const handleGoogleSignIn = async () => {
        if (!GoogleSignin) {
            Alert.alert(
                'Not Supported',
                'Google Sign-In requires a Development Build. It is not supported in Expo Go.',
            );
            return;
        }

        try {
            setLoading(true);
            await GoogleSignin.hasPlayServices();
            await GoogleSignin.signIn();

            // Get the idToken
            const tokens = await GoogleSignin.getTokens();
            const idToken = tokens.idToken;

            if (!idToken) {
                throw new Error('Failed to get idToken from Google');
            }

            // Send to backend
            const authResponse = await googleSignIn(idToken);

            // Store auth data
            await setAuth(
                {
                    id: authResponse.userId,
                    email: authResponse.email,
                    name: authResponse.name,
                    photoUrl: authResponse.pictureUrl,
                },
                authResponse.accessToken,
                authResponse.refreshToken,
            );

            console.log('✅ Google Sign-In success:', {
                userId: authResponse.userId,
                email: authResponse.email,
                name: authResponse.name,
                hasAccessToken: !!authResponse.accessToken,
                hasRefreshToken: !!authResponse.refreshToken,
            });

            // Navigate to main app
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Google Sign-In error:', error);
            // Don't show alert if user cancelled
            if (error?.code !== 'SIGN_IN_CANCELLED' && error?.code !== '12501') {
                Alert.alert('เข้าสู่ระบบไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        console.log('👤 Guest Login: entering guest mode');
        await setGuest();
        console.log('✅ Guest Login success: redirecting to home');
        router.replace('/(tabs)');
    };

    // --- Colors ---
    const C = {
        bg: isDark ? '#0a0a0a' : '#f8fafc',
        card: isDark ? '#18181b' : '#ffffff',
        cardBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        text: isDark ? '#fafafa' : '#18181b',
        subText: isDark ? '#a1a1aa' : '#71717a',
        accent: '#2ecc71',
        accentGlow: isDark ? 'rgba(46,204,113,0.15)' : 'rgba(46,204,113,0.1)',
        googleBg: isDark ? '#1f1f23' : '#ffffff',
        googleBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
        googleText: isDark ? '#e4e4e7' : '#3c4043',
        divider: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    };

    return (
        <View style={[styles.container, { backgroundColor: C.bg }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Top decorative area */}
            <View style={styles.topSection}>
                {/* Accent glow circle */}
                <View style={[styles.glowCircle, { backgroundColor: C.accentGlow }]} />
                <View style={[styles.glowCircle2, { backgroundColor: isDark ? 'rgba(220, 255, 238, 0.08)' : 'rgba(99,102,241,0.06)' }]} />

                {/* App Icon */}
                <View style={[styles.iconContainer, { backgroundColor: C.accent }]}>
                    <Ionicons name="calendar-outline" size={36} color="#fff" />
                </View>

                {/* App Name & Tagline */}
                <Text style={[styles.appName, { color: C.text }]}>GRPlan</Text>
                <Text style={[styles.tagline, { color: C.subText }]}>
                    วางแผน • บันทึก • จัดการ
                </Text>
            </View>

            {/* Bottom card section */}
            <View style={[styles.bottomSection, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
                <Text style={[styles.welcomeTitle, { color: C.text }]}>
                    ยินดีต้อนรับ
                </Text>
                <Text style={[styles.welcomeSub, { color: C.subText }]}>
                    เข้าสู่ระบบเพื่อเริ่มใช้งาน
                </Text>

                {/* Google Sign-In Button */}
                <TouchableOpacity
                    style={[styles.googleButton, { backgroundColor: C.googleBg, borderColor: C.googleBorder }]}
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                    activeOpacity={0.7}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={C.accent} />
                    ) : (
                        <>
                            {/* Google "G" Logo */}
                            <View style={styles.googleLogoWrap}>
                                <Text style={styles.googleG}>G</Text>
                            </View>
                            <Text style={[styles.googleButtonText, { color: C.googleText }]}>
                                เข้าสู่ระบบด้วย Google
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* OR Divider */}
                <View style={styles.orDividerWrap}>
                    <View style={[styles.orDividerLine, { backgroundColor: C.divider }]} />
                    <Text style={[styles.orDividerText, { color: C.subText }]}>หรือ</Text>
                    <View style={[styles.orDividerLine, { backgroundColor: C.divider }]} />
                </View>

                {/* Guest Button */}
                <TouchableOpacity
                    style={[styles.guestButton, { borderColor: C.googleBorder }]}
                    onPress={handleGuestLogin}
                    activeOpacity={0.7}
                >
                    <Ionicons name="person-outline" size={20} color={C.subText} />
                    <Text style={[styles.guestButtonText, { color: C.subText }]}>
                        ใช้งานแบบไม่ล็อกอิน
                    </Text>
                </TouchableOpacity>
                <Text style={[styles.guestHint, { color: isDark ? '#52525b' : '#a1a1aa' }]}>
                    บางฟีเจอร์อาจไม่สามารถใช้งานได้
                </Text>

                {!isGoogleConfigured && !GoogleSignin && (
                    <View style={styles.devNote}>
                        <Ionicons name="information-circle-outline" size={14} color={C.subText} />
                        <Text style={[styles.devNoteText, { color: C.subText }]}>
                            Google Sign-In ใช้ได้เฉพาะ Development Build
                        </Text>
                    </View>
                )}

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: C.divider }]} />

                {/* Footer */}
                <Text style={[styles.footerText, { color: C.subText }]}>
                    เมื่อเข้าสู่ระบบ คุณยอมรับเงื่อนไขการใช้งาน
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // --- Top section ---
    topSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        position: 'relative',
        overflow: 'hidden',
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

    // --- Bottom section ---
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
        marginBottom: 28,
    },

    // --- Google Button ---
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
    googleLogoWrap: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#4285F4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    googleG: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    googleButtonText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 16,
        letterSpacing: 0.3,
    },

    // --- Dev note ---
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

    // --- Divider & Footer ---
    divider: {
        height: 1,
        marginVertical: 22,
    },
    footerText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },

    // --- OR Divider ---
    orDividerWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 18,
        gap: 12,
    },
    orDividerLine: {
        flex: 1,
        height: 1,
    },
    orDividerText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 13,
    },

    // --- Guest Button ---
    guestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        paddingHorizontal: 20,
        borderRadius: 14,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        gap: 10,
        minHeight: 50,
    },
    guestButtonText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 15,
        letterSpacing: 0.3,
    },
    guestHint: {
        fontFamily: 'Kanit-Regular',
        fontSize: 11,
        textAlign: 'center',
        marginTop: 8,
    },
});
