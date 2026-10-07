// checkout.js — pickup OR delivery, time slots, form checks, totals and
// the confirmation screen. In LIVE mode the server re-checks everything.
const ORDERS_KEY = "se-orders";
const D = RESTAURANT.delivery;
const form = document.getElementById("checkout-form");
const timeSelect = document.getElementById("c-time");
const locationSelect = document.getElementById("c-location");
const cityInput = document.getElementById("d-city");

let mode = store.get("se-mode", "pickup");   // "pickup" or "delivery"
let deliveryLoc = null;                       // kitchen that delivers to the chosen city
let tipRate = 0.15;

const activeLocation = () => (mode === "delivery" ? deliveryLoc : findLocation(locationSelect.value));

/* ----- Time slots: every 15 minutes during opening hours ----- */
function timeSlots(hoursTable, extraMinutes = 0, now = new Date()) {
  const slots = [];
  const earliest = new Date(now.getTime() + (RESTAURANT.prepMinutes + extraMinutes) * 60000);
  for (let dayOffset = 0; dayOffset < 3 && slots.length < 40; dayOffset++) {
    const day = new Date(now);
    day.setDate(now.getDate() + dayOffset);
    const hours = hoursTable[day.getDay()];
    if (!hours) continue;
    const [open, close] = hours.map(toMinutes);
    for (let m = open + 15; m <= close - 15; m += 15) {
      const slot = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(m / 60), m % 60);
      if (slot >= earliest) slots.push(slot);
    }
  }
  return slots;
}

function slotLabel(date, now = new Date()) {
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const day = sameDay(date, now) ? "Today" : sameDay(date, tomorrow) ? "Tomorrow"
    : date.toLocaleDateString("en-CA", { weekday: "long" });
  return `${day}, ${formatTime(date.getHours() * 60 + date.getMinutes())}`;
}

function fillTimes() {
  const loc = activeLocation();
  const hint = document.getElementById("c-time-hint");
  document.getElementById("c-time-label").textContent = mode === "delivery" ? "Delivery time" : "Pickup time";
  if (!loc) {
    timeSelect.replaceChildren(el("option", { value: "" }, "Enter your city first"));
    hint.textContent = "";
    return;
  }
  const slots = timeSlots(hoursFor(loc), mode === "delivery" ? D.extraMinutes : 0);
  timeSelect.replaceChildren(...slots.map((s, i) =>
    el("option", { value: s.toISOString() }, i === 0 ? `${slotLabel(s)} (earliest)` : slotLabel(s))));
  hint.textContent = (mode === "delivery" ? `${loc.name} · ` : "") + openStatus(new Date(), hoursFor(loc)).text;
}

/* ----- Pickup or delivery ----- */
function setMode(next) {
  mode = next;
  store.set("se-mode", mode);
  document.querySelectorAll('input[name="mode"]').forEach((r) => { r.checked = r.value === mode; });
  document.getElementById("pickup-fields").hidden = mode !== "pickup";
  document.getElementById("delivery-fields").hidden = mode !== "delivery";
  document.getElementById("c-name-label").textContent = mode === "delivery" ? "Name" : "Name of person collecting";
  fillTimes();
  renderSummary();
}
document.querySelectorAll('input[name="mode"]').forEach((r) => r.addEventListener("change", () => setMode(r.value)));

/* ----- Pickup location ----- */
function fillLocations() {
  const chosen = currentLocation();
  locationSelect.replaceChildren(...LOCATIONS.map((loc) =>
    el("option", { value: loc.id, selected: loc.id === chosen.id, disabled: loc.acceptingOrders === false },
      `${loc.name} (${loc.city})${loc.acceptingOrders === false ? " — not taking orders" : ""}`)));
  showLocationHint();
}

function showLocationHint() {
  const loc = findLocation(locationSelect.value);
  document.getElementById("c-location-hint").replaceChildren(`${loc.address}, ${loc.city} · `, el("a", { href: "location.html" }, "See all locations"));
}

locationSelect.addEventListener("change", () => {
  setLocation(locationSelect.value);
  showLocationHint();
  fillTimes();
});

/* ----- Delivery area: which kitchen delivers to this city? ----- */
function findPlaceName(text) {
  const q = text.trim().toLowerCase();
  return Object.keys(ONTARIO_PLACES).find((p) => p.toLowerCase() === q) || null;
}

