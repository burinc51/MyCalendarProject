import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeProvider';

// Types
type ActivityType = 'event_added' | 'event_edited' | 'event_deleted' | 'member_joined' | 'member_left' | 'group_shared';

interface ActivityItem {
    id: string;
    type: ActivityType;
    actor: string;
    actorInitial: string;
    actorColor: string;
    message: string;
    detail?: string;
    time: string;
    isRead: boolean;
}

// Mock data
const MOCK_ACTIVITIES: ActivityItem[] = [
    {
        id: '1',
        type: 'event_added',
        actor: 'Rin',
        actorInitial: 'R',
        actorColor: '#c084fc',
        message: 'added a new event',
        detail: 'Team Standup — Monday 9:00 AM',
        time: '2 min ago',
        isRead: false,
    },
    {
        id: '2',
        type: 'member_joined',
        actor: 'Min',
        actorInitial: 'M',
        actorColor: '#60a5fa',
        message: 'joined group',
        detail: 'Work',
        time: '1 hr ago',
        isRead: false,
    },
    {
        id: '3',
        type: 'event_edited',
        actor: 'Sam',
        actorInitial: 'S',
        actorColor: '#4ade80',
        message: 'edited an event',
        detail: 'Project Review → rescheduled to Friday',
        time: '3 hr ago',
        isRead: true,
    },
    {
        id: '4',
        type: 'group_shared',
        actor: 'Burin',
        actorInitial: 'B',
        actorColor: '#818cf8',
        message: 'shared a calendar',
        detail: 'Friends · 2 new members',
        time: 'Yesterday',
        isRead: true,
    },
    {
        id: '5',
        type: 'event_deleted',
        actor: 'Rin',
        actorInitial: 'R',
        actorColor: '#c084fc',
        message: 'removed an event',
        detail: 'Friday Lunch',
        time: 'Yesterday',
        isRead: true,
    },
    {
        id: '6',
        type: 'member_left',
        actor: 'Ton',
        actorInitial: 'T',
        actorColor: '#f97316',
        message: 'left group',
        detail: 'Work',
        time: '2 days ago',
        isRead: true,
    },
];

// Icon + color per type
const TYPE_META: Record<ActivityType, { icon: string; color: string }> = {
    event_added: { icon: 'calendar', color: '#2ecc71' },
    event_edited: { icon: 'edit-2', color: '#60a5fa' },
    event_deleted: { icon: 'trash-2', color: '#ef4444' },
    member_joined: { icon: 'user-plus', color: '#a78bfa' },
    member_left: { icon: 'user-minus', color: '#f97316' },
    group_shared: { icon: 'share-2', color: '#fbbf24' },
};

// Activity Row
const ActivityRow: React.FC<{ item: ActivityItem; isDark: boolean }> = ({ item, isDark }) => {
    const meta = TYPE_META[item.type];

    return (
        <TouchableOpacity
            style={[
                styles.row,
                {
                    backgroundColor: item.isRead
                        ? (isDark ? '#1a1a1a' : '#fff')
                        : (isDark ? '#1e2a1e' : '#f0faf4'),
                    borderLeftColor: item.isRead ? 'transparent' : '#2ecc71',
                }
            ]}
            activeOpacity={0.7}
        >
            {/* Actor avatar */}
            <View style={[styles.avatar, { backgroundColor: item.actorColor }]}>
                <Text style={styles.avatarText}>{item.actorInitial}</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={[styles.messageText, { color: isDark ? '#e5e5e5' : '#1a1a1a' }]}>
                    <Text style={styles.actorName}>{item.actor} </Text>
                    {item.message}
                </Text>
                {item.detail && (
                    <Text style={[styles.detailText, { color: isDark ? '#737373' : '#6b7280' }]}>
                        {item.detail}
                    </Text>
                )}
                <Text style={[styles.timeText, { color: isDark ? '#525252' : '#9ca3af' }]}>
                    {item.time}
                </Text>
            </View>

            {/* Type icon */}
            <View style={[styles.typeIcon, { backgroundColor: meta.color + '18' }]}>
                <Feather name={meta.icon as any} size={14} color={meta.color} />
            </View>
        </TouchableOpacity>
    );
};

// Main Screen
export default function ActivityScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();

    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const filtered = filter === 'unread'
        ? MOCK_ACTIVITIES.filter(a => !a.isRead)
        : MOCK_ACTIVITIES;

    const unreadCount = MOCK_ACTIVITIES.filter(a => !a.isRead).length;

    const C = {
        bg: isDark ? '#141414' : '#f8f9fb',
        surface: isDark ? '#1a1a1a' : '#fff',
        text: isDark ? '#e5e5e5' : '#1a1a1a',
        subtext: isDark ? '#737373' : '#9ca3af',
        border: isDark ? '#262626' : '#e5e7eb',
        chip: isDark ? '#262626' : '#f0f0f0',
        chipActive: isDark ? '#1e2e1e' : '#edfaf3',
    };

    return (
        <View style={[styles.screen, { backgroundColor: C.bg }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
                <Text style={[styles.headerTitle, { color: C.text }]}>Activity</Text>
                {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                    </View>
                )}
            </View>

            {/* Filter chips */}
            <View style={[styles.filterRow, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
                {(['all', 'unread'] as const).map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[
                            styles.chip,
                            {
                                backgroundColor: filter === f ? C.chipActive : C.chip,
                                borderColor: filter === f ? '#2ecc71' : 'transparent',
                            }
                        ]}
                        onPress={() => setFilter(f)}
                        activeOpacity={0.7}
                    >
                        <Text style={[
                            styles.chipText,
                            { color: filter === f ? '#2ecc71' : C.subtext }
                        ]}>
                            {f === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <ActivityRow item={item} isDark={isDark} />}
                contentContainerStyle={[
                    styles.list,
                    { paddingBottom: insets.bottom + 80 }
                ]}
                ItemSeparatorComponent={() => (
                    <View style={[styles.separator, { backgroundColor: C.border }]} />
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Feather name="bell-off" size={36} color={isDark ? '#404040' : '#d1d5db'} />
                        <Text style={[styles.emptyText, { color: C.subtext }]}>No activity yet</Text>
                    </View>
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: 1,
        gap: 10,
    },
    headerTitle: {
        fontFamily: 'Kanit-Bold',
        fontSize: 24,
        letterSpacing: 0.3,
    },
    unreadBadge: {
        backgroundColor: '#2ecc71',
        borderRadius: 12,
        minWidth: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadBadgeText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 12,
        color: '#fff',
    },

    // Filter
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
        borderBottomWidth: 1,
    },
    chip: {
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderWidth: 1,
    },
    chipText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 13,
    },

    // List
    list: { paddingTop: 4 },
    separator: { height: 1, marginLeft: 72 },

    // Row
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
        borderLeftWidth: 3,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 16,
        color: '#fff',
    },
    content: { flex: 1, gap: 3 },
    messageText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 14,
        lineHeight: 20,
    },
    actorName: {
        fontFamily: 'Kanit-Bold',
    },
    detailText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 13,
    },
    timeText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
        marginTop: 2,
    },
    typeIcon: {
        width: 30,
        height: 30,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },

    // Empty
    empty: {
        alignItems: 'center',
        paddingTop: 80,
        gap: 12,
    },
    emptyText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 15,
    },
});
