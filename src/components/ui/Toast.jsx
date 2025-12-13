import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

// Toast Context
const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Toast Provider Component
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = {
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        info: (message, duration) => addToast(message, 'info', duration),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

// Toast Container
function ToastContainer({ toasts, removeToast }) {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
            <AnimatePresence>
                {toasts.map(toast => (
                    <Toast key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </AnimatePresence>
        </div>
    );
}

// Individual Toast Component
function Toast({ toast, onRemove }) {
    useEffect(() => {
        if (toast.duration > 0) {
            const timer = setTimeout(() => {
                onRemove(toast.id);
            }, toast.duration);
            return () => clearTimeout(timer);
        }
    }, [toast.id, toast.duration, onRemove]);

    const icons = {
        success: <CheckCircle size={18} className="text-green-600 dark:text-green-400" />,
        error: <XCircle size={18} className="text-red-600 dark:text-red-400" />,
        info: <Info size={18} className="text-blue-600 dark:text-blue-400" />,
    };

    const borderColors = {
        success: 'border-l-green-500',
        error: 'border-l-red-500',
        info: 'border-l-blue-500',
    };

    const bgColors = {
        success: 'bg-green-500/10',
        error: 'bg-red-500/10',
        info: 'bg-blue-500/10',
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg backdrop-blur-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] border-l-4 ${borderColors[toast.type]} ${bgColors[toast.type]} shadow-lg min-w-[280px] max-w-[400px]`}
        >
            {icons[toast.type]}
            <span className="flex-1 text-sm text-[var(--text-primary)]">{toast.message}</span>
            <button 
                onClick={() => onRemove(toast.id)}
                className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-1"
            >
                <X size={14} />
            </button>
        </motion.div>
    );
}
