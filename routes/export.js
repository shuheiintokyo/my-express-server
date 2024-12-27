// routes/export.js
const express = require('express');
const router = express.Router();

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
    11: { min: 82.8, max: 83.4 }
};

const measurementMap = {
    103: 0,  // ①
    99: 1,   // ②
    177: 2,  // ③
    158: 3,  // ④
    114: 6,  // ⑥
    182: 7,  // ⑥
    193: 8,  // ⑥
    79: 9,   // ⑦
    148: 10, // ⑧
    174: 11  // ⑨
};

function getMeasurements(filteredValues, selected_indices) {
    if (!Array.isArray(filteredValues) || !Array.isArray(selected_indices)) {
        console.error('Invalid input: filteredValues and selected_indices must be arrays');
        return Array(16).fill('-');
    }

    const measurements = Array(16).fill('-');
    
    try {
        filteredValues.forEach((value, index) => {
            if (index >= selected_indices.length) return;

            const columnIndex = selected_indices[index];
            const tableIndex = measurementMap[columnIndex];
            
            if (columnIndex === "") return;
            
            if (tableIndex !== undefined && value !== '' && value != null) {
                const numberValue = Number(value);
                if (isNaN(numberValue)) {
                    console.warn(`Invalid number value at index ${index}: ${value}`);
                    return;
                }

                const numValue = Math.abs(numberValue).toFixed(2);
                const limits = measurementLimits[tableIndex];
                const isOutOfRange = limits && (numValue < limits.min || numValue > limits.max);
                
                measurements[tableIndex] = isOutOfRange 
                    ? `<span class="out-of-range">${numValue}</span>`
                    : `<span class="measurement">${numValue}</span>`;
            }
        });
    } catch (error) {
        console.error('Error in getMeasurements:', error);
        return Array(16).fill('-');
    }
    
    return measurements;
}

// Routes
router.get('/', (req, res) => {
    const exportData = req.session.exportData || [];
    const selected_indices = [103, 99, 177, 158, '', '', 114, 182, 193, 79, 148, 174, '', '', '',];
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
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
});

router.get('/inspection/:fileIndex', (req, res) => {
    try {
        const fileIndex = parseInt(req.params.fileIndex);
        const exportData = req.session.exportData;
        
        if (!exportData || !exportData[fileIndex]) {
            return res.status(400).json({ error: 'Invalid file index' });
        }

        res.json({
            success: true,
            data: exportData[fileIndex].inspectionValues || {}
        });
    } catch (error) {
        console.error('Error getting inspection values:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
});

router.post('/inspection/weight-import', (req, res) => {
    try {
        const { weightData } = req.body;
        const exportData = req.session.exportData;

        if (!exportData) {
            return res.status(400).json({ success: false, error: 'No export data found' });
        }

        // Update the exportData with weight values
        exportData.forEach(item => {
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
        console.error('Error importing weight data:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
});

module.exports = router;