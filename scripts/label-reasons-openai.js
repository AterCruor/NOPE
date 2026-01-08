const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "..", "data", "reasons.json");
const outputPath =
  process.env.LABEL_OUTPUT ||
  path.join(__dirname, "..", "data", "reasonsOpenAI.json");

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!apiKey) {
  console.error("Missing OPENAI_API_KEY.");
  process.exit(1);
}

const reasons = JSON.parse(fs.readFileSync(inputPath, "utf8"));

const labels = {
  types: [
    "general",
    "professional",
    "personal",
    "practical",
    "whimsical",
    "absurd",
    "meta",
  ],
  tones: [
    "neutral",
    "polite",
    "playful",
    "sarcastic",
    "blunt",
    "empathetic",
    "formal",
  ],
  topics: [
    "work",
    "school",
    "social",
    "family",
    "health",
    "mental",
    "self-care",
    "sleep",
    "travel",
    "weather",
    "money",
    "tech",
    "pets",
    "food",
    "time",
    "general",
  ],
  tags: [
    "short",
    "long",
    "deadline",
    "meeting",
    "couch",
    "party",
    "coffee",
    "procrastination",
    "introvert",
    "extrovert",
    "pop-culture",
  ],
};

const chunk = (items, size) => {
  const batches = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestLabels = async (batch) => {
  const payload = {
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "text",
            text:
              "You are labeling short 'no' reasons. " +
              "Return ONLY valid JSON array; no prose.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Label each item with type, tone, topic, and tags. " +
              "Allowed labels:\n" +
              `types: ${labels.types.join(", ")}\n` +
              `tones: ${labels.tones.join(", ")}\n` +
              `topics: ${labels.topics.join(", ")}\n` +
              `tags: ${labels.tags.join(", ")}\n` +
              "Rules:\n" +
              "- Use only allowed labels.\n" +
              "- tags: 0 to 3 items.\n" +
              "- If unsure, use 'general' for type/topic and 'neutral' for tone.\n" +
              "Return JSON array of objects with: id, type, tone, topic, tags.\n\n" +
              JSON.stringify(
                batch.map((r) => ({ id: r.id, reason: r.reason })),
                null,
                2
              ),
          },
        ],
      },
    ],
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const outputText =
    data.output_text ||
    (data.output && data.output[0] && data.output[0].content[0].text) ||
    "";

  if (!outputText) {
    throw new Error("Empty response from OpenAI.");
  }

  return JSON.parse(outputText);
};

const run = async () => {
  const batchSize = Number(process.env.LABEL_BATCH_SIZE || 12);
  const batches = chunk(reasons, batchSize);
  const results = [];

  for (let i = 0; i < batches.length; i += 1) {
    const batch = batches[i];
    try {
      const labeled = await requestLabels(batch);
      results.push(...labeled);
      console.log(`Labeled batch ${i + 1}/${batches.length}`);
    } catch (error) {
      console.error(`Batch ${i + 1} failed:`, error.message);
      throw error;
    }
    await sleep(300);
  }

  const labelsById = new Map(results.map((item) => [item.id, item]));
  const merged = reasons.map((entry) => {
    const label = labelsById.get(entry.id);
    if (!label) {
      return entry;
    }
    return {
      ...entry,
      type: label.type,
      tone: label.tone,
      topic: label.topic,
      tags: Array.isArray(label.tags) ? label.tags : [],
    };
  });

  fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2) + "\n");
  console.log(`Wrote labeled reasons to ${outputPath}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
