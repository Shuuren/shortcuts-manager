import { useState, useCallback } from 'react';
import { Upload, X, Edit2 } from 'lucide-react';
import { ImageEditor } from './ImageEditor';

export function ImageDropZone({ value, onChange, label = "Icon" }) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [pendingImage, setPendingImage] = useState(null);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const processFile = useCallback((file) => {
        if (!file) return;
        
        // Check file type
        if (!file.type.startsWith('image/')) {
            setError('Please drop an image file');
            return;
        }
        
        // Check file size (max 2MB before processing)
        if (file.size > 2 * 1024 * 1024) {
            setError('Image too large (max 2MB)');
            return;
        }
        
        setError(null);
        
        // Convert to base64 and open editor
        const reader = new FileReader();
        reader.onload = (e) => {
            setPendingImage(e.target.result);
            setEditorOpen(true);
        };
        reader.onerror = () => {
            setError('Failed to read image');
        };
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const file = e.dataTransfer?.files?.[0];
        processFile(file);
    }, [processFile]);

    const handleFileInput = useCallback((e) => {
        const file = e.target.files?.[0];
        processFile(file);
    }, [processFile]);

    const handlePaste = useCallback((e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                processFile(file);
                break;
            }
        }
    }, [processFile]);

    const handleClear = () => {
        onChange('');
        setError(null);
    };

    const handleUrlChange = (e) => {
        onChange(e.target.value);
        setError(null);
    };

    const handleEditorSave = (dataUrl) => {
        onChange(dataUrl);
        setPendingImage(null);
    };

    const handleEditorClose = () => {
        setEditorOpen(false);
        setPendingImage(null);
    };

    // Open editor with current image
    const handleEditCurrent = () => {
        if (value) {
            setPendingImage(value);
            setEditorOpen(true);
        }
    };

    // Check if value is a data URL (base64)
    const isDataUrl = value?.startsWith('data:');
    const hasImage = value && (isDataUrl || value.startsWith('http'));

    return (
        <>
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>
                
                <div className="flex gap-3">
                    {/* Drop zone / Preview */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onPaste={handlePaste}
                        className={`
                            relative w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center
                            transition-all cursor-pointer overflow-hidden flex-shrink-0
                            ${isDragging 
                                ? 'border-blue-400 bg-blue-500/20' 
                                : hasImage 
                                    ? 'border-transparent bg-[var(--input-bg)]' 
                                    : 'border-[var(--input-border)] bg-[var(--input-bg)] hover:border-[var(--input-focus-border)]'
                            }
                        `}
                    >
                        {hasImage ? (
                            <>
                                {/* Checkerboard background for transparency */}
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iIzQ0NCIvPjxyZWN0IHg9IjgiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiM0NDQiLz48cmVjdCB4PSI4IiB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMzMzIi8+PHJlY3QgeT0iOCIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iIzMzMyIvPjwvc3ZnPg==')]" />
                                <img 
                                    src={value} 
                                    alt="Icon preview"
                                    className="relative w-full h-full object-contain p-2"
                                    onError={() => setError('Failed to load image')}
                                />
                                {/* Hover overlay with actions */}
                                <div className="absolute inset-0 bg-white/70 dark:bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                    <button
                                        onClick={handleEditCurrent}
                                        className="p-1.5 rounded-full bg-blue-500/80 hover:bg-blue-500 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={12} className="text-white" />
                                    </button>
                                    <button
                                        onClick={handleClear}
                                        className="p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
                                        title="Remove"
                                    >
                                        <X size={12} className="text-white" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <label className="cursor-pointer flex flex-col items-center gap-1 p-2">
                                <Upload size={20} className="text-[var(--text-muted)]" />
                                <span className="text-[10px] text-[var(--text-muted)] text-center">Drop or click</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileInput}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                    
                    {/* URL input */}
                    <div className="flex-1 flex flex-col gap-2">
                        <input
                            type="text"
                            value={isDataUrl ? '(Edited image)' : value || ''}
                            onChange={handleUrlChange}
                            disabled={isDataUrl}
                            placeholder="Or paste URL..."
                            className="px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm disabled:opacity-50"
                        />
                        <p className="text-[10px] text-[var(--text-muted)]">
                            Drop image to open editor. Hover preview to edit/remove.
                        </p>
                        {error && (
                            <p className="text-xs text-red-400">{error}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Editor Modal */}
            <ImageEditor
                isOpen={editorOpen}
                onClose={handleEditorClose}
                imageSrc={pendingImage}
                onSave={handleEditorSave}
            />
        </>
    );
}
