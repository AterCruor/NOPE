const fs = require("fs");
const path = require("path");
const winkNLP = require("wink-nlp");
const model = require("wink-eng-lite-web-model");
const Sentiment = require("sentiment");

const inputPath = path.join(__dirname, "..", "data", "reasons.json");
const outputPath = path.join(__dirname, "..", "data", "reasons.json");

const reasons = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const nlp = winkNLP(model);
const its = nlp.its;
const sentiment = new Sentiment();

const normalize = (text) =>
  text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");

const lemmatizeTokens = (text) => {
  const doc = nlp.readDoc(text);
  return doc
    .tokens()
    .out(its.lemma)
    .map((token) => token.toLowerCase())
    .filter(Boolean);
};

const scoreByRules = (text, tokens, rules, fallback) => {
  let best = { label: fallback, score: 0 };

  for (const rule of rules) {
    let score = 0;
    for (const { phrase, weight } of rule.phrases) {
      const needle = phrase.toLowerCase().trim();
      if (!needle) {
        continue;
      }
      if (needle.includes(" ")) {
        if (text.includes(needle)) {
          score += weight;
        }
      } else if (tokens.has(needle)) {
        score += weight;
      }
    }

    if (score > best.score) {
      best = { label: rule.label, score };
    }
  }

  return best;
};

const topicRules = [
  {
    label: "work",
    phrases: [
      { phrase: "work", weight: 2 },
      { phrase: "job", weight: 2 },
      { phrase: "boss", weight: 3 },
      { phrase: "meeting", weight: 2 },
      { phrase: "deadline", weight: 3 },
      { phrase: "project", weight: 1 },
    ],
  },
  {
    label: "school",
    phrases: [
      { phrase: "school", weight: 2 },
      { phrase: "class", weight: 2 },
      { phrase: "exam", weight: 3 },
      { phrase: "homework", weight: 3 },
      { phrase: "teacher", weight: 2 },
    ],
  },
  {
    label: "social",
    phrases: [
      { phrase: "party", weight: 3 },
      { phrase: "hang", weight: 2 },
      { phrase: "friends", weight: 2 },
      { phrase: "invite", weight: 2 },
      { phrase: "social", weight: 2 },
    ],
  },
  {
    label: "family",
    phrases: [
      { phrase: "family", weight: 2 },
      { phrase: "mom", weight: 2 },
      { phrase: "dad", weight: 2 },
      { phrase: "parents", weight: 2 },
      { phrase: "kids", weight: 2 },
      { phrase: "children", weight: 2 },
    ],
  },
  {
    label: "health",
    phrases: [
      { phrase: "sick", weight: 3 },
      { phrase: "ill", weight: 2 },
      { phrase: "flu", weight: 3 },
      { phrase: "doctor", weight: 3 },
      { phrase: "hospital", weight: 3 },
      { phrase: "allergy", weight: 2 },
    ],
  },
  {
    label: "time",
    phrases: [
      { phrase: "busy", weight: 2 },
      { phrase: "schedule", weight: 3 },
      { phrase: "calendar", weight: 3 },
      { phrase: "booked", weight: 3 },
    ],
  },
  {
    label: "travel",
    phrases: [
      { phrase: "travel", weight: 2 },
      { phrase: "trip", weight: 2 },
      { phrase: "flight", weight: 3 },
      { phrase: "airport", weight: 3 },
      { phrase: "drive", weight: 1 },
    ],
  },
  {
    label: "weather",
    phrases: [
      { phrase: "weather", weight: 2 },
      { phrase: "rain", weight: 3 },
      { phrase: "snow", weight: 3 },
      { phrase: "storm", weight: 3 },
      { phrase: "forecast", weight: 2 },
      { phrase: "cold", weight: 2 },
      { phrase: "hot", weight: 2 },
    ],
  },
  {
    label: "money",
    phrases: [
      { phrase: "money", weight: 2 },
      { phrase: "budget", weight: 3 },
      { phrase: "rent", weight: 3 },
      { phrase: "broke", weight: 3 },
      { phrase: "expensive", weight: 2 },
      { phrase: "cash", weight: 2 },
    ],
  },
  {
    label: "tech",
    phrases: [
      { phrase: "computer", weight: 2 },
      { phrase: "internet", weight: 2 },
      { phrase: "wifi", weight: 2 },
      { phrase: "server", weight: 3 },
      { phrase: "code", weight: 2 },
      { phrase: "deploy", weight: 2 },
    ],
  },
  {
    label: "pets",
    phrases: [
      { phrase: "cat", weight: 3 },
      { phrase: "dog", weight: 3 },
      { phrase: "pet", weight: 2 },
      { phrase: "hamster", weight: 3 },
      { phrase: "goldfish", weight: 3 },
    ],
  },
  {
    label: "food",
    phrases: [
      { phrase: "food", weight: 2 },
      { phrase: "lunch", weight: 2 },
      { phrase: "dinner", weight: 2 },
      { phrase: "snack", weight: 2 },
      { phrase: "coffee", weight: 2 },
      { phrase: "tea", weight: 2 },
    ],
  },
  {
    label: "self-care",
    phrases: [
      { phrase: "self-care", weight: 3 },
      { phrase: "recharge", weight: 2 },
      { phrase: "rest", weight: 1 },
      { phrase: "me-time", weight: 2 },
      { phrase: "burnout", weight: 3 },
    ],
  },
  {
    label: "sleep",
    phrases: [
      { phrase: "sleep", weight: 2 },
      { phrase: "nap", weight: 2 },
      { phrase: "tired", weight: 2 },
      { phrase: "bed", weight: 1 },
      { phrase: "pillow", weight: 1 },
    ],
  },
  {
    label: "mental",
    phrases: [
      { phrase: "anxiety", weight: 3 },
      { phrase: "mental", weight: 2 },
      { phrase: "stress", weight: 2 },
      { phrase: "overwhelm", weight: 2 },
      { phrase: "therapy", weight: 3 },
    ],
  },
];

