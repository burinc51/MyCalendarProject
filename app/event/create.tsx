/**
 * Event Create / Edit Screen — app/event/create.tsx
 * Pure-JS date/time drum-roll picker (no native modules required).
 * Params:
 *   - date: string  → pre-fill start/end date
 *   - event: string → JSON CalendarEvent (edit mode)
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    Switch, ScrollView, FlatList, Alert, KeyboardAvoidingView,
    Platform, Modal, Image,
    NativeSyntheticEvent, NativeScrollEvent,
    Animated, PanResponder, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { useTheme } from '@/components/ThemeProvider';
import { EVENT_COLORS, CATEGORIES, PRIORITY_COLORS } from '@/constants/Calendar';
import { DEFAULT_EVENT_FORM } from '@/constants/Calendar';
import type { CalendarEvent, EventFormData, EventPriority, EventUser } from '@/types/event';
import ScreenHeader from '@/components/ScreenHeader';
import { useAuthStore } from '@/stores/useAuthStore';
import { GroupApiResponse, GroupMember } from '@/types/group';
import { getGroupsAllByUserId } from '@/services/groupService';
import { useGroupStore } from '@/stores/useGroupStore';

// Helpers
const hexToRgba = (hex: string, alpha: number) => {
    const c = hex?.startsWith('#') ? hex : '#2ecc71';
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
};

const AVATAR_COLORS = ['#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f39c12', '#1abc9c', '#e67e22'];
const avatarBg = (i: number) => AVATAR_COLORS[i % AVATAR_COLORS.length];
const getInitial = (u: EventUser) => (u.name || u.username || '?').trim().charAt(0).toUpperCase();
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Theme colours
const buildColors = (isDark: boolean) => ({
    bg: isDark ? '#111111' : '#f4f6f9',
    navBg: isDark ? '#1a1a1a' : '#ffffff',
    card: isDark ? '#1e1e1e' : '#ffffff',
    cardBorder: isDark ? '#2a2a2a' : '#eef0f4',
    label: isDark ? '#a0a0a0' : '#6b7280',
    text: isDark ? '#f0f0f0' : '#1a1a2e',
    input: isDark ? '#262626' : '#f7f9fc',
    inputBorder: isDark ? '#333' : '#e2e8f0',
    inputText: isDark ? '#f0f0f0' : '#1a1a2e',
    placeholder: isDark ? '#555' : '#9ca3af',
    divider: isDark ? '#2a2a2a' : '#eef0f4',
    searchBg: isDark ? '#2a2a2a' : '#f0f3f7',
    wheelBg: isDark ? '#1a1a1a' : '#f8f9fb',
    wheelText: isDark ? '#e0e0e0' : '#1a1a2e',
    wheelDim: isDark ? '#555' : '#aaa',
    wheelLine: isDark ? '#333' : '#dde3ec',
});
type Colors = ReturnType<typeof buildColors>;

// Avatar
const UserAvatar: React.FC<{ user: EventUser; index: number; size?: number }> = ({ user, index, size = 38 }) => {
    const bg = avatarBg(index);
    if (user.imageUrl) {
        return <Image source={{ uri: user.imageUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
    }
    return (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Kanit-Bold', color: '#fff', fontSize: size * 0.4 }}>{getInitial(user)}</Text>
        </View>
    );
};

// Section Header
const SectionHeader: React.FC<{ icon: string; title: string; accent: string; isDark: boolean }> = ({ icon, title, accent, isDark }) => (
    <View style={sh.wrap}>
        <View style={[sh.iconBox, { backgroundColor: hexToRgba(accent, 0.15) }]}>
            <Feather name={icon as any} size={15} color={accent} />
        </View>
        <Text style={[sh.title, { color: isDark ? '#ccc' : '#555' }]}>{title}</Text>
    </View>
);
const sh = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 4 },
    iconBox: { width: 30, height: 30, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 12, fontFamily: 'Kanit-Bold', letterSpacing: 0.8, textTransform: 'uppercase' },
});

// Drum-roll Wheel Column  (pure-JS, zero native modules)
const ITEM_H = 44;
const VISIBLE = 5;

const WheelColumn: React.FC<{
    items: string[];
    selectedIndex: number;
    onSelect: (i: number) => void;
    c: Colors;
    width?: number;
}> = ({ items, selectedIndex, onSelect, c, width = 72 }) => {
    const ref = useRef<ScrollView>(null);
    const pad = Math.floor(VISIBLE / 2);

    const padded = useMemo(() => [
        ...Array(pad).fill(''),
        ...items,
        ...Array(pad).fill(''),
    ], [items, pad]);

    const scrollTo = useCallback((idx: number) => {
        ref.current?.scrollTo({ y: idx * ITEM_H, animated: true });
    }, []);

    const snap = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const raw = e.nativeEvent.contentOffset.y;
        const idx = Math.max(0, Math.min(items.length - 1, Math.round(raw / ITEM_H)));
        scrollTo(idx);
        onSelect(idx);
    }, [items.length, onSelect, scrollTo]);

    return (
        <View style={{ width, height: ITEM_H * VISIBLE, overflow: 'hidden' }}>
            <View pointerEvents="none" style={[wh.selBar, { top: pad * ITEM_H, borderColor: c.wheelLine }]} />
            <View pointerEvents="none" style={[wh.fade, { top: 0, backgroundColor: c.wheelBg }]} />
            <View pointerEvents="none" style={[wh.fade, { top: (VISIBLE - 1) * ITEM_H, backgroundColor: c.wheelBg }]} />
            <ScrollView
                ref={ref}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_H}
                decelerationRate="fast"
                contentOffset={{ x: 0, y: selectedIndex * ITEM_H }}
                onMomentumScrollEnd={snap}
                onScrollEndDrag={snap}
                bounces={false}
            >
                {padded.map((item, i) => {
                    const realIdx = i - pad;
                    const isSel = realIdx === selectedIndex;
                    const dist = Math.abs(realIdx - selectedIndex);
                    return (
                        <TouchableOpacity
                            key={i}
                            style={{ height: ITEM_H, justifyContent: 'center', alignItems: 'center' }}
                            onPress={() => {
                                if (realIdx >= 0 && realIdx < items.length) {
                                    scrollTo(realIdx);
                                    onSelect(realIdx);
                                }
                            }}
                            activeOpacity={0.6}
                        >
                            <Text style={{
                                textAlign: 'center',
                                color: isSel ? c.wheelText : c.wheelDim,
                                fontFamily: isSel ? 'Kanit-Bold' : 'Kanit-Regular',
                                fontSize: isSel ? 18 : 14,
                                opacity: isSel ? 1 : Math.max(0.18, 1 - dist * 0.35),
                            }}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};
const wh = StyleSheet.create({
    selBar: { position: 'absolute', left: 0, right: 0, height: ITEM_H, borderTopWidth: 1, borderBottomWidth: 1, zIndex: 2 },
    fade: { position: 'absolute', left: 0, right: 0, height: ITEM_H * 2, opacity: 0.6, zIndex: 3 },
});

// Date / Time Picker Modal
type PickerKind = 'date' | 'time';

const DTPickerModal: React.FC<{
    visible: boolean;
    kind: PickerKind;
    value: string;
    isDark: boolean;
    accent: string;
    c: Colors;
    onConfirm: (v: string) => void;
    onCancel: () => void;
}> = ({ visible, kind, value, accent, c, onConfirm, onCancel }) => {
    const pd = useMemo(() => dayjs(value).isValid() ? dayjs(value) : dayjs(), [value]);
    const [selYear, setSelYear] = useState(pd.year());
    const [selMonth, setSelMonth] = useState(pd.month());
    const [selDay, setSelDay] = useState(pd.date() - 1);

    const pt = useMemo(() => {
        const [h = '9', m = '0'] = value.split(':');
        return { h: parseInt(h, 10), m: parseInt(m, 10) };
    }, [value]);
    const [selHour, setSelHour] = useState(pt.h);
    const [selMin, setSelMin] = useState(pt.m);

    const yearItems = useMemo(() => Array.from({ length: 21 }, (_, i) => String(dayjs().year() - 10 + i)), []);
    const yearIdx = useMemo(() => Math.max(0, yearItems.indexOf(String(selYear))), [yearItems, selYear]);
    const daysInMonth = useMemo(() => dayjs(`${selYear}-${selMonth + 1}-01`).daysInMonth(), [selYear, selMonth]);
    const dayItems = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0')), [daysInMonth]);
    const clampedDay = Math.min(selDay, daysInMonth - 1);
    const hourItems = useMemo(() => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')), []);
    const minItems = useMemo(() => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')), []);

    const confirm = () => {
        if (kind === 'date') {
            onConfirm(dayjs(`${selYear}-${selMonth + 1}-${clampedDay + 1}`).format('YYYY-MM-DD'));
        } else {
            onConfirm(`${String(selHour).padStart(2, '0')}:${String(selMin).padStart(2, '0')}`);
        }
    };

    return (
        <Modal transparent animationType="slide" visible={visible} onRequestClose={onCancel}>
            <TouchableOpacity style={dtp.backdrop} activeOpacity={1} onPress={onCancel} />
            <View style={[dtp.sheet, { backgroundColor: c.card }]}>
                <View style={[dtp.handle, { backgroundColor: c.wheelLine }]} />
                <View style={[dtp.header, { borderBottomColor: c.divider }]}>
                    <TouchableOpacity onPress={onCancel} style={dtp.hBtn}>
                        <Text style={[dtp.cancelTxt, { color: c.label }]}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={[dtp.title, { color: c.text }]}>
                        {kind === 'date' ? 'Select Date' : 'Select Time'}
                    </Text>
                    <TouchableOpacity onPress={confirm} style={dtp.hBtn}>
                        <Text style={[dtp.doneTxt, { color: accent }]}>Done</Text>
                    </TouchableOpacity>
                </View>
                <View style={[dtp.wheelWrap, { backgroundColor: c.wheelBg }]}>
                    {kind === 'date' ? (
                        <>
                            <WheelColumn items={MONTHS_SHORT} selectedIndex={selMonth} onSelect={setSelMonth} c={c} width={78} />
                            <Text style={[dtp.sep, { color: c.wheelDim }]}>/</Text>
                            <WheelColumn items={dayItems} selectedIndex={clampedDay} onSelect={setSelDay} c={c} width={56} />
                            <Text style={[dtp.sep, { color: c.wheelDim }]}>/</Text>
                            <WheelColumn items={yearItems} selectedIndex={yearIdx} onSelect={i => setSelYear(parseInt(yearItems[i], 10))} c={c} width={78} />
                        </>
                    ) : (
                        <>
                            <WheelColumn items={hourItems} selectedIndex={selHour} onSelect={setSelHour} c={c} width={72} />
                            <Text style={[dtp.sep, { color: c.wheelDim, fontSize: 24 }]}>:</Text>
                            <WheelColumn items={minItems} selectedIndex={selMin} onSelect={setSelMin} c={c} width={72} />
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
};
const dtp = StyleSheet.create({
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
    sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: 36, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 20 },
    handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 2 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
    title: { fontSize: 16, fontFamily: 'Kanit-Bold' },
    hBtn: { paddingHorizontal: 6, paddingVertical: 4, minWidth: 56 },
    cancelTxt: { fontSize: 15, fontFamily: 'Kanit-Regular' },
    doneTxt: { fontSize: 15, fontFamily: 'Kanit-Bold', textAlign: 'right' },
    wheelWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 12, borderRadius: 16, margin: 16 },
    sep: { fontSize: 18, fontFamily: 'Kanit-Bold', paddingBottom: 2 },
});

// DateTrigger Button
const DateTrigger: React.FC<{
    icon: string; label: string; value: string;
    onPress: () => void; accent: string; c: Colors;
}> = ({ icon, label, value, onPress, accent, c }) => (
    <TouchableOpacity
        style={[dtb.wrap, { flex: 1, backgroundColor: c.input, borderColor: c.inputBorder }]}
        onPress={onPress} activeOpacity={0.75}
    >
        <View style={[dtb.iconBox, { backgroundColor: hexToRgba(accent, 0.14) }]}>
            <Feather name={icon as any} size={16} color={accent} />
        </View>
        <View style={dtb.body}>
            <Text style={[dtb.lbl, { color: c.label }]}>{label}</Text>
            <Text style={[dtb.val, { color: c.text }]} numberOfLines={1}>{value}</Text>
        </View>
        <Feather name="chevron-down" size={14} color={c.label} />
    </TouchableOpacity>
);
const dtb = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 12, gap: 10 },
    iconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    body: { flex: 1, gap: 2 },
    lbl: { fontSize: 10, fontFamily: 'Kanit-Regular', letterSpacing: 0.6, textTransform: 'uppercase' },
    val: { fontSize: 15, fontFamily: 'Kanit-Bold' },
});

// Group Picker Modal
const GroupPickerModal: React.FC<{
    visible: boolean;
    userGroups: import('@/types/group').GroupApiResponse[];
    selectedGroupId: number | null;
    isDark: boolean;
    accent: string;
    c: Colors;
    onClose: () => void;
    onSelect: (groupId: number) => void;
}> = ({ visible, userGroups, selectedGroupId, isDark, accent, c, onClose, onSelect }) => {
    const insets = useSafeAreaInsets();
    const screenHeight = Dimensions.get('window').height;
    const translateY = useRef(new Animated.Value(screenHeight)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    const closeModal = useCallback(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: screenHeight,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => onClose());
    }, [backdropOpacity, onClose, screenHeight, translateY]);

    React.useEffect(() => {
        if (!visible) return;
        translateY.setValue(screenHeight);
        backdropOpacity.setValue(0);
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                damping: 22,
                stiffness: 180,
                mass: 0.9,
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [backdropOpacity, screenHeight, translateY, visible]);

    // PanResponder for swipe-down-to-dismiss on handle area ONLY
    const panResponder = useMemo(
        () => PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                const dismissThreshold = (screenHeight - insets.top) * 0.25;
                if (gestureState.dy > dismissThreshold || gestureState.vy > 0.5) {
                    closeModal();
                    return;
                }
                Animated.spring(translateY, {
                    toValue: 0,
                    damping: 22,
                    stiffness: 200,
                    mass: 0.8,
                    useNativeDriver: true,
                }).start();
            },
        }),
        [closeModal, screenHeight, insets.top, translateY]
    );

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={closeModal}
        >
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.45)',
                        opacity: backdropOpacity,
                    },
                ]}
            />
            <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={closeModal}
            />

            <Animated.View
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    marginTop: insets.top,
                    backgroundColor: c.card,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    paddingBottom: insets.bottom || 16,
                    height: screenHeight - insets.top,
                    transform: [{ translateY }],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 16,
                }}
            >
                {/* Draggable handle — PanResponder captures here */}
                <View
                    {...panResponder.panHandlers}
                    style={{ height: 36, justifyContent: 'center', alignItems: 'center', paddingVertical: 8 }}
                >
                    <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: c.inputBorder }} />
                </View>

                <View
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.cardBorder }}
                >
                    <TouchableOpacity
                        onPress={closeModal}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityLabel="Close"
                    >
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' }}>
                            <Feather name="arrow-left" size={18} color={c.text} />
                        </View>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, fontFamily: 'Kanit-Bold', color: c.text }}>Select Group</Text>
                    <View style={{ width: 36 }} />
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 20, gap: 12 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {userGroups.map((item) => {
                        const isSel = item.groupId === selectedGroupId;
                        return (
                            <TouchableOpacity
                                key={item.groupId.toString()}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 14,
                                    borderRadius: 14,
                                    backgroundColor: isSel ? hexToRgba(accent, 0.1) : isDark ? '#222' : '#f8f9fa',
                                    borderWidth: 1,
                                    borderColor: isSel ? accent : 'transparent'
                                }}
                                onPress={() => onSelect(item.groupId)}
                            >
                                <View
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: item.bg || hexToRgba(accent, 0.2),
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginRight: 14
                                    }}
                                >
                                    {item.icon ? (
                                        <Feather
                                            name={item.icon as any}
                                            size={20}
                                            color={item.color || accent}
                                        />
                                    ) : (
                                        <Text style={{ fontFamily: 'Kanit-Bold', color: item.color || accent }}>{item.groupName.charAt(0)}</Text>
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, fontFamily: 'Kanit-Bold', color: c.text }}>{item.groupName}</Text>
                                    <Text style={{ fontSize: 13, fontFamily: 'Kanit-Regular', color: c.placeholder }}>{item.members?.length ?? 0} members</Text>
                                </View>
                                {isSel && (
                                    <Feather
                                        name="check-circle"
                                        size={20}
                                        color={accent}
                                    />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </Animated.View>
        </Modal>
    );
};


