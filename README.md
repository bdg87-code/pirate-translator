# Pirate-Translator OAuth Version

## Features
- Slack /pirate slash command
- Uses Pirate Monkeyness API for translation
- Posts messages **as the user** via Slack OAuth
- In-memory user token storage (resets on app restart)

## Setup

1. Create a new Slack App:
   - Scopes: `chat:write`, `commands`, `users:read`
   - Redirect URL: `https://pirate-translator.onrender.com/slack/oauth_redirect`
2. Copy your `client_id` and `client_secret` into `.env`
3. Deploy to Render (or run locally with `npm start`)

## Usage
- Install app to workspace
- Type `/pirate <text>` in any channel
- If not authorized, Slack will give a link to authorize
- After authorizing, messages appear **as you**

## Notes
- Pirate Monkeyness API does not require authentication
- Token storage is in-memory; will reset on app restart
