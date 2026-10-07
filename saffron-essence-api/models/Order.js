// models/Order.js — a pickup order placed on the website
const mongoose = require('mongoose');

// Pickup:   received → preparing → ready → collected
// Delivery: received → preparing → out_for_delivery → delivered
const STATUSES = ['received', 'preparing', 'ready', 'collected', 'out_for_delivery', 'delivered', 'cancelled'];

const orderItemSchema = new mongoose.Schema({
  dish: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' },
  slug: String,
  name: String,        // copied at order time, so later menu changes don't alter old orders
  price: Number,
  qty: { type: Number, min: 1, max: 20 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },             // e.g. "SE-4821"
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },    // empty for guests
  type: { type: String, enum: ['pickup', 'delivery'], default: 'pickup' },
  deliveryAddress: {
    street: { type: String, trim: true, maxlength: 120 },
    unit: { type: String, trim: true, maxlength: 20 },
    city: { type: String, trim: true, maxlength: 60 },
    postal: { type: String, trim: true, uppercase: true, maxlength: 7 },
    instructions: { type: String, trim: true, maxlength: 200 }
  },
  distanceKm: Number,
  customerName: { type: String, required: true, trim: true, maxlength: 80 },
  phone: { type: String, required: true, trim: true, maxlength: 20 },
  notes: { type: String, trim: true, maxlength: 300 },
  pickupAt: { type: Date, required: true },        // ready time (pickup) or arrival time (delivery)
  items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
  subtotal: Number,
  deliveryFee: { type: Number, default: 0 },
  tax: Number,
  tip: { type: Number, default: 0 },
  total: Number,
  status: { type: String, enum: STATUSES, default: 'received' },
  statusHistory: [{ status: String, at: { type: Date, default: Date.now } }]
}, { timestamps: true });

orderSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Order', orderSchema);
