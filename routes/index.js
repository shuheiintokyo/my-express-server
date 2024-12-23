var express = require('express');
var router = express.Router();

// Home route
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


// Handle POST /export
router.post("/", (req, res) => {
  try {
    const { exportData, tableData } = req.body;

    // Validate incoming data
    if (!tableData) {
      return res.status(400).send("No table data provided.");
    }

    // Parse tableData
    const parsedData = JSON.parse(tableData);

    // Save exportData in session if it exists
    if (exportData) {
      req.session.exportData = exportData;
    }

    // Render export page with the parsed data
    res.render("export", {
      title: "Export Page", // Provide a valid title
      data: parsedData      // Pass parsed table data
    });
  } catch (error) {
    console.error("Error in POST /export:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;