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
import { Feather, MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import ScreenHeader from '@/components/ScreenHeader';
import { getGroupById, removeMemberFromGroup } from '@/services/groupService';
import { useAuthStore } from '@/stores/useAuthStore';
import { Group } from '@/types/group';

export default function GroupSettingsScreen() {
    const { id, name: initialName } = useLocalSearchParams<{ id: string; name?: string }>();
    const groupId = parseInt(id as string);
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();

    const [group, setGroup] = useState<Group | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const isFirstRun = useRef(true);

    useFocusEffect(
        React.useCallback(() => {
            if (groupId) {
                fetchGroupData(isFirstRun.current);
                isFirstRun.current = false;
            }
        }, [groupId])
    );

    const fetchGroupData = async (showLoading = false) => {
        try {
            if (showLoading) setIsLoading(true);
            const data = await getGroupById(groupId);
            setGroup(data);
        } catch (error) {
            console.error('Failed to fetch group:', error);
            Alert.alert('Error', 'Failed to load group details');
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

    const handleCopyInviteCode = () => {
        if (group?.inviteCode) {
            Clipboard.setString(group.inviteCode);
            Alert.alert("Copied!", "Invite code copied to clipboard.");
        }
    };

    const handleLeaveGroup = () => {
        Alert.alert(
            "Leave Group",
            "Are you sure you want to leave this group? You will no longer have access to its calendar.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Leave",
                    style: "destructive",
                    onPress: async () => {
                        if (user?.id) {
                            try {
                                await removeMemberFromGroup(groupId, user.id);
                                router.replace('/(tabs)');
                            } catch (e: any) {
                                Alert.alert("Error", e.message || "Failed to leave group");
                            }
                        }
                    }
                }
            ]
        );
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

            <ScreenHeader title={`${group?.name || initialName || 'Group'} Settings`} showBack={true} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* --- Section: Group Profile --- */}
                <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <View style={styles.profileBox}>
                        <View style={[styles.groupIconLg, { backgroundColor: (group?.color || colors.accent) + '20' }]}>
                            <FontAwesome5 name={group?.icon || "users"} size={32} color={group?.color || colors.accent} />
                        </View>
                        <Text style={[styles.groupName, { color: colors.textPrimary }]}>{group?.name || initialName}</Text>
                        <TouchableOpacity
                            style={styles.editProfileBtn}
                            className='bg-blue-500'
                            onPress={() => router.push({
                                pathname: '/group/create',
                                params: { id: group?.id, mode: 'edit' }
                            })}
                        >
                            <Text style={[styles.editProfileText]} className='text-white'>Settings</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- Section: Invite Code --- */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>INVITE CODE</Text>
                <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <View style={styles.row}>
                        <View style={[styles.prefIcon, { backgroundColor: isDark ? '#333' : '#f3f4f6' }]}>
                            <Ionicons name="key-outline" size={18} color={colors.textPrimary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.rowText, { color: colors.textPrimary, fontFamily: 'Kanit-Bold', fontSize: 18, letterSpacing: 2 }]}>
                                {group?.inviteCode || '------'}
                            </Text>
                            <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: 'Kanit-Regular' }}>Share this code with others to join</Text>
                        </View>
                        <TouchableOpacity style={styles.copyBtn} onPress={handleCopyInviteCode}>
                            <Feather name="copy" size={18} color={colors.accent} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- Section: Members --- */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MEMBERS ({members.length})</Text>
                <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    {members.map((member, index) => (
                        <View key={member.userId} style={[
                            styles.row,
                            index < members.length - 1 && [styles.rowBorder, { borderBottomColor: colors.border }]
                        ]}>
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
                                    {member.name} {member.userId === user?.id && <Text style={{ fontSize: 12, fontWeight: 'normal' }}>(You)</Text>}
                                </Text>
                                <Text style={[styles.memberRole, { color: colors.textSecondary }]}>{member.role || 'Member'}</Text>
                            </View>
                            {member.role === 'ADMIN' && (
                                <View style={styles.adminBadge}>
                                    <Text style={styles.adminText}>Admin</Text>
                                </View>
                            )}
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[styles.row, styles.addMemberRow]}
                        activeOpacity={0.6}
                        onPress={handleCopyInviteCode}
                    >
                        <View style={[styles.addMemberIcon, { backgroundColor: isDark ? 'rgba(46,204,113,0.1)' : '#eafaf1' }]}>
                            <Feather name="user-plus" size={18} color={colors.accent} />
                        </View>
                        <Text style={[styles.addMemberText, { color: colors.accent }]}>Invite Members via Code</Text>
                    </TouchableOpacity>
                </View>

                {/* --- Section: Preferences --- */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PREFERENCES</Text>
                <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <View style={[styles.row, styles.rowBorder, { borderBottomColor: colors.border }]}>
                        <View style={[styles.prefIcon, { backgroundColor: isDark ? '#333' : '#f3f4f6' }]}>
                            <Feather name="bell" size={18} color={colors.textPrimary} />
                        </View>
                        <Text style={[styles.rowText, { color: colors.textPrimary }]}>Notifications</Text>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: isDark ? '#444' : '#d1d5db', true: colors.accent }}
                            thumbColor="#fff"
                            style={{ transform: [{ scale: 0.85 }] }}
                        />
                    </View>
                </View>

                {/* --- Section: Danger Zone --- */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DANGER ZONE</Text>
                <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.row, { paddingVertical: 14 }]}
                        activeOpacity={0.6}
                        onPress={handleLeaveGroup}
                    >
                        <Feather name="log-out" size={18} color={colors.danger} style={{ marginLeft: 6, marginRight: 14 }} />
                        <Text style={[styles.rowText, { color: colors.danger, fontFamily: 'Kanit-Bold' }]}>Leave Group</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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

    // Preferences
    prefIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    copyBtn: {
        padding: 8,
        backgroundColor: 'rgba(46,204,113,0.1)',
        borderRadius: 8,
    }
});
