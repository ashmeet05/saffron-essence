// middleware/limits.js — rate limits stop spam and password guessing
const rateLimit = require('express-rate-limit');

const make = (windowMinutes, limit, message) => rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',   // automated tests send many requests quickly
  message: { success: false, message }
});

module.exports = {
  authLimit: make(15, 20, 'Too many sign-in attempts. Try again in 15 minutes.'),
  orderLimit: make(10, 10, 'Too many orders from this device. Try again in a few minutes.'),
  messageLimit: make(10, 5, 'Too many messages. Try again in a few minutes.')
};
