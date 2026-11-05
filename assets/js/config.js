/**
 * ============================================================
 * FILE: assets/js/config.js
 * ============================================================
 *
 * 1. WHAT THIS FILE IS USED FOR
 *    All settings and all product data for the Air Max store.
 *    If you want to change a price, a photo, a product name, the
 *    analytics IDs or the social links, this is the file to edit.
 *
 * 2. MAIN COMPONENTS
 *    - STORE_CONFIG:   store name, currency, analytics IDs, social links.
 *    - PRODUCTS:       every sneaker (name, price, sizes, colors, photos).
 *    - FEATURED_PRODUCT_IDS: the three sneakers shown in the home hero.
 *    - COLLECTIONS:    the list shown when "Collections" is clicked.
 *
 * 3. DEPENDENCIES
 *    None. This file must load FIRST on every page (it is the first
 *    <script> in <head>). All other JavaScript files read from it.
 *
 * 4. SAFE CUSTOMIZATION AREAS
 *    Everything below is safe to edit. Keep the names on the LEFT of
 *    each colon unchanged, change only the values on the RIGHT, and
 *    keep every comma, quote and bracket.
 *
 * 5. ANALYTICS CONFIGURATION LOCATION
 *    STORE_CONFIG.analytics (directly below). GA4 is configured inside
 *    Google Tag Manager, so only the GTM ID is used by the code.
 *    See ANALYTICS_GUIDE.md.
 *
 * ABOUT THE PHOTOS
 *    All photos are real photographs from Unsplash (https://unsplash.com),
 *    free to use under the Unsplash License. Each photo records its
 *    photographer for credit. They are illustrative: a photo does not
 *    necessarily show the exact model named in this demo catalogue.
 *
 * ABOUT PRICES
 *    Prices are placeholder values copied from the reference design,
 *    not verified retail prices.
 *
 * Expected Analytics Effect: None. This file only stores data.
 * The product fields id, name, category and price are, however,
 * what GA4 will receive inside the "items" array of e-commerce events.
 * ============================================================
 */

// ==========================================
// GA4 AND GTM EVENT TRACKING SECTION
// ==========================================
// Purpose: this file holds the IDs only. Tracking functions live in
// assets/js/analytics.js. Replace the placeholders below to activate.

window.STORE_CONFIG = {
  storeName: "Air Store",
  // Shown in the footer and the account panel. Keep it: this is an
  // educational prototype and is not affiliated with Nike, Inc.
  disclaimer: "Educational prototype. Not affiliated with, or endorsed by, Nike, Inc.",

  // Currency used for prices and for GA4 e-commerce events (ISO 4217 code).
  currency: "INR",
  currencyLocale: "en-IN",

  analytics: {
    // Your Google Tag Manager container ID. While it still contains
    // "XXXXXXX", analytics stays INACTIVE (nothing loads from Google).
    gtmContainerId: "GTM-XXXXXXX",
    // Reference only: enter this ID inside the GA4 tag in GTM.
    ga4MeasurementId: "G-XXXXXXXXXX",
    // true = print every analytics push in the browser console (F12).
    debugLogging: true,
    // true = show a cookie banner and load GTM only after "Accept".
    requireConsent: true
  },

  // Footer social icons. Replace with the store's own profile pages.
  socialLinks: {
    instagram: "https://www.instagram.com/",
    youtube: "https://www.youtube.com/",
    facebook: "https://www.facebook.com/",
    x: "https://x.com/"
  },

  // How many items of one product+size+color can be in the bag.
  maxQuantityPerLine: 10,

  // Leave empty: checkout is a DEMONSTRATION and no payment is taken.
  // A real payment provider (Razorpay, Stripe, ...) needs a server.
  checkoutEndpoint: ""
};

/* ------------------------------------------------------------
 * PRODUCTS
 * Each product:
 *   id            short unique name used in links and analytics
 *   name          shown everywhere
 *   category      "men", "women" or "kids" (used by the nav filters)
 *   collection    id from COLLECTIONS below
 *   price         current price in rupees (number, no commas)
 *   originalPrice set ONLY for sale items (the old price)
 *   tagline       one short line
 *   description   paragraph on the product page
 *   sizes         UK sizes offered
 *   soldOutSizes  sizes shown but not selectable
 *   colors        one entry per colorway; each has its own photos
 * Photo object: { url, alt, credit, creditUrl }
 * ------------------------------------------------------------ */
var UNSPLASH = "https://images.unsplash.com/";
var PHOTO_OPTIONS = "?auto=format&fit=crop&w=1400&q=80";

