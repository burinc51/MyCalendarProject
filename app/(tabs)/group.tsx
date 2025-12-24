import React, { useState, useEffect } from 'react';
import {
    View,
    TextInput,
    FlatList,
    Text,
    TouchableOpacity,
    StatusBar,
    Alert,
    Animated,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';

const PRIMARY = 'text-blue-500';

const GroupManagementScreen = () => {
    const [groupName, setGroupName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('folder');
    const [groups, setGroups] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [animatedHeight] = useState(new Animated.Value(0));

    const iconOptions = ['folder', 'star', 'heart', 'check', 'shopping-cart'];

    const createGroup = () => {
        if (!groupName.trim()) return;
        setGroups((prev) => [...prev, { name: groupName.trim(), icon: selectedIcon }]);
        resetCreateForm();
    };

    const resetCreateForm = () => {
        setGroupName('');
        setSelectedIcon('folder');
        setShowCreateForm(false);
        Animated.timing(animatedHeight, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false
        }).start();
        Keyboard.dismiss();
    };

    const renderGroupItem = ({ item }) => (
        <View className="flex-row items-center bg-white p-3 mb-2 rounded-lg">
            <Icon
                name={item.icon}
                size={20}
                color="gray"
                style={{ marginRight: 10 }}
            />
            <Text className="font-kanit-regular text-base">{item.name}</Text>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar
                barStyle="dark-content"
                backgroundColor="white"
            />

            <View className="flex-1">
                <Text className={`text-xl font-kanit-bold ${PRIMARY} self-center my-4`}>Group</Text>

                <View className="p-4">
                    <Text className="text-lg font-kanit-bold mb-2">Groups List</Text>
                    <FlatList
                        data={groups}
                        keyExtractor={(_, index) => index.toString()}
                        renderItem={renderGroupItem}
                        ListEmptyComponent={<Text className="text-gray-500 text-sm mt-2">No groups</Text>}
                    />
                </View>

                <TouchableOpacity
                    className="absolute right-6 bottom-7 w-12 h-12 rounded-full bg-blue-500 justify-center items-center"
                    onPress={() => {
                        setShowCreateForm(true);
                        Animated.timing(animatedHeight, {
                            toValue: 360,
                            duration: 300,
                            useNativeDriver: false
                        }).start();
                    }}
                    activeOpacity={0.8}
                >
                    <Text className="text-white text-3xl font-light -mt-1">＋</Text>
                </TouchableOpacity>
            </View>

            {/* Create Group Modal */}
            {showCreateForm && (
                <TouchableWithoutFeedback onPress={resetCreateForm}>
                    <View className="absolute inset-0 bg-black/30 justify-end">
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
                        >
                            <TouchableWithoutFeedback onPress={() => { }}>
                                <Animated.View
                                    style={{
                                        height: animatedHeight,
                                        backgroundColor: '#fff',
                                        borderTopLeftRadius: 20,
                                        borderTopRightRadius: 20,
                                        paddingHorizontal: 20,
                                        paddingTop: 20
                                    }}
                                >
                                    <Text className="font-kanit-semibold mb-2 text-base">Select Icon</Text>
                                    <View className="flex-row mb-4 flex-wrap">
                                        {iconOptions.map((icon) => (
                                            <TouchableOpacity
                                                key={icon}
                                                onPress={() => setSelectedIcon(icon)}
                                                className={`p-2 mr-2 mb-2 rounded-full ${selectedIcon === icon ? 'bg-blue-200' : 'bg-gray-100'}`}
                                            >
                                                <Icon
                                                    name={icon}
                                                    size={24}
                                                    color={selectedIcon === icon ? 'blue' : 'gray'}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <TextInput
                                        className="bg-gray-100 rounded-lg px-3 py-2 mb-4"
                                        placeholder="Group Name"
                                        value={groupName}
                                        onChangeText={setGroupName}
                                    />

                                    <TouchableOpacity
                                        onPress={createGroup}
                                        className="bg-blue-500 py-2 rounded-lg mb-3"
                                    >
                                        <Text className="text-white text-center font-kanit-bold">Create</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={resetCreateForm}
                                        className="bg-gray-400 py-2 rounded-lg mb-3"
                                    >
                                        <Text className="text-white text-center font-kanit-bold">Cancel</Text>
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
