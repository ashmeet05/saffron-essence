/* ==========================================================
   locations.js — the restaurant's locations across Ontario.
   ----------------------------------------------------------
   This file works like a small database table: one object
   per location. To add a location, copy one block and change
   the values. lat/lng are map coordinates (find them by
   right-clicking a spot in Google Maps).

   Later you can move this list into a real database (for
   example MongoDB in your portfolio backend) and load it
   with fetch("/api/locations") — every page only uses the
   LOCATIONS array, so nothing else needs to change.
   ========================================================== */

const LOCATIONS = [
  {
    id: "brampton",
    name: "Brampton – Queen Street",
    address: "285 Queen Street East, Unit 4",
    city: "Brampton",
    postal: "L6W 2C2",
    phone: "(905) 555-0142",
    lat: 43.6905, lng: -79.7419,
    features: ["Dine-in", "Pickup", "Free parking"],
    flagship: true
  },
  {
    id: "mississauga",
    name: "Mississauga – City Centre",
    address: "210 Burnhamthorpe Road West",
    city: "Mississauga",
    postal: "L5B 2C8",
    phone: "(905) 555-0177",
    lat: 43.5890, lng: -79.6441,
    features: ["Dine-in", "Pickup", "Catering"]
  },
  {
    id: "toronto-queen-west",
    name: "Toronto – Queen West",
    address: "512 Queen Street West",
    city: "Toronto",
    postal: "M5V 2B3",
    phone: "(416) 555-0119",
    lat: 43.6477, lng: -79.4003,
    features: ["Dine-in", "Pickup", "Late night Fri–Sat"],
    // This location stays open later on Friday and Saturday
    hours: {
      0: ["12:00", "21:00"], 1: null,
      2: ["11:30", "21:30"], 3: ["11:30", "21:30"], 4: ["11:30", "21:30"],
      5: ["11:30", "23:30"], 6: ["12:00", "23:30"]
    }
  },
  {
    id: "scarborough",
    name: "Scarborough – Lawrence Avenue",
    address: "2100 Lawrence Avenue East",
    city: "Toronto",
    postal: "M1R 2Z5",
    phone: "(416) 555-0163",
    lat: 43.7500, lng: -79.2830,
    features: ["Pickup", "Free parking"]
  },
  {
    id: "hamilton",
    name: "Hamilton – King Street",
    address: "61 King Street East",
    city: "Hamilton",
    postal: "L8N 1A5",
    phone: "(905) 555-0108",
    lat: 43.2566, lng: -79.8667,
    features: ["Dine-in", "Pickup"]
  },
  {
    id: "kitchener",
    name: "Kitchener – Downtown",
    address: "180 King Street West",
    city: "Kitchener",
    postal: "N2G 1A6",
    phone: "(519) 555-0131",
    lat: 43.4510, lng: -80.4930,
    features: ["Dine-in", "Pickup"]
  },
  {
    id: "london",
    name: "London – Richmond Row",
    address: "420 Richmond Street",
    city: "London",
    postal: "N6A 3C7",
    phone: "(519) 555-0150",
    lat: 42.9870, lng: -81.2480,
    features: ["Dine-in", "Pickup"]
  },
  {
    id: "ottawa",
    name: "Ottawa – Bank Street",
    address: "345 Bank Street",
    city: "Ottawa",
    postal: "K2P 1X9",
    phone: "(613) 555-0124",
    lat: 45.4130, lng: -75.6980,
    features: ["Dine-in", "Pickup", "Catering"]
  }
];

// Ontario cities and towns people can search from, with map coordinates.
// Used to find the nearest location without needing a paid map service.
const ONTARIO_PLACES = {
  "Ajax": [43.8509, -79.0204], "Barrie": [44.3894, -79.6903], "Belleville": [44.1628, -77.3832],
  "Bolton": [43.8755, -79.7344], "Brampton": [43.6853, -79.7590], "Brantford": [43.1394, -80.2644],
  "Burlington": [43.3255, -79.7990], "Caledon": [43.8668, -79.8500], "Cambridge": [43.3616, -80.3144],
  "Etobicoke": [43.6205, -79.5132], "Georgetown": [43.6497, -79.9177], "Guelph": [43.5448, -80.2482],
  "Hamilton": [43.2557, -79.8711], "Kanata": [45.3088, -75.8987], "Kingston": [44.2312, -76.4860],
  "Kitchener": [43.4516, -80.4925], "London": [42.9849, -81.2453], "Markham": [43.8561, -79.3370],
  "Milton": [43.5183, -79.8774], "Mississauga": [43.5890, -79.6441], "Nepean": [45.3349, -75.7241],
  "Newmarket": [44.0592, -79.4613], "Niagara Falls": [43.0896, -79.0849], "North York": [43.7615, -79.4111],
  "Oakville": [43.4675, -79.6877], "Orangeville": [43.9200, -80.0943], "Oshawa": [43.8971, -78.8658],
  "Ottawa": [45.4215, -75.6972], "Peterborough": [44.3091, -78.3197], "Pickering": [43.8384, -79.0868],
  "Richmond Hill": [43.8828, -79.4403], "Sarnia": [42.9745, -82.4066], "Scarborough": [43.7764, -79.2318],
  "St. Catharines": [43.1594, -79.2469], "Sudbury": [46.4917, -80.9930], "Thunder Bay": [48.3809, -89.2477],
  "Toronto": [43.6532, -79.3832], "Vaughan": [43.8361, -79.4983], "Waterloo": [43.4643, -80.5204],
  "Whitby": [43.8975, -78.9429], "Windsor": [42.3149, -83.0364]
};
