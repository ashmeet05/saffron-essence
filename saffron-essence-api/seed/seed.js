// seed/seed.js — loads the menu and locations into MongoDB.
// Run once after setting up .env:   npm run seed
// Safe to run again: it updates existing records instead of duplicating them.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Dish = require('../models/Dish');
const Location = require('../models/Location');
const data = require('./data.json');

async function upsertAll(Model, records) {
  for (const record of records) {
    await Model.updateOne({ slug: record.slug }, { $set: record }, { upsert: true, runValidators: true });
  }
  return records.length;
}

async function seed(uri) {
  await connectDB(uri);
  const c = await upsertAll(Category, data.categories);
  const d = await upsertAll(Dish, data.dishes);
  const l = await upsertAll(Location, data.locations);
  console.log(`Seeded ${c} categories, ${d} dishes and ${l} locations.`);
}

// Run directly with "npm run seed"; tests import seed() instead.
if (require.main === module) {
  seed()
    .then(() => mongoose.disconnect())
    .catch((err) => { console.error('Seeding failed:', err.message); process.exit(1); });
}

module.exports = seed;
