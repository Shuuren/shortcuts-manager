# Shortcuts Manager - Product Requirements Document (PRD)

> **Document Version**: 2.0  
> **Last Updated**: December 14, 2025  
> **Purpose**: Comprehensive documentation of the current state and capabilities of the Shortcuts Manager application.

---

## 📋 Executive Summary

**Shortcuts Manager** is a modern, beautifully designed web application for managing keyboard shortcuts across multiple platforms and tools. It provides a unified interface to organize, search, edit, and export shortcuts for **LeaderKey**, **Raycast**, and **macOS System** shortcuts.

The application features a premium, polished UI with dark/light mode support, smooth animations, and an intuitive sidebar navigation system. It supports multi-user authentication with role-based access, undo/redo functionality with persistent history, and markdown export capabilities.

---

## 🎯 Product Overview

### Vision
A single source of truth for all keyboard shortcuts, making it easy for power users and productivity enthusiasts to manage, reference, and share their shortcut configurations.

### Target Users
- **Power Users**: Individuals who heavily customize their macOS workflow with keyboard shortcuts
- **Developers**: Engineers using tools like Raycast, terminal applications, and IDE shortcuts
- **Productivity Enthusiasts**: Users of LeaderKey and similar keyboard efficiency tools

### Key Value Propositions
1. **Unified Management**: All shortcuts from different platforms in one place
2. **Beautiful UI**: Premium, modern design with glassmorphism and smooth animations
3. **Powerful Organization**: Groups, apps, categories, and search functionality
4. **Collaboration**: Multi-user support with individual data isolation
5. **Export**: Markdown export for documentation and sharing

---

## 🏗️ Technical Architecture

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend Framework** | React | 19.2.0 |
| **Build Tool** | Vite | 7.2.4 |
| **Styling** | TailwindCSS | 3.4.17 |
| **Animations** | Framer Motion | 12.23.26 |
| **Icons** | Lucide React | 0.560.0 |
| **Backend** | Express.js | 5.2.1 |
| **Database** | MongoDB + Mongoose | 9.0.1 |
| **Authentication** | JWT + bcryptjs | 9.0.3 / 3.0.3 |
| **HTTP Compression** | compression | 1.8.1 |

### Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Views     │  │    UI       │  │   Context Providers │  │
│  │  (5 views)  │  │ Components  │  │  Auth, History,     │  │
│  │             │  │  (15+ UI)   │  │  Toast              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                           │                                  │
│                    ┌──────┴──────┐                          │
│                    │   App.jsx   │                          │
│                    │  (1050 LOC) │                          │
│                    └──────┬──────┘                          │
└───────────────────────────┼─────────────────────────────────┘
                            │ REST API
