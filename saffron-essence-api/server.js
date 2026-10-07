// server.js — starts the API. Run with:  npm run dev
require('dotenv').config({ quiet: true });

// Stop early with a clear message if a required setting is missing
const missing = ['MONGO_URI', 'JWT_SECRET'].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing in .env: ${missing.join(', ')}. Copy .env.example to .env and fill it in.`);
  process.exit(1);
}

// On the live site, refuse to start with a weak or example secret
if (process.env.NODE_ENV === 'production' &&
    (process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET === 'change-me')) {
  console.error('Refusing to start: weak JWT_SECRET. Set a long random value in the hosting dashboard.');
  process.exit(1);
}

const app = require('./app');
const connectDB = require('./config/db');
const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Saffron Essence running at http://localhost:${PORT}`);
      console.log(`API health check:          http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
