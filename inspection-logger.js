//inspection-logging.js

const fs = require("fs").promises;
const path = require("path");
const express = require("express");
const router = express.Router();

class InspectionLogger {
  constructor() {
    this.logPath = path.join(__dirname, "resources", "inspection-logs.json");
    this.ensureLogFile();
  }

  async ensureLogFile() {
    try {
      await fs.access(this.logPath);
    } catch {
      await fs.writeFile(this.logPath, JSON.stringify({ logs: [] }));
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
    } catch {
      return [];
    }
  }
}

const logger = new InspectionLogger();

// API Routes
router.post("/api/inspection/log", async (req, res) => {
  const { date, fileCount, inspector, notes } = req.body;
  const success = await logger.addLog({
    date,
    fileCount,
    inspector,
    notes,
  });
  res.json({ success });
});

router.get("/api/inspection/logs", async (req, res) => {
  const logs = await logger.getLogs();
  res.json({ logs });
});

// View Route
router.get("/logs", async (req, res) => {
  const logs = await logger.getLogs();
  res.render("inspection-logs", { logs });
});

module.exports = {
  router,
  InspectionLogger: logger,
};
