import React, { useState, useCallback } from 'react';
import {
    View,
    TextInput,
    FlatList,
    Text,
    TouchableOpacity,
    StatusBar,
    Animated,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '@/components/ThemeProvider';
import { useGroups } from '@/hooks/useGroups';
import { DEFAULT_GROUP_FORM, GROUP_ICONS } from '@/types/group';
import type { Group, GroupFormData } from '@/types/group';

const GroupManagementScreen = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Use the new hook
    const {
        groups,
        isLoading,
        isCreating,
        refetch,
        createGroup,
        confirmDeleteGroup
    } = useGroups();

    // Form state
    const [formData, setFormData] = useState<GroupFormData>(DEFAULT_GROUP_FORM);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [animatedHeight] = useState(new Animated.Value(0));

    // Handle form submission
    const handleCreateGroup = useCallback(() => {
        if (!formData.name.trim()) return;

        createGroup(formData, {
            onSuccess: () => {
                resetCreateForm();
            }
        });
    }, [formData, createGroup]);

    // Reset form
    const resetCreateForm = useCallback(() => {
        setFormData(DEFAULT_GROUP_FORM);
        setShowCreateForm(false);
        Animated.timing(animatedHeight, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false
        }).start();
        Keyboard.dismiss();
    }, [animatedHeight]);

    // Open create form
    const openCreateForm = useCallback(() => {
        setShowCreateForm(true);
        Animated.timing(animatedHeight, {
            toValue: 400,
            duration: 300,
            useNativeDriver: false
        }).start();
    }, [animatedHeight]);

    // Render group item
    const renderGroupItem = useCallback(({ item }: { item: Group }) => (
        <TouchableOpacity
            onLongPress={() => confirmDeleteGroup(item)}
            delayLongPress={500}
            className={`flex-row items-center p-4 mb-3 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-white'
                }`}
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0.3 : 0.1,
                shadowRadius: 3,
                elevation: 2
            }}
        >
            <View
                className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-blue-600' : 'bg-blue-500'
                    }`}
            >
                <Icon
                    name={item.icon || 'folder'}
                    size={18}
                    color="white"
                />
            </View>
            <View className="flex-1">
                <Text
                    className={`font-kanit-bold text-base ${isDark ? 'text-neutral-200' : 'text-neutral-800'
                        }`}
                >
                    {item.name}
                </Text>
                {item.description && (
                    <Text
                        className={`font-kanit-regular text-sm mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'
                            }`}
                        numberOfLines={1}
                    >
                        {item.description}
                    </Text>
                )}
            </View>
            <View className="items-end">
                <View className={`px-2 py-1 rounded-full ${isDark ? 'bg-neutral-700' : 'bg-neutral-100'}`}>
                    <Text className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        {item.memberCount} สมาชิก
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    ), [isDark, confirmDeleteGroup]);

    // Empty state
    const renderEmptyState = useCallback(() => (
        <View className="items-center justify-center py-20">
            <Icon
                name="users"
                size={48}
                color={isDark ? '#525252' : '#d1d5db'}
            />
            <Text
                className={`text-base mt-4 ${isDark ? 'text-neutral-500' : 'text-gray-400'
                    }`}
            >
                ยังไม่มีกลุ่ม
            </Text>
            <Text
                className={`text-sm mt-1 ${isDark ? 'text-neutral-600' : 'text-gray-300'
                    }`}
            >
                กด + เพื่อสร้างกลุ่มใหม่
            </Text>
        </View>
    ), [isDark]);

    return (
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={isDark ? '#171717' : '#fafafa'}
            />

            <View className="flex-1">
                {/* Header */}
                <View className={`px-4 py-3 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                    <Text
                        className={`text-xl font-kanit-bold ${isDark ? 'text-blue-400' : 'text-blue-500'
                            }`}
                    >
                        👥 Groups
                    </Text>
                </View>

                {/* Groups List */}
                <View className="flex-1 p-4">
                    {isLoading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color={isDark ? '#60a5fa' : '#3b82f6'} />
                            <Text className={`mt-3 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                กำลังโหลด...
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={groups}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderGroupItem}
                            ListEmptyComponent={renderEmptyState}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={isLoading}
                                    onRefresh={refetch}
                                    tintColor={isDark ? '#60a5fa' : '#3b82f6'}
                                />
                            }
                        />
                    )}
                </View>

                {/* FAB */}
                <TouchableOpacity
                    className="absolute right-6 bottom-7 w-14 h-14 rounded-full bg-blue-500 justify-center items-center"
                    onPress={openCreateForm}
                    activeOpacity={0.8}
                    style={{
                        shadowColor: '#3b82f6',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.4,
                        shadowRadius: 6,
                        elevation: 8
                    }}
                >
                    <Icon name="plus" size={20} color="white" />
                </TouchableOpacity>
            </View>

            {/* Create Group Modal */}
            {showCreateForm && (
                <TouchableWithoutFeedback onPress={resetCreateForm}>
                    <View className="absolute inset-0 bg-black/40 justify-end">
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
                        >
                            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                                <Animated.View
                                    style={{
                                        height: animatedHeight,
                                        backgroundColor: isDark ? '#262626' : '#fff',
                                        borderTopLeftRadius: 24,
                                        borderTopRightRadius: 24,
                                        paddingHorizontal: 24,
                                        paddingTop: 24
                                    }}
                                >
                                    {/* Handle bar */}
                                    <View className="items-center mb-4">
                                        <View className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-neutral-600' : 'bg-neutral-300'}`} />
                                    </View>

                                    {/* Title */}
                                    <Text
                                        className={`font-kanit-bold text-lg mb-4 ${isDark ? 'text-neutral-200' : 'text-neutral-800'
                                            }`}
                                    >
                                        สร้างกลุ่มใหม่
                                    </Text>

                                    {/* Icon selector */}
                                    <Text
                                        className={`font-kanit-regular mb-2 text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'
                                            }`}
                                    >
                                        เลือกไอคอน
                                    </Text>
                                    <View className="flex-row mb-4 flex-wrap">
                                        {GROUP_ICONS.map((icon) => (
                                            <TouchableOpacity
                                                key={icon}
                                                onPress={() => setFormData(prev => ({ ...prev, icon }))}
                                                className={`p-2.5 mr-2 mb-2 rounded-xl ${formData.icon === icon
                                                    ? 'bg-blue-500'
                                                    : isDark
                                                        ? 'bg-neutral-700'
                                                        : 'bg-gray-100'
                                                    }`}
                                            >
                                                <Icon
                                                    name={icon}
                                                    size={20}
                                                    color={formData.icon === icon ? 'white' : isDark ? '#9ca3af' : '#6b7280'}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Group name input */}
                                    <TextInput
                                        className={`rounded-xl px-4 py-3 mb-3 font-kanit-regular ${isDark
                                            ? 'bg-neutral-700 text-neutral-200'
                                            : 'bg-gray-100 text-neutral-800'
                                            }`}
                                        placeholder="ชื่อกลุ่ม"
                                        placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                                        value={formData.name}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                                    />

                                    {/* Description input */}
                                    <TextInput
                                        className={`rounded-xl px-4 py-3 mb-4 font-kanit-regular ${isDark
                                            ? 'bg-neutral-700 text-neutral-200'
                                            : 'bg-gray-100 text-neutral-800'
                                            }`}
                                        placeholder="คำอธิบาย (ไม่บังคับ)"
                                        placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                                        value={formData.description}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                                    />

                                    {/* Buttons */}
                                    <TouchableOpacity
                                        onPress={handleCreateGroup}
                                        disabled={isCreating || !formData.name.trim()}
                                        className={`py-3.5 rounded-xl mb-3 ${formData.name.trim() ? 'bg-blue-500' : 'bg-blue-500/50'
                                            }`}
                                    >
                                        {isCreating ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text className="text-white text-center font-kanit-bold text-base">
                                                สร้างกลุ่ม
                                            </Text>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={resetCreateForm}
                                        className={`py-3 rounded-xl ${isDark ? 'bg-neutral-600' : 'bg-gray-200'
                                            }`}
                                    >
                                        <Text className={`text-center font-kanit-bold ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            ยกเลิก
                                        </Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            </TouchableWithoutFeedback>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            )}
        </SafeAreaView>
    );
};

export default GroupManagementScreen;
