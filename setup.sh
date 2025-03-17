#!/bin/bash

# Step 1: Create Project Directory
mkdir legal-resources-api && cd legal-resources-api

# Step 2: Initialize Node.js Project
npm init -y

# Step 3: Install Dependencies
npm install express axios dotenv cors

# Step 4: Create .env File
cat <<EOT >> .env
PORT=5000
EXTERNAL_SOURCES='[
  "https://stepstojustice.ca/",
  "https://www.ontario.ca/document/guide-procedures-family-court",
  "https://www.cleointeractivehelp.ca/",
  "https://ontariocourtforms.on.ca/en/",
  "https://www.legalaid.on.ca/",
  "https://lso.ca/",
  "https://www.attorneygeneral.jus.gov.on.ca/english/",
  "https://www.ontariocourts.ca/ocj/",
  "https://www.ontario.ca/page/family-law-services"
]'
EOT

# Step 5: Create server.js (Main API File)
cat <<EOT >> server.js
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
        title: \`Legal Resource \${index + 1}\`,
        url: source,
        description: \`Information provided by \${new URL(source).hostname}\`,
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
  console.log(\`Server running on port \${PORT}\`);
});
EOT

# Step 6: Create README.md for Documentation
cat <<EOT >> README.md
# Ontario Legal Resources API

This API provides trusted legal resources from multiple sources with pagination and filtering.

## Setup

1. Install Node.js & npm
2. Run: \`bash setup.sh\`
3. Start server: \`node server.js\`

## API Endpoints

- **GET /api/resources** (Retrieve legal resources)
  - **Query Params:**
    - \`page\` - Pagination (default: 1)
    - \`limit\` - Number of results per page (default: 10)
    - \`keyword\` - Search for legal topics (optional)
  
Example:
\`\`\`
http://localhost:5000/api/resources?page=1&limit=5&keyword=court
\`\`\`

## Deployment
- Deploy to Heroku, Vercel, or DigitalOcean

---
EOT

echo "✅ Setup Complete! To start the API, run: node server.js"
