// utils/places.js — Ontario cities and towns with map coordinates.
// Used to check whether an address is inside a location's delivery area.
// (Same list as the website's js/locations.js.)
const ONTARIO_PLACES = {
  "Ajax": [
    43.8509,
    -79.0204
  ],
  "Barrie": [
    44.3894,
    -79.6903
  ],
  "Belleville": [
    44.1628,
    -77.3832
  ],
  "Bolton": [
    43.8755,
    -79.7344
  ],
  "Brampton": [
    43.6853,
    -79.759
  ],
  "Brantford": [
    43.1394,
    -80.2644
  ],
  "Burlington": [
    43.3255,
    -79.799
  ],
  "Caledon": [
    43.8668,
    -79.85
  ],
  "Cambridge": [
    43.3616,
    -80.3144
  ],
  "Etobicoke": [
    43.6205,
    -79.5132
  ],
  "Georgetown": [
    43.6497,
    -79.9177
  ],
  "Guelph": [
    43.5448,
    -80.2482
  ],
  "Hamilton": [
    43.2557,
    -79.8711
  ],
  "Kanata": [
    45.3088,
    -75.8987
  ],
  "Kingston": [
    44.2312,
    -76.486
  ],
  "Kitchener": [
    43.4516,
    -80.4925
  ],
  "London": [
    42.9849,
    -81.2453
  ],
  "Markham": [
    43.8561,
    -79.337
  ],
  "Milton": [
    43.5183,
    -79.8774
  ],
  "Mississauga": [
    43.589,
    -79.6441
  ],
  "Nepean": [
    45.3349,
    -75.7241
  ],
  "Newmarket": [
    44.0592,
    -79.4613
  ],
  "Niagara Falls": [
    43.0896,
    -79.0849
  ],
  "North York": [
    43.7615,
    -79.4111
  ],
  "Oakville": [
    43.4675,
    -79.6877
  ],
  "Orangeville": [
    43.92,
    -80.0943
  ],
  "Oshawa": [
    43.8971,
    -78.8658
  ],
  "Ottawa": [
    45.4215,
    -75.6972
  ],
  "Peterborough": [
    44.3091,
    -78.3197
  ],
  "Pickering": [
    43.8384,
    -79.0868
  ],
  "Richmond Hill": [
    43.8828,
    -79.4403
  ],
  "Sarnia": [
    42.9745,
    -82.4066
  ],
  "Scarborough": [
    43.7764,
    -79.2318
  ],
  "St. Catharines": [
    43.1594,
    -79.2469
  ],
  "Sudbury": [
    46.4917,
    -80.993
  ],
  "Thunder Bay": [
    48.3809,
    -89.2477
  ],
  "Toronto": [
    43.6532,
    -79.3832
  ],
  "Vaughan": [
    43.8361,
    -79.4983
  ],
  "Waterloo": [
    43.4643,
    -80.5204
  ],
  "Whitby": [
    43.8975,
    -78.9429
  ],
  "Windsor": [
    42.3149,
    -83.0364
  ]
};

// Straight-line distance in km between two points (haversine formula)
function distanceKm(lat1, lng1, lat2, lng2) {
  const rad = (d) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

// Finds a place by name, ignoring upper/lower case
function findPlace(name) {
  const key = Object.keys(ONTARIO_PLACES).find((p) => p.toLowerCase() === String(name || '').trim().toLowerCase());
  return key ? { name: key, lat: ONTARIO_PLACES[key][0], lng: ONTARIO_PLACES[key][1] } : null;
}

module.exports = { ONTARIO_PLACES, distanceKm, findPlace };