┌───────────────────────────┼─────────────────────────────────┐
│                    Backend (Express)                         │
│                    ┌──────┴──────┐                          │
│                    │  index.js   │                          │
│                    │  (412 LOC)  │                          │
│                    └──────┬──────┘                          │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │               │
│    ┌────┴────┐      ┌─────┴────┐     ┌──────┴─────┐        │
│    │ MongoDB │      │   Auth   │     │   Image    │        │
│    │  Users  │      │  Routes  │     │   Proxy    │        │
│    └─────────┘      └──────────┘     └────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
shortcuts_manager/
├── src/                              # Frontend React application
│   ├── App.jsx                       # Main application (1051 lines)
│   ├── main.jsx                      # React entry point with providers
│   ├── index.css                     # Global styles (~5KB)
│   ├── App.css                       # App-specific styles
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   └── Layout.jsx            # Sidebar navigation (284 lines)
│   │   │
│   │   ├── ui/                       # 15 Reusable UI Components
│   │   │   ├── AppForm.jsx           # App creation/editing
│   │   │   ├── AppSelector.jsx       # App selection dropdown
│   │   │   ├── AuthModal.jsx         # Login/registration modal
│   │   │   ├── CategorySelector.jsx  # Category selection UI
│   │   │   ├── ExportManager.jsx     # Markdown export tool
│   │   │   ├── GlassPanel.jsx        # Glassmorphism components
│   │   │   ├── GroupForm.jsx         # Group creation/editing
│   │   │   ├── ImageDropZone.jsx     # Drag & drop image upload
│   │   │   ├── ImageEditor.jsx       # Image cropping/editing
│   │   │   ├── Modal.jsx             # Generic modal component
│   │   │   ├── ProfileDropdown.jsx   # User profile menu
│   │   │   ├── SearchBar.jsx         # Global search
│   │   │   ├── ShortcutForm.jsx      # Shortcut creation/editing
│   │   │   ├── Toast.jsx             # Toast notifications
│   │   │   └── UndoRedoHint.jsx      # Keyboard shortcut hints
│   │   │
│   │   └── views/                    # 5 Main View Components
│   │       ├── LeaderView.jsx        # LeaderKey view (620 lines)
│   │       ├── RaycastView.jsx       # Raycast view (397 lines)
│   │       ├── SystemView.jsx        # System shortcuts (346 lines)
│   │       ├── AppsView.jsx          # App library (202 lines)
│   │       └── HistoryView.jsx       # Change history (367 lines)
│   │
│   ├── context/
│   │   ├── AuthContext.jsx           # Authentication state (160 lines)
│   │   └── HistoryContext.jsx        # Undo/redo history (235 lines)
│   │
│   └── config/
│       ├── api.js                    # API endpoint configuration
│       ├── categories.js             # Category icon mappings
│       └── icons.js                  # App icon URL mappings
│
├── server/                           # Backend Express application
│   ├── index.js                      # Main server (412 lines)
│   ├── db.json                       # Admin shortcuts database (~700KB)
│   ├── demo_db.json                  # Demo user database (~771KB)
│   ├── user_*_db.json                # Per-user databases
│   ├── .env                          # Environment variables
│   │
│   ├── middleware/
│   │   └── auth.js                   # JWT verification middleware
│   │
│   ├── models/
│   │   └── User.js                   # MongoDB User schema
│   │
│   └── routes/
│       └── auth.js                   # Authentication routes
│
├── public/
│   └── sparkle.svg                   # App favicon
│
├── dist/                             # Production build output
├── package.json                      # Frontend dependencies
├── vite.config.js                    # Vite build configuration
├── tailwind.config.js                # TailwindCSS configuration
└── render.yaml                       # Render deployment config
```

---

## 🎨 User Interface & Features

### Navigation System

The application uses a **collapsible sidebar navigation** with the following features:

| Navigation Item | Route | Description | Access |
|-----------------|-------|-------------|--------|
| **LeaderKey** | `/leader` | Hierarchical key sequence shortcuts | All users |
| **Raycast** | `/raycast` | Raycast extension shortcuts | All users |
| **System** | `/system` | macOS system shortcuts | All users |
| **Apps** | `/apps` | Application library with linked shortcuts | All users |
| **Export** | `/export` | Markdown export manager | All users |
| **History** | `/history` | Change history with undo/redo | Editors only |

**Sidebar Features**:
- Pin/unpin toggle for persistent or hover-based visibility
- Smooth expand/collapse animations
- Dark/light theme toggle with sun/moon icon transition
- Profile dropdown with login/logout

### URL Routing

The application implements client-side routing using `history.pushState`:

```javascript
const ROUTE_MAP = {
  '/': 'leader',
  '/leader': 'leader',
  '/leaderkey': 'leader',
  '/raycast': 'raycast',
  '/system': 'system',
  '/apps': 'apps',
  '/export': 'export',
  '/history': 'history',
};
```

- Direct URL access supported
- Browser back/forward navigation works
- URL updates on tab change
- Persists view on page refresh

---

## 📊 Data Views

### 1. LeaderKey View (`/leader`)

**Purpose**: Display and manage LeaderKey shortcuts with hierarchical navigation

**Features**:
- **Tree-based navigation**: Drill into groups using key sequences
- **Breadcrumb trail**: Visual path showing current location
- **Group cards**: Display groups with icons, colors, and shortcut counts
- **Shortcut cards**: Individual shortcuts with key display
- **Search integration**: Filters and prunes tree based on search query
- **Edit capabilities**: Inline edit buttons for shortcuts and groups

**Visual Design**:
- Glass-morphic cards with subtle gradients
- Custom app icons with fallback to generic icons
- Animated transitions between groups
- Hover effects with color changes

### 2. Raycast View (`/raycast`)

**Purpose**: Display Raycast extension shortcuts grouped by category

**Features**:
- **Categorized display**: Shortcuts organized by functionality groups
- **Key visual rendering**: macOS-style key symbols (⌘, ⌥, ⇧, ⌃)
- **Hyper key support**: Diamond icon for Hyper key combinations
- **App icons**: Automatic icon fetching for known applications
- **Search filtering**: Filter by action name, keys, or alias

**Key Symbol Mapping**:
| Modifier | Symbol |
|----------|--------|
| Command | ⌘ |
| Control | ⌃ |
| Option | ⌥ |
| Shift | ⇧ |
| Hyper | ◆ |

### 3. System View (`/system`)

**Purpose**: Display macOS system shortcuts by application/functionality

**Features**:
- **Functionality grouping**: Organized by system area (Desktop, Windows, etc.)
- **Key visualization**: Same symbol system as Raycast view
- **Special action badges**: Visual indicators for double-tap, hold, etc.
- **Category icons**: Context-appropriate icons per functionality
- **Edit mode**: Inline editing for authenticated users

### 4. Apps View (`/apps`)

**Purpose**: Manage application library and linked shortcuts

**Features**:
- **App cards**: Display apps with custom icons and categories
- **Link badges**: Show which shortcut types (Leader, Raycast, System) are linked
- **Category filtering**: Organize apps by category
- **Custom icons**: Upload or URL-based app icons
- **Shortcut linking**: Associate shortcuts with their parent applications

**App Categories**:
- AI, Applications, Bookmarks, Browsers
- Clipboard, Design, Development, Focus
- Media, System, Window Management, Utilities, Launcher

### 5. History View (`/history`)

**Purpose**: Display change history with undo/redo capabilities

**Features**:
- **Change timeline**: Chronological list of all changes
- **Action types**: Create, Update, Delete, Revert with color coding
- **Entity details**: Shows what was changed (shortcut, group, app)
- **Before/after comparison**: Expandable diff view for updates
- **Revert/Re-apply**: One-click undo of individual changes
- **Delete entries**: Remove specific history items
- **Clear all**: Reset entire history
- **Persistent storage**: survives page refresh via localStorage

**Action Color Coding**:
| Action | Gradient |
|--------|----------|
| Create | Green to Emerald |
| Update | Blue to Cyan |
| Delete | Red to Rose |
| Revert | Amber to Orange |

### 6. Export Manager (`/export`)

**Purpose**: Export shortcuts to Markdown format

**Features**:
- **Type selection**: Choose which shortcut types to export
- **Preview count**: Shows number of shortcuts per type
- **Markdown generation**: Clean, formatted output
- **Download**: One-click file download
- **Selectable exports**: Toggle individual types on/off

---

## 🔐 Authentication System

### User Roles & Permissions

| Role | Description | Data Access | Can Edit |
|------|-------------|-------------|----------|
| **Admin** | Full administrative access | Own database | ✅ Yes |
| **Demo** | Demonstration account | Demo database | ✅ Yes (isolated) |
| **Client** | Regular registered user | Own database | ✅ Yes |
| **Guest** | Not logged in | Demo database (read-only) | ❌ No |

### Authentication Flow

```
┌──────────┐    POST /api/auth/login    ┌──────────┐
│  Client  │ ─────────────────────────► │  Server  │
└──────────┘                            └──────────┘
                                              │
                    ◄─ JWT Token + User Data ─┘
                                              
