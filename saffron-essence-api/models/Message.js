// models/Message.js — a message sent from the Contact page
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  topic: { type: String, trim: true, maxlength: 60 },
  message: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
  handled: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
