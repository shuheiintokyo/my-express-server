// routes/index.js
const express = require('express');
const router = express.Router();
const { selected_indices } = require('../config/measurements');
const { readTextFiles } = require('../utils/fileProcessor');

router.get('/', async function(req, res) {
    try {
        // If no table data in session, read from files
        if (!req.session.tableData) {
            const tableData = await readTextFiles();
            req.session.tableData = tableData;
        }
        
        res.render('index', {
            title: 'Express',
            tableData: req.session.tableData,
            selected_indices
        });
    } catch (error) {
        console.error('Error loading files:', error);
        res.render('index', {
            title: 'Express',
            tableData: [],
            selected_indices,
            error: 'Error loading files'
        });
    }
});

// Keep your existing /save-table-data route
router.post('/save-table-data', (req, res) => {
    try {
        const { tableData } = req.body;
        req.session.tableData = tableData;
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving table data:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;