# Discord Bot Setup

This bot supports:
- Slash command: `/no`
- Mention response: `@NopeBot` (bot replies with a reason)
- Message context menu: “No this”

## 1) Create the Discord app
1. https://discord.com/developers/applications → New Application
2. Add a Bot.
3. Copy the **Bot Token**.
4. Turn on **Message Content Intent** (needed for mention replies).

## 2) Create `discord/.env`
Copy the example and fill in values:
```
cp discord/.env.example discord/.env
```

Set:
- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID` (Application ID from Developer Portal)
- `DISCORD_GUILD_ID` (optional, for faster dev command refresh)

## 3) Register commands
```
npm run discord:register
```

## 4) Start the bot
```
npm run discord:bot
```

## 5) Invite the bot
In Developer Portal → OAuth2 → URL Generator:
- Scopes: `bot`, `applications.commands`
- Permissions: `Send Messages`, `Read Message History`
