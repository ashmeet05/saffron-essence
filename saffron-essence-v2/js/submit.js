// submit.js — "Your account": profile, past orders (live) and sign out.
const root = document.getElementById("welcome");

function signOut() {
  Session.clear();
  toast("Signed out");
  setTimeout(() => location.replace("member.html"), 600);
}

function profileList(m) {
  const rows = [["Name", `${m.firstName} ${m.lastName}`], ["Email", m.email], ["Phone", m.phone],
    ["Address", [m.address, m.city, m.province, m.postalCode].filter(Boolean).join(", ")]];
  return el("dl", { class: "profile" }, rows.filter(([, v]) => v).flatMap(([k, v]) => [el("dt", {}, k), el("dd", {}, v)]));
}

async function render() {
  const live = await serverOnline;

  // LIVE + signed in: load fresh profile and order history from the server
  if (live && Session.token()) {
    const [me, orders] = await Promise.all([api("/api/members/me", { auth: true }), api("/api/members/me/orders", { auth: true })]);
    if (!me.ok) { Session.clear(); return render(); }
    const m = me.body.data;
    root.replaceChildren(
      el("h1", {}, `Hi, ${m.firstName}`),
      el("p", {}, "Your name and phone are filled in for you at checkout."),
      profileList(m),
      el("div", { style: "display:flex;gap:12px;flex-wrap:wrap;margin-bottom:40px" },
        el("a", { class: "btn btn-primary", href: "menu.html" }, "Start an order"),
        m.isAdmin && el("a", { class: "btn btn-dark", href: "admin.html" }, "Staff dashboard"),
        el("button", { type: "button", class: "btn btn-quiet", onclick: signOut }, "Sign out")
      ),
      el("h2", {}, "Your orders"),
      orders.body.data && orders.body.data.length
        ? el("ul", { class: "order-history" }, orders.body.data.map((o) => el("li", {},
            el("div", { class: "oh-top" },
              el("strong", {}, o.number),
              el("span", {}, `${new Date(o.pickupAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })} · ${o.type === "delivery" ? "Delivery to " + o.address.city : "Pickup at " + (o.location ? o.location.name : "")}`),
              el("span", { class: "status-pill status-" + o.status }, STATUS_LABELS[o.status] || o.status),
              !["collected", "delivered", "cancelled"].includes(o.status) &&
                el("a", { href: `track.html?order=${encodeURIComponent(o.number)}` }, "Track")
            ),
            el("p", {}, o.items.map((i) => `${i.qty} × ${i.name}`).join(", "), ` · ${money(o.total)}`)
          )))
        : el("p", {}, "No orders yet.")
    );
    return;
  }

  // DEMO profile saved in this browser
  const member = Session.member();
  if (member && !Session.token()) {
    root.replaceChildren(
      el("h1", {}, `Welcome, ${member.firstName}`),
      el("p", {}, "You're a member. Your name and phone will be filled in for you at checkout."),
      profileList(member),
      el("div", { style: "display:flex;gap:12px;flex-wrap:wrap" },
        el("a", { class: "btn btn-primary", href: "menu.html" }, "Start an order"),
        el("button", { type: "button", class: "btn btn-quiet", onclick: signOut }, "Remove my details")
      ),
      el("p", { style: "color:var(--muted);margin-top:20px" }, "Demo mode: your details are saved only in this browser. Your password was not stored.")
    );
    return;
  }

  root.replaceChildren(
    el("h1", {}, "You're not signed in"),
    el("p", {}, "Create an account or sign in to see your orders."),
    el("a", { class: "btn btn-primary", href: "member.html" }, "Sign in or join")
  );
}

render();
