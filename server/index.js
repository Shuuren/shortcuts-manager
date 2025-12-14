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
const UserData = require('./models/UserData');

const app = express();
const PORT = process.env.PORT || 3001;

// Legacy file paths for migration
const LEGACY_DB_FILE = path.join(__dirname, 'db.json');
const LEGACY_DEMO_DB_FILE = path.join(__dirname, 'demo_db.json');

// Enable gzip compression for all responses
app.use(compression());

// MongoDB Connection String - Replace with your MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shortcuts_manager';

// Track if MongoDB is connected
let mongoConnected = false;

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    mongoConnected = true;
    
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
      
      // Migrate existing JSON data to MongoDB if not already migrated
      await migrateDataToMongoDB(admin, demo);
      
    } catch (err) {
      console.error('Error creating default users:', err);
    }
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    console.error('Please ensure MONGODB_URI is set correctly in your .env file');
    process.exit(1); // Exit if MongoDB is not available - we need it now
  });

// Migration function: move data from JSON files to MongoDB
async function migrateDataToMongoDB(adminUser, demoUser) {
  try {
    // Check if admin data exists in MongoDB
    let adminData = await UserData.findOne({ userId: adminUser._id });
    if (!adminData && fs.existsSync(LEGACY_DB_FILE)) {
      console.log('Migrating admin data from db.json to MongoDB...');
      const fileData = JSON.parse(fs.readFileSync(LEGACY_DB_FILE, 'utf8'));
      adminData = new UserData({
        userId: adminUser._id,
        dataType: 'admin',
        leaderShortcuts: fileData.leaderShortcuts || [],
        leaderGroups: fileData.leaderGroups || [],
        raycastShortcuts: fileData.raycastShortcuts || [],
        systemShortcuts: fileData.systemShortcuts || [],
        appsLibrary: fileData.appsLibrary || fileData.apps || []
      });
      await adminData.save();
      console.log('Admin data migrated successfully!');
    }
    
    // Check if demo data exists in MongoDB
    let demoData = await UserData.findOne({ userId: demoUser._id });
    if (!demoData && fs.existsSync(LEGACY_DEMO_DB_FILE)) {
      console.log('Migrating demo data from demo_db.json to MongoDB...');
      const fileData = JSON.parse(fs.readFileSync(LEGACY_DEMO_DB_FILE, 'utf8'));
      demoData = new UserData({
        userId: demoUser._id,
        dataType: 'demo',
        leaderShortcuts: fileData.leaderShortcuts || [],
        leaderGroups: fileData.leaderGroups || [],
        raycastShortcuts: fileData.raycastShortcuts || [],
        systemShortcuts: fileData.systemShortcuts || [],
        appsLibrary: fileData.appsLibrary || fileData.apps || []
      });
      await demoData.save();
      console.log('Demo data migrated successfully!');
    }
  } catch (err) {
    console.error('Error migrating data to MongoDB:', err);
  }
}

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

// Helper to get the actual DB key
const getDbKey = (type) => {
    if (type === 'apps') return 'appsLibrary';
    return type;
};

// Helper to get user's data from MongoDB
const getUserData = async (user) => {
    const defaultData = { 
        leaderShortcuts: [], 
        raycastShortcuts: [], 
        systemShortcuts: [], 
        leaderGroups: [], 
        appsLibrary: [] 
    };
    
    try {
        // Not logged in = show demo data
        if (!user) {
            const demoUser = await User.findOne({ role: 'demo' });
            if (!demoUser) return defaultData;
            const demoData = await UserData.findOne({ userId: demoUser._id });
            return demoData ? demoData.toObject() : defaultData;
        }
        
        // Demo user
        if (user.role === 'demo') {
            const demoData = await UserData.findOne({ userId: user.id });
            return demoData ? demoData.toObject() : defaultData;
        }
        
        // Admin user
        if (user.role === 'admin') {
            const adminData = await UserData.findOne({ userId: user.id });
            return adminData ? adminData.toObject() : defaultData;
        }
        
        // Client user - get or create their data
        let userData = await UserData.findOne({ userId: user.id });
        if (!userData) {
            userData = new UserData({
                userId: user.id,
                dataType: 'client',
                ...defaultData
            });
            await userData.save();
        }
        return userData.toObject();
    } catch (err) {
        console.error("Error getting user data from MongoDB:", err);
        return defaultData;
    }
};

