# Pirate-Translator Bot Token Version

## Features
- Slack /pirate slash command (root `/` endpoint)
- Uses Bot Token for posting messages (no user token required)
- Logs Slack API responses for debugging
- Translates text via Pirate Monkeyness API
- Immediate ephemeral feedback to the user

## Setup

1. Deploy to Render (or run locally with `npm start`)
2. In Slack, set the slash command `/pirate` Request URL to:
   `https://pirate-translator.onrender.com`
3. Make sure the Slack app has the Bot Token with `chat:write` scope
4. Install the app to your workspace

## Usage
- Type `/pirate <text>` in any channel
- The bot posts the translated message using its token
- Check logs for any errors or API responses

## Notes
- No user token storage needed
- Slash command endpoint is root `/`
- Pirate Monkeyness API does not require authentication
