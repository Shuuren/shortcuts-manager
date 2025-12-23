#!/usr/bin/env python3
"""
Migration script: Move raycastShortcuts 'extension' field to 'category'

This script:
1. Reads demo_db.json (and db.json if exists)
2. For each raycastShortcut:
   - If 'extension' exists and 'category' is empty/doesn't exist: copy extension → category
   - Remove the 'extension' field
3. Saves the updated file
"""

import json
import os
from pathlib import Path

def migrate_file(filepath):
    """Migrate a single db file"""
    if not os.path.exists(filepath):
        print(f"Skipping {filepath} - file not found")
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if 'raycastShortcuts' not in data:
        print(f"Skipping {filepath} - no raycastShortcuts found")
        return False
    
    modified = False
    for shortcut in data['raycastShortcuts']:
        extension_val = shortcut.get('extension')
        category_val = shortcut.get('category')
        
        # If extension exists and category is empty/missing, migrate
        if extension_val and not category_val:
            shortcut['category'] = extension_val
            modified = True
            print(f"  Migrated: '{shortcut.get('commandName', 'unknown')}' → category='{extension_val}'")
        
        # Remove extension field if exists
        if 'extension' in shortcut:
            del shortcut['extension']
            modified = True
    
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✓ Updated {filepath}")
    else:
        print(f"No changes needed for {filepath}")
    
    return modified

def main():
    script_dir = Path(__file__).parent
    
    # Files to migrate
    files = [
        script_dir / 'demo_db.json',
        script_dir / 'db.json',
    ]
    
    print("=" * 50)
    print("Migrating 'extension' → 'category' for raycastShortcuts")
    print("=" * 50)
    
    for filepath in files:
        print(f"\nProcessing {filepath.name}...")
        migrate_file(str(filepath))
    
    print("\n" + "=" * 50)
    print("Migration complete!")
    print("=" * 50)

if __name__ == '__main__':
    main()
