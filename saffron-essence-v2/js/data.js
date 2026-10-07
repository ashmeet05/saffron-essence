/* ==========================================================
   data.js — all the restaurant's content in ONE place.
   To add a dish, change a price or add an event, edit this
   file only. Every page reads from here.
   ========================================================== */

const RESTAURANT = {
  name: "Saffron Essence",
  phone: "(905) 555-0142",          // head office / catering line
  email: "info@saffronessence.com",
  taxRate: 0.13,          // Ontario HST
  prepMinutes: 20,        // earliest pickup = now + this

  // Delivery rules (the server uses the same numbers and has the final say)
  delivery: {
    fee: 4.99,
    freeOver: 50,          // free delivery when food is $50 or more
    minimum: 20,           // smallest food order we deliver
    extraMinutes: 25,      // driving time added to cooking time
    radiusKm: 15,          // each kitchen delivers this far (a location can override)
    tipOptions: [0, 0.10, 0.15, 0.18]
  },

  // Default opening hours for every location (a location in locations.js
  // can override these). Day 0 = Sunday ... 6 = Saturday. null = closed.
  // Times are 24-hour "HH:MM".
  hours: {
    0: ["12:00", "21:00"],
    1: null,
    2: ["11:30", "21:30"],
    3: ["11:30", "21:30"],
    4: ["11:30", "21:30"],
    5: ["11:30", "22:30"],
    6: ["12:00", "22:30"]
  }
};

const CATEGORIES = [
  { id: "appetizers", name: "Appetizers" },
  { id: "tandoor", name: "From the tandoor" },
  { id: "curries", name: "Chicken, lamb & seafood" },
  { id: "vegetarian", name: "Vegetarian curries" },
  { id: "biryani", name: "Biryani & rice" },
  { id: "breads", name: "Breads" },
  { id: "combos", name: "Thalis & family packs" },
  { id: "sides", name: "Sides & chutneys" },
  { id: "desserts", name: "Desserts" },
  { id: "drinks", name: "Drinks" }
];

