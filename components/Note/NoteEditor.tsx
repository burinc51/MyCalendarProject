/**
 * NoteEditor Component
 * Rich text editor for creating and editing notes
 * Uses react-native-pell-rich-editor for rich text functionality
 *
 * Note: If react-native-pell-rich-editor causes issues with Expo SDK 53,
 * you can temporarily opt-out of New Architecture or use the fallback TextInput
 */

import React, { useRef, useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, MaterialIcons, Feather } from '@expo/vector-icons';
import type { NoteFormData } from '@/types/note';
import { NOTE_COLORS } from '@/types/note';

// Try to import rich editor, fallback to basic editor if not available
let RichEditor: React.ComponentType<unknown> | null = null;
let RichToolbar: React.ComponentType<unknown> | null = null;
let actions: Record<string, unknown> | null = null;

try {
    const richEditorModule = require('react-native-pell-rich-editor');
    RichEditor = richEditorModule.RichEditor;
    RichToolbar = richEditorModule.RichToolbar;
    actions = richEditorModule.actions;
} catch {
    console.log('react-native-pell-rich-editor not available, using fallback editor');
}

interface NoteEditorProps {
    formData: NoteFormData;
    isEditing: boolean;
    onUpdateField: (key: keyof NoteFormData, value: unknown) => void;
    onSave: () => void;
    onCancel: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
    formData,
    isEditing,
    onUpdateField,
    onSave,
    onCancel
}) => {
    const richTextRef = useRef<unknown>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Handle content change from rich editor
    const handleContentChange = useCallback((html: string) => {
        onUpdateField('content', html);
    }, [onUpdateField]);

    // Handle title change
    const handleTitleChange = useCallback((text: string) => {
        onUpdateField('title', text);
    }, [onUpdateField]);

    // Render color picker
    const renderColorPicker = () => (
        <View style={styles.colorPickerContainer}>
            <Text style={styles.colorPickerLabel}>Background Color</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorPickerScroll}
            >
                {NOTE_COLORS.map((color) => (
                    <TouchableOpacity
                        key={color}
                        style={[
                            styles.colorOption,
                            { backgroundColor: color },
                            formData.color === color && styles.selectedColor
                        ]}
                        onPress={() => {
                            onUpdateField('color', color);
                            setShowColorPicker(false);
                        }}
                        activeOpacity={0.7}
                    >
                        {formData.color === color && (
                            <MaterialIcons name="check" size={18} color="#333" />
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    // Render fallback basic editor if rich editor is not available
    const renderFallbackEditor = () => (
        <TextInput
            style={[styles.fallbackEditor, { backgroundColor: formData.color }]}
            value={formData.content}
            onChangeText={(text) => onUpdateField('content', text)}
            placeholder="เริ่มเขียน..."
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
        />
    );

    // Render rich text editor
    const renderRichEditor = () => {
        if (!RichEditor || !RichToolbar || !actions) {
            return renderFallbackEditor();
        }

        const RichEditorComponent = RichEditor as React.ComponentType<{
            ref: React.RefObject<unknown>;
            initialContentHTML: string;
            onChange: (html: string) => void;
            placeholder: string;
            style: object;
            editorStyle: object;
        }>;

        const RichToolbarComponent = RichToolbar as React.ComponentType<{
            editor: React.RefObject<unknown>;
            actions: unknown[];
            style: object;
            iconTint: string;
            selectedIconTint: string;
        }>;

        return (
            <>
                <RichToolbarComponent
                    editor={richTextRef}
                    actions={[
                        (actions as Record<string, unknown>).setBold,
                        (actions as Record<string, unknown>).setItalic,
                        (actions as Record<string, unknown>).setUnderline,
                        (actions as Record<string, unknown>).setStrikethrough,
                        (actions as Record<string, unknown>).insertBulletsList,
                        (actions as Record<string, unknown>).insertOrderedList,
                        (actions as Record<string, unknown>).heading1,
                        (actions as Record<string, unknown>).heading2,
                        (actions as Record<string, unknown>).blockquote,
                        (actions as Record<string, unknown>).alignLeft,
                        (actions as Record<string, unknown>).alignCenter,
                        (actions as Record<string, unknown>).alignRight,
                    ]}
                    style={styles.toolbar}
                    iconTint="#333"
                    selectedIconTint="#2ecc71"
                />
                <RichEditorComponent
                    ref={richTextRef}
                    initialContentHTML={formData.content}
                    onChange={handleContentChange}
                    placeholder="เริ่มเขียน..."
                    style={[styles.richEditor, { backgroundColor: formData.color }]}
                    editorStyle={{
                        backgroundColor: formData.color,
                        contentCSSText: 'font-family: sans-serif; font-size: 16px; color: #333;'
                    }}
                />
            </>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: formData.color }]}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={onCancel}
                    >
                        <AntDesign name="close" size={24} color="#333" />
                    </TouchableOpacity>

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => onUpdateField('isPinned', !formData.isPinned)}
                        >
                            <AntDesign
                                name="pushpin"
                                size={22}
                                color={formData.isPinned ? '#e74c3c' : '#666'}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => setShowColorPicker(!showColorPicker)}
                        >
                            <Feather name="droplet" size={22} color="#666" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={onSave}
                        >
                            <Text style={styles.saveButtonText}>
                                {isEditing ? 'Update' : 'Save'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Color Picker */}
                {showColorPicker && renderColorPicker()}

                {/* Title Input */}
                <TextInput
                    style={styles.titleInput}
                    value={formData.title}
                    onChangeText={handleTitleChange}
                    placeholder="Title"
                    placeholderTextColor="#999"
                    autoFocus={!isEditing}
                />

                {/* Editor */}
                <View style={styles.editorContainer}>
                    {renderRichEditor()}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    keyboardAvoid: {
        flex: 1
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)'
    },
    headerButton: {
        padding: 8
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    saveButton: {
        backgroundColor: '#2ecc71',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginLeft: 8
    },
    saveButtonText: {
        color: '#fff',
        fontFamily: 'Kanit-Bold',
        fontSize: 14
    },
    colorPickerContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)'
    },
    colorPickerLabel: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
        color: '#666',
        marginBottom: 8
    },
    colorPickerScroll: {
        flexDirection: 'row',
        gap: 8
    },
    colorOption: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)'
    },
    selectedColor: {
        borderWidth: 2,
        borderColor: '#333'
    },
    titleInput: {
        fontFamily: 'Kanit-Bold',
        fontSize: 24,
        color: '#333',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)'
    },
    editorContainer: {
        flex: 1
    },
    toolbar: {
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
    },
    richEditor: {
        flex: 1,
        minHeight: 200
    },
    fallbackEditor: {
        flex: 1,
        fontFamily: 'Kanit-Regular',
        fontSize: 16,
        color: '#333',
        padding: 16,
        textAlignVertical: 'top'
    }
});

export default NoteEditor;
