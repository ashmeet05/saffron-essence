// app.js — sets up Express: security, the API routes, and the website files.
require('dotenv').config({ quiet: true });
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
app.set('trust proxy', 1);   // correct visitor IPs for rate limits when hosted

// Security headers. The Content Security Policy only allows our own files,
// plus the street-map tiles from OpenStreetMap.
app.use(helmet({
  // OpenStreetMap needs to know which website is asking for map tiles
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://tile.openstreetmap.org'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  }
}));

// Which other websites may call this API from a browser
const allowed = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin(origin, cb) {
    // No origin = same website or a tool like Postman.
    // "null" = the website opened straight from a file (only allowed outside production).
    if (!origin || allowed.includes(origin) || (origin === 'null' && process.env.NODE_ENV !== 'production')) return cb(null, true);
    cb(null, false);
  }
}));

if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use(express.json({ limit: '50kb' }));

// ---- API
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Saffron Essence API is running.' }));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/members', require('./routes/members'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/admin', require('./routes/admin'));

// Unknown /api address
app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'Not found.' }));

// ---- Website: serve the frontend folder, so http://localhost:4000 opens the site
const frontend = path.resolve(__dirname, process.env.FRONTEND_DIR || '../saffron-essence-v2');
app.use(express.static(frontend, { extensions: ['html'] }));

// ---- Errors: clear messages for mistakes, no internal details otherwise
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: Object.values(err.errors).map((e) => e.message).join(' ') });
  }
  if (err.name === 'CastError') return res.status(400).json({ success: false, message: `Invalid ${err.path}.` });
  if (err.code === 11000) return res.status(409).json({ success: false, message: 'That already exists.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'Invalid JSON.' });
  console.error(err);
  res.status(500).json({ success: false, message: 'Something went wrong on the server.' });
});

module.exports = app;
