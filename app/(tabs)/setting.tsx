import { View, Text, Button } from 'react-native';
import { useRef } from 'react';
import CustomBottomSheetModal, { CustomBottomSheetModalRef } from '@/components/CustomBottomSheetModal';

export default function HomeScreen() {
    const sheetRef = useRef<CustomBottomSheetModalRef>(null);

    return (
        <View className="bg-gray-100 rounded-lg p-4 w-full h-full">
            <Text className="text-lg font-kanit-regular text-red-500">Welcome to Tailwind</Text>
            <Button
                title="Open Bottom Sheet"
                onPress={() => sheetRef.current?.present()}
            />
            <CustomBottomSheetModal
                ref={sheetRef}
                snapPoints={['100%']}
            >
                <View>
                    <Button
                        title="Close"
                        onPress={() => sheetRef.current?.dismiss()}
                    />
                </View>
            </CustomBottomSheetModal>
        </View>
    );
}
