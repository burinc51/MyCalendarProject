/**
 * FolderCard Component
 * Card displaying a folder with note count
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '@/components/ThemeProvider';
import type { Folder } from '@/types/note';

interface FolderCardProps {
    folder: Folder;
    isSelected: boolean;
    onPress: (folderId: number) => void;
    onLongPress?: (folder: Folder) => void;
    onEdit?: (folder: Folder) => void;
    onDelete?: (folderId: number) => void;
}

const FolderCard: React.FC<FolderCardProps> = ({
    folder,
    isSelected,
    onPress,
    onLongPress,
    onEdit,
    onDelete
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const colors = useMemo(() => ({
        cardBg: isDark ? '#262626' : '#fff',
        cardSelectedBg: isDark ? '#1a3a2a' : '#f0fff4',
        name: isDark ? '#e5e5e5' : '#2c3e50',
        noteCount: isDark ? '#a3a3a3' : '#999',
        actionBg: isDark ? '#404040' : '#f8f9fa',
    }), [isDark]);

    return (
        <TouchableOpacity
            style={[
                styles.card,
                { backgroundColor: colors.cardBg },
                isSelected && [styles.cardSelected, { backgroundColor: colors.cardSelectedBg }],
                { borderLeftColor: folder.color }
            ]}
            onPress={() => onPress(folder.id)}
            onLongPress={() => onLongPress?.(folder)}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <MaterialIcons
                    name="folder"
                    size={28}
                    color={folder.color}
                />
            </View>

            <View style={styles.content}>
                <Text style={[styles.name, { color: colors.name }]} numberOfLines={1}>
                    {folder.name}
                </Text>
                <Text style={[styles.noteCount, { color: colors.noteCount }]}>
                    {folder.noteCount} {folder.noteCount === 1 ? 'note' : 'notes'}
                </Text>
            </View>

            {/* Actions */}
            {(onEdit || onDelete) && (
                <View style={styles.actions}>
                    {onEdit && (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.actionBg }]}
                            onPress={() => onEdit(folder)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Feather name="edit-2" size={16} color="#3498db" />
                        </TouchableOpacity>
                    )}
                    {onDelete && (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.actionBg }]}
                            onPress={() => onDelete(folder.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Feather name="trash-2" size={16} color="#e74c3c" />
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2
    },
    cardSelected: {
        borderColor: '#2ecc71',
        borderWidth: 1
    },
    iconContainer: {
        marginRight: 12
    },
    content: {
        flex: 1
    },
    name: {
        fontFamily: 'Kanit-Bold',
        fontSize: 15,
        marginBottom: 2
    },
    noteCount: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 8
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
    }
});

export default FolderCard;

