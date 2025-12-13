import { useState, useMemo } from 'react';
import { useToast } from './Toast';
import { Modal, FormInput, FormSelect, Button, ConfirmModal } from './Modal';
import { ImageDropZone } from './ImageDropZone';
import { CategorySelector } from './CategorySelector';
import { Trash2, Tag, X, LayoutGrid, Command, Keyboard, ExternalLink } from 'lucide-react';



// Helper to compute initial form state
const computeInitialState = (app) => {
    if (app) return { ...app, tags: app.tags || [] };
    return {
        name: '',
        category: '',
        iconUrl: '',
        bundleId: '',
        tags: []
    };
};

export function AppForm({ 
    isOpen, 
    onClose, 
    app = null, // null for create, object for edit
    shortcuts = {}, // All shortcuts data for finding linked shortcuts
    onSave,
    onDelete,
    onEditShortcut // Optional callback to edit a linked shortcut
}) {
    const isEditing = !!app;
    const toast = useToast();
    
    // Use a key derived from app and isOpen to track when to reset
    const formKey = useMemo(() => `${app?.id || 'new'}-${isOpen}`, [app?.id, isOpen]);
    
    const [formData, setFormData] = useState(() => computeInitialState(app));
    const [tagInput, setTagInput] = useState('');
    const [errors, setErrors] = useState({});
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [lastFormKey, setLastFormKey] = useState(formKey);
    
    // Reset form when modal opens with new data - using key comparison pattern
    if (formKey !== lastFormKey) {
        setFormData(computeInitialState(app));
        setTagInput('');
        setErrors({});
        setLastFormKey(formKey);
    }
    
    // Find all shortcuts that link to this app
    const linkedShortcuts = useMemo(() => {
        if (!app?.id) return { leader: [], raycast: [], system: [] };
        
        const matchesApp = (shortcut) => {
            // Match by appId (new way) or by name (legacy way)
            if (shortcut.appId === app.id) return true;
            if (shortcut.app?.toLowerCase() === app.name?.toLowerCase()) return true;
            if (shortcut.appOrContext?.toLowerCase() === app.name?.toLowerCase()) return true;
            // For raycast, parse commandName for app name
            const commandAppName = shortcut.commandName?.replace(/^(Open|Launch|Toggle)\s+/i, '').trim();
            if (commandAppName?.toLowerCase() === app.name?.toLowerCase()) return true;
            return false;
        };
        
        return {
            leader: (shortcuts.leaderShortcuts || []).filter(matchesApp),
            raycast: (shortcuts.raycastShortcuts || []).filter(matchesApp),
            system: (shortcuts.systemShortcuts || []).filter(matchesApp)
        };
    }, [app, shortcuts]);
    
    const totalLinkedCount = linkedShortcuts.leader.length + linkedShortcuts.raycast.length + linkedShortcuts.system.length;
    
    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };
    
    const addTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !formData.tags.includes(tag)) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
            setTagInput('');
        }
    };
    
    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tagToRemove)
        }));
    };
    
    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            addTag();
        }
    };
    
    const handleSubmit = () => {
        setErrors({});
        const newErrors = {};
        
        if (!formData.name?.trim()) {
            newErrors.name = 'App Name is required';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Please fill in all required fields');
            return;
        }
        
        const dataToSave = {
            ...formData,
            id: formData.id || `app_${formData.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`
        };
        onSave(dataToSave);
        onClose();
    };
    
    const handleDelete = () => {
        setShowConfirmDelete(true);
    };
    
    const confirmDelete = () => {
        onDelete(app.id);
        setShowConfirmDelete(false);
        onClose();
    };
    
    return (
        <>
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            onSubmit={handleSubmit} 
            title={isEditing ? 'Edit App' : 'Add New App'}
            actions={
                <div className="flex gap-3">
                    {isEditing && (
                        <Button variant="danger" onClick={handleDelete} className="flex items-center gap-2">
                            <Trash2 size={16} />
                            Delete
                        </Button>
                    )}
                    <div className="flex-1" />
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        {isEditing ? 'Save Changes' : 'Add App'}
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-4">
                {/* Icon preview */}
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-20 h-20 rounded-2xl bg-[var(--input-bg)] flex items-center justify-center overflow-hidden border border-[var(--glass-border)]">
                        {formData.iconUrl ? (
                            <img 
                                src={formData.iconUrl} 
                                alt={formData.name || 'App'} 
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <span className="text-3xl text-[var(--text-muted)]">📱</span>
                        )}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-[var(--text-secondary)] mb-1">App Preview</p>
                        <p className="text-[var(--text-primary)] font-medium">{formData.name || 'App Name'}</p>
                        <p className="text-xs text-[var(--text-muted)]">{formData.category || 'Category'}</p>
                    </div>
                </div>
                
                <FormInput 
                    label="App Name"
                    value={formData.name || ''}
                    onChange={(v) => updateField('name', v)}
                    placeholder="e.g., Discord, VS Code, Safari"
                    required
                    error={errors.name}
                />
                
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Category</label>
                    <CategorySelector 
                        value={formData.category || ''}
                        onChange={(v) => updateField('category', v)}
                    />
                </div>
                
                <ImageDropZone 
                    label="App Icon"
                    value={formData.iconUrl || ''}
                    onChange={(v) => updateField('iconUrl', v)}
                />
                
                <FormInput 
                    label="Bundle ID (optional)"
                    value={formData.bundleId || ''}
                    onChange={(v) => updateField('bundleId', v)}
                    placeholder="e.g., com.apple.Safari"
                />
                
                {/* Tags */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Tags</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            placeholder="Add a tag..."
                            className="flex-1 px-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
                        />
                        <Button variant="secondary" onClick={addTag}>
                            <Tag size={14} />
                        </Button>
                    </div>
                    {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                            {formData.tags.map(tag => (
                                <span 
                                    key={tag}
                                    className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs border border-blue-500/30"
                                >
                                    {tag}
                                    <button 
                                        onClick={() => removeTag(tag)}
                                        className="hover:text-red-400 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Linked Shortcuts Panel - only show when editing */}
                {isEditing && totalLinkedCount > 0 && (
                    <div className="flex flex-col gap-3 mt-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">
                                Linked Shortcuts ({totalLinkedCount})
                            </label>
                        </div>
                        
                        <div className="bg-[var(--input-bg)] rounded-lg border border-[var(--glass-border)] divide-y divide-[var(--glass-border)] max-h-48 overflow-y-auto">
                            {/* Leader Shortcuts */}
                            {linkedShortcuts.leader.length > 0 && (
                                <div className="p-2">
                                    <div className="flex items-center gap-2 text-xs text-purple-400 mb-2 px-1">
                                        <LayoutGrid size={12} />
                                        <span>Leader Key ({linkedShortcuts.leader.length})</span>
                                    </div>
                                    {linkedShortcuts.leader.map(s => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => onEditShortcut?.(s, 'leaderShortcuts')}
                                            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-[var(--glass-bg-hover)] transition-colors text-left group"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[var(--text-primary)] text-xs truncate">{s.action || s.app}</p>
                                                <p className="text-[var(--text-muted)] text-[10px]">{s.sequence?.join(' → ')}</p>
                                            </div>
                                            <ExternalLink size={12} className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] flex-shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {/* Raycast Shortcuts */}
                            {linkedShortcuts.raycast.length > 0 && (
                                <div className="p-2">
                                    <div className="flex items-center gap-2 text-xs text-blue-400 mb-2 px-1">
                                        <Command size={12} />
                                        <span>Raycast ({linkedShortcuts.raycast.length})</span>
                                    </div>
                                    {linkedShortcuts.raycast.map(s => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => onEditShortcut?.(s, 'raycastShortcuts')}
                                            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-[var(--glass-bg-hover)] transition-colors text-left group"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[var(--text-primary)] text-xs truncate">{s.commandName}</p>
                                                <p className="text-[var(--text-muted)] text-[10px]">{s.keys || s.aliasText || s.extension}</p>
                                            </div>
                                            <ExternalLink size={12} className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] flex-shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {/* System Shortcuts */}
                            {linkedShortcuts.system.length > 0 && (
                                <div className="p-2">
                                    <div className="flex items-center gap-2 text-xs text-green-400 mb-2 px-1">
                                        <Keyboard size={12} />
                                        <span>System ({linkedShortcuts.system.length})</span>
                                    </div>
                                    {linkedShortcuts.system.map(s => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => onEditShortcut?.(s, 'systemShortcuts')}
                                            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-[var(--glass-bg-hover)] transition-colors text-left group"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[var(--text-primary)] text-xs truncate">{s.action}</p>
                                                <p className="text-[var(--text-muted)] text-[10px]">{s.keys}</p>
                                            </div>
                                            <ExternalLink size={12} className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] flex-shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
        
        <ConfirmModal
            isOpen={showConfirmDelete}
            onClose={() => setShowConfirmDelete(false)}
            onConfirm={confirmDelete}
            title="Delete App?"
            message="Are you sure you want to delete this app? Shortcuts using this app will need to be updated."
            confirmText="Delete"
            confirmVariant="danger"
        />
        </>
    );
}
