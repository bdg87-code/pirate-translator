import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// In-memory token storage (user_id -> token)
const userTokens = {};

const PIRATE_API_URL = process.env.PIRATE_API_URL || "https://pirate.monkeyness.com/api/translate";
const CLIENT_ID = process.env.SLACK_CLIENT_ID;
const CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const PORT = parseInt(process.env.PORT) || 3000;

// OAuth redirect endpoint
app.get("/slack/oauth_redirect", async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send("No code provided");
    try {
        const response = await axios.post("https://slack.com/api/oauth.v2.access", null, {
            params: {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code,
                redirect_uri: `https://pirate-translator.onrender.com/slack/oauth_redirect`
            }
        });
        if (!response.data.ok) return res.send("OAuth failed: " + JSON.stringify(response.data));
        const user_id = response.data.authed_user.id;
        const token = response.data.authed_user.access_token;
        userTokens[user_id] = token;
        res.send("Success! You can now use /pirate and your messages will appear as you.");
    } catch (err) {
        console.error(err);
        res.send("OAuth error");
    }
});

app.post("/pirate", async (req, res) => {
    try {
        const userText = (req.body.text || "").trim();
        const user_id = req.body.user_id;
        const channel_id = req.body.channel_id;
        const response_url = req.body.response_url;

        if (!userText) {
            return res.json({ response_type: "ephemeral", text: "Usage: `/pirate <text>`" });
        }

        if (!userTokens[user_id]) {
            const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${CLIENT_ID}&scope=chat:write,commands,users:read&user_scope=chat:write&redirect_uri=https://pirate-translator.onrender.com/slack/oauth_redirect`;
            return res.json({ response_type: "ephemeral", text: `Please authorize first: ${authUrl}` });
        }

        res.json({ response_type: "ephemeral", text: "🏴‍☠️ Translating... posting as you shortly." });

        // Call Pirate Monkeyness API
        const params = new URLSearchParams({ english: userText });
        const pirateResp = await axios.get(`${PIRATE_API_URL}?${params.toString()}`, { responseType: "text" });
        const pirateText = pirateResp.data.trim() || userText;

        // Post message as user
        await axios.post("https://slack.com/api/chat.postMessage", {
            channel: channel_id,
            text: pirateText
        }, { headers: { Authorization: `Bearer ${userTokens[user_id]}` } });
    } catch (err) {
        console.error(err);
        try {
            await axios.post(req.body.response_url, { response_type: "ephemeral", text: "Error translating or posting message" });
        } catch {}
    }
});

app.get("/", (req, res) => res.send("Pirate Translator OAuth version alive 🏴‍☠️"));

app.listen(PORT, () => console.log(`Pirate translator OAuth listening on ${PORT}`));
