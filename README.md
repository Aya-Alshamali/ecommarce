# Air Store - Nike Air Max-inspired demo shop

A responsive sneaker store built with plain **HTML5, CSS3 and vanilla
JavaScript**. No frameworks, no build step. It recreates the reference
design (oversized "NIKE AIR MAX" type, a floating sneaker, the giant grey
"AIR MAX" word and three product cards) in a normal horizontal layout, with
real photos and a working bag.

> **Educational prototype.** This is not an official Nike website and is not
> affiliated with or endorsed by Nike, Inc. No Nike logo is used: the header
> shows a neutral "Air Store" mark. Prices are placeholders from the reference
> image. Checkout is a demonstration and **no real purchase takes place**.

## 1. Run it locally

Double-clicking `index.html` works. A local server is better, because some
browsers limit `localStorage` (the bag) on `file://` pages:

```bash
cd ecommarce
python3 -m http.server 8090
```

Open <http://localhost:8090>. After editing a file, hard-refresh
(Cmd+Shift+R / Ctrl+F5) so the browser does not keep an old copy.

## 2. Project structure

```text
ecommarce/
├── index.html          Home: hero, 3 featured sneakers, arrows, dots, SHOP NOW
├── products.html       Product grid with filters  AND  product page (?id=...)
├── cart.html           Full bag page with summary and demo checkout
├── assets/
│   ├── css/
│   │   ├── style.css       All styling. Colours/fonts in SECTION 1.
│   │   └── responsive.css  Laptop (1200px), tablet (980px), phone (640px)
│   ├── js/
│   │   ├── config.js       ★ Products, photos, prices, IDs. Edit this first.
│   │   ├── analytics.js    GTM loader, consent, trackAnalyticsEvent(), trackEcommerceEvent()
│   │   ├── main.js         Shared helpers, panel open/close, toasts, footer
│   │   ├── navigation.js   Header links, menu, collections, search, account panels
│   │   ├── cart.js         Bag: add/remove/quantity, totals, drawer, demo checkout
│   │   └── products.js     Hero selector, product grid + filters, product page
│   └── images/logo.svg     Neutral store mark (also the browser-tab icon)
├── README.md           This file
├── WEBSITE_GUIDE.md    Every feature and every analytics event in two tables
├── BUTTON_GUIDE.md     Every button: handler, result, event, how to verify
└── ANALYTICS_GUIDE.md  GTM + GA4 setup, event reference, tests A-E, troubleshooting
```

Pages load `config.js` and `analytics.js` in `<head>`, then `main.js`,
`navigation.js`, `cart.js`, `products.js` at the end of `<body>`. Keep that
order. Each file starts with a comment explaining its purpose, components,
variables, dependencies, safe edits and where analytics is configured.

The shared panels (menu, collections, search, account, bag, checkout) are
written into each HTML page and hidden until opened.

## 3. Features

- Sticky header: Men / Women / Kids / Sale links (filter the grid), Collections panel, search, account (demo), bag with live count, hamburger menu.
- Hero: oversized title, tagline, "now showing" name and price, SHOP NOW linking to the selected sneaker.
- Three product cards, round arrows, pagination dots and Left/Right keys switch the sneaker without reloading; the photo slides and fades; the active card gets a red marker.
- Floating sneaker with a breathing shadow; respects `prefers-reduced-motion`.
- Product grid with All / Men / Women / Kids / Sale filters and collection pages (`?collection=air-max-1`). Sale items show the old price.
- Product page: photo gallery, colour swatches (Air Max 1 has three), UK sizes with sold-out sizes disabled, quantity, Add to Bag with size validation, description, photo credit.
- Bag drawer and bag page: + / - / remove, line totals, grand total, item count, saved in `localStorage` (only product id, colour, size and quantity), synced across open tabs.
- Demo checkout that clearly says nothing was bought, and keeps the bag.
- Search over names, colours, categories and collections with live results.
- Account panel (demo): bag shortcut and "recently viewed on this device".
- Cookie-consent banner that gates Google Tag Manager.
- Accessibility: skip link, labelled icon buttons, `aria-expanded`/`aria-pressed`, Escape closes panels and focus returns to the opener, visible focus rings, alt text, live regions for changes and toasts.

## 4. Photos

