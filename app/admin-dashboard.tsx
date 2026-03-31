import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    Alert,
    ScrollView,
    ActivityIndicator,
    Modal,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ScreenHeader';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from 'expo-router';
import httpClient from '@/lib/httpClient';

// Types
interface UserStats {
    totalUsers: number;
    totalGroups: number;
    totalEvents: number;
    totalNotes: number;
}

interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: 'ADMIN' | 'USER';
    createdAt: string;
}

export default function AdminDashboardScreen() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [editName, setEditName] = useState('');
    const [editRole, setEditRole] = useState<'ADMIN' | 'USER'>('USER');
    const [submittingEdit, setSubmittingEdit] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const { getAdminStats } = await import('@/services/authService');
            // Fetch stats from real API
            const statsData = await getAdminStats();
            setStats(statsData);

            // Fetch users from existing user list API
            const userResponse = await httpClient.get('/api/v1/users?pageNo=0&pageSize=100&sortBy=userId&sortDir=asc');
            const usersData = userResponse.data.content || [];
            if (Array.isArray(usersData)) {
                setUsers(usersData.map((u: any, index: number) => ({
                    id: u.id || u.userId || index,
                    name: u.name,
                    email: u.email,
                    role: u.roles && u.roles.some((r: any) => r.name === 'ADMIN') ? 'ADMIN' : 'USER',
                    createdAt: u.createdAt || new Date().toISOString()
                })));
            }
        } catch (error) {
            console.error('Fetch dashboard error:', error);
            Alert.alert('ข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลแดชบอร์ดได้');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDeleteUser = (userId: number, userName: string) => {
        Alert.alert(
            'ลบผู้ใช้',
            `คุณแน่ใจหรือไม่ว่าต้องการลบ ${userName}? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
            [
                { text: 'ยกเลิก', style: 'cancel' },
                {
                    text: 'ลบ',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await httpClient.delete(`/api/v1/users/${userId}`);
                            setUsers(prev => prev.filter(u => u.id !== userId));
                            Alert.alert('สำเร็จ', 'ลบผู้ใช้สำเร็จแล้ว');
                        } catch (error) {
                            console.error('Delete user error:', error);
                            Alert.alert('ข้อผิดพลาด', 'ลบผู้ใช้ไม่สำเร็จ');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const openEditModal = (targetUser: AdminUser) => {
        setSelectedUser(targetUser);
        setEditName(targetUser.name);
        setEditRole(targetUser.role);
        setEditModalVisible(true);
    };

    const closeEditModal = () => {
        setEditModalVisible(false);
        setSelectedUser(null);
        setEditName('');
        setEditRole('USER');
    };

    const handleSaveUserEdit = async () => {
        if (!selectedUser) return;
        if (!editName.trim()) {
            Alert.alert('ข้อผิดพลาดในการตรวจสอบ', 'ชื่อต้องไม่ว่างเปล่า');
            return;
        }

        try {
            setSubmittingEdit(true);
            
            // Call API to edit user (Assuming PUT /api/v1/users/:id)
            const payload = {
                name: editName,
                roles: [editRole]
            };
            
            await httpClient.put(`/api/v1/users/${selectedUser.id}`, payload, {
                 headers: { 'Content-Type': 'application/json' }
            });
            
            // Update local state
            setUsers(prev => prev.map(u => 
                u.id === selectedUser.id ? { ...u, name: editName, role: editRole } : u
            ));
            
            Alert.alert('สำเร็จ', 'อัปเดตผู้ใช้สำเร็จแล้ว');
            closeEditModal();
        } catch (error) {
            console.error('Update user error:', error);
            Alert.alert('ข้อผิดพลาด', 'ไม่สามารถอัปเดตผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setSubmittingEdit(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const colors = {
        bg: isDark ? '#111' : '#f5f7fa',
        card: isDark ? '#1c1c1e' : '#fff',
        text: isDark ? '#eee' : '#1a1a1a',
        subText: isDark ? '#a3a3a3' : '#6b7280',
        border: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        accent: '#3498db',
        danger: '#e74c3c',
        success: '#2ecc71',
        warning: '#f39c12',
        overlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)'
    };

    const renderStatCard = (label: string, value: number, icon: keyof typeof Feather.glyphMap, color: string) => (
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
                <Feather name={icon} size={20} color={color} />
            </View>
            <View style={styles.statContent}>
                <Text style={[styles.statValue, { color: colors.text }]}>{value.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.subText }]}>{label}</Text>
            </View>
        </View>
    );

    const renderUserItem = ({ item }: { item: AdminUser }) => (
        <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.userInfo}>
                <View style={[styles.userAvatar, { backgroundColor: item.role === 'ADMIN' ? colors.accent : '#94a3b8' }]}>
                    <Text style={styles.userInitial}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userTextBody}>
                    <View style={styles.userNameRow}>
                        <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                        {item.role === 'ADMIN' && (
                            <View style={[styles.adminBadge, { backgroundColor: colors.accent + '20' }]}>
                                <Text style={[styles.adminBadgeText, { color: colors.accent }]}>ผู้ดูแลระบบ</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.userEmail, { color: colors.subText }]} numberOfLines={1}>{item.email}</Text>
                </View>
            </View>
            <View style={styles.userActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                    onPress={() => openEditModal(item)}
                >
                    <Feather name="edit-2" size={16} color={colors.subText} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.danger + '10' }]}
                    onPress={() => handleDeleteUser(item.id, item.name)}
                >
                    <Feather name="trash-2" size={16} color={colors.danger} />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading && !users.length) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.bg }]}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.loadingText, { color: colors.subText }]}>กำลังโหลดแดชบอร์ด...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <ScreenHeader
                title="แดชบอร์ดผู้ดูแลระบบ"
                showBack
                actions={[{ icon: 'refresh-ccw', onPress: fetchDashboardData, loading: refreshing }]}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Statistics Grid */}
                <View style={styles.statsSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>สถิติการใช้งาน</Text>
                    <View style={styles.statsGrid}>

                        {renderStatCard('ผู้ใช้ทั้งหมด', stats?.totalUsers || 0, 'users', colors.accent)}
                        {renderStatCard('กลุ่มที่สร้าง', stats?.totalGroups || 0, 'folder', colors.success)}
                        {renderStatCard('กิจกรรมที่บันทึก', stats?.totalEvents || 0, 'calendar', colors.warning)}
                        {renderStatCard('โน้ตที่เขียน', stats?.totalNotes || 0, 'file-text', '#9b59b6')}
                    </View>
                </View>

                {/* User Management Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>การจัดการผู้ใช้</Text>
                    <Text style={[styles.sectionCount, { color: colors.subText }]}>{filteredUsers.length} ผู้ใช้</Text>
                </View>

                {/* Search Bar */}
                <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Feather name="search" size={18} color={colors.subText} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="ค้นหาด้วยชื่อหรืออีเมล..."
                        placeholderTextColor={colors.subText}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Feather name="x-circle" size={18} color={colors.subText} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Loading overlay during delete */}
                {loading && users.length > 0 && (
                    <ActivityIndicator style={{ marginBottom: 12 }} size="small" color={colors.accent} />
                )}

                {/* User List */}
                <FlatList
                    data={filteredUsers}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderUserItem}
                    scrollEnabled={false}
                    initialNumToRender={10}
                    ListEmptyComponent={
                        <View style={styles.emptyView}>
                            <Feather name="user-x" size={48} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.subText }]}>ไม่พบผู้ใช้</Text>
                        </View>
                    }
                />
            </ScrollView>

            {/* Edit User Modal */}
            <Modal
                visible={editModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={closeEditModal}
            >
                <KeyboardAvoidingView 
                    style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>แก้ไขผู้ใช้</Text>
                            <TouchableOpacity onPress={closeEditModal}>
                                <Feather name="x" size={24} color={colors.subText} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: colors.subText }]}>ชื่อ</Text>
                        <TextInput
                            style={[styles.modalInput, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="ชื่อผู้ใช้"
                            placeholderTextColor={colors.subText}
                        />

                        <Text style={[styles.inputLabel, { color: colors.subText }]}>บทบาท</Text>
                        <View style={styles.roleContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.roleBtn,
                                    { borderColor: colors.border, backgroundColor: editRole === 'USER' ? colors.bg : 'transparent' },
                                    editRole === 'USER' && { borderColor: colors.accent, backgroundColor: colors.accent + '15' }
                                ]}
                                onPress={() => setEditRole('USER')}
                            >
                                <Feather name="user" size={16} color={editRole === 'USER' ? colors.accent : colors.subText} />
                                <Text style={[styles.roleText, { color: editRole === 'USER' ? colors.accent : colors.subText }]}>ผู้ใช้</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.roleBtn,
                                    { borderColor: colors.border, backgroundColor: editRole === 'ADMIN' ? colors.bg : 'transparent' },
                                    editRole === 'ADMIN' && { borderColor: '#9b59b6', backgroundColor: '#9b59b615' }
                                ]}
                                onPress={() => setEditRole('ADMIN')}
                            >
                                <Feather name="shield" size={16} color={editRole === 'ADMIN' ? '#9b59b6' : colors.subText} />
                                <Text style={[styles.roleText, { color: editRole === 'ADMIN' ? '#9b59b6' : colors.subText }]}>ผู้ดูแลระบบ</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: colors.accent, opacity: submittingEdit || !editName.trim() ? 0.7 : 1 }]}
                            onPress={handleSaveUserEdit}
                            disabled={submittingEdit || !editName.trim()}
                        >
                            {submittingEdit ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>บันทึกการเปลี่ยนแปลง</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 16 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontFamily: 'Kanit-Regular' },

    // Stats
    statsSection: { marginTop: 20, marginBottom: 28 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12, justifyContent: 'space-between' },
    statCard: {
        width: '48%',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    statContent: { flex: 1, justifyContent: 'center' },
    statValue: { fontSize: 22, fontFamily: 'Kanit-Bold', lineHeight: 28 },
    statLabel: { fontSize: 12, fontFamily: 'Kanit-Regular', opacity: 0.9 },

    // User Management
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontFamily: 'Kanit-Bold' },
    sectionCount: { fontSize: 13, fontFamily: 'Kanit-Regular' },

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        gap: 12,
        marginBottom: 20,
    },
    searchInput: { flex: 1, fontSize: 15, fontFamily: 'Kanit-Regular', padding: 0 },

    // User Items
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 12,
    },
    userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
    userAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    userInitial: { color: '#fff', fontSize: 20, fontFamily: 'Kanit-Bold' },
    userTextBody: { flex: 1 },
    userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    userName: { fontSize: 16, fontFamily: 'Kanit-Regular', flexShrink: 1 },
    adminBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    adminBadgeText: { fontSize: 10, fontFamily: 'Kanit-Regular' },
    userEmail: { fontSize: 13, fontFamily: 'Kanit-Regular' },

    userActions: { flexDirection: 'row', gap: 10 },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    emptyView: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { marginTop: 16, fontSize: 16, fontFamily: 'Kanit-Regular' },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontFamily: 'Kanit-Bold' },
    inputLabel: { fontSize: 14, fontFamily: 'Kanit-Regular', marginBottom: 8 },
    modalInput: {
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        fontFamily: 'Kanit-Regular',
        marginBottom: 20,
    },
    roleContainer: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    roleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 14,
    },
    roleText: { fontSize: 15, fontFamily: 'Kanit-Regular' },
    saveBtn: {
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#3498db',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Kanit-Bold' },
});
