import json
import os

db_path = '/Users/renshuuuu/renshuDB/shortcuts_manager/server/db.json'

def load_db():
    with open(db_path, 'r') as f:
        return json.load(f)

def save_db(data):
    with open(db_path, 'w') as f:
        json.dump(data, f, indent=2)

def main():
    data = load_db()
    
    # 1. Add missing apps
    existing_app_ids = {app['id'] for app in data['appsLibrary']}
    
    new_apps = [
        {"id": "app_cleanshot", "name": "CleanShot X", "category": "Screenshots", "tags": ["screenshot", "capture"], "bundleId": "com.getcleanshot.app"},
        {"id": "app_tot", "name": "Tot", "category": "Productivity", "tags": ["notes", "scratchpad"], "bundleId": "com.iconfactory.Tot"},
        {"id": "app_antinote", "name": "Antinote", "category": "Productivity", "tags": ["notes"], "bundleId": ""},
        {"id": "app_pastepal", "name": "PastePal", "category": "Clipboard", "tags": ["clipboard", "manager"], "bundleId": "com.onmyway133.PastePal"},
        {"id": "app_lookaway", "name": "LookAway", "category": "Health", "tags": ["focus", "break"], "bundleId": "com.mysticmuffin.LookAway"},
        {"id": "app_supercharge", "name": "Supercharge", "category": "Clutter", "tags": ["system"], "bundleId": ""},
        {"id": "app_supasidebar", "name": "SupaSidebar", "category": "Productivity", "tags": ["sidebar"], "bundleId": ""},
        {"id": "app_bloom", "name": "Bloom", "category": "Productivity", "tags": ["search"], "bundleId": ""},
        {"id": "app_homerow", "name": "Homerow", "category": "Clutter", "tags": ["navigation"], "bundleId": "com.homerow.app"},
        {"id": "app_mouseless", "name": "Mouseless", "category": "Clutter", "tags": ["navigation"], "bundleId": ""},
        {"id": "app_hazeover", "name": "HazeOver", "category": "Clutter", "tags": ["focus"], "bundleId": "com.pointum.hazeover"},
        {"id": "app_loop", "name": "Loop", "category": "Clutter", "tags": ["window-management"], "bundleId": "com.mrkai77.Loop"},
        {"id": "app_raycast", "name": "Raycast", "category": "Clutter", "tags": ["launcher"], "bundleId": "com.raycast.macos"},
        {"id": "app_spotlight", "name": "Spotlight", "category": "Clutter", "tags": ["launcher"], "bundleId": ""},
        {"id": "app_dropover", "name": "Dropover", "category": "Clutter", "tags": ["dragdrop"], "bundleId": "ck.tnt.dropover"},
        {"id": "app_voiceink", "name": "VoiceInk", "category": "Productivity", "tags": ["transcription"], "bundleId": ""},
        {"id": "app_reminders", "name": "Reminders", "category": "Productivity", "tags": ["tasks", "apple"], "bundleId": "com.apple.reminders"},
        {"id": "app_finder", "name": "Finder", "category": "System", "tags": ["files", "apple"], "bundleId": "com.apple.finder"},
    ]
    
    for app in new_apps:
        if app['id'] not in existing_app_ids:
            # Add iconUrl placeholder if missing
            if 'iconUrl' not in app:
                app['iconUrl'] = None
            if 'notes' not in app:
                app['notes'] = None
            data['appsLibrary'].append(app)
            print(f"Added app: {app['name']}")

    # Re-build lookup map
    app_map = {app['id']: app['id'] for app in data['appsLibrary']} # ID -> ID
    
    # Name/Context -> ID mapping
    context_to_id = {
        "ChatGPT mini chat": "app_chatgpt",
        "ChatGPT": "app_chatgpt",
        "Tot (menubar)": "app_tot",
        "Antinote": "app_antinote",
        "PastePal": "app_pastepal",
        "LookAway": "app_lookaway",
        "Supercharge": "app_supercharge",
        "SupaSidebar": "app_supasidebar",
        "Bloom": "app_bloom",
        "Homerow": "app_homerow",
        "Mouseless": "app_mouseless",
        "HazeOver": "app_hazeover",
        "Loop": "app_loop",
        "Raycast": "app_raycast",
        "Spotlight": "app_spotlight",
        "CleanShot X": "app_cleanshot",
        "Dropover": "app_dropover",
        "VoiceInk": "app_voiceink",
        "RemindersMenuBar": "app_reminders",
        "Apple Music": "app_music",
        "Apple Podcasts": "app_podcasts",
        "Apple Notes": "app_notes",
        "Notes": "app_notes",
        "Notion": "app_notion",
        "Comet": "app_comet",
        "Safari": "app_safari",
        "Helium": "app_helium",
        "Antigravity": "app_antigravity",
        "Visual Studio Code": "app_vscode",
        "VS Code": "app_vscode",
        "Cursor": "app_cursor",
        "Discord": "app_discord",
        "Beeper": "app_beeper",
        "Ghostty": "app_ghostty",
        "Apple Calendar": "app_calendar",
        "Calendar": "app_calendar",
        "Finder": "app_finder"
    }

    # 2. Process System Shortcuts
    new_system_shortcuts = []
    for sc in data['systemShortcuts']:
        # Remove redundant notes shortcut
        if sc['id'] == 'sys_notes_hyper':
            print("Removed redundant sys_notes_hyper")
            continue
            
        # Link App ID
        if 'appOrContext' in sc and sc['appOrContext']:
            ctx = sc['appOrContext']
            if ctx in context_to_id:
                sc['appId'] = context_to_id[ctx]
                print(f"Linked {sc['id']} to {sc['appId']}")
            
            # Special case for "System/Media" -> Music? No, could be generic.
            if ctx == "System/Media":
               # sys_music_* imply Music app usually, but can be generic. 
               # Given "Toggle play/pause (Music)" in comments/action, let's link to Music if explicit.
               if "Music" in sc.get('action', '') or "track" in sc.get('action', ''):
                   sc['appId'] = "app_music"
                   print(f"Linked {sc['id']} to app_music (inferred)")

        new_system_shortcuts.append(sc)
    data['systemShortcuts'] = new_system_shortcuts

    # 3. Process Raycast Shortcuts
    for sc in data['raycastShortcuts']:
        # Try to match extension or commandName to app
        ext = sc.get('extension')
        if ext in context_to_id:
             sc['appId'] = context_to_id[ext]
             print(f"Linked Raycast {sc['id']} to {sc['appId']}")
        
        # Explicit known ones
        if sc['id'] == 'raycast_app_notes':
            sc['appId'] = 'app_notes'
        if sc['id'] == 'raycast_app_music':
            sc['appId'] = 'app_music'
        if sc['id'] == 'raycast_app_podcasts':
            sc['appId'] = 'app_podcasts'
        if sc['id'] == 'raycast_app_cal':
            sc['appId'] = 'app_calendar'
        if sc['id'] == 'raycast_app_reminders':
            sc['appId'] = 'app_reminders'
    
    # 4. Process Leader Shortcuts
    for sc in data['leaderShortcuts']:
        if 'app' in sc and sc['app']:
            app_name = sc['app']
            if app_name in context_to_id:
                sc['appId'] = context_to_id[app_name]
                print(f"Linked Leader {sc['key']} to {sc['appId']}")

    save_db(data)
    print("Database updated successfully.")

if __name__ == "__main__":
    main()
