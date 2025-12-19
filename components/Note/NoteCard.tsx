/**
 * NoteCard Component
 * Card displaying a note preview in grid or list view
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Note, NoteViewMode } from '@/types/note';

dayjs.extend(relativeTime);

interface NoteCardProps {
    note: Note;
    viewMode: NoteViewMode;
    onPress: (note: Note) => void;
    onLongPress?: (note: Note) => void;
    onTogglePin?: (noteId: number) => void;
}

const { width } = Dimensions.get('window');
const GRID_CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

// Strip HTML tags for preview
const stripHtml = (html: string): string => {
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
};

const NoteCard: React.FC<NoteCardProps> = ({
    note,
    viewMode,
    onPress,
    onLongPress,
    onTogglePin
}) => {
    const contentPreview = useMemo(() => {
        const stripped = stripHtml(note.content);
        return stripped.length > 100 ? stripped.substring(0, 100) + '...' : stripped;
    }, [note.content]);

    const timeAgo = useMemo(() => {
        return dayjs(note.updatedAt).fromNow();
    }, [note.updatedAt]);

    const isGridView = viewMode === 'grid';

    return (
        <TouchableOpacity
            style={[
                styles.card,
                isGridView ? styles.gridCard : styles.listCard,
                { backgroundColor: note.color }
            ]}
            onPress={() => onPress(note)}
            onLongPress={() => onLongPress?.(note)}
            activeOpacity={0.7}
        >
            {/* Pin indicator */}
            {note.isPinned && (
                <TouchableOpacity
                    style={styles.pinIndicator}
                    onPress={() => onTogglePin?.(note.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <AntDesign name="pushpin" size={14} color="#e74c3c" />
                </TouchableOpacity>
            )}

            {/* Title */}
            {note.title && (
                <Text
                    style={styles.title}
                    numberOfLines={isGridView ? 2 : 1}
                >
                    {note.title}
                </Text>
            )}

            {/* Content Preview */}
            {contentPreview && (
                <Text
                    style={styles.content}
                    numberOfLines={isGridView ? 4 : 2}
                >
                    {contentPreview}
                </Text>
            )}

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.timestamp}>{timeAgo}</Text>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {note.tags.slice(0, 2).map((tag, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>#{tag}</Text>
                            </View>
                        ))}
                        {note.tags.length > 2 && (
                            <Text style={styles.moreTagsText}>+{note.tags.length - 2}</Text>
                        )}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden'
    },
    gridCard: {
        width: GRID_CARD_WIDTH,
        minHeight: 150,
        marginBottom: 16
    },
    listCard: {
        width: '100%',
        marginBottom: 12
    },
    pinIndicator: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 1
    },
    title: {
        fontFamily: 'Kanit-Bold',
        fontSize: 16,
        color: '#2c3e50',
        marginBottom: 8,
        paddingRight: 24 // Space for pin icon
    },
    content: {
        fontFamily: 'Kanit-Regular',
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        flex: 1
    },
    footer: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    timestamp: {
        fontFamily: 'Kanit-Regular',
        fontSize: 11,
        color: '#999'
    },
    tagsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    tag: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4
    },
    tagText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 10,
        color: '#666'
    },
    moreTagsText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 10,
        color: '#999'
    }
});

export default NoteCard;
