// utils/fileProcessor.js
const fs = require('fs').promises;
const path = require('path');

async function readTextFiles() {
    const textDataPath = path.join(__dirname, '..', 'resources', 'textdata');
    try {
        // Read all files in the directory
        const files = await fs.readdir(textDataPath);
        const txtFiles = files.filter(file => file.endsWith('.txt'));
        
        // Sort files by numeric value in filename
        txtFiles.sort((a, b) => {
            const getNumber = (filename) => {
                const match = filename.match(/\d+/);
                return match ? parseInt(match[0]) : 0;
            };
            return getNumber(a) - getNumber(b);
        });

        // Process each file
        const fileContents = await Promise.all(
            txtFiles.map(async (fileName) => {
                const content = await fs.readFile(path.join(textDataPath, fileName), 'utf8');
                return {
                    fileName: fileName.replace('.txt', ''),
                    content: content
                };
            })
        );

        // Process the content similar to the frontend logic
        return fileContents.map(({ fileName, content }) => ({
            fileName,
            values: processFileData(content)
        }));
    } catch (error) {
        console.error('Error reading text files:', error);
        throw error;
    }
}

function processFileData(content) {
    try {
        const allValues = content
            .split(/\n/)
            .map(line => line.split(';'))
            .flat()
            .filter(item => item.trim() !== '');

        return allValues
            .map(value => {
                const number = Number(parseFloat(value).toFixed(2));
                return !isNaN(number) ? Math.abs(number) : null;
            })
            .filter(value => value !== null);
    } catch (error) {
        console.error('Error processing file data:', error);
        return [];
    }
}

module.exports = { readTextFiles };