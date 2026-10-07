// admin.js — staff dashboard. Only accounts whose email is in ADMIN_EMAILS
// (in the server's .env) can use it. Refreshes every 20 seconds.
const board = document.getElementById("board");
const locFilter = document.getElementById("f-location");
const gate = document.getElementById("admin-gate");
const app = document.getElementById("admin-app");

// Each column holds one or more statuses. The next step depends on
// whether the order is for pickup or delivery.
const COLUMNS = [
  { title: "New", statuses: ["received"] },
  { title: "Preparing", statuses: ["preparing"] },
  { title: "Ready / on the way", statuses: ["ready", "out_for_delivery"] }
];
const NEXT = {
  received: { pickup: ["preparing", "Start preparing"], delivery: ["preparing", "Start preparing"] },
  preparing: { pickup: ["ready", "Mark ready"], delivery: ["out_for_delivery", "Send out for delivery"] },
  ready: { pickup: ["collected", "Mark collected"] },
  out_for_delivery: { delivery: ["delivered", "Mark delivered"] }
};

function showGate(message) {
  gate.hidden = false;
  app.hidden = true;
  gate.replaceChildren(
    el("h1", {}, "Staff dashboard"),
    el("p", {}, message),
    el("a", { class: "btn btn-primary", href: "member.html?next=admin" }, "Sign in")
  );
}

async function loadOrders() {
  const q = new URLSearchParams();
  if (locFilter.value) q.set("location", locFilter.value);
  const res = await api("/api/admin/orders?" + q, { auth: true });
  if (res.status === 401) return showGate("Your session ended. Please sign in again.");
  if (!res.ok) {
    board.replaceChildren(el("p", { class: "notice notice-error" }, res.body.message || "Couldn't load orders."));
    return;
  }
  const orders = res.body.data;
  document.getElementById("updated").textContent = `Updated ${new Date().toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", second: "2-digit" })} · ${orders.length} ${orders.length === 1 ? "order" : "orders"} for today and tomorrow`;

  board.replaceChildren(...COLUMNS.map((col) => {
    const list = orders.filter((o) => col.statuses.includes(o.status));
    const id = "col-" + col.statuses[0];
    return el("section", { class: "board-col", "aria-labelledby": id },
      el("h2", { id }, `${col.title} `, el("span", { class: "count" }, list.length)),
      list.length ? list.map(orderCard) : el("p", { class: "board-empty" }, "Nothing here.")
    );
  }));
}

function orderCard(o) {
  const when = new Date(o.pickupAt);
  const late = ["received", "preparing"].includes(o.status) && when < new Date();
  const delivery = o.type === "delivery";
  const next = (NEXT[o.status] || {})[o.type || "pickup"];
  const a = o.address;
  const mapLink = a ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${a.street}, ${a.city}, ON ${a.postal}`) : "";
  return el("article", { class: "order-card" + (late ? " late" : "") },
    el("div", { class: "oc-top" },
      el("strong", {}, o.number, " ", el("span", { class: "type-badge" + (delivery ? " delivery" : "") }, delivery ? "Delivery" : "Pickup")),
      el("span", { class: "oc-time" }, when.toLocaleString("en-CA", { weekday: "short", hour: "numeric", minute: "2-digit" }), late ? " · late" : "")
    ),
    el("p", { class: "oc-who" }, `${o.name} · `, el("a", { href: "tel:" + o.phone.replace(/\D/g, "") }, o.phone)),
    !locFilter.value && o.location && el("p", { class: "oc-loc" }, o.location.name),
    delivery && a && el("p", { class: "oc-address" },
      `${a.street}${a.unit ? ", unit " + a.unit : ""}, ${a.city} ${a.postal}`,
      a.instructions ? ` · ${a.instructions}` : "", " · ",
      el("a", { href: mapLink, target: "_blank", rel: "noopener" }, "Map")),
    el("ul", {}, o.items.map((i) => el("li", {}, `${i.qty} × ${i.name}`))),
    o.notes && el("p", { class: "oc-notes" }, "Note: ", o.notes),
    el("div", { class: "oc-actions" },
      el("span", { class: "price" }, money(o.total)),
      next && el("button", { type: "button", class: "btn btn-dark btn-small", onclick: () => setStatus(o, next[0]) }, next[1]),
      o.status === "received" && el("button", { type: "button", class: "btn btn-quiet btn-small", onclick: () => {
        if (confirm(`Cancel order ${o.number}?`)) setStatus(o, "cancelled");
      } }, "Cancel")
    )
  );
}

async function setStatus(order, status) {
  const res = await api(`/api/admin/orders/${order.id}`, { method: "PATCH", auth: true, body: { status } });
  toast(res.ok ? res.body.message : (res.body.message || "Couldn't update the order."));
  loadOrders();
}

async function loadMessages() {
  const res = await api("/api/admin/messages", { auth: true });
  const box = document.getElementById("messages");
  if (!res.ok) return;
  const open = res.body.data.filter((m) => !m.handled);
  box.replaceChildren(open.length ? el("ul", { class: "message-list" }, open.map((m) => el("li", {},
    el("div", { class: "oc-top" }, el("strong", {}, `${m.topic || "Message"} from ${m.name}`),
      el("span", {}, new Date(m.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" }))),
    el("p", {}, m.message),
    el("p", {}, el("a", { href: `mailto:${m.email}` }, m.email), " · ",
      el("button", { type: "button", class: "btn btn-quiet btn-small", onclick: async () => {
        await api(`/api/admin/messages/${m._id}`, { method: "PATCH", auth: true, body: { handled: true } });
        loadMessages();
      } }, "Mark handled"))
  ))) : el("p", { class: "board-empty" }, "No new messages."));
}

async function start() {
  if (!(await serverOnline)) {
    gate.replaceChildren(el("h1", {}, "Staff dashboard"), el("p", { class: "notice notice-error" }, "The server isn't running. Start it with npm run dev in the saffron-essence-api folder."));
    return;
  }
  if (!Session.token()) return showGate("Sign in with a staff account to see orders.");
  const me = await api("/api/members/me", { auth: true });
  if (!me.ok) return showGate("Please sign in again.");
  if (!me.body.data.isAdmin) return showGate("This account isn't a staff account. Add its email to ADMIN_EMAILS in the server's .env file.");

  gate.hidden = true;
  app.hidden = false;
  await dataReady;
  locFilter.replaceChildren(el("option", { value: "" }, "All locations"), ...LOCATIONS.map((l) => el("option", { value: l.id }, l.name)));
  locFilter.addEventListener("change", loadOrders);
  document.getElementById("refresh").addEventListener("click", () => { loadOrders(); loadMessages(); });
  loadOrders();
  loadMessages();
  setInterval(loadOrders, 20000);
}

start();
