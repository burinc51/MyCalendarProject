import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import { useGroupStore } from '@/stores/useGroupStore';
import { useAuthStore } from '@/stores/useAuthStore';
import ScreenHeader from '@/components/ScreenHeader';
import { getGroupById } from '@/services/groupService';

const ICONS = ['users', 'home', 'briefcase', 'heart', 'graduation-cap', 'utensils', 'plane', 'shopping-cart', 'dumbbell'];
const COLORS = ['#2ecc71', '#3b82f6', '#9b59b6', '#f1c40f', '#e67e22', '#e74c3c', '#1abc9c', '#34495e'];

export default function CreateGroupScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const { id, mode } = useLocalSearchParams<{ id?: string, mode?: 'edit' | 'create' }>();
    const isEdit = mode === 'edit';
    const groupId = id ? parseInt(id) : null;

    const insets = useSafeAreaInsets();
    const { createGroup, updateGroup, isLoading } = useGroupStore();
    const { user } = useAuthStore();

    const [name, setName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (isEdit && groupId) loadGroupData();
    }, [isEdit, groupId]);

    const loadGroupData = async () => {
        if (!groupId) return;
        try {
            setIsFetching(true);
            const g = await getGroupById(groupId);
            setName(g.name);
            setSelectedIcon(g.icon);
            setSelectedColor(g.color);
        } catch (e) {
            Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลกลุ่มได้');
        } finally {
            setIsFetching(false);
        }
    };

    const handleAction = async () => {
        if (!name.trim()) {
            Alert.alert('แจ้งเตือน', 'กรุณากรอกชื่อกลุ่ม');
            return;
        }
        if (!user?.id) {
            Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
            return;
        }
        const payload = {
            groupName: name.trim(),
            icon: selectedIcon,
            color: selectedColor,
            bg: selectedColor + '20',
            description: '',
        };
        try {
            if (isEdit && groupId) {
                await updateGroup(groupId, payload);
                Alert.alert('สำเร็จ', 'อัปเดตกลุ่มเรียบร้อยแล้ว', [{ text: 'ตกลง', onPress: () => router.back() }]);
            } else {
                const newGroup = await createGroup(payload, user.id);
                Alert.alert(
                    'สร้างกลุ่มสำเร็จ',
                    `กลุ่ม "${newGroup.groupName}" ถูกสร้างแล้ว\n\nรหัสเชิญ: ${newGroup.inviteCode}`,
                    [{ text: 'เยี่ยม!', onPress: () => router.back() }]
                );
            }
        } catch (error: any) {
            Alert.alert('ข้อผิดพลาด', error.response?.data?.message || `ไม่สามารถ${isEdit ? 'อัปเดต' : 'สร้าง'}กลุ่มได้`);
        }
    };

    const c = {
        bg:          isDark ? '#0d0d0d' : '#f8f8f8',
        card:        isDark ? '#1a1a1a' : '#ffffff',
        text:        isDark ? '#f0f0f0' : '#111111',
        muted:       isDark ? '#6b6b6b' : '#9ca3af',
        input:       isDark ? '#1a1a1a' : '#ffffff',
        inputBorder: isDark ? '#2e2e2e' : '#e2e2e2',
        inputText:   isDark ? '#f0f0f0' : '#111111',
        placeholder: isDark ? '#4a4a4a' : '#c4c4c4',
    };

    if (isFetching) {
        return (
            <View style={[styles.root, { backgroundColor: c.bg, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={selectedColor} />
                <Text style={[styles.loadingText, { color: c.muted }]}>กำลังโหลด...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.root, { backgroundColor: c.bg }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScreenHeader title={isEdit ? 'ตั้งค่ากลุ่ม' : 'สร้างกลุ่ม'} showBack={true} />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Preview */}
                    <View style={[styles.previewCard, { backgroundColor: c.card, borderColor: c.inputBorder }]}>
                        <View style={[styles.previewIconBox, { backgroundColor: selectedColor + '18' }]}>
                            <FontAwesome5 name={selectedIcon} size={30} color={selectedColor} solid />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.previewHint, { color: c.muted }]}>ตัวอย่างกลุ่ม</Text>
                            <Text style={[styles.previewName, { color: name ? c.text : c.muted }]} numberOfLines={1}>
                                {name || 'ชื่อกลุ่ม'}
                            </Text>
                        </View>
                        <View style={[styles.previewColorDot, { backgroundColor: selectedColor }]} />
                    </View>

                    {/* Name input */}
                    <Text style={[styles.sectionLabel, { color: c.muted }]}>ชื่อกลุ่ม</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: c.input, borderColor: c.inputBorder, color: c.inputText }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="เช่น ครอบครัว, ทีมทำงาน..."
                        placeholderTextColor={c.placeholder}
                        maxLength={30}
                    />

                    {/* Icon picker */}
                    <Text style={[styles.sectionLabel, { color: c.muted, marginTop: 20 }]}>ไอคอน</Text>
                    <View style={styles.iconGrid}>
                        {ICONS.map((icon) => {
                            const active = selectedIcon === icon;
                            return (
                                <TouchableOpacity
                                    key={icon}
                                    style={[
                                        styles.iconBox,
                                        {
                                            backgroundColor: active ? selectedColor + '15' : c.input,
                                            borderColor: active ? selectedColor : c.inputBorder,
                                        },
                                    ]}
                                    onPress={() => setSelectedIcon(icon)}
                                >
                                    <FontAwesome5 name={icon as any} size={18} color={active ? selectedColor : c.muted} solid />
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Color picker */}
                    <Text style={[styles.sectionLabel, { color: c.muted, marginTop: 20 }]}>สี</Text>
                    <View style={styles.colorRow}>
                        {COLORS.map((color) => {
                            const active = selectedColor === color;
                            return (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorDot,
                                        { backgroundColor: color },
                                        active && { borderWidth: 2.5, borderColor: '#fff', elevation: 4 },
                                    ]}
                                    onPress={() => setSelectedColor(color)}
                                >
                                    {active && <Feather name="check" size={14} color="#fff" />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* CTA */}
                    <TouchableOpacity
                        style={[
                            styles.ctaBtn,
                            { backgroundColor: selectedColor, shadowColor: selectedColor, opacity: isLoading ? 0.7 : 1 }
                        ]}
                        onPress={handleAction}
                        disabled={isLoading}
                        activeOpacity={0.85}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.ctaText}>{isEdit ? 'บันทึกการเปลี่ยนแปลง' : 'สร้างกลุ่ม'}</Text>
                                <Feather name="arrow-right" size={16} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    container: { padding: 20 },

    loadingText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 14,
        marginTop: 12,
    },

    // Preview
    previewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    previewIconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewHint: {
        fontFamily: 'Kanit-Regular',
        fontSize: 11,
        marginBottom: 3,
    },
    previewName: {
        fontFamily: 'Kanit-Bold',
        fontSize: 17,
    },
    previewColorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        alignSelf: 'center',
    },

    // Section label
    sectionLabel: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        marginBottom: 10,
    },

    // Input
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontFamily: 'Kanit-Regular',
        fontSize: 15,
    },

    // Icons
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Colors
    colorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // CTA
    ctaBtn: {
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 36,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    ctaText: {
        color: '#fff',
        fontFamily: 'Kanit-Bold',
        fontSize: 15,
        letterSpacing: 0.2,
    },
});
