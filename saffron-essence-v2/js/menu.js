// menu.js — builds the menu from data.js, with search, a vegetarian
// filter, section links, and Add / quantity buttons.
const searchBox = document.getElementById("menu-search");
const vegOnly = document.getElementById("veg-only");

function matches(dish) {
  const q = searchBox.value.trim().toLowerCase();
  if (vegOnly.checked && !dish.veg) return false;
  return !q || dish.name.toLowerCase().includes(q) || dish.desc.toLowerCase().includes(q);
}

function dishRow(dish) {
  const row = el("article", { class: "dish", id: "dish-" + dish.id });
  // No photo file yet? Switch the row to the text-only layout.
  const photo = dishPhoto(dish, "dish-photo", () => row.classList.add("text-only"));
  if (!photo) row.classList.add("text-only");
  row.append(
    photo || "",
    el("div", {},
      el("h3", { class: "dish-name" }, dietMark(dish.veg), dish.name, dish.popular && el("span", { class: "tag" }, "Popular")),
      el("p", { class: "dish-desc" }, dish.desc),
      el("div", { class: "dish-meta" }, spiceMark(dish.spice))
    ),
    el("div", { class: "dish-buy" },
      el("span", { class: "price" }, money(dish.price)),
      buyControl(dish)
    )
  );
  return row;
}

function renderMenu() {
  const list = document.getElementById("menu-list");
  const nav = document.getElementById("menu-nav");
  list.replaceChildren();
  nav.replaceChildren();
  let shown = 0;

  for (const cat of CATEGORIES) {
    const dishes = MENU.filter((d) => d.category === cat.id && matches(d));
    if (!dishes.length) continue;
    shown += dishes.length;
    nav.append(el("li", {}, el("a", { href: "#" + cat.id }, cat.name)));
    list.append(el("section", { class: "menu-category", id: cat.id, "aria-labelledby": cat.id + "-title" },
      el("h2", { id: cat.id + "-title" }, cat.name),
      dishes.map(dishRow)
    ));
  }

  if (!shown) {
    list.append(el("p", { class: "menu-empty" },
      "No dishes match “", searchBox.value, "”. Try another word or ",
      el("button", { type: "button", class: "btn btn-quiet", onclick: () => { searchBox.value = ""; vegOnly.checked = false; renderMenu(); } }, "clear the search"),
      "."
    ));
  }
  watchSections();
}

// Highlight the section you're looking at in the side links
let observer;
function watchSections() {
  observer?.disconnect();
  const links = document.querySelectorAll("#menu-nav a");
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id));
    });
  }, { rootMargin: "-30% 0px -60% 0px" });
  document.querySelectorAll(".menu-category").forEach((s) => observer.observe(s));
  links[0]?.classList.add("active");
}

searchBox.addEventListener("input", renderMenu);
vegOnly.addEventListener("change", renderMenu);
document.addEventListener("cart:change", () => {
  // Only refresh the buttons, so the page doesn't jump while scrolling
  MENU.forEach((dish) => {
    const row = document.getElementById("dish-" + dish.id);
    row?.querySelector(".dish-buy").lastElementChild.replaceWith(buyControl(dish));
  });
});
dataReady.then(renderMenu);
