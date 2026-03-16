require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Static files for uploaded media
app.use('/api/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Auth middleware for /api/* (screen and uploads are excluded inside auth.js)
app.use('/api', auth);

// Routes
app.use('/api/config', require('./routes/config'));
app.use('/api/slides', require('./routes/slides'));
app.use('/api/ticker', require('./routes/ticker'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/stat-cards', require('./routes/statCards'));
app.use('/api/map-data', require('./routes/mapData'));
app.use('/api/icons', require('./routes/icons'));
app.use('/api/media', require('./routes/media'));
app.use('/api/screen', require('./routes/screen'));
app.use('/api/backup', require('./routes/backup'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '9.0.0' });
});

app.listen(PORT, () => {
  console.log(`CMS Pro v9 Backend running on port ${PORT}`);
});
