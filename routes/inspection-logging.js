const fs = require("fs").promises;
const path = require("path");
const express = require("express");
const router = express.Router();

class InspectionLogger {
  constructor() {
    this.logPath = path.join(__dirname, "logs", "inspection-logs.json");
    this.ensureLogFile();
  }

  async ensureLogFile() {
    try {
      // Ensure logs directory exists
      const logsDir = path.dirname(this.logPath);
      try {
        await fs.mkdir(logsDir, { recursive: true });
      } catch (err) {
        if (err.code !== "EEXIST") throw err;
      }

      // Check if file exists, if not create it
      try {
        await fs.access(this.logPath);
      } catch {
        await fs.writeFile(this.logPath, JSON.stringify({ logs: [] }, null, 2));
      }
    } catch (error) {
      console.error("Error ensuring log file:", error);
    }
  }

  async addLog(logData) {
    try {
      const logs = await this.getLogs();
      logs.push({
        ...logData,
        timestamp: new Date().toISOString(),
      });

      await fs.writeFile(this.logPath, JSON.stringify({ logs }, null, 2));
      return true;
    } catch (error) {
      console.error("Logging error:", error);
      return false;
    }
  }

  async getLogs() {
    try {
      const data = await fs.readFile(this.logPath, "utf8");
      return JSON.parse(data).logs;
    } catch (error) {
      console.error("Error reading logs:", error);
      return [];
    }
  }
}

const logger = new InspectionLogger();

router.post("/api/inspection/log", async (req, res) => {
  try {
    const { date, fileCount, inspector, notes, files } = req.body;

    // Add to session
    if (!req.session.inspectionLogs) {
      req.session.inspectionLogs = [];
    }
    if (!req.session.completedFiles) {
      req.session.completedFiles = [];
    }

    const logEntry = {
      date,
      fileCount,
      inspector,
      notes,
      files,
      timestamp: new Date().toISOString(),
    };

    req.session.inspectionLogs.push(logEntry);
    req.session.completedFiles = [
      ...new Set([...req.session.completedFiles, ...(files || [])]),
    ];

    // Save to JSON file
    const success = await logger.addLog(logEntry);

    if (!success) {
      throw new Error("Failed to save inspection log to file");
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error logging inspection:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/inspection/logs", async (req, res) => {
  try {
    const logs = await logger.getLogs();
    res.json({ logs });
  } catch (error) {
    console.error("Error retrieving logs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/inspection/view", async (req, res) => {
  const logs = await logger.getLogs();
  res.render("inspection-logs", { logs });
});

module.exports = {
  router,
  logger,
};
