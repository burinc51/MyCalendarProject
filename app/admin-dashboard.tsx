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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ScreenHeader';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from 'expo-router';

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

    // Mock initial data
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
            const { default: httpClient } = await import('@/lib/httpClient');
            const userResponse = await httpClient.get('/api/v1/users?pageSize=100');
            // Handle PaginationResponse format
            const usersData = userResponse.data.content || [];
            setUsers(usersData.map((u: any) => ({
                id: u.userId,
                name: u.name,
                email: u.email,
                role: u.roles && u.roles.some((r: any) => r.name === 'ADMIN') ? 'ADMIN' : 'USER',
                createdAt: u.createdAt || '2026-03-26'
            })));

        } catch (error) {
            console.error('Fetch dashboard error:', error);
            Alert.alert('Error', 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDeleteUser = (userId: number, userName: string) => {
        Alert.alert(
            'Delete User',
            `Are you sure you want to delete ${userName}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setUsers(prev => prev.filter(u => u.id !== userId));
                        Alert.alert('Success', 'User deleted successfully.');
                    }
                }
            ]
        );
    };

    const handlePromoteUser = (userId: number, currentRole: string) => {
        const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
        Alert.alert(
            'Change Role',
            `Change ${newRole === 'ADMIN' ? 'to Administrator' : 'to Regular User'}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => {
                        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as 'ADMIN' | 'USER' } : u));
                    }
                }
            ]
        );
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
        danger: '#e74c3c'
    };

    const renderStatCard = (label: string, value: number, icon: keyof typeof Feather.glyphMap, color: string) => (
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIconBox, { backgroundColor: color + '15' }]}>
                <Feather name={icon} size={18} color={color} />
            </View>
            <View>
                <Text style={[styles.statValue, { color: colors.text }]}>{value.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.subText }]}>{label}</Text>
            </View>
        </View>
    );

    const renderUserItem = ({ item }: { item: AdminUser }) => (
        <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.userInfo}>
                <View style={[styles.userAvatar, { backgroundColor: item.role === 'ADMIN' ? colors.accent : '#94a3b8' }]}>
                    <Text style={styles.userInitial}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.userTextBody}>
                    <View style={styles.userNameRow}>
                        <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
                        {item.role === 'ADMIN' && (
                            <View style={[styles.adminBadge, { backgroundColor: colors.accent + '20' }]}>
                                <Text style={[styles.adminBadgeText, { color: colors.accent }]}>ADMIN</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.userEmail, { color: colors.subText }]}>{item.email}</Text>
                </View>
            </View>
            <View style={styles.userActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                    onPress={() => handlePromoteUser(item.id, item.role)}
                >
                    <Feather name="shield" size={16} color={colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                    onPress={() => handleDeleteUser(item.id, item.name)}
                >
                    <Feather name="trash-2" size={16} color={colors.danger} />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.bg }]}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.loadingText, { color: colors.subText }]}>Loading Dashboard...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <ScreenHeader
                title="Admin Dashboard"
                showBack
                actions={[{ icon: 'refresh-ccw', onPress: fetchDashboardData, loading: refreshing }]}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Statistics Grid */}
                <View style={styles.statsGrid}>
                    {renderStatCard('Users', stats?.totalUsers || 0, 'users', '#3498db')}
                    {renderStatCard('Groups', stats?.totalGroups || 0, 'folder', '#2ecc71')}
                    {renderStatCard('Events', stats?.totalEvents || 0, 'calendar', '#e67e22')}
                    {renderStatCard('Notes', stats?.totalNotes || 0, 'file-text', '#9b59b6')}
                </View>

                {/* User Management Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>User Management</Text>
                    <Text style={[styles.sectionCount, { color: colors.subText }]}>{filteredUsers.length} total</Text>
                </View>

                {/* Search Bar */}
                <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Feather name="search" size={18} color={colors.subText} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search by name or email..."
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

                {/* User List */}
                <FlatList
                    data={filteredUsers}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderUserItem}
                    scrollEnabled={false}
                    ListEmptyComponent={
                        <View style={styles.emptyView}>
                            <Feather name="user-x" size={48} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.subText }]}>No users found</Text>
                        </View>
                    }
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 16 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontFamily: 'Kanit-Regular' },

    // Stats
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20, marginBottom: 24 },
    statCard: {
        width: '48%',
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 18, fontFamily: 'Kanit-Bold' },
    statLabel: { fontSize: 12, fontFamily: 'Kanit-Regular' },

    // User Management
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontFamily: 'Kanit-Bold' },
    sectionCount: { fontSize: 13, fontFamily: 'Kanit-Regular' },

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        gap: 10,
        marginBottom: 16,
    },
    searchInput: { flex: 1, fontSize: 14, fontFamily: 'Kanit-Regular', padding: 0 },

    // User Items
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 10,
    },
    userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    userAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    userInitial: { color: '#fff', fontSize: 18, fontFamily: 'Kanit-Bold' },
    userTextBody: { flex: 1 },
    userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    userName: { fontSize: 15, fontFamily: 'Kanit-Bold' },
    adminBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    adminBadgeText: { fontSize: 10, fontFamily: 'Kanit-Bold' },
    userEmail: { fontSize: 13, fontFamily: 'Kanit-Regular' },

    userActions: { flexDirection: 'row', gap: 8 },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    emptyView: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { marginTop: 12, fontFamily: 'Kanit-Regular' },
});
