import React, { useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NoteCard from './NoteCard';
import { useTheme } from '@/components/ThemeProvider';
import type { Note, NoteViewMode, NoteSortOption } from '@/types/note';

interface NoteListProps {
    notes: Note[];
    isLoading: boolean;
    viewMode: NoteViewMode;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onNotePress: (note: Note) => void;
    onNoteLongPress?: (note: Note) => void;
    onTogglePin: (noteId: number) => void;
    onRefresh: () => void;
    onViewModeChange: (mode: NoteViewMode) => void;
    onAddNote: () => void;
    sortBy: NoteSortOption;
    onSortChange: (option: NoteSortOption) => void;
}

const NoteList: React.FC<NoteListProps> = ({
    notes,
    isLoading,
    viewMode,
    searchQuery,
    onSearchChange,
    onNotePress,
    onNoteLongPress,
    onTogglePin,
    onRefresh,
    onViewModeChange,
    onAddNote,
    sortBy,
    onSortChange
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const isGridView = viewMode === 'grid';
    const insets = useSafeAreaInsets();

    // Theme colors
    const colors = useMemo(() => ({
        background: isDark ? '#171717' : '#f8f9fa',
        surface: isDark ? '#262626' : '#fff',
        inputBg: isDark ? '#404040' : '#f5f5f5',
        border: isDark ? '#404040' : '#f0f0f0',
        text: isDark ? '#e5e5e5' : '#333',
        textSecondary: isDark ? '#a3a3a3' : '#666',
        textMuted: isDark ? '#737373' : '#999',
        activeButton: isDark ? '#1a3a2a' : '#e8f5e9'
    }), [isDark]);

    // Dynamic styles based on theme
    const dynamicStyles = useMemo(() => ({
        container: {
            flex: 1,
            backgroundColor: colors.background,
            paddingBottom: insets.bottom
        },
        searchContainer: {
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            zIndex: 10
        },
        searchInputContainer: {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        },
        searchInput: {
            flex: 1,
            fontFamily: 'Kanit-Regular',
            fontSize: 14,
            color: colors.text,
            marginLeft: 8
        },
        toolbar: {
            flexDirection: 'row' as const,
            justifyContent: 'space-between' as const,
            alignItems: 'center' as const,
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: colors.background,
        },
        sortButton: {
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 10,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        },
        sortButtonActive: {
            backgroundColor: isDark ? 'rgba(46, 204, 113, 0.15)' : 'rgba(46, 204, 113, 0.08)',
            borderColor: 'rgba(46, 204, 113, 0.2)'
        },
        sortButtonText: {
            fontFamily: 'Kanit-Medium',
            fontSize: 14,
            color: colors.textSecondary
        },
        viewModeButtonActive: {
            backgroundColor: isDark ? 'rgba(46, 204, 113, 0.15)' : 'rgba(46, 204, 113, 0.08)',
            borderRadius: 10
        },
        emptyTitle: {
            fontFamily: 'Kanit-SemiBold',
            fontSize: 22,
            color: colors.textSecondary,
            marginBottom: 10,
            letterSpacing: 0.2
        },
        emptySubtitle: {
            fontFamily: 'Kanit-Regular',
            fontSize: 16,
            color: colors.textMuted,
            textAlign: 'center' as const,
            paddingHorizontal: 54,
            lineHeight: 24
        }
    }), [colors, isDark, insets]);

    // Render empty state
    const renderEmptyState = useCallback(() => {
        if (isLoading) {
            return (
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color="#2ecc71" />
                </View>
            );
        }

        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={dynamicStyles.emptyTitle}>ยังไม่มีบันทึก</Text>
                <Text style={dynamicStyles.emptySubtitle}>
                    {searchQuery
                        ? 'ลองค้นหาด้วยคำอื่นดูนะ'
                        : 'แตะปุ่ม + เพื่อเริ่มเขียนบันทึกแรกของคุณ'
                    }
                </Text>
            </View>
        );
    }, [isLoading, searchQuery, dynamicStyles]);

    // Render note item
    const renderNote = useCallback(({ item }: { item: Note }) => (
        <NoteCard
            note={item}
            viewMode={viewMode}
            onPress={onNotePress}
            onLongPress={onNoteLongPress}
            onTogglePin={onTogglePin}
            isDark={isDark}
        />
    ), [viewMode, onNotePress, onNoteLongPress, onTogglePin, isDark]);

    // Key extractor
    const keyExtractor = useCallback((item: Note) => item.id.toString(), []);

    return (
        <View style={dynamicStyles.container}>
            {/* Search Bar */}
            <View style={dynamicStyles.searchContainer}>
                <View style={dynamicStyles.searchInputContainer}>
                    <Feather name="search" size={16} color={colors.textMuted} />
                    <TextInput
                        style={dynamicStyles.searchInput}
                        value={searchQuery}
                        onChangeText={onSearchChange}
                        placeholder="ค้นหาบันทึก..."
                        placeholderTextColor={colors.textMuted}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => onSearchChange('')}>
                            <Feather name="x" size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Toolbar */}
            <View style={dynamicStyles.toolbar}>
                <View style={styles.sortContainer}>
                    <TouchableOpacity
                        style={[
                            dynamicStyles.sortButton,
                            sortBy === 'updatedAt' && dynamicStyles.sortButtonActive
                        ]}
                        onPress={() => onSortChange('updatedAt')}
                    >
                        <Text style={[
                            dynamicStyles.sortButtonText,
                            sortBy === 'updatedAt' && styles.sortButtonTextActive
                        ]}>
                            ล่าสุด
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            dynamicStyles.sortButton,
                            sortBy === 'title' && dynamicStyles.sortButtonActive
                        ]}
                        onPress={() => onSortChange('title')}
                    >
                        <Text style={[
                            dynamicStyles.sortButtonText,
                            sortBy === 'title' && styles.sortButtonTextActive
                        ]}>
                            ชื่อ
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.viewModeContainer}>
                    <TouchableOpacity
                        style={[
                            styles.viewModeButton,
                            viewMode === 'grid' && dynamicStyles.viewModeButtonActive
                        ]}
                        onPress={() => onViewModeChange('grid')}
                    >
                        <MaterialIcons
                            name="grid-view"
                            size={20}
                            color={viewMode === 'grid' ? '#2ecc71' : colors.textMuted}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.viewModeButton,
                            viewMode === 'list' && dynamicStyles.viewModeButtonActive
                        ]}
                        onPress={() => onViewModeChange('list')}
                    >
                        <MaterialIcons
                            name="view-list"
                            size={20}
                            color={viewMode === 'list' ? '#2ecc71' : colors.textMuted}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Notes Grid/List */}
            <FlatList
                data={notes}
                renderItem={renderNote}
                keyExtractor={keyExtractor}
                numColumns={isGridView ? 2 : 1}
                key={viewMode} // Force re-render when switching view modes
                columnWrapperStyle={isGridView ? styles.gridRow : undefined}
                contentContainerStyle={[
                    styles.listContent,
                    notes.length === 0 && styles.emptyListContent
                ]}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={onRefresh}
                        tintColor="#2ecc71"
                        colors={['#2ecc71']}
                    />
                }
                showsVerticalScrollIndicator={false}
            />

            {/* Add Note FAB */}
            <TouchableOpacity
                style={[styles.fab, { bottom: Math.max(20, insets.bottom + 20) }]}
                onPress={onAddNote}
                activeOpacity={0.8}
            >
                <Feather name="plus" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    sortContainer: {
        flexDirection: 'row',
        gap: 8
    },
    sortButtonTextActive: {
        color: '#2ecc71',
        fontFamily: 'Kanit-SemiBold'
    },
    viewModeContainer: {
        flexDirection: 'row',
        gap: 4
    },
    viewModeButton: {
        padding: 8,
        borderRadius: 8
    },
    listContent: {
        padding: 16,
        paddingBottom: 100 // Extra padding so FAB doesn't overlay bottom items
    },
    emptyListContent: {
        flexGrow: 1
    },
    gridRow: {
        justifyContent: 'space-between'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80
    },
    emptyIcon: {
        fontSize: 72,
        marginBottom: 20,
        opacity: 0.9
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#2ecc71',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2ecc71',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)'
    }
});

export default NoteList;