// veg: true = vegetarian.  spice: 0 (mild) to 3 (hot).
// image: "" means "use images/dishes/<id>.jpg". Put a photo with that
// name in the images/dishes folder and it shows up automatically.
// If the file isn't there yet, the menu shows a clean text-only row.
const MENU = [
  // ----- Appetizers
  { id: "samosa", category: "appetizers", name: "Samosa", price: 5.99, veg: true, spice: 1,
    desc: "Two crisp pastries filled with spiced potato and peas, with mint and tamarind chutney.",
    image: "images/samosa.jpeg", popular: true },
  { id: "pakora", category: "appetizers", name: "Vegetable pakora", price: 6.99, veg: true, spice: 1,
    desc: "Onion, spinach and potato fritters in a chickpea-flour batter.",
    image: "images/pakora.jpeg" },
  { id: "paneer-pakora", category: "appetizers", name: "Paneer pakora", price: 8.49, veg: true, spice: 1,
    desc: "Cottage cheese slices stuffed with green chutney, battered and fried until golden.", image: "" },
  { id: "samosa-chaat", category: "appetizers", name: "Samosa chaat", price: 8.99, veg: true, spice: 2,
    desc: "Crushed samosa topped with chickpea curry, yogurt, chutneys and crunchy sev.", image: "" },
  { id: "chicken-65", category: "appetizers", name: "Chicken 65", price: 11.49, veg: false, spice: 3,
    desc: "South Indian fried chicken bites tossed with curry leaves, garlic and red chili.", image: "" },
  { id: "chilli-paneer", category: "appetizers", name: "Chilli paneer", price: 11.99, veg: true, spice: 2,
    desc: "Indo-Chinese favourite: crisp paneer with peppers and onions in a tangy chili sauce.", image: "" },

  // ----- Tandoor
  { id: "tandoori-chicken", category: "tandoor", name: "Tandoori chicken (half)", price: 13.99, veg: false, spice: 2,
    desc: "Bone-in chicken marinated overnight in yogurt and spices, roasted in the clay oven.", image: "" },
  { id: "chicken-tikka", category: "tandoor", name: "Chicken tikka", price: 14.49, veg: false, spice: 2,
    desc: "Boneless chicken thigh pieces charred in the tandoor, served with mint chutney.", image: "" },
  { id: "seekh-kebab", category: "tandoor", name: "Lamb seekh kebab", price: 15.99, veg: false, spice: 2,
    desc: "Minced lamb with ginger, garlic and fresh herbs, grilled on skewers.", image: "" },
  { id: "tandoori-paneer", category: "tandoor", name: "Paneer tikka (dry)", price: 13.49, veg: true, spice: 1,
    desc: "Paneer, peppers and onion marinated in spiced yogurt and grilled.", image: "" },

  // ----- Curries
  { id: "butter-chicken", category: "curries", name: "Butter chicken", price: 14.99, veg: false, spice: 1,
    desc: "Tandoor-roasted chicken in a creamy tomato and butter sauce. Our most ordered dish.",
    image: "images/butterchicken.jpeg", popular: true },
  { id: "chicken-tikka-masala", category: "curries", name: "Chicken tikka masala", price: 15.49, veg: false, spice: 2,
    desc: "Charred chicken tikka in a spiced onion and tomato masala.", image: "" },
  { id: "chicken-korma", category: "curries", name: "Chicken korma", price: 15.49, veg: false, spice: 0,
    desc: "Mild, nutty curry of cashew, cream and cardamom. A good choice for kids.", image: "" },
  { id: "lamb-rogan-josh", category: "curries", name: "Lamb rogan josh", price: 17.99, veg: false, spice: 2,
    desc: "Slow-cooked Kashmiri lamb curry with Kashmiri chili, fennel and ginger.", image: "" },
  { id: "goat-curry", category: "curries", name: "Home-style goat curry", price: 17.49, veg: false, spice: 3,
    desc: "Bone-in goat cooked for hours with whole spices, the way it's made at home.", image: "" },
  { id: "fish-curry", category: "curries", name: "Goan fish curry", price: 16.99, veg: false, spice: 2,
    desc: "Basa fillet in a tangy coconut, tamarind and red chili gravy.", image: "" },
  { id: "prawn-masala", category: "curries", name: "Prawn masala", price: 18.49, veg: false, spice: 2,
    desc: "Tiger prawns in a thick onion, tomato and coastal spice masala.", image: "" },

  // ----- Vegetarian curries
  { id: "paneer-tikka", category: "vegetarian", name: "Paneer tikka masala", price: 12.99, veg: true, spice: 2,
    desc: "Grilled cottage cheese in a smoky, spiced onion and tomato gravy.",
    image: "images/paneer.jpeg", popular: true },
  { id: "palak-paneer", category: "vegetarian", name: "Palak paneer", price: 12.99, veg: true, spice: 1,
    desc: "Paneer cubes in a smooth spinach sauce with garlic and a touch of cream.", image: "" },
  { id: "dal-makhani", category: "vegetarian", name: "Dal makhani", price: 11.49, veg: true, spice: 1,
    desc: "Black lentils and kidney beans simmered overnight with butter and cream.", image: "" },
  { id: "chana-masala", category: "vegetarian", name: "Chana masala", price: 10.99, veg: true, spice: 2,
    desc: "Chickpeas in a tangy onion-tomato gravy with Punjabi garam masala. Vegan.", image: "" },
  { id: "aloo-gobi", category: "vegetarian", name: "Aloo gobi", price: 9.99, veg: true, spice: 1,
    desc: "Potato and cauliflower cooked dry with turmeric, cumin and ginger. Vegan.",
    image: "images/gobi.jpeg" },
  { id: "baingan-bharta", category: "vegetarian", name: "Baingan bharta", price: 10.99, veg: true, spice: 2,
    desc: "Fire-roasted eggplant mashed with onion, tomato and green chili.",
    image: "images/bharta.jpeg" },
  { id: "malai-kofta", category: "vegetarian", name: "Malai kofta", price: 13.49, veg: true, spice: 0,
    desc: "Paneer and potato dumplings in a rich, mildly sweet cashew sauce.", image: "" },

  // ----- Biryani & rice
  { id: "chicken-biryani", category: "biryani", name: "Hyderabadi chicken biryani", price: 15.99, veg: false, spice: 2,
    desc: "Layered basmati rice and chicken cooked sealed (dum style), with raita.", image: "", popular: false },
  { id: "goat-biryani", category: "biryani", name: "Goat biryani", price: 17.99, veg: false, spice: 2,
    desc: "Bone-in goat and saffron basmati slow-cooked together, with raita.", image: "" },
  { id: "veg-biryani", category: "biryani", name: "Vegetable biryani", price: 13.49, veg: true, spice: 1,
    desc: "Basmati rice with seasonal vegetables, mint and fried onions, with raita.", image: "" },
  { id: "jeera-rice", category: "biryani", name: "Jeera rice", price: 4.49, veg: true, spice: 0,
    desc: "Basmati rice tempered with cumin seeds and ghee.", image: "" },
  { id: "plain-rice", category: "biryani", name: "Steamed basmati rice", price: 3.49, veg: true, spice: 0,
    desc: "Long-grain basmati, steamed plain.", image: "" },

  // ----- Breads
  { id: "butter-naan", category: "breads", name: "Butter naan", price: 2.99, veg: true, spice: 0,
    desc: "Soft tandoor bread brushed with butter.", image: "" },
  { id: "garlic-naan", category: "breads", name: "Garlic naan", price: 3.49, veg: true, spice: 0,
    desc: "Tandoor bread with garlic butter and fresh coriander.", image: "" },
  { id: "tandoori-roti", category: "breads", name: "Tandoori roti", price: 2.49, veg: true, spice: 0,
    desc: "Whole-wheat flatbread from the clay oven. Vegan.", image: "" },
  { id: "lachha-paratha", category: "breads", name: "Lachha paratha", price: 3.99, veg: true, spice: 0,
    desc: "Flaky, layered whole-wheat bread cooked with ghee.", image: "" },
  { id: "aloo-kulcha", category: "breads", name: "Amritsari aloo kulcha", price: 5.49, veg: true, spice: 1,
    desc: "Crisp stuffed bread filled with spiced potato and onion.", image: "" },

  // ----- Thalis & family packs
  { id: "veg-thali", category: "combos", name: "Vegetarian thali", price: 16.99, veg: true, spice: 1,
    desc: "Two vegetable curries, dal, rice, naan, raita, salad and a gulab jamun.", image: "" },
  { id: "nonveg-thali", category: "combos", name: "Non-veg thali", price: 19.99, veg: false, spice: 1,
    desc: "Butter chicken, a vegetable curry, dal, rice, naan, raita and a gulab jamun.", image: "" },
  { id: "family-pack", category: "combos", name: "Family pack (feeds 4)", price: 59.99, veg: false, spice: 1,
    desc: "Any two curries, a large biryani, four naan, samosas and dessert. Tell us your picks in the notes.", image: "" },
  { id: "veg-family-pack", category: "combos", name: "Vegetarian family pack (feeds 4)", price: 54.99, veg: true, spice: 1,
    desc: "Two vegetarian curries, dal, vegetable biryani, four naan, pakoras and dessert.", image: "" },

  // ----- Sides
  { id: "raita", category: "sides", name: "Cucumber raita", price: 3.49, veg: true, spice: 0,
    desc: "Cool yogurt with cucumber and roasted cumin.", image: "" },
  { id: "mango-chutney", category: "sides", name: "Mango chutney", price: 1.99, veg: true, spice: 0,
    desc: "Sweet and lightly spiced mango preserve.", image: "" },
  { id: "papadum", category: "sides", name: "Papadum (4)", price: 2.49, veg: true, spice: 0,
    desc: "Crisp lentil wafers.", image: "" },
  { id: "onion-salad", category: "sides", name: "Lachha onion salad", price: 2.99, veg: true, spice: 1,
    desc: "Sliced red onion with lemon, chili and chaat masala.", image: "" },

  // ----- Desserts
  { id: "gulab-jamun", category: "desserts", name: "Gulab jamun", price: 4.99, veg: true, spice: 0,
    desc: "Two warm milk dumplings soaked in cardamom and rose syrup.",
    image: "images/gulabjamun.jpeg" },
  { id: "rasgulla", category: "desserts", name: "Rasgulla", price: 5.49, veg: true, spice: 0,
    desc: "Soft, spongy cheese dumplings in light sugar syrup, served chilled.",
    image: "images/rasgulla.jpeg" },
  { id: "kheer", category: "desserts", name: "Rice kheer", price: 4.99, veg: true, spice: 0,
    desc: "Slow-cooked rice pudding with cardamom, saffron and pistachio.", image: "" },
  { id: "gajar-halwa", category: "desserts", name: "Gajar halwa", price: 5.99, veg: true, spice: 0,
    desc: "Warm carrot pudding cooked in milk and ghee with almonds. Seasonal.", image: "" },
  { id: "kulfi", category: "desserts", name: "Pistachio kulfi", price: 4.49, veg: true, spice: 0,
    desc: "Dense, creamy Indian ice cream on a stick.", image: "" },

  // ----- Drinks
  { id: "mango-lassi", category: "drinks", name: "Mango lassi", price: 3.99, veg: true, spice: 0,
    desc: "Alphonso mango blended with yogurt.",
    image: "images/mango.jpeg" },
  { id: "masala-chai", category: "drinks", name: "Masala chai", price: 2.99, veg: true, spice: 0,
    desc: "Black tea brewed with milk, cardamom, ginger and cinnamon.",
    image: "images/tea.jpeg" },
  { id: "sweet-lassi", category: "drinks", name: "Sweet or salted lassi", price: 3.49, veg: true, spice: 0,
    desc: "Chilled churned yogurt. Tell us sweet or salted in the notes.", image: "" },
  { id: "nimbu-pani", category: "drinks", name: "Nimbu pani", price: 2.99, veg: true, spice: 0,
    desc: "Fresh lime soda with black salt and roasted cumin.", image: "" },
  { id: "soft-drink", category: "drinks", name: "Canned soft drink", price: 1.99, veg: true, spice: 0,
    desc: "Coke, Diet Coke, Sprite or Thums Up.", image: "" }
];

