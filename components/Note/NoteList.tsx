import React, { useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
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

const SORT_OPTIONS: { key: NoteSortOption; label: string }[] = [
    { key: 'updatedAt', label: 'ล่าสุด' },
    { key: 'title',     label: 'ชื่อ A–Z' },
];

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
    onSortChange,
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const isGridView = viewMode === 'grid';
    const insets = useSafeAreaInsets();

    const C = useMemo(() => ({
        bg:          isDark ? '#0d0d0d' : '#f7f7f7',
        headerBg:    isDark ? '#111111' : '#ffffff',
        surface:     isDark ? '#1a1a1a' : '#ffffff',
        inputBg:     isDark ? '#1e1e1e' : '#f2f2f2',
        inputBorder: isDark ? '#2a2a2a' : '#e8e8e8',
        text:        isDark ? '#f0f0f0' : '#111111',
        muted:       isDark ? '#6b6b6b' : '#aaaaaa',
        subText:     isDark ? '#999999' : '#666666',
        accent:      '#2ecc71',
        divider:     isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    }), [isDark]);

    const renderEmptyState = useCallback(() => {
        if (isLoading) {
            return (
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color={C.accent} />
                    <Text style={[styles.emptyLoadingText, { color: C.muted }]}>กำลังโหลด...</Text>
                </View>
            );
        }
        return (
            <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconBox, { backgroundColor: isDark ? '#1e1e1e' : '#f0f0f0' }]}>
                    <Feather name="file-text" size={32} color={C.muted} />
                </View>
                <Text style={[styles.emptyTitle, { color: C.subText }]}>
                    {searchQuery ? 'ไม่พบบันทึก' : 'ยังไม่มีบันทึก'}
                </Text>
                <Text style={[styles.emptySubtitle, { color: C.muted }]}>
                    {searchQuery
                        ? `ไม่พบผลลัพธ์สำหรับ "${searchQuery}"`
                        : 'กดปุ่ม + เพื่อเริ่มเขียนบันทึกแรก'
                    }
                </Text>
            </View>
        );
    }, [isLoading, searchQuery, C, isDark]);

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

    const keyExtractor = useCallback((item: Note) => item.id.toString(), []);

    const pinnedCount = useMemo(() => notes.filter(n => n.isPinned).length, [notes]);

    return (
        <View style={[styles.root, { backgroundColor: C.bg, paddingBottom: insets.bottom }]}>

            {/* ── Search + Toolbar bar ── */}
            <View style={[styles.controlBar, { backgroundColor: C.headerBg, borderBottomColor: C.divider }]}>
                {/* Search */}
                <View style={[styles.searchBox, { backgroundColor: C.inputBg, borderColor: C.inputBorder }]}>
                    <Feather name="search" size={15} color={C.muted} />
                    <TextInput
                        style={[styles.searchInput, { color: C.text }]}
                        value={searchQuery}
                        onChangeText={onSearchChange}
                        placeholder="ค้นหาบันทึก..."
                        placeholderTextColor={C.muted}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => onSearchChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Feather name="x" size={14} color={C.muted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Toolbar row */}
                <View style={styles.toolbarRow}>
                    {/* Sort chips */}
                    <View style={styles.sortRow}>
                        {SORT_OPTIONS.map(opt => {
                            const active = sortBy === opt.key;
                            return (
                                <TouchableOpacity
                                    key={opt.key}
                                    style={[
                                        styles.chip,
                                        { backgroundColor: active ? C.accent + '18' : C.inputBg, borderColor: active ? C.accent + '50' : C.inputBorder },
                                    ]}
                                    onPress={() => onSortChange(opt.key)}
                                >
                                    <Text style={[styles.chipText, { color: active ? C.accent : C.muted }]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                        {notes.length > 0 && (
                            <Text style={[styles.noteCount, { color: C.muted }]}>
                                {pinnedCount > 0 ? `📌 ${pinnedCount}  ·  ` : ''}{notes.length} รายการ
                            </Text>
                        )}
                    </View>

                    {/* View mode toggle */}
                    <View style={[styles.viewToggle, { backgroundColor: C.inputBg, borderColor: C.inputBorder }]}>
                        <TouchableOpacity
                            style={[styles.viewBtn, isGridView && { backgroundColor: C.accent }]}
                            onPress={() => onViewModeChange('grid')}
                        >
                            <Feather name="grid" size={14} color={isGridView ? '#fff' : C.muted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.viewBtn, !isGridView && { backgroundColor: C.accent }]}
                            onPress={() => onViewModeChange('list')}
                        >
                            <Feather name="list" size={14} color={!isGridView ? '#fff' : C.muted} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* ── Note List ── */}
            <FlatList
                data={notes}
                renderItem={renderNote}
                keyExtractor={keyExtractor}
                numColumns={isGridView ? 2 : 1}
                key={viewMode}
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
                        tintColor={C.accent}
                        colors={[C.accent]}
                    />
                }
                showsVerticalScrollIndicator={false}
            />

            {/* ── FAB ── */}
            <TouchableOpacity
                style={[styles.fab, { bottom: Math.max(20, insets.bottom + 16) }]}
                onPress={onAddNote}
                activeOpacity={0.85}
            >
                <Feather name="plus" size={26} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1 },

    // Control bar (search + toolbar)
    controlBar: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 10,
        gap: 10,
        borderBottomWidth: 1,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Kanit-Regular',
        fontSize: 14,
        padding: 0,
    },

    // Toolbar row
    toolbarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sortRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    chip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
    },
    chipText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
    },
    noteCount: {
        fontFamily: 'Kanit-Regular',
        fontSize: 11,
        marginLeft: 4,
    },

    // View mode toggle
    viewToggle: {
        flexDirection: 'row',
        borderRadius: 9,
        borderWidth: 1,
        overflow: 'hidden',
    },
    viewBtn: {
        padding: 7,
        borderRadius: 8,
    },

    // List content
    listContent: {
        padding: 14,
        paddingBottom: 110,
    },
    emptyListContent: { flexGrow: 1 },
    gridRow: { justifyContent: 'space-between' },

    // Empty state
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
        gap: 10,
    },
    emptyIconBox: {
        width: 72,
        height: 72,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    emptyLoadingText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 14,
        marginTop: 10,
    },
    emptyTitle: {
        fontFamily: 'Kanit-Bold',
        fontSize: 18,
    },
    emptySubtitle: {
        fontFamily: 'Kanit-Regular',
        fontSize: 13,
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 20,
    },

    // FAB
    fab: {
        position: 'absolute',
        right: 22,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2ecc71',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2ecc71',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
    },
});

export default NoteList;
