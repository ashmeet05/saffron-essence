// contact.js — checks the form, then sends it to the server.
// DEMO (no server): opens your email app with the message ready instead.
const contactForm = document.getElementById("contact-form");
const contactMessage = document.getElementById("contact-message");

function setFieldError(input, message) {
  const error = input.closest(".field").querySelector(".error");
  error.id = error.id || input.id + "-error";
  error.textContent = message;
  input.setAttribute("aria-invalid", message ? "true" : "false");
  if (message) input.setAttribute("aria-describedby", error.id); else input.removeAttribute("aria-describedby");
  return !message;
}

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = contactForm.elements;
  const ok = [
    setFieldError(f.name, f.name.value.trim() ? "" : "Enter your name."),
    setFieldError(f.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value) ? "" : "Enter an email like name@example.com."),
    setFieldError(f.message, f.message.value.trim().length >= 10 ? "" : "Write a message of at least 10 characters.")
  ].every(Boolean);
  if (!ok) { contactForm.querySelector('[aria-invalid="true"]').focus(); return; }

  const data = { name: f.name.value.trim(), email: f.email.value.trim(), topic: f.topic.value, message: f.message.value.trim() };

  if (await serverOnline) {
    const res = await api("/api/messages", { method: "POST", body: data });
    contactMessage.replaceChildren(el("p", { class: "notice " + (res.ok ? "notice-success" : "notice-error"), role: "status" },
      res.ok ? "Message sent. We'll reply within a day." : (res.body.message || "Your message couldn't be sent.")));
    if (res.ok) contactForm.reset();
    return;
  }

  const subject = encodeURIComponent(`${data.topic} — from ${data.name}`);
  const body = encodeURIComponent(`${data.message}\n\n${data.name}\n${data.email}`);
  window.location.href = `mailto:${RESTAURANT.email}?subject=${subject}&body=${body}`;
  contactMessage.replaceChildren(el("p", { class: "notice notice-success", role: "status" },
    "Your email app should open with the message ready. Press send there to reach us."));
});
