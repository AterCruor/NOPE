const express = require('express');
const cors = require("cors");
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;

// Load reasons from JSON (read on demand so edits are picked up without restart)
const reasonsPath = path.join(__dirname, 'data', 'reasons.json');
const loadReasons = () => {
  try {
    return JSON.parse(fs.readFileSync(reasonsPath, 'utf-8'));
  } catch (error) {
    console.error("Failed to load reasons.json:", error.message);
    return [];
  }
};

// Rate limiter: 120 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  keyGenerator: (req, res) => {
    return req.headers['cf-connecting-ip'] || req.ip; // Fallback if header missing (or for non-CF)
  },
  message: { error: "Too many requests, please try again later. (120 reqs/min/IP)" }
});

app.use(limiter);

const parseList = (value) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    : [];

const safeLower = (value) => String(value || "").toLowerCase();

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

// Random rejection reason endpoint (string only)
app.get('/no', (req, res) => {
  const reasons = loadReasons();
  if (!reasons.length) {
    return res.json({ reason: "No reasons available right now." });
  }
  const entry = pickRandom(reasons);
  res.json({ reason: entry.reason });
});

// Filtered rejection reason endpoint (string only)
app.get('/no/rich', (req, res) => {
  const reasons = loadReasons();
  if (!reasons.length) {
    return res.json({ reason: "No reasons available right now." });
  }
  const types = parseList(req.query.type);
  const tones = parseList(req.query.tone);
  const topics = parseList(req.query.topic);

  const filtered = reasons.filter((entry) => {
    const entryType = safeLower(entry.type);
    const entryTone = safeLower(entry.tone);
    const entryTopic = safeLower(entry.topic);

    if (types.length && !types.includes(entryType)) {
      return false;
    }
    if (tones.length && !tones.includes(entryTone)) {
      return false;
    }
    if (topics.length && !topics.includes(entryTopic)) {
      return false;
    }
    return true;
  });

  if (!filtered.length) {
    return res.status(404).json({
      error: "No reasons match the requested filters.",
    });
  }

  const entry = pickRandom(filtered);
  return res.json({ reason: entry.reason });
});

// Start server
app.listen(PORT, () => {
  console.log(`No-as-a-Service is running on port ${PORT}`);
});
