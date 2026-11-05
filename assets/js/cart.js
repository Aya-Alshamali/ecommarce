/**
 * ============================================================
 * FILE: assets/js/cart.js
 * ============================================================
 *
 * 1. WHAT THIS FILE IS USED FOR
 *    The shopping bag: adding, removing and changing quantities,
 *    totals, the item-count badge, the slide-in bag drawer, the full
 *    bag page (cart.html) and the DEMONSTRATION checkout.
 *
 * 2. MAIN COMPONENTS
 *    - Storage:   loadCart(), saveCart()  (browser localStorage)
 *    - Actions:   addProductToCart(), removeProductFromCart(),
 *                 updateCartQuantity()
 *    - Display:   renderCart(), updateCartBadge()
 *    - Panels:    openShoppingCart(), startCheckout()
 *
 * 3. IMPORTANT VARIABLES
 *    - CART_STORAGE_KEY: name under which the bag is saved.
 *    - cartLines: the bag in memory. Each line looks like
 *        { productId: "air-max-90", colorIndex: 0, size: "7", quantity: 1 }
 *      Prices are NOT stored; they are always read fresh from config.js,
 *      so an edited price can never be "stuck" in a visitor's bag.
 *      Only these non-sensitive fields are saved. No personal data.
 *
 * 4. DEPENDENCIES
 *    config.js, analytics.js, main.js (formatPrice, openPanel, showToast,
 *    getProductById, escapeHtml, resizeImageUrl, getIconSvg).
 *
 * 5. SAFE CUSTOMIZATION AREAS
 *    - Message texts in CART_MESSAGES.
 *    - Maximum quantity: config.js -> maxQuantityPerLine.
 *
 * 6. ANALYTICS CONFIGURATION LOCATION
 *    IDs: config.js. Events sent from here (all GA4 e-commerce):
 *    add_to_cart, remove_from_cart, view_cart, begin_checkout.
 *    "purchase" is NEVER sent: there is no real payment.
 * ============================================================
 */

// ==========================================
// GA4 AND GTM EVENT TRACKING SECTION
// ==========================================
// Purpose: every bag change is reported with trackEcommerceEvent() from
// analytics.js. Quantity rule (Google's recommendation):
//   + button  -> add_to_cart       with quantity 1
//   - button  -> remove_from_cart  with quantity 1
//   Remove    -> remove_from_cart  with the whole line quantity
// So in GA4: items added - items removed = items left in bags.

var CART_STORAGE_KEY = "airmax_bag";
var cartLines = [];

var CART_MESSAGES = {
  added: "Added to bag",
  removed: "Removed from bag",
  noSize: "Please select a size first.",
  soldOut: "That size is sold out.",
  maxReached: "You can add up to " + window.STORE_CONFIG.maxQuantityPerLine + " of the same item.",
  empty: "Your bag is empty.",
  storageFailed: "Your bag could not be saved in this browser. It will be lost when you leave the page."
};

/* ============================================================
 * SECTION A: SAVING AND LOADING (Expected Analytics Effect: None)
 * ============================================================ */

/**
 * FUNCTION: loadCart()
 * PURPOSE: Reads the saved bag from localStorage into cartLines.
 * Lines whose product no longer exists in config.js are dropped.
 */
function loadCart() {
  var saved = null;
  try {
    saved = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "[]");
  } catch (error) {
    saved = []; // corrupted or blocked storage: start with an empty bag
  }
  cartLines = [];
  if (!Array.isArray(saved)) {
    return;
  }
  for (var i = 0; i < saved.length; i++) {
    var line = saved[i];
    if (line && getProductById(line.productId) && line.quantity > 0) {
      cartLines.push({
        productId: line.productId,
        colorIndex: Number(line.colorIndex) || 0,
        size: String(line.size),
        quantity: Math.min(Number(line.quantity), window.STORE_CONFIG.maxQuantityPerLine)
      });
    }
  }
}

/**
 * FUNCTION: saveCart()
 * PURPOSE: Writes cartLines to localStorage. If the browser blocks
 * storage, the bag still works for this page and the visitor is told.
 */
