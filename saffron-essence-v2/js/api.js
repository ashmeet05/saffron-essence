/* ==========================================================
   api.js — connects the website to the backend (saffron-essence-api).

   - If the backend is running, the menu, locations, orders,
     accounts and messages all go through it (LIVE mode).
   - If it isn't, the site still works with the data in data.js
     and locations.js, and orders stay in this browser (DEMO mode).

   Load order on each page: data.js → locations.js → app.js → api.js → page script
   ========================================================== */

// Where the backend is. When the backend serves the site itself
// (http://localhost:4000 or a hosted address) it's the same address.
// When you open the HTML file directly or use Live Server, it's localhost:4000.
const API_BASE = (() => {
  if (window.SAFFRON_API) return window.SAFFRON_API;
  const local = ["localhost", "127.0.0.1"].includes(location.hostname);
  if (location.protocol.startsWith("http") && (!local || location.port === "4000")) return "";
  return "http://localhost:4000";
})();

const Session = {
  token: () => store.get("se-token", null),
  member: () => store.get("se-member", null),
  save(token, member) { store.set("se-token", token); store.set("se-member", member); },
  clear() { store.remove("se-token"); store.remove("se-member"); }
};

// Calls the backend. Always returns { ok, status, body } and never throws,
// so pages can show a message instead of breaking.
async function api(path, { method = "GET", body, auth = false, timeout = 6000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const headers = { "Content-Type": "application/json" };
  if (auth && Session.token()) headers.Authorization = `Bearer ${Session.token()}`;
  try {
    const res = await fetch(API_BASE + path, {
      method, headers, signal: controller.signal,
      body: body ? JSON.stringify(body) : undefined
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 401 && auth) Session.clear();          // expired sign-in
    return { ok: res.ok, status: res.status, body: json };
  } catch (err) {
    return { ok: false, status: 0, offline: true, body: { message: "Can't reach the server right now." } };
  } finally {
    clearTimeout(timer);
  }
}

// Is the backend running? Checked once per page.
const serverOnline = api("/api/health", { timeout: 2500 }).then((r) => r.ok);

// Waits for the live menu and locations (if the server is up), then
// replaces the built-in data with them. Pages render after this.
const dataReady = serverOnline.then(async (online) => {
  if (!online) return false;
  const [menu, locs] = await Promise.all([api("/api/menu"), api("/api/locations")]);
  if (menu.ok) {
    CATEGORIES.splice(0, CATEGORIES.length, ...menu.body.data.categories);
    MENU.splice(0, MENU.length, ...menu.body.data.dishes.map((d) => ({ ...d, image: d.image || `images/dishes/${d.id}.jpg` })));
  }
  if (locs.ok) LOCATIONS.splice(0, LOCATIONS.length, ...locs.body.data);
  return true;
});

// Small note in the footer saying which mode the site is in
document.addEventListener("DOMContentLoaded", () => {
  dataReady.then((live) => {
    document.querySelectorAll("[data-mode]").forEach((n) => {
      n.textContent = live ? "Live: connected to the server" : "Demo mode: server not running";
      n.className = "mode " + (live ? "mode-live" : "mode-demo");
    });
  });
});

// Shared helper: a status timeline for an order (used on checkout, track and account pages)
const ORDER_STEPS = {
  pickup: [["received", "Received"], ["preparing", "Preparing"], ["ready", "Ready for pickup"], ["collected", "Collected"]],
  delivery: [["received", "Received"], ["preparing", "Preparing"], ["out_for_delivery", "Out for delivery"], ["delivered", "Delivered"]]
};
const STATUS_LABELS = { received: "Received", preparing: "Preparing", ready: "Ready for pickup", collected: "Collected",
  out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled" };

function statusTimeline(status, type = "pickup") {
  if (status === "cancelled") return el("p", { class: "notice notice-error" }, "This order was cancelled. Please call the restaurant.");
  const steps = ORDER_STEPS[type] || ORDER_STEPS.pickup;
  const current = steps.findIndex(([s]) => s === status);
  return el("ol", { class: "timeline", "aria-label": "Order status" },
    steps.map(([s, label], i) => el("li", {
      class: i < current ? "done" : i === current ? "current" : "",
      "aria-current": i === current ? "step" : false
    }, label))
  );
}
