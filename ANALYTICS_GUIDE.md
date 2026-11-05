# ANALYTICS_GUIDE.md - GTM and GA4 for the Air Store

Written for someone setting up analytics for the first time. Everything
below describes **expected** behaviour. None of it is a measured GA4 result.

## 1. How tracking flows

```
Visitor clicks "Add to Bag"
 → handleAddToBag() → addProductToCart()                    products.js / cart.js
 → trackEcommerceEvent("add_to_cart", { currency, value, items })   analytics.js
 → dataLayer.push({ ecommerce: null })                      (clears the old data)
 → dataLayer.push({ event: "add_to_cart", ecommerce: {...} })
 → GTM Custom Event trigger "add_to_cart" fires a GA4 Event tag
 → GA4 receives add_to_cart with its items
```

- **One container, one GA4.** GA4 is configured inside GTM; the site never loads `gtag.js`.
- **Inactive by default.** With `GTM-XXXXXXX` in `config.js`, GTM never loads. Events are still pushed and printed in the console, so you can learn without an account.
- **Consent first.** With a real ID, a cookie banner appears; GTM loads only after Accept.
- **No personal data.** Events contain product data only. There are no names, emails, addresses or payment details anywhere in the site.
- **No purchase.** `purchase` is never sent, because no real payment happens.

## 2. Install GTM

1. <https://tagmanager.google.com> → Create account → container type **Web** → copy the ID (`GTM-AB12CD3`).
2. `assets/js/config.js` → `gtmContainerId: "GTM-AB12CD3"`.
3. In each HTML page, find **GTM NOSCRIPT SECTION** after `<body>`, replace `GTM-XXXXXXX`, and remove the comment markers around `<noscript>`.
4. You do **not** paste Google's `<script>` snippet: `analytics.js` → `loadGoogleTagManager()` already contains it and adds the consent check.

## 3. Configure GA4 inside GTM

1. GA4: <https://analytics.google.com> → Admin → Create property → Web stream → copy the **Measurement ID** (`G-…`). Optionally note it in `config.js` (`ga4MeasurementId`), which is for reference only.
2. GTM → Tags → New → **Google tag** → Tag ID = `G-…` → Trigger **Initialization - All Pages**. This sends `page_view`.
3. **Data Layer Variables** (Variables → New → Data Layer Variable), one per custom parameter:
   `selection_method`, `search_term`, `result_count`, `link_text`, `link_url`, `link_location`, `item_id`, `item_name`, `size`, `size_system`, `button_location`.
   E-commerce parameters (`items`, `value`, `currency`, list ids) do **not** need variables; see step 5.
4. **Triggers** (Triggers → New → Custom Event), one per event name in section 4, spelled exactly.
   Shortcut for the seven shop events: one trigger, Event name `view_item_list|select_item|view_item|add_to_cart|remove_from_cart|view_cart|begin_checkout`, "Use regex matching" ticked.
5. **GA4 Event tags**:
   - Shop events: Event Name `{{Event}}` (built-in variable), **More Settings → Ecommerce → Send Ecommerce data → Data source: Data Layer**. Add an Event Parameter `selection_method` = `{{selection_method}}`. Trigger: the shop trigger.
   - Each other event (`search`, `navigation_clicked`, `size_selected`, `shop_now_clicked`): Event Name = the event, parameters mapped to the variables from step 3, trigger = its Custom Event trigger.
6. **Submit → Publish.**
7. GA4 → Admin → Events → mark `add_to_cart` and `begin_checkout` as **key events** if you want them as conversions.
8. GA4 → Admin → Custom definitions → register `selection_method`, `link_location`, `size`, `search_term`, etc. as event-scoped custom dimensions to use them in reports.

## 4. Event reference

### Shop events (GA4 recommended e-commerce events)

All use `{ event, ecommerce: { … } }`. Every item has `item_id`, `item_name`,
`item_brand` "Nike", `item_category` "Footwear", `item_category2`
(men/women/kids), `price`, `quantity`; sale items add `discount`; list items
add `index`, `item_list_id`, `item_list_name`; bag items add `item_variant`
("White / Wolf Grey - UK 5").

