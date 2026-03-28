import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, ScrollView, KeyboardAvoidingView, Platform,
    Keyboard, Modal, Alert, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { AntDesign, Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import dayjs from 'dayjs';
import type { NoteFormData } from '@/types/note';
import { NOTE_COLORS } from '@/types/note';
import { uploadNoteImage } from '@/services/noteService';
import { useTheme, useThemeColors } from '../ThemeProvider';
import ScreenHeader from '@/components/ScreenHeader';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface NoteEditorProps {
    formData: NoteFormData;
    isEditing: boolean;
    onUpdateField: (key: keyof NoteFormData, value: unknown) => void;
    onSave: () => void;
    onCancel: () => void;
}

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
type DateModalType = 'start' | 'end';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const HEADER_APPROX_HEIGHT = 280;

const QUICK_REMINDERS = [
    { label: '30 นาที', minutes: 30 },
    { label: '1 ชม.', minutes: 60 },
    { label: '3 ชม.', minutes: 180 },
    { label: 'พรุ่งนี้', minutes: 1440 },
] as const;

const REMIND_BEFORE_OPTIONS = [
    { label: 'ตรงเวลา', minutes: 0 },
    { label: '10 นาที', minutes: 10 },
    { label: '30 นาที', minutes: 30 },
    { label: '1 ชม.', minutes: 60 },
    { label: '1 วัน', minutes: 1440 },
] as const;

const RECURRENCE_OPTIONS: { label: string; value: RecurrenceType }[] = [
    { label: 'ไม่ทำซ้ำ', value: 'none' },
    { label: 'ทุกวัน', value: 'daily' },
    { label: 'ทุกสัปดาห์', value: 'weekly' },
    { label: 'ทุกเดือน', value: 'monthly' },
    { label: 'ทุกปี', value: 'yearly' },
];

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
    none: '',
    daily: ' (ทุกวัน)',
    weekly: ' (ทุกสัปดาห์)',
    monthly: ' (ทุกเดือน)',
    yearly: ' (ทุกปี)',
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const NoteEditor: React.FC<NoteEditorProps> = ({
    formData,
    isEditing: _isEditing,
    onUpdateField,
    onSave,
    onCancel,
}) => {
    const { isDark } = useTheme();
    const colors = useThemeColors();
    const { height: windowHeight } = useWindowDimensions();

    // ── Refs ──────────────────────────────────────────────────────────────────

    const richTextRef = useRef<RichEditor>(null);
    const scrollRef = useRef<ScrollView>(null);
    const initialFormData = useRef<NoteFormData>({ ...formData });

    // ── UI State ──────────────────────────────────────────────────────────────

    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showTitleEditor, setShowTitleEditor] = useState(
        !formData.title || formData.title.trim() === ''
    );
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    // Editor grows with content; starts at full visible height so there's no
    // empty gap and no internal WebView scroll needed.
    const [editorHeight, setEditorHeight] = useState(windowHeight - HEADER_APPROX_HEIGHT);

    // ── Unsaved changes ───────────────────────────────────────────────────────

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);

    // ── Link modal ────────────────────────────────────────────────────────────

    const [linkModalVisible, setLinkModalVisible] = useState(false);
    const [linkTitle, setLinkTitle] = useState('');
    const [linkUrl, setLinkUrl] = useState('');

    // ── Location modal ────────────────────────────────────────────────────────

    const [showLocationModal, setShowLocationModal] = useState(false);
    const [tempLocationName, setTempLocationName] = useState(formData.locationName ?? '');
    const [tempLocationLink, setTempLocationLink] = useState(formData.locationLink ?? '');

    // ── Date modal ────────────────────────────────────────────────────────────

    const [showDateModal, setShowDateModal] = useState(false);
    const [dateModalType, setDateModalType] = useState<DateModalType>('start');
    const [tempDate, setTempDate] = useState<Date>(new Date());

    // ── Image picker modal ────────────────────────────────────────────────────

    const [showImagePickerModal, setShowImagePickerModal] = useState(false);

    // ── Reminder modal ────────────────────────────────────────────────────────

    const [showReminderModal, setShowReminderModal] = useState(false);
    const [tempReminderDate, setTempReminderDate] = useState<Date>(
        formData.reminderDate
            ? new Date(formData.reminderDate)
            : new Date(Date.now() + 60 * 60 * 1000)
    );
    const [remindBefore, setRemindBefore] = useState(0);
    const [tempRecurrence, setTempRecurrence] = useState<RecurrenceType>(
        formData.recurrence ?? 'none'
    );

    // ── Derived values ────────────────────────────────────────────────────────

    const placeholderColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';

    const editorBgColor =
        formData.color === '#ffffff'
            ? (isDark ? '#262626' : '#ffffff')
            : formData.color;

    const editorTextColor = formData.color === '#ffffff' ? colors.textPrimary : '#333';

    const finalNotificationTime = new Date(
        tempReminderDate.getTime() - remindBefore * 60 * 1000
    );
    const isNotificationPast = finalNotificationTime <= new Date();

    const formattedReminder = useMemo(
        () => (formData.reminderDate ? dayjs(formData.reminderDate).format('DD MMM YYYY HH:mm') : null),
        [formData.reminderDate]
    );
    const isReminderPast = useMemo(
        () => (formData.reminderDate ? new Date(formData.reminderDate) < new Date() : false),
        [formData.reminderDate]
    );
    const formattedStartDate = useMemo(
        () => (formData.startDate ? dayjs(formData.startDate).format('DD MMM YYYY HH:mm') : null),
        [formData.startDate]
    );
    const formattedEndDate = useMemo(
        () => (formData.endDate ? dayjs(formData.endDate).format('DD MMM YYYY HH:mm') : null),
        [formData.endDate]
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Effects
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(show, () => setIsKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hide, () => setIsKeyboardVisible(false));

        const focusTimer = setTimeout(() => {
            richTextRef.current?.focusContentEditor();
        }, 500);

        return () => {
            showSub.remove();
            hideSub.remove();
            clearTimeout(focusTimer);
        };
    }, []);

    useEffect(() => {
        const init = initialFormData.current;
        const changed =
            formData.title !== init.title ||
            formData.content !== init.content ||
            formData.color !== init.color ||
            formData.reminderDate !== init.reminderDate ||
            formData.startDate !== init.startDate ||
            formData.endDate !== init.endDate;
        setHasUnsavedChanges(changed);
    }, [
        formData.title,
        formData.content,
        formData.color,
        formData.reminderDate,
        formData.startDate,
        formData.endDate,
    ]);

    // ─────────────────────────────────────────────────────────────────────────
    // Handlers — General
    // ─────────────────────────────────────────────────────────────────────────

    const handleChangeText = useCallback(
        (text: string) => onUpdateField('content', text),
        [onUpdateField]
    );

    const handleCancel = useCallback(() => {
        if (hasUnsavedChanges) setShowUnsavedModal(true);
        else onCancel();
    }, [hasUnsavedChanges, onCancel]);

    const handleSaveAndExit = useCallback(() => {
        setShowUnsavedModal(false);
        onSave();
    }, [onSave]);

    const handleDiscardAndExit = useCallback(() => {
        setShowUnsavedModal(false);
        onCancel();
    }, [onCancel]);

    const handleSave = useCallback(() => {
        if (!formData.title?.trim() && !formData.content?.trim()) return;
        onSave();
    }, [formData.title, formData.content, onSave]);

    // Scroll outer view to keep cursor visible
    const handleCursorPosition = useCallback((scrollY: number) => {
        scrollRef.current?.scrollTo({ y: scrollY - 80, animated: true });
    }, []);

    // Editor height grows to fit content — outer ScrollView handles all scrolling
    const handleEditorHeightChange = useCallback(
        (height: number) => {
            setEditorHeight(Math.max(windowHeight - HEADER_APPROX_HEIGHT, height + 24));
        },
        [windowHeight]
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Handlers — Link
    // ─────────────────────────────────────────────────────────────────────────

    const handleOpenLinkModal = useCallback(() => {
        setLinkTitle('');
        setLinkUrl('');
        setLinkModalVisible(true);
    }, []);

    const handleInsertLink = useCallback(() => {
        if (linkUrl.trim()) {
            richTextRef.current?.insertLink(linkTitle.trim() || linkUrl.trim(), linkUrl.trim());
        }
        setLinkModalVisible(false);
    }, [linkTitle, linkUrl]);

    // ─────────────────────────────────────────────────────────────────────────
    // Handlers — Reminder
    // ─────────────────────────────────────────────────────────────────────────

    const handleOpenReminderModal = useCallback(() => {
        setTempReminderDate(
            formData.reminderDate
                ? new Date(formData.reminderDate)
                : new Date(Date.now() + 60 * 60 * 1000)
        );
        setRemindBefore(0);
        setTempRecurrence(formData.recurrence ?? 'none');
        setShowReminderModal(true);
    }, [formData.reminderDate, formData.recurrence]);

    const clampReminderDate = useCallback(
        (date: Date): Date => {
            const min = new Date(Date.now() + remindBefore * 60 * 1000);
            min.setSeconds(0, 0);
            return date < min ? min : date;
        },
        [remindBefore]
    );

    const adjustDate = useCallback(
        (days: number) =>
            setTempReminderDate(prev => {
                const d = new Date(prev);
                d.setDate(d.getDate() + days);
                return clampReminderDate(d);
            }),
        [clampReminderDate]
    );

    const adjustHour = useCallback(
        (delta: number) =>
            setTempReminderDate(prev => {
                const d = new Date(prev);
                d.setHours(d.getHours() + delta);
                return clampReminderDate(d);
            }),
        [clampReminderDate]
    );

    const adjustMinute = useCallback(
        (delta: number) =>
            setTempReminderDate(prev => {
                const d = new Date(prev);
                d.setMinutes(d.getMinutes() + delta);
                return clampReminderDate(d);
            }),
        [clampReminderDate]
    );

    const handleSelectRemindBefore = useCallback(
        (minutes: number) => {
            setRemindBefore(minutes);
            const notificationTime = new Date(tempReminderDate.getTime() - minutes * 60 * 1000);
            if (notificationTime <= new Date()) {
                const adjusted = new Date(Date.now() + (minutes + 1) * 60 * 1000);
                adjusted.setSeconds(0, 0);
                setTempReminderDate(adjusted);
            }
        },
        [tempReminderDate]
    );

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

    const handleQuickReminder = useCallback(
        (minutes: number) => {
            onUpdateField('reminderDate', new Date(Date.now() + minutes * 60 * 1000).toISOString());
            setShowReminderModal(false);
        },
        [onUpdateField]
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Handlers — Location
    // ─────────────────────────────────────────────────────────────────────────

    const handleOpenLocationModal = useCallback(() => {
        setTempLocationName(formData.locationName ?? '');
        setTempLocationLink(formData.locationLink ?? '');
        setShowLocationModal(true);
    }, [formData.locationName, formData.locationLink]);

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

    // ─────────────────────────────────────────────────────────────────────────
    // Handlers — Start / End Date
    // ─────────────────────────────────────────────────────────────────────────

    const handleOpenDateModal = useCallback(
        (type: DateModalType) => {
            setDateModalType(type);
            const existing = type === 'start' ? formData.startDate : formData.endDate;
            setTempDate(existing ? new Date(existing) : new Date());
            setShowDateModal(true);
        },
        [formData.startDate, formData.endDate]
    );

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
        onUpdateField(dateModalType === 'start' ? 'startDate' : 'endDate', tempDate.toISOString());
        setShowDateModal(false);
    }, [dateModalType, tempDate, onUpdateField]);

    const handleRemoveDate = useCallback(() => {
        onUpdateField(dateModalType === 'start' ? 'startDate' : 'endDate', null);
        setShowDateModal(false);
    }, [dateModalType, onUpdateField]);

    // ─────────────────────────────────────────────────────────────────────────
    // Handlers — Image
    // ─────────────────────────────────────────────────────────────────────────

    const handleUploadAndInsertImage = useCallback(
        async (asset: ImagePicker.ImagePickerAsset) => {
            try {
                const imageUrl = await uploadNoteImage({
                    uri: asset.uri,
                    fileName: asset.fileName ?? `note-${Date.now()}.jpg`,
                    mimeType: asset.mimeType ?? 'image/jpeg',
                });
                richTextRef.current?.insertImage(
                    imageUrl,
                    'width:100%;max-width:100%;height:auto;border-radius:8px;margin:8px 0;'
                );
                richTextRef.current?.insertHTML('<div><br/></div>');

                // Small delay to let the WebView render the image and update its internal height
                setTimeout(() => {
                    richTextRef.current?.focusContentEditor();
                    // Calling getContentHtml sometimes helps the WebView sync its internal state
                    richTextRef.current?.getContentHtml();
                }, 300);
            } catch (error) {
                Alert.alert('Error', error instanceof Error ? error.message : 'ไม่สามารถอัปโหลดรูปได้');
            }
        },
        []
    );

    const handlePickImageFromGallery = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('คำขอสิทธิ์', 'กรุณาอนุญาตการเข้าถึงคลังรูปภาพในการตั้งค่า');
            return;
        }
        setShowImagePickerModal(false);
        setTimeout(async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.8,
                allowsEditing: true,
            });
            if (!result.canceled && result.assets[0]) {
                await handleUploadAndInsertImage(result.assets[0]);
            }
        }, 300);
    }, [handleUploadAndInsertImage]);

    const handleTakePhoto = useCallback(async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('คำขอสิทธิ์', 'กรุณาอนุญาตการเข้าถึงกล้องในการตั้งค่า');
            return;
        }
        setShowImagePickerModal(false);
        setTimeout(async () => {
            const result = await ImagePicker.launchCameraAsync({
                quality: 0.8,
                allowsEditing: true,
            });
            if (!result.canceled && result.assets[0]) {
                await handleUploadAndInsertImage(result.assets[0]);
            }
        }, 300);
    }, [handleUploadAndInsertImage]);

    // ─────────────────────────────────────────────────────────────────────────
    // Render helpers
    // ─────────────────────────────────────────────────────────────────────────

    const reminderColor = isReminderPast ? '#e74c3c' : '#e67e22';

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <ScreenHeader
                title=""
                showBack
                onBack={handleCancel}
                actions={[
                    {
                        icon: 'bell',
                        onPress: handleOpenReminderModal,
                        color: formData.reminderDate ? '#e67e22' : colors.textSecondary,
                        accessibilityLabel: 'Reminder',
                    },
                    {
                        icon: 'map-pin',
                        onPress: handleOpenLocationModal,
                        color: formData.locationName ? colors.primary : colors.textSecondary,
                        accessibilityLabel: 'Location',
                    },
                    {
                        icon: 'calendar',
                        onPress: () => handleOpenDateModal('start'),
                        color: (formData.startDate || formData.endDate) ? colors.primary : colors.textSecondary,
                        accessibilityLabel: 'Date',
                    },
                    {
                        icon: 'check',
                        onPress: handleSave,
                        color: colors.textPrimary,
                        accessibilityLabel: 'Save',
                    },
                ]}
            />

            {/* ── Main layout ─────────────────────────────────────────────────── */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Outer scroll — the ONLY scroll in this screen */}
                <ScrollView
                    ref={scrollRef}
                    style={{ flex: 1 }}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: isKeyboardVisible ? 450 : 120 }
                    ]}
                    keyboardDismissMode="on-drag"
                    keyboardShouldPersistTaps="handled"
                    removeClippedSubviews={false}
                >
                    {/* ── Badges ──────────────────────────────────────────────── */}

                    {formData.reminderDate && (
                        <TouchableOpacity
                            onPress={handleOpenReminderModal}
                            style={[
                                styles.badge,
                                {
                                    backgroundColor: isReminderPast
                                        ? 'rgba(231,76,60,0.12)'
                                        : 'rgba(230,126,34,0.10)',
                                },
                            ]}
                        >
                            <Ionicons name="notifications" size={14} color={reminderColor} />
                            <Text style={[styles.badgeText, { color: reminderColor }]} numberOfLines={1}>
                                {isReminderPast ? 'เลยกำหนด: ' : ''}
                                {formattedReminder}
                                {RECURRENCE_LABELS[formData.recurrence ?? 'none']}
                            </Text>
                            <TouchableOpacity onPress={handleRemoveReminder} hitSlop={styles.hitSlop}>
                                <AntDesign name="close" size={12} color={reminderColor} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}

                    {formData.locationName && (
                        <TouchableOpacity
                            onPress={handleOpenLocationModal}
                            style={[styles.badge, { backgroundColor: 'rgba(52,152,219,0.10)' }]}
                        >
                            <Ionicons name="location" size={14} color={colors.primary} />
                            <Text style={[styles.badgeText, { color: colors.primary }]} numberOfLines={1}>
                                {formData.locationName}
                            </Text>
                            {formData.locationLink && (
                                <Feather name="external-link" size={11} color={colors.primary} />
                            )}
                            <TouchableOpacity onPress={handleRemoveLocation} hitSlop={styles.hitSlop}>
                                <AntDesign name="close" size={12} color={colors.primary} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}

                    {formData.startDate && (
                        <TouchableOpacity
                            onPress={() => handleOpenDateModal('start')}
                            style={[styles.badge, { backgroundColor: 'rgba(46,204,113,0.10)' }]}
                        >
                            <AntDesign name="caret-right" size={12} color="#2ecc71" />
                            <Text style={[styles.badgeText, { color: '#2ecc71' }]} numberOfLines={1}>
                                เริ่ม: {formattedStartDate}
                            </Text>
                            <TouchableOpacity
                                onPress={() => { setDateModalType('start'); handleRemoveDate(); }}
                                hitSlop={styles.hitSlop}
                            >
                                <AntDesign name="close" size={12} color="#2ecc71" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}

                    {formData.endDate && (
                        <TouchableOpacity
                            onPress={() => handleOpenDateModal('end')}
                            style={[styles.badge, { backgroundColor: 'rgba(231,76,60,0.10)' }]}
                        >
                            <AntDesign name="pause-circle" size={12} color="#e74c3c" />
                            <Text style={[styles.badgeText, { color: '#e74c3c' }]} numberOfLines={1}>
                                สิ้นสุด: {formattedEndDate}
                            </Text>
                            <TouchableOpacity
                                onPress={() => { setDateModalType('end'); handleRemoveDate(); }}
                                hitSlop={styles.hitSlop}
                            >
                                <AntDesign name="close" size={12} color="#e74c3c" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}

                    {/* ── Title Section ────────────────────────────────────────── */}
                    <View style={styles.titleSection}>
                        <TouchableOpacity
                            onPress={() => setShowColorPicker(v => !v)}
                            style={styles.colorSyncBtn}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.colorDot,
                                    {
                                        backgroundColor:
                                            formData.color === '#ffffff' && isDark
                                                ? '#262626'
                                                : (formData.color ?? '#ffffff'),
                                        borderColor: colors.border,
                                    },
                                ]}
                            />
                        </TouchableOpacity>

                        <TextInput
                            value={formData.title}
                            onChangeText={text => onUpdateField('title', text)}
                            placeholder="ชื่อบันทึก..."
                            placeholderTextColor={placeholderColor}
                            style={[
                                styles.titleInput,
                                {
                                    color: colors.textPrimary,
                                    borderBottomColor: colors.border,
                                    flex: 1,
                                },
                            ]}
                        />
                    </View>

                    {/* ── Color picker ─────────────────────────────────────────── */}
                    {showColorPicker && (
                        <View style={[styles.colorPickerRow, { backgroundColor: colors.surface }]}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={styles.colorPickerContent}
                            >
                                {NOTE_COLORS.map(color => {
                                    const isSelected = formData.color === color;
                                    const bg = color === '#ffffff' && isDark ? '#262626' : color;
                                    return (
                                        <TouchableOpacity
                                            key={color}
                                            activeOpacity={0.75}
                                            onPress={() => {
                                                onUpdateField('color', color);
                                                setShowColorPicker(false);
                                            }}
                                            style={[
                                                styles.colorSwatch,
                                                {
                                                    backgroundColor: bg,
                                                    borderWidth: isSelected ? 3 : 1,
                                                    borderColor: isSelected
                                                        ? colors.primary
                                                        : color === '#ffffff'
                                                            ? colors.border
                                                            : 'transparent',
                                                    elevation: isSelected ? 4 : 1,
                                                },
                                            ]}
                                        >
                                            {isSelected && (
                                                <AntDesign
                                                    name="check"
                                                    size={18}
                                                    color={
                                                        color === '#ffffff' && isDark
                                                            ? '#fff'
                                                            : color === '#ffffff'
                                                                ? colors.primary
                                                                : '#fff'
                                                    }
                                                />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}

                    {/* ── Rich Editor ──────────────────────────────────────────── */}
                    {/*
                        scrollEnabled={false}  → no WebView scroll; height grows instead
                        onHeightChange         → drives editorHeight state
                        outer ScrollView       → the only scroll in this screen
                    */}
                    <View style={styles.editorWrapper}>
                        <RichEditor
                            ref={richTextRef}
                            useContainer={false}
                            initialContentHTML={formData.content}
                            onChange={handleChangeText}
                            onCursorPosition={handleCursorPosition}
                            onHeightChange={handleEditorHeightChange}
                            placeholder="เริ่มเขียนบันทึก..."
                            style={{ height: editorHeight }}
                            scrollEnabled={false}
                            initialHeight={windowHeight - HEADER_APPROX_HEIGHT}
                            editorStyle={{
                                backgroundColor: editorBgColor,
                                color: editorTextColor,
                                placeholderColor,
                                contentCSSText: `
                                    line-height: 1.65;
                                    font-family: sans-serif;
                                    padding: 12px 14px 60px;
                                    img {
                                        display: block;
                                        width: 100%;
                                        max-width: 100%;
                                        height: auto;
                                        margin: 10px 0;
                                        border-radius: 8px;
                                    }
                                    p, div { min-height: 1em; }
                                    hr { border: none; border-top: 1px solid ${colors.border}; }
                                    html, body {
                                        overflow: hidden;
                                        background-color: transparent;
                                        height: 100%;
                                        -webkit-overflow-scrolling: auto;
                                    }
                                `,
                            }}
                            editorInitializedCallback={() => {
                                setTimeout(() => richTextRef.current?.focusContentEditor(), 200);
                            }}
                        />
                    </View>
                </ScrollView>

                {/* ── Toolbar — visible only when keyboard is open ─────────────── */}
                {isKeyboardVisible && (
                    <View style={[styles.toolbar, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
                        <RichToolbar
                            editor={richTextRef}
                            actions={[
                                actions.setBold,
                                actions.setItalic,
                                actions.setUnderline,
                                actions.setStrikethrough,
                                actions.heading1,
                                actions.heading2,
                                actions.insertBulletsList,
                                actions.insertOrderedList,
                                actions.blockquote,
                                actions.alignLeft,
                                actions.alignCenter,
                                actions.alignRight,
                                actions.insertLink,
                                actions.insertImage,
                                actions.line,
                            ]}
                            style={{ backgroundColor: colors.surface }}
                            iconTint={colors.textSecondary}
                            selectedIconTint={colors.primary}
                            iconSize={20}
                            unselectedButtonStyle={{ backgroundColor: 'transparent' }}
                            selectedButtonStyle={{ backgroundColor: 'transparent' }}
                            onInsertLink={handleOpenLinkModal}
                            onPressAddImage={() => setShowImagePickerModal(true)}
                        />
                    </View>
                )}
            </KeyboardAvoidingView>

            {/* ═══════════════════════════════════════════════════════════════════
                Modals
            ════════════════════════════════════════════════════════════════════ */}

            {/* ── Reminder modal ────────────────────────────────────────────── */}
            <Modal visible={showReminderModal} transparent animationType="slide" onRequestClose={() => setShowReminderModal(false)}>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowReminderModal(false)}>
                    <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: colors.surface }]}>
                        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
                        <View style={styles.sheetHeader}>
                            <TouchableOpacity onPress={() => setShowReminderModal(false)} style={styles.sheetSideBtn}>
                                <Text style={[styles.sheetCancel, { color: colors.textSecondary }]}>ยกเลิก</Text>
                            </TouchableOpacity>
                            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>ตั้งเวลาแจ้งเตือน</Text>
                            <TouchableOpacity onPress={handleConfirmReminder} style={styles.sheetSideBtn} disabled={isNotificationPast}>
                                <Text style={[styles.sheetDone, { color: isNotificationPast ? colors.textDisabled : '#e67e22' }]}>บันทึก</Text>
                            </TouchableOpacity>
                        </View>

                        <SectionLabel label="ตั้งค่าด่วน" color={colors.textSecondary} />
                        <ChipScroll>
                            {QUICK_REMINDERS.map(p => (
                                <Chip
                                    key={p.minutes}
                                    label={p.label}
                                    color="#e67e22"
                                    onPress={() => handleQuickReminder(p.minutes)}
                                />
                            ))}
                        </ChipScroll>

                        <SectionLabel label="กำหนดเอง" color={colors.textSecondary} topSpacing />
                        <DateTimePicker
                            date={tempReminderDate}
                            colors={colors}
                            isDark={isDark}
                            onAdjustDate={adjustDate}
                            onAdjustHour={adjustHour}
                            onAdjustMinute={adjustMinute}
                        />

                        <SectionLabel label="แจ้งเตือนล่วงหน้า" color={colors.textSecondary} topSpacing />
                        <ChipScroll>
                            {REMIND_BEFORE_OPTIONS.map(p => (
                                <Chip
                                    key={p.minutes}
                                    label={p.label}
                                    color="#e67e22"
                                    selected={remindBefore === p.minutes}
                                    onPress={() => handleSelectRemindBefore(p.minutes)}
                                />
                            ))}
                        </ChipScroll>

                        {remindBefore > 0 && !isNotificationPast && (
                            <Text style={[styles.feedbackText, { color: colors.primary }]}>
                                ⏰ ดังกริ่งจริงตอน: {dayjs(finalNotificationTime).format('DD MMM HH:mm')}
                            </Text>
                        )}
                        {isNotificationPast && (
                            <Text style={[styles.feedbackText, { color: '#e74c3c' }]}>
                                ⚠️ เวลาแจ้งเตือนผ่านไปแล้ว กรุณาเลื่อนเวลาใหม่
                            </Text>
                        )}

                        <SectionLabel label="เกิดซ้ำ" color={colors.textSecondary} topSpacing />
                        <ChipScroll>
                            {RECURRENCE_OPTIONS.map(p => (
                                <Chip
                                    key={p.value}
                                    label={p.label}
                                    color={colors.primary}
                                    selected={tempRecurrence === p.value}
                                    onPress={() => setTempRecurrence(p.value)}
                                />
                            ))}
                        </ChipScroll>

                        {formData.reminderDate && (
                            <View style={{ marginTop: 20 }}>
                                <DestructiveButton label="ลบการแจ้งเตือน" onPress={handleRemoveReminder} />
                            </View>
                        )}
                        <View style={{ height: 32 }} />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* ── Location modal ────────────────────────────────────────────── */}
            <Modal visible={showLocationModal} transparent animationType="slide" onRequestClose={() => setShowLocationModal(false)}>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowLocationModal(false)}>
                    <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: colors.surface }]}>
                        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
                        <View style={styles.sheetHeader}>
                            <TouchableOpacity onPress={() => setShowLocationModal(false)} style={styles.sheetSideBtn}>
                                <Text style={[styles.sheetCancel, { color: colors.textSecondary }]}>ยกเลิก</Text>
                            </TouchableOpacity>
                            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>สถานที่</Text>
                            <TouchableOpacity onPress={handleConfirmLocation} style={styles.sheetSideBtn}>
                                <Text style={[styles.sheetDone, { color: colors.primary }]}>บันทึก</Text>
                            </TouchableOpacity>
                        </View>

                        <SectionLabel label="ชื่อสถานที่" color={colors.textSecondary} />
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? colors.background : '#f6f6f6', color: colors.textPrimary, borderColor: colors.border }]}
                            placeholder="เช่น บ้าน, ออฟฟิศ, Central World..."
                            placeholderTextColor={placeholderColor}
                            value={tempLocationName}
                            onChangeText={setTempLocationName}
                            autoFocus
                        />

                        <SectionLabel label="ลิงก์ GPS (ไม่บังคับ)" color={colors.textSecondary} topSpacing />
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? colors.background : '#f6f6f6', color: colors.textPrimary, borderColor: colors.border }]}
                            placeholder="วาง Google Maps link ที่นี่..."
                            placeholderTextColor={placeholderColor}
                            value={tempLocationLink}
                            onChangeText={setTempLocationLink}
                            keyboardType="url"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        {(formData.locationName || formData.locationLink) && (
                            <View style={{ marginTop: 24 }}>
                                <DestructiveButton label="ลบสถานที่" onPress={handleRemoveLocation} />
                            </View>
                        )}
                        <View style={{ height: 32 }} />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* ── Date / time modal ─────────────────────────────────────────── */}
            <Modal visible={showDateModal} transparent animationType="slide" onRequestClose={() => setShowDateModal(false)}>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowDateModal(false)}>
                    <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: colors.surface }]}>
                        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
                        <View style={styles.sheetHeader}>
                            <TouchableOpacity onPress={() => setShowDateModal(false)} style={styles.sheetSideBtn}>
                                <Text style={[styles.sheetCancel, { color: colors.textSecondary }]}>ยกเลิก</Text>
                            </TouchableOpacity>
                            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                                {dateModalType === 'start' ? 'เวลาเริ่มต้น' : 'เวลาสิ้นสุด'}
                            </Text>
                            <TouchableOpacity onPress={handleConfirmDate} style={styles.sheetSideBtn}>
                                <Text style={[styles.sheetDone, { color: colors.primary }]}>บันทึก</Text>
                            </TouchableOpacity>
                        </View>

                        <DateTimePicker
                            date={tempDate}
                            colors={colors}
                            isDark={isDark}
                            onAdjustDate={adjustGenericDate}
                            onAdjustHour={adjustGenericHour}
                            onAdjustMinute={adjustGenericMinute}
                        />

                        {/* Toggle start / end */}
                        <View style={styles.dateToggleRow}>
                            {(['start', 'end'] as DateModalType[]).map(type => {
                                const active = dateModalType === type;
                                const accent = type === 'start' ? '#2ecc71' : '#e74c3c';
                                const label = type === 'start' ? 'เวลาเริ่มต้น' : 'เวลาสิ้นสุด';
                                return (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => {
                                            setDateModalType(type);
                                            const d = type === 'start' ? formData.startDate : formData.endDate;
                                            setTempDate(d ? new Date(d) : new Date());
                                        }}
                                        style={[
                                            styles.dateToggleBtn,
                                            { borderColor: accent, backgroundColor: active ? accent : 'transparent' },
                                        ]}
                                    >
                                        <Text style={{ color: active ? '#fff' : accent, fontSize: 13 }}>{label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {((dateModalType === 'start' && formData.startDate) ||
                            (dateModalType === 'end' && formData.endDate)) && (
                                <View style={{ marginTop: 16 }}>
                                    <DestructiveButton label="ลบวันเวลานี้" onPress={handleRemoveDate} subtle />
                                </View>
                            )}
                        <View style={{ height: 32 }} />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* ── Image picker modal ────────────────────────────────────────── */}
            <Modal visible={showImagePickerModal} transparent animationType="slide" onRequestClose={() => setShowImagePickerModal(false)}>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowImagePickerModal(false)}>
                    <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: colors.surface }]}>
                        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
                        <View style={styles.sheetHeader}>
                            <TouchableOpacity onPress={() => setShowImagePickerModal(false)} style={styles.sheetSideBtn}>
                                <Text style={[styles.sheetCancel, { color: colors.textSecondary }]}>ยกเลิก</Text>
                            </TouchableOpacity>
                            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>แทรกรูปภาพ</Text>
                            <View style={styles.sheetSideBtn} />
                        </View>

                        {[
                            { icon: 'image' as const, label: 'เลือกจากแกลเลอรี่', onPress: handlePickImageFromGallery },
                            { icon: 'camera' as const, label: 'ถ่ายรูป', onPress: handleTakePhoto },
                        ].map(item => (
                            <TouchableOpacity
                                key={item.label}
                                onPress={item.onPress}
                                style={[styles.imageOption, { backgroundColor: isDark ? colors.background : '#f6f6f6' }]}
                            >
                                <Feather name={item.icon} size={20} color={colors.primary} />
                                <Text style={[styles.imageOptionText, { color: colors.textPrimary }]}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                        <View style={{ height: 32 }} />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* ── Unsaved changes modal ─────────────────────────────────────── */}
            <Modal visible={showUnsavedModal} transparent animationType="fade" onRequestClose={() => setShowUnsavedModal(false)}>
                <View style={[styles.overlay, { justifyContent: 'center', alignItems: 'center' }]}>
                    <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
                        <AntDesign name="exclamation-circle" size={32} color={colors.warning ?? '#f39c12'} style={{ marginBottom: 12 }} />
                        <Text style={[styles.dialogTitle, { color: colors.textPrimary }]}>มีการแก้ไขที่ยังไม่บันทึก</Text>
                        <Text style={[styles.dialogSubtitle, { color: colors.textSecondary }]}>
                            คุณต้องการบันทึกการเปลี่ยนแปลงก่อนออกไหม?
                        </Text>

                        <TouchableOpacity onPress={handleSaveAndExit} style={[styles.dialogBtnPrimary, { backgroundColor: colors.primary }]}>
                            <AntDesign name="save" size={15} color="#fff" />
                            <Text style={styles.dialogBtnPrimaryText}>บันทึกและออก</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleDiscardAndExit} style={[styles.dialogBtnOutline, { borderColor: colors.border }]}>
                            <Text style={[styles.dialogBtnOutlineText, { color: colors.textSecondary }]}>ออกโดยไม่บันทึก</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowUnsavedModal(false)} style={styles.dialogBtnGhost}>
                            <Text style={[styles.dialogBtnGhostText, { color: colors.primary }]}>อยู่ต่อ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── Link insert modal ─────────────────────────────────────────── */}
            <Modal visible={linkModalVisible} transparent animationType="fade" onRequestClose={() => setLinkModalVisible(false)}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <TouchableOpacity style={[styles.overlay, { justifyContent: 'flex-end' }]} activeOpacity={1} onPress={() => setLinkModalVisible(false)}>
                        <TouchableOpacity activeOpacity={1} style={[styles.linkModal, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.linkModalTitle, { color: colors.textPrimary }]}>แทรกลิงก์</Text>

                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ข้อความที่แสดง</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                                placeholder="เช่น Google"
                                placeholderTextColor={colors.textDisabled}
                                value={linkTitle}
                                onChangeText={setLinkTitle}
                                autoFocus
                            />

                            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>URL</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                                placeholder="https://example.com"
                                placeholderTextColor={colors.textDisabled}
                                value={linkUrl}
                                onChangeText={setLinkUrl}
                                keyboardType="url"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />

                            <View style={styles.linkModalButtons}>
                                <TouchableOpacity
                                    onPress={() => setLinkModalVisible(false)}
                                    style={[styles.linkBtnCancel, { backgroundColor: isDark ? colors.background : '#f0f0f0' }]}
                                >
                                    <Text style={[{ color: colors.textSecondary, fontWeight: '600' }]}>ยกเลิก</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleInsertLink}
                                    disabled={!linkUrl.trim()}
                                    style={[styles.linkBtnInsert, { backgroundColor: colors.primary, opacity: linkUrl.trim() ? 1 : 0.4 }]}
                                >
                                    <Text style={{ color: '#fff', fontWeight: '700' }}>แทรก</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ height: 8 }} />
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable sub-components (defined outside to avoid re-renders)
// ─────────────────────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ label: string; color: string; topSpacing?: boolean }> = ({ label, color, topSpacing }) => (
    <Text style={[styles.sectionLabel, { color, marginTop: topSpacing ? 20 : 0 }]}>{label}</Text>
);

const ChipScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <View style={styles.chipScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScrollContent}>
            {children}
        </ScrollView>
    </View>
);

const Chip: React.FC<{ label: string; color: string; selected?: boolean; onPress: () => void }> = ({
    label, color, selected, onPress,
}) => (
    <TouchableOpacity
        onPress={onPress}
        style={[
            styles.chip,
            { backgroundColor: selected ? color : `${color}1A` },
        ]}
    >
        <Text style={[styles.chipText, { color: selected ? '#fff' : color }]}>{label}</Text>
    </TouchableOpacity>
);

const DateTimePicker: React.FC<{
    date: Date;
    colors: ReturnType<typeof import('../ThemeProvider').useThemeColors>;
    isDark: boolean;
    onAdjustDate: (d: number) => void;
    onAdjustHour: (d: number) => void;
    onAdjustMinute: (d: number) => void;
}> = ({ date, colors, isDark, onAdjustDate, onAdjustHour, onAdjustMinute }) => (
    <View style={[styles.pickerBox, { backgroundColor: isDark ? colors.background : '#f6f6f6', borderColor: colors.border }]}>
        {/* Date row */}
        <View style={styles.pickerRow}>
            <AntDesign name="calendar" size={16} color={colors.primary} />
            <TouchableOpacity onPress={() => onAdjustDate(-1)} style={styles.pickerArrow}>
                <AntDesign name="left" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.pickerDateText, { color: colors.textPrimary }]}>
                {dayjs(date).format('DD MMM YYYY')}
            </Text>
            <TouchableOpacity onPress={() => onAdjustDate(1)} style={styles.pickerArrow}>
                <AntDesign name="right" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>
        <View style={[styles.pickerDivider, { backgroundColor: colors.border }]} />
        {/* Time row */}
        <View style={styles.pickerRow}>
            <AntDesign name="clock-circle" size={16} color={colors.primary} />
            <View style={styles.timeSpinner}>
                <TouchableOpacity onPress={() => onAdjustHour(1)}><AntDesign name="up" size={15} color={colors.textSecondary} /></TouchableOpacity>
                <Text style={[styles.timeDigit, { color: colors.textPrimary }]}>{dayjs(date).format('HH')}</Text>
                <TouchableOpacity onPress={() => onAdjustHour(-1)}><AntDesign name="down" size={15} color={colors.textSecondary} /></TouchableOpacity>
            </View>
            <Text style={[styles.timeSep, { color: colors.textPrimary }]}>:</Text>
            <View style={styles.timeSpinner}>
                <TouchableOpacity onPress={() => onAdjustMinute(1)}><AntDesign name="up" size={15} color={colors.textSecondary} /></TouchableOpacity>
                <Text style={[styles.timeDigit, { color: colors.textPrimary }]}>{dayjs(date).format('mm')}</Text>
                <TouchableOpacity onPress={() => onAdjustMinute(-1)}><AntDesign name="down" size={15} color={colors.textSecondary} /></TouchableOpacity>
            </View>
        </View>
    </View>
);

