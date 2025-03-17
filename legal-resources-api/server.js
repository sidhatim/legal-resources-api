require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const cheerio = require("cheerio");
const cron = require("node-cron");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
let legalResources = [];

/**
 * Function to scrape and update legal resources
 */
async function updateLegalResources() {
  console.log("🔄 Updating legal resources...");
  let sources = [
    { name: "Steps to Justice", url: "https://stepstojustice.ca/" },
    { name: "Ontario Family Court Guide", url: "https://www.ontario.ca/document/guide-procedures-family-court" },
    { name: "CLEO Interactive Help", url: "https://www.cleointeractivehelp.ca/" },
    { name: "Ontario Court Forms", url: "https://ontariocourtforms.on.ca/en/" },
    { name: "Legal Aid Ontario", url: "https://www.legalaid.on.ca/" },
    { name: "Law Society of Ontario", url: "https://lso.ca/" },
    { name: "Ontario Attorney General", url: "https://www.attorneygeneral.jus.gov.on.ca/english/" },
    { name: "Ontario Courts", url: "https://www.ontariocourts.ca/ocj/" },
    { name: "Ontario Family Law Services", url: "https://www.ontario.ca/page/family-law-services" }
  ];

  let updatedResources = [];

  for (let i = 0; i < sources.length; i++) {
    try {
      let response = await axios.get(sources[i].url);
      let $ = cheerio.load(response.data);
      let title = $("title").text().trim();
      let description = $("meta[name='description']").attr("content") || "No description available.";

      updatedResources.push({
        id: i + 1,
        title: title || sources[i].name,
        url: sources[i].url,
        description
      });

    } catch (error) {
      console.error(`❌ Failed to fetch ${sources[i].name}:`, error.message);
    }
  }

  legalResources = updatedResources;
  console.log("✅ Legal resources updated!");
}

/**
 * Schedule automatic updates every 24 hours
 */
cron.schedule("0 0 * * *", updateLegalResources); // Runs every day at midnight

/**
 * API Endpoint: Get latest legal resources
 */
app.get("/api/resources", (req, res) => {
  const { page = 1, limit = 10, keyword = "" } = req.query;
  let results = legalResources;

  // Apply filtering
  if (keyword) {
    results = results.filter((item) =>
      item.title.toLowerCase().includes(keyword.toLowerCase()) ||
      item.description.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  // Implement pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedResults = results.slice(startIndex, endIndex);

  res.json({
    total: results.length,
    page: parseInt(page),
    limit: parseInt(limit),
    resources: paginatedResults,
  });
});

/**
 * Root endpoint
 */
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Ontario Legal Resources API!" });
});

/**
 * Start server & update data on launch
 */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  updateLegalResources(); // Fetch initial data on startup
});
