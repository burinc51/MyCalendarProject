import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '@/components/ThemeProvider';
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions';
import { useAuthStore } from '@/stores/useAuthStore';
import { fetchActivityLogs, ActivityLog as BaseActivityLog } from '@/services/activityService';

// Extend the original ActivityLog to ensure TS compilation passes if properties are lagging behind
interface ActivityLog extends BaseActivityLog {
    eventStartDate?: string | null;
    eventEndDate?: string | null;
    actionDetail?: string | null;
    eventColor?: string | null;
    groupColor?: string | null;
}

// Types (matching API JSON)
type ActionType =
    | 'EVENT_CREATED'
    | 'EVENT_UPDATED'
    | 'EVENT_DELETED'
    | 'MEMBER_JOINED'
    | 'MEMBER_LEFT'
    | 'GROUP_SHARED'
    | 'GROUP_UPDATED'
    | 'GROUP_MEMBER_ADDED'
    | 'GROUP_MEMBER_REMOVED'
    | string; // fallback for any unknown action

const ACTION_META: Record<string, { label: string; icon: string; color: string }> = {
    EVENT_CREATED: { label: 'สร้างกิจกรรม', icon: 'plus-circle', color: '#2ecc71' },
    EVENT_UPDATED: { label: 'อัปเดตกิจกรรม', icon: 'edit-2', color: '#60a5fa' },
    EVENT_DELETED: { label: 'ลบกิจกรรม', icon: 'trash-2', color: '#ef4444' },
    MEMBER_JOINED: { label: 'เข้าร่วมกลุ่ม', icon: 'user-plus', color: '#a78bfa' },
    MEMBER_LEFT: { label: 'ออกจากกลุ่ม', icon: 'user-minus', color: '#f97316' },
    MEMBER_ADDED: { label: 'สมาชิกใหม่', icon: 'user-plus', color: '#a78bfa' },
    MEMBER_REMOVED: { label: 'ลบสมาชิกออก', icon: 'user-minus', color: '#f97316' },
    GROUP_SHARED: { label: 'แชร์กลุ่ม', icon: 'share-2', color: '#fbbf24' },
    GROUP_UPDATED: { label: 'อัปเดตกลุ่ม', icon: 'settings', color: '#4ade80' },
    // Default fallback
    DEFAULT: { label: 'มีการเคลื่อนไหว', icon: 'activity', color: '#888888' },
};

const AVATAR_COLORS = ['#c084fc', '#818cf8', '#60a5fa', '#4ade80', '#fb923c', '#f472b6'];
const getAvatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

const getInitials = (name: string) =>
    name.slice(0, 2).toUpperCase();

const Avatar: React.FC<{ name: string; actorId: number; size?: number; avatarUrl?: string | null }> = ({
    name, actorId, size = 34, avatarUrl
}) => {
    if (avatarUrl) {
        return (
            <Image
                source={{ uri: avatarUrl }}
                style={[
                    styles.avatar,
                    { width: size, height: size, borderRadius: size / 2, backgroundColor: getAvatarColor(actorId) }
                ]}
            />
        );
    }
    return (
        <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: getAvatarColor(actorId) }]}>
            <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{getInitials(name)}</Text>
        </View>
    );
};

