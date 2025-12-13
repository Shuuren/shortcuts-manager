import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // motion used in JSX below
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, onSubmit, title, children, actions }) {
    // Handle keyboard shortcuts
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        }
        // Enter to submit (but not if in a textarea or already submitting)
        if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
            // Check if the target is an input - if so, only submit if it's not part of the form
            if (e.target.tagName === 'INPUT' && e.target.type !== 'submit') {
                // Allow submit on Enter in input fields
                if (onSubmit) {
                    e.preventDefault();
                    onSubmit();
                }
            }
        }
    }, [onClose, onSubmit]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />
                    
                    {/* Modal Container - centered */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-lg pointer-events-auto"
                        >
                            <div className="bg-[var(--bg-app)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)] flex-shrink-0">
                                    <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-lg hover:bg-[var(--glass-bg-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                
                                {/* Content - scrollable */}
                                <div className="p-6 overflow-y-auto flex-1">
                                    {children}
                                </div>
                                
                                {/* Actions - sticky footer (if provided) */}
                                {actions && (
                                    <div className="px-6 py-4 border-t border-[var(--glass-border)] flex-shrink-0 bg-[var(--bg-app)]">
                                        {actions}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

// Form input component with error state
export function FormInput({ label, value, onChange, placeholder, type = 'text', required = false, disabled = false, error = null }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
                {label}
                {required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className={`px-4 py-2.5 bg-[var(--input-bg)] border rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 transition-all ${
                    error 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' 
                        : 'border-[var(--input-border)] focus:border-blue-500/50 focus:ring-blue-500/30'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
}

// Form select component
export function FormSelect({ label, value, onChange, options }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all appearance-none cursor-pointer"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[var(--bg-app)] text-[var(--text-primary)]">
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

// Button component
export function Button({ children, onClick, variant = 'primary', disabled = false, className = '', type = 'button' }) {
    const variants = {
        primary: 'bg-blue-500 hover:bg-blue-600 text-white',
        danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30',
        secondary: 'bg-[var(--input-bg)] hover:bg-[var(--glass-bg-hover)] text-[var(--text-secondary)] border border-[var(--input-border)]',
    };
    
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}

// Confirmation Modal component - replaces ugly browser confirm()
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', confirmVariant = 'danger' }) {
    if (!isOpen) return null;
    
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
                    />
                    
                    {/* Modal */}
                    <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-sm pointer-events-auto"
                        >
                            <div className="bg-[var(--bg-app)] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden">
                                <div className="p-6 text-center">
                                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
                                    <p className="text-sm text-[var(--text-secondary)]">{message}</p>
                                </div>
                                <div className="flex gap-3 p-4 border-t border-[var(--glass-border)] bg-[var(--surface-highlight)]">
                                    <Button variant="secondary" onClick={onClose} className="flex-1">
                                        Cancel
                                    </Button>
                                    <Button variant={confirmVariant} onClick={onConfirm} className="flex-1">
                                        {confirmText}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
