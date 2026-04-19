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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '@/components/ThemeProvider';

import { useAuthStore } from '@/stores/useAuthStore';
import { fetchActivityLogs, acceptInvitation, rejectInvitation, ActivityLog as BaseActivityLog } from '@/services/activityService';

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
    | 'INVITATION_SENT'
    | 'INVITATION_ACCEPTED'
    | 'INVITATION_REJECTED'
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
    INVITATION_SENT: { label: 'ส่งคำเชิญ', icon: 'mail', color: '#06b6d4' },
    INVITATION_ACCEPTED: { label: 'ยอมรับคำเชิญ', icon: 'check-circle', color: '#2ecc71' },
    INVITATION_REJECTED: { label: 'ปฏิเสธคำเชิญ', icon: 'x-circle', color: '#ef4444' },
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

const ActivityCard: React.FC<{ item: ActivityLog; isDark: boolean; onInvitationHandled?: (id: number) => void }> = ({ item, isDark, onInvitationHandled }) => {
    const router = useRouter();
    const meta = ACTION_META[item.actionType as string] || ACTION_META.DEFAULT;
    const time = dayjs(item.createdAt);
    const isToday = time.isSame(dayjs(), 'day');
    const timeStr = isToday ? time.format('HH:mm') : time.format('D MMM HH:mm');

    const isEventAction = item.actionType.startsWith('EVENT_');
    const dynamicColor = isEventAction
        ? item.eventColor || meta.color
        : item.groupColor || meta.color;

    const [invitationState, setInvitationState] = useState<'pending' | 'accepted' | 'rejected' | 'loading_accept' | 'loading_reject'>('pending');

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

    const isDeleted = item.actionType === 'EVENT_DELETED';
    const textDecorationStyle = isDeleted ? 'line-through' : 'none';
    const textOpacity = isDeleted ? 0.5 : 1;

    const isInvitation = item.actionType === 'INVITATION_SENT';

    const isClickable = !isInvitation && (
        (item.actionType.startsWith('EVENT_') && !isDeleted && item.eventId) ||
        (['GROUP_UPDATED', 'GROUP_MEMBER_ADDED', 'GROUP_MEMBER_REMOVED', 'MEMBER_ADDED', 'MEMBER_REMOVED', 'MEMBER_JOINED', 'MEMBER_LEFT', 'INVITATION_ACCEPTED', 'INVITATION_REJECTED'].includes(item.actionType) && item.groupId)
    );

    const handlePress = () => {
        if (item.actionType.startsWith('EVENT_') && !isDeleted && item.eventId) {
            router.push(`/event/${item.eventId}`);
        } else if (
            ['GROUP_UPDATED', 'GROUP_MEMBER_ADDED', 'GROUP_MEMBER_REMOVED', 'MEMBER_ADDED', 'MEMBER_REMOVED', 'MEMBER_JOINED', 'MEMBER_LEFT', 'INVITATION_ACCEPTED', 'INVITATION_REJECTED'].includes(item.actionType) &&
            item.groupId
        ) {
            router.push(`/group/${item.groupId}/settings`);
        }
    };

    const handleAccept = async () => {
        if (!item.invitationId) return;
        setInvitationState('loading_accept');
        try {
            await acceptInvitation(item.invitationId);
            setInvitationState('accepted');
            onInvitationHandled?.(item.id);
        } catch (e) {
            setInvitationState('pending');
        }
    };

    const handleReject = async () => {
        if (!item.invitationId) return;
        setInvitationState('loading_reject');
        try {
            await rejectInvitation(item.invitationId);
            setInvitationState('rejected');
            onInvitationHandled?.(item.id);
        } catch (e) {
            setInvitationState('pending');
        }
    };

    const CardContainer = isClickable ? TouchableOpacity : View;

    const renderInvitationButtons = () => {
        if (!isInvitation) return null;

        if (invitationState === 'accepted') {
            return (
                <View style={styles.invitationResultRow}>
                    <View style={[styles.invitationResultBadge, { backgroundColor: '#22c55e18', borderColor: '#22c55e40' }]}>
                        <Feather name="check-circle" size={14} color="#22c55e" />
                        <Text style={[styles.invitationResultText, { color: '#22c55e' }]}>ยอมรับแล้ว</Text>
                    </View>
                </View>
            );
        }

        if (invitationState === 'rejected') {
            return (
                <View style={styles.invitationResultRow}>
                    <View style={[styles.invitationResultBadge, { backgroundColor: '#ef444418', borderColor: '#ef444440' }]}>
                        <Feather name="x-circle" size={14} color="#ef4444" />
                        <Text style={[styles.invitationResultText, { color: '#ef4444' }]}>ปฏิเสธแล้ว</Text>
                    </View>
                </View>
            );
        }

        const isLoadingAccept = invitationState === 'loading_accept';
        const isLoadingReject = invitationState === 'loading_reject';
        const isAnyLoading = isLoadingAccept || isLoadingReject;

        return (
            <View style={[styles.invitationButtonRow, { borderTopColor: C.rowBorder }]}>
                <TouchableOpacity
                    style={[
                        styles.invitationBtn,
                        styles.invitationBtnReject,
                        { opacity: isAnyLoading ? 0.5 : 1, borderColor: isDark ? '#3f3f3f' : '#e5e7eb' },
                    ]}
                    onPress={handleReject}
                    disabled={isAnyLoading}
                    activeOpacity={0.75}
                >
                    <Feather name={isLoadingReject ? 'loader' : 'x'} size={14} color="#ef4444" />
                    <Text style={[styles.invitationBtnText, { color: '#ef4444' }]}>
                        {isLoadingReject ? 'กำลังดำเนินการ...' : 'ปฏิเสธ'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.invitationBtn,
                        styles.invitationBtnAccept,
                        { opacity: isAnyLoading ? 0.5 : 1 },
                    ]}
                    onPress={handleAccept}
                    disabled={isAnyLoading}
                    activeOpacity={0.75}
                >
                    <Feather name={isLoadingAccept ? 'loader' : 'check'} size={14} color="#fff" />
                    <Text style={[styles.invitationBtnText, { color: '#fff' }]}>
                        {isLoadingAccept ? 'กำลังดำเนินการ...' : 'ยอมรับ'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <CardContainer
            style={[styles.card, { backgroundColor: C.card, borderColor: C.border }, isInvitation && { borderColor: '#06b6d440', borderWidth: 1.5 }]}
            activeOpacity={0.7}
            onPress={isClickable ? handlePress : undefined}
        >
            {/* Left accent bar */}
            <View style={styles.cardInner}>
                {/* Event header */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={styles.titleRow}>
                            <View style={[styles.titleLine, { backgroundColor: dynamicColor }]} />
                            <View style={{ opacity: textOpacity }}>
                                <Text
                                    style={[styles.eventTitle, { color: C.title, textDecorationLine: textDecorationStyle }]}
                                    numberOfLines={1}
                                >
                                    {item.eventTitle ?? meta.label}
                                </Text>
                                {dateStr ? (
                                    <Text
                                        style={[styles.eventDateText, { color: C.sub, textDecorationLine: textDecorationStyle }]}
                                        numberOfLines={1}
                                    >
                                        {dateStr}
                                    </Text>
                                ) : null}
                                <Text style={[styles.groupLabel, { color: C.sub, textDecorationLine: textDecorationStyle }]}>
                                    {item.groupName ? `กลุ่ม ${item.groupName}` : `กลุ่ม #${item.groupId}`}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <Avatar
                        name={['INVITATION_ACCEPTED', 'INVITATION_REJECTED'].includes(item.actionType) ? item.targetUserName : item.actorName}
                        actorId={['INVITATION_ACCEPTED', 'INVITATION_REJECTED'].includes(item.actionType) ? item.targetUserId : item.actorId}
                        avatarUrl={['INVITATION_ACCEPTED', 'INVITATION_REJECTED'].includes(item.actionType) ? item.targetAvatar : item.actorAvatar}
                    />
                </View>

                {/* Divider */}
                <View style={[styles.innerDivider, { backgroundColor: C.rowBorder }]} />

                {/* Activity row */}
                <View style={[styles.activityRow, { backgroundColor: C.row }]}>
                    {/* Actor mini avatar */}
                    <Avatar
                        name={['INVITATION_ACCEPTED', 'INVITATION_REJECTED'].includes(item.actionType) ? item.targetUserName : item.actorName}
                        actorId={['INVITATION_ACCEPTED', 'INVITATION_REJECTED'].includes(item.actionType) ? item.targetUserId : item.actorId}
                        size={28}
                        avatarUrl={['INVITATION_ACCEPTED', 'INVITATION_REJECTED'].includes(item.actionType) ? item.targetAvatar : item.actorAvatar}
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
                                <Text style={styles.actorBold}>
                                    {['INVITATION_ACCEPTED', 'INVITATION_REJECTED'].includes(item.actionType) ? item.targetUserName : item.actorName}{' '}
                                </Text>
                                {meta.label}
                                {item.targetUserName && item.actionType !== 'MEMBER_ADDED' ? (
                                    <Text style={styles.actorBold}>
                                        {' '}
                                        {['INVITATION_ACCEPTED', 'INVITATION_REJECTED'].includes(item.actionType) ? item.actorName : item.targetUserName}
                                    </Text>
                                ) : (
                                    ''
                                )}
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
                </View>

                {/* Invitation Buttons */}
                {renderInvitationButtons()}
            </View>
        </CardContainer>
    );
};

// Main Screen

export default function NotificationScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();

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
            <View style={[styles.header, { backgroundColor: C.headerBg, paddingTop:  10 }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: C.headerText }]}>การแจ้งเตือน</Text>
                    <Text style={[styles.headerSub, { color: C.sub }]}>
                        {activities.length > 0 ? `${activities.length} รายการ` : 'ความเคลื่อนไหวต่างๆ'}
                    </Text>
                </View>
                <View style={[styles.headerIconBox, { backgroundColor: isDark ? '#1e1e1e' : '#f2f2f2' }]}>
                    <Feather name="bell" size={18} color={C.sub} />
                </View>
            </View>

            {/* List */}
            <FlatList
                data={activities}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <ActivityCard
                        item={item}
                        isDark={isDark}
                        onInvitationHandled={() => loadActivities(1, true)}
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

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    headerTitle: {
        fontFamily: 'Kanit-Bold',
        fontSize: 26,
        letterSpacing: -0.3,
        lineHeight: 30,
    },
    headerSub: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
        marginTop: 2,
    },
    headerIconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
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

    // Invitation action buttons
    invitationButtonRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 12,
        paddingBottom: 12,
        paddingTop: 10,
        borderTopWidth: 1,
    },
    invitationBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 9,
        borderRadius: 10,
    },
    invitationBtnReject: {
        borderWidth: 1,
    },
    invitationBtnAccept: {
        backgroundColor: '#06b6d4',
    },
    invitationBtnText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 13,
    },
    invitationResultRow: {
        paddingHorizontal: 12,
        paddingBottom: 12,
        paddingTop: 6,
        alignItems: 'flex-start',
    },
    invitationResultBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    invitationResultText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 13,
    },
});
