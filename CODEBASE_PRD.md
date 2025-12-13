# Shortcuts Manager - Codebase Documentation for Debugging

> **Purpose**: This document provides comprehensive context for MCP agents or AI assistants to understand, debug, and improve this codebase.

---

## 📋 Project Overview

**Name**: Shortcuts Manager  
**Description**: A web application for managing keyboard shortcuts across different platforms and tools (LeaderKey, Raycast, System shortcuts). It provides a beautiful UI to organize, search, edit, and export shortcuts.

**Tech Stack**:
- **Frontend**: React 19 + Vite 7 + TailwindCSS
- **Backend**: Express.js 5 + MongoDB (with JSON file fallback)
- **Authentication**: JWT-based with bcryptjs
- **Styling**: TailwindCSS + Framer Motion animations
- **Icons**: Lucide React

---

## 🏗️ Architecture

### Directory Structure

```
shortcuts_manager/
├── src/                          # Frontend React application
│   ├── App.jsx                   # Main application component (850 lines)
│   ├── main.jsx                  # React entry point
│   ├── index.css                 # Global styles
│   ├── App.css                   # App-specific styles
│   ├── components/
│   │   ├── layout/
│   │   │   └── Layout.jsx        # Main layout with sidebar navigation
│   │   ├── ui/                   # Reusable UI components
│   │   │   ├── AuthModal.jsx     # Login/registration modal
│   │   │   ├── Modal.jsx         # Generic modal component
│   │   │   ├── ShortcutForm.jsx  # Form for creating/editing shortcuts
│   │   │   ├── GroupForm.jsx     # Form for creating/editing groups
│   │   │   ├── AppForm.jsx       # Form for creating/editing apps
│   │   │   ├── SearchBar.jsx     # Global search component
│   │   │   ├── GlassPanel.jsx    # Glassmorphism panel component
│   │   │   ├── ProfileDropdown.jsx # User profile menu
│   │   │   ├── ExportManager.jsx # Export shortcuts to Markdown
│   │   │   ├── ImageDropZone.jsx # Drag & drop image upload
│   │   │   ├── ImageEditor.jsx   # Image cropping/editing
│   │   │   ├── AppSelector.jsx   # App selection dropdown
│   │   │   ├── Toast.jsx         # Toast notifications
│   │   │   └── UndoRedoHint.jsx  # Keyboard shortcut hints
│   │   └── views/                # Main view components
│   │       ├── LeaderView.jsx    # LeaderKey shortcuts view
│   │       ├── RaycastView.jsx   # Raycast shortcuts view
│   │       ├── SystemView.jsx    # System shortcuts view
│   │       ├── AppsView.jsx      # App library view
│   │       └── HistoryView.jsx   # Change history view
│   ├── context/
│   │   ├── AuthContext.jsx       # Authentication state management
│   │   └── HistoryContext.jsx    # Undo/redo history management
│   └── config/
│       └── (config files)
│
├── server/                       # Backend Express application
│   ├── index.js                  # Main server file (323 lines)
│   ├── db.json                   # Admin user's shortcuts database (~771KB)
│   ├── demo_db.json              # Demo user's shortcuts database (~771KB)
│   ├── .env                      # Environment variables
│   ├── .env.example              # Environment template
│   ├── middleware/
│   │   └── auth.js               # JWT verification middleware
│   ├── models/
│   │   └── User.js               # MongoDB User model
│   └── routes/
│       └── auth.js               # Authentication routes
│
├── package.json                  # Frontend dependencies
├── vite.config.js                # Vite configuration
├── tailwind.config.js            # TailwindCSS configuration
└── index.html                    # HTML entry point
```

---

## 🔐 Authentication System

### User Roles
| Role | Description | Database Access |
|------|-------------|-----------------|
| `admin` | Full access, manages main database | `db.json` |
| `demo` | Demo user, isolated sandbox | `demo_db.json` |
| `client` | Regular user (empty data) | Own data |
| Not logged in | View-only showcase mode | `demo_db.json` (read-only) |

### Credentials
- **Admin**: `renshu` / `renshu123`
- **Demo**: `gabby_demo` / `gabby123`

