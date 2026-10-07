/* ==========================================================
   app.js — shared code used by EVERY page:
   - small helpers (money format, safe storage)
   - the cart (add, change quantity, remove, totals)
   - the slide-out cart drawer and the cart count in the header
   - the mobile navigation button
   - "Open now / Closed" status
   Load order on each page: data.js → app.js → page script.
   ========================================================== */

/* ---------- Helpers ---------- */
const money = (n) => "$" + n.toFixed(2);

// localStorage can fail (private windows, blocked storage), so wrap it.
const store = {
  get(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }
};

// Builds an element: el("p", { class: "x" }, "text", child, ...)
// Text is always added as text (never as HTML), so typed input can't inject code.
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else if (key === "class") node.className = value;
    else node.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

const findDish = (id) => MENU.find((d) => d.id === id);

function dietMark(veg) {
  return el("span", {
    class: "diet " + (veg ? "diet-veg" : "diet-nonveg"),
    role: "img",
    "aria-label": veg ? "Vegetarian" : "Contains meat"
  });
}

function spiceMark(level) {
  if (!level) return null;
  const labels = ["", "Mild spice", "Medium spice", "Hot"];
  return el("span", { class: "spice", title: labels[level], "aria-label": labels[level] }, "🌶".repeat(level));
}

// Remembers photos that failed to load, so we don't keep trying them
const missingPhotos = new Set();

function letterTile(dish, className) {
  return el("div", { class: (className + " no-photo").trim(), "aria-hidden": "true" }, dish.name[0]);
}

// Shows the dish photo. If the file is missing, calls onMissing (or shows a letter tile).
function dishPhoto(dish, className, onMissing) {
  if (!dish.image || missingPhotos.has(dish.image)) {
    return onMissing ? null : letterTile(dish, className);
  }
  const img = el("img", { src: dish.image, alt: "", class: className });
  img.addEventListener("error", () => {
    missingPhotos.add(dish.image);
    if (onMissing) { img.remove(); onMissing(); }
    else img.replaceWith(letterTile(dish, className));
  });
  return img;
}

/* ---------- Opening hours ---------- */
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = ((h + 11) % 12) + 1;
  return m ? `${h12}:${String(m).padStart(2, "0")} ${suffix}` : `${h12} ${suffix}`;
}

// Hours for a location (falls back to the default hours in data.js)
function hoursFor(loc) {
  return (loc && loc.hours) || RESTAURANT.hours;
}

function openStatus(now = new Date(), hours = hoursFor(currentLocation())) {
  const today = hours[now.getDay()];
  const mins = now.getHours() * 60 + now.getMinutes();
  if (today) {
    const [open, close] = today.map(toMinutes);
    if (mins >= open && mins < close) {
      return { open: true, text: `Open now · until ${formatTime(close)}` };
    }
    if (mins < open) {
      return { open: false, text: `Closed now · opens today at ${formatTime(open)}` };
    }
  }
  // Find the next day it opens
  for (let i = 1; i <= 7; i++) {
    const day = (now.getDay() + i) % 7;
    if (hours[day]) {
      const name = i === 1 ? "tomorrow" : new Date(now.getTime() + i * 864e5).toLocaleDateString("en-CA", { weekday: "long" });
      return { open: false, text: `Closed now · opens ${name} at ${formatTime(toMinutes(hours[day][0]))}` };
    }
  }
  return { open: false, text: "Closed" };
}

/* ---------- Locations ---------- */
const findLocation = (id) => (typeof LOCATIONS !== "undefined" ? LOCATIONS.find((l) => l.id === id) : null);

// The location the customer picked (saved in the browser). Defaults to the flagship.
function currentLocation() {
  if (typeof LOCATIONS === "undefined") return null;
  return findLocation(store.get("se-location", "")) || LOCATIONS.find((l) => l.flagship) || LOCATIONS[0];
}
function setLocation(id) {
  store.set("se-location", id);
  document.dispatchEvent(new CustomEvent("location:change"));
}

