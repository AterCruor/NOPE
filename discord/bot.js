const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
} = require("discord.js");

dotenv.config({ path: path.join(__dirname, ".env") });

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("Missing DISCORD_TOKEN in discord/.env");
  process.exit(1);
}

const reasonsPath = path.join(__dirname, "..", "data", "reasons.json");
const reasons = JSON.parse(fs.readFileSync(reasonsPath, "utf8"));

const getNoReason = () =>
  reasons[Math.floor(Math.random() * reasons.length)];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "no") {
      await interaction.reply(getNoReason());
    }
    return;
  }

  if (interaction.isMessageContextMenuCommand()) {
    if (interaction.commandName === "No this") {
      const reason = getNoReason();
      await interaction.reply({
        content: reason,
        allowedMentions: { repliedUser: false },
      });
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) {
    return;
  }

  if (message.mentions.has(client.user)) {
    const reason = getNoReason();
    await message.reply({
      content: reason,
      allowedMentions: { repliedUser: false },
    });
  }
});

client.login(token);
