# Shortcuts Manager

Shortcuts Manager keeps system, Raycast, and LeaderKey shortcuts in one place. Search them, edit them, check for conflicts, and export a Markdown reference when you need to share or review a setup.

## What it does

- Separate views for LeaderKey, Raycast, and macOS system shortcuts
- Groups, apps, categories, and global search
- Shortcut conflict checking across Raycast and system shortcuts
- Change history with undo and redo
- Markdown export for documentation
- Account-based access with per-user data
- Light and dark themes with keyboard-friendly navigation

## Stack

- React 19 and Vite
- Tailwind CSS and Framer Motion
- Express and MongoDB with Mongoose
- JWT authentication

## Run locally

You need Node.js 18 or newer. The frontend and API run as separate processes in development.

Start the frontend:

```sh
bun install
bun run dev
```

Start the API in a second terminal:

```sh
cd server
bun install
bun run dev
```

The API reads its settings from `server/.env`. Copy `server/.env.example` and provide the database connection string and JWT secret before using account features.

## Deploy

`render.yaml` describes a single Render web service. It builds the Vite frontend, serves it from Express, and exposes `/api/health` for health checks. Production deployments need `MONGODB_URI` and `JWT_SECRET` in the Render environment.

## Status

This is a personal project. The core interface and API are in place, while deployment and data setup still need project-specific configuration.
