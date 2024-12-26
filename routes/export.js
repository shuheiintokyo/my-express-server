// routes/export.js - Export routes
const express = require('express');
const router = express.Router();
const { selected_indices } = require('../config/measurements');
const { getMeasurements } = require('../utils/measurements');

router.get('/', (req, res) => {
    const exportData = req.session.exportData || [];
    res.render('export', {
        title: '検査シート',
        data: exportData,
        selected_indices,
        getMeasurements
    });
});

router.post('/', (req, res) => {
    try {
        const { exportData } = req.body;
        if (!exportData) {
            return res.status(400).json({ error: 'No export data provided' });
        }
        req.session.exportData = exportData;
        res.status(200).json({ message: 'Data saved successfully' });
    } catch (error) {
        console.error('Error saving export data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/inspection/update', (req, res) => {
    try {
        const { fileIndex, valueIndex, value } = req.body;
        const exportData = req.session.exportData;
        
        if (!exportData || !exportData[fileIndex]) {
            return res.status(400).json({ error: 'Invalid file index' });
        }

        if (!exportData[fileIndex].inspectionValues) {
            exportData[fileIndex].inspectionValues = {};
        }

        exportData[fileIndex].inspectionValues[valueIndex] = value;
        req.session.exportData = exportData;

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating inspection value:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Add this to your existing routes in export.js
router.post('/inspection/mass-approve', (req, res) => {
    try {
        const { indices, value } = req.body;
        const exportData = req.session.exportData;

        if (!exportData) {
            return res.status(400).json({ error: 'No export data available' });
        }

        // Update all files in the export data
        exportData.forEach(file => {
            if (!file.inspectionValues) {
                file.inspectionValues = {};
            }
            indices.forEach(index => {
                file.inspectionValues[index] = value;
            });
        });

        req.session.exportData = exportData;
        res.json({ success: true });
    } catch (error) {
        console.error('Error applying mass approval:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;