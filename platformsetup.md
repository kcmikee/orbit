ElizaOS Platform Integration Guide
This guide is designed for a partner/developer to separate the infrastructure setup (API keys, Bot accounts) from the agent logic development.

Objective: Create and configure the necessary bot accounts for Discord, Twitter, and Telegram, and populate the .env file with the credentials.

1. Prerequisites
A copy of the Orbit repository.
bun installed on your machine.
Accounts for Discord, Twitter (X), and Telegram.
2. Discord Setup
Create Application:
Go to the Discord Developer Portal.
Click New Application and name it (e.g., "Orbit Manager").
Create Bot:
Go to the Bot tab.
Click Add Bot.
IMPORTANT: Under "Privileged Gateway Intents", enable Message Content Intent, Server Members Intent, and Presence Intent.
Get Token:
Click Reset Token and copy the new token.
Save this as DISCORD_API_TOKEN in your .env file.
Invite to Server:
Go to OAuth2 > URL Generator.
Select scopes: bot.
Select permissions: Read Messages/View Channels, Send Messages, Embed Links, Attach Files, Read Message History.
Copy the generated URL and open it in your browser to invite the bot to your test server.
Get Application ID:
Go to General Information.
Copy Application ID and save as DISCORD_APPLICATION_ID in .env.
3. Twitter (X) Setup
Developer Portal:
Go to the Twitter Developer Portal.
Sign up for a Free or Basic tier account (Free tier has limited posting capabilities, Basic is recommended for full functionality).
Create Project/App:
Create a new Project and App.
Set permissions to Read and Write.
Generate Keys:
Go to Keys and Tokens.
Generate Consumer Keys (API Key and Secret).
Generate Authentication Tokens (Access Token and Secret).
Save these in .env as:
TWITTER_API_KEY
TWITTER_API_SECRET_KEY
TWITTER_ACCESS_TOKEN
TWITTER_ACCESS_TOKEN_SECRET
Alternative: ElizaOS also supports scraping/login via username/password in some configurations, but API keys are more stable. If using login method:
TWITTER_USERNAME
TWITTER_PASSWORD
TWITTER_EMAIL
4. Telegram Setup
BotFather:
Open Telegram and search for @BotFather.
Send /newbot.
Follow prompts to name your bot (e.g., "OrbitTreasuryBot").
Get Token:
BotFather will give you an API Token.
Save this as TELEGRAM_BOT_TOKEN in .env.
5. Implementation & Testing
Configure Environment:
Duplicate 
.env.example
 to .env in the agent directory.
Fill in the keys collected above.
Verification:
Run the agent in development mode:
cd agent
bun install
elizaos start --character characters/development.json --dev
Discord Test: Mention the bot in a channel: @OrbitManager hello. It should reply.
Telegram Test: DM the bot and say hello.
Handover:
Once confirmed, securely share the .env file content with the main developer.
Troubleshooting
Discord: If the bot doesn't reply, check if "Message Content Intent" is enabled in the Developer Portal.
Twitter: If login fails, ensure your account isn't locked/suspended and 2FA settings are compatible.