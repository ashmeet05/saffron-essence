// routes/members.js
//   POST /api/members/register   create an account
//   POST /api/members/login      sign in, returns a token
//   GET  /api/members/me         your profile
//   GET  /api/members/me/orders  your past orders
const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { requireAuth, makeToken, isAdmin } = require('../middleware/auth');
const { authLimit } = require('../middleware/limits');
const { publicOrder } = require('./orders');

const FIELDS = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'province', 'postalCode', 'password'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => typeof body?.[f] === 'string').map((f) => [f, body[f]]));
const profile = (m) => ({ ...m.toJSON(), isAdmin: isAdmin(m) });

router.post('/register', authLimit, asyncHandler(async (req, res) => {
  const data = pick(req.body);
  if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(data.password || '')) {
    return res.status(400).json({ success: false, message: 'Use at least 8 characters with one capital letter and one number.' });
  }
  if (await Member.exists({ email: String(data.email || '').trim().toLowerCase() })) {
    return res.status(409).json({ success: false, message: 'That email already has an account. Sign in instead.' });
  }
  const member = await Member.create(data);
  res.status(201).json({ success: true, message: 'Account created.', token: makeToken(member), data: profile(member) });
}));

router.post('/login', authLimit, asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  const fail = () => res.status(401).json({ success: false, message: 'Wrong email or password.' });
  if (typeof email !== 'string' || typeof password !== 'string') return fail();
  const member = await Member.findOne({ email: email.trim().toLowerCase() }).select('+password');
  if (!member || !(await member.checkPassword(password))) return fail();
  res.json({ success: true, message: 'Signed in.', token: makeToken(member), data: profile(member) });
}));

router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, data: profile(req.member) });
});

router.get('/me/orders', requireAuth, asyncHandler(async (req, res) => {
  const orders = await Order.find({ member: req.member._id }).sort('-createdAt').limit(20).populate('location');
  res.json({ success: true, data: orders.map((o) => publicOrder(o, o.location)) });
}));

module.exports = router;