// Fill in the default photo path for dishes without one
MENU.forEach((dish) => {
  if (!dish.image) dish.image = `images/dishes/${dish.id}.jpg`;
});

// Events repeat every week ("weekly", day 0-6) or happen once ("date": "YYYY-MM-DD").
const EVENTS = [
  { weekly: 2, title: "Thali Tuesday", text: "Full vegetarian thali for $15.99, dine-in and pickup." },
  { weekly: 5, title: "Family pack Friday", text: "Two mains, rice, four naan and dessert for $49." },
  { weekly: 0, title: "Chai & sweets afternoon", text: "Free masala chai with any dessert, 2–5 pm." },
  { date: "2026-10-20", title: "Diwali feast preview", text: "Taste our Diwali sweets box before it sells out." },
  { date: "2026-11-01", title: "Diwali sweets box", text: "Pre-order boxes of six handmade sweets for pickup." },
  { date: "2026-11-15", title: "Cooking class: perfect butter chicken", text: "Two-hour class with Chef Asha. Ask us to book a spot." }
];

// Photos for the gallery page.
const GALLERY = [
  { src: "images/butterchicken.jpeg", title: "Butter chicken" },
  { src: "images/paneer.jpeg", title: "Paneer tikka masala" },
  { src: "images/samosa.jpeg", title: "Samosa" },
  { src: "images/pakora.jpeg", title: "Vegetable pakora" },
  { src: "images/gobi.jpeg", title: "Aloo gobi" },
  { src: "images/bharta.jpeg", title: "Baingan bharta" },
  { src: "images/gulabjamun.jpeg", title: "Gulab jamun" },
  { src: "images/rasgulla.jpeg", title: "Rasgulla" },
  { src: "images/mango.jpeg", title: "Mango lassi" },
  { src: "images/tea.jpeg", title: "Masala chai" },
  { src: "images/interior.jpg", title: "Our dining room" },
  { src: "images/team.jpeg", title: "Our kitchen team" }
];
