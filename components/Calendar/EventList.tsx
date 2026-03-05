/**
 * EventList Component
 * Premium card-style event list for selected date bottom sheet
 * Avatar: shows user photo (imageUrl) or initial from name/username
 * Multiple assignees → stacked avatars
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
import { MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import type { CalendarEvent, EventUser } from '@/types/event';

interface EventListProps {
    events: CalendarEvent[];
    onEdit: (event: CalendarEvent) => void;
    onDelete: (eventId: number) => void;
    isDark?: boolean;
}

// Lighten event color for soft backgrounds
const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
};

// Initial letter from name or username
const getInitial = (user: EventUser) => {
    const src = user.name || user.username || '?';
    return src.trim().charAt(0).toUpperCase();
};

// Palette for avatars without photos — cycles by index
const AVATAR_COLORS = ['#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f39c12', '#1abc9c'];
const avatarBg = (index: number) => AVATAR_COLORS[index % AVATAR_COLORS.length];

// ── Single avatar (image or initial) ────────────────────────────────────────
const UserAvatar: React.FC<{ user: EventUser; index: number; size?: number }> = ({
    user,
    index,
    size = 36,
}) => {
    const bg = avatarBg(index);
    const borderR = size / 2;

    if (user.imageUrl) {
        return (
            <Image
                source={{ uri: user.imageUrl }}
                style={[
                    styles.avatarBase,
                    { width: size, height: size, borderRadius: borderR }
                ]}
            />
        );
    }

    return (
        <View style={[styles.avatarBase, { width: size, height: size, borderRadius: borderR, backgroundColor: bg }]}>
            <Text style={[styles.avatarText, { fontSize: size * 0.42 }]}>{getInitial(user)}</Text>
        </View>
    );
};

// ── Stacked avatars (max 3 shown + count badge) ──────────────────────────────
const AvatarStack: React.FC<{ users: EventUser[]; accent: string }> = ({ users, accent }) => {
    const MAX_SHOW = 3;
    const shown = users.slice(0, MAX_SHOW);
    const extra = users.length - MAX_SHOW;

    return (
        <View style={styles.avatarStack}>
            {shown.map((user, i) => (
                <View
                    key={user.userId}
                    style={[
                        styles.avatarWrapper,
                        { marginLeft: i === 0 ? 0 : -10, zIndex: MAX_SHOW - i }
                    ]}
                >
                    <UserAvatar user={user} index={i} size={34} />
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

// ── Fallback avatar using event title initial ────────────────────────────────
const TitleAvatar: React.FC<{ title: string; color: string }> = ({ title, color }) => (
    <View style={[styles.avatarBase, { width: 36, height: 36, borderRadius: 18, backgroundColor: color }]}>
        <Text style={[styles.avatarText, { fontSize: 15 }]}>
            {title.trim().charAt(0).toUpperCase()}
        </Text>
    </View>
);

// ── Main Component ───────────────────────────────────────────────────────────
const EventList: React.FC<EventListProps> = ({ events, onEdit, isDark = false }) => {
    const c = {
        pageBg: isDark ? '#141414' : '#f4f6f9',
        cardBg: isDark ? '#1e1e1e' : '#ffffff',
        cardBorder: isDark ? '#2a2a2a' : '#eeeeee',
        title: isDark ? '#f0f0f0' : '#1a1a2e',
        subtitle: isDark ? '#888' : '#8e9aad',
        timeBg: isDark ? '#262626' : '#f0f3f7',
        timeText: isDark ? '#cccccc' : '#4a5568',
        allDayBg: isDark ? '#1a3028' : '#eafaf1',
        allDayText: isDark ? '#2ecc71' : '#27ae60',
        iconMuted: isDark ? '#555' : '#c0c8d4',
        emptyText: isDark ? '#555' : '#b0bac5',
    };

    if (events.length === 0) {
        return (
            <View style={[styles.emptyContainer, { backgroundColor: c.pageBg }]}>
                <View style={[styles.emptyIconWrap, { backgroundColor: c.cardBg }]}>
                    <MaterialIcons name="event-note" size={32} color={c.iconMuted} />
                </View>
                <Text style={[styles.emptyTitle, { color: c.emptyText }]}>No events scheduled</Text>
                <Text style={[styles.emptySub, { color: c.emptyText + '99' }]}>
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
                const accent = event.color || '#2ecc71';
                const accentBg = hexToRgba(accent, isDark ? 0.15 : 0.08);
                const hasUsers = event.assignees && event.assignees.length > 0;

                const startLabel = event.isAllDay ? 'All Day' : dayjs(event.startDate).format('HH:mm');
                const endLabel = event.isAllDay ? null : dayjs(event.endDate).format('HH:mm');

                return (
                    <TouchableOpacity
                        key={event.id}
                        style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}
                        onPress={() => onEdit(event)}
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
                                                event.priority === 'high' ? '#e74c3c' :
                                                    event.priority === 'medium' ? '#f39c12' : '#2ecc71'
                                        }]} />
                                        <Text style={[styles.priorityLabel, { color: c.subtitle }]}>
                                            {event.priority}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>

                        {/* Avatar area */}
                        <View style={styles.avatarArea}>
                            {hasUsers ? (
                                <AvatarStack users={event.assignees!} accent={accent} />
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

const styles = StyleSheet.create({
    list: { flex: 1 },
    listContent: { paddingVertical: 8, paddingBottom: 24 },

    // Empty state
    emptyContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        gap: 8, paddingVertical: 56,
    },
    emptyIconWrap: {
        width: 64, height: 64, borderRadius: 32,
        justifyContent: 'center', alignItems: 'center', marginBottom: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    },
    emptyTitle: { fontSize: 15, fontFamily: 'Kanit-Bold' },
    emptySub: { fontSize: 12, fontFamily: 'Kanit-Regular' },

    // Card
    card: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 2, marginBottom: 10,
        borderRadius: 16, borderWidth: 1, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
        minHeight: 72,
    },
    strip: { width: 4, alignSelf: 'stretch' },

    // Time block
    timeBlock: {
        width: 58, alignSelf: 'stretch',
        justifyContent: 'center', alignItems: 'center',
        paddingVertical: 12, gap: 2,
    },
    timeMain: { fontSize: 13, fontFamily: 'Kanit-Bold', textAlign: 'center' },
    timeDivider: { width: 20, height: 1, borderRadius: 1, marginVertical: 2, opacity: 0.4 },
    timeSub: { fontSize: 11, fontFamily: 'Kanit-Regular', textAlign: 'center' },
    allDayPill: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 8 },
    allDayText: { fontSize: 10, fontFamily: 'Kanit-Bold', textAlign: 'center', lineHeight: 14 },

    // Body
    body: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, gap: 6, justifyContent: 'center' },
    title: { fontSize: 15, fontFamily: 'Kanit-Bold' },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    catPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    catText: { fontSize: 11, fontFamily: 'Kanit-Bold' },
    priorityRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    priorityDot: { width: 6, height: 6, borderRadius: 3 },
    priorityLabel: { fontSize: 11, fontFamily: 'Kanit-Regular', textTransform: 'capitalize' },

    // Avatar area (right side)
    avatarArea: { marginRight: 14, marginLeft: 4 },

    // Avatar stack
    avatarStack: { flexDirection: 'row', alignItems: 'center' },
    avatarWrapper: { borderWidth: 2, borderColor: '#fff', borderRadius: 18 },
    extraBadge: {
        width: 34, height: 34, borderRadius: 17,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#fff',
        marginLeft: -10,
    },
    extraText: { fontSize: 11, fontFamily: 'Kanit-Bold', color: '#fff' },

    // Single avatar base
    avatarBase: {
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18, shadowRadius: 4, elevation: 3,
    },
    avatarText: { fontFamily: 'Kanit-Bold', color: '#fff' },
});

export default EventList;
