// calendar.js — a month calendar showing weekly specials, one-off
// events and the pickup orders you placed on this website.
let viewYear, viewMonth;   // month currently shown (month: 0-11)

const pad = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;   // local date, not UTC

function eventsOn(date) {
  return EVENTS.filter((e) => (e.weekly !== undefined ? e.weekly === date.getDay() && hoursFor(currentLocation())[date.getDay()] : e.date === dateKey(date)));
}

function ordersOn(date) {
  return store.get("se-orders", []).filter((o) => dateKey(new Date(o.pickup)) === dateKey(date));
}

function renderCalendar() {
  const grid = document.getElementById("calendar");
  const first = new Date(viewYear, viewMonth, 1);
  const days = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayKey = dateKey(new Date());

  document.getElementById("cal-title").textContent = first.toLocaleDateString("en-CA", { month: "long", year: "numeric" });
  grid.replaceChildren();
  grid.setAttribute("role", "grid");
  grid.setAttribute("aria-labelledby", "cal-title");

  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((d) => grid.append(el("div", { class: "cal-dow", role: "columnheader" }, d)));
  for (let i = 0; i < first.getDay(); i++) grid.append(el("div", { class: "cal-day blank", "aria-hidden": "true" }));

  for (let day = 1; day <= days; day++) {
    const date = new Date(viewYear, viewMonth, day);
    const classes = ["cal-day"];
    if (!hoursFor(currentLocation())[date.getDay()]) classes.push("closed");
    if (dateKey(date) === todayKey) classes.push("today");
    grid.append(el("div", { class: classes.join(" "), role: "gridcell" },
      el("div", { class: "cal-date" }, day),
      eventsOn(date).map((e) => el("span", { class: "cal-item event", title: e.text }, e.title)),
      ordersOn(date).map((o) => el("span", { class: "cal-item order" },
        `${formatTime(new Date(o.pickup).getHours() * 60 + new Date(o.pickup).getMinutes())} ${o.type === "delivery" ? "delivery" : "pickup"} ${o.number}`))
    ));
  }
}

// Simple list of the next few weeks (also what phones see)
function renderList() {
  const list = document.getElementById("event-list");
  const items = [];
  const start = new Date(); start.setHours(0, 0, 0, 0);
  for (let i = 0; i < 28 && items.length < 10; i++) {
    const date = new Date(start); date.setDate(start.getDate() + i);
    ordersOn(date).forEach((o) => {
      const loc = findLocation(o.locationId);
      items.push({ date, title: o.type === "delivery" ? `Your delivery ${o.number} to ${o.address ? o.address.city : ""}` : `Your pickup ${o.number}${loc ? " at " + loc.name : ""}`, text: `${o.items.map((x) => `${x.qty} × ${x.name}`).join(", ")} · ${money(o.total)}` });
    });
    eventsOn(date).forEach((e) => items.push({ date, title: e.title, text: e.text }));
  }
  list.replaceChildren(...items.map((it) =>
    el("li", {},
      el("div", { class: "event-date" }, it.date.toLocaleDateString("en-CA", { weekday: "short" }), el("br"), it.date.toLocaleDateString("en-CA", { month: "short", day: "numeric" })),
      el("div", {}, el("h3", {}, it.title), el("p", {}, it.text))
    )
  ));
}

function moveMonth(step) {
  viewMonth += step;
  if (viewMonth < 0) { viewMonth = 11; viewYear--; }
  if (viewMonth > 11) { viewMonth = 0; viewYear++; }
  renderCalendar();
}

const now = new Date();
viewYear = now.getFullYear();
viewMonth = now.getMonth();
document.getElementById("cal-prev").addEventListener("click", () => moveMonth(-1));
document.getElementById("cal-next").addEventListener("click", () => moveMonth(1));
renderCalendar();
renderList();