// Helper to save user's data to MongoDB
const saveUserData = async (data, user) => {
    try {
        const updateData = {
            leaderShortcuts: data.leaderShortcuts || [],
            leaderGroups: data.leaderGroups || [],
            raycastShortcuts: data.raycastShortcuts || [],
            systemShortcuts: data.systemShortcuts || [],
            appsLibrary: data.appsLibrary || [],
            updatedAt: new Date()
        };
        
        await UserData.findOneAndUpdate(
            { userId: user.id },
            { $set: updateData },
            { upsert: true, new: true }
        );
    } catch (err) {
        console.error("Error saving user data to MongoDB:", err);
        throw err;
    }
};

// GET all shortcuts
// - Not logged in: See demo database - showcase mode
// - Demo user: See/edit demo database
// - Admin users: See/edit admin database
// - Client users: See/edit their own database
app.get('/api/shortcuts', async (req, res) => {
    try {
        const data = await getUserData(req.user);
        res.json({
            leaderShortcuts: data.leaderShortcuts || [],
            leaderGroups: data.leaderGroups || [],
            raycastShortcuts: data.raycastShortcuts || [],
            systemShortcuts: data.systemShortcuts || [],
            appsLibrary: data.appsLibrary || [],
            apps: data.appsLibrary || []
        });
    } catch (err) {
        console.error("GET /api/shortcuts error:", err);
        res.status(500).json({ error: "Failed to retrieve data" });
    }
});

// Generic create endpoint (all authenticated users)
app.post('/api/shortcuts/:type', requireAuth, async (req, res) => {
    const { type } = req.params;
    const dbKey = getDbKey(type);
    const newItem = req.body;
    
    try {
        const db = await getUserData(req.user);
        if (!db[dbKey]) {
            db[dbKey] = [];
        }

        // Assign ID if missing
        if (!newItem.id) {
            newItem.id = `${type.replace('Shortcuts', '').replace('Library', '')}_${Date.now()}`;
        }

        db[dbKey].push(newItem);
        await saveUserData(db, req.user);
        res.json(newItem);
    } catch (err) {
        console.error(`POST /api/shortcuts/${type} error:`, err);
        res.status(500).json({ error: "Failed to save item" });
    }
});

// Generic update endpoint (all authenticated users)
app.put('/api/shortcuts/:type/:id', requireAuth, async (req, res) => {
    const { type, id } = req.params;
    const dbKey = getDbKey(type);
    const updatedItem = req.body;

    try {
        const db = await getUserData(req.user);
        if (!db[dbKey]) {
            return res.status(400).json({ error: 'Invalid type or collection missing' });
        }

        const index = db[dbKey].findIndex(item => item.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }

        db[dbKey][index] = { ...db[dbKey][index], ...updatedItem };
        await saveUserData(db, req.user);
        res.json(db[dbKey][index]);
    } catch (err) {
        console.error(`PUT /api/shortcuts/${type}/${id} error:`, err);
        res.status(500).json({ error: "Failed to update item" });
    }
});

// Generic delete endpoint (all authenticated users)
app.delete('/api/shortcuts/:type/:id', requireAuth, async (req, res) => {
    const { type, id } = req.params;
    const dbKey = getDbKey(type);
    
    try {
        const db = await getUserData(req.user);
        if (!db[dbKey]) {
            return res.status(400).json({ error: 'Invalid type' });
        }

        db[dbKey] = db[dbKey].filter(item => item.id !== id);
        await saveUserData(db, req.user);
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

