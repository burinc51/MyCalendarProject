import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type CustomBottomSheetModalRef = {
    present: () => void;
    dismiss: () => void;
};

type Props = {
    children: React.ReactNode;
    snapPoints?: (string | number)[];
};

const CustomBottomSheetModal = forwardRef<CustomBottomSheetModalRef, Props>(({ children, snapPoints = ['50%'] }, ref) => {
    const modalRef = useRef<BottomSheetModal>(null);
    const insets = useSafeAreaInsets();
    const memoSnapPoints = useMemo(() => snapPoints, [snapPoints]);

    useImperativeHandle(ref, () => ({
        present: () => modalRef.current?.present(),
        dismiss: () => modalRef.current?.dismiss(),
    }));

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
            />
        ),
        [],
    );

    return (
        <BottomSheetModal
            ref={modalRef}
            index={0}
            snapPoints={memoSnapPoints}
            enablePanDownToClose
            topInset={insets.top}
            handleComponent={() => (
                <View style={styles.handle}>
                    <View style={styles.handleIndicator} />
                </View>
            )}
            backgroundStyle={{ backgroundColor: '#fff' }}
            backdropComponent={renderBackdrop}
        >
            <BottomSheetView style={styles.contentContainer}>{children}</BottomSheetView>
        </BottomSheetModal>
    );
});

const styles = StyleSheet.create({
    handle: {
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    handleIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 3,
    },
    contentContainer: {
        flex: 1,
    },
});

export default CustomBottomSheetModal;