┌──────────┐    Authorization: Bearer    ┌──────────┐
│  Client  │ ─────────────────────────► │  Server  │
│ (+ Token)│                            │(Validate)│
└──────────┘                            └──────────┘
```

### JWT Implementation
- **Token Storage**: localStorage
- **Token Contents**: User ID, username, role, display name
- **Verification Middleware**: Applied to all `/api/shortcuts` routes
- **Token Expiry**: Configurable via JWT_SECRET

### Default Accounts
| Username | Password | Role |
|----------|----------|------|
| `renshu` | `renshu123` | Admin |
| `gabby_demo` | `gabby123` | Demo |

---

## 💾 Data Models

### Shortcut Schema

```json
{
  "id": "unique-uuid",
  "action": "Open Application",
  "key": "a",
  "modifiers": ["cmd", "shift"],
  "sequence": ["leader", "a", "s"],
  "group": "group-id",
  "type": "leader",
  "description": "Optional description text",
  "iconUrl": "https://example.com/icon.png"
}
```

### Group Schema

```json
{
  "id": "group-uuid",
  "name": "Applications",
  "key": "a",
  "icon": "🚀",
  "iconUrl": "https://example.com/group-icon.png",
  "color": "#ff5733",
  "parent": "parent-group-id"
}
```

### App Schema

```json
{
  "id": "app-uuid",
  "name": "Visual Studio Code",
  "icon": "base64-encoded-or-url",
  "category": "Development",
  "linkedShortcuts": ["shortcut-id-1", "shortcut-id-2"],
  "linkedRaycastShortcuts": ["raycast-shortcut-id"],
  "linkedSystemShortcuts": ["system-shortcut-id"]
}
```

### Database Collections

| Type | LeaderKey | Raycast | System |
|------|-----------|---------|--------|
| **Shortcuts** | `shortcuts` | `raycastShortcuts` | `systemShortcuts` |
| **Groups** | `groups` | `raycastGroups` | `systemGroups` |

---

## 🌐 API Reference

### Base URLs
- **Development**: `http://localhost:3001/api`
- **Production**: `/api` (same origin)

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/login` | User login | ❌ |
| `POST` | `/api/auth/register` | User registration | ❌ |
| `GET` | `/api/auth/me` | Get current user | ✅ |
| `PUT` | `/api/auth/me` | Update profile | ✅ |

### Shortcuts CRUD Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/shortcuts` | Get all data (role-based) | ❌* |
| `POST` | `/api/shortcuts/:type` | Create item | ✅ |
| `PUT` | `/api/shortcuts/:type/:id` | Update item | ✅ |
| `DELETE` | `/api/shortcuts/:type/:id` | Delete item | ✅ |

