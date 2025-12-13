require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const compression = require('compression');

// Import auth middleware and routes
const { verifyToken, requireAuth, requireAdmin } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'db.json');

// Enable gzip compression for all responses
app.use(compression());

// MongoDB Connection String - Replace with your MongoDB Atlas connection string
// For development, we'll use a local fallback or continue with file-based storage
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shortcuts_manager';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Create admin user if it doesn't exist
    try {
      // Create or update admin user
      let admin = await User.findOne({ username: 'renshu' });
      if (!admin) {
        admin = new User({ username: 'renshu', password: 'renshu123', role: 'admin', displayName: 'Renshu' });
        await admin.save();
        console.log('Admin user created: renshu');
      } else {
        console.log('Admin user exists: renshu');
      }
      
      // Create or update demo user
      let demo = await User.findOne({ username: 'gabby_demo' });
      if (!demo) {
        demo = new User({ username: 'gabby_demo', password: 'gabby123', role: 'demo', displayName: 'Gabby (Demo)' });
        await demo.save();
        console.log('Demo user created: gabby_demo');
      } else {
        console.log('Demo user exists: gabby_demo');
      }
    } catch (err) {
      console.error('Error creating default users:', err);
    }
  })
  .catch(err => {
    console.warn('MongoDB connection failed, using file-based storage:', err.message);
  });

// Increase limit to handle larger payloads (images)
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

// Add token verification to all requests (optional auth)
app.use(verifyToken);

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Database file paths
const DEMO_DB_FILE = path.join(__dirname, 'demo_db.json');

// Helper to get the actual DB key
const getDbKey = (type) => {
    if (type === 'apps') return 'appsLibrary';
    return type;
};

// Helper to get database file path based on user
const getDbFilePath = (user) => {
    if (!user) return DEMO_DB_FILE; // Not logged in = demo view
    if (user.role === 'demo') return DEMO_DB_FILE;
    if (user.role === 'admin') return DB_FILE;
    // Client users get their own database
    return path.join(__dirname, `user_${user.id}_db.json`);
};

// Helper to read DB (supports user-specific databases)
const readDb = (user) => {
    const dbFile = getDbFilePath(user);
    try {
        if (!fs.existsSync(dbFile)) {
            // Initialize if file doesn't exist
            return { 
                leaderShortcuts: [], 
                raycastShortcuts: [], 
                systemShortcuts: [], 
                leaderGroups: [], 
                appsLibrary: [] 
            };
        }
        const data = fs.readFileSync(dbFile, 'utf8');
        const parsed = JSON.parse(data);
        
        // Ensure appsLibrary exists
        if (!parsed.appsLibrary && parsed.apps) {
            parsed.appsLibrary = parsed.apps;
        }
        if (!parsed.appsLibrary) {
            parsed.appsLibrary = [];
        }
        
        return parsed;
    } catch (err) {
        console.error("Error reading DB:", err);
        // Return default structure on error to prevent crashes accessing properties
        return { 
            leaderShortcuts: [], 
            raycastShortcuts: [], 
            systemShortcuts: [], 
            leaderGroups: [], 
            appsLibrary: [] 
        };
    }
};

