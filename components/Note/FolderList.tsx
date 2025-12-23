/**
 * FolderList Component
 * Sidebar/drawer showing all folders with "All Notes" option
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal
} from 'react-native';
import { MaterialIcons, Feather, AntDesign } from '@expo/vector-icons';
import FolderCard from './FolderCard';
import type { Folder, FolderFormData } from '@/types/note';
import { NOTE_COLORS } from '@/types/note';

interface FolderListProps {
    folders: Folder[];
    selectedFolderId: number | null;
    onSelectFolder: (folderId: number | null) => void;
    onCreateFolder: () => void;
    onEditFolder?: (folder: Folder) => void;
    onDeleteFolder?: (folderId: number) => void;
    totalNoteCount?: number;

    // Form props (optional - for inline folder creation)
    showCreateForm?: boolean;
    folderFormData?: FolderFormData;
    onFormDataChange?: (key: keyof FolderFormData, value: unknown) => void;
    onFormSubmit?: () => void;
    onFormCancel?: () => void;
}

const FOLDER_COLORS = [
    '#3498db', // Blue
    '#2ecc71', // Green
    '#e74c3c', // Red
    '#f39c12', // Orange
    '#9b59b6', // Purple
    '#1abc9c', // Teal
    '#e67e22', // Dark Orange
    '#34495e'  // Dark Blue
];

const FolderList: React.FC<FolderListProps> = ({
    folders,
    selectedFolderId,
    onSelectFolder,
    onCreateFolder,
    onEditFolder,
    onDeleteFolder,
    totalNoteCount = 0,
    showCreateForm = false,
    folderFormData,
    onFormDataChange,
    onFormSubmit,
    onFormCancel
}) => {
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Render folder creation form modal
    const renderCreateFolderModal = () => {
        if (!showCreateForm || !folderFormData || !onFormDataChange) return null;

        return (
            <Modal
                visible={showCreateForm}
                transparent
                animationType="fade"
                onRequestClose={onFormCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Folder</Text>
                            <TouchableOpacity onPress={onFormCancel}>
                                <AntDesign name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* Folder Name Input */}
                        <TextInput
                            style={styles.folderNameInput}
                            value={folderFormData.name}
                            onChangeText={(text) => onFormDataChange('name', text)}
                            placeholder="Folder name"
                            placeholderTextColor="#999"
                            autoFocus
                        />

                        {/* Color Selection */}
                        <Text style={styles.colorLabel}>Color</Text>
                        <View style={styles.colorGrid}>
                            {FOLDER_COLORS.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color },
                                        folderFormData.color === color && styles.colorOptionSelected
                                    ]}
                                    onPress={() => onFormDataChange('color', color)}
                                >
                                    {folderFormData.color === color && (
                                        <MaterialIcons name="check" size={18} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Actions */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onFormCancel}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.createButton}
                                onPress={onFormSubmit}
                            >
                                <Text style={styles.createButtonText}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Folders</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={onCreateFolder}
                >
                    <Feather name="plus" size={20} color="#2ecc71" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {/* All Notes Option */}
                <TouchableOpacity
                    style={[
                        styles.allNotesCard,
                        selectedFolderId === null && styles.allNotesCardSelected
                    ]}
                    onPress={() => onSelectFolder(null)}
                >
                    <View style={styles.allNotesIcon}>
                        <MaterialIcons
                            name="notes"
                            size={28}
                            color={selectedFolderId === null ? '#2ecc71' : '#666'}
                        />
                    </View>
                    <View style={styles.allNotesContent}>
                        <Text style={[
                            styles.allNotesTitle,
                            selectedFolderId === null && styles.allNotesTitleSelected
                        ]}>
                            All Notes
                        </Text>
                        <Text style={styles.allNotesCount}>
                            {totalNoteCount} {totalNoteCount === 1 ? 'note' : 'notes'}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Folder List */}
                {folders.length > 0 ? (
                    folders.map((folder) => (
                        <FolderCard
                            key={folder.id}
                            folder={folder}
                            isSelected={selectedFolderId === folder.id}
                            onPress={onSelectFolder}
                            onEdit={onEditFolder}
                            onDelete={onDeleteFolder}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>
                            No folders yet
                        </Text>
                        <Text style={styles.emptyStateSubtext}>
                            Create folders to organize your notes
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Create Folder Modal */}
            {renderCreateFolderModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    headerTitle: {
        fontFamily: 'Kanit-Bold',
        fontSize: 20,
        color: '#2c3e50'
    },
    addButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#e8f5e9'
    },
    scrollView: {
        flex: 1,
        padding: 16
    },
    allNotesCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2
    },
    allNotesCardSelected: {
        backgroundColor: '#e8f5e9',
        borderColor: '#2ecc71',
        borderWidth: 1
    },
    allNotesIcon: {
        marginRight: 12
    },
    allNotesContent: {
        flex: 1
    },
    allNotesTitle: {
        fontFamily: 'Kanit-Bold',
        fontSize: 16,
        color: '#2c3e50',
        marginBottom: 2
    },
    allNotesTitleSelected: {
        color: '#2ecc71'
    },
    allNotesCount: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
        color: '#999'
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 12
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 24
    },
    emptyStateText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 14,
        color: '#999',
        marginBottom: 4
    },
    emptyStateSubtext: {
        fontFamily: 'Kanit-Regular',
        fontSize: 12,
        color: '#bbb',
        textAlign: 'center'
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: {
        fontFamily: 'Kanit-Bold',
        fontSize: 20,
        color: '#2c3e50'
    },
    folderNameInput: {
        fontFamily: 'Kanit-Regular',
        fontSize: 16,
        color: '#333',
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16
    },
    colorLabel: {
        fontFamily: 'Kanit-Bold',
        fontSize: 14,
        color: '#666',
        marginBottom: 12
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    colorOptionSelected: {
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        alignItems: 'center'
    },
    cancelButtonText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 15,
        color: '#666'
    },
    createButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#2ecc71',
        alignItems: 'center'
    },
    createButtonText: {
        fontFamily: 'Kanit-Bold',
        fontSize: 15,
        color: '#fff'
    }
});

export default FolderList;
