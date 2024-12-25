// routes/index.js - Main routes
const express = require('express');
const router = express.Router();
const { selected_indices } = require('../config/measurements');

router.get('/', function(req, res) {
    res.render('index', { 
        title: 'Express',
        tableData: req.session.tableData || [],
        selected_indices
    });
});

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