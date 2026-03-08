[README.md](https://github.com/user-attachments/files/25827439/README.md)
# LUMINA — Setup Guide

## Project Structure
```
lumina-full/
├── server/          ← Node.js backend (auth + streak)
│   ├── index.js
│   ├── package.json
│   └── db.json      ← auto-created on first run
└── public/          ← PWA frontend (deploy this folder)
    ├── index.html
    ├── manifest.json
    ├── sw.js
    ├── icon-192.png
    └── icon-512.png
```

---

## Step 1 — Run the Server

You need Node.js installed. Download from https://nodejs.org

```bash
cd server
npm install
node index.js
```

Server runs on http://localhost:3001

---

## Step 2 — Deploy the Server (Free)

To make it work on your phone, deploy the server online for free:

### Option A: Railway (Easiest)
1. Go to https://railway.app
2. Sign up free → New Project → Deploy from GitHub
3. Upload the `server/` folder
4. Copy the deployed URL (e.g. https://lumina-server.up.railway.app)

### Option B: Render
1. Go to https://render.com
2. New Web Service → upload server folder
3. Start command: `node index.js`

---

## Step 3 — Update API URL in Frontend

Open `public/index.html` and change line:
```js
const API = "http://localhost:3001/api";
```
To your deployed server URL:
```js
const API = "https://your-server.up.railway.app/api";
```

---

## Step 4 — Deploy Frontend + Install as PWA

1. Go to https://netlify.com/drop
2. Drag the entire `public/` folder
3. Get your URL (e.g. https://lumina-xyz.netlify.app)
4. Open on Android Chrome → tap "Add to Home Screen" → Install!

---

## Features
- ✅ Sign Up / Log In with secure password hashing
- ✅ Streak tracked in Philippine Time (Asia/Manila)
- ✅ Streak resets at midnight PH time
- ✅ AI mood journal analysis (English only)
- ✅ Planet Tap mini-game with high score saving
- ✅ AI Reviewer — text or photo of notes → study guide
- ✅ PH Crisis Hotlines
- ✅ PWA installable on Android/iOS
