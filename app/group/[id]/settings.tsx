import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeProvider';
import ScreenHeader from '@/components/ScreenHeader';

// Mock Data for members matching Sidebar group
const MOCK_MEMBERS = [
    { id: '1', name: 'Burin', initial: 'บ', bg: '#818cf8', role: 'Admin' },
    { id: '2', name: 'Somchai', initial: 'ส', bg: '#c084fc', role: 'Member' },
    { id: '3', name: 'Mana', initial: 'ม', bg: '#f472b6', role: 'Member' },
];

export default function GroupSettingsScreen() {
    const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
            "Leave Group",
            "Are you sure you want to leave this group? You will no longer have access to its calendar.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Leave",
                    style: "destructive",
                    onPress: () => {
                        // TODO: Implement leave action
                        router.replace('/(tabs)');
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScreenHeader title={`${name || 'Group'} Settings`} showBack={true} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* --- Section: Group Profile --- */}
                <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <View style={styles.profileBox}>
                        <View style={[styles.groupIconLg, { backgroundColor: isDark ? 'rgba(74,222,128,0.15)' : '#eafaf1' }]}>
                            <FontAwesome5 name="users" size={32} color={colors.accent} />
                        </View>
                        <Text style={[styles.groupName, { color: colors.textPrimary }]}>{name || 'Group Name'}</Text>
                        <TouchableOpacity style={styles.editProfileBtn}>
                            <Text style={[styles.editProfileText, { color: colors.accent }]}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- Section: Members --- */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MEMBERS ({MOCK_MEMBERS.length})</Text>
                <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    {MOCK_MEMBERS.map((member, index) => (
                        <View key={member.id} style={[
                            styles.row,
                            index < MOCK_MEMBERS.length - 1 && [styles.rowBorder, { borderBottomColor: colors.border }]
                        ]}>
                            <View style={[styles.memberAvatar, { backgroundColor: member.bg }]}>
                                <Text style={styles.memberInitial}>{member.initial}</Text>
                            </View>
                            <View style={styles.memberInfo}>
                                <Text style={[styles.memberName, { color: colors.textPrimary }]}>{member.name}</Text>
                                <Text style={[styles.memberRole, { color: colors.textSecondary }]}>{member.role}</Text>
                            </View>
                            {member.role === 'Admin' && (
                                <View style={styles.adminBadge}>
                                    <Text style={styles.adminText}>Admin</Text>
                                </View>
                            )}
                        </View>
                    ))}

                    <TouchableOpacity style={[styles.row, styles.addMemberRow, styles.rowBorder, { borderBottomColor: colors.border }]} activeOpacity={0.6}>
                        <View style={[styles.addMemberIcon, { backgroundColor: isDark ? 'rgba(46,204,113,0.1)' : '#eafaf1' }]}>
                            <Feather name="plus" size={18} color={colors.accent} />
                        </View>
                        <Text style={[styles.addMemberText, { color: colors.accent }]}>Add Members</Text>
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
                    <TouchableOpacity style={styles.row} activeOpacity={0.6}>
                        <View style={[styles.prefIcon, { backgroundColor: isDark ? '#333' : '#f3f4f6' }]}>
                            <Feather name="link" size={18} color={colors.textPrimary} />
                        </View>
                        <Text style={[styles.rowText, { color: colors.textPrimary }]}>Share Invite Link</Text>
                        <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
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
        backgroundColor: 'rgba(46,204,113,0.1)',
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
});
