/**
 * Sidebar Component
 * Slide-in panel from the left — premium redesign
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Modal,
    ScrollView,
    Dimensions,
    Image,
} from 'react-native';
import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/components/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { Group, GroupApiResponse, GroupMember } from '@/types/group';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.80;

interface SidebarProps {
    visible: boolean;
    onClose: () => void;
    userName?: string;
    userInitial?: string;
    userPhotoUrl?: string;
}

// Sub-components 
const AVATAR_COLORS = ['#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f39c12', '#1abc9c', '#e67e22'];
const avatarBg = (i: number) => AVATAR_COLORS[i % AVATAR_COLORS.length];
const getInitial = (m: GroupMember) => (m.name || m.username || '?').trim().charAt(0).toUpperCase();

const MemberAvatar: React.FC<{ member: GroupMember; index: number }> = ({ member, index }) => (
    <View style={[styles.memberAvatar, { backgroundColor: avatarBg(index), marginLeft: index > 0 ? -7 : 0 }]}>
        {member.imageUrl ? (
            <Image
                source={{ uri: member.imageUrl }}
                style={{ width: '100%', height: '100%', borderRadius: 11 }}
            />
        ) : (
            <Text style={styles.memberInitialText}>{getInitial(member)}</Text>
        )}
    </View>
);

const GroupItem: React.FC<{ group: GroupApiResponse; isDark: boolean; onPress: () => void }> = ({ group, isDark, onPress }) => (
    <TouchableOpacity
        style={[
            styles.groupCard,
            {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            },
        ]}
        activeOpacity={0.65}
        onPress={onPress}
    >
        {/* Icon box */}
        <View style={[styles.groupIconBox, { backgroundColor: group.bg || `${group.color}20` }]}>
            <FontAwesome5 name={group.icon as any} size={20} color={group.color} />
        </View>

        {/* Name + members */}
        <View style={styles.groupMeta}>
            <Text style={[styles.groupName, { color: isDark ? '#f5f5f5' : '#1a1a1a' }]}>
                {group.groupName}
            </Text>
            <View style={styles.memberRow}>
                {group.members?.map((m, i) => (
                    <MemberAvatar key={m.userId} member={m} index={i} />
                ))}
                <Text style={[styles.memberCount, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
                    {group.members?.length || 0} members
                </Text>
            </View>
        </View>

        {/* Chevron */}
        <MaterialIcons
            name="chevron-right"
            size={20}
            color={isDark ? '#444' : '#d1d5db'}
        />
    </TouchableOpacity>
);

// Sidebar Main
const Sidebar: React.FC<SidebarProps> = ({
    visible,
    onClose,
    userName = 'User',
    userInitial,
    userPhotoUrl,
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;
    const [modalVisible, setModalVisible] = useState(false);
    const { user } = useAuthStore();
    const { groups, fetchGroups, setSelectedGroupId } = useGroupStore();

    const displayUserName = user?.name || userName;
    const displayPhotoUrl = user?.photoUrl || userPhotoUrl;
    const initial = userInitial ?? displayUserName.charAt(0).toUpperCase();

    const C = {
        panelBg: isDark ? '#141414' : '#f8f9fb',
        headerTop: isDark ? '#1b3028' : '#2d6a4f',
        headerBottom: isDark ? '#1f2e28' : '#3a7d5a',
        accentDecor: isDark ? 'rgba(46,204,113,0.12)' : 'rgba(255,255,255,0.12)',
        sectionLabel: isDark ? '#a3a3a3' : '#9ca3af',
        divider: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        footerBg: isDark ? '#1a1a1a' : '#f0f2f4',
        footerText: isDark ? '#525252' : '#9ca3af',
    };

    useEffect(() => {
        if (visible) {
            if (user?.id) fetchGroups(user.id);
            // Reset to hidden position first, then show Modal and animate in
            slideAnim.setValue(-SIDEBAR_WIDTH);
            backdropAnim.setValue(0);
            setModalVisible(true);
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 70,
                    friction: 12,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 260,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Animate out first, then hide Modal
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -SIDEBAR_WIDTH,
                    duration: 230,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 230,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setModalVisible(false);
            });
        }
    }, [visible]);

    const backdropOpacity = backdropAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
    });

    return (
        <Modal
            transparent
            visible={modalVisible}
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            {/* Backdrop */}
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
                <Animated.View
                    style={[styles.backdropFill, { opacity: backdropOpacity }]}
                    pointerEvents="none"
                />
            </TouchableOpacity>

            {/* Panel */}
            <Animated.View
                style={[
                    styles.panel,
                    { width: SIDEBAR_WIDTH, backgroundColor: C.panelBg, transform: [{ translateX: slideAnim }] },
                ]}
            >
                {/* Profile Header */}
                <View style={[styles.header, { backgroundColor: C.headerTop, paddingTop: insets.top + 14 }]}>
                    {/* Decorative circles */}
                    <View style={[styles.decorCircleLg, { backgroundColor: C.accentDecor }]} />
                    <View style={[styles.decorCircleSm, { backgroundColor: C.accentDecor }]} />

                    {/* Close */}
                    <TouchableOpacity
                        style={[styles.closeBtn, { top: insets.top }]}
                        onPress={onClose}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <View style={styles.closeBtnInner}>
                            <Feather name="x" size={16} color="rgba(255,255,255,0.9)" />
                        </View>
                    </TouchableOpacity>

                    {/* Avatar */}
                    {displayPhotoUrl ? (
                        <Image source={{ uri: displayPhotoUrl }} style={styles.avatarImg} />
                    ) : (
                        <View style={styles.avatarWrap}>
                            <View style={styles.avatarRing} />
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarInitial}>{initial}</Text>
                            </View>
                        </View>
                    )}

                    {/* Name + edit */}
                    <View style={styles.nameRow}>
                        <Text style={styles.nameText}>{displayUserName}</Text>
                        <TouchableOpacity
                            style={styles.editBtn}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            onPress={() => {
                                onClose();
                                setTimeout(() => router.push('/account-settings'), 300);
                            }}
                        >
                            <Feather name="edit-2" size={13} color="rgba(255,255,255,0.75)" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Section: Groups */}
                <ScrollView
                    style={styles.body}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.bodyContent}
                >
                    {/* Section header */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionLabel, { color: C.sectionLabel }]}>
                            GROUP LIST
                        </Text>
                        <View style={[styles.badge, { backgroundColor: isDark ? '#262626' : '#e5e7eb' }]}>
                            <Text style={[styles.badgeText, { color: C.sectionLabel }]}>
                                {groups.length}
                            </Text>
                        </View>
                    </View>

                    {groups.map(g => (
                        <GroupItem 
                            key={g.groupId}
                            group={g}
                            isDark={isDark} 
                            onPress={() => {
                                onClose();
                                setSelectedGroupId(g.groupId);
                                setTimeout(() => {
                                    router.push({
                                        pathname: '/group/[id]',
                                        params: { id: g.groupId, name: g.groupName }
                                    });
                                }, 300); // Wait for sidebar to close before navigating
                            }} 
                        />
                    ))}

                    {/* Add group button */}
                    <TouchableOpacity
                        style={[
                            styles.addGroupBtn,
                            {
                                borderColor: isDark ? 'rgba(46,204,113,0.3)' : 'rgba(46,204,113,0.4)',
                                backgroundColor: isDark ? 'rgba(46,204,113,0.05)' : 'rgba(46,204,113,0.06)',
                            },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                            onClose();
                            setTimeout(() => {
                                router.push('/group/create');
                            }, 300);
                        }}
                    >
                        <Feather name="plus" size={15} color="#2ecc71" />
                        <Text style={styles.addGroupText}>Create new group</Text>
                    </TouchableOpacity>
                </ScrollView>
            </Animated.View>
        </Modal>
    );
};

