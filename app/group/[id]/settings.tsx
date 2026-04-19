import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
    ActivityIndicator,
    Clipboard,
    Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import ScreenHeader from '@/components/ScreenHeader';
import GroupInviteModal from '@/components/GroupInviteModal';
import { getGroupById, removeMemberFromGroup } from '@/services/groupService';
import { useAuthStore } from '@/stores/useAuthStore';
import { Group } from '@/types/group';
import { useGroupStore } from '@/stores/useGroupStore';

export default function GroupSettingsScreen() {
    const { id, name: initialName } = useLocalSearchParams<{ id: string; name?: string }>();
    const { selectedGroupId } = useGroupStore();
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();

    const [group, setGroup] = useState<Group | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [inviteModalVisible, setInviteModalVisible] = useState(false);
    const isFirstRun = useRef(true);

    const targetId = id || selectedGroupId;

    useFocusEffect(
        React.useCallback(() => {
            if (targetId) {
                fetchGroupData(isFirstRun.current);
                isFirstRun.current = false;
            }
        }, [targetId])
    );

    const fetchGroupData = async (showLoading = false) => {
        try {
            if (showLoading) setIsLoading(true);
            const data = await getGroupById(targetId);
            setGroup(data);
        } catch (error) {
            console.error('Failed to fetch group:', error);
            Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโหลดรายละเอียดของกลุ่ม');
        } finally {
            setIsLoading(false);
        }
    };

    const colors = {
        background: isDark ? '#121212' : '#f5f7fa',
        cardBg: isDark ? '#1e1e1e' : '#ffffff',
        textPrimary: isDark ? '#f5f5f5' : '#1a1a1a',
        textSecondary: isDark ? '#a3a3a3' : '#6b7280',
        border: isDark ? '#262626' : '#e5e7eb',
        danger: '#ef4444',
        dangerBg: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
        accent: '#2ecc71',
    };

    const handleLeaveGroup = () => {
        Alert.alert(
            'ออกจากกลุ่ม',
            'คุณแน่ใจหรือว่าต้องการออกจากกลุ่มนี้ คุณจะไม่สามารถเข้าถึงปฏิทินของกลุ่มนี้ได้อีก',
            [
                { text: 'ยกเลิก', style: 'cancel' },
                {
                    text: 'ออกจากกลุ่ม',
                    style: 'destructive',
                    onPress: async () => {
                        if (user?.id && targetId) {
                            try {
                                await removeMemberFromGroup(targetId, user.id);
                                router.replace('/(tabs)');
                            } catch (e: any) {
                                Alert.alert('ข้อผิดพลาด', e.message || 'ไม่สามารถออกจากกลุ่ม');
                            }
                        }
                    }
                }
            ]
        );
    };

    const handleRefreshGroup = async () => {
        await fetchGroupData(false);
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    const members = group?.members || [];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScreenHeader
                title={`${group?.name || initialName || 'กลุ่ม'} - ตั้งค่า`}
                showBack={true}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* --- Section: Group Profile --- */}
                <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <View style={styles.profileBox}>
                        <View style={[styles.groupIconLg, { backgroundColor: (group?.color || colors.accent) + '20' }]}>
                            <FontAwesome5
                                name={group?.icon || 'users'}
                                size={32}
                                color={group?.color || colors.accent}
                            />
                        </View>
                        <Text style={[styles.groupName, { color: colors.textPrimary }]}>{group?.name || initialName}</Text>
                        <TouchableOpacity
                            style={styles.editProfileBtn}
                            className="bg-blue-500"
                            onPress={() =>
                                router.push({
                                    pathname: '/group/create',
                                    params: { id: group?.id, mode: 'edit' }
                                })
                            }
                        >
                            <Text
                                style={styles.editProfileText}
                                className="text-white"
                            >
                                ตั้งค่า
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- Section: Members --- */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>สมาชิก ({members.length})</Text>
                <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    {members.map((member, index) => (
                        <View
                            key={member.userId}
                            style={[styles.row, index < members.length - 1 && [styles.rowBorder, { borderBottomColor: colors.border }]]}
                        >
                            <View style={[styles.memberAvatar, { backgroundColor: member.avatarColor || '#94a3b8' }]}>
                                {member.imageUrl ? (
                                    <Image
                                        source={{ uri: member.imageUrl }}
                                        style={{ width: '100%', height: '100%', borderRadius: 18 }}
                                    />
                                ) : (
                                    <Text style={styles.memberInitial}>{member.initialText || (member.name ? member.name.charAt(0).toUpperCase() : '?')}</Text>
                                )}
                            </View>
                            <View style={styles.memberInfo}>
                                <Text style={[styles.memberName, { color: colors.textPrimary }]}>
                                    {member.name} {member.userId === user?.id && <Text style={{ fontSize: 12, fontWeight: 'normal' }}>(คุณ)</Text>}
                                </Text>
                                <Text style={[styles.memberRole, { color: colors.textSecondary }]}>{member.role || 'สมาชิก'}</Text>
                            </View>
                            {member.role === 'ADMIN' && (
                                <View style={styles.adminBadge}>
                                    <Text style={styles.adminText}>ผู้ดูแล</Text>
                                </View>
                            )}
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[styles.row, styles.addMemberRow]}
                        activeOpacity={0.6}
                        onPress={() => setInviteModalVisible(true)}
                    >
                        <View style={[styles.addMemberIcon, { backgroundColor: isDark ? 'rgba(46,204,113,0.1)' : '#eafaf1' }]}>
                            <Feather
                                name="user-plus"
                                size={18}
                                color={colors.accent}
                            />
                        </View>
                        <Text style={[styles.addMemberText, { color: colors.accent }]}>เชิญสมาชิก</Text>
                    </TouchableOpacity>
                </View>

                {/* --- Section: Preferences --- */}
                {/*<Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>การตั้งค่า</Text>*/}
                {/*<View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>*/}
                {/*    <View style={[styles.row, styles.rowBorder, { borderBottomColor: colors.border }]}>*/}
                {/*        <View style={[styles.prefIcon, { backgroundColor: isDark ? '#333' : '#f3f4f6' }]}>*/}
                {/*            <Feather*/}
                {/*                name="bell"*/}
                {/*                size={18}*/}
                {/*                color={colors.textPrimary}*/}
                {/*            />*/}
                {/*        </View>*/}
                {/*        <Text style={[styles.rowText, { color: colors.textPrimary }]}>การแจ้งเตือน</Text>*/}
                {/*        <Switch*/}
                {/*            value={notificationsEnabled}*/}
                {/*            onValueChange={setNotificationsEnabled}*/}
                {/*            trackColor={{ false: isDark ? '#444' : '#d1d5db', true: colors.accent }}*/}
                {/*            thumbColor="#fff"*/}
                {/*            style={{ transform: [{ scale: 0.85 }] }}*/}
                {/*        />*/}
                {/*    </View>*/}
                {/*</View>*/}

                {/* --- Section: Danger Zone --- */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>โซนอันตราย</Text>
                <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.row, { paddingVertical: 14 }]}
                        activeOpacity={0.6}
                        onPress={handleLeaveGroup}
                    >
                        <Feather
                            name="log-out"
                            size={18}
                            color={colors.danger}
                            style={{ marginLeft: 6, marginRight: 14 }}
                        />
                        <Text style={[styles.rowText, { color: colors.danger, fontFamily: 'Kanit-Bold' }]}>ออกจากกลุ่ม</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Invite Modal */}
            <GroupInviteModal
                visible={inviteModalVisible}
                groupId={targetId}
                onClose={() => setInviteModalVisible(false)}
                onSuccess={handleRefreshGroup}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    sectionTitle: {
        fontFamily: 'Kanit-Bold',
        fontSize: 12,
        letterSpacing: 1.2,
        marginLeft: 4,
        marginBottom: 8,
        marginTop: 20,
    },
    section: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },

    // Profile Box
    profileBox: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    groupIconLg: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    groupName: {
        fontFamily: 'Kanit-Bold',
        fontSize: 22,
        marginBottom: 8,
    },
    editProfileBtn: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    editProfileText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 13,
    },

    // Rows
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    rowBorder: {
        borderBottomWidth: 1,
    },
    rowText: {
        flex: 1,
        fontFamily: 'Kanit-Regular',
        fontSize: 15,
    },

    // Members
    memberAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    memberInitial: {
        fontFamily: 'Kanit-Bold',
        fontSize: 16,
        color: '#fff',
    },
    memberInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    memberName: {
        fontFamily: 'Kanit-Bold',
        fontSize: 15,
        marginBottom: 2,
    },
    memberRole: {
        fontFamily: 'Kanit-Regular',
        fontSize: 13,
    },
    adminBadge: {
        backgroundColor: 'rgba(156, 163, 175, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    adminText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 11,
        color: '#6b7280',
    },
    addMemberRow: {
        paddingVertical: 14,
    },
    addMemberIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(46,204,113,0.3)',
        borderStyle: 'dashed',
    },
    addMemberText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 15,
    },
});
