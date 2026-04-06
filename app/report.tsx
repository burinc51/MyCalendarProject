import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/components/ThemeProvider';
import ScreenHeader from '@/components/ScreenHeader';
import { submitReport, submitReportByEmail } from '@/services/reportService';

type FeatherIcon = React.ComponentProps<typeof Feather>['name'];
interface Category { id: string; icon: FeatherIcon; label: string; }

const CATEGORIES: Category[] = [
    { id: 'bug',      icon: 'alert-circle',    label: 'พบข้อผิดพลาด / Bug' },
    { id: 'slow',     icon: 'zap-off',         label: 'แอปทำงานช้าหรือค้าง' },
    { id: 'auth',     icon: 'lock',            label: 'ปัญหาการเข้าสู่ระบบ / สมัครสมาชิก' },
    { id: 'calendar', icon: 'calendar',        label: 'ปัญหาการใช้งานปฏิทิน' },
    { id: 'group',    icon: 'users',           label: 'ปัญหาการใช้งานกลุ่ม' },
    { id: 'suggest',  icon: 'message-circle',  label: 'เสนอแนะ / ขอฟีเจอร์ใหม่' },
    { id: 'other',    icon: 'more-horizontal', label: 'อื่นๆ' },
];

const LOGIN_CATEGORIES: Category[] = [
    { id: 'login',  icon: 'log-in',   label: 'เข้าสู่ระบบไม่ได้' },
    { id: 'signup', icon: 'user-plus', label: 'สมัครสมาชิกไม่สำเร็จ' },
    { id: 'forgot', icon: 'key',      label: 'รีเซ็ตรหัสผ่านไม่ได้' },
    ...CATEGORIES.filter(c => c.id !== 'auth'),
];

type Step = 'CATEGORY' | 'DETAIL' | 'SUCCESS';

