import { useState, useMemo } from 'react';
import { useToast } from './Toast';
import { Modal, FormInput, FormSelect, Button, ConfirmModal } from './Modal';
import { ImageDropZone } from './ImageDropZone';
import { AppSelector } from './AppSelector';
import { CategorySelector } from './CategorySelector';
import { Trash2, Link, Unlink, Info, X } from 'lucide-react';

// Special Actions Help Tooltip Component
const SpecialActionsHelp = () => {
    const [isOpen, setIsOpen] = useState(false);
    
    const specialActions = [
        { 
            inputs: ['tap twice', 'double tap', '2x tap'], 
            display: '⟲ Tap ×2', 
            color: 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 border-amber-500/50 text-amber-500 dark:text-amber-300' 
        },
        { 
            inputs: ['triple tap', '3x tap'], 
            display: '⟲ Tap ×3', 
            color: 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 border-amber-500/50 text-amber-500 dark:text-amber-300' 
        },
        { 
            inputs: ['hold', 'long press'], 
            display: '⏱ Hold', 
            color: 'bg-gradient-to-r from-purple-500/30 to-fuchsia-500/30 border-purple-500/50 text-purple-500 dark:text-purple-300' 
        },
    ];
    
    return (
        <div className="relative inline-flex">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 rounded-full hover:bg-[var(--glass-bg-hover)] transition-colors text-[var(--text-muted)] hover:text-blue-400"
                title="Special actions help"
            >
                <Info size={14} />
            </button>
            
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-[200]" 
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Tooltip */}
                    <div className="absolute left-0 top-full mt-2 z-[201] w-80 p-4 bg-[var(--bg-app)] border border-[var(--glass-border)] rounded-xl shadow-2xl">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                <Info size={14} className="text-blue-400" />
                                Special Actions
                            </h4>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded hover:bg-[var(--glass-bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                        
                        <p className="text-xs text-[var(--text-secondary)] mb-3">
                            Type these phrases in the hotkey field to display as special action badges:
                        </p>
                        
                        <div className="space-y-3">
                            {specialActions.map((action, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${action.color}`}>
                                        {action.display}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap gap-1">
                                            {action.inputs.map((input, i) => (
                                                <code key={i} className="text-[10px] px-1.5 py-0.5 bg-[var(--surface-highlight)] rounded text-[var(--text-secondary)] font-mono border border-[var(--surface-border-strong)]">
                                                    {input}
                                                </code>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-[var(--glass-border)]">
                            <p className="text-[10px] text-[var(--text-muted)]">
                                <strong className="text-[var(--text-secondary)]">Tip:</strong> Combine with modifiers using + symbol, e.g.{' '}
                                <code className="px-1 py-0.5 bg-[var(--surface-highlight)] rounded text-[var(--text-secondary)] font-mono border border-[var(--surface-border-strong)]">Ctrl+tap twice</code>
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Categories for each shortcut type


// Helper to compute initial state for shortcuts
const computeInitialShortcutState = (shortcut, shortcutType) => {
    if (shortcut) return { ...shortcut };
    
    switch (shortcutType) {
        case 'leaderShortcuts':
            return {
                app: '',
                action: '',
                sequence: ['Leader'],
                category: 'Applications',
                notes: '',
                appId: null,
                iconUrl: ''
            };
        case 'raycastShortcuts':
            return {
                commandName: '',
                extension: '',
                aliasText: '',
                keys: '',
                category: 'Custom',
                notes: '',
                appId: null,
                iconUrl: ''
            };
        case 'systemShortcuts':
            return {
                keys: '',
                appOrContext: '',
                action: '',
                category: 'System',
                notes: '',
                appId: null,
                iconUrl: ''
            };
        default:
            return {};
    }
};

export function ShortcutForm({ 
    isOpen, 
    onClose, 
    shortcutType, // 'leaderShortcuts' | 'raycastShortcuts' | 'systemShortcuts'
    shortcut = null, // null for create, object for edit
    apps = [], // Apps from the library for linking
    onSave,
    onDelete 
}) {
    const isEditing = !!shortcut;
    const toast = useToast();
    
    // Use a key derived from shortcut, shortcutType and isOpen to track when to reset
    const formKey = useMemo(() => `${shortcut?.id || 'new'}-${shortcutType}-${isOpen}`, [shortcut?.id, shortcutType, isOpen]);
    
    const [formData, setFormData] = useState(() => computeInitialShortcutState(shortcut, shortcutType));
    const [sequenceInput, setSequenceInput] = useState('');
    const [useCustomIcon, setUseCustomIcon] = useState(false);
    const [errors, setErrors] = useState({});
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [lastFormKey, setLastFormKey] = useState(formKey);
    
    // Get linked app from apps list
    const linkedApp = apps.find(a => a.id === formData.appId);
    
    // Reset form when modal opens with new data - using key comparison pattern
    if (formKey !== lastFormKey) {
        const initial = computeInitialShortcutState(shortcut, shortcutType);
        setFormData(initial);
        setErrors({});
        if (shortcutType === 'leaderShortcuts' && initial.sequence) {
            setSequenceInput(initial.sequence.slice(1).join(' → '));
        } else {
            setSequenceInput('');
        }
        // If there's both an appId and a custom iconUrl, user has a custom icon
        const hasLinkedApp = apps.find(a => a.id === initial.appId);
        setUseCustomIcon(initial.iconUrl && hasLinkedApp && initial.iconUrl !== hasLinkedApp.iconUrl);
        setLastFormKey(formKey);
    }
    
    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user types
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };
    
    // Handle app selection from library
    const handleAppSelect = (appId, app) => {
        if (app) {
            // Update form with linked app details
            setFormData(prev => ({
                ...prev,
                appId: app.id,
                // Auto-fill app name field based on shortcut type
                ...(shortcutType === 'leaderShortcuts' && { app: app.name }),
                ...(shortcutType === 'systemShortcuts' && { appOrContext: app.name }),
            }));
            // Use app's icon unless user explicitly set a custom one
            if (!useCustomIcon) {
                setFormData(prev => ({ ...prev, iconUrl: '' })); // Clear custom, use linked
            }
        } else {
            // Cleared selection
            setFormData(prev => ({ ...prev, appId: null }));
        }
    };
    
    const handleSequenceChange = (value) => {
        setSequenceInput(value);
        // Parse "a → n → a" or "a n a" into ["Leader", "a", "n", "a"]
        const keys = value.split(/[\s→]+/).filter(k => k.trim());
        setFormData(prev => ({ ...prev, sequence: ['Leader', ...keys] }));
    };
    

    
    const handleSubmit = () => {
        // Clear previous errors
        setErrors({});
        const newErrors = {};
        
        // Validation based on shortcut type
        if (shortcutType === 'leaderShortcuts') {
            if (!formData.app || !formData.app.trim()) {
                newErrors.app = 'App/Tool Name is required';
            }
            if (!formData.sequence || formData.sequence.length < 2) {
                newErrors.sequence = 'Key Sequence is required (at least one key after Leader)';
            }
        } else if (shortcutType === 'raycastShortcuts') {
            if (!formData.commandName || !formData.commandName.trim()) {
                newErrors.commandName = 'Command Name is required';
            }
        } else if (shortcutType === 'systemShortcuts') {
            if (!formData.action || !formData.action.trim()) {
                newErrors.action = 'Action is required';
            }
            if (!formData.keys || !formData.keys.trim()) {
                newErrors.keys = 'Hotkey is required';
            }
        }
        
        // If there are errors, show them and don't submit
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Please fill in all required fields');
            return;
        }

        onSave(formData);
        onClose();
    };
    
    const handleDelete = () => {
        setShowConfirmDelete(true);
    };
    
    const confirmDelete = () => {
        onDelete(shortcut.id);
        setShowConfirmDelete(false);
        onClose();
    };
    
    const renderLeaderForm = () => (
        <>
            {/* App Library Link */}
            <AppSelector
                apps={apps}
                value={formData.appId}
                onChange={handleAppSelect}
                label="Link to App (from Library)"
                placeholder="Search apps in library..."
            />
            
            <FormInput 
                label="App / Tool Name"
                value={formData.app || ''}
                onChange={(v) => updateField('app', v)}
                placeholder="e.g., Discord, Notion, VS Code"
                required
                error={errors.app}
            />
            <FormInput 
                label="Action"
                value={formData.action || ''}
                onChange={(v) => updateField('action', v)}
                placeholder="e.g., Open App, Toggle Window"
            />
            <FormInput 
                label="Key Sequence (space or → separated)"
                value={sequenceInput}
                onChange={handleSequenceChange}
                placeholder="e.g., a → n → d"
                required
                error={errors.sequence}
            />
            <CategorySelector 
                value={formData.category || 'Applications'}
                onChange={(v) => updateField('category', v)}
            />
            
            {/* Icon Section with toggle for custom vs linked */}
            {linkedApp?.iconUrl ? (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Icon</label>
                        <button
                            type="button"
                            onClick={() => setUseCustomIcon(!useCustomIcon)}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            {useCustomIcon ? <Link size={12} /> : <Unlink size={12} />}
                            {useCustomIcon ? 'Use linked app icon' : 'Use custom icon'}
                        </button>
                    </div>
                    {useCustomIcon ? (
                        <ImageDropZone 
                            value={formData.iconUrl || ''}
                            onChange={(v) => updateField('iconUrl', v)}
                        />
                    ) : (
                        <div className="flex items-center gap-3 p-3 bg-[var(--input-bg)] rounded-lg border border-[var(--input-border)]">
                            <div className="w-12 h-12 rounded-xl bg-[var(--input-bg)] flex items-center justify-center overflow-hidden">
                                <img src={linkedApp.iconUrl} alt={linkedApp.name} className="w-10 h-10 object-contain" />
                            </div>
                            <div>
                                <p className="text-[var(--text-primary)] text-sm">Using {linkedApp.name}'s icon</p>
                                <p className="text-[var(--text-muted)] text-xs">From Apps Library</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <ImageDropZone 
                    label="App Icon"
                    value={formData.iconUrl || ''}
                    onChange={(v) => updateField('iconUrl', v)}
                />
            )}
            
            <FormInput 
                label="Notes (optional)"
                value={formData.notes || ''}
                onChange={(v) => updateField('notes', v)}
                placeholder="Any additional notes..."
            />
        </>
    );
    
    const renderRaycastForm = () => (
        <>
            {/* App Library Link */}
            <AppSelector
                apps={apps}
                value={formData.appId}
                onChange={handleAppSelect}
                label="Link to App (from Library)"
                placeholder="Search apps in library..."
            />
            
            <FormInput 
                label="Command Name"
                value={formData.commandName || ''}
                onChange={(v) => updateField('commandName', v)}
                placeholder="e.g., Open Discord"
                required
                error={errors.commandName}
            />
            <FormInput 
                label="Extension"
                value={formData.extension || ''}
                onChange={(v) => updateField('extension', v)}
                placeholder="e.g., Applications, Snippets"
            />
            {/* Hotkey with Special Actions Help */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Hotkey (optional)</label>
                    <SpecialActionsHelp />
                </div>
                <input
                    type="text"
                    value={formData.keys || ''}
                    onChange={(e) => updateField('keys', e.target.value)}
                    placeholder="Cmd+Shift+K or Ctrl+Option+M or hold"
                    className="px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
            </div>
            <FormInput 
                label="Alias (optional)"
                value={formData.aliasText || ''}
                onChange={(v) => updateField('aliasText', v)}
                placeholder="e.g., dis, nt"
            />
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Category</label>
                <CategorySelector 
                    value={formData.category || 'Custom'}
                    onChange={(v) => updateField('category', v)}
                />
            </div>
            
            {/* Icon Section with toggle for custom vs linked */}
            {linkedApp?.iconUrl ? (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Icon</label>
                        <button
                            type="button"
                            onClick={() => setUseCustomIcon(!useCustomIcon)}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            {useCustomIcon ? <Link size={12} /> : <Unlink size={12} />}
                            {useCustomIcon ? 'Use linked app icon' : 'Use custom icon'}
                        </button>
                    </div>
                    {useCustomIcon ? (
                        <ImageDropZone 
                            value={formData.iconUrl || ''}
                            onChange={(v) => updateField('iconUrl', v)}
                        />
                    ) : (
                        <div className="flex items-center gap-3 p-3 bg-[var(--input-bg)] rounded-lg border border-[var(--input-border)]">
                            <div className="w-12 h-12 rounded-xl bg-[var(--input-bg)] flex items-center justify-center overflow-hidden">
                                <img src={linkedApp.iconUrl} alt={linkedApp.name} className="w-10 h-10 object-contain" />
                            </div>
                            <div>
                                <p className="text-[var(--text-primary)] text-sm">Using {linkedApp.name}'s icon</p>
                                <p className="text-[var(--text-muted)] text-xs">From Apps Library</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <ImageDropZone 
                    label="Command Icon"
                    value={formData.iconUrl || ''}
                    onChange={(v) => updateField('iconUrl', v)}
                />
            )}
            
            <FormInput 
                label="Notes (optional)"
                value={formData.notes || ''}
                onChange={(v) => updateField('notes', v)}
                placeholder="Any additional notes..."
            />
        </>
    );
    
    const renderSystemForm = () => (
        <>
            {/* App Library Link */}
            <AppSelector
                apps={apps}
                value={formData.appId}
                onChange={handleAppSelect}
                label="Link to App (from Library)"
                placeholder="Search apps in library..."
            />
            
            {/* Hotkey with Special Actions Help */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Hotkey <span className="text-red-400">*</span>
                    </label>
                    <SpecialActionsHelp />
                </div>
                <input
                    type="text"
                    value={formData.keys || ''}
                    onChange={(e) => updateField('keys', e.target.value)}
                    placeholder="Cmd+Shift+Space or Hyper+M or tap twice"
                    required
                    className={`px-4 py-2.5 bg-[var(--input-bg)] border rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 transition-all ${
                        errors.keys 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' 
                            : 'border-[var(--input-border)] focus:border-blue-500/50 focus:ring-blue-500/30'
                    }`}
                />
                {errors.keys && <p className="text-xs text-red-400">{errors.keys}</p>}
            </div>
            <FormInput 
                label="Action"
                value={formData.action || ''}
                onChange={(v) => updateField('action', v)}
                placeholder="e.g., Toggle Focus Mode, Open..."
                required
                error={errors.action}
            />
            
            {/* Category - editable text field with suggestions */}
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Group / Functionality</label>
                <CategorySelector 
                    value={formData.category || ''}
                    onChange={(v) => updateField('category', v)}
                    placeholder="Select or create a functionality group..."
                />
            </div>
            
            {/* Icon Section with toggle for custom vs linked */}
            {linkedApp?.iconUrl ? (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Icon</label>
                        <button
                            type="button"
                            onClick={() => setUseCustomIcon(!useCustomIcon)}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            {useCustomIcon ? <Link size={12} /> : <Unlink size={12} />}
                            {useCustomIcon ? 'Use linked app icon' : 'Use custom icon'}
                        </button>
                    </div>
                    {useCustomIcon ? (
                        <ImageDropZone 
                            value={formData.iconUrl || ''}
                            onChange={(v) => updateField('iconUrl', v)}
                        />
                    ) : (
                        <div className="flex items-center gap-3 p-3 bg-[var(--input-bg)] rounded-lg border border-[var(--input-border)]">
                            <div className="w-12 h-12 rounded-xl bg-[var(--input-bg)] flex items-center justify-center overflow-hidden">
                                <img src={linkedApp.iconUrl} alt={linkedApp.name} className="w-10 h-10 object-contain" />
                            </div>
                            <div>
                                <p className="text-[var(--text-primary)] text-sm">Using {linkedApp.name}'s icon</p>
                                <p className="text-[var(--text-muted)] text-xs">From Apps Library</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <ImageDropZone 
                    label="App Icon"
                    value={formData.iconUrl || ''}
                    onChange={(v) => updateField('iconUrl', v)}
                />
            )}
            
            <FormInput 
                label="Notes (optional)"
                value={formData.notes || ''}
                onChange={(v) => updateField('notes', v)}
                placeholder="Any additional notes..."
            />
        </>
    );
    
    const getTitle = () => {
        const action = isEditing ? 'Edit' : 'Add';
        switch (shortcutType) {
            case 'leaderShortcuts': return `${action} Leader Shortcut`;
            case 'raycastShortcuts': return `${action} Raycast Command`;
            case 'systemShortcuts': return `${action} System Shortcut`;
            default: return `${action} Shortcut`;
        }
    };
    
    return (
        <>
            <Modal 
                isOpen={isOpen} 
                onClose={onClose} 
                onSubmit={handleSubmit} 
                title={getTitle()}
                actions={
                    <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
                        {isEditing && (
                            <Button variant="danger" onClick={handleDelete} className="flex items-center justify-center gap-2 w-full sm:w-auto">
                                <Trash2 size={16} />
                                Delete
                            </Button>
                        )}
                        <div className="hidden sm:block flex-1" />
                        <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSubmit} className="w-full sm:w-auto">
                            {isEditing ? 'Save Changes' : 'Add Shortcut'}
                        </Button>
                    </div>
                }
            >
                <div className="flex flex-col gap-4">
                    {shortcutType === 'leaderShortcuts' && renderLeaderForm()}
                    {shortcutType === 'raycastShortcuts' && renderRaycastForm()}
                    {shortcutType === 'systemShortcuts' && renderSystemForm()}
                </div>
            </Modal>
            
            <ConfirmModal
                isOpen={showConfirmDelete}
                onClose={() => setShowConfirmDelete(false)}
                onConfirm={confirmDelete}
                title="Delete Shortcut?"
                message="Are you sure you want to delete this shortcut? This action cannot be undone."
                confirmText="Delete"
                confirmVariant="danger"
            />
        </>
    );
}
