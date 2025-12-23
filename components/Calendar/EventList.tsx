/**
 * EventList Component
 * Displays list of events for a selected date with modern card design
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import type { CalendarEvent } from '@/types/event';
import { PRIORITY_COLORS } from '@/constants/Calendar';

interface EventListProps {
    events: CalendarEvent[];
    onEdit: (event: CalendarEvent) => void;
    onDelete: (eventId: number) => void;
}

const EventList: React.FC<EventListProps> = ({ events, onEdit, onDelete }) => {
    if (events.length === 0) {
        return (
            <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateIcon}>📅</Text>
                <Text style={styles.noEventsText}>No events scheduled</Text>
                <Text style={styles.noEventsSubtext}>Tap + to add your first event</Text>
            </View>
        );
    }

    return (
        <View style={styles.eventList}>
            {events.map((event) => (
                <Animated.View
                    key={event.id}
                    style={[
                        styles.eventItem,
                        {
                            opacity: 1,
                            transform: [{ translateY: 0 }]
                        }
                    ]}
                >
                    <View style={[styles.eventColorBar, { backgroundColor: event.color }]} />
                    <View style={styles.eventMainContent}>
                        <View style={styles.eventContent}>
                            <View style={styles.eventHeader}>
                                <Text style={styles.eventTitle}>{event.title}</Text>
                                {event.priority && (
                                    <View
                                        style={[
                                            styles.priorityBadge,
                                            { backgroundColor: PRIORITY_COLORS[event.priority].solid }
                                        ]}
                                    >
                                        <Text style={styles.priorityBadgeText}>
                                            {event.priority.toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.eventTime}>
                                {event.isAllDay
                                    ? '🗓️ All Day'
                                    : `⏰ ${dayjs(event.startDate).format('h:mm A')} - ${dayjs(event.endDate).format('h:mm A')}`}
                            </Text>
                            {event.category && (
                                <View style={styles.eventTagContainer}>
                                    <View style={styles.eventTag}>
                                        <Text style={styles.eventTagText}>{event.category}</Text>
                                    </View>
                                </View>
                            )}
                            {event.description && (
                                <Text
                                    style={styles.eventDescription}
                                    numberOfLines={2}
                                >
                                    {event.description}
                                </Text>
                            )}
                        </View>
                        <View style={styles.eventActions}>
                            <TouchableOpacity
                                onPress={() => onEdit(event)}
                                style={[styles.actionButton, styles.editButton]}
                                activeOpacity={0.7}
                            >
                                <MaterialIcons
                                    name="edit"
                                    size={20}
                                    color="#3498db"
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => onDelete(event.id)}
                                style={[styles.actionButton, styles.deleteButton]}
                                activeOpacity={0.7}
                            >
                                <MaterialIcons
                                    name="delete"
                                    size={20}
                                    color="#e74c3c"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    eventList: {
        flex: 1,
        paddingTop: 8
    },
    eventItem: {
        flexDirection: 'row',
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3
    },
    eventColorBar: {
        width: 6,
        backgroundColor: '#3498db'
    },
    eventMainContent: {
        flex: 1,
        flexDirection: 'row',
        padding: 16
    },
    eventContent: {
        flex: 1,
        gap: 6
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    eventTitle: {
        fontSize: 16,
        fontFamily: 'Kanit-Bold',
        color: '#2c3e50',
        flex: 1,
        marginRight: 8
    },
    eventTime: {
        fontSize: 13,
        fontFamily: 'Kanit-Regular',
        color: '#7f8c8d'
    },
    eventTagContainer: {
        flexDirection: 'row',
        marginTop: 4
    },
    eventTag: {
        backgroundColor: '#ecf0f1',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    eventTagText: {
        fontSize: 11,
        fontFamily: 'Kanit-Regular',
        color: '#34495e'
    },
    eventDescription: {
        fontSize: 12,
        fontFamily: 'Kanit-Regular',
        color: '#95a5a6',
        marginTop: 4,
        lineHeight: 16
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6
    },
    priorityBadgeText: {
        fontSize: 9,
        fontFamily: 'Kanit-Bold',
        color: '#fff',
        letterSpacing: 0.5
    },
    eventActions: {
        flexDirection: 'column',
        gap: 8,
        justifyContent: 'center',
        marginLeft: 8
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center'
    },
    editButton: {
        backgroundColor: '#ebf5fb'
    },
    deleteButton: {
        backgroundColor: '#fadbd8'
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60
    },
    emptyStateIcon: {
        fontSize: 64,
        marginBottom: 16,
        opacity: 0.6
    },
    noEventsText: {
        fontSize: 16,
        fontFamily: 'Kanit-Bold',
        color: '#7f8c8d',
        marginBottom: 8
    },
    noEventsSubtext: {
        fontSize: 13,
        fontFamily: 'Kanit-Regular',
        color: '#95a5a6'
    }
});

export default EventList;