window.PRODUCTS = [
  {
    id: "air-max-270",
    name: "Nike Air Max 270",
    category: "men",
    collection: "air-max-270",
    price: 12995,
    tagline: "Big Air, all-day comfort.",
    description: "A lightweight knit upper and a tall Air unit under the heel give a soft, bouncy ride that works from morning commute to late-night plans. Placeholder description for this demo store.",
    sizes: ["6", "7", "8", "9", "10", "11", "12"],
    soldOutSizes: ["12"],
    colors: [
      {
        name: "University Red",
        hex: "#C8102E",
        photos: [
          { url: UNSPLASH + "photo-1542291026-7eec264c27ff" + PHOTO_OPTIONS, alt: "Red knit running sneaker with a white swoosh, side view", credit: "Ryan Waring", creditUrl: "https://unsplash.com/photos/164_6wVEHfI" }
        ]
      }
    ]
  },
  {
    id: "air-max-alpha",
    name: "Nike Air Max Alpha",
    category: "men",
    collection: "everyday-air",
    price: 8995,
    tagline: "Train hard. Land soft.",
    description: "Built for gym days with a stable base, durable overlays and visible Air cushioning in the heel. Placeholder description for this demo store.",
    sizes: ["6", "7", "8", "9", "10", "11"],
    soldOutSizes: ["6"],
    colors: [
      {
        name: "Black / Anthracite",
        hex: "#1b1b1b",
        photos: [
          { url: UNSPLASH + "photo-1491553895911-0055eca6402d" + PHOTO_OPTIONS, alt: "Dark grey running shoe floating against a white background", credit: "Imani Bahati", creditUrl: "https://unsplash.com/photos/LxVxPA1LOVM" },
          { url: UNSPLASH + "photo-1605408499391-6368c628ef42" + PHOTO_OPTIONS, alt: "Black and white training shoe on a pink background", credit: "USAMA AKRAM", creditUrl: "https://unsplash.com/photos/g3CMh2nqj_w" }
        ]
      }
    ]
  },
  {
    id: "air-max-excee",
    name: "Nike Air Max Excee",
    category: "women",
    collection: "air-max-90",
    price: 9995,
    tagline: "Classic lines, stretched for today.",
    description: "Inspired by the Air Max 90, with elongated lines and a clean leather-look upper. Placeholder description for this demo store.",
    sizes: ["3", "4", "5", "6", "7", "8", "9"],
    soldOutSizes: [],
    colors: [
      {
        name: "White / Black",
        hex: "#f5f5f5",
        photos: [
          { url: UNSPLASH + "photo-1634316427452-3eac60a2803d" + PHOTO_OPTIONS, alt: "White low-top sneaker with a black swoosh, side view on a light grey background", credit: "David Chavez", creditUrl: "https://unsplash.com/photos/-GT7jvdO9-s" },
          { url: UNSPLASH + "photo-1641687589434-a86e8de59855" + PHOTO_OPTIONS, alt: "White sneaker with black details photographed from above on grey", credit: "Anthony A", creditUrl: "https://unsplash.com/photos/JldH_vLwdYs" }
        ]
      }
    ]
  },
  {
    id: "air-max-1",
    name: "Nike Air Max 1",
    category: "men",
    collection: "air-max-1",
    price: 13995,
    tagline: "The original visible Air.",
    description: "The 1987 icon that put Air on display. Mesh and suede upper, waffle-inspired outsole and that famous window in the heel. Placeholder description for this demo store.",
    sizes: ["6", "7", "8", "9", "10", "11", "12"],
    soldOutSizes: ["7"],
    colors: [
      {
        name: "White / Sport Red",
        hex: "#e2402f",
        photos: [
          { url: UNSPLASH + "photo-1600185365483-26d7a4cc7519" + PHOTO_OPTIONS, alt: "White sneaker with red details floating on a grey background", credit: "Luis Felipe Lins", creditUrl: "https://unsplash.com/photos/J2-wAQDckus" }
        ]
      },
      {
        name: "White / Total Orange",
        hex: "#f3772f",
        photos: [
          { url: UNSPLASH + "photo-1600185365926-3a2ce3cdb9eb" + PHOTO_OPTIONS, alt: "White and orange sneaker floating on a light grey background", credit: "Luis Felipe Lins", creditUrl: "https://unsplash.com/photos/LG88A2XgIXY" }
        ]
      },
      {
        name: "White / Black / Red",
        hex: "#2a2a2a",
        photos: [
          { url: UNSPLASH + "photo-1600185365778-7875a359b924" + PHOTO_OPTIONS, alt: "White, red and black sneaker floating on a grey background", credit: "Luis Felipe Lins", creditUrl: "https://unsplash.com/photos/S6Cp3uN39_M" }
        ]
      }
    ]
  },
  {
    id: "air-max-90",
    name: "Nike Air Max 90",
    category: "women",
    collection: "air-max-90",
    price: 9745,
    originalPrice: 12995,
    tagline: "Waffle sole. Bold lines. Since 1990.",
    description: "Stitched overlays, a waffle outsole and Max Air cushioning, now in a soft grey colourway. On sale in this demo store.",
    sizes: ["3", "4", "5", "6", "7", "8"],
    soldOutSizes: ["3"],
    colors: [
      {
        name: "White / Wolf Grey",
        hex: "#c8c8c8",
        photos: [
          { url: UNSPLASH + "photo-1580902215262-9b941bc6eab3" + PHOTO_OPTIONS, alt: "White and grey sneakers photographed close up", credit: "Grailify", creditUrl: "https://unsplash.com/photos/Knvzr3Fiqzc" },
          { url: UNSPLASH + "photo-1580902215301-725c23d291f9" + PHOTO_OPTIONS, alt: "Pair of grey and white sneakers", credit: "Grailify", creditUrl: "https://unsplash.com/photos/pgpVtQu3l9c" }
        ]
      }
    ]
  },
  {
    id: "air-max-95",
    name: "Nike Air Max 95",
    category: "men",
    collection: "air-max-95",
    price: 16995,
    tagline: "Layered like the human body.",
    description: "Graduated side panels inspired by muscle fibres and visible Air in the heel and forefoot. Placeholder description for this demo store.",
    sizes: ["7", "8", "9", "10", "11"],
    soldOutSizes: [],
    colors: [
      {
        name: "Black / White",
        hex: "#111111",
        photos: [
          { url: UNSPLASH + "photo-1550399865-ec7d23b18e8e" + PHOTO_OPTIONS, alt: "Dark teal and black layered sneaker on a white background", credit: "Nikita Kachanovsky", creditUrl: "https://unsplash.com/photos/ad_0wMHtvlU" }
        ]
      }
    ]
  },
  {
    id: "air-max-plus",
    name: "Nike Air Max Plus",
    category: "men",
    collection: "everyday-air",
    price: 13595,
    originalPrice: 16995,
    tagline: "Tuned Air, loud attitude.",
    description: "A wavy upper, plastic support ribs and Tuned Air units for a ride that stands out. On sale in this demo store.",
    sizes: ["7", "8", "9", "10", "11", "12"],
    soldOutSizes: ["9"],
    colors: [
      {
        name: "White / Black / Red",
        hex: "#b11f2b",
        photos: [
          { url: UNSPLASH + "photo-1662411198835-c5a151d2af9e" + PHOTO_OPTIONS, alt: "White sneaker with black and red panels floating on white", credit: "mojtaba mosayebzadeh", creditUrl: "https://unsplash.com/photos/WtHNuoYQLgs" }
        ]
      }
    ]
  },
  {
    id: "air-max-systm-kids",
    name: "Nike Air Max SYSTM (Older Kids')",
    category: "kids",
    collection: "everyday-air",
    price: 5495,
    tagline: "School-day comfort.",
    description: "Easy, durable and cushioned with Air for long days of running around. Placeholder description for this demo store.",
    sizes: ["3.5Y", "4Y", "4.5Y", "5Y", "5.5Y", "6Y"],
    soldOutSizes: [],
    colors: [
      {
        name: "Black / White",
        hex: "#2a2a2a",
        photos: [
          { url: UNSPLASH + "photo-1559050993-d4e4fbf11769" + PHOTO_OPTIONS, alt: "Black and white photo of a high-top sneaker on a dark background", credit: "Josh Marshall", creditUrl: "https://unsplash.com/photos/PcI3V1VbbrU" }
        ]
      }
    ]
  },
  {
    id: "air-max-bolt-kids",
    name: "Nike Air Max Bolt (Younger Kids')",
    category: "kids",
    collection: "everyday-air",
    price: 3995,
    originalPrice: 4995,
    tagline: "Quick on, quick off.",
    description: "A stretchy collar and grippy rubber outsole for little feet on the move. On sale in this demo store.",
    sizes: ["10C", "11C", "12C", "13C", "1Y", "2Y"],
    soldOutSizes: ["13C"],
    colors: [
      {
        name: "Black / White",
        hex: "#111111",
        photos: [
          { url: UNSPLASH + "photo-1605348532760-6753d2c43329" + PHOTO_OPTIONS, alt: "Black and white sneaker on a light blue background", credit: "USAMA AKRAM", creditUrl: "https://unsplash.com/photos/s-gYAbQToXk" }
        ]
      }
    ]
  }
];

// The three sneakers in the home page hero, in display order.
// The LAST one is shown first, matching the reference design.
window.FEATURED_PRODUCT_IDS = ["air-max-270", "air-max-alpha", "air-max-excee"];
window.FEATURED_START_INDEX = 2;

// Name used for the featured list in GA4 (item_list_name).
window.FEATURED_LIST = { id: "featured_sneakers", name: "Featured Sneakers" };

// Shown in the Collections panel. "id" must match product.collection.
window.COLLECTIONS = [
  { id: "air-max-1", name: "Air Max 1", text: "The original, since 1987." },
  { id: "air-max-90", name: "Air Max 90", text: "Waffle soles and bold lines." },
  { id: "air-max-95", name: "Air Max 95", text: "Layered, loud, legendary." },
  { id: "air-max-270", name: "Air Max 270", text: "The biggest heel Air unit." },
  { id: "everyday-air", name: "Everyday Air", text: "Comfort for every day, every age." }
];
