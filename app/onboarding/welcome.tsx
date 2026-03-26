import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/components/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';

const { width: W } = Dimensions.get('window');

const FEATURES = [
    { icon: 'calendar-outline' as const, label: 'ปฏิทินร่วม', desc: 'วางแผนตารางพร้อมกันได้ทุกที่' },
    { icon: 'people-outline' as const, label: 'จัดการกลุ่ม', desc: 'เชิญสมาชิกและกำหนดสิทธิ์ได้' },
    { icon: 'notifications-outline' as const, label: 'แจ้งเตือนอัจฉริยะ', desc: 'ไม่พลาดทุกกิจกรรมสำคัญ' },
];

export default function WelcomeScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(24)).current;
    const btnAnim = useRef(new Animated.Value(0)).current;
    const { clearAuth } = useAuthStore();

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
            ]),
            Animated.timing(btnAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        ]).start();
    }, []);

    const C = {
        bg: isDark ? '#0d0d0d' : '#ffffff',
        text: isDark ? '#f5f5f5' : '#0d0d0d',
        muted: isDark ? '#71717a' : '#a1a1aa',
        accent: '#2ecc71',
        rowBg: isDark ? '#161616' : '#f7f7f7',
        iconBg: isDark ? '#1e1e1e' : '#f0f0f0',
        border: isDark ? '#1e1e1e' : '#efefef',
    };

    return (
        <View style={[styles.root, { backgroundColor: C.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Top wordmark */}
            <View style={styles.topBar}>
                <View style={[styles.logoMark, { backgroundColor: C.accent }]}>
                    <Ionicons name="calendar" size={16} color="#fff" />
                </View>
                <Text style={[styles.wordmark, { color: C.text }]}>GR Plan</Text>
            </View>

            {/* Main content */}
            <Animated.View
                style={[styles.body, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            >
                <Text style={[styles.headline, { color: C.text }]}>
                    วางแผนชีวิต{'\n'}ร่วมกันได้ง่ายขึ้น
                </Text>
                <Text style={[styles.sub, { color: C.muted }]}>
                    แอปปฏิทินที่ออกแบบมาสำหรับกลุ่มคนที่คุณรัก
                </Text>

                {/* Feature rows */}
                <View style={[styles.featureBox, { borderColor: C.border }]}>
                    {FEATURES.map((f, i) => (
                        <View
                            key={i}
                            style={[
                                styles.featureRow,
                                i < FEATURES.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border },
                            ]}
                        >
                            <View style={[styles.featureIcon, { backgroundColor: C.iconBg }]}>
                                <Ionicons name={f.icon} size={18} color={C.accent} />
                            </View>
                            <View style={styles.featureMeta}>
                                <Text style={[styles.featureLabel, { color: C.text }]}>{f.label}</Text>
                                <Text style={[styles.featureDesc, { color: C.muted }]}>{f.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </Animated.View>

            {/* CTA */}
            <Animated.View style={[styles.footer, { opacity: btnAnim }]}>
                <TouchableOpacity
                    style={[styles.ctaBtn, { backgroundColor: C.accent }]}
                    onPress={() => router.push('/onboarding/create-group' as any)}
                    activeOpacity={0.85}
                >
                    <Text style={styles.ctaText}>เริ่มต้นใช้งาน</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={async () => {
                        await clearAuth();
                        router.replace('/login' as any);
                    }}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.logoutText, { color: C.muted }]}>ออกจากระบบ</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, paddingHorizontal: 24 },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingTop: 16,
        marginBottom: 48,
    },
    logoMark: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wordmark: {
        fontFamily: 'Kanit-Bold',
        fontSize: 17,
        letterSpacing: 0.2,
    },

    body: { flex: 1, justifyContent: 'center' },

    headline: {
        fontFamily: 'Kanit-Bold',
        fontSize: 36,
        lineHeight: 48,
        letterSpacing: -0.5,
        marginBottom: 12,
    },
    sub: {
        fontFamily: 'Kanit-Regular',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 40,
    },

    featureBox: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    featureIcon: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureMeta: { flex: 1 },
    featureLabel: {
        fontFamily: 'Kanit-Bold',
        fontSize: 14,
        marginBottom: 2,
    },
    featureDesc: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
        lineHeight: 17,
    },

    footer: { paddingBottom: 16 },
    ctaBtn: {
        height: 54,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    ctaText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 16,
        color: '#fff',
        letterSpacing: 0.3,
    },
    logoutBtn: {
        marginTop: 16,
        paddingVertical: 12,
        alignItems: 'center',
    },
    logoutText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});