// Styles

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    backdropFill: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },

    // Panel
    panel: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 6, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 24,
        overflow: 'hidden',
    },

    // Header
    header: {
        paddingBottom: 24,
        paddingHorizontal: 22,
        overflow: 'hidden',
    },
    // Decorative circles (depth accent)
    decorCircleLg: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        top: -70,
        right: -60,
    },
    decorCircleSm: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        bottom: -30,
        left: -30,
    },
    closeBtn: {
        position: 'absolute',
        right: 16,
        zIndex: 10,
    },
    closeBtnInner: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Avatar
    avatarWrap: {
        marginBottom: 14,
    },
    avatarRing: {
        position: 'absolute',
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        top: -4,
        left: -4,
    },
    avatarCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: 'rgba(200,180,230,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2.5,
        borderColor: 'rgba(255,255,255,0.45)',
    },
    avatarImg: {
        width: 68,
        height: 68,
        borderRadius: 34,
        borderWidth: 2.5,
        borderColor: 'rgba(255,255,255,0.45)',
        marginBottom: 14,
    },
    avatarInitial: {
        fontFamily: 'Kanit-Bold',
        fontSize: 26,
        color: '#fff',
    },

    // Name
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 2,
    },
    nameText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 20,
        color: '#fff',
        letterSpacing: 0.3,
    },
    editBtn: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: 5,
    },

    // Body
    body: { flex: 1 },
    bodyContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 12,
        gap: 10,
    },

    // Section header
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
        paddingHorizontal: 2,
    },
    sectionLabel: {
        fontFamily: 'Kanit-Bold',
        fontSize: 11,
        letterSpacing: 1.4,
    },
    badge: {
        borderRadius: 20,
        paddingHorizontal: 7,
        paddingVertical: 1,
    },
    badgeText: {
        fontSize: 11,
        fontFamily: 'Kanit-Bold',
    },

    // Group card
    groupCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 13,
        gap: 12,
        borderWidth: 1,
    },
    groupIconBox: {
        width: 46,
        height: 46,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
    },
    groupMeta: { flex: 1, gap: 5 },
    groupName: {
        fontFamily: 'Kanit-Regular',
        fontSize: 15,
        letterSpacing: 0.2,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    memberAvatar: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.7)',
    },
    memberInitialText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 9,
        color: '#fff',
    },
    memberCount: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
        marginLeft: 4,
    },

    // Add group button
    addGroupBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 14,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        paddingVertical: 13,
        marginTop: 2,
    },
    addGroupText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 14,
        color: '#2ecc71',
        letterSpacing: 0.2,
    },
});

export default Sidebar;
