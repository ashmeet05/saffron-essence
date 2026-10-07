// routes/admin.js — staff dashboard (only ADMIN_EMAILS members)
//   GET   /api/admin/orders              orders, filter by ?location=&status=&day=today|all
//   PATCH /api/admin/orders/:id          change status: preparing, ready, collected, cancelled
//   GET   /api/admin/messages            contact messages
//   PATCH /api/admin/messages/:id        mark handled
//   PATCH /api/admin/dishes/:slug        mark a dish sold out / available
//   PATCH /api/admin/locations/:slug     pause / resume online orders
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Order = require('../models/Order');
const Message = require('../models/Message');
const Dish = require('../models/Dish');
const Location = require('../models/Location');
const asyncHandler = require('../utils/asyncHandler');
const validateId = require('../middleware/validateId');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

router.get('/orders', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.location) {
    const loc = await Location.findOne({ slug: String(req.query.location) });
    if (loc) filter.location = loc._id;
  }
  if (Order.STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.day !== 'all') {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 2);   // today and tomorrow
    filter.pickupAt = mongoose.trusted({ $gte: start, $lt: end });
  }
  const orders = await Order.find(filter).sort('pickupAt').limit(200).populate('location', 'slug name');
  res.json({
    success: true,
    data: orders.map((o) => ({
      id: o._id, number: o.number, status: o.status, type: o.type || 'pickup', address: o.type === 'delivery' ? o.deliveryAddress : null,
      name: o.customerName, phone: o.phone, notes: o.notes,
      pickupAt: o.pickupAt, location: o.location && { id: o.location.slug, name: o.location.name },
      items: o.items.map((i) => ({ name: i.name, qty: i.qty })), total: o.total, placedAt: o.createdAt
    }))
  });
}));

router.patch('/orders/:id', validateId, asyncHandler(async (req, res) => {
  const status = req.body && req.body.status;
  if (!Order.STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Unknown status.' });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  order.status = status;
  order.statusHistory.push({ status });
  await order.save();
  res.json({ success: true, message: `Order ${order.number} marked ${status}.` });
}));

router.get('/messages', asyncHandler(async (req, res) => {
  const messages = await Message.find().sort('-createdAt').limit(100);
  res.json({ success: true, data: messages });
}));

router.patch('/messages/:id', validateId, asyncHandler(async (req, res) => {
  const msg = await Message.findByIdAndUpdate(req.params.id, { handled: !!(req.body && req.body.handled) }, { returnDocument: 'after' });
  if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });
  res.json({ success: true, data: msg });
}));

router.patch('/dishes/:slug', asyncHandler(async (req, res) => {
  const dish = await Dish.findOneAndUpdate({ slug: String(req.params.slug) }, { available: !!(req.body && req.body.available) }, { returnDocument: 'after' });
  if (!dish) return res.status(404).json({ success: false, message: 'Dish not found.' });
  res.json({ success: true, message: `${dish.name} is now ${dish.available ? 'available' : 'sold out'}.` });
}));

router.patch('/locations/:slug', asyncHandler(async (req, res) => {
  const loc = await Location.findOneAndUpdate({ slug: String(req.params.slug) }, { acceptingOrders: !!(req.body && req.body.acceptingOrders) }, { returnDocument: 'after' });
  if (!loc) return res.status(404).json({ success: false, message: 'Location not found.' });
  res.json({ success: true, message: `${loc.name} is ${loc.acceptingOrders ? 'taking' : 'not taking'} online orders.` });
}));

module.exports = router;
