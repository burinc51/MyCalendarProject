/**
 * Sidebar Component
 * Slide-in panel from the left showing user profile and group list
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Modal,
    ScrollView,
    Dimensions,
    Image
} from 'react-native';
import { AntDesign, Feather, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 320);

// ─── Types ───────────────────────────────────────────────────────────────────

interface GroupMember {
    id: string;
    initial: string;
    color: string;
}

interface Group {
    id: string;
    name: string;
    icon: string; // FontAwesome5 icon name
    members: GroupMember[];
}

interface SidebarProps {
    visible: boolean;
    onClose: () => void;
    userName?: string;
    userInitial?: string;
    userPhotoUrl?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_GROUPS: Group[] = [
    {
        id: '1',
        name: 'ที่ทำงาน',
        icon: 'building',
        members: [
            { id: 'm1', initial: 'ร', color: '#c084fc' },
            { id: 'm2', initial: 'บ', color: '#a78bfa' },
        ]
    },
    {
        id: '2',
        name: 'บ้าน',
        icon: 'home',
        members: [
            { id: 'm3', initial: 'บ', color: '#a78bfa' },
            { id: 'm4', initial: 'ม', color: '#c084fc' },
        ]
    },
    {
        id: '3',
        name: 'เพื่อน',
        icon: 'user-friends',
        members: [
            { id: 'm5', initial: 'บ', color: '#a78bfa' },
            { id: 'm6', initial: 'ส', color: '#c084fc' },
        ]
    }
];

// ─── Member Avatar ────────────────────────────────────────────────────────────

const MemberAvatar: React.FC<{ member: GroupMember; offset: number }> = ({ member, offset }) => (
    <View
        style={[
            styles.memberAvatar,
            { backgroundColor: member.color, marginLeft: offset > 0 ? -8 : 0 }
        ]}
    >
        <Text style={styles.memberInitial}>{member.initial}</Text>
    </View>
);

// ─── Group Item ───────────────────────────────────────────────────────────────

const GroupItem: React.FC<{ group: Group; isDark: boolean }> = ({ group, isDark }) => (
    <TouchableOpacity
        style={[styles.groupItem, { backgroundColor: isDark ? '#2a2a2a' : '#ffffff' }]}
        activeOpacity={0.7}
    >
        <View style={[styles.groupIconBox, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}>
            <FontAwesome5
                name={group.icon}
                size={22}
                color={isDark ? '#d4d4d4' : '#404040'}
                solid={false}
            />
        </View>
        <View style={styles.groupInfo}>
            <Text style={[styles.groupName, { color: isDark ? '#e5e5e5' : '#1a1a1a' }]}>
                {group.name}
            </Text>
            <View style={styles.memberRow}>
                {group.members.map((member, index) => (
                    <MemberAvatar key={member.id} member={member} offset={index} />
                ))}
            </View>
        </View>
    </TouchableOpacity>
);

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar: React.FC<SidebarProps> = ({
    visible,
    onClose,
    userName = 'Burin',
    userInitial,
    userPhotoUrl
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    const derivedInitial = userInitial ?? (userName ? userName.charAt(0).toUpperCase() : 'U');

    // ─── Animate open/close ───────────────────────────────────────────────────

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 11
                }),
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -SIDEBAR_WIDTH,
                    duration: 220,
                    useNativeDriver: true
                }),
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 220,
                    useNativeDriver: true
                })
            ]).start();
        }
    }, [visible]);

    const backdropOpacity = backdropAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.45]
    });

    const colors = {
        sidebarBg: isDark ? '#1c1c1e' : '#f4f4f4',
        surface: isDark ? '#2a2a2a' : '#ffffff',
        text: isDark ? '#e5e5e5' : '#1a1a1a',
        subtext: isDark ? '#a3a3a3' : '#6b7280',
        divider: isDark ? '#333' : '#e5e5e5',
        groupSection: isDark ? '#1c1c1e' : '#f4f4f4',
        profileHeaderBg: isDark ? '#3a6b55' : '#71a88a',
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            {/* Backdrop */}
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={onClose}
            >
                <Animated.View
                    style={[styles.backdropFill, { opacity: backdropOpacity }]}
                    pointerEvents="none"
                />
            </TouchableOpacity>

            {/* Sidebar Panel */}
            <Animated.View
                style={[
                    styles.sidebar,
                    {
                        width: SIDEBAR_WIDTH,
                        backgroundColor: colors.sidebarBg,
                        transform: [{ translateX: slideAnim }]
                    }
                ]}
            >
                {/* ── Profile Header ── */}
                <View style={[styles.profileHeader, { backgroundColor: colors.profileHeaderBg }]}>
                    {/* Close button */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Feather name="x" size={20} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.profileContent}>
                        {/* Avatar */}
                        {userPhotoUrl ? (
                            <Image source={{ uri: userPhotoUrl }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarInitial}>{derivedInitial}</Text>
                            </View>
                        )}

                        {/* Name + edit */}
                        <View style={styles.profileNameRow}>
                            <Text style={styles.profileName}>{userName}</Text>
                            <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Feather name="edit-2" size={15} color="rgba(255,255,255,0.85)" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* ── Group List ── */}
                <View style={styles.groupSection}>
                    <Text style={[styles.groupSectionTitle, { color: colors.text }]}>
                        Group list ({MOCK_GROUPS.length})
                    </Text>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.groupList}
                    >
                        {MOCK_GROUPS.map(group => (
                            <GroupItem key={group.id} group={group} isDark={isDark} />
                        ))}
                    </ScrollView>
                </View>
            </Animated.View>
        </Modal>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    backdropFill: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },

    // Sidebar panel
    sidebar: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 20,
        overflow: 'hidden',
    },

    // Profile Header
    profileHeader: {
        paddingTop: 52,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    profileContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    avatarImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(200,180,230,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    avatarInitial: {
        fontSize: 28,
        fontFamily: 'Kanit-Bold',
        color: '#fff',
        letterSpacing: 1,
    },
    profileNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    profileName: {
        fontFamily: 'Kanit-Bold',
        fontSize: 20,
        color: '#fff',
        letterSpacing: 0.4,
    },

    // Group section
    groupSection: {
        flex: 1,
        paddingTop: 18,
        paddingHorizontal: 16,
    },
    groupSectionTitle: {
        fontFamily: 'Kanit-Bold',
        fontSize: 16,
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    groupList: {
        gap: 10,
        paddingBottom: 24,
    },

    // Group item
    groupItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        padding: 12,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    groupIconBox: {
        width: 52,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    groupInfo: {
        flex: 1,
        gap: 6,
    },
    groupName: {
        fontFamily: 'Kanit-Regular',
        fontSize: 15,
        letterSpacing: 0.2,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // Member avatars
    memberAvatar: {
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    memberInitial: {
        fontSize: 11,
        fontFamily: 'Kanit-Bold',
        color: '#fff',
    },
});

export default Sidebar;
