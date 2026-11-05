# BUTTON_GUIDE.md - Every Interactive Element

For each control: **what it does**, **which function handles it**, **what the
visitor sees**, **whether it is tracked**, **which event**, and **how to
verify**. "Event" means what the site pushes to `window.dataLayer`; GA4
receives it only after the GTM setup in `ANALYTICS_GUIDE.md`.

Quick verification for every row: open the console (F12) with
`debugLogging: true` and look for `[Air Max analytics]` lines, or use
GTM Preview → event list → Data Layer tab, then GA4 DebugView.

---

## Header (all pages)

| Control | Handler (file) | Visitor sees | Tracked? Event | Verify |
|---|---|---|---|---|
| Logo | `handleNavigationClick` (navigation.js) | Home page | Yes: `navigation_clicked` {link_text "Logo", link_url "index.html", link_location "header"} | Click → one event before the page changes |
| Men | `handleNavigationClick` | Grid filtered to men, "Men" underlined | Yes: `navigation_clicked`; next page sends `view_item_list` (category_men) | Two events across the two pages |
| Women / Kids / Sale | same | Grid filtered accordingly | Yes: `navigation_clicked` then `view_item_list` | as above |
| Collections | `openCollectionsPanel` (navigation.js) | Panel listing 5 collections with style counts | Yes: `navigation_clicked` {link_text "Collections", link_url "#collections"} | One event per opening |
| A collection in the panel | `handleNavigationClick` | Grid for that collection | Yes: `navigation_clicked` {link_location "collections_panel"} then `view_item_list` (collection_…) | |
| Search icon | `openSearchPanel` (navigation.js) | Search panel, cursor in the box, "Popular" suggestions | No (opening only) | Nothing new in Preview |
| Search: typing | live preview in `initNavigation` | Results update while typing | **No** (never per keystroke) | Type: no new events |
| Search: Enter / Search / a "Popular" word | `handleSearchSubmit` | Result list or "No sneakers match" | Yes: `search` {search_term, result_count}; empty search sends nothing | One event per submit |
| Search result link | plain link | Product page | Not by itself; product page sends `view_item` | |
| Account icon | `openAccountPanel` (navigation.js) | Demo notice, "View bag", recently viewed | No | |
| Bag icon (count badge) | `openShoppingCart` (cart.js) | Bag drawer slides in | Yes: `view_cart` {currency, value, items} **only if the bag has items** | Test C |
| Menu (☰) | `openMenuPanel` (navigation.js) | Full-height menu with big links | No (opening); links inside send `navigation_clicked` {link_location "menu_panel"} | |
| Close (X), dark backdrop, Escape | `closePanel` (main.js) | Panel closes, focus returns to the opener | No | |

## Home hero (index.html)

| Control | Handler (file) | Visitor sees | Tracked? Event | Verify |
|---|---|---|---|---|
| Product card ×3 | `selectProduct(id, "card")` (products.js) | Sneaker slides/fades, name/price/counter update, card gets red marker, SHOP NOW link changes | Yes: `select_item` {selection_method "card", ecommerce.items[selected]}. Clicking the **already active** card sends nothing | Test A |
| ‹ / › round arrows | `showNextProduct(-1/+1)` (products.js) | Previous / next sneaker (wraps around) | Yes: `select_item` {selection_method "arrow"} | Test D |
| Dots | `selectProduct(id, "dot")` | Jumps to that sneaker | Yes: `select_item` {selection_method "dot"} | |
| Left/Right keys on a focused card | keydown listener in `initHero` | Next/previous sneaker, focus follows | Yes: `select_item` {selection_method "keyboard"} | |
| SHOP NOW ↗ | `handleShopNowClick` (products.js) | Product page of the selected sneaker | Yes: `shop_now_clicked` {item_id, item_name, button_location "hero"}; then `view_item` on the next page | Two events across two pages |
| Social icons | URLs from `fillFooter` (main.js) | Social site in a new tab | No custom event; GA4 Enhanced Measurement may log an outbound `click` | |
| Photo credit link | plain link | Unsplash photo page in a new tab | No custom event (same note as above) | |

