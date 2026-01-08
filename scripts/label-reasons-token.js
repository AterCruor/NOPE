const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "..", "data", "reasons.json");
const outputPath = path.join(__dirname, "..", "data", "reasonsToken.json");

const reasons = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const hasAny = (text, keywords) => {
  const tokens = new Set(tokenize(text));

  return keywords.some((keyword) => {
    const needle = keyword.toLowerCase().trim();
    if (!needle) {
      return false;
    }
    if (needle.includes(" ")) {
      return text.includes(needle);
    }
    return tokens.has(needle);
  });
};

const detectTopic = (text) => {
  const topics = [
    ["work", ["work", "job", "boss", "office", "meeting", "deadline", "project"]],
    ["school", ["school", "class", "homework", "exam", "study", "teacher"]],
    ["social", ["party", "hang", "drink", "friends", "invite", "social"]],
    ["family", ["family", "mom", "dad", "parents", "kids", "children"]],
    ["health", ["sick", "ill", "flu", "doctor", "hospital", "allerg"]],
    ["time", ["busy", "schedule", "calendar", "time", "deadline", "booked"]],
    ["travel", ["travel", "trip", "flight", "airport", "drive", "road"]],
    ["weather", ["weather", "rain", "snow", "storm", "forecast", "cold", "hot"]],
    ["money", ["money", "budget", "rent", "broke", "expensive", "cash"]],
    ["tech", ["computer", "internet", "wifi", "server", "code", "deploy"]],
    ["pets", ["cat", "dog", "pet", "hamster", "goldfish"]],
    ["food", ["food", "lunch", "dinner", "snack", "coffee", "tea"]],
    ["self-care", ["self-care", "recharge", "rest", "me-time", "burnout"]],
    ["sleep", ["sleep", "nap", "tired", "bed", "pillow"]],
    ["mental", ["anxiety", "mental", "stress", "overwhelm", "therapy"]],
  ];

  for (const [topic, keywords] of topics) {
    if (hasAny(text, keywords)) {
      return topic;
    }
  }

  return "general";
};

const detectTone = (text) => {
  if (hasAny(text, ["sorry", "apolog", "appreciate", "unfortunately", "regret"])) {
    return "polite";
  }
  if (hasAny(text, ["lol", "haha", "nope", "nah", "dawg"])) {
    return "playful";
  }
  if (hasAny(text, ["dear", "sincerely", "regards", "respectfully"])) {
    return "formal";
  }
  if (hasAny(text, ["yeah right", "as if", "sure", "totally"])) {
    return "sarcastic";
  }
  if (hasAny(text, ["no.", "never", "not happening", "absolutely not"])) {
    return "blunt";
  }
  if (hasAny(text, ["i understand", "i hear you", "i feel", "boundaries"])) {
    return "empathetic";
  }
  return "neutral";
};

const detectType = (text, topic) => {
  if (topic === "work") {
    return "professional";
  }
  if (hasAny(text, ["wizard", "dragon", "mana", "unicorn", "fairy", "magic"])) {
    return "whimsical";
  }
  if (hasAny(text, ["alien", "parallel universe", "time travel", "lava"])) {
    return "absurd";
  }
  if (hasAny(text, ["boundary", "self-care", "mental"])) {
    return "personal";
  }
  if (hasAny(text, ["no is", "saying no", "decline", "refuse"])) {
    return "meta";
  }
  if (hasAny(text, ["schedule", "busy", "calendar", "time"])) {
    return "practical";
  }
  return "general";
};

const detectTags = (text, topic) => {
  const tags = new Set();

  if (topic !== "general") {
    tags.add(topic);
  }

  const tagMap = [
    ["couch", ["couch", "sofa"]],
    ["nap", ["nap"]],
    ["meeting", ["meeting"]],
    ["deadline", ["deadline"]],
    ["calendar", ["calendar", "schedule"]],
    ["party", ["party"]],
    ["weather", ["rain", "snow", "storm"]],
    ["pet", ["cat", "dog", "pet"]],
    ["food", ["food", "lunch", "dinner", "snack"]],
    ["sleep", ["sleep", "tired", "bed"]],
    ["self-care", ["self-care", "recharge"]],
    ["travel", ["travel", "trip", "flight", "airport"]],
    ["work", ["work", "job", "boss", "office"]],
    ["school", ["school", "class", "homework", "exam"]],
    ["money", ["budget", "broke", "money", "rent"]],
    ["tech", ["server", "code", "deploy", "wifi", "internet"]],
  ];

  for (const [tag, keywords] of tagMap) {
    if (hasAny(text, keywords)) {
      tags.add(tag);
    }
  }

  return Array.from(tags);
};

const updated = reasons.map((entry) => {
  const reason = typeof entry === "string" ? entry : entry.reason;
  const text = reason.toLowerCase();
  const topic = detectTopic(text);
  const tone = detectTone(text);
  const type = detectType(text, topic);
  const tags = detectTags(text, topic);

  return {
    id: entry.id,
    reason,
    type,
    tone,
    topic,
    tags,
  };
});

fs.writeFileSync(outputPath, JSON.stringify(updated, null, 2) + "\n");
console.log(`Wrote ${updated.length} labeled reasons to ${outputPath}`);
