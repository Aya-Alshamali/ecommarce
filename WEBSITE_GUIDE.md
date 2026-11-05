# WEBSITE_GUIDE.md - Features, Buttons and Events

Plain-language map of the Air Store. Update both tables whenever a button,
feature or event is added, changed or removed. Details per button are in
`BUTTON_GUIDE.md`; GTM/GA4 setup is in `ANALYTICS_GUIDE.md`.

## 1. Buttons and features

| Button / Feature | What it does | Where its code is located |
|---|---|---|
| Logo | Goes to the home page | header in each HTML page; `navigation.js` → `handleNavigationClick()` |
| Men / Women / Kids / Sale | Open the grid filtered to that group | header; `navigation.js` → `handleNavigationClick()`; filtering in `products.js` |
| Collections | Opens the collections panel | `navigation.js` → `openCollectionsPanel()` |
| Search icon | Opens search; live results; Enter searches | `navigation.js` → `openSearchPanel()`, `handleSearchSubmit()` |
| Account icon | Opens the demo account panel | `navigation.js` → `openAccountPanel()` |
| Bag icon (with count) | Opens the bag drawer | `cart.js` → `openShoppingCart()` |
| Menu (☰) | Opens the navigation panel | `navigation.js` → `openMenuPanel()` |
| Product cards (hero) | Change the featured sneaker | `products.js` → `selectProduct()` |
| Left / right arrows (hero) | Previous / next sneaker | `products.js` → `showNextProduct()` |
| Dots (hero) | Jump to a sneaker | `products.js` → `selectProduct()` |
| SHOP NOW | Opens the selected sneaker's page | `products.js` → `handleShopNowClick()` |
| Filter buttons (grid) | Change the grid without reloading | `products.js` → `applyProductFilter()` |
| Product tile (grid) | Opens the product page | `products.js` → grid listener in `initProductList()` |
| Colour swatch | Shows that colourway's photos | `products.js` → `selectColor()` |
| Photo thumbnail | Shows another photo | `products.js` → `showGalleryPhoto()` |
| Size button | Chooses a size | `products.js` → `selectSize()` |
| Quantity - / + (product page) | Changes how many to add | `products.js` → `changeDetailQuantity()` |
| Add to Bag | Adds the sneaker (needs a size) | `products.js` → `handleAddToBag()` → `cart.js` → `addProductToCart()` |
| View bag | Opens the bag drawer | `cart.js` → `openShoppingCart()` |
| Bag line - / + | One pair fewer / more | `cart.js` → `updateCartQuantity()` |
| Bag line bin | Removes the line | `cart.js` → `removeProductFromCart()` |
| Checkout | Opens the demo checkout | `cart.js` → `startCheckout()` |
| Close (X), backdrop, Escape | Close any panel | `main.js` → `closePanel()`, `initPanels()` |
| Social icons | Open social sites in a new tab | HTML; URLs set by `main.js` → `fillFooter()` |
| Cookie Accept / Decline | Allow / refuse analytics | `analytics.js` → `handleConsentChoice()` |

## 2. Analytics events

All events are pushed to `window.dataLayer` by `analytics.js`. GA4 receives
them only after the GTM setup in `ANALYTICS_GUIDE.md`. No personal data is
ever sent.

| Event | Trigger | Parameters | Sent from |
|---|---|---|---|
| `view_item_list` | Home page loads; grid loads; a filter changes the list | `ecommerce`: `item_list_id`, `item_list_name`, `items[]` | `products.js` |
| `select_item` | Hero card / arrow / dot / keyboard changes the sneaker; grid tile clicked | `selection_method`; `ecommerce`: `item_list_id`, `item_list_name`, `items[1]` | `products.js` |
| `view_item` | Product page loads | `ecommerce`: `currency`, `value`, `items[1]` | `products.js` |
| `size_selected` | A different size is clicked | `item_id`, `item_name`, `size`, `size_system` | `products.js` |
| `shop_now_clicked` | SHOP NOW clicked | `item_id`, `item_name`, `button_location` | `products.js` |
| `add_to_cart` | Add to Bag succeeds; bag "+" | `ecommerce`: `currency`, `value`, `items[1]` with `item_variant` | `cart.js` |
| `remove_from_cart` | Bag "-" or bin | `ecommerce`: `currency`, `value`, `items[1]` | `cart.js` |
| `view_cart` | Bag drawer opened with items; `cart.html` loaded with items | `ecommerce`: `currency`, `value`, `items[]` | `cart.js` |
| `begin_checkout` | Checkout clicked with items | `ecommerce`: `currency`, `value`, `items[]` | `cart.js` |
| `search` | Search submitted (non-empty) | `search_term`, `result_count` | `navigation.js` |
| `navigation_clicked` | Header, menu, collections, footer and back links; Collections button | `link_text`, `link_url`, `link_location` | `navigation.js` |

`purchase` is deliberately **never** sent: there is no real payment.

Not tracked on purpose: opening menu/search/account panels, typing in
search, closing panels, colour swatches, thumbnails, product-page quantity
buttons, validation errors, animations, consent choice.

## 3. Where to configure analytics

- IDs, consent, debug logging: `assets/js/config.js` → `STORE_CONFIG.analytics`.
- GTM loader: `assets/js/analytics.js` → `loadGoogleTagManager()`.
- GTM noscript: commented block right after `<body>` in every HTML page.
