// routes/locations.js — GET /api/locations : every restaurant location
const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const asyncHandler = require('../utils/asyncHandler');

// Shape used by the website (same as js/locations.js)
const toPublic = (l) => ({
  id: l.slug, name: l.name, address: l.address, city: l.city, postal: l.postal, phone: l.phone,
  lat: l.lat, lng: l.lng, features: l.features, flagship: l.flagship, hours: l.hours,
  acceptingOrders: l.acceptingOrders, delivers: l.delivers, deliveryRadiusKm: l.deliveryRadiusKm
});

router.get('/', asyncHandler(async (req, res) => {
  const locations = await Location.find().sort({ flagship: -1, name: 1 });
  res.json({ success: true, data: locations.map(toPublic) });
}));

module.exports = router;
module.exports.toPublic = toPublic;