*Guest users see demo database in read-only mode

**Type Parameter Values**:
- `shortcuts` / `groups` (LeaderKey)
- `raycastShortcuts` / `raycastGroups`
- `systemShortcuts` / `systemGroups`
- `apps`

### Utility Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check for deployment |
| `GET` | `/api/proxy-image?url=...` | CORS proxy for external images |

---

## ⚡ State Management

### Context Providers

```jsx
<AuthProvider>           {/* Authentication state */}
  <HistoryProvider>      {/* Undo/redo history */}
    <ToastProvider>      {/* Toast notifications */}
      <App />
    </ToastProvider>
  </HistoryProvider>
</AuthProvider>
```

### AuthContext

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `user` | Object | Current user data |
| `token` | String | JWT token |
| `loading` | Boolean | Auth check in progress |
| `isAdmin` | Boolean | Admin role check |
| `isDemo` | Boolean | Demo role check |
| `isAuthenticated` | Boolean | Logged in check |
| `canEdit` | Boolean | Edit permission |
| `login(username, password)` | Function | Login handler |
| `register(...)` | Function | Registration handler |
| `logout()` | Function | Logout handler |
| `updateProfile(updates)` | Function | Profile update handler |

### HistoryContext

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `history` | Array | All change entries |
| `currentIndex` | Number | Current position in history |
| `addChange(change)` | Function | Record new change |
| `canUndo` | Boolean | Undo available check |
| `canRedo` | Boolean | Redo available check |
| `getUndoEntry()` | Function | Get entry to undo |
| `getRedoEntry()` | Function | Get entry to redo |
| `markAsReverted(id)` | Function | Mark entry as reverted |
| `markAsApplied(id)` | Function | Mark entry as applied |
| `clearHistory()` | Function | Clear all history |
| `deleteEntry(id)` | Function | Delete specific entry |
| `setCurrentUser(userId)` | Function | Associate history with user |

**Persistence**: History is stored in `localStorage` with keys:
- `shortcuts_manager_history` - Change entries (JSON)
- `shortcuts_manager_history_index` - Current position
- `shortcuts_manager_history_user` - User ID for isolation

---

## 🎨 Design System

### Theme Support

**Dark Mode** (Default):
- Background: Dark gray gradients
- Cards: Glass-morphic with blur
- Text: White/light gray
- Accents: Vibrant colors

**Light Mode**:
- Background: Light gradients
- Cards: Subtle shadows
- Text: Dark gray/black
- Accents: Muted vibrant colors

