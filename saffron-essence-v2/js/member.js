// member.js — create an account or sign in.
// LIVE: the server stores the account (password hashed with bcrypt).
// DEMO: the profile is saved only in this browser and the password is never stored.
const memberForm = document.getElementById("member-form");
const loginForm = document.getElementById("login-form");

// Already signed in? Go straight to the account page.
if (Session.token()) location.replace("submit.html");

const rules = {
  firstName: (v) => v.trim() ? "" : "Enter your first name.",
  lastName: (v) => v.trim() ? "" : "Enter your last name.",
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter an email like name@example.com.",
  phone: (v) => v.replace(/\D/g, "").length >= 10 ? "" : "Enter a 10-digit phone number.",
  address: (v) => v.trim() ? "" : "Enter your street address.",
  city: (v) => v.trim() ? "" : "Enter your city.",
  postalCode: (v) => /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(v.trim()) ? "" : "Enter a postal code like L6Y 1A1.",
  province: (v) => v ? "" : "Choose a province.",
  age: (v) => Number(v) >= 18 && Number(v) <= 120 ? "" : "You must be 18 or older to join.",
  password: (v) => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(v) ? "" : "Use at least 8 characters with one capital letter and one number.",
  confirmPassword: (v) => v === memberForm.elements.password.value ? "" : "Passwords don't match."
};

function check(input) {
  const message = rules[input.name] ? rules[input.name](input.value) : "";
  showError(input, message);
  return !message;
}

function showError(input, message) {
  const error = input.closest(".field").querySelector(".error");
  error.id = error.id || input.id + "-error";
  error.textContent = message;
  input.setAttribute("aria-invalid", message ? "true" : "false");
  if (message) input.setAttribute("aria-describedby", error.id); else input.removeAttribute("aria-describedby");
}

memberForm.querySelectorAll("input, select").forEach((input) =>
  input.addEventListener("blur", () => { if (input.value) check(input); }));

memberForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const results = [...memberForm.querySelectorAll("input, select")].map(check);
  if (!results.every(Boolean)) {
    memberForm.querySelector('[aria-invalid="true"]').focus();
    return;
  }
  const f = memberForm.elements;
  const profile = {
    firstName: f.firstName.value.trim(), lastName: f.lastName.value.trim(),
    email: f.email.value.trim(), phone: f.phone.value.trim(),
    address: f.address.value.trim(), city: f.city.value.trim(),
    postalCode: f.postalCode.value.trim().toUpperCase(), province: f.province.value
  };

  if (await serverOnline) {
    const res = await api("/api/members/register", { method: "POST", body: { ...profile, password: f.password.value } });
    if (!res.ok) {
      document.getElementById("member-message").replaceChildren(
        el("p", { class: "notice notice-error", role: "alert" }, res.body.message || "Your account couldn't be created."));
      return;
    }
    Session.save(res.body.token, res.body.data);
  } else {
    store.set("se-member", { ...profile, joined: new Date().toISOString() });   // password NOT saved
  }
  location.href = "submit.html";
});

memberForm.addEventListener("reset", () => {
  memberForm.querySelectorAll(".error").forEach((e) => { e.textContent = ""; });
  memberForm.querySelectorAll("[aria-invalid]").forEach((i) => i.removeAttribute("aria-invalid"));
});

// ---- Sign in (needs the server)
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("login-message");
  if (!(await serverOnline)) {
    msg.replaceChildren(el("p", { class: "notice notice-error", role: "alert" }, "Signing in needs the server, which isn't running. Start it with npm run dev."));
    return;
  }
  const res = await api("/api/members/login", { method: "POST", body: {
    email: loginForm.elements.email.value.trim(), password: loginForm.elements.password.value } });
  if (!res.ok) {
    msg.replaceChildren(el("p", { class: "notice notice-error", role: "alert" }, res.body.message || "Couldn't sign in."));
    return;
  }
  Session.save(res.body.token, res.body.data);
  location.href = new URLSearchParams(location.search).get("next") === "admin" ? "admin.html" : "submit.html";
});
