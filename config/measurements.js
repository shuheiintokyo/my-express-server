// config/measurements.js - Centralized configuration
exports.measurementLimits = {
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

exports.measurementMap = {
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

exports.selected_indices = [103, 99, 177, 158, '', '', 114, 182, 193, 79, 148, 174];
