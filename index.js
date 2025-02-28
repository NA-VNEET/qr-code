// server.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Database file path
const DB_FILE = path.join(__dirname, 'voters.json');

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({}));
}

// Read database
function readDatabase() {
  const data = fs.readFileSync(DB_FILE);
  return JSON.parse(data);
}

// Write database
function writeDatabase(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Routes
// Get all voters
app.get('/api/voters', (req, res) => {
  const voters = readDatabase();
  res.json(voters);
});

// Add new voter
app.post('/api/voters', (req, res) => {
  const { id, name } = req.body;
  
  if (!id || !name) {
    return res.status(400).json({ error: 'Voter ID and name are required' });
  }
  
  const voters = readDatabase();
  
  // Check if voter already exists
  if (voters[id]) {
    return res.status(409).json({ error: 'Voter ID already exists' });
  }
  
  // Add new voter
  voters[id] = {
    name,
    scanned: false,
    timestamp: new Date().toISOString()
  };
  
  writeDatabase(voters);
  res.status(201).json({ success: true, voter: voters[id] });
});

// Update voter scan status
app.post('/api/scan', (req, res) => {
  const { id } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Voter ID is required' });
  }
  
  const voters = readDatabase();
  
  // Check if voter exists
  if (!voters[id]) {
    return res.status(404).json({ 
      success: false, 
      status: 'unknown', 
      message: 'Voter ID not found in database' 
    });
  }
  
  // Check if already scanned
  if (voters[id].scanned) {
    return res.json({ 
      success: true, 
      status: 'already_scanned', 
      message: 'Voter has already been scanned',
      voter: voters[id]
    });
  }
  
  // First scan
  voters[id].scanned = true;
  voters[id].scanTime = new Date().toISOString();
  writeDatabase(voters);
  
  res.json({ 
    success: true, 
    status: 'first_scan', 
    message: 'Voter verified successfully',
    voter: voters[id]
  });
});

// Clear database
app.delete('/api/voters', (req, res) => {
  writeDatabase({});
  res.json({ success: true, message: 'Database cleared' });
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});