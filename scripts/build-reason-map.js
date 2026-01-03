const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const reasonsPath = path.join(__dirname, "..", "data", "reasons.json");
const docsReasonsPath = path.join(__dirname, "..", "docs", "reasons.json");
const outputPath = path.join(__dirname, "..", "docs", "reasons-map.json");

const reasons = JSON.parse(fs.readFileSync(reasonsPath, "utf8"));
const map = {};

const hashReason = (text) =>
  crypto.createHash("sha256").update(text, "utf8").digest("hex").slice(0, 15);

for (const reason of reasons) {
  const hash = hashReason(reason);
  if (map[hash] && map[hash] !== reason) {
    throw new Error(`Hash collision for "${reason}" and "${map[hash]}"`);
  }
  map[hash] = reason;
}

fs.writeFileSync(docsReasonsPath, JSON.stringify(reasons, null, 2) + "\n");
fs.writeFileSync(outputPath, JSON.stringify(map, null, 2) + "\n");
console.log(`Copied reasons to ${docsReasonsPath}`);
console.log(`Wrote ${Object.keys(map).length} reasons to ${outputPath}`);
