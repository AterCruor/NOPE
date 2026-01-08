const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const reasonsPath = path.join(__dirname, "..", "data", "reasons.json");
const docsReasonsPath = path.join(__dirname, "..", "docs", "reasons.json");

const rawReasons = JSON.parse(fs.readFileSync(reasonsPath, "utf8"));

const hashReason = (text) =>
  crypto.createHash("sha256").update(text, "utf8").digest("hex").slice(0, 15);

const normalizeReason = (item) => {
  const base = typeof item === "string" ? { reason: item } : item;
  if (!base || typeof base.reason !== "string") {
    throw new Error("Each reason must include a string 'reason' field.");
  }

  return {
    ...base,
    id: base.id || hashReason(base.reason),
    reason: base.reason,
    type: base.type || "general",
    tone: base.tone || "neutral",
    topic: base.topic || "general",
    tags: Array.isArray(base.tags) ? base.tags : [],
  };
};

const reasons = rawReasons.map(normalizeReason);
const idMap = new Map();

for (const item of reasons) {
  if (idMap.has(item.id) && idMap.get(item.id) !== item.reason) {
    throw new Error(`ID collision for "${item.reason}"`);
  }
  idMap.set(item.id, item.reason);
}

fs.writeFileSync(reasonsPath, JSON.stringify(reasons, null, 2) + "\n");
fs.writeFileSync(docsReasonsPath, JSON.stringify(reasons, null, 2) + "\n");

console.log(`Wrote ${reasons.length} reasons to ${reasonsPath}`);
console.log(`Copied reasons to ${docsReasonsPath}`);