async function checkDeliveryArea() {
  const area = document.getElementById("delivery-area");
  deliveryLoc = null;
  const name = findPlaceName(cityInput.value);
  if (!cityInput.value.trim()) {
    area.replaceChildren();
  } else if (!name) {
    area.replaceChildren(el("span", { class: "error-text" }, "Choose your city or town from the list."));
  } else if (await serverOnline) {
    const res = await api(`/api/orders/delivery-check?city=${encodeURIComponent(name)}`);
    if (res.ok && res.body.data.delivers) {
      deliveryLoc = findLocation(res.body.data.locationId);
      area.replaceChildren(el("span", { class: "ok-text" }, `✓ We deliver to ${name} from ${res.body.data.locationName} (${res.body.data.km} km).`));
    } else {
      area.replaceChildren(el("span", { class: "error-text" }, res.body.data ? res.body.data.message : res.body.message));
    }
  } else {
    // Demo mode: work it out in the browser
    const [lat, lng] = ONTARIO_PLACES[name];
    const best = LOCATIONS
      .map((loc) => ({ loc, km: distanceKm(lat, lng, loc.lat, loc.lng) }))
      .sort((a, b) => a.km - b.km)[0];
    if (best.km <= (best.loc.deliveryRadiusKm || D.radiusKm)) {
      deliveryLoc = best.loc;
      area.replaceChildren(el("span", { class: "ok-text" }, `✓ We deliver to ${name} from ${best.loc.name} (${best.km.toFixed(1)} km).`));
    } else {
      area.replaceChildren(el("span", { class: "error-text" }, `We don't deliver to ${name} yet. Our nearest kitchen is ${best.loc.name} (${best.km.toFixed(0)} km away). You can still order for pickup.`));
    }
  }
  if (name) cityInput.value = name;
  fillTimes();
}
cityInput.addEventListener("change", checkDeliveryArea);

// Remember the address while typing, so it's still there after going back to the menu
document.getElementById("delivery-fields").addEventListener("input", () => {
  const f = form.elements;
  store.set("se-last-address", { street: f.street.value, unit: f.unit.value, city: cityInput.value,
    postal: f.postal.value, instructions: f.instructions.value });
});

/* ----- Tip buttons ----- */
function renderTips() {
  document.getElementById("tip-options").replaceChildren(...D.tipOptions.map((rate) =>
    el("label", { class: "chip" },
      el("input", { type: "radio", name: "tip", value: rate, checked: rate === tipRate, onchange: () => { tipRate = rate; renderSummary(); } }),
      rate ? `${Math.round(rate * 100)}%` : "No tip")));
}

/* ----- Totals (same rules as the server) ----- */
const round = (n) => Math.round(n * 100) / 100;
function orderTotals() {
  const subtotal = round(Cart.totals().subtotal);
  const delivery = mode === "delivery";
  const deliveryFee = delivery && subtotal < D.freeOver ? D.fee : 0;
  const tax = round((subtotal + deliveryFee) * RESTAURANT.taxRate);
  const tip = delivery ? round(subtotal * tipRate) : 0;
  return { subtotal, deliveryFee, tax, tip, total: round(subtotal + deliveryFee + tax + tip) };
}

/* ----- Order summary on the right ----- */
function renderSummary() {
  const box = document.getElementById("summary");
  if (!box) return;            // confirmation screen is showing
  const items = Cart.items();
  const button = document.getElementById("place-order");
  box.replaceChildren();

  if (!items.length) {
    box.append(el("p", {}, "Your order is empty."), el("a", { class: "btn btn-dark", href: "menu.html" }, "Browse the menu"));
    button.disabled = true;
    return;
  }
  button.disabled = false;

  const list = el("div", { class: "summary-items" });
  for (const line of items) {
    const dish = findDish(line.id);
    list.append(el("div", { class: "cart-line" },
      dishPhoto(dish, ""),
      el("div", {}, el("div", { class: "cart-line-name" }, dish.name), el("div", { class: "cart-line-price" }, `${money(dish.price)} each`)),
      el("div", { class: "cart-line-actions" }, stepper(dish), el("strong", {}, money(dish.price * line.qty)))
    ));
  }
  const t = orderTotals();
  const delivery = mode === "delivery";
  const row = (label, value, cls) => el("div", { class: cls || "" }, el("span", {}, label), el("span", {}, value));
  box.append(list, el("div", { class: "totals" },
    row("Food", money(t.subtotal)),
    delivery && row("Delivery", t.deliveryFee ? money(t.deliveryFee) : "Free"),
    row("HST (13%)", money(t.tax)),
    delivery && row(`Tip (${Math.round(tipRate * 100)}%)`, money(t.tip)),
    row(delivery ? "Total to pay on delivery" : "Total to pay at pickup", money(t.total), "grand")
  ));
  if (delivery && t.subtotal < D.minimum) {
    box.append(el("p", { class: "notice notice-error" }, `Delivery needs at least ${money(D.minimum)} of food. Add ${money(D.minimum - t.subtotal)} more, or choose pickup.`));
  } else if (delivery && t.deliveryFee) {
    box.append(el("p", { class: "hint", style: "color:var(--muted)" }, `Add ${money(D.freeOver - t.subtotal)} more for free delivery.`));
  }
}

