import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const PIRATE_API_URL = process.env.PIRATE_API_URL || "https://pirate-monkeyness.com/api/translate";
const PORT = parseInt(process.env.PORT) || 3000;

// Root endpoint handles slash command
app.post("/", async (req, res) => {
    try {
        const userText = (req.body.text || "").trim();
        const channel_id = req.body.channel_id;

        if (!userText) {
            return res.json({ response_type: "ephemeral", text: "Usage: `/pirate <text>`" });
        }

        // Immediate ephemeral response to avoid dispatch_failed
        res.json({ response_type: "ephemeral", text: "🏴‍☠️ Translating... posting as you shortly." });

        // Translate via Pirate Monkeyness API
        const params = new URLSearchParams({ english: userText });
        const pirateResp = await axios.get(`${PIRATE_API_URL}?${params.toString()}`, { responseType: "text" });
        const pirateText = pirateResp.data.trim() || userText;

        // Post to Slack using bot token
        const slackResp = await axios.post(
            "https://slack.com/api/chat.postMessage",
            { channel: channel_id, text: pirateText },
            { headers: { Authorization: `Bearer ${BOT_TOKEN}`, "Content-Type": "application/json" } }
        );

        console.log("Posted to Slack:", slackResp.data);

    } catch (err) {
        console.error("Error translating or posting message:", err.response?.data || err.message);
    }
});

app.get("/", (req, res) => res.send("Pirate Translator Bot-Token version alive 🏴‍☠️"));

app.listen(PORT, () => console.log(`Pirate translator bot-token version listening on ${PORT}`));