function saveCart() {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartLines));
  } catch (error) {
    console.warn("[Air Max cart] Could not save the bag:", error);
    showToast(CART_MESSAGES.storageFailed, "error");
  }
}

/* ============================================================
 * SECTION B: READING THE BAG (Expected Analytics Effect: None)
 * ============================================================ */

/** FUNCTION: getLineKey(line) - unique id of a bag line: product|color|size. */
function getLineKey(line) {
  return line.productId + "|" + line.colorIndex + "|" + line.size;
}

/** FUNCTION: findLine(lineKey) - the line with that key, or null. */
function findLine(lineKey) {
  for (var i = 0; i < cartLines.length; i++) {
    if (getLineKey(cartLines[i]) === lineKey) {
      return cartLines[i];
    }
  }
  return null;
}

/** FUNCTION: getCartItemCount() - total number of pairs in the bag. */
function getCartItemCount() {
  var count = 0;
  for (var i = 0; i < cartLines.length; i++) {
    count += cartLines[i].quantity;
  }
  return count;
}

/** FUNCTION: getCartTotal() - sum of price x quantity, prices from config.js. */
function getCartTotal() {
  var total = 0;
  for (var i = 0; i < cartLines.length; i++) {
    total += getProductById(cartLines[i].productId).price * cartLines[i].quantity;
  }
  return total;
}

/**
 * FUNCTION: buildLineAnalyticsItem(line, quantity)
 * PURPOSE: GA4 item for one bag line (quantity can be overridden, e.g. 1
 * when only one pair is added or removed).
 */
function buildLineAnalyticsItem(line, quantity) {
  var product = getProductById(line.productId);
  return buildAnalyticsItem(product, {
    quantity: quantity,
    size: line.size,
    colorName: product.colors[line.colorIndex].name
  });
}

/** FUNCTION: buildCartAnalyticsItems() - GA4 items for the whole bag. */
function buildCartAnalyticsItems() {
  var items = [];
  for (var i = 0; i < cartLines.length; i++) {
    items.push(buildLineAnalyticsItem(cartLines[i], cartLines[i].quantity));
  }
  return items;
}

/* ============================================================
 * SECTION C: CHANGING THE BAG
 * ============================================================ */

/**
 * FUNCTION: addProductToCart(productId, colorIndex, size, quantity)
 *
 * PURPOSE: Adds pairs of one sneaker (one color, one size) to the bag.
 * If the same product+color+size is already there, its quantity grows.
 *
 * TRIGGER: "Add to Bag" on the product page (products.js calls this
 * after checking that a size was chosen).
 *
 * INPUTS: productId, colorIndex (0 = first colorway), size ("8"),
 *         quantity (1 or more).
 * OUTPUT: { ok: true } or { ok: false, message: "why" }.
 *
 * EXPECTED WEBSITE RESULT:
 * - Bag badge in the header increases by quantity.
 * - Bag drawer and bag page list/totals update.
 * - Toast "Added to bag".
 *
 * EXPECTED ANALYTICS RESULT:
 * GTM event / GA4 event: add_to_cart
 * Parameters (inside "ecommerce"):
 * - currency: "INR"
 * - value:    price x quantity ADDED (not the whole bag)
 * - items:    [ { item_id, item_name, item_brand: "Nike",
 *                 item_category: "Footwear", item_category2,
 *                 item_variant: "Color - UK size", price, quantity } ]
 *
 * EXPECTED GA4 IMPACT:
 * - add_to_cart event count: +1 per successful click.
 * - "Items added to cart" in e-commerce reports: +quantity.
 * - page_view: unchanged (no page load).
 * - Engagement: not changed by the event itself. If you mark
 *   add_to_cart as a key event, the session counts as engaged.
 *
 * VERIFICATION:
 * 1. GTM Preview: choose a size, click Add to Bag once.
 * 2. Exactly one add_to_cart appears; Data Layer tab shows the item
 *    with the right price, size and quantity.
 * 3. GA4 DebugView: add_to_cart with "items".
 *
 * FAILURE BEHAVIOR (no event is sent in any of these cases):
 * - Unknown product, missing size, sold-out size, size not offered.
 * - Line already at the maximum quantity.
 *
 * DUPLICATE RISK:
 * The Add to Bag button is handled by one listener. Do not add a GTM
 * click trigger that sends another GA4 add_to_cart for the same button.
 */