// Assignee Modal
const AssigneeModal: React.FC<{
    visible: boolean; selected: EventUser[];
    availableUsers: EventUser[];
    isDark: boolean; accent: string; c: Colors;
    onClose: () => void; onToggle: (u: EventUser) => void;
}> = ({ visible, selected, availableUsers, accent, c, onClose, onToggle }) => {
    const [query, setQuery] = useState('');
    const filtered = availableUsers.filter(u =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.username.toLowerCase().includes(query.toLowerCase())
    );
    const isSel = (u: EventUser) => selected.some(s => s.userId === u.userId);

    return (
        <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
            <TouchableOpacity style={asm.backdrop} activeOpacity={1} onPress={onClose} />
            <View style={[asm.sheet, { backgroundColor: c.card }]}>
                <View style={[asm.handle, { backgroundColor: c.wheelLine }]} />
                <View style={[asm.header, { borderBottomColor: c.divider }]}>
                    <Text style={[asm.title, { color: c.text }]}>Assign People</Text>
                    <TouchableOpacity onPress={onClose} style={[asm.closeBtn, { backgroundColor: c.input }]}>
                        <Feather name="x" size={18} color={c.label} />
                    </TouchableOpacity>
                </View>
                <View style={[asm.searchWrap, { backgroundColor: c.searchBg, margin: 16, marginBottom: 8 }]}>
                    <Feather name="search" size={16} color={c.label} />
                    <TextInput
                        style={[asm.searchInput, { color: c.text }]}
                        value={query} onChangeText={setQuery}
                        placeholder="Search name or username…" placeholderTextColor={c.placeholder}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <Feather name="x-circle" size={16} color={c.label} />
                        </TouchableOpacity>
                    )}
                </View>
                {selected.length > 0 && (
                    <View style={[asm.badge, { backgroundColor: hexToRgba(accent, 0.12), marginHorizontal: 16, marginBottom: 8 }]}>
                        <Feather name="users" size={13} color={accent} />
                        <Text style={[asm.badgeTxt, { color: accent }]}>
                            {selected.length} {selected.length === 1 ? 'person' : 'people'} selected
                        </Text>
                    </View>
                )}
                <FlatList
                    data={filtered}
                    keyExtractor={u => String(u.userId)}
                    style={{ maxHeight: 320 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item: user, index: i }) => {
                        const sel = isSel(user);
                        return (
                            <TouchableOpacity
                                style={[asm.row, { borderBottomColor: c.divider }, sel && { backgroundColor: hexToRgba(accent, 0.07) }]}
                                onPress={() => onToggle(user)} activeOpacity={0.7}
                            >
                                <UserAvatar user={user} index={i} size={42} />
                                <View style={{ flex: 1, gap: 2 }}>
                                    <Text style={[asm.rowName, { color: c.text }]}>{user.name}</Text>
                                    <Text style={[asm.rowUser, { color: c.label }]}>@{user.username}</Text>
                                </View>
                                <View style={[asm.checkbox, sel ? { backgroundColor: accent, borderColor: accent } : { backgroundColor: 'transparent', borderColor: c.inputBorder }]}>
                                    {sel && <Feather name="check" size={13} color="#fff" />}
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
                <TouchableOpacity
                    style={[asm.doneBtn, { backgroundColor: accent, shadowColor: accent, marginHorizontal: 16, marginTop: 12 }]}
                    onPress={onClose} activeOpacity={0.85}
                >
                    <Text style={asm.doneTxt}>Done</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};
const asm = StyleSheet.create({
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        paddingBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 20
    },
    handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
    title: { fontSize: 18, fontFamily: 'Kanit-Bold' },
    closeBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
    searchWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    searchInput: { flex: 1, fontSize: 15, fontFamily: 'Kanit-Regular', padding: 0 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
    badgeTxt: { fontSize: 13, fontFamily: 'Kanit-Bold' },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, gap: 14, borderBottomWidth: 1 },
    rowName: { fontSize: 15, fontFamily: 'Kanit-Bold' },
    rowUser: { fontSize: 12, fontFamily: 'Kanit-Regular' },
    checkbox: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    doneBtn: { paddingVertical: 15, borderRadius: 16, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
    doneTxt: { fontSize: 16, fontFamily: 'Kanit-Bold', color: '#fff' }
});

// Main Screen  (default export — required by Expo Router)
export default function EventCreateScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ date?: string; event?: string; groupId?: string }>();
    const { groups, selectedGroupId } = useGroupStore();

    const fallbackGroupId = useMemo<number | null>(() => {
        if (selectedGroupId) return selectedGroupId;
        return groups.length > 0 ? groups[0].groupId : null;
    }, [groups, selectedGroupId]);

    const existingEvent = useMemo<CalendarEvent | null>(() => {
        try { return params.event ? JSON.parse(params.event as string) : null; }
        catch { return null; }
    }, [params.event]);
    const isEditing = !!existingEvent;

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
        const parsedParamGroupId = params.groupId !== undefined ? Number(params.groupId) : null;
        const routeGroupId = parsedParamGroupId !== null && !Number.isNaN(parsedParamGroupId) ? parsedParamGroupId : null;

        return {
            ...DEFAULT_EVENT_FORM,
            startDate: dateStr,
            endDate: dateStr,
            groupId: routeGroupId ?? fallbackGroupId,
        };
    }, [existingEvent, params.date, params.groupId, fallbackGroupId]);

    const { user: authUser } = useAuthStore();
    const [formData, setFormData] = useState<EventFormData>(initialForm);
    const [assignees, setAssignees] = useState<EventUser[]>(() => {
        if (existingEvent?.assignees) return existingEvent.assignees;
        if (authUser) {
            return [
                {
                    userId: authUser.id,
                    name: authUser.name || authUser.email?.split('@')[0] || 'Me',
                    username: authUser.email?.split('@')[0] || '',
                    imageUrl: authUser.photoUrl || null
                }
            ];
        }
        return [];
    });
    const [showAssignees, setShowAssignees] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<EventUser[]>([]);

    // New states for Group Selection
    const [userGroups, setUserGroups] = useState<import('@/types/group').GroupApiResponse[]>([]);
    const [showGroupPicker, setShowGroupPicker] = useState(false);

    // Fetch user's groups on mount
    React.useEffect(() => {
        const fetchGroups = async () => {
            console.log('params.groupId: ', params.groupId);
            if (!authUser) return;
            try {
                const { getGroupsAllByUserId } = await import('@/services/groupService');
                const groupsFromApi = await getGroupsAllByUserId(authUser.id);
                setUserGroups(groupsFromApi);

                // If route has no groupId, prefer group from store and fallback to first API group.
                if (!isEditing && params.groupId === undefined && groupsFromApi.length > 0) {
                    setFormData(prev => {
                        if (prev.groupId) return prev;
                        return { ...prev, groupId: fallbackGroupId ?? groupsFromApi[0].groupId };
                    });
                }
            } catch (err) {
                console.error('Failed to load user groups:', err);
            }
        };
        fetchGroups();
    }, [authUser, isEditing, params.groupId, fallbackGroupId]);

    // Fetch members when selected group changes
    React.useEffect(() => {
        const fetchGroupMembers = async () => {
            if (!formData.groupId) {
                setAvailableUsers([]);
                return;
            }
            try {
                const { getUserInGroupsByGroupId } = await import('@/services/groupService');
                const users = await getUserInGroupsByGroupId(formData.groupId);
                const uniqueMembersMap = new Map<number, EventUser>();
                users.forEach((m: any) => {
                    if (!uniqueMembersMap.has(m.userId)) {
                        uniqueMembersMap.set(m.userId, {
                            userId: m.userId,
                            name: m.name || m.initialText || '',
                            username: m.username || '',
                            imageUrl: m.imageUrl || m.picture_url || null
                        });
                    }
                });
                setAvailableUsers(Array.from(uniqueMembersMap.values()));
            } catch (err) {
                console.error('Failed to load group members:', err);
            }
        };

        fetchGroupMembers();
    }, [formData.groupId]);

    type ActivePicker = 'startDate' | 'endDate' | 'startTime' | 'endTime' | null;
    const [activePicker, setActivePicker] = useState<ActivePicker>(null);

    const c = useMemo(() => buildColors(isDark), [isDark]);
    const accent = formData.color || '#2ecc71';

    const updateField = useCallback(<K extends keyof EventFormData>(key: K, value: EventFormData[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    }, []);

    const toggleAssignee = useCallback((user: EventUser) => {
        setAssignees(prev =>
            prev.some(u => u.userId === user.userId)
                ? prev.filter(u => u.userId !== user.userId)
                : [...prev, user]
        );
    }, []);

    const pickerKind: PickerKind = (activePicker === 'startTime' || activePicker === 'endTime') ? 'time' : 'date';
    const pickerValue = useMemo(() => {
        if (activePicker === 'startDate') return formData.startDate;
        if (activePicker === 'endDate') return formData.endDate;
        if (activePicker === 'startTime') return formData.startTime;
        if (activePicker === 'endTime') return formData.endTime;
        return '';
    }, [activePicker, formData]);

    const handlePickerConfirm = useCallback((val: string) => {
        if (activePicker === 'startDate') updateField('startDate', val);
        if (activePicker === 'endDate') updateField('endDate', val);
        if (activePicker === 'startTime') updateField('startTime', val);
        if (activePicker === 'endTime') updateField('endTime', val);
        setActivePicker(null);
    }, [activePicker, updateField]);

    const dispStartDate = dayjs(formData.startDate).isValid() ? dayjs(formData.startDate).format('ddd, D MMM YYYY') : '—';
    const dispEndDate = dayjs(formData.endDate).isValid() ? dayjs(formData.endDate).format('ddd, D MMM YYYY') : '—';
    const dispStartTime = formData.startTime || '—';
    const dispEndTime = formData.endTime || '—';

    const handleSave = useCallback(async () => {
        if (!formData.title.trim()) { Alert.alert('Error', 'Please enter a title'); return; }
        try {
            const { createEvent, updateEvent } = await import('@/services/eventService');
            const { buildEventFormData } = await import('@/utils/calendar-helpers');
            const { DEFAULT_USER_ID } = await import('@/constants/Calendar');
            const { useAuthStore } = await import('@/stores/useAuthStore');

            const authUserId = useAuthStore.getState().user?.id ?? DEFAULT_USER_ID;
            const targetUserId = existingEvent?.userId ?? authUserId;

            // เพิ่ม assigneeIds ลงใน formData ก่อน build
            const assigneeIds = assignees.map(a => a.userId);
            const formDataWithAssignees = { ...formData, assignees: assigneeIds };

            const fd = buildEventFormData(formDataWithAssignees as any, targetUserId, existingEvent ? existingEvent.eventId : null);
            if (existingEvent) {
                await updateEvent(existingEvent.eventId, targetUserId, fd as unknown as FormData);
                Alert.alert('Success', 'Event updated!', [{ text: 'OK', onPress: () => router.back() }]);
            } else {
                await createEvent(fd as unknown as FormData);
                Alert.alert('Success', 'Event created!', [{ text: 'OK', onPress: () => router.back() }]);
            }
        } catch (error: any) {
            console.error('Save event error:', error?.response?.data || error.message || error);
            const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error.message || 'Unknown error occurred';
            Alert.alert('Error', `Failed to save event: ${errorMsg}`);
        }
    }, [formData, existingEvent, assignees, router]);

    return (
        <View style={[s.root, { backgroundColor: c.bg }]}>
            <ScreenHeader
                title={isEditing ? 'Edit Event' : 'New Event'}
                actions={[
                    {
                        icon: 'x',
                        onPress: () => router.back(),
                        accessibilityLabel: 'Close',
                    },
                ]}
            />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Accent strip */}
                    <View style={[s.accentStrip, { backgroundColor: hexToRgba(accent, 0.12) }]}>
                        <View style={[s.accentDot, { backgroundColor: accent, shadowColor: accent }]} />
                        <Text style={[s.accentLbl, { color: isDark ? '#bbb' : '#555' }]}>
                            {isEditing ? 'Editing event' : 'Creating new event'}
                        </Text>
                    </View>

                    {/* ── Basic Info ── */}
                    <View style={[s.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                        <SectionHeader icon="edit-3" title="Basic Info" accent={accent} isDark={isDark} />
                        <Text style={[s.lbl, { color: c.label }]}>Group *</Text>
                        <TouchableOpacity
                            style={[s.inputRow, { backgroundColor: c.input, borderColor: c.inputBorder, marginBottom: 14 }]}
                            onPress={() => setShowGroupPicker(true)}
                        >
                            <Feather name="users" size={16} color={c.label} />
                            <Text style={[s.inputRowTxt, { color: formData.groupId ? c.inputText : c.placeholder }]}>
                                {userGroups.find(g => g.groupId === formData.groupId)?.groupName || 'Select a Group'}
                            </Text>
                            <Feather name="chevron-down" size={18} color={c.placeholder} style={{ position: 'absolute', right: 14 }} />
                        </TouchableOpacity>

                        <Text style={[s.lbl, { color: c.label }]}>Title *</Text>
                        <TextInput
                            style={[s.input, { backgroundColor: c.input, borderColor: c.inputBorder, color: c.inputText }]}
                            value={formData.title} onChangeText={v => updateField('title', v)}
                            placeholder="Enter event title" placeholderTextColor={c.placeholder}
                        />
                        <Text style={[s.lbl, { color: c.label, marginTop: 14 }]}>Location</Text>
                        <View style={[s.inputRow, { backgroundColor: c.input, borderColor: c.inputBorder }]}>
                            <Feather name="map-pin" size={16} color={c.label} />
                            <TextInput style={[s.inputRowTxt, { color: c.inputText }]}
                                value={formData.location || ''} onChangeText={v => updateField('location', v)}
                                placeholder="Add location" placeholderTextColor={c.placeholder} />
                        </View>
                        <Text style={[s.lbl, { color: c.label, marginTop: 14 }]}>Description</Text>
                        <TextInput
                            style={[s.input, s.textarea, { backgroundColor: c.input, borderColor: c.inputBorder, color: c.inputText }]}
                            value={formData.description} onChangeText={v => updateField('description', v)}
                            placeholder="Add description…" placeholderTextColor={c.placeholder}
                            multiline numberOfLines={3} textAlignVertical="top"
                        />
                    </View>

                    {/* ── Date & Time ── */}
                    <View style={[s.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                        <SectionHeader icon="clock" title="Date & Time" accent={accent} isDark={isDark} />
                        <View style={[s.toggleRow, { backgroundColor: c.input, borderColor: c.inputBorder }]}>
                            <View style={s.toggleLeft}>
                                <View style={[s.toggleIcon, { backgroundColor: hexToRgba(accent, 0.15) }]}>
                                    <Feather name="sun" size={14} color={accent} />
                                </View>
                                <Text style={[s.toggleLbl, { color: c.text }]}>All Day</Text>
                            </View>
                            <Switch value={!!formData.isAllDay} onValueChange={v => updateField('isAllDay', v)}
                                trackColor={{ false: c.inputBorder, true: hexToRgba(accent, 0.5) }}
                                thumbColor={formData.isAllDay ? accent : (isDark ? '#555' : '#ddd')} />
                        </View>
                        <View style={[s.toggleRow, { backgroundColor: c.input, borderColor: c.inputBorder, marginTop: 10 }]}>
                            <View style={s.toggleLeft}>
                                <View style={[s.toggleIcon, { backgroundColor: hexToRgba('#f39c12', 0.15) }]}>
                                    <Feather name="bookmark" size={14} color="#f39c12" />
                                </View>
                                <Text style={[s.toggleLbl, { color: c.text }]}>Pin to Top 📌</Text>
                            </View>
                            <Switch value={!!formData.pinned} onValueChange={v => updateField('pinned', v)}
                                trackColor={{ false: c.inputBorder, true: hexToRgba('#f39c12', 0.5) }}
                                thumbColor={formData.pinned ? '#f39c12' : (isDark ? '#555' : '#ddd')} />
                        </View>
                        <View style={s.dtRow}>
                            <DateTrigger icon="calendar" label="Start Date" value={dispStartDate}
                                onPress={() => setActivePicker('startDate')} accent={accent} c={c} />
                            <DateTrigger icon="calendar" label="End Date" value={dispEndDate}
                                onPress={() => setActivePicker('endDate')} accent={accent} c={c} />
                        </View>
                        {!formData.isAllDay && (
                            <View style={s.dtRow}>
                                <DateTrigger icon="clock" label="Start Time" value={dispStartTime}
                                    onPress={() => setActivePicker('startTime')} accent={accent} c={c} />
                                <DateTrigger icon="clock" label="End Time" value={dispEndTime}
                                    onPress={() => setActivePicker('endTime')} accent={accent} c={c} />
                            </View>
                        )}
                    </View>

                    {/* ── Appearance ── */}
                    <View style={[s.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                        <SectionHeader icon="droplet" title="Appearance" accent={accent} isDark={isDark} />
                        <Text style={[s.lbl, { color: c.label }]}>Color</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={s.colorRow}>
                                {EVENT_COLORS.map(co => {
                                    const sel = formData.color === co.solid;
                                    return (
                                        <TouchableOpacity key={co.solid}
                                            style={[s.colorCircle, { backgroundColor: co.solid }, sel && [s.colorCircleSel, { borderColor: co.solid, shadowColor: co.solid }]]}
                                            onPress={() => updateField('color', co.solid)} activeOpacity={0.8}>
                                            {sel && <Feather name="check" size={16} color="#fff" />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                        <Text style={[s.lbl, { color: c.label, marginTop: 14 }]}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={s.chipRow}>
                                {CATEGORIES.map(cat => {
                                    const sel = formData.category === cat;
                                    return (
                                        <TouchableOpacity key={cat}
                                            style={[s.chip, { borderColor: sel ? accent : c.inputBorder, backgroundColor: sel ? hexToRgba(accent, 0.15) : c.input }]}
                                            onPress={() => updateField('category', cat)} activeOpacity={0.7}>
                                            <Text style={[s.chipTxt, { color: sel ? accent : c.label, fontFamily: sel ? 'Kanit-Bold' : 'Kanit-Regular' }]}>{cat}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                        <Text style={[s.lbl, { color: c.label, marginTop: 14 }]}>Priority</Text>
                        <View style={s.priorityRow}>
                            {(['low', 'medium', 'high'] as EventPriority[]).map(p => {
                                const meta = PRIORITY_COLORS[p];
                                const sel = formData.priority === p;
                                const icn: Record<EventPriority, string> = { low: 'check-circle', medium: 'minus-circle', high: 'alert-circle' };
                                return (
                                    <TouchableOpacity key={p}
                                        style={[s.priorityBtn, { borderColor: sel ? meta.solid : c.inputBorder, backgroundColor: sel ? meta.solid : c.input }]}
                                        onPress={() => updateField('priority', p)} activeOpacity={0.7}>
                                        <Feather name={icn[p] as any} size={15} color={sel ? '#fff' : meta.solid} />
                                        <Text style={[s.priorityTxt, { color: sel ? '#fff' : c.text }]}>
                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* ── Assignees ── */}
                    <View style={[s.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                        <SectionHeader icon="users" title="Assignees" accent={accent} isDark={isDark} />
                        {assignees.length > 0 ? (
                            <View style={s.aChips}>
                                {assignees.map((u, i) => (
                                    <View key={u.userId}
                                        style={[s.aChip, { backgroundColor: hexToRgba(avatarBg(i), 0.12), borderColor: hexToRgba(avatarBg(i), 0.35) }]}>
                                        <UserAvatar user={u} index={i} size={22} />
                                        <Text style={[s.aChipTxt, { color: c.text }]}>{u.name.split(' ')[0]}</Text>
                                        <TouchableOpacity onPress={() => toggleAssignee(u)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                            <Feather name="x" size={13} color={c.label} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={[s.aEmpty, { color: c.placeholder }]}>No one assigned yet</Text>
                        )}
                        <TouchableOpacity
                            style={[s.aAddBtn, { borderColor: accent, backgroundColor: hexToRgba(accent, 0.08) }]}
                            onPress={() => setShowAssignees(true)} activeOpacity={0.75}>
                            <Feather name="user-plus" size={16} color={accent} />
                            <Text style={[s.aAddTxt, { color: accent }]}>
                                {assignees.length > 0 ? 'Manage Assignees' : 'Assign People'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Notification ── */}
                    <View style={[s.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                        <SectionHeader icon="bell" title="Notification" accent={accent} isDark={isDark} />
                        <Text style={[s.lbl, { color: c.label }]}>Remind before</Text>
                        <View style={s.notifRow}>
                            <TextInput
                                style={[s.input, s.smallNum, { backgroundColor: c.input, borderColor: c.inputBorder, color: c.inputText }]}
                                value={formData.remindBeforeValue?.toString() || ''} onChangeText={v => updateField('remindBeforeValue', v)}
                                keyboardType="numeric" placeholder="15" placeholderTextColor={c.placeholder}
                            />
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                                <View style={s.chipRow}>
                                    {(['MINUTES', 'HOURS', 'DAYS', 'WEEKS'] as const).map(unit => {
                                        const sel = formData.remindBeforeUnit === unit;
                                        return (
                                            <TouchableOpacity key={unit}
                                                style={[s.chip, { borderColor: sel ? accent : c.inputBorder, backgroundColor: sel ? hexToRgba(accent, 0.15) : c.input }]}
                                                onPress={() => updateField('remindBeforeUnit', unit)}>
                                                <Text style={[s.chipTxt, { color: sel ? accent : c.label, fontFamily: sel ? 'Kanit-Bold' : 'Kanit-Regular' }]}>{unit.toLowerCase()}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        </View>
                    </View>

                    {/* ── Repeat ── */}
                    <View style={[s.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                        <SectionHeader icon="repeat" title="Repeat" accent={accent} isDark={isDark} />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={s.chipRow}>
                                {(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'] as const).map(type => {
                                    const sel = formData.repeatType === type;
                                    return (
                                        <TouchableOpacity key={type}
                                            style={[s.chip, { borderColor: sel ? accent : c.inputBorder, backgroundColor: sel ? hexToRgba(accent, 0.15) : c.input }]}
                                            onPress={() => updateField('repeatType', type)}>
                                            <Text style={[s.chipTxt, { color: sel ? accent : c.label, fontFamily: sel ? 'Kanit-Bold' : 'Kanit-Regular' }]}>
                                                {type.charAt(0) + type.slice(1).toLowerCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                        {formData.repeatType !== 'NONE' && (
                            <View style={[s.repeatExtra, { backgroundColor: c.input, borderColor: c.inputBorder }]}>
                                <View style={s.repeatRow}>
                                    <Text style={[s.repeatLbl, { color: c.label }]}>Every</Text>
                                    <TextInput
                                        style={[s.input, s.smallNum, { backgroundColor: c.card, borderColor: c.inputBorder, color: c.inputText }]}
                                        value={formData.repeatInterval?.toString() || ''} onChangeText={v => updateField('repeatInterval', v)}
                                        keyboardType="numeric" placeholder="1" placeholderTextColor={c.placeholder}
                                    />
                                    <Text style={[s.repeatLbl, { color: c.text }]}>
                                        {formData.repeatType === 'DAILY' ? 'Days' : formData.repeatType === 'WEEKLY' ? 'Weeks' : formData.repeatType === 'MONTHLY' ? 'Months' : 'Years'}
                                    </Text>
                                </View>
                                <View style={[s.repeatRow, { marginTop: 10 }]}>
                                    <Text style={[s.repeatLbl, { color: c.label }]}>Until</Text>
                                    <TouchableOpacity
                                        style={[dtb.wrap, { flex: 1, backgroundColor: c.card, borderColor: c.inputBorder }]}
                                        onPress={() => setActivePicker('endDate')} activeOpacity={0.75}>
                                        <Feather name="calendar" size={15} color={c.label} />
                                        <Text style={[s.repeatLbl, { color: c.inputText, flex: 1 }]}>
                                            {formData.repeatUntil || 'No end date'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Bottom buttons */}
                    <View style={s.bottomBtns}>
                        <TouchableOpacity style={[s.btnCancel, { borderColor: c.inputBorder, backgroundColor: c.card }]} onPress={() => router.back()} activeOpacity={0.8}>
                            <Text style={[s.btnCancelTxt, { color: c.label }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.btnSave, { backgroundColor: accent, shadowColor: accent }]} onPress={handleSave} activeOpacity={0.8}>
                            <Feather name={isEditing ? 'check-circle' : 'plus-circle'} size={18} color="#fff" />
                            <Text style={s.btnSaveTxt}>{isEditing ? 'Update Event' : 'Create Event'}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Date/Time picker modal */}
            {activePicker !== null && (
                <DTPickerModal
                    visible
                    kind={pickerKind}
                    value={pickerValue}
                    isDark={isDark}
                    accent={accent}
                    c={c}
                    onConfirm={handlePickerConfirm}
                    onCancel={() => setActivePicker(null)}
                />
            )}

            {/* Group Picker Modal */}
            <GroupPickerModal
                visible={showGroupPicker}
                userGroups={userGroups}
                selectedGroupId={formData.groupId}
                isDark={isDark}
                accent={accent}
                c={c}
                onClose={() => setShowGroupPicker(false)}
                onSelect={(groupId) => {
                    updateField('groupId', groupId);
                    setShowGroupPicker(false);
                }}
            />

            {/* Assignee modal */}
            <AssigneeModal
                visible={showAssignees}
                selected={assignees}
                availableUsers={availableUsers}
                isDark={isDark}
                accent={accent}
                c={c}
                onClose={() => setShowAssignees(false)}
                onToggle={toggleAssignee}
            />
        </View>
    );
}

// Styles
const s = StyleSheet.create({
    root: { flex: 1 },
    scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
    accentStrip: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 2 },
    accentDot: { width: 12, height: 12, borderRadius: 6, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 3 },
    accentLbl: { fontSize: 13, fontFamily: 'Kanit-Regular' },
    card: { borderRadius: 18, padding: 18, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
    lbl: { fontSize: 11, fontFamily: 'Kanit-Bold', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
    input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Kanit-Regular' },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
    inputRowTxt: { flex: 1, fontSize: 15, fontFamily: 'Kanit-Regular', padding: 0 },
    textarea: { height: 90, textAlignVertical: 'top', paddingTop: 12 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10 },
    toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    toggleIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    toggleLbl: { fontSize: 15, fontFamily: 'Kanit-Regular' },
    dtRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
    colorRow: { flexDirection: 'row', gap: 12, paddingVertical: 8 },
    colorCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'transparent' },
    colorCircleSel: { borderWidth: 3, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6, transform: [{ scale: 1.12 }] },
    chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4, flexWrap: 'wrap' },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
    chipTxt: { fontSize: 12, fontFamily: 'Kanit-Regular' },
    priorityRow: { flexDirection: 'row', gap: 10 },
    priorityBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5 },
    priorityTxt: { fontSize: 13, fontFamily: 'Kanit-Regular' },
    aChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    aChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
    aChipTxt: { fontSize: 13, fontFamily: 'Kanit-Bold' },
    aEmpty: { fontSize: 14, fontFamily: 'Kanit-Regular', marginBottom: 12, marginTop: 2 },
    aAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed' },
    aAddTxt: { fontSize: 14, fontFamily: 'Kanit-Bold' },
    notifRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
    smallNum: { width: 64, textAlign: 'center', paddingHorizontal: 10 },
    repeatExtra: { marginTop: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
    repeatRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    repeatLbl: { fontSize: 13, fontFamily: 'Kanit-Regular' },
    bottomBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
    btnCancel: { flex: 1, paddingVertical: 15, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
    btnCancelTxt: { fontSize: 15, fontFamily: 'Kanit-Bold' },
    btnSave: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    btnSaveTxt: { fontSize: 15, fontFamily: 'Kanit-Bold', color: '#fff' },
});