// Straight-line distance between two points in km (haversine formula)
function distanceKm(lat1, lng1, lat2, lng2) {
  const rad = (d) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

function directionsUrl(loc, mode = "driving") {
  const dest = encodeURIComponent(`${loc.address}, ${loc.city}, ON ${loc.postal}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=${mode}`;
}

/* ---------- Cart (saved in the browser) ---------- */
// Saved as a list like: [{ id: "samosa", qty: 2 }, ...]
const Cart = {
  KEY: "se-cart",
  items() {
    return store.get(this.KEY, []).filter((line) => findDish(line.id));
  },
  save(items) {
    store.set(this.KEY, items);
    document.dispatchEvent(new CustomEvent("cart:change"));
  },
  qty(id) {
    const line = this.items().find((l) => l.id === id);
    return line ? line.qty : 0;
  },
  add(id, amount = 1) {
    const items = this.items();
    const line = items.find((l) => l.id === id);
    if (line) line.qty = Math.min(line.qty + amount, 20);
    else items.push({ id, qty: amount });
    this.save(items);
  },
  setQty(id, qty) {
    let items = this.items();
    if (qty <= 0) items = items.filter((l) => l.id !== id);
    else items.forEach((l) => { if (l.id === id) l.qty = Math.min(qty, 20); });
    this.save(items);
  },
  clear() { this.save([]); },
  count() { return this.items().reduce((sum, l) => sum + l.qty, 0); },
  totals() {
    const subtotal = this.items().reduce((sum, l) => sum + findDish(l.id).price * l.qty, 0);
    const tax = Math.round(subtotal * RESTAURANT.taxRate * 100) / 100;
    return { subtotal, tax, total: subtotal + tax };
  }
};

/* ---------- Quantity stepper used on menu, drawer, checkout ---------- */
function stepper(dish) {
  const qty = Cart.qty(dish.id);
  return el("div", { class: "stepper", role: "group", "aria-label": `Quantity of ${dish.name}` },
    el("button", { type: "button", "aria-label": `Remove one ${dish.name}`, onclick: () => Cart.setQty(dish.id, qty - 1) }, "−"),
    el("output", { "aria-live": "polite" }, qty),
    el("button", { type: "button", "aria-label": `Add one more ${dish.name}`, onclick: () => Cart.add(dish.id) }, "+")
  );
}

// "Add" button that turns into a stepper once the dish is in the cart
function buyControl(dish) {
  if (Cart.qty(dish.id) > 0) return stepper(dish);
  return el("button", {
    type: "button",
    class: "btn btn-dark",
    onclick: () => { Cart.add(dish.id); toast(`${dish.name} added to your order`); bumpCart(); }
  }, "Add", el("span", { class: "visually-hidden" }, ` ${dish.name} to order`));
}

/* ---------- Toast message ---------- */
let toastTimer;
function toast(message) {
  let box = document.querySelector(".toast");
  if (!box) {
    box = el("div", { class: "toast", role: "status", "aria-live": "polite" });
    document.body.append(box);
  }
  box.textContent = message;
  box.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.remove("show"), 2200);
}

function bumpCart() {
  const btn = document.querySelector(".cart-button");
  if (!btn) return;
  btn.classList.remove("bump");
  void btn.offsetWidth;          // restart the animation
  btn.classList.add("bump");
}

/* ---------- Cart drawer ---------- */
function buildDrawer() {
  const backdrop = el("div", { class: "drawer-backdrop", onclick: closeCart });
  const drawer = el("aside", { class: "drawer", id: "cart-drawer", "aria-label": "Your order", role: "dialog", "aria-modal": "true" },
    el("div", { class: "drawer-head" },
      el("h2", {}, "Your order"),
      el("button", { type: "button", class: "drawer-close", "aria-label": "Close your order", onclick: closeCart }, "×")
    ),
    el("div", { class: "drawer-body" }),
    el("div", { class: "drawer-foot" })
  );
  document.body.append(backdrop, drawer);
  renderDrawer();
}

function renderDrawer() {
  const body = document.querySelector(".drawer-body");
  const foot = document.querySelector(".drawer-foot");
  if (!body) return;
  const items = Cart.items();
  body.replaceChildren();
  foot.replaceChildren();

  if (items.length === 0) {
    body.append(el("div", { class: "cart-empty" },
      el("p", {}, "Your order is empty."),
      el("a", { class: "btn btn-dark", href: "menu.html" }, "Browse the menu")
    ));
    return;
  }

  for (const line of items) {
    const dish = findDish(line.id);
    body.append(el("div", { class: "cart-line" },
      dishPhoto(dish, ""),
      el("div", {},
        el("div", { class: "cart-line-name" }, dish.name),
        el("div", { class: "cart-line-price" }, `${money(dish.price)} each`)
      ),
      el("div", { class: "cart-line-actions" },
        stepper(dish),
        el("strong", {}, money(dish.price * line.qty))
      )
    ));
  }

  const t = Cart.totals();
  foot.append(
    el("div", { class: "totals" },
      el("div", {}, el("span", {}, "Subtotal"), el("span", {}, money(t.subtotal))),
      el("div", {}, el("span", {}, "HST (13%)"), el("span", {}, money(t.tax))),
      el("div", { class: "grand" }, el("span", {}, "Total"), el("span", {}, money(t.total)))
    ),
    el("a", { class: "btn btn-primary btn-block", href: "order.html" }, "Go to checkout")
  );
}

let lastFocus = null;
function openCart() {
  lastFocus = document.activeElement;
  document.body.classList.add("cart-open");
  document.querySelector(".cart-button")?.setAttribute("aria-expanded", "true");
  setTimeout(() => document.querySelector(".drawer-close")?.focus(), 50);
}
function closeCart() {
  document.body.classList.remove("cart-open");
  document.querySelector(".cart-button")?.setAttribute("aria-expanded", "false");
  lastFocus?.focus();
}

function updateCartCount() {
  const count = Cart.count();
  document.querySelectorAll(".cart-count").forEach((n) => { n.textContent = count; });
  document.querySelectorAll(".cart-button").forEach((b) =>
    b.setAttribute("aria-label", `Your order, ${count} ${count === 1 ? "item" : "items"}`));
}

/* ---------- Start-up on every page ---------- */
document.addEventListener("DOMContentLoaded", () => {
  buildDrawer();
  updateCartCount();

  document.querySelectorAll(".cart-button").forEach((b) => b.addEventListener("click", openCart));

  // Close the drawer with the Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("cart-open")) closeCart();
  });

  // Mobile navigation button
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  // Fill in the chosen location's name wherever [data-location-name] appears
  const loc = currentLocation();
  document.querySelectorAll("[data-location-name]").forEach((n) => { n.textContent = loc ? loc.name : ""; });

  // Open/closed status wherever there's a [data-open-status] element
  document.querySelectorAll("[data-open-status]").forEach((node) => {
    const status = openStatus();
    node.replaceChildren(
      el("span", { class: "status-dot" + (status.open ? " open" : "") }),
      el("span", {}, status.text)
    );
  });

  // Clear a form error as soon as the person starts fixing that box
  document.addEventListener("input", (e) => {
    const input = e.target;
    if (input.getAttribute?.("aria-invalid") !== "true") return;
    input.setAttribute("aria-invalid", "false");
    input.removeAttribute("aria-describedby");
    const error = input.closest(".field")?.querySelector(".error");
    if (error) error.textContent = "";
  });

  document.querySelectorAll("[data-year]").forEach((n) => { n.textContent = new Date().getFullYear(); });
});

// Whenever the cart changes (on this page or another tab), refresh everything
document.addEventListener("cart:change", () => { updateCartCount(); renderDrawer(); });
window.addEventListener("storage", (e) => {
  if (e.key === Cart.KEY) document.dispatchEvent(new CustomEvent("cart:change"));
});
