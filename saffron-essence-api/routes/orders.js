// routes/orders.js
//   POST /api/orders              place a pickup or delivery order (guest or member)
//   GET  /api/orders/delivery-check?city=Oakville   which kitchen delivers there?
//   GET  /api/orders/:number      track an order (needs the last 4 digits of the phone)
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Order = require('../models/Order');
const Dish = require('../models/Dish');
const Location = require('../models/Location');
const asyncHandler = require('../utils/asyncHandler');
const { optionalAuth } = require('../middleware/auth');
const { orderLimit } = require('../middleware/limits');
const { isValidPickupTime } = require('../utils/hours');
const { totals, DELIVERY } = require('../utils/money');
const { findPlace, distanceKm } = require('../utils/places');

const isText = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const digits = (v) => String(v || '').replace(/\D/g, '');

async function newOrderNumber() {
  for (let i = 0; i < 10; i++) {
    const number = 'SE-' + Math.floor(1000 + Math.random() * 9000);
    if (!(await Order.exists({ number }))) return number;
  }
  return 'SE-' + Date.now().toString().slice(-6);
}

// Finds the nearest location that delivers to a city, or null
async function deliveringLocation(cityName) {
  const place = findPlace(cityName);
  if (!place) return { place: null, location: null };
  // $ne: false also matches locations saved before delivery existed
  const locations = await Location.find({ delivers: mongoose.trusted({ $ne: false }), acceptingOrders: mongoose.trusted({ $ne: false }) });
  const ranked = locations
    .map((loc) => ({ loc, km: distanceKm(place.lat, place.lng, loc.lat, loc.lng) }))
    .sort((a, b) => a.km - b.km);
  const best = ranked.find((r) => r.km <= r.loc.deliveryRadiusKm);
  return { place, location: best ? best.loc : null, km: best ? best.km : null, nearest: ranked[0] };
}

router.get('/delivery-check', asyncHandler(async (req, res) => {
  const { place, location, km, nearest } = await deliveringLocation(req.query.city);
  if (!place) return res.status(400).json({ success: false, message: 'Choose an Ontario city or town from the list.' });
  if (!location) {
    return res.json({ success: true, data: { delivers: false,
      message: `We don't deliver to ${place.name} yet. Our nearest kitchen is ${nearest.loc.name} (${nearest.km.toFixed(0)} km away). You can still order for pickup.` } });
  }
  res.json({ success: true, data: { delivers: true, locationId: location.slug, locationName: location.name, km: Math.round(km * 10) / 10 } });
}));