export default function ReportScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const params = useLocalSearchParams<{ mode?: string }>();
    const isLoginMode = params.mode === 'login';

    const [step, setStep] = useState<Step>('CATEGORY');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [detail, setDetail] = useState('');
    const [loading, setLoading] = useState(false);

    const categories = isLoginMode ? LOGIN_CATEGORIES : CATEGORIES;

    // ── สีสันตามธีม ─────────────────────────────────────────────
    const C = {
        bg:          isDark ? '#0a0a0a' : '#f8fafc',
        card:        isDark ? '#18181b' : '#ffffff',
        cardBorder:  isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        text:        isDark ? '#fafafa' : '#18181b',
        subText:     isDark ? '#a1a1aa' : '#71717a',
        accent:      '#2ecc71',
        inputBg:     isDark ? '#27272a' : '#f1f5f9',
        inputBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        selectedBg:  isDark ? 'rgba(46,204,113,0.15)' : 'rgba(46,204,113,0.10)',
    };

    // ── ส่งรายงาน ────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!selectedCategory) return;
        setLoading(true);
        try {
            await submitReport({ category: selectedCategory.label, detail });
            setStep('SUCCESS');
        } catch {
            try {
                await submitReportByEmail({ category: selectedCategory.label, detail });
                setStep('SUCCESS');
            } catch {
                Alert.alert('ข้อผิดพลาด', 'ไม่สามารถส่งรายงานได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 'DETAIL') setStep('CATEGORY');
        else router.back();
    };

    // ── เรนเดอร์หน้าจอ ───────────────────────────────────────────
    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: C.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* ใช้ ScreenHeader มาตรฐาน — จัดการ safe area เองอัตโนมัติ */}
            {step !== 'SUCCESS' && (
                <ScreenHeader
                    title="รายงานปัญหา"
                    showBack
                    onBack={handleBack}
                />
            )}

            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* ── ขั้นตอน 1: เลือกหัวข้อ ── */}
                {step === 'CATEGORY' && (
                    <>
                        <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(46,204,113,0.12)' : 'rgba(46,204,113,0.10)' }]}>
                            <Feather name="flag" size={36} color={C.accent} />
                        </View>
                        <Text style={[styles.title, { color: C.text }]}>เลือกหัวข้อปัญหา</Text>
                        <Text style={[styles.subtitle, { color: C.subText }]}>
                            เลือกหัวข้อที่ตรงกับปัญหาที่คุณพบ
                        </Text>

                        <View style={styles.categoryList}>
                            {categories.map((cat) => {
                                const isSelected = selectedCategory?.id === cat.id;
                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.categoryCard,
                                            {
                                                backgroundColor: isSelected ? C.selectedBg : C.card,
                                                borderColor: isSelected ? C.accent : C.cardBorder,
                                            },
                                        ]}
                                        onPress={() => setSelectedCategory(cat)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.catIconBox, { backgroundColor: isSelected ? C.accent + '25' : isDark ? '#27272a' : '#f1f5f9' }]}>
                                            <Feather name={cat.icon} size={18} color={isSelected ? C.accent : C.subText} />
                                        </View>
                                        <Text style={[styles.categoryLabel, { color: C.text }]}>
                                            {cat.label}
                                        </Text>
                                        {isSelected && (
                                            <Feather name="check-circle" size={18} color={C.accent} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.primaryBtn,
                                { backgroundColor: C.accent, opacity: selectedCategory ? 1 : 0.4 },
                            ]}
                            onPress={() => selectedCategory && setStep('DETAIL')}
                            disabled={!selectedCategory}
                        >
                            <Text style={styles.primaryBtnText}>ถัดไป</Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* ── ขั้นตอน 2: รายละเอียดเพิ่มเติม ── */}
                {step === 'DETAIL' && (
                    <>
                        <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(46,204,113,0.12)' : 'rgba(46,204,113,0.10)' }]}>
                            <Feather name={selectedCategory?.icon ?? 'flag'} size={36} color={C.accent} />
                        </View>
                        <Text style={[styles.title, { color: C.text }]}>{selectedCategory?.label}</Text>
                        <Text style={[styles.subtitle, { color: C.subText }]}>
                            อธิบายรายละเอียดเพิ่มเติมเพื่อช่วยให้ Admin แก้ไขได้ตรงจุด
                        </Text>

                        <View style={[styles.card, { backgroundColor: C.card, borderColor: C.cardBorder }]}>
                            <Text style={[styles.inputLabel, { color: C.subText }]}>
                                รายละเอียด{' '}
                                <Text style={{ fontFamily: 'Kanit-Regular', opacity: 0.6 }}>(ไม่บังคับ)</Text>
                            </Text>
                            <TextInput
                                style={[styles.textarea, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
                                placeholder="เช่น เกิดขึ้นเมื่อกด... หรือหน้าจอที่พบปัญหา..."
                                placeholderTextColor={C.subText}
                                value={detail}
                                onChangeText={setDetail}
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                                editable={!loading}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.primaryBtn, { backgroundColor: C.accent, opacity: loading ? 0.7 : 1 }]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.primaryBtnText}>ส่งรายงาน</Text>
                            }
                        </TouchableOpacity>
                    </>
                )}

                {/* ── ขั้นตอน 3: สำเร็จ ── */}
                {step === 'SUCCESS' && (
                    <View style={styles.successContainer}>
                        <View style={[styles.successIcon, { backgroundColor: 'rgba(46,204,113,0.12)' }]}>
                            <Feather name="check-circle" size={64} color={C.accent} />
                        </View>
                        <Text style={[styles.title, { color: C.text }]}>ส่งรายงานแล้ว!</Text>
                        <Text style={[styles.subtitle, { color: C.subText }]}>
                            เราได้รับรายงานของคุณแล้ว{'\n'}Admin จะตรวจสอบและติดต่อกลับทางอีเมลของคุณ
                        </Text>
                        <TouchableOpacity
                            style={[styles.primaryBtn, { backgroundColor: C.accent }]}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.primaryBtnText}>กลับหน้าหลัก</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: {
        paddingHorizontal: 24,
        paddingBottom: 48,
        paddingTop: 20,
        alignItems: 'center',
    },
    iconBox: {
        width: 80, height: 80, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 20, marginTop: 8,
    },
    title:    { fontFamily: 'Kanit-Bold', fontSize: 24, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontFamily: 'Kanit-Regular', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28 },

    // Category List
    categoryList: { width: '100%', gap: 10, marginBottom: 28 },
    categoryCard: {
        flexDirection: 'row', alignItems: 'center',
        padding: 14, borderRadius: 16, borderWidth: 1.5, gap: 12,
    },
    catIconBox: {
        width: 38, height: 38, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
    categoryLabel: { flex: 1, fontFamily: 'Kanit-Regular', fontSize: 15 },

    // Card + TextArea
    card: { width: '100%', borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 24 },
    inputLabel: { fontFamily: 'Kanit-Bold', fontSize: 13, marginBottom: 10 },
    textarea: {
        fontFamily: 'Kanit-Regular', fontSize: 15,
        borderRadius: 14, borderWidth: 1,
        padding: 14, minHeight: 130,
    },

    // Buttons
    primaryBtn: {
        width: '100%', height: 54, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#2ecc71', shadowOpacity: 0.3,
        shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
    },
    primaryBtnText: { color: '#fff', fontFamily: 'Kanit-Bold', fontSize: 16, letterSpacing: 0.5 },

    // Success
    successContainer: { alignItems: 'center', paddingTop: 80 },
    successIcon: {
        width: 120, height: 120, borderRadius: 40,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 28,
    },
});