function addProductToCart(productId, colorIndex, size, quantity) {
  var product = getProductById(productId);
  if (!product) {
    return { ok: false, message: "This product is no longer available." };
  }
  if (!size || product.sizes.indexOf(String(size)) === -1) {
    return { ok: false, message: CART_MESSAGES.noSize };
  }
  if (product.soldOutSizes.indexOf(String(size)) !== -1) {
    return { ok: false, message: CART_MESSAGES.soldOut };
  }
  colorIndex = product.colors[colorIndex] ? colorIndex : 0;
  quantity = Math.max(1, Math.floor(Number(quantity) || 1));

  var newLine = { productId: productId, colorIndex: colorIndex, size: String(size), quantity: 0 };
  var line = findLine(getLineKey(newLine));
  var currentQuantity = line ? line.quantity : 0;
  var allowed = window.STORE_CONFIG.maxQuantityPerLine - currentQuantity;
  if (allowed <= 0) {
    return { ok: false, message: CART_MESSAGES.maxReached };
  }
  var added = Math.min(quantity, allowed);
  if (line) {
    line.quantity += added;
  } else {
    newLine.quantity = added;
    cartLines.push(newLine);
    line = newLine;
  }
  saveCart();
  refreshCartDisplays();

  trackEcommerceEvent("add_to_cart", {
    currency: window.STORE_CONFIG.currency,
    value: product.price * added,
    items: [buildLineAnalyticsItem(line, added)]
  });
  return { ok: true, added: added, limited: added < quantity };
}

/**
 * FUNCTION: removeProductFromCart(lineKey)
 *
 * PURPOSE: Removes one whole line (all pairs of that product/color/size).
 * TRIGGER: The bin "Remove" button on a bag line (drawer or bag page).
 *
 * EXPECTED WEBSITE RESULT: The line disappears; badge and totals update;
 * toast "Removed from bag". An empty bag shows the "empty" message.
 *
 * EXPECTED ANALYTICS RESULT:
 * GTM / GA4 event: remove_from_cart
 * Parameters: currency "INR", value = price x removed quantity,
 *   items: [ the removed line with its full quantity ].
 *
 * EXPECTED GA4 IMPACT:
 * - remove_from_cart event count: +1.
 * - "Items removed from cart": +removed quantity.
 * - page_view and engagement: unchanged.
 *
 * VERIFICATION: Add 2 pairs, click Remove: one remove_from_cart with
 *   quantity 2 in GTM Preview / DebugView.
 * FAILURE BEHAVIOR: Unknown line key -> nothing happens, no event.
 * DUPLICATE RISK: One delegated listener; a removed line cannot be
 *   removed twice because it no longer exists.
 */
function removeProductFromCart(lineKey) {
  var line = findLine(lineKey);
  if (!line) {
    return;
  }
  var removedItem = buildLineAnalyticsItem(line, line.quantity);
  var value = getProductById(line.productId).price * line.quantity;
  cartLines.splice(cartLines.indexOf(line), 1);
  saveCart();
  refreshCartDisplays();
  showToast(CART_MESSAGES.removed);
  trackEcommerceEvent("remove_from_cart", {
    currency: window.STORE_CONFIG.currency,
    value: value,
    items: [removedItem]
  });
}