Page load: one `view_item_list` {item_list_id "featured_sneakers", 3 items}.

## Product grid (products.html)

| Control | Handler | Visitor sees | Tracked? Event |
|---|---|---|---|
| Filter: All / Men / Women / Kids / Sale | `applyProductFilter` (products.js) | Grid, title and count change; address bar updates; header underline follows | Yes: `view_item_list` for the new list. Active filter clicked again: nothing |
| Product tile | grid listener in `initProductList` | Product page | Yes: `select_item` {selection_method "grid", list = current filter}; then `view_item` |
| Photographer links (credits line) | plain links | Unsplash pages | No |

Page load: one `view_item_list` for the list shown.

## Product page (products.html?id=…)

| Control | Handler | Visitor sees | Tracked? Event |
|---|---|---|---|
| ‹ All sneakers | `handleNavigationClick` | The grid | Yes: `navigation_clicked` {link_location "product_page"} |
| Colour swatch | `selectColor` | Photos, thumbnails, colour name, credit change; size kept | No (the colour is sent later in `item_variant`) |
| Photo thumbnail | `showGalleryPhoto` | Main photo changes | No |
| Size button | `selectSize` | Size turns black; size error clears. Sold-out sizes are struck through and disabled | Yes: `size_selected` {item_id, item_name, size, size_system "UK"}; same size again sends nothing |
| Quantity − / + | `changeDetailQuantity` | 1 … 10 | No (quantity goes into `add_to_cart`) |
| **Add to Bag** | `handleAddToBag` → `addProductToCart` (cart.js) | Badge, drawer and totals update; "Added N to your bag. View bag"; toast | Yes: `add_to_cart` {currency "INR", value price×qty, items[variant "Colour - UK size", quantity]} |
| Add to Bag **without a size** | `handleAddToBag` | Red "Please select a size.", red outline, focus on the first size | **No event** (Test E) |
| View bag | `openShoppingCart` | Bag drawer | Yes: `view_cart` |

Page load: one `view_item`. Unknown id: "Sneaker not found", no `view_item`.

## Bag (drawer on all pages, and cart.html)

| Control | Handler | Visitor sees | Tracked? Event |
|---|---|---|---|
| − on a line | `updateCartQuantity(key, -1)` | One pair fewer; at 1 the line is removed | Yes: `remove_from_cart` {quantity 1} (or the full line via Remove) |
| + on a line | `updateCartQuantity(key, +1)` | One pair more (disabled at 10) | Yes: `add_to_cart` {quantity 1} |
| Bin (Remove) | `removeProductFromCart` | Line disappears; toast "Removed from bag"; focus moves to the bag heading | Yes: `remove_from_cart` {quantity = whole line} |
| Product name / photo on a line | plain link | Product page | Not by itself; `view_item` there |
| Checkout | `startCheckout` | Demo checkout panel: summary + "No order was placed, nothing was charged" | Yes: `begin_checkout` {currency, value, items}. Never `purchase`. Empty bag: message, no event |
| View full bag | plain link to cart.html | Bag page | cart.html sends `view_cart` on load (if not empty) |
| Continue shopping (cart.html) | `handleNavigationClick` | The grid | Yes: `navigation_clicked` {link_location "cart_page"} |
| Back to the store (checkout) | `closePanel` | Panel closes, bag kept | No |

## Cookie banner (only with a real GTM ID and no saved choice)

| Control | Handler | Visitor sees | Tracked? |
|---|---|---|---|
| Accept | `handleConsentChoice("granted")` (analytics.js) | Banner closes | GTM loads now (page_view from the GA4 tag). No custom event |
| Decline | `handleConsentChoice("denied")` | Banner closes | Nothing is ever sent from this browser |
