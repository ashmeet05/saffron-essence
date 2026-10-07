// middleware/validateId.js — rejects malformed ids before they reach the database
const mongoose = require('mongoose');

module.exports = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid id.' });
  }
  next();
};