const ActivityCard: React.FC<{ item: ActivityLog; isDark: boolean }> = ({ item, isDark }) => {
    const meta = ACTION_META[item.actionType as string] || ACTION_META.DEFAULT;
    const time = dayjs(item.createdAt);
    const isToday = time.isSame(dayjs(), 'day');
    const timeStr = isToday ? time.format('HH:mm') : time.format('D MMM HH:mm');

    const isEventAction = item.actionType.startsWith('EVENT_');
    const dynamicColor = isEventAction 
        ? item.eventColor || meta.color 
        : item.groupColor || meta.color;

    // Attempt to parse start/end dates if available
    let dateStr = '';
    if (item.eventStartDate && item.eventEndDate) {
        const dStart = dayjs(item.eventStartDate);
        const dEnd = dayjs(item.eventEndDate);

        const sameDay = dStart.isSame(dEnd, 'day');

        // Check if both start and end times are exactly "00:00:00"
        const isAllDay = item.eventStartDate.includes('T00:00:00') && item.eventEndDate.includes('T00:00:00');

        if (sameDay) {
            if (isAllDay) {
                dateStr = `${dStart.format('DD MMM YYYY')} ตลอดวัน`;
            } else {
                dateStr = `${dStart.format('DD MMM YYYY HH:mm')} - ${dEnd.format('HH:mm')}`;
            }
        } else {
            if (isAllDay) {
                dateStr = `${dStart.format('DD MMM YYYY')} - ${dEnd.format('DD MMM YYYY')}`;
            } else {
                dateStr = `${dStart.format('DD MMM YYYY HH:mm')} - ${dEnd.format('DD MMM YYYY HH:mm')}`;
            }
        }
    }

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
            <View style={styles.cardInner}>
                {/* Event header */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={styles.titleRow}>
                            <View style={[styles.titleLine, { backgroundColor: dynamicColor }]} />
                            <View>
                                <Text
                                    style={[styles.eventTitle, { color: C.title }]}
                                    numberOfLines={1}
                                >
                                    {item.eventTitle ?? meta.label}
                                </Text>
                                {dateStr ? (
                                    <Text
                                        style={[styles.eventDateText, { color: C.sub }]}
                                        numberOfLines={1}
                                    >
                                        {dateStr}
                                    </Text>
                                ) : null}
                                <Text style={[styles.groupLabel, { color: C.sub }]}>{item.groupName ? `กลุ่ม ${item.groupName}` : `กลุ่ม #${item.groupId}`}</Text>
                            </View>
                        </View>
                    </View>
                    <Avatar
                        name={item.actorName}
                        actorId={item.actorId}
                        avatarUrl={item.actorAvatar}
                    />
                </View>

                {/* Divider */}
                <View style={[styles.innerDivider, { backgroundColor: C.rowBorder }]} />

                {/* Activity row */}
                <TouchableOpacity
                    style={[styles.activityRow, { backgroundColor: C.row }]}
                    activeOpacity={0.7}
                >
                    {/* Actor mini avatar */}
                    <Avatar
                        name={item.actorName}
                        actorId={item.actorId}
                        size={28}
                        avatarUrl={item.actorAvatar}
                    />

                    {/* Action label */}
                    <View style={styles.activityLabel}>
                        <View style={[styles.actionIconBox, { backgroundColor: dynamicColor + '20' }]}>
                            <Feather
                                name={meta.icon as any}
                                size={12}
                                color={dynamicColor}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.activityText, { color: C.title }]}>
                                <Text style={styles.actorBold}>{item.actorName} </Text>
                                {meta.label}
                                {item.targetUserName && item.actionType !== 'MEMBER_ADDED'
                                    ? <Text style={styles.actorBold}> {item.targetUserName}</Text> : ''}
                            </Text>
                            {item.actionDetail && (
                                <View style={[styles.detailBox, { backgroundColor: isDark ? '#333' : '#f3f4f6' }]}>
                                    <Text
                                        style={[styles.detailText, { color: C.sub }]}
                                        numberOfLines={2}
                                    >
                                        {item.actionDetail}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Timestamp */}
                    <Text style={[styles.timeText, { color: C.sub }]}>{timeStr}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Main Screen

export default function NotificationScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();
    const { headerHeight, horizontalPadding, titleFontSize, isSmallPhone, isTablet } = useResponsiveDimensions();
    const { user } = useAuthStore();

    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [isLastPage, setIsLastPage] = useState(false);

    const C = {
        bg: isDark ? '#171717' : '#f8f9fa',
        headerBg: isDark ? '#171717' : '#fff',
        headerText: isDark ? '#f5f5f5' : '#2c3e50',
        sub: isDark ? '#a3a3a3' : '#9ca3af',
        border: isDark ? '#333333' : '#e5e7eb'
    };

    const loadActivities = async (pageNumber: number, isRefresh = false) => {
        if (!user?.id) return;

        try {
            if (isRefresh) setRefreshing(true);
            else setIsLoadingMore(true);

            const response = await fetchActivityLogs(pageNumber, 10);

            if (isRefresh) {
                setActivities(response.content);
            } else {
                setActivities(prev => [...prev, ...response.content]);
            }

            setPage(response.pageNo);
            setIsLastPage(response.last);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setRefreshing(false);
            setIsLoadingMore(false);
        }
    };

    const onRefresh = () => {
        loadActivities(1, true);
    };

    const loadMore = () => {
        if (!isLastPage && !isLoadingMore && !refreshing) {
            loadActivities(page + 1, false);
        }
    };

    // Load initial data
    React.useEffect(() => {
        if (user?.id) {
            loadActivities(1, true);
        }
    }, [user?.id]);

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
                    การแจ้งเตือน
                </Text>
            </View>

            {/* List */}
            <FlatList
                data={activities}
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
                        <Text style={[styles.emptyText, { color: C.sub }]}>ยังไม่มีการแจ้งเตือน</Text>
                    </View>
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.1}
                ListFooterComponent={
                    isLoadingMore ? (
                        <View style={styles.loadingMore}>
                            <Text style={{ color: C.sub }}>กำลังโหลด...</Text>
                        </View>
                    ) : null
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
    titleRow: {
        flexDirection: 'row',
        gap: 10,
    },
    titleLine: {
        width: 3,
        borderRadius: 2,
    },
    eventTitle: {
        fontFamily: 'Kanit-Bold',
        fontSize: 16,
        marginBottom: 2,
    },
    eventDateText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 13,
        marginBottom: 2,
    },
    groupLabel: {
        fontFamily: 'Kanit-Regular',
        fontSize: 13,
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
    },
    detailBox: {
        marginTop: 6,
        padding: 8,
        borderRadius: 8,
    },
    detailText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
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

    // Loading more indicator
    loadingMore: {
        paddingVertical: 12,
        alignItems: 'center',
    },
});
