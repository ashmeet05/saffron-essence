# Saffron Essence — full-stack takeout ordering

A complete ordering website for a (fictional) Indian restaurant with 8 locations across Ontario.

**Live site:** _coming soon_

| Folder | What it is |
|---|---|
| [`saffron-essence-v2`](saffron-essence-v2) | Website: HTML, CSS, JavaScript (no framework). Menu, cart, checkout for pickup or delivery, locations map, order tracking, accounts, staff dashboard. |
| [`saffron-essence-api`](saffron-essence-api) | Backend: Node.js, Express, MongoDB (Mongoose). Orders, delivery rules, accounts with bcrypt + JWT, staff dashboard API, security (Helmet, CSP, rate limits, NoSQL-injection protection). |

## Features
- 52-dish menu with search, vegetarian filter, spice levels
- Pickup from 8 locations or delivery (area check, $20 minimum, fee, free over $50, tips)
- Prices, delivery area and pickup times are re-checked on the server
- Live order tracking: Received → Preparing → Ready / Out for delivery → Collected / Delivered
- Member accounts with order history
- Staff dashboard: incoming orders by location, status updates, contact messages
- Interactive map (Leaflet + OpenStreetMap) with nearest-location search
- Responsive, keyboard accessible, works in a demo mode without the server

## Run locally
```
cd saffron-essence-api
npm install
cp .env.example .env     # then fill in MONGO_URI, JWT_SECRET, ADMIN_EMAILS
npm run seed
npm run dev              # open http://localhost:4000
```

## Tests
`cd saffron-essence-api && npm test` (14 API tests; needs a test MongoDB)

Built by Ashmeet Kaur.

## Security
- No secrets in this repository: database links, passwords and the JWT secret live only in environment variables (`.env` locally, the hosting dashboard in production). `.env` is git-ignored.
- Passwords are hashed with bcrypt; sessions use signed JWTs.
- Prices, delivery areas and pickup times are validated on the server.
- Helmet security headers with a Content Security Policy, rate limiting on sign-in, orders and messages, and NoSQL-injection protection.
- The server refuses to start in production with a weak `JWT_SECRET`.
