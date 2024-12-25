// utils/measurements.js - Shared utility functions
const { measurementLimits, measurementMap } = require('../config/measurements');

exports.getMeasurements = (filteredValues, selected_indices) => {
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
};
