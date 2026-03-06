/**
 * Event Create / Edit Screen — app/event/create.tsx
 * Full-screen page for creating or editing a calendar event.
 * Navigated to via router.push('/event/create') with optional params:
 *   - date: string (pre-fill start/end date)
 *   - event: string (JSON of CalendarEvent, for edit mode)
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Switch,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { useTheme } from '@/components/ThemeProvider';
import { EVENT_COLORS, CATEGORIES, PRIORITY_COLORS } from '@/constants/Calendar';
import { DEFAULT_EVENT_FORM } from '@/constants/Calendar';
import type { CalendarEvent, EventFormData, EventPriority } from '@/types/event';

// ─── helpers ────────────────────────────────────────────────────────────────
const hexToRgba = (hex: string, alpha: number) => {
    const c = hex?.startsWith('#') ? hex : '#2ecc71';
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
};

// ─── Section Header ──────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ icon: string; title: string; accent: string; isDark: boolean }> = ({
    icon, title, accent, isDark,
}) => (
    <View style={sh.wrap}>
        <View style={[sh.iconBox, { backgroundColor: hexToRgba(accent, 0.15) }]}>
            <Feather name={icon as any} size={15} color={accent} />
        </View>
        <Text style={[sh.title, { color: isDark ? '#ccc' : '#555' }]}>{title}</Text>
    </View>
);
const sh = StyleSheet.create({
    wrap:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: 4 },
    iconBox: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    title:   { fontSize: 12, fontFamily: 'Kanit-Bold', letterSpacing: 0.8, textTransform: 'uppercase' },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function EventCreateScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ date?: string; event?: string }>();

    // Parse existing event for edit mode
    const existingEvent = useMemo<CalendarEvent | null>(() => {
        try { return params.event ? JSON.parse(params.event as string) : null; }
        catch { return null; }
    }, [params.event]);

    const isEditing = !!existingEvent;

    // Build initial form data
    const initialForm = useMemo<EventFormData>(() => {
        if (existingEvent) {
            return {
                title: existingEvent.title || '',
                description: existingEvent.description || '',
                location: existingEvent.location || '',
                startDate: dayjs(existingEvent.startDate).format('YYYY-MM-DD'),
                endDate: dayjs(existingEvent.endDate).format('YYYY-MM-DD'),
                startTime: existingEvent.isAllDay ? '09:00' : dayjs(existingEvent.startDate).format('HH:mm'),
                endTime: existingEvent.isAllDay ? '10:00' : dayjs(existingEvent.endDate).format('HH:mm'),
                isAllDay: existingEvent.isAllDay,
                color: existingEvent.color || '#2ecc71',
                category: existingEvent.category || 'Work',
                priority: existingEvent.priority || 'medium',
                reminder: existingEvent.reminder || 15,
                notificationType: existingEvent.notificationType || 'PUSH',
                remindBeforeValue: (existingEvent.remindBeforeValue || 15).toString(),
                remindBeforeUnit: existingEvent.remindBeforeUnit || 'MINUTES',
                repeatType: existingEvent.repeatType || 'NONE',
                repeatInterval: (existingEvent.repeatInterval || 1).toString(),
                repeatUntil: existingEvent.repeatUntil ? dayjs(existingEvent.repeatUntil).format('YYYY-MM-DD') : '',
                pinned: !!existingEvent.pinned,
                groupId: existingEvent.groupId || null,
            };
        }
        const dateStr = params.date ?? dayjs().format('YYYY-MM-DD');
        return { ...DEFAULT_EVENT_FORM, startDate: dateStr, endDate: dateStr };
    }, [existingEvent, params.date]);

    const [formData, setFormData] = useState<EventFormData>(initialForm);

    const updateField = useCallback(<K extends keyof EventFormData>(key: K, value: EventFormData[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    }, []);

    // ── theme colors ──
    const c = useMemo(() => ({
        bg:        isDark ? '#111111' : '#f4f6f9',
        navBg:     isDark ? '#1a1a1a' : '#ffffff',
        card:      isDark ? '#1e1e1e' : '#ffffff',
        cardBorder:isDark ? '#2a2a2a' : '#eef0f4',
        label:     isDark ? '#a0a0a0' : '#6b7280',
        text:      isDark ? '#f0f0f0' : '#1a1a2e',
        input:     isDark ? '#262626' : '#f7f9fc',
        inputBorder:isDark ? '#333'   : '#e2e8f0',
        inputText: isDark ? '#f0f0f0' : '#1a1a2e',
        placeholder:isDark ? '#555'   : '#9ca3af',
        divider:   isDark ? '#2a2a2a' : '#eef0f4',
        switchBg:  isDark ? '#262626' : '#f0fdf4',
    }), [isDark]);

    const accent = formData.color || '#2ecc71';

    // ── save handler ──
    const handleSave = useCallback(async () => {
        if (!formData.title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }
        try {
            // We re-use the hook's logic but pass our local state
            // Since the hook has its own internal state, we call the API directly
            const { createEvent, updateEvent } = await import('@/services/eventService');
            const { buildEventFormData } = await import('@/utils/calendar-helpers');
            const { DEFAULT_USER_ID } = await import('@/constants/Calendar');

            const formDataToSend = buildEventFormData(formData, existingEvent?.userId || DEFAULT_USER_ID);

            if (existingEvent) {
                const userId = existingEvent.userId || DEFAULT_USER_ID;
                await updateEvent(existingEvent.id, userId, formDataToSend as unknown as FormData);
                Alert.alert('Success', 'Event updated!', [{ text: 'OK', onPress: () => router.back() }]);
            } else {
                await createEvent(formDataToSend as unknown as FormData);
                Alert.alert('Success', 'Event created!', [{ text: 'OK', onPress: () => router.back() }]);
            }
        } catch {
            // On API error (or mock), just go back
            router.back();
        }
    }, [formData, existingEvent, router]);

    const handleCancel = useCallback(() => router.back(), [router]);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <View style={[styles.root, { backgroundColor: c.bg }]}>
            {/* ── Nav Bar ── */}
            <View style={[styles.navbar, { backgroundColor: c.navBg, paddingTop: insets.top }]}>
                <TouchableOpacity onPress={handleCancel} style={styles.navBtn} activeOpacity={0.7}>
                    <Feather name="x" size={22} color={isDark ? '#e5e5e5' : '#2c3e50'} />
                </TouchableOpacity>
                <Text style={[styles.navTitle, { color: isDark ? '#f0f0f0' : '#1a1a2e' }]}>
                    {isEditing ? 'Edit Event' : 'New Event'}
                </Text>
                <TouchableOpacity
                    onPress={handleSave}
                    style={[styles.saveNavBtn, { backgroundColor: hexToRgba(accent, 0.15) }]}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.saveNavBtnText, { color: accent }]}>
                        {isEditing ? 'Update' : 'Save'}
                    </Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Color accent strip ── */}
                    <View style={[styles.accentStrip, { backgroundColor: hexToRgba(accent, 0.12) }]}>
                        <View style={[styles.accentDot, { backgroundColor: accent, shadowColor: accent }]} />
                        <Text style={[styles.accentLabel, { color: isDark ? '#bbb' : '#555' }]}>
                            {isEditing ? 'Editing event' : 'Creating new event'}
                        </Text>
                    </View>

                    {/* ── Basic Info Card ── */}
                    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                        <SectionHeader icon="edit-3" title="Basic Info" accent={accent} isDark={isDark} />

                        {/* Title */}
                        <Text style={[styles.fieldLabel, { color: c.label }]}>Title *</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: c.input,
                                borderColor: c.inputBorder,
                                color: c.inputText,
                            }]}
                            value={formData.title}
                            onChangeText={v => updateField('title', v)}
                            placeholder="Enter event title"
                            placeholderTextColor={c.placeholder}
                        />

                        {/* Location */}
                        <Text style={[styles.fieldLabel, { color: c.label, marginTop: 14 }]}>Location</Text>
                        <View style={styles.inputWithIcon}>
                            <Feather name="map-pin" size={16} color={c.label} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, styles.inputFull, {
                                    backgroundColor: c.input,
                                    borderColor: c.inputBorder,
                                    color: c.inputText,
                                }]}
                                value={formData.location || ''}
                                onChangeText={v => updateField('location', v)}
                                placeholder="Enter location"
                                placeholderTextColor={c.placeholder}
                            />
                        </View>

                        {/* Description */}
                        <Text style={[styles.fieldLabel, { color: c.label, marginTop: 14 }]}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textarea, {
                                backgroundColor: c.input,
                                borderColor: c.inputBorder,
                                color: c.inputText,
                            }]}
                            value={formData.description}
                            onChangeText={v => updateField('description', v)}
                            placeholder="Enter description"
                            placeholderTextColor={c.placeholder}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* ── Date & Time Card ── */}
                    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                        <SectionHeader icon="clock" title="Date & Time" accent={accent} isDark={isDark} />

                        {/* All Day toggle */}
                        <View style={[styles.toggleRow, { backgroundColor: c.input, borderColor: c.inputBorder }]}>
                            <View style={styles.toggleLeft}>
                                <View style={[styles.toggleIcon, { backgroundColor: hexToRgba(accent, 0.15) }]}>
                                    <Feather name="sun" size={14} color={accent} />
                                </View>
                                <Text style={[styles.toggleLabel, { color: c.text }]}>All Day</Text>
                            </View>
                            <Switch
                                value={!!formData.isAllDay}
                                onValueChange={v => updateField('isAllDay', v)}
                                trackColor={{ false: c.inputBorder, true: hexToRgba(accent, 0.5) }}
                                thumbColor={formData.isAllDay ? accent : (isDark ? '#555' : '#ddd')}
                            />
                        </View>

                        {/* Pin to Top toggle */}
                        <View style={[styles.toggleRow, { backgroundColor: c.input, borderColor: c.inputBorder, marginTop: 10 }]}>
                            <View style={styles.toggleLeft}>
                                <View style={[styles.toggleIcon, { backgroundColor: hexToRgba('#f39c12', 0.15) }]}>
                                    <Feather name="bookmark" size={14} color="#f39c12" />
                                </View>
                                <Text style={[styles.toggleLabel, { color: c.text }]}>Pin to Top 📌</Text>
                            </View>
                            <Switch
                                value={!!formData.pinned}
                                onValueChange={v => updateField('pinned', v)}
                                trackColor={{ false: c.inputBorder, true: hexToRgba('#f39c12', 0.5) }}
                                thumbColor={formData.pinned ? '#f39c12' : (isDark ? '#555' : '#ddd')}
                            />
                        </View>

                        {/* Date range */}
                        <Text style={[styles.fieldLabel, { color: c.label, marginTop: 14 }]}>Date</Text>
                        <View style={styles.rowInputs}>
                            <View style={styles.rowInputItem}>
                                <Feather name="calendar" size={14} color={c.label} style={{ marginBottom: 4 }} />
                                <TextInput
                                    style={[styles.input, { backgroundColor: c.input, borderColor: c.inputBorder, color: c.inputText }]}
                                    value={formData.startDate}
                                    onChangeText={v => updateField('startDate', v)}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={c.placeholder}
                                />
                            </View>
                            <View style={styles.rowSep}>
                                <Text style={[styles.rowSepText, { color: c.label }]}>→</Text>
                            </View>
                            <View style={styles.rowInputItem}>
                                <Feather name="calendar" size={14} color={c.label} style={{ marginBottom: 4 }} />
                                <TextInput
                                    style={[styles.input, { backgroundColor: c.input, borderColor: c.inputBorder, color: c.inputText }]}
                                    value={formData.endDate}
                                    onChangeText={v => updateField('endDate', v)}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={c.placeholder}
                                />
                            </View>
                        </View>

                        {/* Time range (if not all day) */}
                        {!formData.isAllDay && (
                            <>
                                <Text style={[styles.fieldLabel, { color: c.label, marginTop: 14 }]}>Time</Text>
                                <View style={styles.rowInputs}>
                                    <View style={styles.rowInputItem}>
                                        <Feather name="clock" size={14} color={c.label} style={{ marginBottom: 4 }} />
                                        <TextInput
                                            style={[styles.input, { backgroundColor: c.input, borderColor: c.inputBorder, color: c.inputText }]}
                                            value={formData.startTime}
                                            onChangeText={v => updateField('startTime', v)}
                                            placeholder="HH:mm"
                                            placeholderTextColor={c.placeholder}
                                        />
                                    </View>
                                    <View style={styles.rowSep}>
                                        <Text style={[styles.rowSepText, { color: c.label }]}>→</Text>
                                    </View>
                                    <View style={styles.rowInputItem}>
                                        <Feather name="clock" size={14} color={c.label} style={{ marginBottom: 4 }} />
                                        <TextInput
                                            style={[styles.input, { backgroundColor: c.input, borderColor: c.inputBorder, color: c.inputText }]}
                                            value={formData.endTime}
                                            onChangeText={v => updateField('endTime', v)}
                                            placeholder="HH:mm"
                                            placeholderTextColor={c.placeholder}
                                        />
                                    </View>
                                </View>
                            </>
                        )}
                    </View>

                    {/* ── Appearance Card ── */}
                    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                        <SectionHeader icon="droplet" title="Appearance" accent={accent} isDark={isDark} />

                        {/* Color */}
                        <Text style={[styles.fieldLabel, { color: c.label }]}>Color</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                            <View style={styles.colorRow}>
                                {EVENT_COLORS.map((colorObj) => {
                                    const selected = formData.color === colorObj.solid;
                                    return (
                                        <TouchableOpacity
                                            key={colorObj.solid}
                                            style={[
                                                styles.colorCircle,
                                                { backgroundColor: colorObj.solid },
                                                selected && [styles.colorCircleSelected, { borderColor: colorObj.solid, shadowColor: colorObj.solid }],
                                            ]}
                                            onPress={() => updateField('color', colorObj.solid)}
                                            activeOpacity={0.8}
                                        >
                                            {selected && <Feather name="check" size={16} color="#fff" />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        {/* Category */}
                        <Text style={[styles.fieldLabel, { color: c.label, marginTop: 14 }]}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                            <View style={styles.chipRow}>
                                {CATEGORIES.map((cat) => {
                                    const selected = formData.category === cat;
                                    return (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[
                                                styles.chip,
                                                { borderColor: selected ? accent : c.inputBorder, backgroundColor: selected ? hexToRgba(accent, 0.15) : c.input },
                                            ]}
                                            onPress={() => updateField('category', cat)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[styles.chipText, { color: selected ? accent : c.label, fontFamily: selected ? 'Kanit-Bold' : 'Kanit-Regular' }]}>
                                                {cat}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        {/* Priority */}
                        <Text style={[styles.fieldLabel, { color: c.label, marginTop: 14 }]}>Priority</Text>
                        <View style={styles.priorityRow}>
                            {(['low', 'medium', 'high'] as EventPriority[]).map((p) => {
                                const meta = PRIORITY_COLORS[p];
                                const selected = formData.priority === p;
                                const icons: Record<EventPriority, string> = { low: 'check-circle', medium: 'minus-circle', high: 'alert-circle' };
                                return (
                                    <TouchableOpacity
                                        key={p}
                                        style={[
                                            styles.priorityBtn,
                                            { borderColor: selected ? meta.solid : c.inputBorder, backgroundColor: selected ? meta.solid : c.input },
                                        ]}
                                        onPress={() => updateField('priority', p)}
                                        activeOpacity={0.7}
                                    >
                                        <Feather name={icons[p] as any} size={15} color={selected ? '#fff' : meta.solid} />
                                        <Text style={[styles.priorityBtnText, { color: selected ? '#fff' : c.text }]}>
                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* ── Notification Card ── */}
                    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                        <SectionHeader icon="bell" title="Notification" accent={accent} isDark={isDark} />

                        <View style={styles.notifRow}>
                            <TextInput
                                style={[styles.input, styles.smallNumInput, {
                                    backgroundColor: c.input, borderColor: c.inputBorder, color: c.inputText,
                                }]}
                                value={formData.remindBeforeValue?.toString() || ''}
                                onChangeText={v => updateField('remindBeforeValue', v)}
                                keyboardType="numeric"
                                placeholder="15"
                                placeholderTextColor={c.placeholder}
                            />
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                                <View style={styles.chipRow}>
                                    {(['MINUTES', 'HOURS', 'DAYS', 'WEEKS'] as const).map((unit) => {
                                        const selected = formData.remindBeforeUnit === unit;
                                        return (
                                            <TouchableOpacity
                                                key={unit}
                                                style={[styles.chip, { borderColor: selected ? accent : c.inputBorder, backgroundColor: selected ? hexToRgba(accent, 0.15) : c.input }]}
                                                onPress={() => updateField('remindBeforeUnit', unit)}
                                            >
                                                <Text style={[styles.chipText, { color: selected ? accent : c.label, fontFamily: selected ? 'Kanit-Bold' : 'Kanit-Regular' }]}>
                                                    {unit.toLowerCase()}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        </View>

                        <Text style={[styles.fieldLabel, { color: c.label, marginTop: 12 }]}>Type</Text>
                        <View style={styles.chipRow}>
                            {(['POPUP', 'EMAIL', 'PUSH'] as const).map((type) => {
                                const selected = formData.notificationType === type;
                                const typeIcons: Record<string, string> = { POPUP: 'bell', EMAIL: 'mail', PUSH: 'smartphone' };
                                return (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.chip, { borderColor: selected ? accent : c.inputBorder, backgroundColor: selected ? hexToRgba(accent, 0.15) : c.input }]}
                                        onPress={() => updateField('notificationType', type)}
                                    >
                                        <Feather name={typeIcons[type] as any} size={13} color={selected ? accent : c.label} />
                                        <Text style={[styles.chipText, { color: selected ? accent : c.label, fontFamily: selected ? 'Kanit-Bold' : 'Kanit-Regular' }]}>
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* ── Repeat Card ── */}
                    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                        <SectionHeader icon="repeat" title="Repeat" accent={accent} isDark={isDark} />

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                            <View style={styles.chipRow}>
                                {(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'] as const).map((type) => {
                                    const selected = formData.repeatType === type;
                                    return (
                                        <TouchableOpacity
                                            key={type}
                                            style={[styles.chip, { borderColor: selected ? accent : c.inputBorder, backgroundColor: selected ? hexToRgba(accent, 0.15) : c.input }]}
                                            onPress={() => updateField('repeatType', type)}
                                        >
                                            <Text style={[styles.chipText, { color: selected ? accent : c.label, fontFamily: selected ? 'Kanit-Bold' : 'Kanit-Regular' }]}>
                                                {type.charAt(0) + type.slice(1).toLowerCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        {formData.repeatType !== 'NONE' && (
                            <View style={[styles.repeatExtra, { backgroundColor: c.input, borderColor: c.inputBorder }]}>
                                <View style={styles.repeatRow}>
                                    <Text style={[styles.repeatLabel, { color: c.label }]}>Every</Text>
                                    <TextInput
                                        style={[styles.input, styles.smallNumInput, { backgroundColor: c.card, borderColor: c.inputBorder, color: c.inputText }]}
                                        value={formData.repeatInterval?.toString() || ''}
                                        onChangeText={v => updateField('repeatInterval', v)}
                                        keyboardType="numeric"
                                        placeholder="1"
                                        placeholderTextColor={c.placeholder}
                                    />
                                    <Text style={[styles.repeatLabel, { color: c.text }]}>
                                        {formData.repeatType === 'DAILY' ? 'Days' :
                                            formData.repeatType === 'WEEKLY' ? 'Weeks' :
                                                formData.repeatType === 'MONTHLY' ? 'Months' : 'Years'}
                                    </Text>
                                </View>
                                <View style={[styles.repeatRow, { marginTop: 10 }]}>
                                    <Text style={[styles.repeatLabel, { color: c.label }]}>Until</Text>
                                    <TextInput
                                        style={[styles.input, { flex: 1, backgroundColor: c.card, borderColor: c.inputBorder, color: c.inputText }]}
                                        value={formData.repeatUntil || ''}
                                        onChangeText={v => updateField('repeatUntil', v)}
                                        placeholder="YYYY-MM-DD (Optional)"
                                        placeholderTextColor={c.placeholder}
                                    />
                                </View>
                            </View>
                        )}
                    </View>

                    {/* ── Bottom Action Buttons ── */}
                    <View style={styles.bottomBtns}>
                        <TouchableOpacity
                            style={[styles.btnCancel, { borderColor: c.inputBorder, backgroundColor: c.card }]}
                            onPress={handleCancel}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.btnCancelText, { color: c.label }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btnSave, { backgroundColor: accent, shadowColor: accent }]}
                            onPress={handleSave}
                            activeOpacity={0.8}
                        >
                            <Feather name={isEditing ? 'check-circle' : 'plus-circle'} size={18} color="#fff" />
                            <Text style={styles.btnSaveText}>{isEditing ? 'Update Event' : 'Create Event'}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1 },

    // Nav bar
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 4,
    },
    navBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navTitle: {
        fontSize: 17,
        fontFamily: 'Kanit-Bold',
        flex: 1,
        textAlign: 'center',
    },
    saveNavBtn: {
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 20,
    },
    saveNavBtnText: {
        fontSize: 14,
        fontFamily: 'Kanit-Bold',
    },

    // Scroll
    scroll: {
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 14,
    },

    // Accent strip
    accentStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 2,
    },
    accentDot: {
        width: 12, height: 12,
        borderRadius: 6,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 3,
    },
    accentLabel: {
        fontSize: 13,
        fontFamily: 'Kanit-Regular',
    },

    // Card
    card: {
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },

    // Field label
    fieldLabel: {
        fontSize: 11,
        fontFamily: 'Kanit-Bold',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        marginBottom: 8,
    },

    // Input
    input: {
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        fontFamily: 'Kanit-Regular',
    },
    inputFull: { flex: 1 },
    textarea: {
        height: 90,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    inputIcon: {
        position: 'absolute',
        left: 14,
        zIndex: 1,
    },

    // Toggle row
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    toggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    toggleIcon: {
        width: 28, height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleLabel: {
        fontSize: 15,
        fontFamily: 'Kanit-Regular',
    },

    // Row inputs (date/time side by side)
    rowInputs: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rowInputItem: {
        flex: 1,
    },
    rowSep: {
        paddingTop: 18,
        alignItems: 'center',
    },
    rowSepText: {
        fontSize: 16,
        fontFamily: 'Kanit-Bold',
    },

    // Color circles
    colorRow: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 8,
    },
    colorCircle: {
        width: 42, height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'transparent',
    },
    colorCircleSelected: {
        borderWidth: 3,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 6,
        transform: [{ scale: 1.12 }],
    },

    // Chips
    chipRow: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 4,
        flexWrap: 'wrap',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    chipText: {
        fontSize: 12,
        fontFamily: 'Kanit-Regular',
    },

    // Priority buttons
    priorityRow: {
        flexDirection: 'row',
        gap: 10,
    },
    priorityBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 11,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    priorityBtnText: {
        fontSize: 13,
        fontFamily: 'Kanit-Regular',
    },

    // Notification
    notifRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    smallNumInput: {
        width: 64,
        textAlign: 'center',
        paddingHorizontal: 10,
    },

    // Repeat extra
    repeatExtra: {
        marginTop: 12,
        borderRadius: 12,
        borderWidth: 1,
        padding: 14,
    },
    repeatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    repeatLabel: {
        fontSize: 13,
        fontFamily: 'Kanit-Regular',
    },

    // Bottom buttons
    bottomBtns: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    btnCancel: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 14,
        borderWidth: 1.5,
        alignItems: 'center',
    },
    btnCancelText: {
        fontSize: 15,
        fontFamily: 'Kanit-Bold',
    },
    btnSave: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
        borderRadius: 14,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    btnSaveText: {
        fontSize: 15,
        fontFamily: 'Kanit-Bold',
        color: '#fff',
    },
});

