const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint to get configuration
app.get('/api/config', (req, res) => {
  res.json({
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    aiProvider: process.env.AI_PROVIDER || 'openrouter',
    aiModel: process.env.AI_MODEL || 'google/gemini-flash-1.5'
  });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'onboarding-ai-enhanced.html'));
});

// Static files middleware (after routes)
app.use(express.static(path.join(__dirname)));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Open your browser to start the AI onboarding demo`);
  console.log(`🔧 API Key loaded: ${process.env.OPENROUTER_API_KEY ? '✅ Yes' : '❌ No'}`);
});