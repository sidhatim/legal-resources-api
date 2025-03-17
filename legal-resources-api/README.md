# Ontario Legal Resources API

This API provides trusted legal resources from multiple sources with pagination and filtering.

## Setup

1. Install Node.js & npm
2. Run: `bash setup.sh`
3. Start server: `node server.js`

## API Endpoints

- **GET /api/resources** (Retrieve legal resources)
  - **Query Params:**
    - `page` - Pagination (default: 1)
    - `limit` - Number of results per page (default: 10)
    - `keyword` - Search for legal topics (optional)
  
Example:
```
http://localhost:5000/api/resources?page=1&limit=5&keyword=court
```

## Deployment
- Deploy to Heroku, Vercel, or DigitalOcean

---
