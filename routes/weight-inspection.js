const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Constants for file paths
const WEIGHT_DATA_DIR = path.join(__dirname, '..', 'resources', 'weightdata');
const WEIGHT_DATA_FILE = path.join(WEIGHT_DATA_DIR, 'weights.json');

// Ensure the weightdata directory exists
async function ensureWeightDataDirectory() {
    try {
        await fs.access(WEIGHT_DATA_DIR);
    } catch {
        await fs.mkdir(WEIGHT_DATA_DIR, { recursive: true });
    }
}

// Load existing weight data
async function loadWeightData() {
    try {
        await ensureWeightDataDirectory();
        const data = await fs.readFile(WEIGHT_DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

// Main route for weight inspection page
router.get('/', async (req, res) => {
    try {
        // Get existing weight data
        const weightData = await loadWeightData();
        
        // Get file names from session
        const sessionFiles = req.session.tableData || [];
        
        // Combine session files with weight data
        const files = sessionFiles.map(file => ({
            fileName: file.fileName,
            weight: weightData.find(w => w.fileName === file.fileName)?.weight || ''
        }));
        
        res.render('weight-inspection', { files });
    } catch (error) {
        console.error('Error loading weight inspection:', error);
        res.status(500).send('Error loading weight inspection page');
    }
});

// Save weight data
router.post('/save', async (req, res) => {
    try {
        const { weightData } = req.body;
        await ensureWeightDataDirectory();
        await fs.writeFile(
            WEIGHT_DATA_FILE,
            JSON.stringify(weightData, null, 2),
            'utf8'
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving weight data:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to save weight data'
        });
    }
});

module.exports = router;