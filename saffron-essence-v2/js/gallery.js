// gallery.js — photo grid, a lightbox with previous/next,
// and up to 5 favourites saved in the browser.
const FAV_KEY = "se-favourites";
const MAX_FAVS = 5;
const box = document.getElementById("lightbox");
let current = 0;

const favourites = () => store.get(FAV_KEY, []);
const isFav = (src) => favourites().includes(src);

function renderGrid() {
  document.getElementById("gallery").replaceChildren(...GALLERY.map((photo, i) =>
    el("button", { type: "button", class: "gallery-tile", "aria-label": `Open photo: ${photo.title}`, onclick: () => openPhoto(i) },
      el("img", { src: photo.src, alt: photo.title, loading: "lazy" }),
      isFav(photo.src) && el("span", { class: "fav-badge", "aria-hidden": "true" }, "★")
    )
  ));
}

function renderFavourites() {
  const list = favourites();
  const area = document.getElementById("favorites");
  if (!list.length) {
    area.replaceChildren(el("p", { style: "color:var(--muted)" }, "No favourites yet. Open a photo and choose Save to favourites."));
    return;
  }
  area.replaceChildren(...list.map((src) => {
    const photo = GALLERY.find((p) => p.src === src) || { title: "Photo" };
    return el("figure", {},
      el("img", { src, alt: photo.title }),
      el("button", { type: "button", class: "btn btn-quiet", onclick: () => toggleFav(src) }, "Remove")
    );
  }));
}

function toggleFav(src) {
  let list = favourites();
  if (list.includes(src)) {
    list = list.filter((s) => s !== src);
    toast("Removed from favourites");
  } else if (list.length >= MAX_FAVS) {
    toast(`You can save up to ${MAX_FAVS} favourites. Remove one first.`);
    return;
  } else {
    list.push(src);
    toast("Saved to favourites");
  }
  store.set(FAV_KEY, list);
  renderGrid();
  renderFavourites();
  updateLightbox();
}

function updateLightbox() {
  const photo = GALLERY[current];
  document.getElementById("lightbox-img").src = photo.src;
  document.getElementById("lightbox-img").alt = photo.title;
  document.getElementById("lightbox-title").textContent = photo.title;
  document.getElementById("lb-fav").textContent = isFav(photo.src) ? "Remove from favourites" : "Save to favourites";
}

function openPhoto(i) {
  current = i;
  updateLightbox();
  box.showModal();
}

function step(dir) {
  current = (current + dir + GALLERY.length) % GALLERY.length;
  updateLightbox();
}

document.getElementById("lb-prev").addEventListener("click", () => step(-1));
document.getElementById("lb-next").addEventListener("click", () => step(1));
document.getElementById("lb-fav").addEventListener("click", () => toggleFav(GALLERY[current].src));
document.getElementById("lb-close").addEventListener("click", () => box.close());
box.addEventListener("click", (e) => { if (e.target === box) box.close(); });   // click outside
box.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});

renderGrid();
renderFavourites();