/* ----- Form checks ----- */
function setError(input, message) {
  const error = document.getElementById(input.id + "-error");
  input.setAttribute("aria-invalid", message ? "true" : "false");
  if (message) input.setAttribute("aria-describedby", error.id); else input.removeAttribute("aria-describedby");
  error.textContent = message || "";
  return !message;
}

function validate() {
  const f = form.elements;
  const digits = f.phone.value.replace(/\D/g, "");
  const checks = [
    setError(f.name, f.name.value.trim().length < 2 ? "Enter your name." : ""),
    setError(f.phone, digits.length < 10 || digits.length > 11 ? "Enter a 10-digit phone number, e.g. 905 555 0142." : "")
  ];
  if (mode === "delivery") {
    checks.push(
      setError(f.street, f.street.value.trim() ? "" : "Enter your street address."),
      setError(cityInput, !findPlaceName(cityInput.value) ? "Choose your city or town from the list."
        : !deliveryLoc ? "We don't deliver there yet. Choose pickup instead." : ""),
      setError(f.postal, /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(f.postal.value.trim()) ? "" : "Enter a postal code like L6Y 1A1.")
    );
  }
  const firstBad = form.querySelector('[aria-invalid="true"]');
  firstBad?.focus();
  if (checks.every(Boolean) && mode === "delivery" && orderTotals().subtotal < D.minimum) {
    document.getElementById("checkout-message").replaceChildren(el("p", { class: "notice notice-error", role: "alert" },
      `Delivery needs at least ${money(D.minimum)} of food.`));
    return false;
  }
  return checks.every(Boolean);
}

