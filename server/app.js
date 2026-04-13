const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./Authroutes');
const lessonRoutes = require('./leassonRoutes');
const materialsRoutes = require('./materialsRoutes');
const newsletterRoutes = require('./newsletterRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Serve shared image assets from the repository root
app.use('/pictures', express.static(path.join(__dirname, '../pictures')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from React build
const frontendBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(frontendBuildPath));

// SPA fallback - any request not matching an API route serves index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

module.exports = app;