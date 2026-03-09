/**
 * Event Detail Screen — app/event/[id].tsx
 * Full-screen view of a single CalendarEvent.
 * Accessed by pushing router.push(`/event/${id}`) with the full event object as params.
 * Action buttons: Edit (navigates back + opens form) | Delete
 */

import React, { useMemo, useCallback, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    Modal,
    Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { useTheme } from '@/components/ThemeProvider';
import { useEventActionStore } from '@/stores/useEventActionStore';
import type { CalendarEvent, EventUser } from '@/types/event';

const hexToRgba = (hex: string, alpha: number) => {
    const c = hex?.startsWith('#') ? hex : '#2ecc71';
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
};

const AVATAR_COLORS = ['#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f39c12', '#1abc9c'];
const avatarBg = (i: number) => AVATAR_COLORS[i % AVATAR_COLORS.length];
const getInitial = (u: EventUser) => (u.name || u.username || '?').trim().charAt(0).toUpperCase();

const PRIORITY_META: Record<string, { label: string; icon: keyof typeof Feather.glyphMap; color: string; bg: string }> = {
    high:   { label: 'High',   icon: 'alert-circle',  color: '#e74c3c', bg: '#fdecea' },
    medium: { label: 'Medium', icon: 'minus-circle',  color: '#f39c12', bg: '#fef6e4' },
    low:    { label: 'Low',    icon: 'check-circle',  color: '#2ecc71', bg: '#eafaf1' },
};

const PRIORITY_META_DARK: Record<string, { bg: string }> = {
    high:   { bg: '#3a1212' },
    medium: { bg: '#3a2a00' },
    low:    { bg: '#0d2b1a' },
};

// Avatar
const UserAvatar: React.FC<{ user: EventUser; index: number; size?: number }> = ({ user, index, size = 40 }) => {
    const bg = avatarBg(index);
    const r  = size / 2;
    if (user.imageUrl) {
        return <Image source={{ uri: user.imageUrl }} style={{ width: size, height: size, borderRadius: r }} />;
    }
    return (
        <View style={[avStyle.base, { width: size, height: size, borderRadius: r, backgroundColor: bg }]}>
            <Text style={[avStyle.text, { fontSize: size * 0.4 }]}>{getInitial(user)}</Text>
        </View>
    );
};

const avStyle = StyleSheet.create({
    base: { justifyContent: 'center', alignItems: 'center' },
    text: { fontFamily: 'Kanit-Bold', color: '#fff' },
});


// Info Row
const InfoRow: React.FC<{
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value: string;
    accent: string;
    isDark: boolean;
    multiline?: boolean;
}> = ({ icon, label, value, accent, isDark, multiline }) => {
    const bg      = isDark ? '#222' : '#f7f9fc';
    const labelC  = isDark ? '#888' : '#8e9aad';
    const valueC  = isDark ? '#e5e5e5' : '#1a1a2e';
    return (
        <View style={[rowStyle.wrap, { backgroundColor: bg }]}>
            <View style={[rowStyle.iconBox, { backgroundColor: hexToRgba(accent, 0.15) }]}>
                <Feather name={icon} size={17} color={accent} />
            </View>
            <View style={rowStyle.body}>
                <Text style={[rowStyle.label, { color: labelC }]}>{label.toUpperCase()}</Text>
                <Text style={[rowStyle.value, { color: valueC }]} numberOfLines={multiline ? undefined : 4}>
                    {value}
                </Text>
            </View>
        </View>
    );
};
const rowStyle = StyleSheet.create({
    wrap:    { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, padding: 14, gap: 14, marginBottom: 10 },
    iconBox: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    body:    { flex: 1, gap: 4 },
    label:   { fontSize: 10, fontFamily: 'Kanit-Regular', letterSpacing: 0.8 },
    value:   { fontSize: 15, fontFamily: 'Kanit-Bold', lineHeight: 22 },
});

const EventDetailScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ event: string }>();
    const { requestDelete } = useEventActionStore();
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
    const moreButtonRef = useRef<View>(null);

    // The whole CalendarEvent is passed as a JSON string via router param
    const event = useMemo<CalendarEvent | null>(() => {
        try { return params.event ? JSON.parse(params.event as string) : null; }
        catch { return null; }
    }, [params.event]);

    const accent = event?.color || '#2ecc71';

    const bg        = isDark ? '#111111' : '#f4f6f9';
    const titleC    = isDark ? '#f2f2f2' : '#1a1a2e';
    const subC      = isDark ? '#888'    : '#8e9aad';
    const divider   = isDark ? '#2a2a2a' : '#eef0f4';
    const headerBg  = isDark ? hexToRgba(accent, 0.14) : hexToRgba(accent, 0.08);
    const navBg     = isDark ? '#1a1a1a' : '#ffffff';

    const handleBack = useCallback(() => router.back(), [router]);

    const openMenu = useCallback(() => {
        moreButtonRef.current?.measure((_fx, _fy, _w, _h, px, py) => {
            setMenuPos({ top: py + _h + 4, right: 0 });
            setMenuVisible(true);
        });
    }, []);

    const handleEdit = useCallback(() => {
        setMenuVisible(false);
        if (!event) return;
        router.push({
            pathname: '/event/create',
            params: { event: JSON.stringify(event) },
        });
    }, [event, router]);

    const handleDelete = useCallback(() => {
        setMenuVisible(false);
        if (!event) return;
        Alert.alert('Delete Event', `Are you sure you want to delete "${event.title}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    requestDelete(event);
                    router.back();
                }
            }
        ]);
    }, [event, requestDelete, router]);

    if (!event) {
        return (
            <View style={[styles.centered, { backgroundColor: bg }]}>
                <MaterialIcons
                    name="error-outline"
                    size={48}
                    color={subC}
                />
                <Text style={[styles.notFoundText, { color: subC }]}>Event not found</Text>
                <TouchableOpacity
                    onPress={handleBack}
                    style={[styles.backBtn, { backgroundColor: accent }]}
                >
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const startD = dayjs(event.startDate);
    const endD = dayjs(event.endDate);
    const sameDay = startD.isSame(endD, 'day');

    const dateStr = sameDay ? startD.format('ddd D MMMM YYYY') : `${startD.format('D MMM')} – ${endD.format('D MMM YYYY')}`;

    const timeStr = event.isAllDay ? 'All Day' : `${startD.format('HH:mm')} – ${endD.format('HH:mm')}`;

    const pm = event.priority ? PRIORITY_META[event.priority] : null;
    const pmDark = event.priority ? PRIORITY_META_DARK[event.priority] : null;
    const hasUsers = event.assignees && event.assignees.length > 0;

    // If createdBy is in assignees, do not show separately.
    const creatorInAssignees = event.createdBy
        ? (event.assignees ?? []).some((u) => u.userId === event.createdBy?.userId)
        : false;
    const showCreatedBySection = !!event.createdBy && !creatorInAssignees;

    return (
        <View style={[styles.root, { backgroundColor: bg }]}>
            {/* ── Custom Nav Bar ── */}
            <View style={[styles.navbar, { backgroundColor: navBg }]}>
                <TouchableOpacity
                    onPress={handleBack}
                    style={styles.navBtn}
                    activeOpacity={0.7}
                >
                    <Feather
                        name="arrow-left"
                        size={22}
                        color={isDark ? '#e5e5e5' : '#2c3e50'}
                    />
                </TouchableOpacity>
                <Text
                    style={[styles.navTitle, { color: isDark ? '#e5e5e5' : '#2c3e50' }]}
                    numberOfLines={1}
                >
                    Event Detail
                </Text>
                <View ref={moreButtonRef} collapsable={false}>
                    <TouchableOpacity
                        onPress={openMenu}
                        style={styles.navBtn}
                        activeOpacity={0.7}
                    >
                        <Feather
                            name="more-vertical"
                            size={22}
                            color={isDark ? '#e5e5e5' : '#2c3e50'}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Dropdown Menu Modal ── */}
            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
                    <View style={[
                        styles.menuContainer,
                        {
                            backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
                            shadowColor: '#000',
                            right: 12,
                            top: menuPos.top,
                        }
                    ]}>
                        {/* Edit */}
                        <TouchableOpacity
                            style={[styles.menuItem, { borderBottomWidth: 1, borderBottomColor: isDark ? '#3a3a3a' : '#f0f0f0' }]}
                            onPress={handleEdit}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.menuIconBox, { backgroundColor: hexToRgba(accent, 0.15) }]}>
                                <Feather name="edit-2" size={15} color={accent} />
                            </View>
                            <Text style={[styles.menuItemText, { color: isDark ? '#e5e5e5' : '#1a1a2e' }]}>Edit</Text>
                        </TouchableOpacity>
                        {/* Delete */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleDelete}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(231,76,60,0.15)' }]}>
                                <Feather name="trash-2" size={15} color="#e74c3c" />
                            </View>
                            <Text style={[styles.menuItemText, { color: '#e74c3c' }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero Header ── */}
                <View style={[styles.hero, { backgroundColor: headerBg }]}>
                    {/* Big color dot / avatar */}
                    {/*<View style={[styles.heroDot, { backgroundColor: accent, shadowColor: accent }]}>*/}
                    {/*    <Text style={styles.heroDotText}>*/}
                    {/*        {event.title.trim().charAt(0).toUpperCase()}*/}
                    {/*    </Text>*/}
                    {/*</View>*/}

                    {/* Title */}
                    <Text style={[styles.heroTitle, { color: titleC }]}>{event.title}</Text>

                    {/* Category + All-day pill */}
                    <View style={styles.heroPills}>
                        {event.category ? (
                            <View style={[styles.pill, { backgroundColor: hexToRgba(accent, 0.2) }]}>
                                <Text style={[styles.pillText, { color: accent }]}>{event.category}</Text>
                            </View>
                        ) : null}
                        {event.isAllDay ? (
                            <View style={[styles.pill, { backgroundColor: isDark ? '#1a3028' : '#eafaf1' }]}>
                                <Text style={[styles.pillText, { color: isDark ? '#2ecc71' : '#27ae60' }]}>All Day</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Created By — แสดงใต้ category เฉพาะเมื่อไม่อยู่ใน assignees */}
                    {showCreatedBySection && event.createdBy ? (
                        <View style={[styles.heroCreatedBy, { backgroundColor: hexToRgba(accent, 0.12) }]}>
                            <UserAvatar
                                user={event.createdBy}
                                index={0}
                                size={22}
                            />
                            <Text style={[styles.heroCreatedByText, { color: isDark ? '#ccc' : '#4a5568' }]}>
                                Created by <Text style={{ fontFamily: 'Kanit-Bold', color: accent }}>{event.createdBy.name || event.createdBy.username}</Text>
                            </Text>
                            <View style={[styles.heroOwnerBadge, { backgroundColor: hexToRgba(accent, 0.2) }]}>
                                <Feather
                                    name="shield"
                                    size={10}
                                    color={accent}
                                />
                                <Text style={[styles.heroOwnerText, { color: accent }]}>Owner</Text>
                            </View>
                        </View>
                    ) : null}
                </View>

                {/* ── Detail Rows ── */}
                <View style={styles.section}>
                    <InfoRow
                        icon="calendar"
                        label="Date"
                        value={dateStr}
                        accent={accent}
                        isDark={isDark}
                    />
                    <InfoRow
                        icon="clock"
                        label="Time"
                        value={timeStr}
                        accent={accent}
                        isDark={isDark}
                    />

                    {event.description ? (
                        <InfoRow
                            icon="file-text"
                            label="Description"
                            value={event.description}
                            accent={accent}
                            isDark={isDark}
                            multiline
                        />
                    ) : null}

                    {pm && (
                        <View style={[rowStyle.wrap, { backgroundColor: isDark ? '#222' : '#f7f9fc' }]}>
                            <View style={[rowStyle.iconBox, { backgroundColor: hexToRgba(pm.color, 0.15) }]}>
                                <Feather
                                    name={pm.icon}
                                    size={17}
                                    color={pm.color}
                                />
                            </View>
                            <View style={rowStyle.body}>
                                <Text style={[rowStyle.label, { color: subC }]}>PRIORITY</Text>
                                <View style={[styles.priorityBadge, { backgroundColor: isDark ? (pmDark?.bg ?? pm.bg) : pm.bg }]}>
                                    <View style={[styles.priorityDot, { backgroundColor: pm.color }]} />
                                    <Text style={[styles.priorityLabel, { color: pm.color }]}>{pm.label}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {event.reminder !== undefined && event.reminder > 0 ? (
                        <InfoRow
                            icon="bell"
                            label="Reminder"
                            value={`${event.reminder} min before`}
                            accent={accent}
                            isDark={isDark}
                        />
                    ) : null}
                </View>

                {/* ── Assignees ── */}
                {hasUsers && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: subC }]}>ASSIGNEES</Text>
                        <View style={[styles.assigneeCard, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
                            {(event.assignees ?? []).map((u, i) => {
                                const isOwner = event.createdBy?.userId === u.userId;
                                return (
                                    <View
                                        key={u.userId}
                                        style={[styles.assigneeRow, i < (event.assignees?.length ?? 0) - 1 && { borderBottomWidth: 1, borderBottomColor: divider }]}
                                    >
                                        <UserAvatar
                                            user={u}
                                            index={i}
                                            size={40}
                                        />
                                        <View style={styles.assigneeInfo}>
                                            <Text style={[styles.assigneeName, { color: titleC }]}>{u.name || u.username}</Text>
                                            {u.username ? <Text style={[styles.assigneeUsername, { color: subC }]}>@{u.username}</Text> : null}
                                        </View>
                                        {isOwner ? (
                                            <View style={[styles.ownerBadge, { backgroundColor: hexToRgba(accent, 0.18) }]}>
                                                <Feather
                                                    name="shield"
                                                    size={11}
                                                    color={accent}
                                                />
                                                <Text style={[styles.ownerBadgeText, { color: accent }]}>Owner</Text>
                                            </View>
                                        ) : (
                                            <View style={[styles.assigneeDot, { backgroundColor: avatarBg(i) }]} />
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    notFoundText: { fontSize: 16, fontFamily: 'Kanit-Regular' },
    backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    backBtnText: { fontFamily: 'Kanit-Bold', color: '#fff', fontSize: 15 },

    // Nav bar
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 4
    },
    navBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    navTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 17,
        fontFamily: 'Kanit-Bold'
    },

    // Scroll
    scrollContent: { paddingHorizontal: 16, paddingTop: 0 },

    // Hero
    hero: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
        marginHorizontal: -16,
        marginBottom: 20,
        gap: 12
    },
    // heroDot: {
    //     width: 80,
    //     height: 80,
    //     borderRadius: 40,
    //     justifyContent: 'center',
    //     alignItems: 'center',
    //     shadowOffset: { width: 0, height: 6 },
    //     shadowOpacity: 0.35,
    //     shadowRadius: 12,
    //     elevation: 10
    // },
    // heroDotText: { fontSize: 32, fontFamily: 'Kanit-Bold', color: '#fff' },
    heroTitle: { fontSize: 24, fontFamily: 'Kanit-Bold', textAlign: 'center', lineHeight: 32 },
    heroPills: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
    pill: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
    pillText: { fontSize: 12, fontFamily: 'Kanit-Bold' },

    // Created By (in Hero)
    heroCreatedBy: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        marginTop: 4,
    },
    heroCreatedByText: { fontSize: 13, fontFamily: 'Kanit-Regular' },
    heroOwnerBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
    },
    heroOwnerText: { fontSize: 10, fontFamily: 'Kanit-Bold' },
    // heroAccentBar: { width: 48, height: 4, borderRadius: 2, marginTop: 4 },

    // Sections
    section: { marginBottom: 20 },
    sectionTitle: {
        fontSize: 11,
        fontFamily: 'Kanit-Bold',
        letterSpacing: 1.2,
        marginBottom: 10,
        marginLeft: 4
    },

    // Priority
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10
    },
    priorityDot: { width: 8, height: 8, borderRadius: 4 },
    priorityLabel: { fontSize: 14, fontFamily: 'Kanit-Bold' },

    // Assignees
    assigneeCard: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2
    },
    assigneeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 14
    },
    assigneeInfo: { flex: 1, gap: 2 },
    assigneeName: { fontSize: 15, fontFamily: 'Kanit-Bold' },
    assigneeUsername: { fontSize: 12, fontFamily: 'Kanit-Regular' },
    assigneeDot: { width: 8, height: 8, borderRadius: 4 },
    ownerBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    },
    ownerBadgeText: { fontSize: 11, fontFamily: 'Kanit-Bold' },

    // Dropdown menu
    menuOverlay: {
        flex: 1,
    },
    menuContainer: {
        position: 'absolute',
        minWidth: 160,
        borderRadius: 14,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 13,
        gap: 12,
    },
    menuIconBox: {
        width: 32,
        height: 32,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 15,
        fontFamily: 'Kanit-Bold',
    },
});

export default EventDetailScreen;
