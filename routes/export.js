// routes/export.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const { logger: inspectionLogger } = require("./inspection-logging");
const debug = true;

// Measurement configuration
const measurementLimits = {
  0: { min: 8.0, max: 8.4 },
  1: { min: 37.2, max: 37.8 },
  2: { min: 15.7, max: 16.1 },
  3: { min: 23.9, max: 24.3 },
  6: { min: 3.1, max: 3.3 },
  7: { min: 7.8, max: 8.2 },
  8: { min: 4.9, max: 5.1 },
  9: { min: 29.8, max: 30.2 },
  10: { min: 154.9, max: 155.9 },
  11: { min: 82.8, max: 83.4 },
};

const measurementMap = {
  103: 0, // ①
  99: 1, // ②
  177: 2, // ③
  158: 3, // ④
  114: 6, // ⑥
  182: 7, // ⑥
  193: 8, // ⑥
  79: 9, // ⑦
  148: 10, // ⑧
  174: 11, // ⑨
};

function getMeasurements(filteredValues, selected_indices) {
  if (!Array.isArray(filteredValues) || !Array.isArray(selected_indices)) {
    console.error(
      "Invalid input: filteredValues and selected_indices must be arrays"
    );
    return Array(16).fill("-");
  }

  const measurements = Array(16).fill("-");

  try {
    filteredValues.forEach((value, index) => {
      if (index >= selected_indices.length) return;

      const columnIndex = selected_indices[index];
      const tableIndex = measurementMap[columnIndex];

      if (columnIndex === "") return;

      if (tableIndex !== undefined && value !== "" && value != null) {
        const numberValue = Number(value);
        if (isNaN(numberValue)) {
          console.warn(`Invalid number value at index ${index}: ${value}`);
          return;
        }

        const numValue = Math.abs(numberValue).toFixed(2);
        const limits = measurementLimits[tableIndex];
        const isOutOfRange =
          limits && (numValue < limits.min || numValue > limits.max);

        measurements[tableIndex] = isOutOfRange
          ? `<span class="out-of-range">${numValue}</span>`
          : `<span class="measurement">${numValue}</span>`;
      }
    });
  } catch (error) {
    console.error("Error in getMeasurements:", error);
    return Array(16).fill("-");
  }

  return measurements;
}

// Routes
router.get("/", (req, res) => {
  const exportData = req.session.exportData || [];
  const selected_indices = [
    103,
    99,
    177,
    158,
    "",
    "",
    114,
    182,
    193,
    79,
    148,
    174,
    "",
    "",
    "",
  ];
  res.render("export", {
    title: "検査シート",
    data: exportData,
    selected_indices,
    getMeasurements,
  });
});

router.get("/api/weights", async (req, res) => {
  try {
    const weightsPath = path.join(
      __dirname,
      "..",
      "resources",
      "weightdata",
      "weights.json"
    );

    // Log the attempted path
    console.log("Attempting to read weights from:", weightsPath);

    // Check if file exists
    try {
      await fs.access(weightsPath);
    } catch (err) {
      console.error("File does not exist:", weightsPath);
      return res.status(404).json({
        success: false,
        error: "Weights file not found",
      });
    }

    // Read the file
    const weightData = await fs.readFile(weightsPath, "utf8");
    console.log("Successfully read weight data:", weightData);

    const weights = JSON.parse(weightData);

    // Send back just the weights data first to verify it's working
    return res.json({
      success: true,
      weights: weights,
    });
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

router.post("/", (req, res) => {
  try {
    const { exportData } = req.body;
    if (!exportData) {
      return res.status(400).json({ error: "No export data provided" });
    }
    req.session.exportData = exportData;
    res.status(200).json({ message: "Data saved successfully" });
  } catch (error) {
    console.error("Error saving export data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/inspection/update", (req, res) => {
  try {
    const { fileIndex, valueIndex, value } = req.body;
    const exportData = req.session.exportData;

    if (!exportData || !exportData[fileIndex]) {
      return res.status(400).json({ error: "Invalid file index" });
    }

    if (!exportData[fileIndex].inspectionValues) {
      exportData[fileIndex].inspectionValues = {};
    }

    exportData[fileIndex].inspectionValues[valueIndex] = value;
    req.session.exportData = exportData;

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating inspection value:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

router.get("/inspection/:fileIndex", (req, res) => {
  try {
    const fileIndex = parseInt(req.params.fileIndex);
    const exportData = req.session.exportData;

    if (!exportData || !exportData[fileIndex]) {
      return res.status(400).json({ error: "Invalid file index" });
    }

    res.json({
      success: true,
      data: exportData[fileIndex].inspectionValues || {},
    });
  } catch (error) {
    console.error("Error getting inspection values:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

router.post("/inspection/weight-import", (req, res) => {
  try {
    const { weightData } = req.body;
    const exportData = req.session.exportData;

    if (!exportData) {
      return res
        .status(400)
        .json({ success: false, error: "No export data found" });
    }

    // Update the exportData with weight values
    exportData.forEach((item) => {
      const fileName = item.fileName;
      if (weightData[fileName]) {
        if (!item.inspectionValues) {
          item.inspectionValues = {};
        }
        item.inspectionValues[15] = weightData[fileName];
      }
    });

    // Save updated data back to session
    req.session.exportData = exportData;

    res.json({ success: true });
  } catch (error) {
    console.error("Error importing weight data:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

router.get("/api/completed-files", (req, res) => {
  try {
    const completedFiles = req.session.completedFiles || [];
    res.json(completedFiles);
  } catch (error) {
    console.error("Error getting completed files:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/header/update", (req, res) => {
  try {
    const { field, value } = req.body;
    if (!req.session.headerData) {
      req.session.headerData = {};
    }
    req.session.headerData[field] = value;
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating header:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/inspection/log", async (req, res) => {
  try {
    const { date, fileCount, inspector, notes, files } = req.body;

    const success = await inspectionLogger.addLog({
      date,
      fileCount,
      inspector,
      notes,
      files,
    });

    if (!success) {
      throw new Error("Failed to save inspection log");
    }

    // Update session data
    if (!req.session.completedFiles) {
      req.session.completedFiles = [];
    }
    req.session.completedFiles = [
      ...new Set([...req.session.completedFiles, ...(files || [])]),
    ];

    res.json({ success: true });
  } catch (error) {
    console.error("Error logging inspection:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/inspection/logs", async (req, res) => {
  try {
    // Path to your logs file
    const logsPath = path.join(__dirname, "..", "logs", "inspection-logs.json");

    if (debug) {
      console.log("Attempting to read logs from: ", logsPath);
    }

    try {
      await fs.access(logsPath);
    } catch (err) {
      console.error("Logs file not found at:", logsPath);
      return res.status(404).json({
        error: "Logs file not found",
        path: logsPath,
      });
    }

    // Read the logs file
    const logsData = await fs.readFile(logsPath, "utf8");
    const logs = JSON.parse(logsData);

    res.json(logs);
  } catch (error) {
    console.error("Error retrieving logs:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

module.exports = router;
