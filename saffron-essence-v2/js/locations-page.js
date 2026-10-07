// locations-page.js — "Find a location": interactive map of every
// location, nearest-location search (by city or your GPS), hours,
// directions, and choosing the location you'll order from.
//
// Map: Leaflet (js/vendor/leaflet.js) with free map tiles from
// OpenStreetMap. No API key needed.

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let origin = null;          // { lat, lng, label } once the person searches
let map, markers = {};

/* ----- Map ----- */
function pinIcon(loc, selected) {
  return L.divIcon({
    className: "",
    html: `<span class="map-pin${selected ? " selected" : ""}"><span>${loc.flagship ? "★" : ""}</span></span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28]
  });
}

function popupContent(loc) {
  const status = openStatus(new Date(), hoursFor(loc));
  return `<strong>${loc.name}</strong><br>${loc.address}<br>${loc.city}, ON ${loc.postal}<br>
    <span class="${status.open ? "pop-open" : "pop-closed"}">${status.text}</span>`;
}

function buildMap() {
  if (typeof L === "undefined") {
    document.getElementById("map").replaceChildren(el("p", { class: "map-fallback" }, "The map couldn't load. Check your internet connection; the list of locations still works."));
    return;
  }
  map = L.map("map", { scrollWheelZoom: false });
  // Free street map from OpenStreetMap (no API key). Their rules ask that
  // pages credit them (the attribution below) and don't overload their servers.
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const selected = currentLocation();
  LOCATIONS.forEach((loc) => {
    markers[loc.id] = L.marker([loc.lat, loc.lng], { icon: pinIcon(loc, loc.id === selected.id), title: loc.name, alt: loc.name })
      .addTo(map)
      .bindPopup(() => popupContent(loc))
      .on("click", () => highlight(loc.id, false));
  });
  map.fitBounds(L.latLngBounds(LOCATIONS.map((l) => [l.lat, l.lng])), { padding: [30, 30] });
}

function focusOnMap(loc) {
  if (!map) return;
  map.flyTo([loc.lat, loc.lng], 13, { duration: 0.8 });
  markers[loc.id].openPopup();
}

function refreshPins() {
  if (!map) return;
  const selected = currentLocation();
  LOCATIONS.forEach((loc) => markers[loc.id].setIcon(pinIcon(loc, loc.id === selected.id)));
}

/* ----- List of locations ----- */
function sortedLocations() {
  const list = LOCATIONS.map((loc) => ({
    loc,
    km: origin ? distanceKm(origin.lat, origin.lng, loc.lat, loc.lng) : null
  }));
  if (origin) list.sort((a, b) => a.km - b.km);
  return list;
}

function renderList() {
  const selected = currentLocation();
  const box = document.getElementById("location-list");
  box.replaceChildren(...sortedLocations().map(({ loc, km }, i) => {
    const status = openStatus(new Date(), hoursFor(loc));
    const isSelected = loc.id === selected.id;
    return el("li", { class: "loc" + (isSelected ? " selected" : ""), id: "loc-" + loc.id },
      el("div", { class: "loc-top" },
        el("h3", {}, el("button", { type: "button", class: "loc-name", onclick: () => highlight(loc.id, true) }, loc.name)),
        km !== null && el("span", { class: "loc-distance" }, i === 0 ? `Nearest · ${km.toFixed(1)} km` : `${km.toFixed(1)} km`)
      ),
      el("p", { class: "loc-address" }, `${loc.address}, ${loc.city}, ON ${loc.postal}`),
      el("p", { class: "loc-status" }, el("span", { class: "status-dot" + (status.open ? " open" : "") }), status.text, " · ",
        el("a", { href: "tel:+1" + loc.phone.replace(/\D/g, "") }, loc.phone)),
      el("p", { class: "loc-features" }, loc.features.join(" · ")),
      loc.acceptingOrders === false && el("p", { class: "error-text" }, "Not taking online orders right now"),
      el("div", { class: "loc-actions" },
        isSelected
          ? el("span", { class: "tag tag-selected" }, "Your location")
          : el("button", { type: "button", class: "btn btn-dark btn-small", onclick: () => choose(loc) }, "Order from here"),
        el("a", { class: "btn btn-quiet btn-small", href: directionsUrl(loc), target: "_blank", rel: "noopener" }, "Directions"),
        el("button", { type: "button", class: "btn btn-quiet btn-small", onclick: () => highlight(loc.id, true) }, "Show on map")
      )
    );
  }));
}

function highlight(id, moveMap) {
  const loc = findLocation(id);
  document.querySelectorAll(".loc").forEach((n) => n.classList.toggle("focused", n.id === "loc-" + id));
  if (moveMap) focusOnMap(loc);
  else document.getElementById("loc-" + id)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  renderHours(loc);
}

function choose(loc) {
  setLocation(loc.id);
  toast(`You're ordering from ${loc.name}`);
  renderList();
  refreshPins();
  renderHours(loc);
  highlight(loc.id, true);
}

/* ----- Hours for the location in focus ----- */
function renderHours(loc = currentLocation()) {
  const hours = hoursFor(loc);
  const today = new Date().getDay();
  document.getElementById("hours-title").textContent = `Hours at ${loc.name}`;
  document.getElementById("hours").replaceChildren(
    el("caption", { class: "visually-hidden" }, `Opening hours at ${loc.name}`),
    el("tbody", {}, [1, 2, 3, 4, 5, 6, 0].map((d) => el("tr", { class: d === today ? "today" : "" },
      el("th", { scope: "row" }, DAY_NAMES[d], d === today ? " (today)" : ""),
      el("td", {}, hours[d] ? `${formatTime(toMinutes(hours[d][0]))} – ${formatTime(toMinutes(hours[d][1]))}` : "Closed")
    )))
  );
}

/* ----- Search: by city or by GPS ----- */
const searchInput = document.getElementById("place-search");
const searchMsg = document.getElementById("search-message");

function findPlace(text) {
  const q = text.trim().toLowerCase();
  if (!q) return null;
  const name = Object.keys(ONTARIO_PLACES).find((p) => p.toLowerCase() === q) ||
               Object.keys(ONTARIO_PLACES).find((p) => p.toLowerCase().startsWith(q));
  return name ? { name, lat: ONTARIO_PLACES[name][0], lng: ONTARIO_PLACES[name][1] } : null;
}

function showNearest(lat, lng, label) {
  origin = { lat, lng, label };
  renderList();
  const nearest = sortedLocations()[0];
  searchMsg.className = "search-message";
  searchMsg.textContent = `Nearest to ${label}: ${nearest.loc.name}, ${nearest.km.toFixed(1)} km away.`;
  highlight(nearest.loc.id, true);
}

document.getElementById("place-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const place = findPlace(searchInput.value);
  if (!place) {
    searchMsg.className = "search-message error-text";
    searchMsg.textContent = `We don't know "${searchInput.value}" yet. Choose an Ontario city from the list, or use your location.`;
    return;
  }
  searchInput.value = place.name;
  showNearest(place.lat, place.lng, place.name);
});

document.getElementById("use-gps").addEventListener("click", () => {
  if (!navigator.geolocation) {
    searchMsg.textContent = "Your browser can't share your location. Type your city instead.";
    return;
  }
  searchMsg.className = "search-message";
  searchMsg.textContent = "Finding your location…";
  navigator.geolocation.getCurrentPosition(
    (pos) => showNearest(pos.coords.latitude, pos.coords.longitude, "you"),
    () => {
      searchMsg.className = "search-message error-text";
      searchMsg.textContent = "Location access was blocked. Type your city instead.";
    },
    { timeout: 10000 }
  );
});

// City suggestions for the search box
document.getElementById("places").replaceChildren(...Object.keys(ONTARIO_PLACES).map((p) => el("option", { value: p })));

dataReady.then(() => {
  renderList();
  renderHours();
  buildMap();
});
