// track.js — look up an order's status with its number + last 4 digits of the phone
const trackForm = document.getElementById("track-form");
const result = document.getElementById("track-result");

async function lookUp(number, last4) {
  if (!(await serverOnline)) {
    result.replaceChildren(el("p", { class: "notice notice-error" }, "Order tracking needs the server, which isn't running right now."));
    return;
  }
  result.replaceChildren(el("p", {}, "Looking up your order…"));
  const res = await api(`/api/orders/${encodeURIComponent(number)}?phone=${encodeURIComponent(last4)}`);
  if (!res.ok) {
    result.replaceChildren(el("p", { class: "notice notice-error", role: "alert" }, res.body.message || "Order not found."));
    return;
  }
  const o = res.body.data;
  result.replaceChildren(
    el("h2", {}, `Order ${o.number}`),
    statusTimeline(o.status, o.type),
    o.type === "delivery"
      ? el("p", {}, el("strong", {}, "Delivery: "), "arriving around ",
          new Date(o.pickupAt).toLocaleString("en-CA", { weekday: "long", hour: "numeric", minute: "2-digit" }),
          ` to ${o.address.street}${o.address.unit ? ", unit " + o.address.unit : ""}, ${o.address.city}`)
      : el("p", {}, el("strong", {}, "Pickup: "), new Date(o.pickupAt).toLocaleString("en-CA", { weekday: "long", hour: "numeric", minute: "2-digit" }),
          " at ", o.location.name, ", ", o.location.address, ", ", o.location.city),
    el("ul", {}, o.items.map((i) => el("li", {}, `${i.qty} × ${i.name}`))),
    el("p", {}, el("strong", {}, `Total to pay: ${money(o.total)}`)),
    el("p", { style: "color:var(--muted)" }, `Questions? Call the restaurant at ${o.location.phone}.`)
  );
}

trackForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const number = trackForm.elements.number.value.trim().toUpperCase();
  const last4 = trackForm.elements.phone.value.replace(/\D/g, "").slice(-4);
  if (!/^SE-\d{4,6}$/.test(number) || last4.length !== 4) {
    result.replaceChildren(el("p", { class: "notice notice-error", role: "alert" }, "Enter an order number like SE-1234 and the last 4 digits of your phone."));
    return;
  }
  lookUp(number, last4);
});

// Pre-fill from a link like track.html?order=SE-1234
const fromLink = new URLSearchParams(location.search).get("order");
if (fromLink) {
  trackForm.elements.number.value = fromLink;
  const last = store.get("se-last-contact", null);
  if (last && last.phone) {
    trackForm.elements.phone.value = last.phone.replace(/\D/g, "").slice(-4);
    lookUp(fromLink.toUpperCase(), trackForm.elements.phone.value);
  }
}