const DestructiveButton: React.FC<{ label: string; onPress: () => void; subtle?: boolean }> = ({ label, onPress, subtle }) => (
    <TouchableOpacity
        onPress={onPress}
        style={[
            styles.destructiveBtn,
            subtle
                ? { borderColor: 'rgba(149,165,166,0.3)', backgroundColor: 'rgba(149,165,166,0.06)' }
                : { borderColor: 'rgba(231,76,60,0.25)', backgroundColor: 'rgba(231,76,60,0.06)' },
        ]}
    >
        <AntDesign name="delete" size={13} color={subtle ? '#95a5a6' : '#e74c3c'} />
        <Text style={[styles.destructiveBtnText, { color: subtle ? '#95a5a6' : '#e74c3c' }]}>{label}</Text>
    </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    // ── Scroll ───────────────────────────────────────────────────────────────
    scrollContent: {
        flexGrow: 1,
    },

    // ── Badges ───────────────────────────────────────────────────────────────
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginHorizontal: 16,
        marginTop: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 5,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        flexShrink: 1,
    },
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 } as any,

    // ── Title ─────────────────────────────────────────────────────────────────
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    titleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginVertical: 4,
    },
    colorSyncBtn: {
        padding: 4,
        marginRight: 4,
    },
    colorDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1,
    },
    titleInput: {
        flex: 1,
        paddingHorizontal: 4,
        paddingVertical: 8,
        fontSize: 17,
        fontWeight: '700',
        borderBottomWidth: 1,
    },

    // ── Color picker ──────────────────────────────────────────────────────────
    colorPickerRow: {
        paddingVertical: 10,
    },
    colorPickerContent: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 4,
        gap: 10,
    },
    colorSwatch: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },

    // ── Editor ────────────────────────────────────────────────────────────────
    editorWrapper: {
        marginHorizontal: 12,
        marginTop: 4,
        marginBottom: 80,
        borderRadius: 20,
        overflow: 'hidden',
    },

    // ── Toolbar ───────────────────────────────────────────────────────────────
    toolbar: {
        borderTopWidth: StyleSheet.hairlineWidth,
    },

    // ── Sheet (bottom modal) ──────────────────────────────────────────────────
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 16,
    },
    sheetHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 14,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
        height: 38,
    },
    sheetSideBtn: {
        minWidth: 56,
        alignItems: 'center',
    },
    sheetTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 17,
        fontWeight: '700',
    },
    sheetCancel: {
        fontSize: 15,
    },
    sheetDone: {
        fontSize: 15,
        fontWeight: '700',
    },

    // ── Section label ─────────────────────────────────────────────────────────
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.3,
        marginBottom: 8,
        textTransform: 'uppercase',
    },

    // ── Chips ─────────────────────────────────────────────────────────────────
    chipScrollWrapper: {
        marginHorizontal: -24,
        marginBottom: 4,
    },
    chipScrollContent: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 24,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // ── Date-time picker ──────────────────────────────────────────────────────
    pickerBox: {
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden',
        marginBottom: 4,
    },
    pickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    pickerArrow: { padding: 8 },
    pickerDateText: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
    },
    pickerDivider: { height: StyleSheet.hairlineWidth },
    timeSpinner: { alignItems: 'center', gap: 4 },
    timeDigit: { fontSize: 22, fontWeight: '700', minWidth: 34, textAlign: 'center' },
    timeSep: { fontSize: 22, fontWeight: '700', marginHorizontal: 6 },

    // ── Feedback text ─────────────────────────────────────────────────────────
    feedbackText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 8,
    },

    // ── Date toggle ───────────────────────────────────────────────────────────
    dateToggleRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginTop: 20,
    },
    dateToggleBtn: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1,
    },

    // ── Destructive button ────────────────────────────────────────────────────
    destructiveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 11,
        borderRadius: 12,
        borderWidth: 1,
        gap: 6,
    },
    destructiveBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },

    // ── Image picker ──────────────────────────────────────────────────────────
    imageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
        gap: 12,
    },
    imageOptionText: {
        fontSize: 15,
        fontWeight: '500',
    },

    // ── Dialog (centered modal) ───────────────────────────────────────────────
    dialog: {
        borderRadius: 20,
        padding: 28,
        width: '86%',
        maxWidth: 360,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 12,
    },
    dialogTitle: {
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    dialogSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    dialogBtnPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 13,
        borderRadius: 12,
        gap: 8,
        marginBottom: 10,
    },
    dialogBtnPrimaryText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    dialogBtnOutline: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 6,
    },
    dialogBtnOutlineText: {
        fontSize: 15,
        fontWeight: '600',
    },
    dialogBtnGhost: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    dialogBtnGhostText: {
        fontSize: 14,
        fontWeight: '600',
    },

    // ── Link modal ────────────────────────────────────────────────────────────
    linkModal: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    linkModalTitle: {
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 20,
    },
    linkModalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 20,
    },
    linkBtnCancel: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
    },
    linkBtnInsert: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 10,
    },

    // ── Shared input ──────────────────────────────────────────────────────────
    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 15,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
        letterSpacing: 0.2,
        textTransform: 'uppercase',
    },
});

export default NoteEditor;