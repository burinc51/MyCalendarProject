/**
 * EventList Component
 * Displays list of events for a selected date with modern card design
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import type { CalendarEvent } from '@/types/event';
import { PRIORITY_COLORS } from '@/constants/Calendar';

interface EventListProps {
    events: CalendarEvent[];
    onEdit: (event: CalendarEvent) => void;
    onDelete: (eventId: number) => void;
    isDark?: boolean;
}

const EventList: React.FC<EventListProps> = ({ events, onEdit, onDelete, isDark = false }) => {
    const colors = {
        cardBg: isDark ? '#262626' : '#ffffff',
        cardBorder: isDark ? '#333333' : '#f0f0f0',
        title: isDark ? '#f0f0f0' : '#1a1a2e',
        time: isDark ? '#aaaaaa' : '#7f8c8d',
        tagBg: isDark ? '#333333' : '#f0f3f7',
        tagText: isDark ? '#cccccc' : '#5a6a7e',
        desc: isDark ? '#888888' : '#9ba8b5',
        editBg: isDark ? '#1a2d3d' : '#eaf4fd',
        deleteBg: isDark ? '#3d1a1a' : '#fdeaea',
        emptyIcon: isDark ? '#444444' : '#d0d7de',
        emptyText: isDark ? '#888888' : '#9ba8b5',
    };

    if (events.length === 0) {
        return (
            <View style={styles.emptyStateContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: colors.emptyIcon + '30' }]}>
                    <MaterialIcons name="event-note" size={40} color={colors.emptyIcon} />
                </View>
                <Text style={[styles.noEventsText, { color: colors.emptyText }]}>
                    ยังไม่มีกำหนดการ
                </Text>
                <Text style={[styles.noEventsSubtext, { color: colors.emptyText + 'bb' }]}>
                    กด + เพื่อเพิ่ม event ใหม่
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.eventList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
        >
            {events.map((event) => (
                <View
                    key={event.id}
                    style={[
                        styles.eventItem,
                        {
                            backgroundColor: colors.cardBg,
                            borderColor: colors.cardBorder,
                        }
                    ]}
                >
                    {/* Left accent bar with event color */}
                    <View style={[styles.eventColorBar, { backgroundColor: event.color || '#2ecc71' }]} />

                    <View style={styles.eventMainContent}>
                        {/* Top row: title + priority badge */}
                        <View style={styles.eventHeader}>
                            <Text style={[styles.eventTitle, { color: colors.title }]} numberOfLines={1}>
                                {event.title}
                            </Text>
                            {event.priority && (
                                <View style={[
                                    styles.priorityBadge,
                                    {
                                        backgroundColor: PRIORITY_COLORS[event.priority].solid + '25',
                                        borderColor: PRIORITY_COLORS[event.priority].solid + '60'
                                    }
                                ]}>
                                    <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[event.priority].solid }]} />
                                    <Text style={[styles.priorityBadgeText, { color: PRIORITY_COLORS[event.priority].solid }]}>
                                        {event.priority}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Time row */}
                        <View style={styles.timeRow}>
                            <MaterialIcons
                                name={event.isAllDay ? 'wb-sunny' : 'access-time'}
                                size={13}
                                color={event.color || '#2ecc71'}
                                style={{ marginRight: 5 }}
                            />
                            <Text style={[styles.eventTime, { color: colors.time }]}>
                                {event.isAllDay
                                    ? 'ทั้งวัน'
                                    : `${dayjs(event.startDate).format('HH:mm')} – ${dayjs(event.endDate).format('HH:mm')}`}
                            </Text>
                        </View>

                        {/* Tags row */}
                        <View style={styles.tagsRow}>
                            {event.category && (
                                <View style={[styles.eventTag, { backgroundColor: colors.tagBg }]}>
                                    <Text style={[styles.eventTagText, { color: colors.tagText }]}>
                                        {event.category}
                                    </Text>
                                </View>
                            )}
                            {event.description ? (
                                <Text style={[styles.eventDescription, { color: colors.desc }]} numberOfLines={1}>
                                    {event.description}
                                </Text>
                            ) : null}
                        </View>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.eventActions}>
                        <TouchableOpacity
                            onPress={() => onEdit(event)}
                            style={[styles.actionButton, { backgroundColor: colors.editBg }]}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name="edit" size={18} color="#3498db" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => onDelete(event.id)}
                            style={[styles.actionButton, { backgroundColor: colors.deleteBg }]}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name="delete-outline" size={18} color="#e74c3c" />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    eventList: {
        flex: 1,
        paddingTop: 4,
    },
    eventItem: {
        flexDirection: 'row',
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    eventColorBar: {
        width: 5,
    },
    eventMainContent: {
        flex: 1,
        paddingVertical: 14,
        paddingLeft: 14,
        paddingRight: 8,
        gap: 6,
    },
    eventHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    eventTitle: {
        fontSize: 15,
        fontFamily: 'Kanit-Bold',
        flex: 1,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        borderWidth: 1,
        gap: 4,
    },
    priorityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    priorityBadgeText: {
        fontSize: 10,
        fontFamily: 'Kanit-Bold',
        letterSpacing: 0.3,
        textTransform: 'capitalize',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    eventTime: {
        fontSize: 12,
        fontFamily: 'Kanit-Regular',
    },
    tagsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    eventTag: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
    },
    eventTagText: {
        fontSize: 11,
        fontFamily: 'Kanit-Regular',
    },
    eventDescription: {
        fontSize: 11,
        fontFamily: 'Kanit-Regular',
        flex: 1,
    },
    eventActions: {
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 8,
        paddingRight: 12,
        paddingLeft: 4,
    },
    actionButton: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Empty state
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 48,
        gap: 12,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    noEventsText: {
        fontSize: 16,
        fontFamily: 'Kanit-Bold',
    },
    noEventsSubtext: {
        fontSize: 13,
        fontFamily: 'Kanit-Regular',
    },
});

export default EventList;
