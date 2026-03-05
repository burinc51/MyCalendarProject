import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, ScrollView, KeyboardAvoidingView, Platform,
    Keyboard, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import type { NoteFormData } from '@/types/note';
import { NOTE_COLORS } from '@/types/note';
import { useTheme, useThemeColors } from '../ThemeProvider';

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
    onCancel,
}) => {
    const richTextEditorRef = useRef<RichEditor>(null);
    const scrollRef = useRef<ScrollView>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showTitleEditor, setShowTitleEditor] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    // Track unsaved changes
    const initialFormData = useRef<NoteFormData>({
        title: formData.title,
        content: formData.content,
        color: formData.color,
        folderId: formData.folderId,
        isPinned: formData.isPinned,
        tags: formData.tags,
    });
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);

    // Custom link modal state
    const [linkModalVisible, setLinkModalVisible] = useState(false);
    const [linkTitle, setLinkTitle] = useState('');
    const [linkUrl, setLinkUrl] = useState('');

    const { theme, isDark } = useTheme();
    const colors = useThemeColors();

    const editorBgColor = formData.color === '#ffffff' ? colors.background : formData.color;
    const editorTextColor = formData.color === '#ffffff' ? colors.textPrimary : '#333';

    useEffect(() => {
        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setIsKeyboardVisible(true)
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setIsKeyboardVisible(false)
        );
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // Detect unsaved changes whenever formData changes
    useEffect(() => {
        const initial = initialFormData.current;
        const changed =
            formData.title !== initial.title ||
            formData.content !== initial.content ||
            formData.color !== initial.color;
        setHasUnsavedChanges(changed);
    }, [formData.title, formData.content, formData.color]);

    const handleChangeText = useCallback((text: string) => {
        onUpdateField('content', text);
    }, [onUpdateField]);

    // Handle back button press — show confirmation if unsaved changes exist
    const handleCancel = useCallback(() => {
        if (hasUnsavedChanges) {
            setShowUnsavedModal(true);
        } else {
            onCancel();
        }
    }, [hasUnsavedChanges, onCancel]);

    // Save then exit
    const handleSaveAndExit = useCallback(() => {
        setShowUnsavedModal(false);
        onSave();
    }, [onSave]);

    // Discard changes and exit
    const handleDiscardAndExit = useCallback(() => {
        setShowUnsavedModal(false);
        onCancel();
    }, [onCancel]);

    const handleCursorPosition = useCallback((scrollY: number) => {
        scrollRef.current?.scrollTo({ y: scrollY - 30, animated: true });
    }, []);

    // Open custom link modal
    const handleOpenLinkModal = useCallback(() => {
        setLinkTitle('');
        setLinkUrl('');
        setLinkModalVisible(true);
    }, []);

    // Insert the link into the editor
    const handleInsertLink = useCallback(() => {
        if (linkUrl.trim()) {
            const title = linkTitle.trim() || linkUrl.trim();
            richTextEditorRef.current?.insertLink(title, linkUrl.trim());
        }
        setLinkModalVisible(false);
    }, [linkTitle, linkUrl]);

    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: colors.background }}
            edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    ref={scrollRef}
                    keyboardDismissMode="none"
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
                        <TouchableOpacity onPress={handleCancel}><AntDesign name="left" size={24} color={colors.textPrimary} /></TouchableOpacity>
                        <TouchableOpacity onPress={onSave}><Ionicons name="checkmark" size={24} color={colors.textPrimary} /></TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={() => setShowColorPicker(!showColorPicker)}
                        className="px-4 py-2 flex-row items-center"
                    >
                        <View style={{ backgroundColor: formData.color || '#fff', width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.border }} />
                        <Text className="ml-2 font-semibold" style={{ color: colors.textPrimary }} onPress={() => setShowTitleEditor(!showTitleEditor)}>{formData.title || 'No Title'}</Text>
                    </TouchableOpacity>

                    {showTitleEditor && (
                        <View className="px-4 py-2">
                            <TextInput
                                value={formData.title}
                                onChangeText={(text) => onUpdateField('title', text)}
                                placeholder="Title"
                                placeholderTextColor={colors.textSecondary}
                                style={{ color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border }}
                                className="px-4 py-2 text-lg font-bold"
                            />
                        </View>
                    )}
                    {showColorPicker && (
                        <View style={[{ paddingVertical: 12, paddingHorizontal: 16 }, { backgroundColor: colors.surface }]}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
                                    {NOTE_COLORS.map((color) => {
                                        const isSelected = formData.color === color;
                                        return (
                                            <TouchableOpacity
                                                key={color}
                                                activeOpacity={0.8}
                                                style={[
                                                    {
                                                        width: 44,
                                                        height: 44,
                                                        borderRadius: 22,
                                                        marginHorizontal: 8,
                                                        marginVertical: 4,
                                                        backgroundColor: color,
                                                        borderWidth: isSelected ? 3 : 1,
                                                        borderColor: isSelected ? colors.primary : (color === '#ffffff' ? colors.border : 'transparent'),
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        shadowColor: '#000',
                                                        shadowOffset: { width: 0, height: 1 },
                                                        shadowOpacity: 0.1,
                                                        shadowRadius: 2,
                                                        elevation: isSelected ? 4 : 2,
                                                    }
                                                ]}
                                                onPress={() => {
                                                    onUpdateField('color', color);
                                                    setShowColorPicker(false);
                                                }}
                                            >
                                                {isSelected && (
                                                    <AntDesign
                                                        name="check"
                                                        size={20}
                                                        color={color === '#ffffff' ? colors.primary : '#333'}
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        </View>
                    )}
                    <View className='p-4'>
                        <View style={{ borderRadius: 10, overflow: 'hidden' }}>
                            <RichEditor
                                ref={richTextEditorRef}
                                initialContentHTML={formData.content}
                                onChange={handleChangeText}
                                onCursorPosition={handleCursorPosition}
                                placeholder=""
                                editorStyle={{
                                    backgroundColor: editorBgColor,
                                    color: editorTextColor,
                                    placeholderColor: colors.textSecondary,
                                    contentCSSText: 'font-size: 13px; line-height: 1.6; font-family: sans-serif; padding: 10px;',
                                }}
                                useContainer={true}
                                initialHeight={400}
                            />
                        </View>
                    </View>
                </ScrollView>

                {/* Toolbar - only visible when keyboard is open */}
                {isKeyboardVisible && (
                    <View style={[styles.toolbarContainer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
                        <RichToolbar
                            editor={richTextEditorRef}
                            actions={[
                                actions.setBold, actions.setItalic,
                                actions.setUnderline, actions.setStrikethrough,
                                actions.heading1, actions.heading2,
                                actions.insertBulletsList, actions.insertOrderedList,
                                actions.blockquote,
                                actions.alignLeft, actions.alignCenter, actions.alignRight,
                                actions.insertLink, actions.line,
                            ]}
                            style={{ backgroundColor: colors.surface }}
                            iconTint={colors.textPrimary}
                            selectedIconTint={colors.primary}
                            iconSize={20}
                            unselectedButtonStyle={{ backgroundColor: 'transparent' }}
                            selectedButtonStyle={{ backgroundColor: colors.surface }}
                            onInsertLink={handleOpenLinkModal}
                        />
                    </View>
                )}
            </KeyboardAvoidingView>

            {/* Unsaved Changes Confirmation Modal */}
            <Modal
                visible={showUnsavedModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowUnsavedModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowUnsavedModal(false)}
                >
                    <TouchableOpacity activeOpacity={1} style={[styles.unsavedModalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.unsavedIconRow}>
                            <AntDesign name="exclamation-circle" size={28} color={colors.warning ?? '#f39c12'} />
                        </View>
                        <Text style={[styles.unsavedTitle, { color: colors.textPrimary }]}>มีการแก้ไขที่ยังไม่บันทึก</Text>
                        <Text style={[styles.unsavedSubtitle, { color: colors.textSecondary }]}>คุณต้องการบันทึกการเปลี่ยนแปลงก่อนออกไหม?</Text>

                        <TouchableOpacity
                            style={[styles.unsavedBtnSave, { backgroundColor: colors.primary }]}
                            onPress={handleSaveAndExit}
                        >
                            <AntDesign name="save" size={16} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={styles.unsavedBtnSaveText}>บันทึกและออก</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.unsavedBtnDiscard, { borderColor: colors.border }]}
                            onPress={handleDiscardAndExit}
                        >
                            <Text style={[styles.unsavedBtnDiscardText, { color: colors.textSecondary }]}>ออกโดยไม่บันทึก</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.unsavedBtnCancel}
                            onPress={() => setShowUnsavedModal(false)}
                        >
                            <Text style={[styles.unsavedBtnCancelText, { color: colors.primary }]}>อยู่ต่อ</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Custom Link Insert Modal */}
            <Modal
                visible={linkModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setLinkModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setLinkModalVisible(false)}
                    >
                        <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>แทรกลิงก์</Text>

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ข้อความที่แสดง</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                                placeholder="เช่น Google"
                                placeholderTextColor={colors.textDisabled}
                                value={linkTitle}
                                onChangeText={setLinkTitle}
                                autoFocus
                            />

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>URL</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                                placeholder="https://example.com"
                                placeholderTextColor={colors.textDisabled}
                                value={linkUrl}
                                onChangeText={setLinkUrl}
                                keyboardType="url"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalBtnCancel, { backgroundColor: colors.neutral200 }]}
                                    onPress={() => setLinkModalVisible(false)}
                                >
                                    <Text style={[styles.modalBtnCancelText, { color: colors.textSecondary }]}>ยกเลิก</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalBtnInsert, { backgroundColor: colors.primary }, !linkUrl.trim() && { opacity: 0.4 }]}
                                    onPress={handleInsertLink}
                                    disabled={!linkUrl.trim()}
                                >
                                    <Text style={styles.modalBtnInsertText}>แทรก</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    colorPickerContainer: {
        backgroundColor: '#fff',
        padding: 16,
    },
    colorPickerItem: {
        borderWidth: 1,
        borderColor: '#ccc',
        width: 40,
        height: 40,
        borderRadius: 20,
        margin: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toolbarContainer: {
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        backgroundColor: '#f8f8f8',
    },
    // Unsaved changes modal
    unsavedModalContent: {
        borderRadius: 20,
        padding: 28,
        width: '88%',
        maxWidth: 380,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    unsavedIconRow: {
        marginBottom: 12,
    },
    unsavedTitle: {
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    unsavedSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    unsavedBtnSave: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 13,
        borderRadius: 12,
        marginBottom: 10,
    },
    unsavedBtnSaveText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    unsavedBtnDiscard: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 10,
    },
    unsavedBtnDiscardText: {
        fontSize: 15,
        fontWeight: '600',
    },
    unsavedBtnCancel: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    unsavedBtnCancelText: {
        fontSize: 14,
        fontWeight: '600',
    },
    // Link Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
    },
    inputLabel: {
        fontSize: 13,
        color: '#888',
        marginBottom: 4,
        marginTop: 8,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        color: '#333',
        backgroundColor: '#f9f9f9',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
        gap: 12,
    },
    modalBtnCancel: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
    },
    modalBtnCancelText: {
        fontSize: 15,
        color: '#666',
        fontWeight: '600',
    },
    modalBtnInsert: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#2ecc71',
    },
    modalBtnInsertText: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '600',
    },
});

export default NoteEditor;


