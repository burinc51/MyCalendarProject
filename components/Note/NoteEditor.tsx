import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, ScrollView, KeyboardAvoidingView, Platform,
    Keyboard, Modal, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { AntDesign, Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import dayjs from 'dayjs';
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
        isPinned: formData.isPinned,
        tags: formData.tags,
        reminderDate: formData.reminderDate,
        recurrence: formData.recurrence,
        locationName: formData.locationName,
        locationLink: formData.locationLink,
        startDate: formData.startDate,
        endDate: formData.endDate,
    });
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);

    // Custom link modal state
    const [linkModalVisible, setLinkModalVisible] = useState(false);
    const [linkTitle, setLinkTitle] = useState('');
    const [linkUrl, setLinkUrl] = useState('');

    // Location state
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [tempLocationName, setTempLocationName] = useState(formData.locationName || '');
    const [tempLocationLink, setTempLocationLink] = useState(formData.locationLink || '');

    // Date/Time state (Start/End Date)
    const [showDateModal, setShowDateModal] = useState(false);
    const [dateModalType, setDateModalType] = useState<'start' | 'end'>('start');
    const [tempDate, setTempDate] = useState<Date>(new Date());

    // Image picker state
    const [showImagePickerModal, setShowImagePickerModal] = useState(false);

    // Reminder state
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [tempReminderDate, setTempReminderDate] = useState<Date>(
        formData.reminderDate ? new Date(formData.reminderDate) : new Date(Date.now() + 60 * 60 * 1000)
    );
    const [remindBefore, setRemindBefore] = useState(0);
    const [tempRecurrence, setTempRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>(
        formData.recurrence || 'none'
    );

    const finalNotificationTime = new Date(tempReminderDate.getTime() - remindBefore * 60 * 1000);
    const isNotificationPast = finalNotificationTime <= new Date();

    const { theme, isDark } = useTheme();
    const colors = useThemeColors();

    const editorBgColor = formData.color === '#ffffff' ? colors.background : formData.color;
    const editorTextColor = formData.color === '#ffffff' ? colors.textPrimary : '#333';

    // Formatted reminder date for display
    const formattedReminder = useMemo(() => {
        if (!formData.reminderDate) return null;
        return dayjs(formData.reminderDate).format('DD MMM YYYY HH:mm');
    }, [formData.reminderDate]);

    // Check if reminder is in the past
    const isReminderPast = useMemo(() => {
        if (!formData.reminderDate) return false;
        return new Date(formData.reminderDate) < new Date();
    }, [formData.reminderDate]);

    // Formatted start and end dates for display
    const formattedStartDate = useMemo(() => {
        if (!formData.startDate) return null;
        return dayjs(formData.startDate).format('DD MMM YYYY HH:mm');
    }, [formData.startDate]);

    const formattedEndDate = useMemo(() => {
        if (!formData.endDate) return null;
        return dayjs(formData.endDate).format('DD MMM YYYY HH:mm');
    }, [formData.endDate]);

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
            formData.color !== initial.color ||
            formData.reminderDate !== initial.reminderDate ||
            formData.startDate !== initial.startDate ||
            formData.endDate !== initial.endDate;
        setHasUnsavedChanges(changed);
    }, [formData.title, formData.content, formData.color, formData.reminderDate, formData.startDate, formData.endDate]);

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

    // ========== Reminder Handlers ==========

    const handleOpenReminderModal = useCallback(() => {
        // Initialize temp date from existing reminder or 1 hour from now
        const initialDate = formData.reminderDate
            ? new Date(formData.reminderDate)
            : new Date(Date.now() + 60 * 60 * 1000);
        setTempReminderDate(initialDate);
        setRemindBefore(0);
        setTempRecurrence(formData.recurrence || 'none');
        setShowReminderModal(true);
    }, [formData.reminderDate, formData.recurrence]);

    // Custom date/time adjustment helpers
    const adjustDate = useCallback((days: number) => {
        setTempReminderDate(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() + days);
            const minAllowed = new Date(Date.now() + remindBefore * 60 * 1000);
            minAllowed.setSeconds(0, 0);
            if (d < minAllowed) return minAllowed;
            return d;
        });
    }, [remindBefore]);

    const adjustHour = useCallback((delta: number) => {
        setTempReminderDate(prev => {
            const d = new Date(prev);
            d.setHours(d.getHours() + delta);
            const minAllowed = new Date(Date.now() + remindBefore * 60 * 1000);
            minAllowed.setSeconds(0, 0);
            if (d < minAllowed) return minAllowed;
            return d;
        });
    }, [remindBefore]);

    const adjustMinute = useCallback((delta: number) => {
        setTempReminderDate(prev => {
            const d = new Date(prev);
            d.setMinutes(d.getMinutes() + delta);
            const minAllowed = new Date(Date.now() + remindBefore * 60 * 1000);
            minAllowed.setSeconds(0, 0);
            if (d < minAllowed) return minAllowed;
            return d;
        });
    }, [remindBefore]);

    const handleSelectRemindBefore = useCallback((minutes: number) => {
        setRemindBefore(minutes);

        // Check if the resulting reminder time would be in the past
        const now = new Date();
        const notificationTime = new Date(tempReminderDate.getTime() - minutes * 60 * 1000);

        if (notificationTime <= now) {
            // Auto-adjust target date (tempReminderDate) so that notificationTime is slightly in the future (e.g. now + 1 min)
            const newTargetDate = new Date(now.getTime() + (minutes + 1) * 60 * 1000);
            newTargetDate.setSeconds(0, 0);
            setTempReminderDate(newTargetDate);

            // Show toast or alert? Just silently adjusting is fine according to user requested behavior.
        }
    }, [tempReminderDate]);

    const handleConfirmReminder = useCallback(() => {
        if (isNotificationPast) return;
        onUpdateField('reminderDate', finalNotificationTime.toISOString());
        onUpdateField('recurrence', tempRecurrence);
        setShowReminderModal(false);
    }, [finalNotificationTime, isNotificationPast, onUpdateField, tempRecurrence]);

    const handleRemoveReminder = useCallback(() => {
        onUpdateField('reminderDate', null);
        onUpdateField('recurrence', 'none');
        setShowReminderModal(false);
    }, [onUpdateField]);

    // Quick reminder presets
    const handleQuickReminder = useCallback((minutes: number) => {
        const reminderDate = new Date(Date.now() + minutes * 60 * 1000);
        onUpdateField('reminderDate', reminderDate.toISOString());
        setShowReminderModal(false);
    }, [onUpdateField]);

    // ========== Location Handlers ==========

    const handleConfirmLocation = useCallback(() => {
        onUpdateField('locationName', tempLocationName.trim() || null);
        onUpdateField('locationLink', tempLocationLink.trim() || null);
        setShowLocationModal(false);
    }, [tempLocationName, tempLocationLink, onUpdateField]);

    const handleRemoveLocation = useCallback(() => {
        setTempLocationName('');
        setTempLocationLink('');
        onUpdateField('locationName', null);
        onUpdateField('locationLink', null);
        setShowLocationModal(false);
    }, [onUpdateField]);

    // ========== Start/End Date Handlers ==========

    const handleOpenDateModal = useCallback((type: 'start' | 'end') => {
        setDateModalType(type);
        const existingDate = type === 'start' ? formData.startDate : formData.endDate;
        setTempDate(existingDate ? new Date(existingDate) : new Date());
        setShowDateModal(true);
    }, [formData.startDate, formData.endDate]);

    const adjustGenericDate = useCallback((days: number) => {
        setTempDate(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() + days);
            return d;
        });
    }, []);

    const adjustGenericHour = useCallback((delta: number) => {
        setTempDate(prev => {
            const d = new Date(prev);
            d.setHours(d.getHours() + delta);
            return d;
        });
    }, []);

    const adjustGenericMinute = useCallback((delta: number) => {
        setTempDate(prev => {
            const d = new Date(prev);
            d.setMinutes(d.getMinutes() + delta);
            return d;
        });
    }, []);

    const handleConfirmDate = useCallback(() => {
        const fieldName = dateModalType === 'start' ? 'startDate' : 'endDate';
        onUpdateField(fieldName, tempDate.toISOString());
        setShowDateModal(false);
    }, [dateModalType, tempDate, onUpdateField]);

    const handleRemoveDate = useCallback(() => {
        const fieldName = dateModalType === 'start' ? 'startDate' : 'endDate';
        onUpdateField(fieldName, null);
        setShowDateModal(false);
    }, [dateModalType, onUpdateField]);

    // ========== Image Handlers ==========

    const handlePickImageFromGallery = useCallback(async () => {
        setShowImagePickerModal(false);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.6,
                base64: true,
                allowsEditing: true,
            });
            if (!result.canceled && result.assets[0]?.base64) {
                const asset = result.assets[0];
                const mimeType = asset.mimeType || 'image/jpeg';
                const dataUri = `data:${mimeType};base64,${asset.base64}`;
                richTextEditorRef.current?.insertImage(dataUri, 'width: 100%; max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;');
            }
        } catch (error) {
            Alert.alert('Error', 'ไม่สามารถเลือกรูปภาพได้');
            console.error('Image picker error:', error);
        }
    }, []);

    const handleTakePhoto = useCallback(async () => {
        setShowImagePickerModal(false);
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission', 'ต้องอนุญาตการเข้าถึงกล้องก่อน');
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                quality: 0.6,
                base64: true,
                allowsEditing: true,
            });
            if (!result.canceled && result.assets[0]?.base64) {
                const asset = result.assets[0];
                const mimeType = asset.mimeType || 'image/jpeg';
                const dataUri = `data:${mimeType};base64,${asset.base64}`;
                richTextEditorRef.current?.insertImage(dataUri, 'width: 100%; max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;');
            }
        } catch (error) {
            Alert.alert('Error', 'ไม่สามารถถ่ายรูปได้');
            console.error('Camera error:', error);
        }
    }, []);

    const handlePressAddImage = useCallback(() => {
        setShowImagePickerModal(true);
    }, []);

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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                            {/* Reminder button in header */}
                            <TouchableOpacity onPress={handleOpenReminderModal}>
                                <Ionicons name='notifications' size={24} color={formData.reminderDate ? '#ffffff' : colors.textSecondary} />
                            </TouchableOpacity>
                            {/* Location button */}
                            <TouchableOpacity onPress={() => {
                                setTempLocationName(formData.locationName || '');
                                setTempLocationLink(formData.locationLink || '');
                                setShowLocationModal(true);
                            }}>
                                <Ionicons name='location' size={24} color={formData.locationName ? colors.primary : colors.textSecondary} />
                            </TouchableOpacity>
                            {/* Start/End Date button */}
                            <TouchableOpacity onPress={() => handleOpenDateModal('start')}>
                                <AntDesign name="calendar" size={24} color={(formData.startDate || formData.endDate) ? colors.primary : colors.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onSave}><Ionicons name='checkmark' size={24} color={colors.textPrimary} /></TouchableOpacity>
                        </View>
                    </View>

                    {/* Reminder Badge */}
                    {formData.reminderDate && (
                        <TouchableOpacity
                            onPress={handleOpenReminderModal}
                            style={[
                                styles.reminderBadge,
                                {
                                    backgroundColor: isReminderPast
                                        ? (isDark ? 'rgba(231,76,60,0.15)' : 'rgba(231,76,60,0.1)')
                                        : (isDark ? 'rgba(230,126,34,0.15)' : 'rgba(230,126,34,0.08)')
                                }
                            ]}
                        >
                            <Ionicons name='notifications' size={16} color={isReminderPast ? '#e74c3c' : '#e67e22'} />
                            <Text style={[
                                styles.reminderBadgeText,
                                { color: isReminderPast ? '#e74c3c' : '#ffffff' }
                            ]}>
                                {isReminderPast ? 'เลยกำหนด: ' : ''}{formattedReminder}
                                {formData.recurrence === 'daily' && ' (ทุกวัน)'}
                                {formData.recurrence === 'weekly' && ' (ทุกสัปดาห์)'}
                                {formData.recurrence === 'monthly' && ' (ทุกเดือน)'}
                                {formData.recurrence === 'yearly' && ' (ทุกปี)'}
                            </Text>
                            <TouchableOpacity
                                onPress={handleRemoveReminder}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <AntDesign name="close" size={14} color={isReminderPast ? '#e74c3c' : '#e67e22'} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}

                    {/* Location Badge */}
                    {formData.locationName && (
                        <TouchableOpacity
                            onPress={() => {
                                setTempLocationName(formData.locationName || '');
                                setTempLocationLink(formData.locationLink || '');
                                setShowLocationModal(true);
                            }}
                            style={[
                                styles.reminderBadge,
                                { backgroundColor: isDark ? 'rgba(52,152,219,0.15)' : 'rgba(52,152,219,0.1)' }
                            ]}
                        >
                            <Ionicons name='location' size={16} color={colors.primary} />
                            <Text style={[styles.reminderBadgeText, { color: colors.primary }]} numberOfLines={1}>
                                {formData.locationName}
                            </Text>
                            {formData.locationLink ? (
                                <Feather name="external-link" size={12} color={colors.primary} />
                            ) : null}
                            <TouchableOpacity
                                onPress={handleRemoveLocation}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <AntDesign name="close" size={14} color={colors.primary} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}

                    {/* Start/End Date Badges */}
                    {(formData.startDate || formData.endDate) && (
                        <View style={{ paddingHorizontal: 16, marginTop: formData.reminderDate || formData.locationName ? 4 : 8, gap: 8 }}>
                            {formData.startDate && (
                                <TouchableOpacity
                                    onPress={() => handleOpenDateModal('start')}
                                    style={[
                                        styles.reminderBadge,
                                        { backgroundColor: isDark ? 'rgba(46, 204, 113, 0.15)' : 'rgba(46, 204, 113, 0.1)' }
                                    ]}
                                >
                                    <AntDesign name="caret-right" size={14} color="#2ecc71" />
                                    <Text style={[styles.reminderBadgeText, { color: '#2ecc71' }]} numberOfLines={1}>
                                        เริ่ม: {formattedStartDate}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setDateModalType('start');
                                            handleRemoveDate();
                                        }}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <AntDesign name="close" size={14} color="#2ecc71" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            )}
                            
                            {formData.endDate && (
                                <TouchableOpacity
                                    onPress={() => handleOpenDateModal('end')}
                                    style={[
                                        styles.reminderBadge,
                                        { backgroundColor: isDark ? 'rgba(231, 76, 60, 0.15)' : 'rgba(231, 76, 60, 0.1)' }
                                    ]}
                                >
                                    <AntDesign name="pause-circle" size={14} color="#e74c3c" />
                                    <Text style={[styles.reminderBadgeText, { color: '#e74c3c' }]} numberOfLines={1}>
                                        สิ้นสุด: {formattedEndDate}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setDateModalType('end');
                                            handleRemoveDate();
                                        }}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <AntDesign name="close" size={14} color="#e74c3c" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

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
                    <View className='p-7'>
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
                                    contentCSSText: `font-size: 13px; line-height: 1.6; font-family: sans-serif; padding: 10px; hr { border-top: 1px solid ${colors.border}; }`,
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
                                actions.insertLink, actions.insertImage, actions.line,
                            ]}
                            style={{ backgroundColor: colors.surface }}
                            iconTint={colors.textPrimary}
                            selectedIconTint={colors.primary}
                            iconSize={20}
                            unselectedButtonStyle={{ backgroundColor: 'transparent' }}
                            selectedButtonStyle={{ backgroundColor: colors.surface }}
                            onInsertLink={handleOpenLinkModal}
                            onPressAddImage={handlePressAddImage}
                        />
                    </View>
                )}
            </KeyboardAvoidingView>

            {/* ========== Reminder Modal ========== */}
            <Modal
                visible={showReminderModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowReminderModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowReminderModal(false)}
                >
                    <TouchableOpacity activeOpacity={1} style={[styles.reminderModalContent, { backgroundColor: colors.surface }]}>
                        {/* Header */}
                        <View style={styles.reminderModalHeader}>
                            <Ionicons name="notifications" size={24} color="#e67e22" />
                            <Text style={[styles.reminderModalTitle, { color: colors.textPrimary }]}>ตั้งเวลาแจ้งเตือน</Text>
                        </View>

                        {/* Quick presets */}
                        <Text style={[styles.reminderSectionLabel, { color: colors.textSecondary }]}>ตั้งค่าด่วน</Text>
                        <View style={styles.presetsScrollView}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPresetsRow}>
                                {[
                                    { label: '30 นาที', minutes: 30 },
                                    { label: '1 ชม.', minutes: 60 },
                                    { label: '3 ชม.', minutes: 180 },
                                    { label: 'พรุ่งนี้', minutes: 1440 },
                                ].map((preset) => (
                                    <TouchableOpacity
                                        key={preset.minutes}
                                        style={[styles.quickPresetBtn, { backgroundColor: isDark ? 'rgba(230,126,34,0.15)' : 'rgba(230,126,34,0.1)' }]}
                                        onPress={() => handleQuickReminder(preset.minutes)}
                                    >
                                        <Text style={[styles.quickPresetText, { color: '#e67e22' }]}>{preset.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Custom date/time picker */}
                        <Text style={[styles.reminderSectionLabel, { color: colors.textSecondary, marginTop: 16 }]}>กำหนดเอง (เลื่อนเพื่อปรับเวลา)</Text>

                        <View style={[styles.pickerContainer, { backgroundColor: isDark ? colors.background : '#f8f8f8', borderColor: colors.border }]}>
                            {/* Date picker row */}
                            <View style={styles.customPickerRow}>
                                <AntDesign name="calendar" size={16} color={colors.primary} />
                                <TouchableOpacity onPress={() => adjustDate(-1)} style={styles.pickerArrow}>
                                    <AntDesign name="left" size={18} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <Text style={[styles.pickerValueText, { color: colors.textPrimary }]}>
                                    {dayjs(tempReminderDate).format('DD MMM YYYY')}
                                </Text>
                                <TouchableOpacity onPress={() => adjustDate(1)} style={styles.pickerArrow}>
                                    <AntDesign name="right" size={18} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.divider, { backgroundColor: colors.border }]} />

                            {/* Time picker row */}
                            <View style={styles.customPickerRow}>
                            <AntDesign name="clock-circle" size={16} color={colors.primary} />
                            {/* Hour */}
                            <View style={styles.timeUnit}>
                                <TouchableOpacity onPress={() => adjustHour(1)} style={styles.timeArrow}>
                                    <AntDesign name="up" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <Text style={[styles.timeValueText, { color: colors.textPrimary }]}>
                                    {dayjs(tempReminderDate).format('HH')}
                                </Text>
                                <TouchableOpacity onPress={() => adjustHour(-1)} style={styles.timeArrow}>
                                    <AntDesign name="down" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.timeSeparator, { color: colors.textPrimary }]}>:</Text>
                            {/* Minute */}
                            <View style={styles.timeUnit}>
                                <TouchableOpacity onPress={() => adjustMinute(1)} style={styles.timeArrow}>
                                    <AntDesign name="up" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <Text style={[styles.timeValueText, { color: colors.textPrimary }]}>
                                    {dayjs(tempReminderDate).format('mm')}
                                </Text>
                                <TouchableOpacity onPress={() => adjustMinute(-1)} style={styles.timeArrow}>
                                    <AntDesign name="down" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            </View>
                        </View>

                        {/* Remind Before Option */}
                        <Text style={[styles.reminderSectionLabel, { color: colors.textSecondary, marginTop: 16 }]}>แจ้งเตือนล่วงหน้า</Text>
                        <View style={styles.presetsScrollView}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPresetsRow}>
                                {[
                                    { label: 'ตรงเวลา', minutes: 0 },
                                    { label: '10 นาที', minutes: 10 },
                                    { label: '30 นาที', minutes: 30 },
                                    { label: '1 ชม.', minutes: 60 },
                                    { label: '1 วัน', minutes: 1440 },
                                ].map((preset) => (
                                    <TouchableOpacity
                                        key={preset.minutes}
                                        style={[
                                            styles.quickPresetBtn,
                                                { backgroundColor: remindBefore === preset.minutes ? '#e67e22' : (isDark ? 'rgba(230,126,34,0.15)' : 'rgba(230,126,34,0.1)') }
                                            ]}
                                            onPress={() => handleSelectRemindBefore(preset.minutes)}
                                        >
                                            <Text style={[
                                                styles.quickPresetText,
                                                { color: remindBefore === preset.minutes ? '#fff' : '#e67e22' }
                                            ]}>{preset.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                            </ScrollView>
                        </View>

                        {/* Computed Feedback */}
                        {remindBefore > 0 && !isNotificationPast && (
                            <Text style={[styles.reminderFeedback, { color: colors.primary }]}>
                                ⏰ ดังกริ่งจริงตอน: {dayjs(finalNotificationTime).format('DD MMM HH:mm')}
                            </Text>
                        )}
                        {isNotificationPast && (
                            <Text style={[styles.reminderFeedback, { color: '#e74c3c' }]}>
                                ⚠️ เวลาแจ้งเตือนผ่านไปแล้ว กรุณาเลื่อนเวลาใหม่
                            </Text>
                        )}

                        {/* Recurrence Option */}
                        <Text style={[styles.reminderSectionLabel, { color: colors.textSecondary, marginTop: 16 }]}>เกิดซ้ำ (Recurrence)</Text>
                        <View style={styles.presetsScrollView}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPresetsRow}>
                                {[
                                    { label: 'ไม่ทำซ้ำ', value: 'none' },
                                    { label: 'ทุกวัน', value: 'daily' },
                                    { label: 'ทุกสัปดาห์', value: 'weekly' },
                                    { label: 'ทุกเดือน', value: 'monthly' },
                                    { label: 'ทุกปี', value: 'yearly' },
                                ].map((preset) => (
                                    <TouchableOpacity
                                        key={preset.value}
                                        style={[
                                            styles.quickPresetBtn,
                                            { backgroundColor: tempRecurrence === preset.value ? colors.primary : (isDark ? 'rgba(52,152,219,0.15)' : 'rgba(52,152,219,0.1)') }
                                        ]}
                                        onPress={() => setTempRecurrence(preset.value as any)}
                                    >
                                        <Text style={[
                                            styles.quickPresetText,
                                            { color: tempRecurrence === preset.value ? '#fff' : colors.primary }
                                        ]}>{preset.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Action buttons */}
                        <View style={styles.reminderActions}>
                            <TouchableOpacity
                                style={[styles.reminderConfirmBtn, { backgroundColor: isNotificationPast ? '#95a5a6' : '#e67e22' }]}
                                onPress={handleConfirmReminder}
                                disabled={isNotificationPast}
                            >
                                <Ionicons name="notifications" size={16} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.reminderConfirmText}>ตั้งเวลาแจ้งเตือน</Text>
                            </TouchableOpacity>

                            {formData.reminderDate && (
                                <TouchableOpacity
                                    style={[styles.reminderRemoveBtn, { borderColor: '#e74c3c' }]}
                                    onPress={handleRemoveReminder}
                                >
                                    <AntDesign name="delete" size={14} color="#e74c3c" style={{ marginRight: 6 }} />
                                    <Text style={[styles.reminderRemoveText, { color: '#e74c3c' }]}>ลบการแจ้งเตือน</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.reminderCancelBtn}
                                onPress={() => setShowReminderModal(false)}
                            >
                                <Text style={[styles.reminderCancelText, { color: colors.textSecondary }]}>ยกเลิก</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Location Modal */}
            <Modal
                visible={showLocationModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowLocationModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowLocationModal(false)}
                >
                    <TouchableOpacity activeOpacity={1} style={[styles.reminderModalContent, { backgroundColor: colors.surface }]}>
                        {/* Header */}
                        <View style={styles.reminderModalHeader}>
                            <Ionicons name="location" size={24} color={colors.primary} />
                            <Text style={[styles.reminderModalTitle, { color: colors.textPrimary }]}>สถานที่</Text>
                        </View>

                        {/* Location Name */}
                        <Text style={[styles.reminderSectionLabel, { color: colors.textSecondary, marginTop: 12 }]}>ชื่อสถานที่</Text>
                        <TextInput
                            style={[
                                styles.modalInput,
                                {
                                    backgroundColor: isDark ? colors.background : '#f8f8f8',
                                    color: colors.textPrimary,
                                    borderColor: colors.border,
                                    marginBottom: 12
                                }
                            ]}
                            placeholder="เช่น Central World, บ้าน, ออฟฟิศ..."
                            placeholderTextColor={colors.textSecondary}
                            value={tempLocationName}
                            onChangeText={setTempLocationName}
                            autoFocus
                        />

                        {/* GPS Link */}
                        <Text style={[styles.reminderSectionLabel, { color: colors.textSecondary }]}>ลิงก์ GPS (ไม่บังคับ)</Text>
                        <TextInput
                            style={[
                                styles.modalInput,
                                {
                                    backgroundColor: isDark ? colors.background : '#f8f8f8',
                                    color: colors.textPrimary,
                                    borderColor: colors.border,
                                    marginBottom: 8
                                }
                            ]}
                            placeholder="วาง Google Maps link ที่นี่..."
                            placeholderTextColor={colors.textSecondary}
                            value={tempLocationLink}
                            onChangeText={setTempLocationLink}
                            keyboardType="url"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalBtnCancel}
                                onPress={() => setShowLocationModal(false)}
                            >
                                <Text style={[styles.modalBtnCancelText, { color: colors.textSecondary }]}>ยกเลิก</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtnInsert, { backgroundColor: colors.primary }]}
                                onPress={handleConfirmLocation}
                            >
                                <Text style={styles.modalBtnInsertText}>บันทึก</Text>
                            </TouchableOpacity>
                        </View>
                        {(formData.locationName || formData.locationLink) && (
                            <TouchableOpacity
                                style={[styles.reminderRemoveBtn, { borderColor: '#e74c3c', marginTop: 16 }]}
                                onPress={handleRemoveLocation}
                            >
                                <AntDesign name="delete" size={14} color="#e74c3c" style={{ marginRight: 6 }} />
                                <Text style={[styles.reminderRemoveText, { color: '#e74c3c' }]}>ลบสถานที่</Text>
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Date/Time Modal for Start/End Date */}
            <Modal
                visible={showDateModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDateModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowDateModal(false)}
                >
                    <TouchableOpacity activeOpacity={1} style={[styles.reminderModalContent, { backgroundColor: colors.surface }]}>
                        {/* Header */}
                        <View style={styles.reminderModalHeader}>
                            <AntDesign name="calendar" size={24} color={dateModalType === 'start' ? '#2ecc71' : '#e74c3c'} />
                            <Text style={[styles.reminderModalTitle, { color: colors.textPrimary }]}>
                                {dateModalType === 'start' ? 'เวลาเริ่มต้น (Start Date)' : 'เวลาสิ้นสุด (End Date)'}
                            </Text>
                        </View>

                        <Text style={[styles.reminderSectionLabel, { color: colors.textSecondary, marginTop: 16 }]}>กำหนดเวลา (เลื่อนเพื่อปรับ)</Text>

                        <View style={[styles.pickerContainer, { backgroundColor: isDark ? colors.background : '#f8f8f8', borderColor: colors.border }]}>
                            {/* Date picker row */}
                            <View style={styles.customPickerRow}>
                                <AntDesign name="calendar" size={16} color={colors.primary} />
                                <TouchableOpacity onPress={() => adjustGenericDate(-1)} style={styles.pickerArrow}>
                                    <AntDesign name="left" size={18} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <Text style={[styles.pickerValueText, { color: colors.textPrimary }]}>
                                    {dayjs(tempDate).format('DD MMM YYYY')}
                                </Text>
                                <TouchableOpacity onPress={() => adjustGenericDate(1)} style={styles.pickerArrow}>
                                    <AntDesign name="right" size={18} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.divider, { backgroundColor: colors.border }]} />

                            {/* Time picker row */}
                            <View style={styles.customPickerRow}>
                                <AntDesign name="clock-circle" size={16} color={colors.primary} />
                                {/* Hour */}
                                <View style={styles.timeUnit}>
                                    <TouchableOpacity onPress={() => adjustGenericHour(1)} style={styles.timeArrow}>
                                        <AntDesign name="up" size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                    <Text style={[styles.timeValueText, { color: colors.textPrimary }]}>
                                        {dayjs(tempDate).format('HH')}
                                    </Text>
                                    <TouchableOpacity onPress={() => adjustGenericHour(-1)} style={styles.timeArrow}>
                                        <AntDesign name="down" size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={[styles.timeSeparator, { color: colors.textPrimary }]}>:</Text>
                                {/* Minute */}
                                <View style={styles.timeUnit}>
                                    <TouchableOpacity onPress={() => adjustGenericMinute(1)} style={styles.timeArrow}>
                                        <AntDesign name="up" size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                    <Text style={[styles.timeValueText, { color: colors.textPrimary }]}>
                                        {dayjs(tempDate).format('mm')}
                                    </Text>
                                    <TouchableOpacity onPress={() => adjustGenericMinute(-1)} style={styles.timeArrow}>
                                        <AntDesign name="down" size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Switch between start and end type */}
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, marginBottom: 8, gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    setDateModalType('start');
                                    setTempDate(formData.startDate ? new Date(formData.startDate) : new Date());
                                }}
                                style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: dateModalType === 'start' ? '#2ecc71' : 'transparent', borderWidth: 1, borderColor: '#2ecc71' }}
                            >
                                <Text style={{ color: dateModalType === 'start' ? '#fff' : '#2ecc71', fontSize: 13, fontFamily: 'Kanit-Medium' }}>เวลาเริ่มต้น</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    setDateModalType('end');
                                    setTempDate(formData.endDate ? new Date(formData.endDate) : new Date(Date.now() + 60 * 60 * 1000));
                                }}
                                style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: dateModalType === 'end' ? '#e74c3c' : 'transparent', borderWidth: 1, borderColor: '#e74c3c' }}
                            >
                                <Text style={{ color: dateModalType === 'end' ? '#fff' : '#e74c3c', fontSize: 13, fontFamily: 'Kanit-Medium' }}>เวลาสิ้นสุด</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.reminderActions}>
                            <TouchableOpacity
                                style={[styles.reminderConfirmBtn, { backgroundColor: dateModalType === 'start' ? '#2ecc71' : '#e74c3c' }]}
                                onPress={handleConfirmDate}
                            >
                                <AntDesign name="check-circle" size={16} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.reminderConfirmText}>บันทึกเวลา</Text>
                            </TouchableOpacity>

                            {((dateModalType === 'start' && formData.startDate) || (dateModalType === 'end' && formData.endDate)) && (
                                <TouchableOpacity
                                    style={[styles.reminderRemoveBtn, { borderColor: '#95a5a6' }]}
                                    onPress={handleRemoveDate}
                                >
                                    <Text style={[styles.reminderRemoveText, { color: '#95a5a6' }]}>ลบเวลานี้</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.reminderCancelBtn}
                                onPress={() => setShowDateModal(false)}
                            >
                                <Text style={[styles.reminderCancelText, { color: colors.textSecondary }]}>ปิด</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Image Picker Modal */}
            <Modal
                visible={showImagePickerModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowImagePickerModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowImagePickerModal(false)}
                >
                    <TouchableOpacity activeOpacity={1} style={[styles.reminderModalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.reminderModalHeader}>
                            <Feather name="image" size={24} color={colors.primary} />
                            <Text style={[styles.reminderModalTitle, { color: colors.textPrimary }]}>แทรกรูปภาพ</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.imagePickerOption, { backgroundColor: isDark ? colors.background : '#f8f8f8' }]}
                            onPress={handlePickImageFromGallery}
                        >
                            <Feather name="image" size={22} color={colors.primary} />
                            <Text style={[styles.imagePickerOptionText, { color: colors.textPrimary }]}>เลือกจากแกลเลอรี่</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.imagePickerOption, { backgroundColor: isDark ? colors.background : '#f8f8f8' }]}
                            onPress={handleTakePhoto}
                        >
                            <Feather name="camera" size={22} color={colors.primary} />
                            <Text style={[styles.imagePickerOptionText, { color: colors.textPrimary }]}>ถ่ายรูป</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.reminderCancelBtn}
                            onPress={() => setShowImagePickerModal(false)}
                        >
                            <Text style={[styles.reminderCancelText, { color: colors.textSecondary }]}>ยกเลิก</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

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
    // Reminder badge
    reminderBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginHorizontal: 16,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    reminderBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    // Reminder Modal
    reminderModalContent: {
        borderRadius: 20,
        padding: 24,
        width: '90%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    reminderModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    reminderModalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    reminderSectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    presetsScrollView: {
        marginHorizontal: -24, // pull out to edge of modal
        marginBottom: 8,
    },
    quickPresetsRow: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 24, // push content back in
    },
    quickPresetBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    quickPresetText: {
        fontSize: 13,
        fontWeight: '600',
    },
    pickerContainer: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    customPickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    divider: {
        height: 1,
        width: '100%',
    },
    pickerArrow: {
        padding: 6,
    },
    pickerValueText: {
        fontSize: 15,
        fontWeight: '600',
        minWidth: 120,
        textAlign: 'center',
    },
    timeUnit: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeArrow: {
        padding: 4,
    },
    timeValueText: {
        fontSize: 20,
        fontWeight: '700',
        minWidth: 32,
        textAlign: 'center',
    },
    timeSeparator: {
        fontSize: 20,
        fontWeight: '700',
        marginHorizontal: 8,
    },
    reminderFeedback: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 6,
        textAlign: 'center'
    },
    reminderActions: {
        marginTop: 20,
        gap: 10,
    },
    reminderConfirmBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        borderRadius: 12,
    },
    reminderConfirmText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    reminderRemoveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 11,
        borderRadius: 12,
        borderWidth: 1,
    },
    reminderRemoveText: {
        fontSize: 14,
        fontWeight: '600',
    },
    reminderCancelBtn: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    reminderCancelText: {
        fontSize: 14,
        fontWeight: '600',
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
    // Image Picker
    imagePickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 12,
        gap: 14,
    },
    imagePickerOptionText: {
        fontSize: 16,
        fontWeight: '500',
    },
});

export default NoteEditor;
