// routes/menu.js — GET /api/menu : categories and available dishes
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Dish = require('../models/Dish');
const asyncHandler = require('../utils/asyncHandler');

router.get('/', asyncHandler(async (req, res) => {
  const [categories, dishes] = await Promise.all([
    Category.find().sort('sortOrder'),
    Dish.find({ available: true }).sort('sortOrder')
  ]);
  res.json({
    success: true,
    data: {
      categories: categories.map((c) => ({ id: c.slug, name: c.name })),
      dishes: dishes.map((d) => ({
        id: d.slug, category: d.category, name: d.name, desc: d.description, price: d.price,
        veg: d.vegetarian, spice: d.spice, image: d.image, popular: d.popular
      }))
    }
  });
}));

module.exports = router;
