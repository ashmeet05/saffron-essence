// utils/hours.js — opening-hours checks, always in Ontario time
// (servers often run in UTC, so we can't use the server's clock time zone).
const ZONE = 'America/Toronto';
const DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// Day of week (0-6) and minutes since midnight for a date, in Ontario time
function ontarioParts(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(date).map((p) => [p.type, p.value])
  );
  return { day: DAYS[parts.weekday], minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

// Can an order be picked up at this time? Kitchen needs 15 min after opening
// and stops pickups 15 min before closing (same rule as the website).
function isValidPickupTime(location, date) {
  const { day, minutes } = ontarioParts(date);
  const hours = location.hours && location.hours[day];
  if (!hours) return false;
  const [open, close] = hours.map(toMinutes);
  return minutes >= open + 15 && minutes <= close - 15;
}

module.exports = { ontarioParts, isValidPickupTime, toMinutes };
