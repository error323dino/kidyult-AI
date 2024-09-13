const http = require('http');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

// Function to count words per user in a chat log
const countWordsInFile = (filePath) => {
    const userWordCount = {};
    const userRegex = /^<([^>]+)>/;
    let currentUser = null;

    // Read file and split it into lines
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');

    lines.forEach((line) => {
        // Match the username in angle brackets
        const match = line.match(userRegex);
        if (match) {
            currentUser = match[1]; // Extract the username
            line = line.replace(userRegex, '').trim(); // Remove username from the line
        }

        // Count words if there's an active user and non-empty line
        if (currentUser && line.trim()) {
            const wordCount = line.split(/\s+/).length; // Split by whitespace and count words
            userWordCount[currentUser] = (userWordCount[currentUser] || 0) + wordCount;
        }
    });

    // Return the word count sorted by most to least chatty
    return Object.entries(userWordCount)
        .map(([user, words]) => ({ user, words }))
        .sort((a, b) => b.words - a.words);
};

// Function to handle the file upload
const handleFileUpload = (req, res) => {
    const form = new formidable.IncomingForm();
    form.uploadDir = './uploads'; // Directory to store uploaded files
    form.keepExtensions = true;

    form.parse(req, (err, fields, files) => {
        if (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'File upload failed.' }));
        }

        console.log('Parsed files:', files);

        const uploadedFiles = Array.isArray(files.files) ? files.files : [files.files];
        const results = [];

        uploadedFiles.forEach((file) => {
            const filePath = file.filepath;

            if (filePath && fs.existsSync(filePath)) {
                console.log('Processing file:', file.originalFilename);
                const wordCountResult = countWordsInFile(filePath);
                results.push({ file: file.originalFilename || file[0]?.originalFilename, wordCounts: wordCountResult });

                // Clean up uploaded file after processing
                fs.unlinkSync(filePath);
            } else {
                console.error('File does not exist or filepath is undefined');
            }
        });

        console.log('Backend response:', results);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results));
    });
};


// Create the HTTP server
const server = http.createServer((req, res) => {
    // Handle CORS manually
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000'); // Allow your frontend origin
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.url === '/api/upload' && req.method.toLowerCase() === 'post') {
        handleFileUpload(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Not Found' }));
    }
});

// Start the server on port 5000
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
