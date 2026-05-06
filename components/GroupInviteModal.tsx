import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Modal,
    Image,
    Platform,
    TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeProvider';
import { InvitableUser } from '@/types/group';
import { getInvitableUsersPaginated, sendGroupInvitations } from '@/services/groupService';

interface GroupInviteModalProps {
    visible: boolean;
    groupId: number;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function GroupInviteModal({
    visible,
    groupId,
    onClose,
    onSuccess,
}: GroupInviteModalProps) {
    
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const PAGE_SIZE_OPTIONS = [1, 5, 10, 15, 20];

    const [users, setUsers] = useState<InvitableUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const colors = {
        background: isDark ? '#121212' : '#f5f7fa',
        cardBg: isDark ? '#121212' : '#f5f7fa',
        textPrimary: isDark ? '#f5f5f5' : '#1a1a1a',
        textSecondary: isDark ? '#a3a3a3' : '#6b7280',
        border: isDark ? '#262626' : '#e5e7eb',
        accent: '#2ecc71',
        danger: '#ef4444',
        disabledBg: isDark ? '#2a2a2a' : '#f3f4f6',
    };

    useEffect(() => {
        if (visible) {
            setSearchText('');
            setActiveSearch('');
            setCurrentPage(1);
            setUsers([]);
            fetchInvitableUsers(1, '');
        }
    }, [visible]);

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const fetchInvitableUsers = async (page = 1, search?: string, size?: number) => {
        try {
            if (page === 1) {
                setIsLoading(true);
                setSelectedUserIds(new Set());
            } else {
                setIsLoadingMore(true);
            }

            const searchTerm = search !== undefined ? search : activeSearch;
            const effectivePageSize = size !== undefined ? size : pageSize;
            const filter: Record<string, any> = {
                name: searchTerm.trim(),
            };

            const response = await getInvitableUsersPaginated(groupId, {
                pageNumber: page,
                pageSize: effectivePageSize,
                sortBy: 'id',
                sortOrder: 'DESC',
                filter,
            });

            setTotalPages(response.totalPages);

            if (page === 1) {
                setUsers(response.content);
            } else {
                setUsers((prev) => [...prev, ...response.content]);
            }

            setCurrentPage(page);
        } catch (error) {
            console.error('Failed to fetch invitable users:', error);
            if (page === 1) {
                Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโหลดผู้ใช้ได้');
            }
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    const handleSearchChange = useCallback((text: string) => {
        setSearchText(text);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            setActiveSearch(text);
            setCurrentPage(1);
            setUsers([]);
            fetchInvitableUsers(1, text);
        }, 500);
    }, [groupId, pageSize]);

    const handleClearSearch = useCallback(() => {
        setSearchText('');
        setActiveSearch('');
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        setCurrentPage(1);
        setUsers([]);
        fetchInvitableUsers(1, '');
    }, [groupId, pageSize]);

    const handlePageSizeChange = useCallback((newSize: number) => {
        setPageSize(newSize);
        setShowPageSizeDropdown(false);
        setCurrentPage(1);
        setUsers([]);
        setSelectedUserIds(new Set());
        fetchInvitableUsers(1, activeSearch, newSize);
    }, [groupId, activeSearch]);

    const toggleUserSelection = (userId: number) => {
        const newSet = new Set(selectedUserIds);
        if (newSet.has(userId)) {
            newSet.delete(userId);
        } else {
            newSet.add(userId);
        }
        setSelectedUserIds(newSet);
    };

    const handleSendInvitations = async () => {
        if (selectedUserIds.size === 0) {
            Alert.alert('เลือกผู้ใช้', 'กรุณาเลือกผู้ใช้อย่างน้อย 1 คน');
            return;
        }

        try {
            setIsInviting(true);
            await sendGroupInvitations(groupId, {
                userIds: Array.from(selectedUserIds),
            });

            Alert.alert('สำเร็จ', `เชิญผู้ใช้ ${selectedUserIds.size} คน สำเร็จแล้ว`);
            setSelectedUserIds(new Set());
            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error('Failed to send invitations:', error);
            Alert.alert('ข้อผิดพลาด', error.message || 'ไม่สามารถส่งคำเชิญได้');
        } finally {
            setIsInviting(false);
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'INVITABLE':
                return { bg: isDark ? 'rgba(46,204,113,0.2)' : '#eafaf1', text: colors.accent };
            case 'INVITED':
                return { bg: isDark ? 'rgba(245,158,11,0.2)' : '#fffbeb', text: '#f59e0b' };
            case 'ALREADY_IN_GROUP':
                return { bg: isDark ? 'rgba(156,163,175,0.2)' : '#f3f4f6', text: '#6b7280' };
            default:
                return { bg: colors.disabledBg, text: colors.textSecondary };
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'INVITABLE':
                return 'สามารถเชิญได้';
            case 'INVITED':
                return 'ได้เชิญแล้ว';
            case 'ALREADY_IN_GROUP':
                return 'อยู่ในกลุ่ม';
            default:
                return status;
        }
    };

    const isUserSelectable = (status: string) => status === 'INVITABLE';

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onClose}>
                        <Feather name="x" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                        เชิญสมาชิก
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Search Bar + Page Size */}
                <View style={[styles.searchContainer, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
                    <View style={styles.searchRow}>
                        <View style={[styles.searchInputWrapper, { backgroundColor: isDark ? '#262626' : '#f0f2f5', borderColor: colors.border }]}>
                            <Feather name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
                            <TextInput
                                style={[styles.searchInput, { color: colors.textPrimary }]}
                                placeholder="ค้นหาชื่อหรือ username..."
                                placeholderTextColor={colors.textSecondary}
                                value={searchText}
                                onChangeText={handleSearchChange}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="search"
                            />
                            {searchText.length > 0 && (
                                <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
                                    <Feather name="x-circle" size={18} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Page Size Dropdown */}
                        <View style={styles.pageSizeWrapper}>
                            <TouchableOpacity
                                style={[styles.pageSizeSelector, { borderColor: colors.border, backgroundColor: isDark ? '#262626' : '#f0f2f5' }]}
                                onPress={() => setShowPageSizeDropdown(!showPageSizeDropdown)}
                            >
                                <Text style={[styles.pageSizeSelectorText, { color: colors.textPrimary }]}>{pageSize}</Text>
                                <Feather name={showPageSizeDropdown ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textSecondary} />
                            </TouchableOpacity>

                            {showPageSizeDropdown && (
                                <View style={[styles.pageSizeDropdown, { backgroundColor: isDark ? '#1e1e1e' : '#fff', borderColor: colors.border }]}>
                                    {PAGE_SIZE_OPTIONS.map((size) => (
                                        <TouchableOpacity
                                            key={size}
                                            style={[
                                                styles.pageSizeOption,
                                                { borderBottomColor: colors.border },
                                                size === pageSize && { backgroundColor: isDark ? 'rgba(46,204,113,0.15)' : '#eafaf1' },
                                            ]}
                                            onPress={() => handlePageSizeChange(size)}
                                        >
                                            <Text style={[
                                                styles.pageSizeOptionText,
                                                { color: size === pageSize ? colors.accent : colors.textPrimary },
                                            ]}>
                                                {size}
                                            </Text>
                                            {size === pageSize && (
                                                <Feather name="check" size={14} color={colors.accent} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Content */}
                {isLoading && users.length === 0 ? (
                    <View style={styles.centerContent}>
                        <ActivityIndicator size="large" color={colors.accent} />
                    </View>
                ) : !isLoading && users.length === 0 ? (
                    <View style={styles.centerContent}>
                        <Feather name="users" size={48} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 15}]}>
                            ไม่มีผู้ใช้ที่สามารถเชิญได้
                        </Text>
                    </View>
                ) : (
                    <>
                        <ScrollView style={styles.userList} showsVerticalScrollIndicator={false}>
                            {users.map((user) => {
                                const isSelectable = isUserSelectable(user.inviteStatus);
                                const isSelected = selectedUserIds.has(user.userId);
                                const statusColor = getStatusBadgeColor(user.inviteStatus);

                                return (
                                    <TouchableOpacity
                                        key={user.userId}
                                        style={[
                                            styles.userItem,
                                            { borderBottomColor: colors.border },
                                            !isSelectable && { opacity: 0.6 }
                                        ]}
                                        onPress={() => isSelectable && toggleUserSelection(user.userId)}
                                        disabled={!isSelectable}
                                        activeOpacity={isSelectable ? 0.7 : 1}
                                    >
                                        <TouchableOpacity
                                            style={[
                                                styles.checkbox,
                                                {
                                                    borderColor: isSelected ? colors.accent : colors.border,
                                                    backgroundColor: isSelected ? colors.accent : 'transparent',
                                                }
                                            ]}
                                            onPress={() => isSelectable && toggleUserSelection(user.userId)}
                                            disabled={!isSelectable}
                                        >
                                            {isSelected && (
                                                <Feather name="check" size={16} color="#fff" />
                                            )}
                                        </TouchableOpacity>

                                        <View style={{ flex: 1 }}>
                                            <View style={styles.userHeader}>
                                                {user.imageUrl ? (
                                                    <Image
                                                        source={{ uri: user.imageUrl }}
                                                        style={styles.userAvatar}
                                                    />
                                                ) : (
                                                    <View style={[styles.userAvatar, { backgroundColor: '#94a3b8', justifyContent: 'center', alignItems: 'center' }]}>
                                                        <Text style={styles.avatarText}>
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </Text>
                                                    </View>
                                                )}
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.userName, { color: colors.textPrimary }]}>
                                                        {user.name}
                                                    </Text>
                                                    <Text style={[styles.userUsername, { color: colors.textSecondary }]}>
                                                        @{user.username}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                                            <Text style={[styles.statusText, { color: statusColor.text }]}>
                                                {getStatusText(user.inviteStatus)}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}

                            {/* Load More Button */}
                            {currentPage < totalPages && (
                                <TouchableOpacity
                                    style={[styles.loadMoreBtn, { borderTopColor: colors.border }]}
                                    onPress={() => fetchInvitableUsers(currentPage + 1, activeSearch)}
                                    disabled={isLoadingMore}
                                >
                                    {isLoadingMore ? (
                                        <ActivityIndicator size="small" color={colors.accent} />
                                    ) : (
                                        <>
                                            <Feather name="chevron-down" size={18} color={colors.accent} />
                                            <Text style={[styles.loadMoreText, { color: colors.accent }]}>
                                                เพิ่มเติม
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </ScrollView>

                        {/* Bottom Bar */}
                        <View style={[styles.bottomBar, { borderTopColor: colors.border, backgroundColor: colors.cardBg }]}>
                            <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
                                เลือก {selectedUserIds.size} คน
                            </Text>
                            <TouchableOpacity
                                style={[
                                    styles.inviteBtn,
                                    {
                                        backgroundColor: selectedUserIds.size > 0 ? colors.accent : colors.disabledBg,
                                    }
                                ]}
                                onPress={handleSendInvitations}
                                disabled={selectedUserIds.size === 0 || isInviting}
                            >
                                {isInviting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.inviteBtnText}>ส่งคำเชิญ</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'web' ? 0 : 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontFamily: 'Kanit-Bold',
        fontSize: 18,
    },
    centerContent: {
        flex: 1,
        paddingBottom: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 14,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        zIndex: 10,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Kanit-Regular',
        fontSize: 14,
        paddingVertical: 0,
        height: 44,
    },
    clearBtn: {
        padding: 4,
        marginLeft: 4,
    },
    userList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    avatarText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 16,
        color: '#fff',
    },
    userName: {
        fontFamily: 'Kanit-Bold',
        fontSize: 14,
        marginBottom: 2,
    },
    userUsername: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 11,
    },
    pageSizeWrapper: {
        position: 'relative',
        zIndex: 20,
    },
    pageSizeSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        gap: 4,
    },
    pageSizeSelectorText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 13,
        minWidth: 20,
        textAlign: 'center',
    },
    pageSizeDropdown: {
        position: 'absolute',
        top: '100%',
        right: 0,
        minWidth: 80,
        borderRadius: 10,
        borderWidth: 1,
        marginTop: 4,
        overflow: 'hidden',
        ...Platform.select({
            web: {
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            },
            default: {
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            },
        }),
    },
    pageSizeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    pageSizeOptionText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 14,
    },
    loadMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderTopWidth: 1,
        marginTop: 4,
    },
    loadMoreText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 14,
        marginLeft: 8,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        paddingBottom: Platform.OS === 'web' ? 24 : 18,
    },
    selectedCount: {
        fontFamily: 'Kanit-Regular',
        fontSize: 14,
        flex: 1,
    },
    inviteBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inviteBtnText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 14,
        color: '#fff',
    },
});

