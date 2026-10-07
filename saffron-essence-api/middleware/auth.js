// middleware/auth.js — reads the login token and finds the member.
const jwt = require('jsonwebtoken');
const Member = require('../models/Member');

const adminEmails = () =>
  (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

const isAdmin = (member) => !!member && adminEmails().includes(member.email);

function makeToken(member) {
  return jwt.sign({ id: member._id.toString() }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
}

// Finds the member if a valid token was sent. Never fails: guests are fine.
async function optionalAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme === 'Bearer' && token) {
    try {
      const { id } = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      req.member = await Member.findById(id);
    } catch (e) { /* bad or expired token: treat as guest */ }
  }
  next();
}

// Requires a signed-in member
async function requireAuth(req, res, next) {
  await optionalAuth(req, res, () => {});
  if (!req.member) return res.status(401).json({ success: false, message: 'Please sign in first.' });
  next();
}

// Requires a signed-in member whose email is in ADMIN_EMAILS
async function requireAdmin(req, res, next) {
  await requireAuth(req, res, () => {});
  if (res.headersSent) return;
  if (!isAdmin(req.member)) return res.status(403).json({ success: false, message: 'Staff only.' });
  next();
}

module.exports = { optionalAuth, requireAuth, requireAdmin, makeToken, isAdmin };
