const path = require("path");
const dotenv = require("dotenv");
const {
  REST,
  Routes,
  ApplicationCommandType,
} = require("discord.js");

dotenv.config({ path: path.join(__dirname, ".env") });

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId) {
  console.error("Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in discord/.env");
  process.exit(1);
}

const commands = [
  {
    name: "no",
    description: "Get a random no reason",
  },
  {
    name: "No this",
    type: ApplicationCommandType.Message,
  },
];

const rest = new REST({ version: "10" }).setToken(token);

const run = async () => {
  try {
    const route = guildId
      ? Routes.applicationGuildCommands(clientId, guildId)
      : Routes.applicationCommands(clientId);
    await rest.put(route, { body: commands });
    console.log("Registered commands.");
  } catch (error) {
    console.error("Failed to register commands:", error);
    process.exit(1);
  }
};

run();
