/**
 * FolderCard Component
 * Card displaying a folder with note count
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
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
    return (
        <TouchableOpacity
            style={[
                styles.card,
                isSelected && styles.cardSelected,
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
                <Text style={styles.name} numberOfLines={1}>
                    {folder.name}
                </Text>
                <Text style={styles.noteCount}>
                    {folder.noteCount} {folder.noteCount === 1 ? 'note' : 'notes'}
                </Text>
            </View>

            {/* Actions (shown on long press or swipe in real implementation) */}
            {(onEdit || onDelete) && (
                <View style={styles.actions}>
                    {onEdit && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => onEdit(folder)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Feather name="edit-2" size={16} color="#3498db" />
                        </TouchableOpacity>
                    )}
                    {onDelete && (
                        <TouchableOpacity
                            style={styles.actionButton}
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
        backgroundColor: '#fff',
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
        backgroundColor: '#f0fff4',
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
        color: '#2c3e50',
        marginBottom: 2
    },
    noteCount: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
        color: '#999'
    },
    actions: {
        flexDirection: 'row',
        gap: 8
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f8f9fa'
    }
});

export default FolderCard;