### JWT Flow
1. User logs in via `/api/auth/login`
2. Server returns JWT token
3. Token stored in `localStorage`
4. All API requests include `Authorization: Bearer <token>` header
5. `verifyToken` middleware validates token on each request

---

## 📊 Data Models

### Shortcuts (db.json / demo_db.json structure)

```json
{
  "shortcuts": [
    {
      "id": "unique-id",
      "action": "Action name",
      "key": "a",
      "modifiers": ["cmd", "shift"],
      "group": "group-id",
      "type": "leader",
      "description": "Optional description"
    }
  ],
  "groups": [
    {
      "id": "group-id",
      "name": "Group Name",
      "icon": "🎯",
      "color": "#ff5733"
    }
  ],
  "apps": [
    {
      "id": "app-id",
      "name": "App Name",
      "icon": "base64-encoded-image",
      "category": "Productivity",
      "linkedShortcuts": ["shortcut-id-1", "shortcut-id-2"]
    }
  ],
  "raycastShortcuts": [...],
  "raycastGroups": [...],
  "systemShortcuts": [...],
  "systemGroups": [...]
}
```

### Shortcut Types
- `leader` / `shortcuts` - LeaderKey shortcuts (prefix key sequences)
- `raycast` / `raycastShortcuts` - Raycast extension shortcuts
- `system` / `systemShortcuts` - macOS system shortcuts

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |

### Shortcuts CRUD
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shortcuts` | Get all shortcuts (role-based data) |
| POST | `/api/shortcuts/:type` | Create new item |
| PUT | `/api/shortcuts/:type/:id` | Update item |
| DELETE | `/api/shortcuts/:type/:id` | Delete item |

**Type parameter values**: `shortcuts`, `groups`, `apps`, `raycastShortcuts`, `raycastGroups`, `systemShortcuts`, `systemGroups`

### Utilities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/proxy-image?url=...` | CORS proxy for external images |

---

## 🎨 Frontend State Management

### App.jsx State
```javascript
// Core data state
const [shortcuts, setShortcuts] = useState([]);
const [groups, setGroups] = useState([]);
const [apps, setApps] = useState([]);
const [raycastShortcuts, setRaycastShortcuts] = useState([]);
const [raycastGroups, setRaycastGroups] = useState([]);
const [systemShortcuts, setSystemShortcuts] = useState([]);
const [systemGroups, setSystemGroups] = useState([]);

// UI state
const [activeTab, setActiveTab] = useState('leader'); // 'leader', 'raycast', 'system', 'apps', 'history'
const [search, setSearch] = useState('');
const [theme, setTheme] = useState('dark');
const [modalOpen, setModalOpen] = useState(false);
const [editingItem, setEditingItem] = useState(null);
```

### Context Providers
1. **AuthContext**: User authentication state (`user`, `login`, `logout`, `isAuthenticated`)
2. **HistoryContext**: Undo/redo functionality (`changes`, `undo`, `redo`, `canUndo`, `canRedo`)

---

## 🔧 Key Functions in App.jsx

| Function | Purpose |
|----------|---------|
| `fetchShortcuts()` | Loads all data from API on mount |
| `handleSave(shortcutData)` | Creates or updates shortcuts |
| `handleDelete(id)` | Deletes a shortcut |
| `handleSaveGroup(groupData)` | Creates or updates groups |
| `handleSaveApp(appData)` | Creates or updates apps |
| `applyChange(entityType, action, entityId, entityData, skipHistory)` | Unified change handler |
| `handleKeyDown(e)` | Global keyboard shortcuts (Cmd+Z, Cmd+Shift+Z) |

---

## 🐛 Common Issues & Debug Points

### 1. Authentication Issues
**Check these files**: `src/context/AuthContext.jsx`, `server/middleware/auth.js`, `server/routes/auth.js`
- Token not being sent: Check `fetchOptions` includes `Authorization` header
- 401 errors: Verify JWT_SECRET matches between `.env` and token signing

### 2. Data Not Persisting
**Check these files**: `server/index.js`, `server/db.json`, `server/demo_db.json`
- Wrong database: Check user role determines correct file
- Write errors: Check file permissions on `db.json` / `demo_db.json`

