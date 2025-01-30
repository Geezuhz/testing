const express = require("express");
const serverless = require("serverless-http");
const rateLimit = require("express-rate-limit");
const fetch = require("node-fetch");

const app = express();
const router = express.Router();

// ✅ Fix: Use Netlify's header for IP instead of req.ip
const getClientIp = (req) => req.headers["x-nf-client-connection-ip"] || "unknown";

// ✅ Rate limit: 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per IP
  keyGenerator: getClientIp, // Use Netlify's provided IP header
  message: "Too many requests, please try again later.",
});

app.use(limiter);

router.get("/proxy", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data", details: error.message });
  }
});

app.use("/.netlify/functions/api", router);
module.exports.handler = serverless(app);
