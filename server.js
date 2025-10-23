import express from "express";
import axios from "axios";
import crypto from "crypto";
import NodeCache from "node-cache";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.urlencoded({
  extended: true,
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.json());

const cache = new NodeCache({ stdTTL: 60 * 60 });
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || "";
const PIRATE_API_URL = process.env.PIRATE_API_URL || "https://api.funtranslations.com/translate/pirate.json";
const PIRATE_API_KEY = process.env.PIRATE_API_KEY || "";

function verifySlackRequest(req) {
  const timestamp = req.headers["x-slack-request-timestamp"];
  const signature = req.headers["x-slack-signature"];
  if (!timestamp || !signature || !SLACK_SIGNING_SECRET) return false;
  const fiveMinutes = 60 * 5;
  if (Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp, 10)) > fiveMinutes) return false;
  const baseString = `v0:${timestamp}:${req.rawBody || ""}`;
  const hmac = crypto.createHmac("sha256", SLACK_SIGNING_SECRET);
  hmac.update(baseString);
  const mySig = `v0=${hmac.digest("hex")}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(mySig), Buffer.from(signature));
  } catch (e) {
    return false;
  }
}

app.post("/pirate", async (req, res) => {
  if (!verifySlackRequest(req)) return res.status(400).send("Invalid request signature");
  const userText = (req.body.text || "").trim();
  const responseUrl = req.body.response_url;
  if (!userText) return res.json({ response_type: "ephemeral", text: "Usage: `/pirate <text to translate>`" });
  res.json({ response_type: "ephemeral", text: "🏴‍☠️ Translating... (I'll post when ready)" });

  (async () => {
    const cacheKey = `pirate:${userText}`;
    try {
      const cached = cache.get(cacheKey);
      if (cached) {
        await axios.post(responseUrl, { response_type: "in_channel", text: `🏴‍☠️ *Pirate Translation:* ${cached}` });
        return;
      }
      const params = { text: userText };
      if (PIRATE_API_KEY) params.api_key = PIRATE_API_KEY;
      const apiResp = await axios.get(PIRATE_API_URL, { params, timeout: 10000 });
      const pirateText = apiResp.data?.contents?.translated || apiResp.data?.translated || null;
      if (!pirateText) {
        await axios.post(responseUrl, { response_type: "ephemeral", text: "Arr! The translation API gave back nothing useful." });
        return;
      }
      cache.set(cacheKey, pirateText);
      await axios.post(responseUrl, { response_type: "in_channel", text: `🏴‍☠️ *Pirate Translation:* ${pirateText}` });
    } catch (err) {
      console.error("Translation error:", err?.response?.data || err.message || err);
      try {
        await axios.post(responseUrl, { response_type: "ephemeral", text: "Arr! Something went wrong contacting the translation API." });
      } catch {}
    }
  })();
});

app.get("/", (req, res) => res.send("Pirate translator alive 🏴‍☠️"));
const PORT = parseInt(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`Pirate translator listening on ${PORT}`));