### 3. CRUD Operations Failing
**Check**: API endpoint URLs, request body format, authentication headers
- Frontend API base: `const API_BASE = 'http://localhost:3001/api/shortcuts';`
- Ensure `getShortcutType()` returns correct type for active tab

### 4. UI Not Updating
**Check**: React state updates, useMemo dependencies, context re-renders
- Verify `setShortcuts`, `setGroups`, etc. are called with new arrays
- Check if `useCallback` dependencies are correct

### 5. Demo Mode Issues
**Check**: `demo_db.json`, `req.user.role === 'demo'` checks in server
- Demo users should only affect `demo_db.json`
- Unauthenticated users see `demo_db.json` read-only

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/shortcuts_manager` |
| `JWT_SECRET` | Secret for signing JWTs | Required |
| `PORT` | Server port | `3001` |

---

## 🚀 Running the Application

### Development Mode
```bash
# Terminal 1: Start backend
cd server
npm install
npm run dev  # Uses nodemon for hot reload

# Terminal 2: Start frontend
cd .. # (shortcuts_manager root)
npm install
npm run dev  # Vite dev server on localhost:5173
```

### Production Build
```bash
npm run build  # Creates dist/ folder
npm run preview  # Preview production build
```

---

## 📝 Testing Checklist

### Authentication Flow
- [ ] Login with admin credentials works
- [ ] Login with demo credentials works
- [ ] Logout redirects appropriately
- [ ] Demo user sees demo_db.json data
- [ ] Admin user sees db.json data
- [ ] Token persists across page refreshes

### CRUD Operations
- [ ] Create shortcut (each type)
- [ ] Edit shortcut
- [ ] Delete shortcut
- [ ] Create/edit/delete groups
- [ ] Create/edit/delete apps
- [ ] Linking shortcuts to apps

### UI/UX
- [ ] Search filters correctly
- [ ] Theme toggle works
- [ ] Modals open/close properly (ESC key)
- [ ] Undo/redo works (Cmd+Z / Cmd+Shift+Z)
- [ ] Responsive on mobile
- [ ] Toast notifications appear

---

## 📦 Dependencies Overview

### Frontend (package.json)
- `react` / `react-dom`: ^19.2.0 - Core framework
- `framer-motion`: ^12.23.26 - Animations
- `lucide-react`: ^0.560.0 - Icons
- `tailwindcss`: ^3.4.17 - Styling
- `clsx` / `tailwind-merge`: CSS class utilities
- `vite`: ^7.2.4 - Build tool

### Backend (server/package.json)
- `express`: ^5.2.1 - Web framework
- `mongoose`: ^9.0.1 - MongoDB ODM
- `jsonwebtoken`: ^9.0.3 - JWT authentication
- `bcryptjs`: ^3.0.3 - Password hashing
- `cors`: ^2.8.5 - Cross-origin requests
- `compression`: ^1.8.1 - Gzip compression
- `dotenv`: ^17.2.3 - Environment variables
- `nodemon`: ^3.1.11 - Dev hot reload

---

## 🔍 Quick Debug Commands

```bash
# Check server logs
tail -f server/index.js  # Watch for console.log outputs

# Verify database files
cat server/db.json | head -100
cat server/demo_db.json | head -100

# Check for syntax errors
npm run lint

# Verify environment
cat server/.env
```

---

## 📞 API Testing with cURL

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"renshu","password":"renshu123"}'

# Get shortcuts (with token)
curl http://localhost:3001/api/shortcuts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create shortcut
curl -X POST http://localhost:3001/api/shortcuts/shortcuts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"action":"Test","key":"t","modifiers":["cmd"]}'
```

---

## 💡 Notes for AI/MCP Debugging

1. **Always check user role** - Many bugs stem from role-based logic
2. **Database is file-based** - JSON files, not MongoDB in dev mode
3. **Frontend port**: 5173 (Vite) | **Backend port**: 3001 (Express)
4. **Token expiry**: Check if JWT is still valid
5. **CORS**: Backend allows all origins in development
6. **Demo isolation**: Changes in demo mode MUST NOT affect db.json

---

*Last updated: 2025-12-13*
