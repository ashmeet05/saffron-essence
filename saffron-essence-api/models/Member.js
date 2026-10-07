// models/Member.js — a customer account. Passwords are always hashed.
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const memberSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 60 },
  lastName: { type: String, required: true, trim: true, maxlength: 60 },
  email: {
    type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address.']
  },
  phone: { type: String, trim: true, maxlength: 20 },
  address: { type: String, trim: true, maxlength: 200 },
  city: { type: String, trim: true, maxlength: 80 },
  province: { type: String, trim: true, maxlength: 2 },
  postalCode: { type: String, trim: true, uppercase: true, maxlength: 7 },
  // select: false = the hash is never loaded unless we ask for it
  password: { type: String, required: true, minlength: 8, select: false },
  favouriteLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' }
}, { timestamps: true });

memberSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

memberSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Never send the password hash or internal fields to the browser
memberSchema.set('toJSON', {
  versionKey: false,
  transform(doc, ret) { delete ret.password; return ret; }
});

module.exports = mongoose.model('Member', memberSchema);
