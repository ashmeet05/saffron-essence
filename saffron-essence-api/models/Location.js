// models/Location.js — one restaurant location in Ontario
const mongoose = require('mongoose');

// Opening hours: for each day 0 (Sunday) to 6 (Saturday), either
// ["11:30", "21:30"] or null when closed.
const dayHours = {
  type: [String],
  default: undefined,
  validate: {
    validator: (v) => v == null || (v.length === 2 && v.every((t) => /^\d{2}:\d{2}$/.test(t))),
    message: 'Hours must look like ["11:30", "21:30"]'
  }
};

const locationSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, trim: true },   // e.g. "brampton"
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  province: { type: String, default: 'ON' },
  postal: { type: String, required: true, trim: true, uppercase: true },
  phone: { type: String, required: true, trim: true },
  lat: { type: Number, required: true, min: -90, max: 90 },
  lng: { type: Number, required: true, min: -180, max: 180 },
  features: [String],
  flagship: { type: Boolean, default: false },
  hours: {
    0: dayHours, 1: dayHours, 2: dayHours, 3: dayHours, 4: dayHours, 5: dayHours, 6: dayHours
  },
  acceptingOrders: { type: Boolean, default: true },                  // staff can pause online orders
  delivers: { type: Boolean, default: true },
  deliveryRadiusKm: { type: Number, default: 15, min: 0, max: 50 }
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);