const toneRules = [
  {
    label: "polite",
    phrases: [
      { phrase: "sorry", weight: 2 },
      { phrase: "apolog", weight: 2 },
      { phrase: "appreciate", weight: 2 },
      { phrase: "unfortunately", weight: 3 },
      { phrase: "regret", weight: 2 },
    ],
  },
  {
    label: "playful",
    phrases: [
      { phrase: "lol", weight: 2 },
      { phrase: "haha", weight: 2 },
      { phrase: "nope", weight: 2 },
      { phrase: "nah", weight: 2 },
      { phrase: "dawg", weight: 2 },
    ],
  },
  {
    label: "formal",
    phrases: [
      { phrase: "dear", weight: 2 },
      { phrase: "sincerely", weight: 3 },
      { phrase: "regards", weight: 2 },
      { phrase: "respectfully", weight: 3 },
    ],
  },
  {
    label: "sarcastic",
    phrases: [
      { phrase: "yeah right", weight: 3 },
      { phrase: "as if", weight: 3 },
      { phrase: "sure", weight: 1 },
      { phrase: "totally", weight: 1 },
    ],
  },
  {
    label: "blunt",
    phrases: [
      { phrase: "no.", weight: 3 },
      { phrase: "never", weight: 2 },
      { phrase: "not happening", weight: 3 },
      { phrase: "absolutely not", weight: 3 },
    ],
  },
  {
    label: "empathetic",
    phrases: [
      { phrase: "i understand", weight: 3 },
      { phrase: "i hear you", weight: 3 },
      { phrase: "i feel", weight: 1 },
      { phrase: "boundaries", weight: 2 },
    ],
  },
];

const typeRules = [
  {
    label: "professional",
    phrases: [
      { phrase: "meeting", weight: 2 },
      { phrase: "deadline", weight: 3 },
      { phrase: "project", weight: 2 },
      { phrase: "office", weight: 2 },
      { phrase: "boss", weight: 3 },
    ],
  },
  {
    label: "whimsical",
    phrases: [
      { phrase: "wizard", weight: 3 },
      { phrase: "dragon", weight: 3 },
      { phrase: "mana", weight: 2 },
      { phrase: "unicorn", weight: 3 },
      { phrase: "fairy", weight: 3 },
      { phrase: "magic", weight: 2 },
    ],
  },
  {
    label: "absurd",
    phrases: [
      { phrase: "alien", weight: 3 },
      { phrase: "parallel universe", weight: 3 },
      { phrase: "time travel", weight: 3 },
      { phrase: "lava", weight: 2 },
    ],
  },
  {
    label: "personal",
    phrases: [
      { phrase: "boundary", weight: 2 },
      { phrase: "self-care", weight: 3 },
      { phrase: "mental", weight: 2 },
    ],
  },
  {
    label: "meta",
    phrases: [
      { phrase: "no is", weight: 2 },
      { phrase: "saying no", weight: 2 },
      { phrase: "decline", weight: 2 },
      { phrase: "refuse", weight: 2 },
    ],
  },
  {
    label: "practical",
    phrases: [
      { phrase: "schedule", weight: 2 },
      { phrase: "busy", weight: 2 },
      { phrase: "calendar", weight: 3 },
      { phrase: "time", weight: 1 },
    ],
  },
];

const detectTags = (text, tokens, topic) => {
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
    for (const keyword of keywords) {
      const needle = keyword.toLowerCase().trim();
      if (needle.includes(" ")) {
        if (text.includes(needle)) {
          tags.add(tag);
        }
      } else if (tokens.has(needle)) {
        tags.add(tag);
      }
    }
  }

  return Array.from(tags);
};

const updated = reasons.map((entry) => {
  const reason = typeof entry === "string" ? entry : entry.reason;
  const normalized = normalize(reason);
  const tokens = new Set(lemmatizeTokens(reason));

  const topicResult = scoreByRules(normalized, tokens, topicRules, "general");
  const toneResult = scoreByRules(normalized, tokens, toneRules, "neutral");
  const typeResult = scoreByRules(normalized, tokens, typeRules, "general");

  const sentimentScore = sentiment.analyze(reason).score;
  let tone = toneResult.label;
  if (tone === "neutral" && sentimentScore >= 2) {
    tone = "playful";
  } else if (tone === "neutral" && sentimentScore <= -2) {
    tone = "blunt";
  }

  const tags = detectTags(normalized, tokens, topicResult.label);

  return {
    id: entry.id,
    reason,
    type: typeResult.label,
    tone,
    topic: topicResult.label,
    tags,
    confidence: {
      type: typeResult.score,
      tone: toneResult.score,
      topic: topicResult.score,
      sentiment: sentimentScore,
    },
  };
});

fs.writeFileSync(outputPath, JSON.stringify(updated, null, 2) + "\n");
console.log(`Wrote ${updated.length} labeled reasons to ${outputPath}`);
