const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Path to the JSON data
const DATA_PATH = path.join(__dirname, "database.json");

// Serve static files (HTML, CSS, JS) from the root directory
app.use(express.static(__dirname));
app.use(bodyParser.json());

// POST endpoint to add a tag
app.post("/add-tag", (req, res) => {
  const { category, index, tag } = req.body;

  if (!category || index === undefined || !tag) {
    return res.status(400).json({ error: "Missing data" });
  }

  // Read and update JSON
  fs.readFile(DATA_PATH, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Failed to read data file" });

    let json;
    try {
      json = JSON.parse(data);
    } catch (parseErr) {
      return res.status(500).json({ error: "Invalid JSON structure" });
    }

    const item = json[category]?.[index];
    if (!item) return res.status(404).json({ error: "Item not found" });

    // Add tag if not already present
    item.tags = item.tags || [];
    if (!item.tags.includes(tag)) {
      item.tags.push(tag);
    }

    // Write updated data back to file
    fs.writeFile(DATA_PATH, JSON.stringify(json, null, 2), err => {
      if (err) return res.status(500).json({ error: "Failed to write data file" });
      res.json({ success: true });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
