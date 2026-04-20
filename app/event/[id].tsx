/**
 * Event Detail Screen — app/event/[id].tsx
 * Full-screen view of a single CalendarEvent.
 * Accessed by pushing router.push(`/event/${id}`) with the full event object as params.
 * Action buttons: Edit (navigates back + opens form) | Delete
 */

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

import { useTheme } from '@/components/ThemeProvider';
import type { CalendarEvent, EventUser } from '@/types/event';
import ScreenHeader from '@/components/ScreenHeader';
import { getEventById, deleteEvent } from '@/services/eventService';

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
    high: { label: 'สูง', icon: 'alert-circle', color: '#e74c3c', bg: '#fdecea' },
    medium: { label: 'ปานกลาง', icon: 'minus-circle', color: '#f39c12', bg: '#fef6e4' },
    low: { label: 'ต่ำ', icon: 'check-circle', color: '#2ecc71', bg: '#eafaf1' },
};

const PRIORITY_META_DARK: Record<string, { bg: string }> = {
    high: { bg: '#3a1212' },
    medium: { bg: '#3a2a00' },
    low: { bg: '#0d2b1a' },
};

// Avatar
const UserAvatar: React.FC<{ user: EventUser; index: number; size?: number }> = ({ user, index, size = 40 }) => {
    const bg = avatarBg(index);
    const r = size / 2;
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
    const bg = isDark ? '#222' : '#f7f9fc';
    const labelC = isDark ? '#888' : '#8e9aad';
    const valueC = isDark ? '#e5e5e5' : '#1a1a2e';
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
    wrap: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, padding: 14, gap: 14, marginBottom: 10 },
    iconBox: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    body: { flex: 1, gap: 4 },
    label: { fontSize: 10, fontFamily: 'Kanit-Regular', letterSpacing: 0.8 },
    value: { fontSize: 15, fontFamily: 'Kanit-Bold', lineHeight: 22 },
});

const EventDetailScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ id: string; event?: string }>();

    // The whole CalendarEvent might be passed as a JSON string via router param initially
    const initialEvent = useMemo<CalendarEvent | null>(() => {
        try { return params.event ? JSON.parse(params.event as string) : null; }
        catch { return null; }
    }, [params.event]);

    const [event, setEvent] = useState<CalendarEvent | null>(initialEvent);
    const [loading, setLoading] = useState<boolean>(!initialEvent);

    useEffect(() => {
        const fetchEvent = async () => {
            if (!params.id) return;
            try {
                const response = await getEventById(Number(params.id));
                if (response.data && response.data.data) {
                    setEvent(response.data.data);
                } else if (response.data) {
                    setEvent(response.data); // depends on exact response structure
                }
            } catch (error) {
                console.error('Failed to fetch event:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [params.id]);

    const accent = event?.color || '#2ecc71';

    const bg = isDark ? '#111111' : '#f4f6f9';
    const titleC = isDark ? '#f2f2f2' : '#1a1a2e';
    const subC = isDark ? '#888' : '#8e9aad';
    const divider = isDark ? '#2a2a2a' : '#eef0f4';
    const headerBg = isDark ? hexToRgba(accent, 0.14) : hexToRgba(accent, 0.08);

    const handleEdit = useCallback(() => {
        if (!event) return;
        router.push({
            pathname: '/event/create',
            params: { event: JSON.stringify(event) },
        });
    }, [event, router]);

    const handleDelete = useCallback(() => {
        if (!event) return;
        Alert.alert('ลบกิจกรรม', `ต้องการลบกิจกรรม "${event.title}" ใช่ไหม?`, [
            { text: 'ยกเลิก', style: 'cancel' },
            {
                text: 'ลบ',
                style: 'destructive',
                onPress: async () => {
                    try {
                        console.log('Deleting event:', event.eventId);
                        await deleteEvent(event.eventId);
                        router.back();
                    } catch (error) {
                        console.error('Failed to delete event:', error);
                        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถลบกิจกรรมได้');
                    }
                }
            }
        ]);
    }, [event, router]);

    const handleShare = useCallback(async () => {
        if (!event) return;
        try {
            const startStr = dayjs(event.startDate).format('ddd, D MMM YYYY, HH:mm');
            const endStr = dayjs(event.endDate).format('ddd, D MMM YYYY, HH:mm');
            const msg = `📅 ${event.title}\n\n` +
                (event.description ? `📝 ${event.description}\n\n` : '') +
                `⏰ เริ่ม: ${startStr}\n` +
                `🏁 สิ้นสุด: ${endStr}\n` +
                (event.location ? `📍 สถานที่: ${event.location}\n` : '') +
                '\nส่งต่อจาก MyCalendar';

            await Share.share({
                message: msg,
                title: event.title,
            });
        } catch (error) {
            console.error('Sharing failed:', error);
        }
    }, [event]);

    if (!event && !loading) {
        return (
            <View style={[styles.centered, { backgroundColor: bg }]}>
                <Feather name="alert-circle" size={48} color={subC} />
                <Text style={[styles.notFoundText, { color: subC }]}>ไม่พบกิจกรรมนี้</Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backBtn, { backgroundColor: accent }]}
                >
                    <Text style={styles.backBtnText}>ย้อนกลับ</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: bg }]}>
                <Text style={[styles.loadingText, { color: subC }]}>กำลังโหลดรายละเอียดกิจกรรม...</Text>
            </View>
        );
    }

    const startD = dayjs(event.startDate).locale('th');
    let endD = dayjs(event.endDate).locale('th');

    // Adjust end date for all-day events if the end date is at midnight of the next day
    if (event.isAllDay && endD.hour() === 0 && endD.minute() === 0 && endD.diff(startD, 'day') >= 1) {
        endD = endD.subtract(1, 'day');
    }

    const sameDay = startD.isSame(endD, 'day');

    const dateStr = sameDay ? startD.format('ddd D MMMM YYYY') : `${startD.format('D MMM')} – ${endD.format('D MMM YYYY')}`;

    const timeStr = event.isAllDay ? 'ตลอดวัน' : `${startD.format('HH:mm')} – ${endD.format('HH:mm')}`;

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
            <ScreenHeader
                title="รายละเอียดกิจกรรม"
                showBack
                actionMenu={{
                    iconColor: '#ffffff',
                    accessibilityLabel: 'เมนูจัดการกิจกรรม',
                    items: [
                        { label: 'แก้ไข', onPress: handleEdit },
                        { label: 'ลบ', onPress: handleDelete, destructive: true },
                        { label: 'แบ่งปัน', onPress: handleShare },
                    ],
                }}
            />

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
                        {event.groupName ? (
                            <View style={[styles.pill, { backgroundColor: hexToRgba(event.groupColor, 0.2) }]}>
                                <FontAwesome5 name={event.icon || 'users'} size={16} color={event.groupColor} />
                                <Text style={[styles.pillText, { color: event.groupColor }]}>{event.groupName}</Text>
                            </View>
                        ) : null}
                        {event.isAllDay ? (
                            <View style={[styles.pill, { backgroundColor: isDark ? '#1a3028' : '#eafaf1' }]}>
                                <Text style={[styles.pillText, { color: isDark ? '#2ecc71' : '#27ae60' }]}>ตลอดวัน</Text>
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
                                สร้างโดย <Text style={{ fontFamily: 'Kanit-Bold', color: accent }}>{event.createdBy.name || event.createdBy.username}</Text>
                            </Text>
                            <View style={[styles.heroOwnerBadge, { backgroundColor: hexToRgba(accent, 0.2) }]}>
                                <Feather name="shield" size={10} color={accent} />
                                <Text style={[styles.heroOwnerText, { color: accent }]}>เจ้าของ</Text>
                            </View>
                        </View>
                    ) : null}

                </View>

                {/* ── Detail Rows ── */}
                <View style={styles.section}>
                    <InfoRow
                        icon="calendar"
                        label="วันที่"
                        value={dateStr}
                        accent={accent}
                        isDark={isDark}
                    />
                    <InfoRow
                        icon="clock"
                        label="เวลา"
                        value={timeStr}
                        accent={accent}
                        isDark={isDark}
                    />

                    {event.location ? (
                        <InfoRow
                            icon="map-pin"
                            label="สถานที่"
                            value={event.location}
                            accent={accent}
                            isDark={isDark}
                            multiline
                        />
                    ) : null}

                    {event.description ? (
                        <InfoRow
                            icon="align-left"
                            label="รายละเอียด"
                            value={event.description}
                            accent={accent}
                            isDark={isDark}
                            multiline
                        />
                    ) : null}

                    {event.priority && pm ? (
                        <View style={[rowStyle.wrap, { backgroundColor: isDark ? '#222' : '#f7f9fc' }]}>
                            <View style={[rowStyle.iconBox, { backgroundColor: hexToRgba(pm.color, 0.15) }]}>
                                <Feather
                                    name={pm.icon}
                                    size={17}
                                    color={pm.color}
                                />
                            </View>
                            <View style={rowStyle.body}>
                                <Text style={[rowStyle.label, { color: subC }]}>ระดับความสำคัญ</Text>
                                <View style={[styles.priorityBadge, { backgroundColor: isDark ? (pmDark?.bg ?? pm.bg) : pm.bg }]}>
                                    <View style={[styles.priorityDot, { backgroundColor: pm.color }]} />
                                    <Text style={[styles.priorityLabel, { color: pm.color }]}>{pm.label}</Text>
                                </View>
                            </View>
                        </View>
                    ) : null}

                    {event.remindBeforeValue !== undefined && event.remindBeforeValue !== null && event.remindBeforeValue > 0 ? (
                        <InfoRow
                            icon="bell"
                            label="แจ้งเตือน"
                            value={`ก่อนเวลา ${event.remindBeforeValue} ${event.remindBeforeUnit === 'MINUTES' ? 'นาที' :
                                event.remindBeforeUnit === 'HOURS' ? 'ชั่วโมง' :
                                    event.remindBeforeUnit === 'DAYS' ? 'วัน' :
                                        event.remindBeforeUnit === 'WEEKS' ? 'สัปดาห์' : 'นาที'
                                }`}
                            accent={accent}
                            isDark={isDark}
                        />
                    ) : event.reminder !== undefined && event.reminder > 0 ? (
                        <InfoRow
                            icon="bell"
                            label="แจ้งเตือน"
                            value={`ก่อนเวลา ${event.reminder} นาที`}
                            accent={accent}
                            isDark={isDark}
                        />
                    ) : null}
                </View>

                {/* ── Assignees ── */}
                {hasUsers && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: subC }]}>ผู้ที่เกี่ยวข้อง</Text>
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
                                                <Text style={[styles.ownerBadgeText, { color: accent }]}>เจ้าของ</Text>
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
    loadingText: { fontSize: 16, fontFamily: 'Kanit-Regular' },
    backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    backBtnText: { fontFamily: 'Kanit-Bold', color: '#fff', fontSize: 15 },


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
    pill: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
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

    // Description card (inside Hero)
    heroDesc: {
        width: '100%',
        marginTop: 4,
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        gap: 10,
    },
    heroDescHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    heroDescIconBox: {
        width: 26,
        height: 26,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroDescLabel: {
        fontSize: 10,
        fontFamily: 'Kanit-Bold',
        letterSpacing: 1.2,
    },
    heroDescText: {
        fontSize: 14,
        fontFamily: 'Kanit-Regular',
        lineHeight: 22,
    },
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
});

export default EventDetailScreen;
