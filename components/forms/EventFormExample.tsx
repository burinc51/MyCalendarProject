import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventFormSchema, EventFormData } from '@/schemas/eventSchema';

interface EventFormProps {
    initialData?: Partial<EventFormData>;
    onSubmit: (data: EventFormData) => void;
    onCancel: () => void;
}

export const EventFormExample: React.FC<EventFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<EventFormData>({
        resolver: zodResolver(eventFormSchema),
        defaultValues: initialData || {
            title: '',
            description: '',
            startDate: '',
            endDate: '',
            startTime: '09:00',
            endTime: '10:00',
            isAllDay: false,
            color: '#e74c3c',
            category: 'Work',
            priority: 'medium',
            reminder: 15
        }
    });

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Event Form with React Hook Form + Zod</Text>

            {/* Title Field */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Title *</Text>
                <Controller
                    control={control}
                    name="title"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            style={[styles.input, errors.title && styles.inputError]}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            placeholder="Enter event title"
                        />
                    )}
                />
                {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
            </View>

            {/* Description Field */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Description</Text>
                <Controller
                    control={control}
                    name="description"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            placeholder="Enter description"
                            multiline
                            numberOfLines={4}
                        />
                    )}
                />
                {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
            </View>

            {/* Start Date */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Start Date *</Text>
                <Controller
                    control={control}
                    name="startDate"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            style={[styles.input, errors.startDate && styles.inputError]}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            placeholder="YYYY-MM-DD"
                        />
                    )}
                />
                {errors.startDate && <Text style={styles.errorText}>{errors.startDate.message}</Text>}
            </View>

            {/* End Date */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>End Date *</Text>
                <Controller
                    control={control}
                    name="endDate"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            style={[styles.input, errors.endDate && styles.inputError]}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            placeholder="YYYY-MM-DD"
                        />
                    )}
                />
                {errors.endDate && <Text style={styles.errorText}>{errors.endDate.message}</Text>}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.submitButton]}
                    onPress={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                >
                    <Text style={styles.submitButtonText}>{isSubmitting ? 'Saving...' : 'Save Event'}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff'
    },
    title: {
        fontSize: 20,
        fontFamily: 'Kanit-Bold',
        marginBottom: 20,
        color: '#2c3e50'
    },
    fieldContainer: {
        marginBottom: 16
    },
    label: {
        fontSize: 14,
        fontFamily: 'Kanit-Regular',
        color: '#34495e',
        marginBottom: 8
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        fontFamily: 'Kanit-Regular',
        backgroundColor: '#fff'
    },
    inputError: {
        borderColor: '#e74c3c'
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top'
    },
    errorText: {
        color: '#e74c3c',
        fontSize: 12,
        fontFamily: 'Kanit-Regular',
        marginTop: 4
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
        marginBottom: 40
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center'
    },
    cancelButton: {
        backgroundColor: '#ecf0f1',
        borderWidth: 1,
        borderColor: '#bdc3c7'
    },
    submitButton: {
        backgroundColor: '#2ecc71'
    },
    cancelButtonText: {
        fontSize: 14,
        fontFamily: 'Kanit-Bold',
        color: '#7f8c8d'
    },
    submitButtonText: {
        fontSize: 14,
        fontFamily: 'Kanit-Bold',
        color: '#fff'
    }
});