router.post('/', orderLimit, optionalAuth, asyncHandler(async (req, res) => {
  const { locationId, pickupAt, name, phone, notes = '', items, type = 'pickup', address = {}, tipRate = 0 } = req.body || {};
  const isDelivery = type === 'delivery';
  const errors = [];

  if (!isText(name, 80)) errors.push('Enter the name of the person collecting.');
  if (digits(phone).length < 10 || digits(phone).length > 11) errors.push('Enter a 10-digit phone number.');
  if (typeof notes !== 'string' || notes.length > 300) errors.push('Notes can be at most 300 characters.');
  if (!Array.isArray(items) || items.length === 0 || items.length > 40) errors.push('Your order is empty.');
  if (!['pickup', 'delivery'].includes(type)) errors.push('Choose pickup or delivery.');
  if (isDelivery) {
    if (!isText(address.street, 120)) errors.push('Enter your street address.');
    if (!/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(String(address.postal || '').trim())) errors.push('Enter a postal code like L6Y 1A1.');
    if (typeof tipRate !== 'number' || tipRate < 0 || tipRate > DELIVERY.maxTipRate) errors.push('Choose a tip between 0% and 30%.');
  }
  if (errors.length) return res.status(400).json({ success: false, message: errors.join(' '), errors });

  // Which kitchen? Pickup: the one the customer chose. Delivery: the nearest one that delivers to their city.
  let location, km;
  if (isDelivery) {
    const check = await deliveringLocation(address.city);
    if (!check.place) return res.status(400).json({ success: false, message: 'Choose your city or town from the list.' });
    if (!check.location) return res.status(400).json({ success: false, message: `Sorry, we don't deliver to ${check.place.name} yet. You can order for pickup instead.` });
    location = check.location;
    km = Math.round(check.km * 10) / 10;
  } else {
    location = await Location.findOne({ slug: String(locationId) });
  }
  if (!location) return res.status(400).json({ success: false, message: 'Choose a pickup location.' });
  if (!location.acceptingOrders) {
    return res.status(409).json({ success: false, message: `${location.name} isn't taking online orders right now.` });
  }

  // Time: at least 15 min away (40 for delivery), within 3 days, during opening hours
  const when = new Date(pickupAt);
  const now = Date.now();
  const leadMinutes = isDelivery ? 15 + DELIVERY.extraMinutes : 15;
  if (isNaN(when) || when < now + leadMinutes * 60000 || when > now + 3 * 864e5 || !isValidPickupTime(location, when)) {
    return res.status(400).json({ success: false, message: `That ${isDelivery ? 'delivery' : 'pickup'} time is no longer available. Choose another time.` });
  }

  // Look up every dish in the database. Prices come from here, NOT from the browser.
  const slugs = items.map((i) => String(i.id));
  // mongoose.trusted: this $in is ours, not user input, so the injection filter allows it
  const dishes = await Dish.find({ slug: mongoose.trusted({ $in: slugs }), available: true });
  const lines = [];
  for (const item of items) {
    const dish = dishes.find((d) => d.slug === String(item.id));
    const qty = Number(item.qty);
    if (!dish) return res.status(400).json({ success: false, message: 'A dish in your order is no longer available. Please review your order.' });
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) return res.status(400).json({ success: false, message: 'Quantities must be between 1 and 20.' });
    lines.push({ dish: dish._id, slug: dish.slug, name: dish.name, price: dish.price, qty });
  }

  const money = totals(lines, { delivery: isDelivery, tipRate: isDelivery ? tipRate : 0 });
  if (isDelivery && money.subtotal < DELIVERY.minimum) {
    return res.status(400).json({ success: false, message: `Delivery orders need at least $${DELIVERY.minimum} of food. Add a little more, or choose pickup.` });
  }

  const order = await Order.create({
    number: await newOrderNumber(),
    location: location._id,
    member: req.member ? req.member._id : undefined,
    customerName: name.trim(),
    phone: phone.trim(),
    notes: notes.trim(),
    type,
    deliveryAddress: isDelivery ? {
      street: address.street.trim(), unit: String(address.unit || '').trim().slice(0, 20),
      city: findPlace(address.city).name, postal: address.postal.trim().toUpperCase(),
      instructions: String(address.instructions || '').trim().slice(0, 200)
    } : undefined,
    distanceKm: km,
    pickupAt: when,
    items: lines,
    ...money,
    statusHistory: [{ status: 'received' }]
  });

  res.status(201).json({ success: true, message: 'Order placed.', data: publicOrder(order, location) });
}));

// Tracking: the order number alone isn't enough, so strangers can't look up orders
router.get('/:number', asyncHandler(async (req, res) => {
  const order = await Order.findOne({ number: String(req.params.number).toUpperCase() }).populate('location');
  const last4 = digits(req.query.phone).slice(-4);
  if (!order || last4.length !== 4 || digits(order.phone).slice(-4) !== last4) {
    return res.status(404).json({ success: false, message: 'No order found with that number and phone.' });
  }
  res.json({ success: true, data: publicOrder(order, order.location) });
}));

function publicOrder(order, location) {
  return {
    number: order.number,
    status: order.status,
    type: order.type || 'pickup',
    address: order.type === 'delivery' ? order.deliveryAddress : null,
    name: order.customerName,
    pickupAt: order.pickupAt,
    location: location ? { id: location.slug, name: location.name, address: location.address, city: location.city, postal: location.postal, phone: location.phone } : null,
    items: order.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
    subtotal: order.subtotal, deliveryFee: order.deliveryFee || 0, tax: order.tax, tip: order.tip || 0, total: order.total,
    placedAt: order.createdAt
  };
}

module.exports = router;
module.exports.publicOrder = publicOrder;
