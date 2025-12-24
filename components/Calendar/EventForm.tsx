/**
 * EventForm Component
 * Form for creating and editing calendar events
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Switch,
    ScrollView
} from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import type { EventFormData, EventPriority } from '@/types/event';
import { EVENT_COLORS, CATEGORIES, PRIORITY_COLORS } from '@/constants/Calendar';

interface EventFormProps {
    formData: EventFormData;
    isEditing: boolean;
    onUpdateField: (key: keyof EventFormData, value: unknown) => void;
    onSave: () => void;
    onCancel: () => void;
}

const EventForm: React.FC<EventFormProps> = ({
    formData,
    isEditing,
    onUpdateField,
    onSave,
    onCancel
}) => {
    return (
        <View style={styles.formContainer}>
            <View style={styles.formHeader}>
                <Text style={styles.formTitle}>{isEditing ? 'Edit Event' : 'Add New Event'}</Text>
                <TouchableOpacity
                    onPress={onCancel}
                    style={styles.closeButton}
                >
                    <AntDesign
                        name="close"
                        size={24}
                        color="#666"
                    />
                </TouchableOpacity>
            </View>

            {/* Title */}
            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                    style={styles.textInput}
                    value={formData.title}
                    onChangeText={(text) => onUpdateField('title', text)}
                    placeholder="Enter event title"
                />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={formData.description}
                    onChangeText={(text) => onUpdateField('description', text)}
                    placeholder="Enter event description"
                    multiline
                    numberOfLines={3}
                />
            </View>

            {/* All Day Toggle */}
            <View style={styles.formGroup}>
                <View style={styles.switchContainer}>
                    <Text style={styles.formLabel}>All Day</Text>
                    <Switch
                        value={formData.isAllDay}
                        onValueChange={(value) => onUpdateField('isAllDay', value)}
                    />
                </View>
            </View>

            {/* Date Range */}
            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date</Text>
                <View style={styles.dateContainer}>
                    <TextInput
                        style={[styles.textInput, styles.dateInput]}
                        value={formData.startDate}
                        onChangeText={(text) => onUpdateField('startDate', text)}
                        placeholder="YYYY-MM-DD"
                    />
                    <Text style={styles.dateSeparator}>to</Text>
                    <TextInput
                        style={[styles.textInput, styles.dateInput]}
                        value={formData.endDate}
                        onChangeText={(text) => onUpdateField('endDate', text)}
                        placeholder="YYYY-MM-DD"
                    />
                </View>
            </View>

            {/* Time Range (if not all day) */}
            {!formData.isAllDay && (
                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Time</Text>
                    <View style={styles.dateContainer}>
                        <TextInput
                            style={[styles.textInput, styles.dateInput]}
                            value={formData.startTime}
                            onChangeText={(text) => onUpdateField('startTime', text)}
                            placeholder="HH:mm"
                        />
                        <Text style={styles.dateSeparator}>to</Text>
                        <TextInput
                            style={[styles.textInput, styles.dateInput]}
                            value={formData.endTime}
                            onChangeText={(text) => onUpdateField('endTime', text)}
                            placeholder="HH:mm"
                        />
                    </View>
                </View>
            )}

            {/* Color Selection */}
            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>🎨 Color</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                >
                    <View style={styles.colorContainer}>
                        {EVENT_COLORS.map((colorObj) => (
                            <TouchableOpacity
                                key={colorObj.solid}
                                style={[
                                    styles.colorOption,
                                    { backgroundColor: colorObj.solid },
                                    formData.color === colorObj.solid && styles.selectedColor
                                ]}
                                onPress={() => onUpdateField('color', colorObj.solid)}
                                activeOpacity={0.7}
                            >
                                {formData.color === colorObj.solid && (
                                    <MaterialIcons
                                        name="check"
                                        size={20}
                                        color="#fff"
                                    />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Category */}
            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📂 Category</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                >
                    <View style={styles.categoryContainer}>
                        {CATEGORIES.map((category) => (
                            <TouchableOpacity
                                key={category}
                                style={[
                                    styles.categoryOption,
                                    formData.category === category && styles.selectedCategory
                                ]}
                                onPress={() => onUpdateField('category', category)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.categoryText,
                                        formData.category === category && styles.selectedCategoryText
                                    ]}
                                >
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Priority */}
            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>⭐ Priority</Text>
                <View style={styles.priorityContainer}>
                    {(['low', 'medium', 'high'] as const).map((priority) => (
                        <TouchableOpacity
                            key={priority}
                            style={[
                                styles.priorityOption,
                                priority === formData.priority && styles.selectedPriority,
                                priority === formData.priority && {
                                    backgroundColor: PRIORITY_COLORS[priority as EventPriority].solid,
                                    borderColor: PRIORITY_COLORS[priority as EventPriority].solid
                                }
                            ]}
                            onPress={() => onUpdateField('priority', priority)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.priorityText,
                                    priority === formData.priority && styles.selectedPriorityText
                                ]}
                            >
                                {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={onCancel}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={onSave}
                >
                    <Text style={styles.saveButtonText}>{isEditing ? 'Update' : 'Save'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    formContainer: {
        flex: 1
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1'
    },
    formTitle: {
        fontSize: 24,
        fontFamily: 'Kanit-Bold',
        color: '#2c3e50'
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center'
    },
    formGroup: {
        marginBottom: 24
    },
    formLabel: {
        fontSize: 15,
        fontFamily: 'Kanit-Bold',
        color: '#34495e',
        marginBottom: 10
    },
    textInput: {
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        fontFamily: 'Kanit-Regular',
        backgroundColor: '#fff',
        color: '#2c3e50',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 14
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    dateInput: {
        flex: 1
    },
    dateSeparator: {
        fontSize: 14,
        fontFamily: 'Kanit-Regular',
        color: '#95a5a6'
    },
    colorContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 8
    },
    colorOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3,
        borderColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3
    },
    selectedColor: {
        borderColor: '#fff',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
        transform: [{ scale: 1.1 }]
    },
    categoryContainer: {
        flexDirection: 'row',
        gap: 10,
        paddingVertical: 8
    },
    categoryOption: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    selectedCategory: {
        backgroundColor: '#2ecc71',
        borderColor: '#2ecc71',
        shadowColor: '#2ecc71',
        shadowOpacity: 0.3,
        elevation: 3
    },
    categoryText: {
        fontSize: 13,
        fontFamily: 'Kanit-Regular',
        color: '#34495e'
    },
    selectedCategoryText: {
        color: '#fff',
        fontFamily: 'Kanit-Bold'
    },
    priorityContainer: {
        flexDirection: 'row',
        gap: 10
    },
    priorityOption: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        alignItems: 'center',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    selectedPriority: {
        borderWidth: 0,
        shadowOpacity: 0.2,
        elevation: 3
    },
    priorityText: {
        fontSize: 13,
        fontFamily: 'Kanit-Regular',
        color: '#34495e'
    },
    selectedPriorityText: {
        fontFamily: 'Kanit-Bold',
        color: '#fff'
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 32,
        marginBottom: 40
    },
    button: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    cancelButton: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#e0e0e0'
    },
    saveButton: {
        backgroundColor: '#2ecc71',
        shadowColor: '#2ecc71',
        shadowOpacity: 0.3
    },
    cancelButtonText: {
        fontSize: 15,
        fontFamily: 'Kanit-Bold',
        color: '#7f8c8d'
    },
    saveButtonText: {
        fontSize: 15,
        fontFamily: 'Kanit-Bold',
        color: '#fff',
        letterSpacing: 0.5
    }
});

export default EventForm;
