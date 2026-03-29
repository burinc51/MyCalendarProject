import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Modal,
    Pressable,
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

export interface ScreenHeaderMenuItem {
    label: string;
    onPress: () => void;
    destructive?: boolean;
    disabled?: boolean;
}

interface ScreenHeaderActionMenu {
    items: ScreenHeaderMenuItem[];
    iconColor?: string;
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
    /** Optional three-dot overflow menu */
    actionMenu?: ScreenHeaderActionMenu;
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
    actionMenu,
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
    const [menuVisible, setMenuVisible] = useState(false);
    const menuItems = useMemo(() => actionMenu?.items ?? [], [actionMenu?.items]);

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    const handleMenuPress = () => {
        if (!menuItems.length) return;
        setMenuVisible(true);
    };

    const closeMenu = () => setMenuVisible(false);

    const handleMenuItemPress = (item: ScreenHeaderMenuItem) => {
        closeMenu();
        item.onPress();
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
                ) : null}

                {actionMenu && menuItems.length > 0 ? (
                    <TouchableOpacity
                        onPress={handleMenuPress}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel={actionMenu.accessibilityLabel ?? 'เปิดเมนูการทำงาน'}
                    >
                        <View style={[styles.iconBtn, { backgroundColor: btnBg }]}>
                            <Feather
                                name="more-vertical"
                                size={18}
                                color={actionMenu.iconColor ?? resolvedTitle}
                            />
                        </View>
                    </TouchableOpacity>
                ) : null}

                {(!actions || actions.length === 0) && (!actionMenu || menuItems.length === 0) ? (
                    /* Placeholder so title stays centred */
                    <View style={styles.iconBtn} />
                ) : null}
            </View>

            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={closeMenu}
            >
                <Pressable style={styles.menuBackdrop} onPress={closeMenu}>
                    <Pressable
                        style={[
                            styles.menuCard,
                            {
                                marginTop: headerHeight + 10,
                                marginRight: horizontalPadding,
                                backgroundColor: isDark ? '#2b2d31' : '#ffffff',
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                            },
                        ]}
                    >
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={`${item.label}-${index}`}
                                onPress={() => handleMenuItemPress(item)}
                                disabled={item.disabled}
                                style={[
                                    styles.menuItem,
                                    index < menuItems.length - 1 && styles.menuItemDivider,
                                    { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.menuText,
                                        {
                                            color: item.destructive
                                                ? '#ef4444'
                                                : (isDark ? '#f3f4f6' : '#171717'),
                                            opacity: item.disabled ? 0.45 : 1,
                                        },
                                    ]}
                                >
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </Pressable>
                </Pressable>
            </Modal>
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
        alignItems: 'center',
    },
    menuBackdrop: {
        flex: 1,
        alignItems: 'flex-end',
    },
    menuCard: {
        width: 200,
        borderRadius: 14,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    menuItem: {
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    menuItemDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    menuText: {
        fontSize: 16,
        fontFamily: 'Kanit-Regular',
    },
});

