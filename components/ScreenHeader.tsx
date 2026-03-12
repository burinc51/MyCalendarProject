import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/components/ThemeProvider';
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions';

export interface ScreenHeaderAction {
    /** Feather icon name */
    icon: React.ComponentProps<typeof Feather>['name'];
    onPress: () => void;
    /** Override the auto bg color */
    backgroundColor?: string;
    /** Icon / tint color override */
    color?: string;
    loading?: boolean;
    disabled?: boolean;
    accessibilityLabel?: string;
}

interface ScreenHeaderProps {
    title: string;
    /** Show back arrow that calls router.back() */
    showBack?: boolean;
    /** Override the back handler */
    onBack?: () => void;
    /** Right-side action buttons (max ~3 looks good) */
    actions?: ScreenHeaderAction[];
    /** Override background color */
    backgroundColor?: string;
    /** Override title color */
    titleColor?: string;
    /** Override border color */
    borderColor?: string;
}

export default function ScreenHeader({
    title,
    showBack = false,
    onBack,
    actions,
    backgroundColor,
    titleColor,
    borderColor,
}: ScreenHeaderProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const { headerHeight, horizontalPadding, titleFontSize, isSmallPhone, isTablet } =
        useResponsiveDimensions();

    const resolvedBg = backgroundColor ?? (isDark ? '#141414' : '#ffffff');
    const resolvedTitle = titleColor ?? (isDark ? '#f5f5f5' : '#1a1a1a');
    const resolvedBorder = borderColor ?? '#424141a9';
    const btnBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const resolvedFontSize = isSmallPhone ? 18 : isTablet ? 24 : titleFontSize;

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <View
            style={[
                styles.header,
                {
                    height: headerHeight,
                    paddingHorizontal: horizontalPadding,
                    backgroundColor: resolvedBg,
                    borderBottomColor: resolvedBorder,
                },
            ]}
        >
            {/* Left — back button */}
            {showBack ? (
                <TouchableOpacity
                    onPress={handleBack}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Go back"
                >
                    <View style={[styles.iconBtn, { backgroundColor: btnBg }]}>
                        <Feather name="arrow-left" size={18} color={resolvedTitle} />
                    </View>
                </TouchableOpacity>
            ) : (
                /* Placeholder to keep title centred when no back button */
                <View style={styles.iconBtn} />
            )}

            {/* Title */}
            <Text
                style={[styles.title, { color: resolvedTitle, fontSize: resolvedFontSize }]}
                numberOfLines={1}
            >
                {title}
            </Text>

            {/* Right — action buttons */}
            <View style={styles.actionsRow}>
                {actions && actions.length > 0 ? (
                    actions.map((action, i) => (
                        <TouchableOpacity
                            key={i}
                            onPress={action.onPress}
                            disabled={action.disabled || action.loading}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityLabel={action.accessibilityLabel}
                        >
                            <View
                                style={[
                                    styles.iconBtn,
                                    {
                                        backgroundColor:
                                            action.backgroundColor ?? btnBg,
                                    },
                                ]}
                            >
                                {action.loading ? (
                                    <ActivityIndicator
                                        size="small"
                                        color={action.color ?? resolvedTitle}
                                    />
                                ) : (
                                    <Feather
                                        name={action.icon}
                                        size={16}
                                        color={action.color ?? resolvedTitle}
                                    />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    /* Placeholder so title stays centred */
                    <View style={styles.iconBtn} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 0.25,
        gap: 10,
    },
    title: {
        flex: 1,
        fontFamily: 'Kanit-Bold',
        letterSpacing: 0.3,
        textAlign: 'center',
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 8,
    },
});

