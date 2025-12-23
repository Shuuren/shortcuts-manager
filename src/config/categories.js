import { 
    Monitor, AppWindow, Settings, Zap, 
    Volume2, Layout, Box, Globe, 
    Code, Clipboard, Command, Cpu
} from 'lucide-react';

// Core Categories - commonly used groupings
export const CATEGORY_ICONS = {
    'AI': Cpu,
    'Applications': AppWindow,
    'Browsers': Globe,
    'Clipboard': Clipboard,
    'Code': Code,
    'Development': Code,
    'Focus': Zap,
    'Launcher': Command,
    'Media': Volume2,
    'System': Monitor,
    'Utilities': Settings,
    'Window Management': Layout,
    'Other': Box,
    'Uncategorized': Box
};

// Fallback icon
export const DefaultCategoryIcon = Box;

// Helper to get icon for a category name
export const getCategoryIcon = (categoryName) => {
    if (!categoryName) return DefaultCategoryIcon;
    const normalized = Object.keys(CATEGORY_ICONS).find(k => k.toLowerCase() === categoryName.toLowerCase());
    
    // Handle specific mappings for merged categories
    if (!normalized) {
        const lower = categoryName.toLowerCase();
        if (lower.includes('focus')) return CATEGORY_ICONS['Focus'];
        if (lower.includes('window')) return CATEGORY_ICONS['Window Management'];
        if (lower === 'launcher') return CATEGORY_ICONS['Launcher'];
    }
    
    return CATEGORY_ICONS[normalized] || CATEGORY_ICONS[categoryName] || DefaultCategoryIcon;
};

// Consolidated list of all standard categories for suggestions
export const STANDARD_CATEGORIES = Object.keys(CATEGORY_ICONS).filter(k => k !== 'Uncategorized').sort();