/**
 * FUNCTION: updateCartQuantity(lineKey, change)
 *
 * PURPOSE: Adds or removes ONE pair on a bag line.
 * TRIGGER: The "+" or "-" buttons on a bag line.
 * INPUTS: lineKey, change (+1 or -1).
 *
 * EXPECTED WEBSITE RESULT: Quantity, line price, badge and totals update.
 * Going below 1 removes the line (same as Remove).
 *
 * EXPECTED ANALYTICS RESULT:
 * - "+": add_to_cart      { currency, value: price, items: [qty 1] }
 * - "-": remove_from_cart { currency, value: price, items: [qty 1] }
 * - "-" on the last pair: handled by removeProductFromCart() (one event).
 *
 * EXPECTED GA4 IMPACT: event count +1 per click; no page_view;
 *   engagement unchanged.
 *
 * VERIFICATION: Click "+" twice: two add_to_cart events, each quantity 1.
 * FAILURE BEHAVIOR: At the maximum quantity "+" shows a message and
 *   sends nothing (the "+" button is also disabled there).
 * DUPLICATE RISK: Each click is a real change, so each click is one event.
 */
function updateCartQuantity(lineKey, change) {
  var line = findLine(lineKey);
  if (!line) {
    return;
  }
  if (change < 0 && line.quantity <= 1) {
    removeProductFromCart(lineKey);
    return;
  }
  if (change > 0 && line.quantity >= window.STORE_CONFIG.maxQuantityPerLine) {
    showToast(CART_MESSAGES.maxReached, "error");
    return;
  }
  line.quantity += change > 0 ? 1 : -1;
  saveCart();
  refreshCartDisplays();
  trackEcommerceEvent(change > 0 ? "add_to_cart" : "remove_from_cart", {
    currency: window.STORE_CONFIG.currency,
    value: getProductById(line.productId).price,
    items: [buildLineAnalyticsItem(line, 1)]
  });
}

/* ============================================================
 * SECTION D: SHOWING THE BAG (Expected Analytics Effect: None)
 * ============================================================ */

/** FUNCTION: updateCartBadge() - writes the pair count on the bag icon. */
function updateCartBadge() {
  var count = getCartItemCount();
  var badges = document.querySelectorAll("[data-cart-count]");
  for (var i = 0; i < badges.length; i++) {
    badges[i].textContent = count;
    badges[i].hidden = count === 0;
  }
  var bagButtons = document.querySelectorAll(".bag-btn");
  for (var b = 0; b < bagButtons.length; b++) {
    bagButtons[b].setAttribute("aria-label", "Shopping bag, " + count + (count === 1 ? " item" : " items"));
  }
}

/**
 * FUNCTION: buildCartLineHtml(line)
 * PURPOSE: HTML for one bag line with its +, - and Remove buttons.
 */
function buildCartLineHtml(line) {
  var product = getProductById(line.productId);
  var color = product.colors[line.colorIndex];
  var key = escapeHtml(getLineKey(line));
  var atMax = line.quantity >= window.STORE_CONFIG.maxQuantityPerLine;
  return (
    '<li class="cart-line">' +
    '<a class="cart-line__image" href="products.html?id=' + product.id + '">' +
    '<img src="' + resizeImageUrl(color.photos[0].url, 200) + '" alt="" width="88" height="88" loading="lazy"></a>' +
    '<div class="cart-line__info">' +
    '<a class="cart-line__name" href="products.html?id=' + product.id + '">' + escapeHtml(product.name) + "</a>" +
    '<span class="cart-line__meta">' + escapeHtml(color.name) + " &middot; UK " + escapeHtml(line.size) + "</span>" +
    '<div class="qty" role="group" aria-label="Quantity for ' + escapeHtml(product.name) + '">' +
    /* BUTTON: Decrease quantity (-)
       Handler: updateCartQuantity(key, -1). Result: one pair fewer (line
       removed at 0). Analytics: remove_from_cart (quantity 1). */
    '<button type="button" class="qty__btn" data-cart-action="decrease" data-line-key="' + key + '" aria-label="Decrease quantity">' + getIconSvg("minus") + "</button>" +
    '<span class="qty__value" aria-live="polite">' + line.quantity + "</span>" +
    /* BUTTON: Increase quantity (+)
       Handler: updateCartQuantity(key, +1). Result: one pair more.
       Analytics: add_to_cart (quantity 1). Disabled at the maximum. */
    '<button type="button" class="qty__btn" data-cart-action="increase" data-line-key="' + key + '" aria-label="Increase quantity"' + (atMax ? " disabled" : "") + ">" + getIconSvg("plus") + "</button>" +
    "</div></div>" +
    '<div class="cart-line__end">' +
    '<strong class="cart-line__price">' + formatPrice(product.price * line.quantity) + "</strong>" +
    /* BUTTON: Remove (bin icon)
       Handler: removeProductFromCart(key). Result: line disappears.
       Analytics: remove_from_cart with the line's full quantity. */
    '<button type="button" class="icon-btn icon-btn--small" data-cart-action="remove" data-line-key="' + key + '" aria-label="Remove ' + escapeHtml(product.name) + ' from bag">' + getIconSvg("trash") + "</button>" +
    "</div></li>"
  );
}

