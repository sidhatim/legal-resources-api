require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const EXTERNAL_SOURCES = JSON.parse(process.env.EXTERNAL_SOURCES);

/**
 * API Endpoint: Fetch legal resources
 * Supports:
 * - Pagination (page & limit)
 * - Keyword filtering (search by title or description)
 */
app.get("/api/resources", async (req, res) => {
  try {
    const { page = 1, limit = 10, keyword = "" } = req.query;
    let results = [];

    // Simulated API responses from external sources
    EXTERNAL_SOURCES.forEach((source, index) => {
      results.push({
        id: index + 1,
        title: `Legal Resource ${index + 1}`,
        url: source,
        description: `Information provided by ${new URL(source).hostname}`,
      });
    });

    // Apply keyword filtering
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
  } catch (error) {
    console.error("Error fetching resources:", error.message);
    res.status(500).json({ error: "Failed to fetch legal resources" });
  }
});

/**
 * Root endpoint - API Welcome Message
 */
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Ontario Legal Resources API!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
