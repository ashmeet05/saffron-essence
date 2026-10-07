// home.js — shows the "Most ordered" dishes on the home page.
function renderPopular() {
  const box = document.getElementById("popular");
  box.replaceChildren(...MENU.filter((d) => d.popular).map((dish) =>
    el("article", { class: "popular-item" },
      dishPhoto(dish, ""),
      el("h3", {}, dietMark(dish.veg), dish.name),
      el("p", {}, dish.desc),
      el("div", { class: "popular-foot" },
        el("span", { class: "price" }, money(dish.price)),
        buyControl(dish)
      )
    )
  ));
}

document.addEventListener("DOMContentLoaded", () => dataReady.then(renderPopular));
document.addEventListener("cart:change", renderPopular);
