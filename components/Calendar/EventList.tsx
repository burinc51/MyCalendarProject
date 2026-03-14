/**
 * EventList Component
 * Premium card-style event list for selected date bottom sheet.
 * Tap a card → navigates to /event/[id] full-screen detail page.
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import type { CalendarEvent, EventUser } from '@/types/event';

interface EventListProps {
    events: CalendarEvent[];
    onEdit: (event: CalendarEvent) => void;
    onDelete: (eventId: number) => void;
    isDark?: boolean;
}

// ── helpers ───────────────────────────────────────────────────────────────────
const hexToRgba = (hex: string, alpha: number) => {
    const clean = hex?.startsWith('#') ? hex : '#2ecc71';
    const r = parseInt(clean.slice(1, 3), 16);
    const g = parseInt(clean.slice(3, 5), 16);
    const b = parseInt(clean.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
};

const getInitial = (user: EventUser) => {
    const src = user.name || user.username || '?';
    return src.trim().charAt(0).toUpperCase();
};

const AVATAR_COLORS = ['#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f39c12', '#1abc9c'];
const avatarBg = (index: number) => AVATAR_COLORS[index % AVATAR_COLORS.length];

// ── Avatar components ─────────────────────────────────────────────────────────
const UserAvatar: React.FC<{ user: EventUser; index: number; size?: number }> = ({
    user, index, size = 36,
}) => {
    const bg = avatarBg(index);
    const r = size / 2;
    if (user.imageUrl) {
        return (
            <Image source={{ uri: user.imageUrl }}
                style={[styles.avatarBase, { width: size, height: size, borderRadius: r }]} />
        );
    }
    return (
        <View style={[styles.avatarBase, { width: size, height: size, borderRadius: r, backgroundColor: bg }]}>
            <Text style={[styles.avatarText, { fontSize: size * 0.42 }]}>{getInitial(user)}</Text>
        </View>
    );
};

const AvatarStack: React.FC<{ users: EventUser[]; accent: string }> = ({ users, accent }) => {
    const MAX = 3;
    const shown = users.slice(0, MAX);
    const extra = users.length - MAX;
    return (
        <View style={styles.avatarStack}>
            {shown.map((u, i) => (
                <View key={u.userId} style={[styles.avatarWrapper, { marginLeft: i === 0 ? 0 : -10, zIndex: MAX - i }]}>
                    <UserAvatar user={u} index={i} size={34} />
                </View>
            ))}
            {extra > 0 && (
                <View style={[styles.extraBadge, { backgroundColor: hexToRgba(accent, 0.9), marginLeft: -10 }]}>
                    <Text style={styles.extraText}>+{extra}</Text>
                </View>
            )}
        </View>
    );
};

const TitleAvatar: React.FC<{ title: string; color: string }> = ({ title, color }) => (
    <View style={[styles.avatarBase, { width: 36, height: 36, borderRadius: 18, backgroundColor: color }]}>
        <Text style={[styles.avatarText, { fontSize: 15 }]}>{title.trim().charAt(0).toUpperCase()}</Text>
    </View>
);

// ── Main Component ────────────────────────────────────────────────────────────
const EventList: React.FC<EventListProps> = ({ events, onEdit: _onEdit, onDelete: _onDelete, isDark = false }) => {
    const router = useRouter();

    const c = {
        pageBg:    isDark ? '#141414' : '#f4f6f9',
        cardBg:    isDark ? '#1e1e1e' : '#ffffff',
        cardBorder:isDark ? '#2a2a2a' : '#eeeeee',
        title:     isDark ? '#f0f0f0' : '#1a1a2e',
        subtitle:  isDark ? '#888'    : '#8e9aad',
        timeBg:    isDark ? '#262626' : '#f0f3f7',
        timeText:  isDark ? '#cccccc' : '#4a5568',
        allDayBg:  isDark ? '#1a3028' : '#eafaf1',
        allDayText:isDark ? '#2ecc71' : '#27ae60',
        iconMuted: isDark ? '#555'    : '#c0c8d4',
        emptyText: isDark ? '#555'    : '#b0bac5',
    };

    const handlePressEvent = (event: CalendarEvent) => {
        router.push({
            pathname: '/event/[id]',
            params: { id: event.id, event: JSON.stringify(event) },
        });
    };

    if (events.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconWrap, {
                    backgroundColor: isDark ? '#1e1e1e' : '#fff',
                    borderColor: isDark ? '#2a2a2a' : '#dde3ec',
                    borderWidth: 1.5,
                    shadowColor: isDark ? '#4a9eff' : '#0a7ea4',
                }]}>
                    <MaterialIcons name="event-note" size={34} color={isDark ? '#4a9eff' : '#0a7ea4'} />
                </View>
                <Text style={[styles.emptyTitle, { color: isDark ? '#d0d0d0' : '#2c3e50' }]}>
                    No events scheduled
                </Text>
                <Text style={[styles.emptySub, { color: isDark ? '#666' : '#8e9aad' }]}>
                    Tap + to add your first event
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
        >
            {events.map((event) => {
                const accent   = event.color || '#2ecc71';
                const accentBg = hexToRgba(accent, isDark ? 0.15 : 0.08);
                const hasUsers = event.assignees && event.assignees.length > 0;
                const startLabel = event.isAllDay ? 'All Day' : dayjs(event.startDate).format('HH:mm');
                const endLabel   = event.isAllDay ? null       : dayjs(event.endDate).format('HH:mm');

                return (
                    <TouchableOpacity
                        key={event.id}
                        style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}
                        onPress={() => handlePressEvent(event)}
                        activeOpacity={0.75}
                    >
                        {/* Left accent strip */}
                        <View style={[styles.strip, { backgroundColor: accent }]} />

                        {/* Time block */}
                        <View style={[styles.timeBlock, { backgroundColor: c.timeBg }]}>
                            {event.isAllDay ? (
                                <View style={[styles.allDayPill, { backgroundColor: c.allDayBg }]}>
                                    <Text style={[styles.allDayText, { color: c.allDayText }]}>
                                        All{'\n'}Day
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <Text style={[styles.timeMain, { color: c.timeText }]}>{startLabel}</Text>
                                    <View style={[styles.timeDivider, { backgroundColor: c.iconMuted }]} />
                                    <Text style={[styles.timeSub, { color: c.subtitle }]}>{endLabel}</Text>
                                </>
                            )}
                        </View>

                        {/* Body */}
                        <View style={styles.body}>
                            <Text style={[styles.title, { color: c.title }]} numberOfLines={1}>
                                {event.title}
                            </Text>
                            <View style={styles.meta}>
                                {event.category ? (
                                    <View style={[styles.catPill, { backgroundColor: accentBg }]}>
                                        <Text style={[styles.catText, { color: accent }]}>{event.category}</Text>
                                    </View>
                                ) : null}
                                {event.priority ? (
                                    <View style={styles.priorityRow}>
                                        <View style={[styles.priorityDot, {
                                            backgroundColor:
                                                event.priority === 'high'   ? '#e74c3c' :
                                                    event.priority === 'medium' ? '#f39c12' : '#2ecc71'
                                        }]} />
                                        <Text style={[styles.priorityLabel, { color: c.subtitle }]}>
                                            {event.priority}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>

                        {/* Avatar + chevron */}
                        <View style={styles.avatarArea}>
                            {hasUsers ? (
                                <AvatarStack users={event.assignees ?? []} accent={accent} />
                            ) : (
                                <TitleAvatar title={event.title} color={accent} />
                            )}
                        </View>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    list: { flex: 1 },
    listContent: { paddingVertical: 8, paddingBottom: 24 },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 60,
        minHeight: 220,
    },
    emptyIconWrap: {
        width: 80, height: 80, borderRadius: 40,
        justifyContent: 'center', alignItems: 'center', marginBottom: 8,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15, shadowRadius: 14, elevation: 6,
    },
    emptyTitle: { fontSize: 16, fontFamily: 'Kanit-Bold', marginTop: 4 },
    emptySub:   { fontSize: 13, fontFamily: 'Kanit-Regular', opacity: 0.8 },

    card: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 2, marginBottom: 10,
        borderRadius: 16, borderWidth: 1, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
        minHeight: 72,
    },
    strip: { width: 4, alignSelf: 'stretch' },

    timeBlock: {
        width: 58, alignSelf: 'stretch',
        justifyContent: 'center', alignItems: 'center',
        paddingVertical: 12, gap: 2,
    },
    timeMain:    { fontSize: 13, fontFamily: 'Kanit-Bold',    textAlign: 'center' },
    timeDivider: { width: 20, height: 1, borderRadius: 1, marginVertical: 2, opacity: 0.4 },
    timeSub:     { fontSize: 11, fontFamily: 'Kanit-Regular', textAlign: 'center' },
    allDayPill:  { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 8 },
    allDayText:  { fontSize: 10, fontFamily: 'Kanit-Bold', textAlign: 'center', lineHeight: 14 },

    body: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, gap: 6, justifyContent: 'center' },
    title: { fontSize: 15, fontFamily: 'Kanit-Bold' },
    meta:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    catPill:      { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    catText:      { fontSize: 11, fontFamily: 'Kanit-Bold' },
    priorityRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
    priorityDot:  { width: 6, height: 6, borderRadius: 3 },
    priorityLabel:{ fontSize: 11, fontFamily: 'Kanit-Regular', textTransform: 'capitalize' },

    avatarArea: { marginRight: 12, marginLeft: 4, alignItems: 'center', gap: 4 },

    avatarStack:   { flexDirection: 'row', alignItems: 'center' },
    avatarWrapper: { borderWidth: 2, borderColor: '#fff', borderRadius: 18 },
    extraBadge: {
        width: 34, height: 34, borderRadius: 17,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#fff', marginLeft: -10,
    },
    extraText: { fontSize: 11, fontFamily: 'Kanit-Bold', color: '#fff' },

    avatarBase: {
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18, shadowRadius: 4, elevation: 3,
    },
    avatarText: { fontFamily: 'Kanit-Bold', color: '#fff' },
});

export default EventList;
