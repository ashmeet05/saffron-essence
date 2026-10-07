// models/Dish.js — one item on the menu
const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, trim: true },   // e.g. "butter-chicken"
  category: { type: String, required: true, trim: true },            // e.g. "curries"
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 500 },
  price: { type: Number, required: true, min: 0 },                    // dollars, e.g. 14.99
  vegetarian: { type: Boolean, default: false },
  spice: { type: Number, min: 0, max: 3, default: 0 },
  image: { type: String, default: '' },
  popular: { type: Boolean, default: false },
  available: { type: Boolean, default: true },                        // staff can hide sold-out dishes
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Dish', dishSchema);
