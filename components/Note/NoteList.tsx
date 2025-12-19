/**
 * NoteList Component
 * Displays notes in grid or list layout with search and sort options
 */

import React, { useCallback } from 'react';
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
import NoteCard from './NoteCard';
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
    const isGridView = viewMode === 'grid';

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
                <Text style={styles.emptyTitle}>No notes yet</Text>
                <Text style={styles.emptySubtitle}>
                    {searchQuery
                        ? 'Try a different search term'
                        : 'Tap the + button to create your first note'
                    }
                </Text>
            </View>
        );
    }, [isLoading, searchQuery]);

    // Render note item
    const renderNote = useCallback(({ item }: { item: Note }) => (
        <NoteCard
            note={item}
            viewMode={viewMode}
            onPress={onNotePress}
            onLongPress={onNoteLongPress}
            onTogglePin={onTogglePin}
        />
    ), [viewMode, onNotePress, onNoteLongPress, onTogglePin]);

    // Key extractor
    const keyExtractor = useCallback((item: Note) => item.id.toString(), []);

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Feather name="search" size={18} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={onSearchChange}
                        placeholder="Search notes..."
                        placeholderTextColor="#999"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => onSearchChange('')}>
                            <Feather name="x" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Toolbar */}
            <View style={styles.toolbar}>
                <View style={styles.sortContainer}>
                    <TouchableOpacity
                        style={[
                            styles.sortButton,
                            sortBy === 'updatedAt' && styles.sortButtonActive
                        ]}
                        onPress={() => onSortChange('updatedAt')}
                    >
                        <Text style={[
                            styles.sortButtonText,
                            sortBy === 'updatedAt' && styles.sortButtonTextActive
                        ]}>
                            Recent
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.sortButton,
                            sortBy === 'title' && styles.sortButtonActive
                        ]}
                        onPress={() => onSortChange('title')}
                    >
                        <Text style={[
                            styles.sortButtonText,
                            sortBy === 'title' && styles.sortButtonTextActive
                        ]}>
                            Title
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.viewModeContainer}>
                    <TouchableOpacity
                        style={[
                            styles.viewModeButton,
                            viewMode === 'grid' && styles.viewModeButtonActive
                        ]}
                        onPress={() => onViewModeChange('grid')}
                    >
                        <MaterialIcons
                            name="grid-view"
                            size={20}
                            color={viewMode === 'grid' ? '#2ecc71' : '#999'}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.viewModeButton,
                            viewMode === 'list' && styles.viewModeButtonActive
                        ]}
                        onPress={() => onViewModeChange('list')}
                    >
                        <MaterialIcons
                            name="view-list"
                            size={20}
                            color={viewMode === 'list' ? '#2ecc71' : '#999'}
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
                style={styles.fab}
                onPress={onAddNote}
                activeOpacity={0.8}
            >
                <Feather name="plus" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Kanit-Regular',
        fontSize: 15,
        color: '#333',
        marginLeft: 8
    },
    toolbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff'
    },
    sortContainer: {
        flexDirection: 'row',
        gap: 8
    },
    sortButton: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#f5f5f5'
    },
    sortButtonActive: {
        backgroundColor: '#e8f5e9'
    },
    sortButtonText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 13,
        color: '#666'
    },
    sortButtonTextActive: {
        color: '#2ecc71',
        fontFamily: 'Kanit-Bold'
    },
    viewModeContainer: {
        flexDirection: 'row',
        gap: 4
    },
    viewModeButton: {
        padding: 8,
        borderRadius: 8
    },
    viewModeButtonActive: {
        backgroundColor: '#e8f5e9'
    },
    listContent: {
        padding: 16
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
        paddingVertical: 60
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
        opacity: 0.6
    },
    emptyTitle: {
        fontFamily: 'Kanit-Bold',
        fontSize: 18,
        color: '#666',
        marginBottom: 8
    },
    emptySubtitle: {
        fontFamily: 'Kanit-Regular',
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingHorizontal: 40
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#2ecc71',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2ecc71',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6
    }
});

export default NoteList;