/* ----- Place order ----- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = document.getElementById("checkout-message");
  message.replaceChildren();
  if (!Cart.items().length || !validate()) return;
  const f = form.elements;
  const button = document.getElementById("place-order");
  const address = mode === "delivery" ? {
    street: f.street.value.trim(), unit: f.unit.value.trim(), city: cityInput.value.trim(),
    postal: f.postal.value.trim().toUpperCase(), instructions: f.instructions.value.trim()
  } : null;

  // LIVE: send the order to the server, which checks prices, area and times
  if (await serverOnline) {
    button.disabled = true;
    button.textContent = "Placing order…";
    const res = await api("/api/orders", {
      method: "POST",
      auth: true,
      body: {
        type: mode,
        locationId: mode === "pickup" ? locationSelect.value : undefined,
        address: address || undefined,
        tipRate: mode === "delivery" ? tipRate : 0,
        pickupAt: timeSelect.value,
        name: f.name.value.trim(),
        phone: f.phone.value.trim(),
        notes: f.notes.value.trim(),
        items: Cart.items().map((l) => ({ id: l.id, qty: l.qty }))
      }
    });
    button.disabled = false;
    button.textContent = "Place order";
    if (!res.ok) {
      message.replaceChildren(el("p", { class: "notice notice-error", role: "alert" }, res.body.message || "Your order couldn't be placed. Please try again."));
      if (res.status === 400) fillTimes();      // e.g. the chosen time has passed
      return;
    }
    const o = res.body.data;
    finishOrder({ ...o, pickup: o.pickupAt, locationId: o.location.id, phone: f.phone.value.trim(), live: true });
    return;
  }

  // DEMO: no server, keep the order in this browser
  const loc = activeLocation();
  finishOrder({
    number: "SE-" + Math.floor(1000 + Math.random() * 9000),
    type: mode,
    address,
    name: f.name.value.trim(),
    phone: f.phone.value.trim(),
    notes: f.notes.value.trim(),
    pickup: timeSelect.value,
    locationId: loc.id,
    items: Cart.items().map((l) => ({ name: findDish(l.id).name, qty: l.qty, price: findDish(l.id).price })),
    ...orderTotals(),
    placed: new Date().toISOString()
  });
});

function finishOrder(order) {
  // Keep a history so the Events calendar can show your orders
  const history = store.get(ORDERS_KEY, []);
  history.push(order);
  store.set(ORDERS_KEY, history.slice(-20));
  store.set("se-last-contact", { name: order.name, phone: order.phone });
  if (order.address) store.set("se-last-address", order.address);
  Cart.clear();
  showConfirmation(order);
}

function showConfirmation(order) {
  const root = document.getElementById("checkout-root");
  const when = slotLabel(new Date(order.pickup));
  const loc = findLocation(order.locationId);
  const delivery = order.type === "delivery";
  const a = order.address;
  root.replaceChildren(el("div", { class: "confirmation" },
    el("h1", {}, "Order placed"),
    el("p", {}, delivery ? `Thanks, ${order.name}. Your order number is:` : `Thanks, ${order.name}. Show this number at the counter:`),
    el("p", { class: "order-number" }, order.number),
    el("div", { class: "notice notice-success" },
      delivery
        ? [el("strong", {}, `Arriving around ${when}`), el("br"),
           `To ${a.street}${a.unit ? ", unit " + a.unit : ""}, ${a.city} ${a.postal}`, el("br"),
           `From ${loc.name} · Total to pay on delivery: ${money(order.total)}`]
        : [el("strong", {}, `Pickup: ${when}`), el("br"),
           `${loc.name}, ${loc.address}, ${loc.city}`, el("br"),
           `Total to pay: ${money(order.total)}`]
    ),
    order.live && el("div", { id: "live-status" }, statusTimeline("received", order.type)),
    el("ul", {}, order.items.map((i) => el("li", {}, `${i.qty} × ${i.name}`))),
    order.live
      ? el("p", {}, "We'll update the status above as the kitchen works on it. You can also ",
          el("a", { href: `track.html?order=${encodeURIComponent(order.number)}` }, "track it later"), ".")
      : el("p", {}, "Demo mode: the server isn't running, so this order was saved only in your browser."),
    el("div", { style: "display:flex;gap:12px;flex-wrap:wrap" },
      !delivery && el("a", { class: "btn btn-dark", href: directionsUrl(loc), target: "_blank", rel: "noopener" }, "Get directions"),
      el("a", { class: "btn btn-outline", href: "calendar.html", style: "color:var(--peacock)" }, "See it on the calendar"),
      el("a", { class: "btn btn-quiet", href: "menu.html" }, "Back to the menu")
    )
  ));
  if (order.live) watchStatus(order);
  root.querySelector("h1").setAttribute("tabindex", "-1");
  root.querySelector("h1").focus();
  window.scrollTo(0, 0);
}

// Checks the order status every 15 seconds while the page is open
function watchStatus(order) {
  const last4 = order.phone.replace(/\D/g, "").slice(-4);
  const tick = async () => {
    const res = await api(`/api/orders/${encodeURIComponent(order.number)}?phone=${last4}`);
    const box = document.getElementById("live-status");
    if (res.ok && box) box.replaceChildren(statusTimeline(res.body.data.status, res.body.data.type));
    if (res.ok && ["collected", "delivered", "cancelled"].includes(res.body.data.status)) clearInterval(timer);
  };
  const timer = setInterval(tick, 15000);
}

/* ----- Pre-fill details for members / returning customers ----- */
function prefill() {
  const f = form.elements;
  const member = store.get("se-member", null);
  const last = store.get("se-last-contact", null);
  const source = member ? { name: `${member.firstName} ${member.lastName}`, phone: member.phone } : last;
  if (source) {
    f.name.value = source.name || "";
    f.phone.value = source.phone || "";
  }
  const addr = store.get("se-last-address", null) ||
    (member && member.address ? { street: member.address, city: member.city, postal: member.postalCode } : null);
  if (addr) {
    f.street.value = addr.street || "";
    f.unit.value = addr.unit || "";
    cityInput.value = addr.city || "";
    f.postal.value = addr.postal || "";
    f.instructions.value = addr.instructions || "";
  }
}

document.getElementById("places").replaceChildren(...Object.keys(ONTARIO_PLACES).map((p) => el("option", { value: p })));

dataReady.then(async () => {
  fillLocations();
  renderTips();
  prefill();
  setMode(mode);
  if (cityInput.value) await checkDeliveryArea();
});
document.addEventListener("cart:change", renderSummary);
