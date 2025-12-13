// Centralized app icon URLs
export const appIcons = {
    // Browsers
    'comet': 'https://w.namu.la/s/eb1a2e1bf43b04f8b7e3ea0cf19cdd59a4f79dcb56f6f77b50d9dfe2dc35ae8f7d3f33df7b54eca74d1f2fc4fac8b67e09f6a91bb44b8cba3ad9d80f79dfadc63de8aaba19785be6a72ed8da0e50aad32a1cd7e9daa31dc46ea8d5ea03f58e59',
    'safari': 'https://upload.wikimedia.org/wikipedia/commons/5/52/Safari_browser_logo.svg',
    'helium': 'https://helium.computer/favicon.ico',
    
    // Apps
    'discord': 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png',
    'notion': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
    'chatgpt': 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
    'beeper': 'https://www.beeper.com/favicon.ico',
    'beeper desktop': 'https://www.beeper.com/favicon.ico',
    'raindrop': 'https://raindrop.io/favicon.ico',
    'raindrop.io': 'https://raindrop.io/favicon.ico',
    'cleanshot x': 'https://cleanshot.com/img/logo.svg',
    'apple notes': 'https://help.apple.com/assets/65E093EBCCC9E70AE8077F93/65E093ECCCC9E70AE8077F9A/en_US/10f02b132a3cb8df056beb34f1cb3ad6.png',
    'apple music': 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Apple_Music_icon.svg',
    'apple podcasts': 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Podcasts_%28iOS%29.svg',
    'perplexity': 'https://www.perplexity.ai/favicon.ico',
    'perplexity in comet': 'https://www.perplexity.ai/favicon.ico',
    'visual studio code': 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Visual_Studio_Code_1.35_icon.svg',
    'cursor': 'https://cursor.sh/favicon.ico',
    'antigravity': 'https://www.google.com/s2/favicons?domain=google.com&sz=64',
    'ghostty': 'https://ghostty.org/apple-touch-icon.png',
    'lookaway': 'https://www.google.com/s2/favicons?domain=lookaway.app&sz=64',
    'hazeover': 'https://hazeover.com/favicon.ico',
    'supercharge': 'https://www.google.com/s2/favicons?domain=supercharge.app&sz=64',
    'bloom': 'https://bloomapp.club/favicon.ico',
    'dictionary': 'https://www.google.com/s2/favicons?domain=apple.com&sz=64',
    'calendar': 'https://www.google.com/s2/favicons?domain=calendar.google.com&sz=64',
    'system': 'https://www.google.com/s2/favicons?domain=apple.com&sz=64',
    'tot': 'https://tot.rocks/favicon.ico',
    'reminders': 'https://www.google.com/s2/favicons?domain=apple.com&sz=64',
    'remindersmenubar': 'https://www.google.com/s2/favicons?domain=apple.com&sz=64',
    'antinote': 'https://www.google.com/s2/favicons?domain=antinote.app&sz=64',
    'pastepal': 'https://www.google.com/s2/favicons?domain=pastepal.app&sz=64',
    'system/media': 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Apple_Music_icon.svg',
    'snippets': 'https://www.google.com/s2/favicons?domain=raycast.com&sz=64',
    'supasidebar': 'https://www.google.com/s2/favicons?domain=supasidebar.com&sz=64',
    'bartender': 'https://www.macbartender.com/favicon.ico',
    'voiceink': 'https://www.google.com/s2/favicons?domain=voiceink.app&sz=64',
    'dropover': 'https://dropoverapp.com/favicon.ico',
    'raycast': 'https://raycast.com/favicon.ico',
};

// Category icons for leader view
export const categoryIcons = {
    'applications': 'https://www.google.com/s2/favicons?domain=apple.com&sz=64',
    'browsers': 'https://upload.wikimedia.org/wikipedia/commons/5/52/Safari_browser_logo.svg',
    'bookmarks': 'https://raindrop.io/favicon.ico',
    'cleanshot x': 'https://cleanshot.com/img/logo.svg',
    'lookaway': 'https://www.google.com/s2/favicons?domain=lookaway.app&sz=64',
    'media': 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Apple_Music_icon.svg',
    'quick actions': null, // Will use generic icon
    'search': null, // Will use generic icon
    'window/system': 'https://www.google.com/s2/favicons?domain=apple.com&sz=64',
    'coding': 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Visual_Studio_Code_1.35_icon.svg',
    'ai': 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
};

// Get icon URL for an app/category
export const getAppIcon = (name) => {
    if (!name) return null;
    const lower = name.toLowerCase();
    return appIcons[lower] || categoryIcons[lower] || null;
};