| Event | Fires when | `ecommerce` contents | Extra |
|---|---|---|---|
| `view_item_list` | Home loads (featured list); grid loads; filter changes the list | `item_list_id` (`featured_sneakers`, `category_men`, `collection_air-max-1`, …), `item_list_name`, `items[all shown]` | — |
| `select_item` | Hero card/arrow/dot/keyboard selects a **different** sneaker; grid tile clicked | `item_list_id`, `item_list_name`, `items[selected]` | `selection_method`: card / arrow / dot / keyboard / grid |
| `view_item` | Product page loads | `currency`, `value` = price, `items[product, first colour]` | — |
| `add_to_cart` | Add to Bag succeeds; bag "+" | `currency`, `value` = price × qty **added**, `items[line, quantity added]` | — |
| `remove_from_cart` | Bag "−" (qty 1) or Remove (whole line) | `currency`, `value` = price × qty removed, `items[…]` | — |
| `view_cart` | Bag drawer opened / cart.html loaded, **bag not empty** | `currency`, `value` = bag total, `items[every line]` | — |
| `begin_checkout` | Checkout clicked, bag not empty | `currency`, `value` = bag total, `items[every line]` | — |

### Other events

| Event | Fires when | Parameters |
|---|---|---|
| `search` | Search submitted, non-empty | `search_term` (lower-case, ≤100 chars), `result_count` |
| `navigation_clicked` | Header/menu/collections/footer/back links; Collections button | `link_text`, `link_url`, `link_location` (header, menu_panel, collections_panel, product_page, cart_page) |
| `size_selected` | A **different** available size clicked | `item_id`, `item_name`, `size`, `size_system` "UK" |
| `shop_now_clicked` | SHOP NOW clicked | `item_id`, `item_name`, `button_location` "hero" |

## 5. Expected analytics results per action

| Action | Website result | Events pushed | page_view | Engagement (expected, not guaranteed) |
|---|---|---|---|---|
| Open home page (after consent) | Hero, Excee shown | `view_item_list` | +1 (Google tag) | Session starts; engaged after 10 s, 2 pages or a key event |
| Click another hero card | Sneaker changes | `select_item` (card) | 0 | Time on page grows naturally |
| Click the active card | Nothing changes | none | 0 | — |
| Click › arrow | Next sneaker | `select_item` (arrow) | 0 | — |
| Click SHOP NOW | Product page | `shop_now_clicked`, then `view_item` | +1 | 2nd page view → engaged session |
| Click "Men" | Men grid | `navigation_clicked`, then `view_item_list` | +1 | as above |
| Click "Sale" filter chip | Grid changes in place | `view_item_list` | 0 | — |
| Add to Bag without size | Error shown | **none** | 0 | — |
| Pick size 8 | Size selected | `size_selected` | 0 | — |
| Add to Bag (qty 2) | Badge +2 | `add_to_cart` (qty 2, value 2×price) | 0 | Engaged if add_to_cart is a key event |
| Open bag | Drawer | `view_cart` | 0 | — |
| Open empty bag | Drawer with "empty" | none | 0 | — |
| Bag "+" / "−" | Qty ±1 | `add_to_cart` / `remove_from_cart` (qty 1) | 0 | — |
| Remove line | Line gone | `remove_from_cart` (full qty) | 0 | — |
| Checkout | Demo panel | `begin_checkout` | 0 | Funnel shows checkout start, **no purchase** |
| Search "red" + Enter | 4 results | `search` | 0 | — |
| Open menu / search / account, close panels, swatches, thumbnails | UI only | none | 0 | — |

## 6. Practical tests

Run each with **GTM Preview** connected (and/or the console open).

**Test A: Product selection.** Click the Air Max 270 card once.
Expected: exactly one `select_item`; `selection_method` "card";
`ecommerce.items[0].item_id` "air-max-270", `price` 12995, `index` 0.

**Test B: Add to cart.** On a product page choose size 8, click Add to Bag.
Expected: one `add_to_cart`, `currency` "INR", `value` = price,
`items[0].quantity` 1, `item_variant` "… - UK 8".

**Test C: Open shopping cart.** With one item in the bag, click the bag icon.
Expected: one `view_cart` with the current lines and `value` = bag total.