/**
 * FUNCTION: renderCart()
 * PURPOSE: Redraws the bag drawer and, on cart.html, the bag page.
 */
function renderCart() {
  var listHtml = "";
  for (var i = 0; i < cartLines.length; i++) {
    listHtml += buildCartLineHtml(cartLines[i]);
  }
  var isEmpty = cartLines.length === 0;
  var total = formatPrice(getCartTotal());
  var count = getCartItemCount();

  var lists = document.querySelectorAll("[data-cart-list]");
  for (var l = 0; l < lists.length; l++) {
    lists[l].innerHTML = listHtml;
  }
  var empties = document.querySelectorAll("[data-cart-empty]");
  for (var e = 0; e < empties.length; e++) {
    empties[e].hidden = !isEmpty;
  }
  var summaries = document.querySelectorAll("[data-cart-summary]");
  for (var s = 0; s < summaries.length; s++) {
    summaries[s].hidden = isEmpty;
  }
  var totals = document.querySelectorAll("[data-cart-total]");
  for (var t = 0; t < totals.length; t++) {
    totals[t].textContent = total;
  }
  var counts = document.querySelectorAll("[data-cart-count-text]");
  for (var c = 0; c < counts.length; c++) {
    counts[c].textContent = count + (count === 1 ? " item" : " items");
  }
}

/**
 * FUNCTION: refreshCartDisplays()
 * PURPOSE: Badge + drawer + bag page together. If the button that had
 * keyboard focus was redrawn away (e.g. a removed line), focus moves to
 * the bag heading so keyboard users do not get lost.
 * Expected Analytics Effect: None.
 */
function refreshCartDisplays() {
  var focused = document.activeElement;
  var hadFocusInCart = focused && focused.closest && focused.closest("[data-cart-list]") ? focused : null;
  updateCartBadge();
  renderCart();
  if (hadFocusInCart && !document.body.contains(hadFocusInCart)) {
    var heading = document.querySelector(currentlyOpenPanel ? "#cart-panel h2" : "#cart-page-title");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
  }
}

/* ============================================================
 * SECTION E: OPENING THE BAG AND CHECKOUT
 * ============================================================ */

/**
 * FUNCTION: openShoppingCart(openerButton)
 *
 * PURPOSE: Slides the bag drawer in from the right.
 * TRIGGER: The bag icon in the header, or "View bag" after adding.
 *
 * EXPECTED WEBSITE RESULT: Drawer opens with the lines, total and a
 * Checkout button (or the "empty" message). Focus moves into it.
 *
 * EXPECTED ANALYTICS RESULT:
 * GTM / GA4 event: view_cart
 * Parameters: currency "INR", value = bag total, items = every line.
 * EMPTY BAG: no view_cart is sent, because GA4 e-commerce events need
 *   at least one item. The drawer still opens.
 *
 * EXPECTED GA4 IMPACT:
 * - view_cart event count: +1 per opening of a non-empty bag.
 * - page_view: unchanged (drawer, not a page).
 * - Engagement: unchanged by the event itself.
 *
 * VERIFICATION: Add a pair, click the bag icon: one view_cart with the
 *   current contents (Test C in ANALYTICS_GUIDE.md).
 * FAILURE BEHAVIOR: If the drawer is missing nothing opens, no event.
 * DUPLICATE RISK: Re-opening sends another view_cart (a new real view).
 *   cart.html also sends one view_cart on load (see initCart) because
 *   that page itself is a bag view.
 */
