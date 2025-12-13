import { 
    Monitor, AppWindow, Keyboard, Settings, Camera, Folder, Zap, 
    Volume2, Layout, Terminal, Box, Globe, MessageSquare, 
    Code, PenTool, Clipboard, Search, Bookmark, Command,
    Cpu, Grid, Layers, MousePointer, StickyNote, CheckSquare
} from 'lucide-react';

// Simplified Core Categories based on user feedback
export const CATEGORY_ICONS = {
    'AI': Cpu,
    'Applications': AppWindow,
    'Bookmarks': Bookmark,
    'Browsers': Globe,
    'Clipboard': Clipboard,
    'Design': PenTool,
    'Development': Code,
    'Focus': Zap,
    'Media': Volume2,
    'System': Monitor,
    'Window Management': Layout,
    'Utilities': Settings,
    'Launcher': Command,
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
