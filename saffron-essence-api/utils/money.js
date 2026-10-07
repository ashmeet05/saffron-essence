// utils/money.js — prices are worked out on the server, never trusted from the browser
const TAX_RATE = 0.13;             // Ontario HST

// Delivery rules (the website shows the same numbers)
const DELIVERY = {
  fee: 4.99,
  freeOver: 50,                    // free delivery when the food subtotal is $50 or more
  minimum: 20,                     // smallest food subtotal we deliver
  extraMinutes: 25,                // driving time added on top of cooking time
  maxTipRate: 0.3
};

const round = (n) => Math.round(n * 100) / 100;

// items: [{ price, qty }]. Tax applies to food and the delivery fee; tips are not taxed.
function totals(items, { delivery = false, tipRate = 0 } = {}) {
  const subtotal = round(items.reduce((sum, i) => sum + i.price * i.qty, 0));
  const deliveryFee = delivery && subtotal < DELIVERY.freeOver ? DELIVERY.fee : 0;
  const tax = round((subtotal + deliveryFee) * TAX_RATE);
  const tip = delivery ? round(subtotal * tipRate) : 0;
  return { subtotal, deliveryFee, tax, tip, total: round(subtotal + deliveryFee + tax + tip) };
}

module.exports = { totals, TAX_RATE, DELIVERY };