function openShoppingCart(openerButton) {
  renderCart();
  if (!openPanel("cart-panel", openerButton)) {
    return;
  }
  sendViewCartEvent();
}

/** FUNCTION: sendViewCartEvent() - view_cart for the current bag (skipped if empty). */
function sendViewCartEvent() {
  if (cartLines.length === 0) {
    return;
  }
  trackEcommerceEvent("view_cart", {
    currency: window.STORE_CONFIG.currency,
    value: getCartTotal(),
    items: buildCartAnalyticsItems()
  });
}

/**
 * FUNCTION: startCheckout(openerButton)
 *
 * PURPOSE: Starts the DEMONSTRATION checkout. No payment is taken.
 * TRIGGER: "Checkout" in the bag drawer or on the bag page.
 *
 * EXPECTED WEBSITE RESULT: A panel explains that this is a demo store,
 * shows the order summary and says no purchase or charge happened.
 * The bag is NOT emptied, because nothing was bought.
 *
 * EXPECTED ANALYTICS RESULT:
 * GTM / GA4 event: begin_checkout
 * Parameters: currency "INR", value = bag total, items = every line.
 * "purchase" is NOT sent here or anywhere: GA4 must only receive a
 * purchase after a real, verified payment.
 *
 * EXPECTED GA4 IMPACT:
 * - begin_checkout event count: +1.
 * - Checkout funnel reports show a checkout start with no purchase.
 * - page_view: unchanged.
 *
 * VERIFICATION: GTM Preview: one begin_checkout; no purchase event.
 * FAILURE BEHAVIOR: Empty bag -> message "Your bag is empty.", no event.
 * DUPLICATE RISK: Clicking Checkout again sends another begin_checkout
 *   (GA4 counts checkout starts, not unique people).
 */
function startCheckout(openerButton) {
  if (cartLines.length === 0) {
    showToast(CART_MESSAGES.empty, "error");
    return;
  }
  var summary = document.getElementById("checkout-summary");
  if (summary) {
    summary.innerHTML =
      "<p><strong>" + getCartItemCount() + " item(s)</strong> &middot; Total <strong>" + formatPrice(getCartTotal()) + "</strong></p>";
  }
  if (!openPanel("checkout-panel", openerButton)) {
    return;
  }
  trackEcommerceEvent("begin_checkout", {
    currency: window.STORE_CONFIG.currency,
    value: getCartTotal(),
    items: buildCartAnalyticsItems()
  });
}

/**
 * FUNCTION: initCart()
 * PURPOSE: Loads the bag, draws it, connects every bag button (one
 * listener for the whole page) and, on cart.html, sends view_cart once.
 * Also keeps two open tabs in sync (the "storage" event).
 * Expected Analytics Effect: view_cart once on cart.html load when the
 * bag has items (see openShoppingCart for the parameters).
 */
function initCart() {
  loadCart();
  refreshCartDisplays();

  document.addEventListener("click", function (event) {
    var opener = event.target.closest("[data-open-cart]");
    if (opener) {
      event.preventDefault();
      openShoppingCart(opener);
      return;
    }
    var checkout = event.target.closest("[data-start-checkout]");
    if (checkout) {
      startCheckout(checkout);
      return;
    }
    var actionButton = event.target.closest("[data-cart-action]");
    if (actionButton) {
      var key = actionButton.getAttribute("data-line-key");
      var action = actionButton.getAttribute("data-cart-action");
      if (action === "remove") {
        removeProductFromCart(key);
      } else {
        updateCartQuantity(key, action === "increase" ? 1 : -1);
      }
    }
  });

  window.addEventListener("storage", function (event) {
    if (event.key === CART_STORAGE_KEY) {
      loadCart();
      refreshCartDisplays();
    }
  });

  if (document.body.getAttribute("data-page") === "cart") {
    sendViewCartEvent();
  }
}

document.addEventListener("DOMContentLoaded", initCart);
