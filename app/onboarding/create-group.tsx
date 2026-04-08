/**
 * Onboarding Create Group Screen — Thai UI Redesign
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/components/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGroupStore } from '@/stores/useGroupStore';
import { useAuthStore } from '@/stores/useAuthStore';

const { width: W } = Dimensions.get('window');

const PRESETS = [
    { label: 'ครอบครัว', icon: 'home'   as const, color: '#3b82f6' },
    { label: 'คนรัก',    icon: 'heart'  as const, color: '#ef4444' },
    { label: 'เพื่อน',  icon: 'users'  as const, color: '#f59e0b' },
    { label: 'อื่นๆ',   icon: 'grid'   as const, color: '#8b5cf6' },
];

const ACCENT_COLORS = ['#2ecc71', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function OnboardingCreateGroupScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router  = useRouter();
    const insets  = useSafeAreaInsets();
    const { createGroup, isLoading } = useGroupStore();
    const { user } = useAuthStore();

    const scrollRef      = useRef<ScrollView>(null);
    const inputRef       = useRef<TextInput>(null);
    const customSectionY = useRef(0);

    const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
    const [customName, setCustomName]         = useState('');
    const [selectedColor, setSelectedColor]   = useState(ACCENT_COLORS[0]);

    const isCustom  = selectedPreset === 3;
    const groupName = isCustom
        ? customName.trim()
        : selectedPreset !== null ? PRESETS[selectedPreset].label : '';
    const activeColor = selectedPreset !== null && !isCustom ? PRESETS[selectedPreset].color : selectedColor;

    const C = {
        bg:          isDark ? '#0d0d0d' : '#f8f8f8',
        text:        isDark ? '#f0f0f0' : '#111111',
        muted:       isDark ? '#6b6b6b' : '#9ca3af',
        card:        isDark ? '#1a1a1a' : '#ffffff',
        border:      isDark ? '#242424' : '#ebebeb',
        inputBg:     isDark ? '#1a1a1a' : '#ffffff',
        inputBorder: isDark ? '#2e2e2e' : '#e2e2e2',
        inputText:   isDark ? '#f0f0f0' : '#111111',
        accent:      '#2ecc71',
        placeholder: isDark ? '#4a4a4a' : '#c4c4c4',
    };

    const handleCreate = async () => {
        if (!groupName) {
            Alert.alert('แจ้งเตือน', 'กรุณาเลือกหรือกรอกชื่อกลุ่ม');
            return;
        }
        if (!user?.id) {
            Alert.alert('เกิดข้อผิดพลาด', 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
            return;
        }
        const icon  = selectedPreset !== null ? PRESETS[selectedPreset].icon : 'star';
        const color = activeColor;
        const bg    = color + '20';
        const description = selectedPreset !== null && !isCustom
            ? `กลุ่ม${PRESETS[selectedPreset].label}` : undefined;
        try {
            await createGroup({ groupName, icon, color, bg, description }, user.id);
            router.replace('/(tabs)');
        } catch (err: any) {
            Alert.alert('ไม่สามารถสร้างกลุ่มได้', err?.message || 'กรุณาลองใหม่อีกครั้ง');
        }
    };

    return (
        <View style={[styles.root, { backgroundColor: C.bg }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
            >
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={[
                        styles.scroll,
                        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Back */}
                    <TouchableOpacity
                        style={[styles.backBtn, { backgroundColor: C.card, borderColor: C.border }]}
                        onPress={() => router.back()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="arrow-back" size={18} color={C.text} />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.headline, { color: C.text }]}>สร้างกลุ่ม</Text>
                        <Text style={[styles.sub, { color: C.muted }]}>
                            เลือกประเภทกลุ่มที่ต้องการเริ่มใช้งาน
                        </Text>
                    </View>

                    {/* Section label */}
                    <Text style={[styles.sectionLabel, { color: C.muted }]}>ประเภทกลุ่ม</Text>

                    {/* Preset grid */}
                    <View style={styles.grid}>
                        {PRESETS.map((p, i) => {
                            const active = selectedPreset === i;
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[
                                        styles.presetCard,
                                        {
                                            backgroundColor: active ? `${p.color}10` : C.card,
                                            borderColor: active ? p.color : C.border,
                                        },
                                    ]}
                                    onPress={() => {
                                        setSelectedPreset(i);
                                        if (i !== 3) {
                                            setCustomName('');
                                        } else {
                                            setTimeout(() => {
                                                scrollRef.current?.scrollTo({ y: customSectionY.current, animated: true });
                                                inputRef.current?.focus();
                                            }, 100);
                                        }
                                    }}
                                    activeOpacity={0.72}
                                >
                                    <View style={[styles.presetIconBox, { backgroundColor: active ? `${p.color}20` : C.border }]}>
                                        <Feather name={p.icon as any} size={20} color={active ? p.color : C.muted} />
                                    </View>
                                    <Text style={[styles.presetLabel, { color: active ? p.color : C.text }]}>
                                        {p.label}
                                    </Text>
                                    {active && (
                                        <View style={[styles.checkBadge, { backgroundColor: p.color }]}>
                                            <Ionicons name="checkmark" size={10} color="#fff" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Custom input */}
                    {isCustom && (
                        <View
                            style={styles.customSection}
                            onLayout={(e) => { customSectionY.current = e.nativeEvent.layout.y; }}
                        >
                            <Text style={[styles.sectionLabel, { color: C.muted }]}>ชื่อกลุ่ม</Text>
                            <TextInput
                                ref={inputRef}
                                style={[styles.input, {
                                    backgroundColor: C.inputBg,
                                    borderColor: C.inputBorder,
                                    color: C.inputText,
                                }]}
                                placeholder="เช่น ทีมทำงาน, สมาคมวิ่ง..."
                                placeholderTextColor={C.placeholder}
                                value={customName}
                                onChangeText={setCustomName}
                                returnKeyType="done"
                                onSubmitEditing={() => inputRef.current?.blur()}
                            />

                            <Text style={[styles.sectionLabel, { color: C.muted, marginTop: 20 }]}>เลือกสี</Text>
                            <View style={styles.colorRow}>
                                {ACCENT_COLORS.map((col) => (
                                    <TouchableOpacity
                                        key={col}
                                        style={[
                                            styles.colorDot,
                                            { backgroundColor: col },
                                            selectedColor === col && { borderWidth: 2.5, borderColor: '#fff', elevation: 4 },
                                        ]}
                                        onPress={() => setSelectedColor(col)}
                                    >
                                        {selectedColor === col && (
                                            <Ionicons name="checkmark" size={12} color="#fff" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Preview */}
                    {groupName.length > 0 && (
                        <View style={[styles.preview, { backgroundColor: C.card, borderColor: activeColor + '40' }]}>
                            <View style={[styles.previewIconBox, { backgroundColor: `${activeColor}18` }]}>
                                <Feather
                                    name={(selectedPreset !== null ? PRESETS[selectedPreset].icon : 'star') as any}
                                    size={22}
                                    color={activeColor}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.previewHint, { color: C.muted }]}>ตัวอย่างกลุ่มของคุณ</Text>
                                <Text style={[styles.previewName, { color: C.text }]}>{groupName}</Text>
                            </View>
                            <View style={[styles.previewDot, { backgroundColor: activeColor }]} />
                        </View>
                    )}

                    {/* CTA */}
                    <TouchableOpacity
                        style={[
                            styles.ctaBtn,
                            {
                                backgroundColor: groupName ? activeColor : C.card,
                                borderColor: groupName ? activeColor : C.border,
                                opacity: isLoading ? 0.7 : 1,
                            },
                        ]}
                        onPress={handleCreate}
                        disabled={isLoading || !groupName}
                        activeOpacity={0.85}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={[styles.ctaText, { color: groupName ? '#fff' : C.muted }]}>
                                    สร้างกลุ่ม
                                </Text>
                                {groupName ? (
                                    <Feather name="arrow-right" size={16} color="#fff" />
                                ) : null}
                            </View>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const CARD_W = (W - 48 - 12) / 2;

const styles = StyleSheet.create({
    root:   { flex: 1 },
    scroll: { paddingHorizontal: 20 },

    backBtn: {
        alignSelf: 'flex-start',
        marginBottom: 28,
        width: 38,
        height: 38,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    header:   { marginBottom: 24 },
    headline: {
        fontFamily: 'Kanit-Bold',
        fontSize:   28,
        letterSpacing: -0.3,
        marginBottom: 6,
    },
    sub: {
        fontFamily: 'Kanit-Regular',
        fontSize:   14,
        lineHeight: 20,
    },

    sectionLabel: {
        fontFamily: 'Kanit-Regular',
        fontSize:   12,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        marginBottom: 10,
    },

    grid: {
        flexDirection: 'row',
        flexWrap:      'wrap',
        gap:           10,
        marginBottom:  24,
    },
    presetCard: {
        width:          CARD_W,
        borderRadius:   16,
        borderWidth:    1.5,
        paddingVertical: 18,
        paddingHorizontal: 14,
        gap:            10,
        position:       'relative',
        alignItems:     'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    presetIconBox: {
        width:       40,
        height:      40,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems:    'center',
    },
    presetLabel: {
        fontFamily: 'Kanit-Bold',
        fontSize:   14,
    },
    checkBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },

    customSection: { marginBottom: 24 },
    input: {
        height:          50,
        borderRadius:    12,
        paddingHorizontal: 14,
        borderWidth:     1,
        fontFamily:      'Kanit-Regular',
        fontSize:        15,
    },
    colorRow: {
        flexDirection: 'row',
        gap: 10,
    },
    colorDot: {
        width:  34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems:    'center',
    },

    preview: {
        flexDirection:  'row',
        alignItems:     'center',
        gap:            14,
        borderRadius:   14,
        borderWidth:    1.5,
        padding:        14,
        marginBottom:   20,
    },
    previewIconBox: {
        width:        44,
        height:       44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems:    'center',
    },
    previewHint: { fontFamily: 'Kanit-Regular', fontSize: 11, marginBottom: 3 },
    previewName: { fontFamily: 'Kanit-Bold',    fontSize: 16 },
    previewDot:  { width: 8, height: 8, borderRadius: 4, alignSelf: 'center' },

    ctaBtn: {
        height:       52,
        borderRadius: 14,
        borderWidth:  1,
        justifyContent: 'center',
        alignItems:    'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    ctaText: {
        fontFamily:   'Kanit-Bold',
        fontSize:     15,
        letterSpacing: 0.2,
    },
});