### Animation System

Built with **Framer Motion**:

| Component | Animation |
|-----------|-----------|
| Page transitions | Fade + slide |
| Cards | Scale on hover |
| Modals | Spring + fade |
| Sidebar | Slide in/out |
| Theme toggle | Sun/moon rotation |
| List items | Staggered entrance |

### Icon System

**Primary**: Lucide React icons
**App Icons**: Centralized URL mappings in `/src/config/icons.js`
**Category Icons**: Mapped in `/src/config/categories.js`

### Color Palette

| Category | Light Mode | Dark Mode |
|----------|------------|-----------|
| Primary | Blue-500 | Blue-400 |
| Success | Green-500 | Green-400 |
| Warning | Amber-500 | Amber-400 |
| Danger | Red-500 | Red-400 |
| Background | Gray-50 | Gray-900 |

---

## 🚀 Deployment

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `PORT` | Server port (default: 3001) | ❌ |
| `VITE_API_URL` | API URL for frontend | ❌ |

### Build Commands

```bash
# Development
npm run dev          # Start Vite dev server
cd server && npm run dev  # Start Express with nodemon

# Production
npm run build        # Build frontend to /dist
npm run preview      # Preview production build
```

### Render Deployment

The application is configured for **Render** deployment via `render.yaml`:
- Frontend: Static site from `/dist`
- Backend: Web service running Express
- Combined: Single unified deployment

---

## 🔧 Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘ + Z` | Undo last change |
| `⌘ + ⇧ + Z` | Redo last undone change |
| `Escape` | Close modal/sidebar |

### Navigation

| Shortcut | Action |
|----------|--------|
| `/` + search term | Focus search |
| Arrow keys | Navigate in views (planned) |

---

## 📈 Performance Optimizations

### Frontend
- **Code Splitting**: Lazy loading planned for views
- **Memoization**: `useMemo` and `useCallback` for expensive operations
- **Virtualization**: Planned for large lists
- **Image Optimization**: Proxy for external images

### Backend
- **Compression**: Gzip via `compression` middleware
- **JSON Limits**: 100MB payload support for images
- **MongoDB Indexing**: User and role-based queries

---

## 🧪 Testing Checklist

### Authentication
- [ ] Admin login/logout works
- [ ] Demo user sees isolated data
- [ ] Guest sees read-only demo data
- [ ] Token persists across refresh
- [ ] Registration creates new user

### CRUD Operations
- [ ] Create/Edit/Delete shortcuts (all types)
- [ ] Create/Edit/Delete groups (all types)
- [ ] Create/Edit/Delete apps
- [ ] Link shortcuts to apps

### UI/UX
- [ ] Theme toggle works
- [ ] Sidebar pin/unpin works
- [ ] Search filters correctly
- [ ] Modals open/close (ESC key)
- [ ] Undo/Redo via keyboard
- [ ] History persists refresh
- [ ] URL routing works

### Export
- [ ] Markdown export generates correctly
- [ ] File download works
- [ ] Type selection filters output

---

## 📝 Known Issues & Limitations

1. **History per-user isolation**: History clears when switching users
2. **Image upload size**: Large base64 images may slow UI
3. **Mobile responsiveness**: Primarily desktop-focused
4. **Offline support**: Requires network for data operations

---

## 🔮 Future Considerations

1. **Shortcut import**: Parse Raycast/Karabiner configs
2. **Sync across devices**: Cloud sync capability
3. **Shortcut templates**: Pre-built shortcut libraries
4. **Conflict detection**: Identify duplicate key combinations
5. **Keyboard recording**: Capture shortcuts directly
6. **PWA support**: Installable app experience

---

## 📞 Quick Reference

### Development URLs
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **API Health**: http://localhost:3001/api/health

### Database Files (Legacy/Backup)
- `server/db.json` - Admin data
- `server/demo_db.json` - Demo data
- `server/user_*_db.json` - Individual user data

### Key Files to Debug
- `src/App.jsx` - Main application logic
- `src/context/HistoryContext.jsx` - Undo/redo
- `src/context/AuthContext.jsx` - Authentication
- `server/index.js` - API routes
- `server/middleware/auth.js` - JWT verification

---

*This PRD reflects the current state of the Shortcuts Manager application as of December 14, 2025.*
