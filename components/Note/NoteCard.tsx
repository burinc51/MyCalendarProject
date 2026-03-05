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
    isDark?: boolean;
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

// Helper to calculate color brightness
const isColorDark = (color: string): boolean => {
    // Default handle for non-hex or undefined
    if (!color || !color.startsWith('#')) return false;

    // Convert hex to rgb
    const hex = color.replace('#', '');
    const r = parseInt(hex.length === 3 ? hex.charAt(0) + hex.charAt(0) : hex.substring(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex.charAt(1) + hex.charAt(1) : hex.substring(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex.charAt(2) + hex.charAt(2) : hex.substring(4, 6), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5; // true if color is dark
};

const NoteCard: React.FC<NoteCardProps> = ({
    note,
    viewMode,
    onPress,
    onLongPress,
    onTogglePin,
    isDark = false
}) => {
    // Theme colors
    const colors = useMemo(() => {
        const cardBg = isDark && note.color === '#ffffff' ? '#262626' : note.color;

        const useDarkText = !isColorDark(cardBg);

        return {
            title: useDarkText ? '#2c3e50' : '#e5e5e5',
            content: useDarkText ? '#666' : '#a3a3a3',
            timestamp: useDarkText ? '#999' : '#737373',
            tagBg: useDarkText ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
            tagText: useDarkText ? '#666' : '#a3a3a3',
            moreTagsText: useDarkText ? '#999' : '#737373',
            cardBg
        };
    }, [isDark, note.color]);

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
                { backgroundColor: colors.cardBg }
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
                    style={[styles.title, { color: colors.title }]}
                    numberOfLines={isGridView ? 2 : 1}
                >
                    {note.title}
                </Text>
            )}

            {/* Content Preview */}
            {contentPreview && (
                <Text
                    style={[styles.content, { color: colors.content }]}
                    numberOfLines={isGridView ? 4 : 2}
                >
                    {contentPreview}
                </Text>
            )}

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={[styles.timestamp, { color: colors.timestamp }]}>
                    {timeAgo}
                </Text>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {note.tags.slice(0, 2).map((tag, index) => (
                            <View
                                key={index}
                                style={[styles.tag, { backgroundColor: colors.tagBg }]}
                            >
                                <Text style={[styles.tagText, { color: colors.tagText }]}>
                                    #{tag}
                                </Text>
                            </View>
                        ))}
                        {note.tags.length > 2 && (
                            <Text style={[styles.moreTagsText, { color: colors.moreTagsText }]}>
                                +{note.tags.length - 2}
                            </Text>
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
        marginBottom: 8,
        paddingRight: 24 // Space for pin icon
    },
    content: {
        fontFamily: 'Kanit-Regular',
        fontSize: 14,
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
        fontSize: 11
    },
    tagsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    tag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4
    },
    tagText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 10
    },
    moreTagsText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 10
    }
});

export default NoteCard;
