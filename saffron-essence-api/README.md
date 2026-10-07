# Saffron Essence API (backend)

Node.js + Express + MongoDB backend for the Saffron Essence takeout website
(`../saffron-essence-v2`). It also serves the website, so one command runs everything.

## What it does
- **Menu & locations** stored in MongoDB (`/api/menu`, `/api/locations`)
- **Orders:** prices and pickup times are checked on the server, each order gets a number, and customers can track it (`/api/orders`)
- **Member accounts:** passwords hashed with bcrypt, sign-in with JWT tokens, order history (`/api/members`)
- **Contact messages** saved (`/api/messages`)
- **Staff dashboard** (`/admin.html`): see orders by location, move them New → Preparing → Ready → Collected, read messages, mark dishes sold out, pause a location (`/api/admin`, staff only)
- Security: Helmet headers and a content security policy, rate limits, NoSQL-injection protection, input validation, CORS allow-list

## Run it on your computer
1. Open this folder in VS Code and run `npm install`
2. Copy `.env.example` to `.env` and fill it in:
   - `MONGO_URI`: your MongoDB Atlas connection string, ending in `/saffron-essence?...` (a new database name)
   - `JWT_SECRET`: run `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` and paste the result
   - `ADMIN_EMAILS`: the email you'll use for your staff account
3. Load the menu and locations into the database: `npm run seed`
4. Start the server: `npm run dev`
5. Open **http://localhost:4000**. The footer should say "Live: connected to the server".
6. To use the staff dashboard: create an account on the site with your `ADMIN_EMAILS` email, then open **http://localhost:4000/admin.html**

## API overview
| Method | Address | Who | What |
|---|---|---|---|
| GET | /api/health | anyone | Is the server running? |
| GET | /api/menu | anyone | Categories and available dishes |
| GET | /api/locations | anyone | All locations with hours |
| POST | /api/orders | anyone | Place an order |
| GET | /api/orders/:number?phone=1234 | anyone with the phone digits | Order status |
| POST | /api/members/register | anyone | Create an account |
| POST | /api/members/login | anyone | Sign in, get a token |
| GET | /api/members/me | member | Your profile |
| GET | /api/members/me/orders | member | Your orders |
| POST | /api/messages | anyone | Contact form |
| GET | /api/admin/orders | staff | Orders (filter `?location=brampton`) |
| PATCH | /api/admin/orders/:id | staff | Change status |
| GET / PATCH | /api/admin/messages | staff | Read / mark handled |
| PATCH | /api/admin/dishes/:slug | staff | `{ "available": false }` = sold out |
| PATCH | /api/admin/locations/:slug | staff | `{ "acceptingOrders": false }` = pause orders |

## Tests
`npm test` runs 13 API tests. They need a test database, for example:
`MONGO_URI=mongodb://127.0.0.1:27017/saffron_test npm test`

## Folder structure
```
server.js          starts the server
app.js             security, routes, serves the website
config/db.js       MongoDB connection
models/            data shapes: Dish, Category, Location, Order, Member, Message
routes/            the API endpoints
middleware/        sign-in checks, rate limits, id validation
utils/             opening hours (Ontario time), price totals
seed/              starting menu and locations + the script that loads them
test/              automated tests
```
