import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '@/components/ThemeProvider';
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions';

// Types (matching API JSON)
type ActionType =
    | 'EVENT_CREATED'
    | 'EVENT_UPDATED'
    | 'EVENT_DELETED'
    | 'MEMBER_JOINED'
    | 'MEMBER_LEFT'
    | 'GROUP_SHARED';

interface ActivityLog {
    id: number;
    groupId: number;
    actorId: number;
    actorName: string;
    actorAvatar: string | null;
    actionType: ActionType;
    eventId: number | null;
    eventTitle: string | null;
    targetUserId: number | null;
    targetUserName: string | null;
    // Java LocalDateTime array: [year, month, day, hour, min, sec, nano]
    createdAt: number[];
}

// Helpers
const parseCreatedAt = (arr: number[]): dayjs.Dayjs => {
    const [year, month, day, hour, min, sec] = arr;
    return dayjs(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`);
};

const ACTION_META: Record<ActionType, { label: string; icon: string; color: string }> = {
    EVENT_CREATED: { label: 'created event', icon: 'plus-circle', color: '#2ecc71' },
    EVENT_UPDATED: { label: 'updated event', icon: 'edit-2', color: '#60a5fa' },
    EVENT_DELETED: { label: 'deleted event', icon: 'trash-2', color: '#ef4444' },
    MEMBER_JOINED: { label: 'joined group', icon: 'user-plus', color: '#a78bfa' },
    MEMBER_LEFT: { label: 'left group', icon: 'user-minus', color: '#f97316' },
    GROUP_SHARED: { label: 'shared group', icon: 'share-2', color: '#fbbf24' },
};

const AVATAR_COLORS = ['#c084fc', '#818cf8', '#60a5fa', '#4ade80', '#fb923c', '#f472b6'];
const getAvatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

const getInitials = (name: string) =>
    name.slice(0, 2).toUpperCase();

// Mock data matching API
const MOCK_DATA: ActivityLog[] = [
    {
        id: 2,
        groupId: 1,
        actorId: 1,
        actorName: 'test1',
        actorAvatar: null,
        actionType: 'EVENT_CREATED',
        eventId: 3,
        eventTitle: '🔔 Test Push Notification3',
        targetUserId: null,
        targetUserName: null,
        createdAt: [2026, 3, 9, 18, 6, 23, 611787000],
    },
    {
        id: 1,
        groupId: 1,
        actorId: 1,
        actorName: 'test2',
        actorAvatar: null,
        actionType: 'EVENT_CREATED',
        eventId: 2,
        eventTitle: '🔔 Test Push Notification',
        targetUserId: null,
        targetUserName: null,
        createdAt: [2026, 3, 9, 15, 29, 33, 294745000],
    },
];

const Avatar: React.FC<{ name: string; actorId: number; size?: number }> = ({
    name, actorId, size = 34,
}) => (
    <View style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: getAvatarColor(actorId) }
    ]}>
        <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{getInitials(name)}</Text>
    </View>
);

const ActivityCard: React.FC<{ item: ActivityLog; isDark: boolean }> = ({ item, isDark }) => {
    const meta = ACTION_META[item.actionType];
    const time = parseCreatedAt(item.createdAt);
    const isToday = time.isSame(dayjs(), 'day');
    const timeStr = isToday ? time.format('HH:mm') : time.format('D MMM HH:mm');

    const C = {
        card: isDark ? '#262626' : '#ffffff',
        border: isDark ? '#333333' : '#f0f0f0',
        title: isDark ? '#f5f5f5' : '#0f0f0f',
        sub: isDark ? '#a3a3a3' : '#9ca3af',
        row: 'transparent', // blends into the card
        rowBorder: isDark ? '#3a3a3a' : '#ebebeb',
    };

    return (
        <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
            {/* Left accent bar */}
            <View style={[styles.accentBar, { backgroundColor: meta.color }]} />

            <View style={styles.cardInner}>
                {/* Event header */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <Text style={[styles.eventTitle, { color: C.title }]} numberOfLines={1}>
                            {item.eventTitle ?? '—'}
                        </Text>
                        <Text style={[styles.groupLabel, { color: C.sub }]}>
                            Group #{item.groupId}
                        </Text>
                    </View>
                    <Avatar name={item.actorName} actorId={item.actorId} />
                </View>

                {/* Divider */}
                <View style={[styles.innerDivider, { backgroundColor: C.rowBorder }]} />

                {/* Activity row */}
                <TouchableOpacity
                    style={[styles.activityRow, { backgroundColor: C.row }]}
                    activeOpacity={0.7}
                >
                    {/* Actor mini avatar */}
                    <Avatar name={item.actorName} actorId={item.actorId} size={28} />

                    {/* Action label */}
                    <View style={styles.activityLabel}>
                        <View style={[styles.actionIconBox, { backgroundColor: meta.color + '20' }]}>
                            <Feather name={meta.icon as any} size={12} color={meta.color} />
                        </View>
                        <Text style={[styles.activityText, { color: C.title }]}>
                            <Text style={styles.actorBold}>{item.actorName} </Text>
                            {meta.label}
                        </Text>
                    </View>

                    {/* Timestamp */}
                    <Text style={[styles.timeText, { color: C.sub }]}>{timeStr}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Main Screen

export default function ActivityScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();
    const { headerHeight, horizontalPadding, titleFontSize, isSmallPhone, isTablet } = useResponsiveDimensions();
    const [refreshing, setRefreshing] = useState(false);

    const C = {
        bg: isDark ? '#171717' : '#f8f9fa',
        headerBg: isDark ? '#171717' : '#fff',
        headerText: isDark ? '#f5f5f5' : '#2c3e50',
        sub: isDark ? '#a3a3a3' : '#9ca3af',
        border: isDark ? '#333333' : '#e5e7eb'
    };

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    return (
        <View style={[styles.screen, { backgroundColor: C.bg }]}>
            {/* Header — same style as CalendarView */}
            <View
                style={[
                    styles.header,
                    {
                        height: headerHeight,
                        paddingHorizontal: horizontalPadding,
                        backgroundColor: C.headerBg
                    }
                ]}
            >
                <Text
                    style={[
                        styles.headerTitle,
                        {
                            fontSize: isSmallPhone ? 18 : isTablet ? 24 : titleFontSize,
                            color: C.headerText
                        }
                    ]}
                >
                    Activity
                </Text>
            </View>

            {/* List */}
            <FlatList
                data={MOCK_DATA}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <ActivityCard
                        item={item}
                        isDark={isDark}
                    />
                )}
                contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 88 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#2ecc71"
                        colors={['#2ecc71']}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Feather
                            name="bell-off"
                            size={40}
                            color={isDark ? '#333' : '#d1d5db'}
                        />
                        <Text style={[styles.emptyText, { color: C.sub }]}>No activity yet</Text>
                    </View>
                }
            />
        </View>
    );
}

// Styles
const styles = StyleSheet.create({
    screen: { flex: 1 },

    // Header — matches CalendarView
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 0.25,
        borderBottomColor: '#424141a9',
    },
    headerTitle: {
        fontFamily: 'Kanit-Bold',
        letterSpacing: 0.5,
    },

    // List
    list: {
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 12,
    },

    // Card
    card: {
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    accentBar: {
        width: 4,
    },
    cardInner: {
        flex: 1,
        paddingTop: 14,
    },

    // Card header (event info)
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingBottom: 12,
        gap: 10,
    },
    cardHeaderLeft: { flex: 1 },
    eventTitle: {
        fontFamily: 'Kanit-Bold',
        fontSize: 15,
        marginBottom: 3,
    },
    groupLabel: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
    },

    innerDivider: {
        height: 1,
        marginHorizontal: 14,
        marginBottom: 0,
    },

    // Activity row inside card
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    activityLabel: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionIconBox: {
        width: 22,
        height: 22,
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 13,
        flex: 1,
    },
    actorBold: {
        fontFamily: 'Kanit-Bold',
    },
    timeText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
    },

    // Avatar
    avatar: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontFamily: 'Kanit-Bold',
        color: '#fff',
    },

    // Empty
    empty: {
        alignItems: 'center',
        paddingTop: 80,
        gap: 14,
    },
    emptyText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 15,
    },
});
