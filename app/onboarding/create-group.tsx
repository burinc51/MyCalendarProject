/**
 * Onboarding Create Group Screen — Minimal Pro
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

// ──────────────────────────────────────────
// Preset options — ใช้ icon แทน emoji
// ──────────────────────────────────────────
const PRESETS = [
    { label: 'ครอบครัว', icon: 'home' as const, color: '#3b82f6' },
    { label: 'คนรัก',    icon: 'heart' as const, color: '#ef4444' },
    { label: 'เพื่อน',   icon: 'users' as const, color: '#f59e0b' },
    { label: 'อื่นๆ',   icon: 'grid' as const,   color: '#8b5cf6' },
];

const ACCENT_COLORS = ['#2ecc71', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function OnboardingCreateGroupScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router  = useRouter();
    const insets  = useSafeAreaInsets();
    const { createGroup, isLoading } = useGroupStore();
    const { user } = useAuthStore();

    const scrollRef  = useRef<ScrollView>(null);
    const inputRef   = useRef<TextInput>(null);
    const customSectionY = useRef(0);

    const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
    const [customName, setCustomName]         = useState('');
    const [selectedColor, setSelectedColor]   = useState(ACCENT_COLORS[0]);

    const isCustom  = selectedPreset === 3;
    const groupName = isCustom
        ? customName.trim()
        : selectedPreset !== null ? PRESETS[selectedPreset].label : '';

    const activeColor =
        selectedPreset !== null && !isCustom ? PRESETS[selectedPreset].color : selectedColor;

    const C = {
        bg:           isDark ? '#0d0d0d' : '#ffffff',
        text:         isDark ? '#f5f5f5' : '#0d0d0d',
        muted:        isDark ? '#71717a' : '#a1a1aa',
        card:         isDark ? '#161616' : '#f7f7f7',
        border:       isDark ? '#1e1e1e' : '#efefef',
        inputBg:      isDark ? '#161616' : '#f4f4f4',
        inputBorder:  isDark ? '#2a2a2a' : '#e5e5e5',
        inputText:    isDark ? '#f5f5f5' : '#0d0d0d',
        accent:       '#2ecc71',
        placeholder:  isDark ? '#525252' : '#b4b4b4',
    };

    const handleCreate = async () => {
        if (!groupName) {
            Alert.alert('กรุณาเลือกหรือกรอกชื่อกลุ่ม');
            return;
        }
        if (!user?.id) {
            Alert.alert('เกิดข้อผิดพลาด', 'ไม่พบข้อมูลผู้ใช้ กรุณา login ใหม่');
            return;
        }
        const icon  = selectedPreset !== null ? PRESETS[selectedPreset].icon : 'star';
        const color = activeColor;
        // bg ใช้เป็นสีเดียวกับ color แต่เพิ่ม opacity เป็นเพด (hex + '20')
        const bg    = color + '20';
        const description = selectedPreset !== null && !isCustom
            ? `กลุ่ม${PRESETS[selectedPreset].label}`
            : undefined;

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
                        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 120 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Back button */}
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => router.back()}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Ionicons name="arrow-back" size={20} color={C.text} />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.headline, { color: C.text }]}>สร้างกลุ่มแรก</Text>
                        <Text style={[styles.sub, { color: C.muted }]}>
                            เลือกประเภทกลุ่มที่ต้องการเริ่มต้นใช้งาน
                        </Text>
                    </View>

                    {/* Preset grid */}
                    <View style={styles.grid}>
                        {PRESETS.map((p, i) => {
                            const active = selectedPreset === i;
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[
                                        styles.presetCard,
                                        { backgroundColor: C.card, borderColor: active ? p.color : C.border },
                                        active && { borderColor: p.color },
                                    ]}
                                    onPress={() => {
                                        setSelectedPreset(i);
                                        if (i !== 3) {
                                            setCustomName('');
                                        } else {
                                            // scroll ไปหา custom section แล้ว focus input
                                            setTimeout(() => {
                                                scrollRef.current?.scrollTo({ y: customSectionY.current, animated: true });
                                                inputRef.current?.focus();
                                            }, 100);
                                        }
                                    }}
                                    activeOpacity={0.75}
                                >
                                    {/* Active indicator */}
                                    {active && (
                                        <View style={[styles.activeDot, { backgroundColor: p.color }]} />
                                    )}
                                    <View style={[styles.presetIconBox, { backgroundColor: active ? `${p.color}18` : C.border }]}>
                                        <Feather name={p.icon as any} size={22} color={active ? p.color : C.muted} />
                                    </View>
                                    <Text style={[styles.presetLabel, { color: active ? p.color : C.text }]}>
                                        {p.label}
                                    </Text>
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
                            <Text style={[styles.inputLabel, { color: C.muted }]}>ชื่อกลุ่ม</Text>
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

                            <Text style={[styles.inputLabel, { color: C.muted, marginTop: 20 }]}>สี</Text>
                            <View style={styles.colorRow}>
                                {ACCENT_COLORS.map((col) => (
                                    <TouchableOpacity
                                        key={col}
                                        style={[
                                            styles.colorDot,
                                            { backgroundColor: col },
                                            selectedColor === col && styles.colorDotActive,
                                        ]}
                                        onPress={() => setSelectedColor(col)}
                                    >
                                        {selectedColor === col && (
                                            <Ionicons name="checkmark" size={13} color="#fff" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Preview row */}
                    {groupName.length > 0 && (
                        <View style={[styles.preview, { backgroundColor: C.card, borderColor: C.border }]}>
                            <View style={[styles.previewIcon, { backgroundColor: `${activeColor}18` }]}>
                                <Feather
                                    name={(selectedPreset !== null ? PRESETS[selectedPreset].icon : 'star') as any}
                                    size={20}
                                    color={activeColor}
                                />
                            </View>
                            <View>
                                <Text style={[styles.previewHint, { color: C.muted }]}>กลุ่มของคุณ</Text>
                                <Text style={[styles.previewName, { color: C.text }]}>{groupName}</Text>
                            </View>
                        </View>
                    )}

                    {/* CTA */}
                    <TouchableOpacity
                        style={[
                            styles.ctaBtn,
                            {
                                backgroundColor: groupName ? C.accent : C.card,
                                borderColor: groupName ? C.accent : C.border,
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
                            <Text style={[styles.ctaText, { color: groupName ? '#fff' : C.muted }]}>
                                สร้างและเริ่มใช้งาน
                            </Text>
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
    scroll: { paddingHorizontal: 24 },

    backBtn: { marginBottom: 32, alignSelf: 'flex-start' },

    header:    { marginBottom: 28 },
    headline: {
        fontFamily: 'Kanit-Bold',
        fontSize:   32,
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    sub: {
        fontFamily: 'Kanit-Regular',
        fontSize:   15,
        lineHeight: 22,
    },

    // Grid
    grid: {
        flexDirection: 'row',
        flexWrap:      'wrap',
        gap:           12,
        marginBottom:  28,
    },
    presetCard: {
        width:         CARD_W,
        borderRadius:  16,
        borderWidth:   1.5,
        paddingVertical: 20,
        paddingHorizontal: 16,
        gap:           12,
        position:      'relative',
        alignItems:    'flex-start',
    },
    activeDot: {
        position:   'absolute',
        top:        12,
        right:      12,
        width:      8,
        height:     8,
        borderRadius: 4,
    },
    presetIconBox: {
        width:       44,
        height:      44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems:    'center',
    },
    presetLabel: {
        fontFamily: 'Kanit-Bold',
        fontSize:   15,
    },

    // Custom
    customSection: { marginBottom: 24 },
    inputLabel: {
        fontFamily:   'Kanit-Regular',
        fontSize:     12,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom:  8,
    },
    input: {
        height:          50,
        borderRadius:    12,
        paddingHorizontal: 14,
        borderWidth:     1,
        fontFamily:      'Kanit-Regular',
        fontSize:        16,
    },
    colorRow: {
        flexDirection: 'row',
        gap: 10,
    },
    colorDot: {
        width:  36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems:    'center',
    },
    colorDotActive: {
        borderWidth:  2.5,
        borderColor:  '#fff',
        shadowColor:  '#000',
        shadowOpacity: 0.2,
        shadowRadius:  4,
        shadowOffset:  { width: 0, height: 2 },
        elevation:     4,
    },

    // Preview
    preview: {
        flexDirection:  'row',
        alignItems:     'center',
        gap:            14,
        borderRadius:   14,
        borderWidth:    1,
        padding:        14,
        marginBottom:   28,
    },
    previewIcon: {
        width:        46,
        height:       46,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems:    'center',
    },
    previewHint: { fontFamily: 'Kanit-Regular', fontSize: 11, marginBottom: 2 },
    previewName: { fontFamily: 'Kanit-Bold',    fontSize: 16 },

    // CTA
    ctaBtn: {
        height:       54,
        borderRadius: 14,
        borderWidth:  1,
        justifyContent: 'center',
        alignItems:    'center',
    },
    ctaText: {
        fontFamily:   'Kanit-Bold',
        fontSize:     16,
        letterSpacing: 0.3,
    },
});
