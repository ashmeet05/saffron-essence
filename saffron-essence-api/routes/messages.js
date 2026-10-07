// routes/messages.js — POST /api/messages : save a Contact page message
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const asyncHandler = require('../utils/asyncHandler');
const { messageLimit } = require('../middleware/limits');

router.post('/', messageLimit, asyncHandler(async (req, res) => {
  const { name, email, topic, message } = req.body || {};
  if (![name, email, message].every((v) => typeof v === 'string')) {
    return res.status(400).json({ success: false, message: 'Fill in your name, email and message.' });
  }
  await Message.create({ name, email, topic: typeof topic === 'string' ? topic : '', message });
  res.status(201).json({ success: true, message: "Thanks! We'll reply within a day." });
}));

module.exports = router;