// Helper to write DB atomically (supports user-specific databases)
const writeDb = (data, user) => {
    const dbFile = getDbFilePath(user);
    const tempFile = `${dbFile}.tmp`;
    try {
        fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
        fs.renameSync(tempFile, dbFile);
    } catch (err) {
        console.error("Error writing DB:", err);
        // Try to clean up temp file if it exists
        try {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch (e) { /* ignore */ }
        throw err; // Re-throw to be caught by route handler
    }
};

// GET all shortcuts
// - Not logged in: See demo database (demo_db.json) - showcase mode
// - Demo user: See/edit demo database (demo_db.json)
// - Admin users: See/edit admin database (db.json)
// - Client users: See/edit their own database (user_{id}_db.json)
app.get('/api/shortcuts', (req, res) => {
    try {
        const data = readDb(req.user);
        res.json({
            ...data,
            apps: data.appsLibrary || []
        });
    } catch (err) {
        console.error("GET /api/shortcuts error:", err);
        res.status(500).json({ error: "Failed to retrieve data" });
    }
});

// Generic create endpoint (all authenticated users)
app.post('/api/shortcuts/:type', requireAuth, (req, res) => {
    const { type } = req.params;
    const dbKey = getDbKey(type);
    const newItem = req.body;
    
    try {
        const db = readDb(req.user);
        if (!db[dbKey]) {
            db[dbKey] = [];
        }

        // Assign ID if missing
        if (!newItem.id) {
            newItem.id = `${type.replace('Shortcuts', '').replace('Library', '')}_${Date.now()}`;
        }

        db[dbKey].push(newItem);
        writeDb(db, req.user);
        res.json(newItem);
    } catch (err) {
        console.error(`POST /api/shortcuts/${type} error:`, err);
        res.status(500).json({ error: "Failed to save item" });
    }
});

// Generic update endpoint (all authenticated users)
app.put('/api/shortcuts/:type/:id', requireAuth, (req, res) => {
    const { type, id } = req.params;
    const dbKey = getDbKey(type);
    const updatedItem = req.body;

    try {
        const db = readDb(req.user);
        if (!db[dbKey]) {
            return res.status(400).json({ error: 'Invalid type or collection missing' });
        }

        const index = db[dbKey].findIndex(item => item.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }

        db[dbKey][index] = { ...db[dbKey][index], ...updatedItem };
        writeDb(db, req.user);
        res.json(db[dbKey][index]);
    } catch (err) {
        console.error(`PUT /api/shortcuts/${type}/${id} error:`, err);
        res.status(500).json({ error: "Failed to update item" });
    }
});

// Generic delete endpoint (all authenticated users)
app.delete('/api/shortcuts/:type/:id', requireAuth, (req, res) => {
    const { type, id } = req.params;
    const dbKey = getDbKey(type);
    
    try {
        const db = readDb(req.user);
        if (!db[dbKey]) {
            return res.status(400).json({ error: 'Invalid type' });
        }

        db[dbKey] = db[dbKey].filter(item => item.id !== id);
        writeDb(db, req.user);
        res.json({ success: true });
    } catch (err) {
        console.error(`DELETE /api/shortcuts/${type}/${id} error:`, err);
        res.status(500).json({ error: "Failed to delete item" });
    }
});

// Image proxy endpoint to bypass CORS for external images
app.get('/api/proxy-image', async (req, res) => {
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    // Validate URL format
    let parsedUrl;
    try {
        parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return res.status(400).json({ error: 'URL must use http or https protocol' });
        }
    } catch (e) {
        return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/*,*/*;q=0.8'
            },
            redirect: 'follow', // Follow redirects automatically
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            return res.status(response.status).json({ 
                error: `Failed to fetch: ${response.status} ${response.statusText}`,
                url: url
            });
        }
        
        const contentType = response.headers.get('content-type') || 'image/png';
        const buffer = await response.arrayBuffer();
        
        if (buffer.byteLength === 0) {
            return res.status(502).json({ error: 'Empty response from remote server' });
        }
        
        const base64 = Buffer.from(buffer).toString('base64');
        
        res.json({ 
            dataUrl: `data:${contentType};base64,${base64}`,
            contentType 
        });
    } catch (err) {
        console.error('Proxy image error:', err.message);
        
        // Provide more specific error messages
        if (err.name === 'AbortError') {
            return res.status(504).json({ error: 'Request timeout - remote server took too long to respond' });
        }
        if (err.cause?.code === 'ENOTFOUND') {
            return res.status(502).json({ error: `DNS lookup failed - could not resolve hostname: ${parsedUrl.hostname}` });
        }
        if (err.cause?.code === 'ECONNREFUSED') {
            return res.status(502).json({ error: 'Connection refused by remote server' });
        }
        if (err.cause?.code === 'ETIMEDOUT') {
            return res.status(504).json({ error: 'Connection timed out' });
        }
        
        res.status(500).json({ error: `Failed to proxy image: ${err.message}` });
    }
});

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '..', 'dist');
    
    // Serve static files from the React app build
    app.use(express.static(frontendPath));
    
    // Handle React routing - use middleware for catch-all (Express 5 compatible)
    app.use((req, res, next) => {
        // Only serve index.html for non-API routes that aren't already handled
        if (!req.path.startsWith('/api') && req.method === 'GET') {
            res.sendFile(path.join(frontendPath, 'index.html'));
        } else {
            next();
        }
    });
    
    console.log('Serving frontend from:', frontendPath);
}

// Global error handler
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Use your judgement here - in production you might want to exit, but for dev potentially keep running or just log
    // process.exit(1); 
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

