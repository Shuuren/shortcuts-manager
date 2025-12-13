# Shortcuts Manager - Deployment Guide

## Prerequisites
- Node.js 18+ installed
- A GitHub account
- A Render account (render.com)
- A MongoDB Atlas account (for production database)

## Project Structure
```
shortcuts_manager/
├── src/              # React frontend (Vite)
├── server/           # Express.js backend
├── dist/             # Built frontend (generated)
└── render.yaml       # Render deployment config
```

## Local Development

### Start the backend
```bash
cd server
npm install
npm run dev
```

### Start the frontend
```bash
npm install
npm run dev
```

## Deployment to GitHub

1. **Initialize Git repository**
```bash
git init
git add .
git commit -m "Initial commit"
```

2. **Create GitHub repository**
- Go to github.com and create a new repository
- Don't initialize with README (you already have one)

3. **Push to GitHub**
```bash
git remote add origin https://github.com/YOUR_USERNAME/shortcuts-manager.git
git branch -M main
git push -u origin main
```

## Deployment to Render

### Option 1: Using Render Blueprint (Recommended)
1. Go to render.com and log in
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and create both services

### Option 2: Manual Deployment

#### Deploy Backend (Web Service)
1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repo
3. Configure:
   - **Name**: shortcuts-manager-api
   - **Root Directory**: server
   - **Build Command**: npm install
   - **Start Command**: npm start
   - **Environment Variables**:
     - `NODE_ENV`: production
     - `JWT_SECRET`: (generate a secure random string)
     - `MONGODB_URI`: (your MongoDB Atlas connection string)

#### Deploy Frontend (Static Site)
1. Go to Render Dashboard → New → Static Site
2. Connect your GitHub repo
3. Configure:
   - **Name**: shortcuts-manager-frontend
   - **Build Command**: npm install && npm run build
   - **Publish Directory**: dist
   - **Environment Variables**:
     - `VITE_API_URL`: (your backend URL, e.g., https://shortcuts-manager-api.onrender.com)

### MongoDB Atlas Setup
1. Create a free MongoDB Atlas account at mongodb.com
2. Create a new cluster (free tier available)
3. Create a database user
4. Get your connection string
5. Add it as `MONGODB_URI` environment variable in Render

## Environment Variables

### Backend (server/.env)
| Variable | Description | Required |
|----------|-------------|----------|
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_SECRET | Secret for JWT tokens | Yes |
| PORT | Server port (auto-set by Render) | No |

### Frontend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| VITE_API_URL | Backend API URL | Yes (for production) |

## Post-Deployment
1. Test the health check endpoint: `https://your-api-url.onrender.com/api/health`
2. Visit your frontend URL
3. Log in with your credentials

## Troubleshooting
- **503 Service Unavailable**: Backend is still starting (can take 1-2 min on free tier)
- **CORS errors**: Make sure VITE_API_URL is set correctly in frontend
- **Auth fails**: Check JWT_SECRET is set in backend environment
