const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "lumina-secret-key-change-in-production";
const DB_FILE = path.join(__dirname, "db.json");

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── DB helpers (flat JSON file) ──
function readDB() {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }));
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ── PH Time helpers ──
function getPHDateStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }); // YYYY-MM-DD
}
function computeStreak(history) {
  if (!history || !history.length) return 0;
  const today = getPHDateStr();
  const dates = [...new Set(history.map(e => e.phDate))].sort().reverse();
  if (!dates.includes(today)) {
    // Check if last checkin was yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    if (!dates.includes(yStr)) return 0;
  }
  let streak = 0;
  let check = new Date(today);
  for (let i = 0; i < 365; i++) {
    const d = check.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    if (dates.includes(d)) { streak++; check.setDate(check.getDate() - 1); }
    else break;
  }
  return streak;
}

// ── Auth middleware ──
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ── Routes ──

// Sign Up
app.post("/api/signup", async (req, res) => {
  const { username, email, password, displayName } = req.body;
  if (!username || !password || !email) return res.status(400).json({ error: "Missing fields" });
  const db = readDB();
  if (Object.values(db.users).find(u => u.username === username))
    return res.status(409).json({ error: "Username already taken" });
  if (Object.values(db.users).find(u => u.email === email))
    return res.status(409).json({ error: "Email already registered" });
  const id = uuidv4();
  const hash = await bcrypt.hash(password, 10);
  db.users[id] = {
    id, username, email, displayName: displayName || username,
    password: hash,
    createdAt: new Date().toISOString(),
    history: [],
    gameHighScore: 0,
  };
  writeDB(db);
  const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, user: sanitize(db.users[id]) });
});

// Log In
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const user = Object.values(db.users).find(u => u.username === username || u.email === username);
  if (!user) return res.status(401).json({ error: "User not found" });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Wrong password" });
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, user: sanitize(user) });
});

// Get profile
app.get("/api/me", auth, (req, res) => {
  const db = readDB();
  const user = db.users[req.user.id];
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json({ user: sanitize(user) });
});

// Save check-in
app.post("/api/checkin", auth, (req, res) => {
  const { moodValue, moodId, journal, aiInsight, shortDate, time } = req.body;
  const db = readDB();
  const user = db.users[req.user.id];
  if (!user) return res.status(404).json({ error: "Not found" });
  const phDate = getPHDateStr();
  user.history.push({ moodValue, moodId, journal, aiInsight, shortDate, time, phDate, id: uuidv4() });
  writeDB(db);
  const streak = computeStreak(user.history);
  res.json({ success: true, streak, history: user.history });
});

// Save game score
app.post("/api/score", auth, (req, res) => {
  const { score } = req.body;
  const db = readDB();
  const user = db.users[req.user.id];
  if (!user) return res.status(404).json({ error: "Not found" });
  if (score > (user.gameHighScore || 0)) user.gameHighScore = score;
  writeDB(db);
  res.json({ highScore: user.gameHighScore });
});

function sanitize(u) {
  const { password, ...safe } = u;
  safe.streak = computeStreak(u.history);
  safe.phDate = getPHDateStr();
  return safe;
}

app.listen(PORT, () => console.log(`LUMINA server running on port ${PORT}`));
