require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const cheerio = require("cheerio");
const cron = require("node-cron");
const NodeCache = require("node-cache");
const rateLimit = require("express-rate-limit");
const puppeteer = require("puppeteer");

const app = express();
app.use(cors());
app.use(express.json());

// ⚡ Enable caching for faster API responses
const cache = new NodeCache({ stdTTL: 86400 }); // Cache for 24 hours

const PORT = process.env.PORT || 5000;

// 🔹 Rate limiter to prevent API abuse
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Max 100 requests per minute per IP
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// 🔗 Legal Resource URLs
const sources = [
  { name: "Steps to Justice", url: "https://stepstojustice.ca/" },
  { name: "Ontario Family Court Guide", url: "https://www.ontario.ca/document/guide-procedures-family-court" },
  { name: "CLEO Interactive Help", url: "https://www.cleointeractivehelp.ca/" },
  { name: "Ontario Court Forms", url: "https://ontariocourtforms.on.ca/en/" },
  { name: "Legal Aid Ontario", url: "https://www.legalaid.on.ca/" },
  { name: "Law Society of Ontario", url: "https://lso.ca/" },
  { name: "Ontario Attorney General", url: "https://www.attorneygeneral.jus.gov.on.ca/english/" }, // Blocked website
  { name: "Ontario Courts", url: "https://www.ontariocourts.ca/ocj/" },
  { name: "Ontario Family Law Services", url: "https://www.ontario.ca/page/family-law-services" },
];

// 🖥️ **Fetch blocked sites with Puppeteer**
async function fetchWithBrowser(url) {
  console.log(`🌐 Fetching ${url} with Puppeteer...`);
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });

  const title = await page.title();
  const description = await page.$eval("meta[name='description']", el => el.content).catch(() => "No description available.");

  await browser.close();
  return { title, description };
}

// 📌 **Fetch Resource Function**
async function fetchResource(url, name) {
  try {
    const cachedData = cache.get(url);
    if (cachedData) return cachedData;

    // If site is blocked, use Puppeteer
    if (url.includes("attorneygeneral.jus.gov.on.ca")) {
      const data = await fetchWithBrowser(url);
      cache.set(url, data);
      return data;
    }

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000, // 10s timeout
    });

    let $ = cheerio.load(response.data);
    let title = $("title").text().trim();
    let description = $("meta[name='description']").attr("content") || "No description available.";

    const resource = { title, description, url };
    cache.set(url, resource);
    return resource;
  } catch (error) {
    console.error(`❌ Error fetching ${name}: ${error.message}`);
    return { title: name, description: "Failed to fetch data.", url };
  }
}

// 📌 **Update Legal Resources**
async function updateLegalResources() {
  console.log("🔄 Updating legal resources...");
  let updatedResources = [];

  for (let i = 0; i < sources.length; i++) {
    let resource = await fetchResource(sources[i].url, sources[i].name);
    updatedResources.push({ id: i + 1, ...resource });
  }

  cache.set("legalResources", updatedResources);
  console.log("✅ Legal resources updated!");
}

// ⏳ **Schedule updates every 24 hours**
cron.schedule("0 0 * * *", updateLegalResources); // Runs every day at midnight

// 📌 **API Endpoint: Get latest legal resources**
app.get("/api/resources", (req, res) => {
  const { page = 1, limit = 10, keyword = "" } = req.query;
  let results = cache.get("legalResources") || [];

  // Apply filtering
  if (keyword) {
    results = results.filter(item =>
      item.title.toLowerCase().includes(keyword.toLowerCase()) ||
      item.description.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  // Implement pagination
  const startIndex = (page - 1) * limit;
  const paginatedResults = results.slice(startIndex, startIndex + Number(limit));

  res.json({
    total: results.length,
    page: parseInt(page),
    limit: parseInt(limit),
    resources: paginatedResults,
  });
});

// 📌 **Root Endpoint**
app.get("/", (req, res) => {
  res.json({ message: "✅ Ontario Legal Resources API is running!" });
});

// 📌 **Start Server & Fetch Initial Data**
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  updateLegalResources(); // Fetch initial data on startup
});
