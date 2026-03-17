import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
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

    const reminderInfo = useMemo(() => {
        if (!note.reminderDate) return null;
        const reminderDate = dayjs(note.reminderDate);
        const isPast = reminderDate.isBefore(dayjs());

        let recurrenceText = '';
        if (note.recurrence) {
            if (note.recurrence === 'daily') recurrenceText = ' (ทุกวัน)';
            else if (note.recurrence === 'weekly') recurrenceText = ' (ทุกสัปดาห์)';
            else if (note.recurrence === 'monthly') recurrenceText = ' (ทุกเดือน)';
            else if (note.recurrence === 'yearly') recurrenceText = ' (ทุกปี)';
        }

        return {
            text: reminderDate.format('DD MMM') + recurrenceText, // Shorter text for badge
            isPast,
        };
    }, [note.reminderDate, note.recurrence]);

    const dateInfo = useMemo(() => {
        if (!note.startDate && !note.endDate) return null;
        let text = '';
        if (note.startDate && note.endDate) {
            text = `${dayjs(note.startDate).format('DD MMM')} - ${dayjs(note.endDate).format('DD MMM')}`;
        } else if (note.startDate) {
            text = `เริ่ม ${dayjs(note.startDate).format('DD MMM')}`;
        } else if (note.endDate) {
            text = `สิ้นสุด ${dayjs(note.endDate).format('DD MMM')}`;
        }
        return { text };
    }, [note.startDate, note.endDate]);

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

            {/* Badges Container */}
            <View style={styles.badgesWrapper}>
                {/* Reminder Badge */}
                {reminderInfo && (
                    <View style={[
                        styles.reminderBadge,
                        { backgroundColor: reminderInfo.isPast ? 'rgba(231,76,60,0.12)' : 'rgba(230,126,34,0.12)' }
                    ]}>
                        <Ionicons
                            name="notifications"
                            size={12}
                            color={reminderInfo.isPast ? '#e74c3c' : '#e67e22'}
                        />
                        <Text style={[
                            styles.reminderText,
                            { color: reminderInfo.isPast ? '#e74c3c' : '#e67e22' }
                        ]} numberOfLines={1}>
                            {reminderInfo.text}
                        </Text>
                    </View>
                )}

                {/* Dates Badge */}
                {dateInfo && (
                    <View style={[
                        styles.reminderBadge,
                        { backgroundColor: 'rgba(46, 204, 113, 0.12)' }
                    ]}>
                        <AntDesign name="calendar" size={12} color="#27ae60" />
                        <Text style={[
                            styles.reminderText,
                            { color: '#27ae60' }
                        ]} numberOfLines={1}>
                            {dateInfo.text}
                        </Text>
                    </View>
                )}

                {/* Location Badge */}
                {note.locationName && (
                    <TouchableOpacity
                        style={[
                            styles.reminderBadge,
                            { backgroundColor: 'rgba(52,152,219,0.12)' }
                        ]}
                        onPress={() => {
                            if (note.locationLink) {
                                Linking.openURL(note.locationLink);
                            }
                        }}
                        disabled={!note.locationLink}
                        activeOpacity={note.locationLink ? 0.6 : 1}
                    >
                        <Ionicons
                            name="location"
                            size={12}
                            color="#2980b9"
                        />
                        <Text style={[
                            styles.reminderText,
                            { color: '#2980b9' }
                        ]} numberOfLines={1}>
                            {note.locationName}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

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
        borderRadius: 24,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)'
    },
    gridCard: {
        width: GRID_CARD_WIDTH,
        minHeight: 160,
        marginBottom: 16
    },
    listCard: {
        width: '100%',
        marginBottom: 16
    },
    pinIndicator: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 1
    },
    title: {
        fontFamily: 'Kanit-SemiBold',
        fontSize: 17,
        marginBottom: 6,
        paddingRight: 24, // Space for pin icon
        letterSpacing: 0.2
    },
    content: {
        fontFamily: 'Kanit-Regular',
        fontSize: 14,
        lineHeight: 22,
        flex: 1,
        opacity: 0.9
    },
    footer: {
        marginTop: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.04)',
        paddingTop: 10
    },
    timestamp: {
        fontFamily: 'Kanit-Regular',
        fontSize: 11,
        opacity: 0.8
    },
    tagsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6
    },
    tagText: {
        fontFamily: 'Kanit-Medium',
        fontSize: 10
    },
    moreTagsText: {
        fontFamily: 'Kanit-Medium',
        fontSize: 10
    },
    badgesWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 10
    },
    reminderBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
        gap: 4
    },
    reminderText: {
        fontFamily: 'Kanit-Medium',
        fontSize: 10,
        fontWeight: '600'
    }
});

export default NoteCard;
