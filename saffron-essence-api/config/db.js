// config/db.js — connects to MongoDB using MONGO_URI from .env
const mongoose = require('mongoose');

// Treat request data as plain values, never as database operators.
// This blocks "NoSQL injection" like { "email": { "$ne": null } }.
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

async function connectDB(uri = process.env.MONGO_URI) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected');
}

module.exports = connectDB;