All product photos are real photographs from **Unsplash**, free to use under
the [Unsplash License](https://unsplash.com/license). They are loaded from
Unsplash's image CDN (`images.unsplash.com`), which Unsplash permits, so
nothing had to be downloaded. Photographers are credited on each product page,
under the hero, and in the "Photo credits" line on `products.html`:
Ryan Waring, Imani Bahati, USAMA AKRAM, David Chavez, Anthony A,
Luis Felipe Lins, Grailify, Nikita Kachanovsky, mojtaba mosayebzadeh,
Josh Marshall.

The photos are **illustrative**: a photo does not necessarily show the exact
model named in this demo catalogue. Unsplash had no free fully-red Air Max 270
on a light background, so the "270" uses a red knit runner on a red backdrop.
In the hero that backdrop reads as a red glow.

To use your own photos, put them in `assets/images/` and change the `url`
(and `alt`, `credit`) values in `config.js`. Best results in the hero come
from a shoe on a white or light-grey background, because the hero blends the
photo into the page with `mix-blend-mode: multiply`. For offline use you can
download the Unsplash files and point `url` at the local copies.

## 5. Customize

| I want to change… | File | Where |
|---|---|---|
| Prices, names, sizes, sold-out sizes, descriptions | `assets/js/config.js` | `PRODUCTS` |
| Photos and photo credits | `assets/js/config.js` | `colors` → `photos` |
| Which 3 sneakers are in the hero, and which shows first | `assets/js/config.js` | `FEATURED_PRODUCT_IDS`, `FEATURED_START_INDEX` |
| Collections list | `assets/js/config.js` | `COLLECTIONS` |
| GTM / GA4 IDs, debug logging, consent | `assets/js/config.js` | `STORE_CONFIG.analytics` |
| Social links, currency, max quantity, disclaimer | `assets/js/config.js` | `STORE_CONFIG` |
| Colours and fonts | `assets/css/style.css` | SECTION 1 |
| Hero headline, tagline, button text | `index.html` | `HERO` section |
| Header links | each HTML page | `HEADER` section |
| Filter buttons | `assets/js/products.js` | `FILTERS` |
| Logo | `assets/images/logo.svg` and the `LOGO` SVG in each page header | |

Adding a sneaker: copy one `{ ... }` block inside `PRODUCTS`, paste it after
the last one, keep the comma between blocks, give it a new `id`, and change
the values. It appears in the grid, search, filters and collections
automatically.

## 6. Analytics in one minute

1. Create a GTM container and a GA4 property.
2. Put your container ID in `config.js` (`gtmContainerId`).
3. In GTM: one Google tag (your `G-` ID) on All Pages, plus GA4 Event tags for
   the events in `ANALYTICS_GUIDE.md`, with **"Send Ecommerce data"** ticked for
   the shop events.
4. Uncomment the `<noscript>` block after `<body>` in each page and add the ID.
5. Test with GTM Preview and GA4 DebugView.

While `debugLogging` is `true`, every event is printed in the browser console
(F12), even before GTM is set up. Type `window.dataLayer` to see them all.

## 7. What is a demonstration

| Feature | State | To make it real |
|---|---|---|
| Checkout / payment | Demo panel. Sends `begin_checkout` only, never `purchase`. | A payment provider (Razorpay, Stripe, …) needs a server to create orders and verify payment. Send `purchase` only after the server confirms payment. |
| Account | Demo panel, no sign-in, no personal data | An authentication service and a backend |
| Stock / sold-out sizes | Fixed in `config.js` | An inventory API |
| Prices | Placeholders from the reference image | Real pricing source |
| Analytics | Inactive (placeholder IDs) | `ANALYTICS_GUIDE.md` |

## 8. Deploy to GitHub Pages

1. Create a GitHub repository and upload the **contents** of `ecommarce/` so `index.html` is at the root.
2. Repository → **Settings → Pages** → "Deploy from a branch" → `main` / `(root)` → Save.
3. After a minute the site is at `https://<username>.github.io/<repository>/`.
4. Any static host (Netlify, Vercel, Cloudflare Pages) works the same way: upload the folder as-is.

## 9. Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| Cards, grid or bag empty | Syntax error in `config.js` (missing comma/quote) | Open the console (F12); the first red error shows the line |
| Photos missing | Offline, or an Unsplash URL was mistyped | Check the `url` in `config.js` by opening it in a tab |
| Changes don't show | Browser cached the old file | Hard refresh (Cmd+Shift+R / Ctrl+F5) |
| Bag forgets items | Private browsing or blocked site data | Normal window; a message appears if saving fails |
| "Please select a size." | Add to Bag without a size | Pick a size first (by design) |
| No events in console | `debugLogging` is false | Set it to true in `config.js` |
| Consent banner never shows | Placeholder GTM ID, or a choice was saved | Set a real ID; clear site data to see it again |

## 10. Testing status

Tested in Chromium at 1440×900, 768×1024 (tablet) and 375×812 (phone) on a
local server. No console errors on any page and no horizontal overflow on
phones. The tests below all passed, with the exact dataLayer contents checked:

- hero card, arrow, dot and keyboard selection
- the race when switching very fast
- size validation (Test E)
- add to bag (Test B) and bag opening (Test C)
- + / - / remove and checkout, with no `purchase` event
- the bag page, filters, collections, colour swatches, search, all panels with Escape and focus return
- an unknown product id

**Not verified:** delivery to real GTM/GA4 (no real IDs), Safari and
Firefox, a real touch device, screen-reader output, and the reduced-motion
setting (its CSS rule and JS check are in place but were not toggled in a
browser).
