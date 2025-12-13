import { useState, useMemo } from 'react';
import { useToast } from './Toast';
import { Modal, FormInput, FormSelect, Button, ConfirmModal } from './Modal';
import { ImageDropZone } from './ImageDropZone';
import { Trash2, Info } from 'lucide-react';

// Helper to compute initial form state
const computeInitialGroupState = (group) => {
    if (group) return { ...group };
    return {
        key: '',
        name: '',
        parentKey: null,
        iconUrl: ''
    };
};

export function GroupForm({ 
    isOpen, 
    onClose, 
    group = null, // null for create, object for edit
    parentGroups = [], // Available parent groups for subgroups
    onSave,
    onDelete 
}) {
    const isEditing = !!group;
    const toast = useToast();
    
    // Detect group type: leader (stored separately), raycastExtension, or systemCategory (derived from data)
    const groupType = group?.type || 'leader';
    const isVirtualGroup = groupType === 'raycastExtension' || groupType === 'systemCategory';
    
    // Use a key derived from group and isOpen to track when to reset
    const formKey = useMemo(() => `${group?.id || 'new'}-${isOpen}`, [group?.id, isOpen]);
    
    const [formData, setFormData] = useState(() => computeInitialGroupState(group));
    const [errors, setErrors] = useState({});
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [lastFormKey, setLastFormKey] = useState(formKey);
    
    // Reset form when modal opens with new data - using key comparison pattern
    if (formKey !== lastFormKey) {
        setFormData(computeInitialGroupState(group));
        setErrors({});
        setLastFormKey(formKey);
    }
    
    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user types
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };
    
    const handleSubmit = () => {
        setErrors({});
        const newErrors = {};
        
        if (!formData.name?.trim()) {
            newErrors.name = 'Group Name is required';
        }
        if (!isVirtualGroup && !formData.key?.trim()) {
            newErrors.key = 'Key is required';
        } else if (!isVirtualGroup && formData.key?.trim().length !== 1) {
            newErrors.key = 'Key must be a single character (a-z)';
        }
        
        // Check for duplicate key (only for new groups or if key changed)
        if (!isVirtualGroup && formData.key?.trim()) {
            const keyToCheck = formData.key.trim().toLowerCase();
            const parentKeyToCheck = formData.parentKey || null;
            
            // Find if another group has the same key at the same level (same parentKey)
            const duplicateGroup = parentGroups.find(g => {
                // Skip self when editing
                if (isEditing && g.id === group.id) return false;
                // Check if same key and same parent level
                const gParentKey = g.parentKey || null;
                return g.key?.toLowerCase() === keyToCheck && gParentKey === parentKeyToCheck;
            });
            
            if (duplicateGroup) {
                newErrors.key = `Key "${formData.key}" is already used by "${duplicateGroup.name}"`;
            }
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            const errorMessage = newErrors.key?.includes('already used') 
                ? newErrors.key 
                : 'Please fill in all required fields';
            toast.error(errorMessage);
            return;
        }

        // Generate ID if creating new
        const dataToSave = {
            ...formData,
            id: formData.id || `group_${formData.parentKey ? formData.parentKey + '_' : ''}${formData.key}`
        };
        onSave(dataToSave);
        onClose();
    };
    
    const handleDelete = () => {
        setShowConfirmDelete(true);
    };
    
    const confirmDelete = () => {
        onDelete(group.id);
        setShowConfirmDelete(false);
        onClose();
    };
    
    const parentOptions = [
        { value: '', label: '(None - Top Level)' },
        ...parentGroups
            .filter(g => !g.parentKey) // Only show top-level groups as possible parents
            .map(g => ({ value: g.key, label: g.name }))
    ];

    // Title based on group type
    const getTitle = () => {
        if (!isEditing) return 'Add New Group';
        switch (groupType) {
            case 'raycastExtension':
                return 'Edit Extension Group';
            case 'systemCategory':
                return 'Edit Category';
            default:
                return 'Edit Group';
        }
    };

    // Info message for virtual groups
    const renderVirtualGroupInfo = () => {
        if (!isVirtualGroup) return null;
        
        return (
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-600 dark:text-blue-300">
                <Info size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                    <strong className="block mb-1">
                        {groupType === 'raycastExtension' ? 'Extension Group' : 'Category Group'}
                    </strong>
                    <p className="text-blue-600/70 dark:text-blue-300/70">
                        {groupType === 'systemCategory' 
                            ? 'To rename this group, edit any shortcut within it and change its "Category / Group" field. All shortcuts with this category will appear in the renamed group.'
                            : `This group is derived from the shortcuts' extension field. To rename this group, you'll need to update the extension field on all shortcuts within it.`
                        }
                    </p>
                </div>
            </div>
        );
    };
    
    return (
        <>
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            onSubmit={!isVirtualGroup ? handleSubmit : undefined} 
            title={getTitle()}
            actions={
                <div className="flex gap-3">
                    {isEditing && !isVirtualGroup && (
                        <Button variant="danger" onClick={handleDelete} className="flex items-center gap-2">
                            <Trash2 size={16} />
                            Delete
                        </Button>
                    )}
                    <div className="flex-1" />
                    <Button variant="secondary" onClick={onClose}>
                        {isVirtualGroup ? 'Close' : 'Cancel'}
                    </Button>
                    {!isVirtualGroup && (
                        <Button variant="primary" onClick={handleSubmit}>
                            {isEditing ? 'Save Changes' : 'Add Group'}
                        </Button>
                    )}
                </div>
            }
        >
            <div className="flex flex-col gap-4">
                {renderVirtualGroupInfo()}
                
                {/* For virtual groups, show read-only info */}
                {isVirtualGroup ? (
                    <>
                        <FormInput 
                            label={groupType === 'raycastExtension' ? 'Extension Name' : 'Category Name'}
                            value={formData.name || ''}
                            onChange={() => {}}
                            disabled
                        />
                        <ImageDropZone 
                            label="Group Icon"
                            value={formData.iconUrl || ''}
                            onChange={(v) => updateField('iconUrl', v)}
                        />
                        <p className="text-xs text-[var(--text-muted)]">
                            Note: Icon changes for virtual groups are not persisted yet. This feature is coming soon.
                        </p>
                    </>
                ) : (
                    <>
                        <FormInput 
                            label="Group Name"
                            value={formData.name || ''}
                            onChange={(v) => updateField('name', v)}
                            placeholder="e.g., Applications, Browsers, AI Tools"
                            required
                            error={errors.name}
                        />
                        <FormInput 
                            label="Key (single letter)"
                            value={formData.key || ''}
                            onChange={(v) => updateField('key', v)}
                            placeholder="e.g., a, b, c"
                            required
                            error={errors.key}
                        />
                        <FormSelect 
                            label="Parent Group (for subgroups)"
                            value={formData.parentKey || ''}
                            onChange={(v) => updateField('parentKey', v || null)}
                            options={parentOptions}
                        />
                        <ImageDropZone 
                            label="Group Icon"
                            value={formData.iconUrl || ''}
                            onChange={(v) => updateField('iconUrl', v)}
                        />
                    </>
                )}
            </div>
        </Modal>
        
        <ConfirmModal
            isOpen={showConfirmDelete}
            onClose={() => setShowConfirmDelete(false)}
            onConfirm={confirmDelete}
            title="Delete Group?"
            message="Are you sure you want to delete this group? Shortcuts in this group will remain but may not display correctly."
            confirmText="Delete"
            confirmVariant="danger"
        />
        </>
    );
}
