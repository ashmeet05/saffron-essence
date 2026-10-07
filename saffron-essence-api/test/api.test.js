// test/api.test.js — run with a test database:
//   MONGO_URI=mongodb://127.0.0.1:27017/saffron_test npm test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'only-for-automated-tests-not-a-real-secret';
process.env.ADMIN_EMAILS = 'staff@saffron.test';

const assert = require('assert');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const seed = require('../seed/seed');
const { ontarioParts } = require('../utils/hours');

const URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saffron_test';

// Finds a valid pickup time (Ontario time) at least 30 min from now during opening hours
function validPickup(hours, from = 30) {
  for (let m = from; m < 3 * 24 * 60; m += 15) {
    const t = new Date(Date.now() + m * 60000);
    t.setSeconds(0, 0);
    const { day, minutes } = ontarioParts(t);
    const h = hours[day];
    if (!h) continue;
    const [o, c] = h.map((x) => +x.split(':')[0] * 60 + +x.split(':')[1]);
    if (minutes >= o + 15 && minutes <= c - 15) return t.toISOString();
  }
}

describe('Saffron Essence API', function () {
  let token, staffToken, orderNumber, orderId, brampton;

  before(async () => {
    await mongoose.connect(URI);
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
    await seed(URI);
  });
  after(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  });

  it('health check', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
  });

  it('menu: 10 categories and 52 dishes', async () => {
    const res = await request(app).get('/api/menu');
    assert.strictEqual(res.body.data.categories.length, 10);
    assert.strictEqual(res.body.data.dishes.length, 52);
  });

  it('locations: 8 with hours', async () => {
    const res = await request(app).get('/api/locations');
    assert.strictEqual(res.body.data.length, 8);
    brampton = res.body.data.find((l) => l.id === 'brampton');
    assert.ok(brampton.hours['2']);
  });

  it('places a guest order with prices worked out on the server', async () => {
    const res = await request(app).post('/api/orders').send({
      locationId: 'brampton', pickupAt: validPickup(brampton.hours), name: 'Asha', phone: '905 555 0142',
      items: [{ id: 'butter-chicken', qty: 2, price: 0.01 }, { id: 'garlic-naan', qty: 3 }]   // fake price ignored
    });
    assert.strictEqual(res.status, 201, res.body.message);
    assert.strictEqual(res.body.data.subtotal, 40.45);          // 2×14.99 + 3×3.49
    assert.strictEqual(res.body.data.tax, 5.26);
    assert.strictEqual(res.body.data.total, 45.71);
    assert.match(res.body.data.number, /^SE-/);
    orderNumber = res.body.data.number;
  });

  it('rejects bad orders with clear messages', async () => {
    const base = { locationId: 'brampton', pickupAt: validPickup(brampton.hours), name: 'Asha', phone: '9055550142', items: [{ id: 'samosa', qty: 1 }] };
    let res = await request(app).post('/api/orders').send({ ...base, items: [] });
    assert.strictEqual(res.status, 400);
    res = await request(app).post('/api/orders').send({ ...base, phone: '123' });
    assert.match(res.body.message, /phone/);
    res = await request(app).post('/api/orders').send({ ...base, items: [{ id: 'pizza', qty: 1 }] });
    assert.match(res.body.message, /no longer available/);
    res = await request(app).post('/api/orders').send({ ...base, pickupAt: new Date().toISOString() });
    assert.match(res.body.message, /pickup time/);
    res = await request(app).post('/api/orders').send({ ...base, locationId: 'mars' });
    assert.match(res.body.message, /location/);
    res = await request(app).post('/api/orders').send({ ...base, items: [{ id: 'samosa', qty: 99 }] });
    assert.match(res.body.message, /between 1 and 20/);
  });

  it('blocks NoSQL injection in orders', async () => {
    const res = await request(app).post('/api/orders').send({
      locationId: { $ne: null }, pickupAt: validPickup(brampton.hours), name: 'x', phone: '9055550142', items: [{ id: { $gt: '' }, qty: 1 }]
    });
    assert.strictEqual(res.status, 400);
  });

  it('tracks an order only with the right phone digits', async () => {
    let res = await request(app).get(`/api/orders/${orderNumber}?phone=0142`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.status, 'received');
    res = await request(app).get(`/api/orders/${orderNumber}?phone=9999`);
    assert.strictEqual(res.status, 404);
    res = await request(app).get(`/api/orders/${orderNumber}`);
    assert.strictEqual(res.status, 404);
  });

  it('members: register (password hashed, never returned), login, profile', async () => {
    let res = await request(app).post('/api/members/register').send({
      firstName: 'Asha', lastName: 'Kaur', email: 'Asha@Example.com', phone: '9055550142', password: 'Test-Only-Pass1'
    });
    assert.strictEqual(res.status, 201, res.body.message);
    assert.strictEqual(res.body.data.password, undefined);
    token = res.body.token;
    const raw = await mongoose.connection.db.collection('members').findOne({ email: 'asha@example.com' });
    assert.ok(raw.password.startsWith('$2'));

    res = await request(app).post('/api/members/register').send({ firstName: 'A', lastName: 'B', email: 'asha@example.com', password: 'Test-Only-Pass1' });
    assert.strictEqual(res.status, 409);
    res = await request(app).post('/api/members/register').send({ firstName: 'A', lastName: 'B', email: 'b@example.com', password: 'weak' });
    assert.strictEqual(res.status, 400);

    res = await request(app).post('/api/members/login').send({ email: 'asha@example.com', password: 'wrong' });
    assert.strictEqual(res.status, 401);
    res = await request(app).post('/api/members/login').send({ email: { $ne: null }, password: { $ne: null } });
    assert.strictEqual(res.status, 401);
    res = await request(app).post('/api/members/login').send({ email: 'asha@example.com', password: 'Test-Only-Pass1' });
    assert.strictEqual(res.status, 200);
    res = await request(app).get('/api/members/me').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.body.data.firstName, 'Asha');
    assert.strictEqual(res.body.data.isAdmin, false);
  });

  it('member orders appear in their history', async () => {
    await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`).send({
      locationId: 'brampton', pickupAt: validPickup(brampton.hours), name: 'Asha Kaur', phone: '9055550142', items: [{ id: 'samosa', qty: 1 }]
    });
    const res = await request(app).get('/api/members/me/orders').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.body.data.length, 1);
    assert.strictEqual(res.body.data[0].items[0].name, 'Samosa');
  });

  it('delivery: area check, fee, tip, minimum and address rules', async () => {
    let res = await request(app).get('/api/orders/delivery-check?city=Oakville');
    assert.strictEqual(res.body.data.delivers, true);
    assert.strictEqual(res.body.data.locationId, 'mississauga');
    res = await request(app).get('/api/orders/delivery-check?city=Thunder Bay');
    assert.strictEqual(res.body.data.delivers, false);
    assert.match(res.body.data.message, /don't deliver/);

    const mississauga = (await request(app).get('/api/locations')).body.data.find((l) => l.id === 'mississauga');
    const when = (mins) => validPickup(mississauga.hours, mins);
    const base = { type: 'delivery', pickupAt: when(60), name: 'Raj', phone: '905 555 0199',
      address: { street: '12 Lakeshore Rd', city: 'oakville', postal: 'L6J 1H8', instructions: 'Ring twice' }, tipRate: 0.1 };

    // under $50: $4.99 fee, tip 10% of food, tax on food + fee
    res = await request(app).post('/api/orders').send({ ...base, items: [{ id: 'butter-chicken', qty: 2 }] });
    assert.strictEqual(res.status, 201, res.body.message);
    const o = res.body.data;
    assert.strictEqual(o.type, 'delivery');
    assert.strictEqual(o.location.id, 'mississauga');
    assert.strictEqual(o.address.city, 'Oakville');
    assert.strictEqual(o.subtotal, 29.98);
    assert.strictEqual(o.deliveryFee, 4.99);
    assert.strictEqual(o.tax, 4.55);           // 13% of 34.97
    assert.strictEqual(o.tip, 3);              // 10% of 29.98
    assert.strictEqual(o.total, 42.52);

    // $50+ gets free delivery
    res = await request(app).post('/api/orders').send({ ...base, items: [{ id: 'family-pack', qty: 1 }] });
    assert.strictEqual(res.body.data.deliveryFee, 0);

    // rules
    res = await request(app).post('/api/orders').send({ ...base, items: [{ id: 'samosa', qty: 1 }] });
    assert.match(res.body.message, /at least \$20/);
    res = await request(app).post('/api/orders').send({ ...base, address: { ...base.address, city: 'Thunder Bay' }, items: [{ id: 'family-pack', qty: 1 }] });
    assert.match(res.body.message, /don't deliver/);
    res = await request(app).post('/api/orders').send({ ...base, address: { ...base.address, postal: '12345' }, items: [{ id: 'family-pack', qty: 1 }] });
    assert.match(res.body.message, /postal code/);
    res = await request(app).post('/api/orders').send({ ...base, tipRate: 5, items: [{ id: 'family-pack', qty: 1 }] });
    assert.match(res.body.message, /tip/);
    res = await request(app).post('/api/orders').send({ ...base, pickupAt: when(20), items: [{ id: 'family-pack', qty: 1 }] });
    assert.match(res.body.message, /delivery time/);
  });

  it('contact messages are saved and validated', async () => {
    let res = await request(app).post('/api/messages').send({ name: 'Raj', email: 'raj@example.com', topic: 'Catering', message: 'Do you cater for 50 people?' });
    assert.strictEqual(res.status, 201);
    res = await request(app).post('/api/messages').send({ name: 'Raj', email: 'raj@example.com', message: 'hi' });
    assert.strictEqual(res.status, 400);
  });

  it('staff dashboard: blocked for guests and normal members', async () => {
    let res = await request(app).get('/api/admin/orders');
    assert.strictEqual(res.status, 401);
    res = await request(app).get('/api/admin/orders').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(res.status, 403);
  });

  it('staff can see orders, change status, pause a location and mark a dish sold out', async () => {
    let res = await request(app).post('/api/members/register').send({ firstName: 'Staff', lastName: 'One', email: 'staff@saffron.test', password: 'Test-Only-Staff1' });
    staffToken = res.body.token;
    assert.strictEqual(res.body.data.isAdmin, true);

    res = await request(app).get('/api/admin/orders').set('Authorization', `Bearer ${staffToken}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.length >= 2);
    orderId = res.body.data.find((o) => o.number === orderNumber).id;

    res = await request(app).patch(`/api/admin/orders/${orderId}`).set('Authorization', `Bearer ${staffToken}`).send({ status: 'ready' });
    assert.strictEqual(res.status, 200);
    res = await request(app).get(`/api/orders/${orderNumber}?phone=0142`);
    assert.strictEqual(res.body.data.status, 'ready');

    res = await request(app).get('/api/admin/orders').set('Authorization', `Bearer ${staffToken}`);
    const dOrder = res.body.data.find((o) => o.type === 'delivery');
    assert.ok(dOrder && dOrder.address.street === '12 Lakeshore Rd');
    res = await request(app).patch(`/api/admin/orders/${dOrder.id}`).set('Authorization', `Bearer ${staffToken}`).send({ status: 'out_for_delivery' });
    assert.strictEqual(res.status, 200);

    res = await request(app).patch(`/api/admin/orders/${orderId}`).set('Authorization', `Bearer ${staffToken}`).send({ status: 'eaten' });
    assert.strictEqual(res.status, 400);

    res = await request(app).patch('/api/admin/dishes/samosa').set('Authorization', `Bearer ${staffToken}`).send({ available: false });
    assert.strictEqual(res.status, 200);
    res = await request(app).get('/api/menu');
    assert.strictEqual(res.body.data.dishes.length, 51);

    res = await request(app).patch('/api/admin/locations/brampton').set('Authorization', `Bearer ${staffToken}`).send({ acceptingOrders: false });
    res = await request(app).post('/api/orders').send({ locationId: 'brampton', pickupAt: validPickup(brampton.hours), name: 'A', phone: '9055550142', items: [{ id: 'kheer', qty: 1 }] });
    assert.strictEqual(res.status, 409);

    res = await request(app).get('/api/admin/messages').set('Authorization', `Bearer ${staffToken}`);
    assert.strictEqual(res.body.data.length, 1);
  });

  it('serves the website and security headers', async () => {
    const res = await request(app).get('/');
    assert.ok([200, 404].includes(res.status));
    assert.ok(res.headers['content-security-policy']);
    const api404 = await request(app).get('/api/nope');
    assert.strictEqual(api404.status, 404);
  });
});
