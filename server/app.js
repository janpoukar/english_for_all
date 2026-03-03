const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./Authroutes');
const lessonRoutes = require('./leassonRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/lessons', lessonRoutes);

// Serve static files from React build
const frontendBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(frontendBuildPath));

// SPA fallback - any request not matching an API route serves index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

module.exports = app;