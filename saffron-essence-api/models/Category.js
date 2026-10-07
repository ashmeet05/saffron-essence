// models/Category.js — a section of the menu, e.g. "Appetizers"
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  sortOrder: { type: Number, default: 0 }
});

module.exports = mongoose.model('Category', categorySchema);
