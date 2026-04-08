import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
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
const GRID_CARD_WIDTH = (width - 48) / 2;

const stripHtml = (html: string): string =>
    html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();

const isColorDark = (color: string): boolean => {
    if (!color || !color.startsWith('#')) return false;
    const hex = color.replace('#', '');
    const r = parseInt(hex.length === 3 ? hex.charAt(0) + hex.charAt(0) : hex.substring(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex.charAt(1) + hex.charAt(1) : hex.substring(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex.charAt(2) + hex.charAt(2) : hex.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
};

const parseDateValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') return dayjs(NaN);
    if (typeof value === 'number') {
        return dayjs(value < 1e12 ? value * 1000 : value);
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (/^\d+(\.\d+)?$/.test(trimmed)) {
            const numeric = Number(trimmed);
            return dayjs(numeric < 1e12 ? numeric * 1000 : numeric);
        }
        return dayjs(trimmed);
    }
    return dayjs(value as any);
};

// Derive a subtle accent color from the note color for the left bar
const deriveAccent = (color: string, isDark: boolean): string => {
    if (!color || color === '#ffffff') return isDark ? '#3a3a3a' : '#e5e7eb';
    return color;
};

const NoteCard: React.FC<NoteCardProps> = ({
    note, viewMode, onPress, onLongPress, onTogglePin, isDark = false
}) => {
    const colors = useMemo(() => {
        const cardBg = isDark && note.color === '#ffffff' ? '#1c1c1e' : note.color;
        const darkText = !isColorDark(cardBg);
        return {
            title:     darkText ? '#111111' : '#f0f0f0',
            content:   darkText ? '#555555' : '#b0b0b0',
            timestamp: darkText ? '#aaaaaa' : '#707070',
            tagBg:     darkText ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)',
            tagText:   darkText ? '#555555' : '#cccccc',
            divider:   darkText ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
            border:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            cardBg,
        };
    }, [isDark, note.color]);

    const accent = useMemo(() => deriveAccent(note.color, isDark), [note.color, isDark]);

    const contentPreview = useMemo(() => {
        const stripped = stripHtml(note.content);
        const limit = viewMode === 'grid' ? 80 : 120;
        return stripped.length > limit ? stripped.substring(0, limit) + '…' : stripped;
    }, [note.content, viewMode]);

    const timeAgo = useMemo(() => {
        const d = parseDateValue(note.updatedAt);
        return d.isValid() ? d.locale('th').fromNow() : '';
    }, [note.updatedAt]);

    const reminderInfo = useMemo(() => {
        if (!note.reminderDate) return null;
        const d = parseDateValue(note.reminderDate);
        if (!d.isValid()) return null;
        const isPast = d.isBefore(dayjs());
        let recurrenceText = '';
        if (note.recurrence === 'daily') recurrenceText = ' ทุกวัน';
        else if (note.recurrence === 'weekly') recurrenceText = ' ทุกสัปดาห์';
        else if (note.recurrence === 'monthly') recurrenceText = ' ทุกเดือน';
        else if (note.recurrence === 'yearly') recurrenceText = ' ทุกปี';
        return { text: d.locale('th').format('DD MMM') + recurrenceText, isPast };
    }, [note.reminderDate, note.recurrence]);

    const dateInfo = useMemo(() => {
        if (!note.startDate && !note.endDate) return null;
        if (note.startDate && note.endDate) {
            const s = parseDateValue(note.startDate);
            const e = parseDateValue(note.endDate);
            if (!s.isValid() || !e.isValid()) return null;
            return { text: `${s.locale('th').format('DD MMM')} – ${e.locale('th').format('DD MMM')}` };
        }
        if (note.startDate) {
            const s = parseDateValue(note.startDate);
            return s.isValid() ? { text: `เริ่ม ${s.locale('th').format('DD MMM')}` } : null;
        }
        const e = parseDateValue(note.endDate!);
        return e.isValid() ? { text: `ถึง ${e.locale('th').format('DD MMM')}` } : null;
    }, [note.startDate, note.endDate]);

    const isGridView = viewMode === 'grid';
    const hasBadges  = !!(reminderInfo || dateInfo || note.locationName);

    return (
        <TouchableOpacity
            style={[
                styles.card,
                isGridView ? styles.gridCard : styles.listCard,
                { backgroundColor: colors.cardBg, borderColor: colors.border },
            ]}
            onPress={() => onPress(note)}
            onLongPress={() => onLongPress?.(note)}
            activeOpacity={0.72}
        >
            {/* Accent bar */}
            <View style={[styles.accentBar, { backgroundColor: accent }]} />

            {/* Main content */}
            <View style={styles.body}>
                {/* Title row */}
                <View style={styles.titleRow}>
                    {note.title ? (
                        <Text
                            style={[styles.title, { color: colors.title }]}
                            numberOfLines={isGridView ? 2 : 1}
                        >
                            {note.title}
                        </Text>
                    ) : null}
                    {note.isPinned && (
                        <TouchableOpacity
                            onPress={() => onTogglePin?.(note.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={styles.pinBtn}
                        >
                            <Feather name="bookmark" size={13} color="#e74c3c" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Content preview */}
                {contentPreview ? (
                    <Text
                        style={[styles.content, { color: colors.content }]}
                        numberOfLines={isGridView ? 5 : 2}
                    >
                        {contentPreview}
                    </Text>
                ) : null}

                {/* Badges */}
                {hasBadges && (
                    <View style={styles.badges}>
                        {reminderInfo && (
                            <View style={[styles.badge, {
                                backgroundColor: reminderInfo.isPast ? 'rgba(231,76,60,0.1)' : 'rgba(230,126,34,0.1)'
                            }]}>
                                <Ionicons
                                    name="alarm-outline"
                                    size={10}
                                    color={reminderInfo.isPast ? '#e74c3c' : '#e67e22'}
                                />
                                <Text style={[styles.badgeText, {
                                    color: reminderInfo.isPast ? '#e74c3c' : '#e67e22'
                                }]} numberOfLines={1}>
                                    {reminderInfo.text}
                                </Text>
                            </View>
                        )}

                        {dateInfo && (
                            <View style={[styles.badge, { backgroundColor: 'rgba(46,204,113,0.1)' }]}>
                                <Feather name="calendar" size={10} color="#27ae60" />
                                <Text style={[styles.badgeText, { color: '#27ae60' }]} numberOfLines={1}>
                                    {dateInfo.text}
                                </Text>
                            </View>
                        )}

                        {note.locationName && (
                            <TouchableOpacity
                                style={[styles.badge, { backgroundColor: 'rgba(52,152,219,0.1)' }]}
                                onPress={() => note.locationLink && Linking.openURL(note.locationLink)}
                                disabled={!note.locationLink}
                                activeOpacity={0.7}
                            >
                                <Feather name="map-pin" size={10} color="#2980b9" />
                                <Text style={[styles.badgeText, { color: '#2980b9' }]} numberOfLines={1}>
                                    {note.locationName}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Footer */}
                <View style={[styles.footer, { borderTopColor: colors.divider }]}>
                    <Text style={[styles.timestamp, { color: colors.timestamp }]}>{timeAgo}</Text>

                    {note.tags && note.tags.length > 0 && (
                        <View style={styles.tagsRow}>
                            {note.tags.slice(0, isGridView ? 1 : 2).map((tag, i) => (
                                <View key={i} style={[styles.tag, { backgroundColor: colors.tagBg }]}>
                                    <Text style={[styles.tagText, { color: colors.tagText }]}>#{tag}</Text>
                                </View>
                            ))}
                            {note.tags.length > (isGridView ? 1 : 2) && (
                                <Text style={[styles.moreTags, { color: colors.timestamp }]}>
                                    +{note.tags.length - (isGridView ? 1 : 2)}
                                </Text>
                            )}
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    gridCard: {
        width: GRID_CARD_WIDTH,
        marginBottom: 14,
        minHeight: 140,
    },
    listCard: {
        width: '100%',
        marginBottom: 12,
    },

    // Accent left bar
    accentBar: {
        width: 4,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },

    // Body
    body: {
        flex: 1,
        padding: 14,
        gap: 6,
    },

    // Title row
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 6,
    },
    title: {
        flex: 1,
        fontFamily: 'Kanit-Bold',
        fontSize: 15,
        lineHeight: 21,
        letterSpacing: 0.1,
    },
    pinBtn: {
        marginTop: 2,
    },

    // Content
    content: {
        fontFamily: 'Kanit-Regular',
        fontSize: 13,
        lineHeight: 20,
        opacity: 0.88,
    },

    // Badges
    badges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
        marginTop: 2,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    badgeText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 10,
        lineHeight: 14,
    },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingTop: 8,
        borderTopWidth: 1,
    },
    timestamp: {
        fontFamily: 'Kanit-Regular',
        fontSize: 10,
    },
    tagsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    tag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 5,
    },
    tagText: {
        fontFamily: 'Kanit-Regular',
        fontSize: 9,
    },
    moreTags: {
        fontFamily: 'Kanit-Regular',
        fontSize: 9,
    },
});

export default NoteCard;
