# Saffron Essence — takeout restaurant website

A pickup-ordering website for a fictional Indian restaurant chain with 8 locations across Ontario.
Built with plain HTML, CSS and JavaScript (no frameworks, no build step).

**Two ways to run it:**
- **Full app (recommended):** start the backend in `../saffron-essence-api` (`npm run dev`) and open http://localhost:4000. Orders, accounts, tracking and the staff dashboard all work for real.
- **Demo mode:** just open `index.html`. Everything still works, but orders and profiles are saved only in your browser.

The footer shows which mode you're in. The map needs an internet connection (map tiles load online).
Tip: in VS Code, the "Live Server" extension runs it with auto-refresh.

## Features
- 52 dishes in 10 categories, each with a description, veg/non-veg marker and spice level
- 8 locations across Ontario on an interactive map; find the nearest by city or GPS
- Menu with search, a vegetarian filter and section links that follow you as you scroll
- Slide-out cart on every page; quantities saved in the browser (localStorage)
- Checkout with real pickup-time slots based on opening hours, form checks and an order number
- Events calendar showing weekly specials, one-off events and your own pickup orders
- Gallery with a lightbox (keyboard arrows work) and up to 5 saved favourites
- Membership form with validation; the password is checked but never stored
- Hours table, "Open now" status and Google Maps directions (no API key needed)
- Works on phones, keyboard-friendly, respects reduced-motion settings

## Where things are
| File | What it does |
|---|---|
| `js/data.js` | **All content:** dishes, prices, default hours, events, gallery photos. Edit this to change the menu. |
| `js/locations.js` | **Locations "database":** every restaurant's address, phone, map position and hours |
| `js/locations-page.js` | Find-a-location page: map, nearest search, directions |
| `js/vendor/leaflet.js` | Leaflet map library (BSD licence) |
| `images/dishes/` | Dish photos. See `PHOTO-NAMES.txt` for the file name each dish looks for. |
| `js/app.js` | Shared code: cart, cart drawer, mobile menu, open/closed status |
| `js/api.js` | Talks to the backend; switches between live and demo mode |
| `admin.html` | Staff dashboard (needs the backend and a staff account) |
| `track.html` | Track an order by number |
| `js/*.js` | One script per page (menu.js, checkout.js, calendar.js, ...) |
| `css/styles.css` | All styles. Colours and fonts are set at the top in `:root`. |
| `fonts/` | Rozha One and Hind (SIL Open Font License) |
| `images/` | Photos |

## Ideas for next steps
- Replace the small photos with larger ones (at least 800px wide)
- Add dish photos to `images/dishes/` using the names in `PHOTO-NAMES.txt`
- Move `LOCATIONS` into MongoDB and load them with `fetch()` from an Express API