**Test D: Switch products with the arrow.** Click › once.
Expected: the sneaker changes and **one** `select_item` with
`selection_method` "arrow". Decision: every intentional product change sends
`select_item`, whatever control was used, and `selection_method` records which
one. The first sneaker shown at page load is not a selection and sends
nothing. The slide animation never sends anything.

**Test E: Invalid cart action.** Click Add to Bag without choosing a size.
Expected: "Please select a size." and **no** `add_to_cart`.

**Test F: No purchase.** Click Checkout. Expected: `begin_checkout`, and no
`purchase` anywhere in `window.dataLayer`.

## 7. GTM Preview step by step

1. GTM → **Preview** → enter `http://localhost:8090` (or your live URL) → Connect.
2. In the site tab, Accept the cookie banner.
3. Perform the action. In Tag Assistant the left column lists events in order.
4. Click the event → **Tags**: your GA4 tag should be under "Fired".
   **Data Layer**: shows the `ecommerce` object / parameters.
5. Not fired? The trigger name must match exactly (case and underscores).
   Event missing? Check the console line; if it is there, Preview is not connected to that tab.

## 8. GA4 DebugView step by step

1. GA4 → Admin → **DebugView** (Preview mode turns debug mode on automatically).
2. Events appear within seconds. Click one to inspect parameters and **items**.
3. Items missing? The GA4 Event tag lacks "Send Ecommerce data".
4. Standard and e-commerce reports update after 24–48 h. Realtime shows events within a minute.

## 9. Common errors

| Symptom | Cause | Fix |
|---|---|---|
| "GTM not loaded: replace GTM-XXXXXXX" in console | Placeholder ID | Set the real ID |
| "waiting for consent" | Banner not accepted / Decline saved | Accept; reset with `localStorage.removeItem("airmax_analytics_consent")` |
| No `gtm.js` request in Network tab | Ad blocker or wrong ID | Disable blocker for testing; check ID |
| Event in Preview but not in GA4 | Container not published, wrong `G-` ID | Publish; check the tag |
| `items` empty in GA4 | "Send Ecommerce data" off | Turn it on in the GA4 Event tag |
| Old item appears in a new event | `ecommerce` not cleared | Already handled: the site pushes `{ ecommerce: null }` first. Don't remove it |
| Revenue / purchases appear | Someone added a purchase tag | Remove it; this demo must never send `purchase` |
| `page_view` doubled | Extra gtag.js snippet added to HTML | Remove it; keep GA4 only in GTM |

## 10. Duplicate events: prevention and troubleshooting

- Each event is sent from **one** place: search the JS files for `trackEcommerceEvent(` and `trackAnalyticsEvent(` to list them all.
- Buttons use single, page-level listeners, so adding cards or bag lines never multiplies listeners.
- Re-clicking the active hero card, the active size or the active filter sends nothing.
- Search sends on submit only, never while typing.
- Animations (slide, float, drawer) never send events.
- `view_cart` is not sent for an empty bag.
- `loadGoogleTagManager()` refuses to load the container twice.
- In GTM, avoid generic **All Clicks / All Links / Form Submission** triggers that also send GA4 events for these same controls.
- GA4 Enhanced Measurement "Outbound clicks" logs social and Unsplash links as `click`. That is a different event name, not a duplicate. "Site search" only reads `?q=` URLs, which this site never uses.
- Seeing two of the same event for one click? Open GTM Preview, click the event, and check **Tags fired**. Two GA4 tags firing means two triggers match it.

## 11. GA4 metrics in plain language

- **Event count**: how many times an event was received. One real action = one event here.
- **Page views**: one per page load (from the Google tag). Panels, filters and hero selections are not page loads and add none.
- **Engagement time**: time the page was visible and in focus, measured by GA4 itself. Clicking does not add time; staying does.
- **Engaged session**: lasted 10+ s, **or** had 2+ page views, **or** had a key event.
- **Engagement rate**: engaged sessions ÷ sessions. A shop event changes it only if it is a key event, or indirectly because the visitor stays longer or opens another page.
- **Why GA4 shows less than reality**: declined consent, ad blockers, processing delay, data thresholds.
