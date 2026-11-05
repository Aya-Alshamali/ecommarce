/**
 * ============================================================
 * FILE: assets/js/products.js
 * ============================================================
 *
 * 1. WHAT THIS FILE IS USED FOR
 *    Everything that shows sneakers:
 *    - HOME (index.html): the big hero sneaker, the three product
 *      cards, the arrows, the dots and the SHOP NOW button.
 *    - LIST (products.html): grid of sneakers with filter buttons.
 *    - DETAILS (products.html?id=...): photos, colors, sizes,
 *      quantity and the Add to Bag button.
 *
 * 2. MAIN COMPONENTS
 *    Home:    renderFeaturedCards(), selectProduct(), updateHeroImage(),
 *             showNextProduct(), handleShopNowClick()
 *    List:    renderProductGrid(), applyProductFilter()
 *    Details: renderProductDetails(), selectColor(), selectSize(),
 *             handleAddToBag()
 *
 * 3. IMPORTANT VARIABLES
 *    - featuredIndex: which of the three hero sneakers is showing.
 *    - detailState:   { product, colorIndex, size, quantity } for the
 *                     product page.
 *
 * 4. DEPENDENCIES
 *    config.js, analytics.js, main.js, cart.js (addProductToCart),
 *    navigation.js (RECENTLY_VIEWED_KEY, attachNavigationTracking).
 *
 * 5. SAFE CUSTOMIZATION AREAS
 *    - Which sneakers are featured: config.js FEATURED_PRODUCT_IDS.
 *    - Filter buttons: FILTERS below.
 *    - Texts inside the render functions.
 *
 * 6. ANALYTICS CONFIGURATION LOCATION
 *    IDs: config.js. Events sent from here:
 *    view_item_list, select_item, view_item, size_selected,
 *    shop_now_clicked (and add_to_cart through cart.js).
 * ============================================================
 */

// ==========================================
// GA4 AND GTM EVENT TRACKING SECTION
// ==========================================
// Purpose: product events go through analytics.js.
// DECISION (ANALYTICS_GUIDE.md Test D): every product change the visitor
// makes on purpose sends ONE select_item, whether it came from a card,
// an arrow, a dot or the keyboard. The custom parameter
// "selection_method" tells them apart. The FIRST sneaker shown when the
// page loads is not a selection and sends nothing. Animations never
// send events.

var featuredIndex = 0;
var heroSwapTimer = null;
var heroSwapToken = 0; // grows on every swap; only the newest swap may finish
var detailState = { product: null, colorIndex: 0, size: null, quantity: 1 };

var FILTERS = [
  { id: "all", label: "All" },
  { id: "men", label: "Men" },
  { id: "women", label: "Women" },
  { id: "kids", label: "Kids" },
  { id: "sale", label: "Sale" }
];

/** FUNCTION: prefersReducedMotion() - true if the visitor asked the OS for less animation. */
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** FUNCTION: getFeaturedProducts() - the three hero products as objects. */
function getFeaturedProducts() {
  var list = [];
  for (var i = 0; i < window.FEATURED_PRODUCT_IDS.length; i++) {
    var product = getProductById(window.FEATURED_PRODUCT_IDS[i]);
    if (product) {
      list.push(product);
    }
  }
  return list;
}

/** FUNCTION: buildPriceHtml(product) - price, plus struck-out old price on sale items. */
function buildPriceHtml(product) {
  var html = '<span class="price">' + formatPrice(product.price) + "</span>";
  if (product.originalPrice) {
    html += ' <s class="price-old">' + formatPrice(product.originalPrice) + "</s>";
  }
  return html;
}

/* ============================================================
 * SECTION A: HOME PAGE HERO
 * ============================================================ */

/**
 * FUNCTION: renderFeaturedCards()
 *
 * PURPOSE: Draws the three product cards and the dots, then shows the
 * starting sneaker WITHOUT tracking a selection.
 * TRIGGER: index.html loads.
 *
 * EXPECTED WEBSITE RESULT: Three cards (red, black, white); the white
 * Excee is active and shown large, as in the reference.
 *
 * EXPECTED ANALYTICS RESULT:
 * GTM / GA4 event: view_item_list (once per page load)
 * Parameters: item_list_id "featured_sneakers",
 *   item_list_name "Featured Sneakers", items: the 3 products with index.
 *
 * EXPECTED GA4 IMPACT: view_item_list +1 per home page load (alongside the
 *   page_view from the GA4 tag). Engagement unchanged.
 * VERIFICATION: Load index.html with GTM Preview: one view_item_list
 *   with 3 items.
 * FAILURE BEHAVIOR: No featured products found -> nothing drawn, no event.
 * DUPLICATE RISK: Only called once per load.
 */
function renderFeaturedCards() {
  var container = document.getElementById("product-cards");
  var dots = document.getElementById("hero-dots");
  var products = getFeaturedProducts();
  if (!container || products.length === 0) {
    return;
  }
  var html = "";
  var dotsHtml = "";
  for (var i = 0; i < products.length; i++) {
    var product = products[i];
    /* BUTTON: Product card (one per featured sneaker)
       Handler: selectProduct(id, "card").
       Result: hero sneaker, name, price and SHOP NOW link change; card
       becomes active. Analytics: select_item (selection_method "card"),
       not sent when the card is already active. */
    html += '<li><button type="button" class="product-card" data-select-product="' + product.id + '" aria-pressed="false">' +
      '<span class="product-card__image"><img src="' + resizeImageUrl(getMainPhoto(product).url, 240) + '" alt="" width="96" height="72" loading="lazy"></span>' +
      '<span class="product-card__text"><span class="product-card__name">' + escapeHtml(product.name) + "</span>" +
      '<span class="product-card__price">' + formatPrice(product.price) + "</span></span></button></li>";
    /* BUTTON: Pagination dot. Handler: selectProduct(id, "dot").
       Analytics: select_item (selection_method "dot"). */
    dotsHtml += '<button type="button" class="dot" data-select-product="' + product.id + '" data-method="dot" aria-label="Show ' + escapeHtml(product.name) + '"></button>';
  }
  container.innerHTML = html;
  if (dots) {
    dots.innerHTML = dotsHtml;
  }

  // Preload the large photos so switching is instant.
  for (var p = 0; p < products.length; p++) {
    new Image().src = getMainPhoto(products[p]).url;
  }

  var start = Math.min(window.FEATURED_START_INDEX || 0, products.length - 1);
  showFeaturedProduct(start, false);

  var items = [];
  for (var j = 0; j < products.length; j++) {
    items.push(buildAnalyticsItem(products[j], { index: j, listId: window.FEATURED_LIST.id, listName: window.FEATURED_LIST.name }));
  }
  trackEcommerceEvent("view_item_list", {
    item_list_id: window.FEATURED_LIST.id,
    item_list_name: window.FEATURED_LIST.name,
    items: items
  });
}

/**
 * FUNCTION: selectProduct(productId, selectionMethod)
 *
 * PURPOSE: Changes the featured sneaker in the hero.
 *
 * TRIGGER: Clicking a product card ("card"), a dot ("dot"), the arrows
 *   ("arrow" via showNextProduct) or Left/Right keys on a card ("keyboard").
 *
 * INPUTS: productId (e.g. "air-max-270"), selectionMethod (text above).
 *
 * EXPECTED WEBSITE RESULT:
 * - Main sneaker photo slides/fades to the new one (instant with
 *   reduced motion).
 * - "Now showing" name and price update.
 * - Selected card and dot become active (red marker on the card).
 * - SHOP NOW now links to products.html?id=<productId>.
 * - No page reload.
 *
 * EXPECTED ANALYTICS RESULT:
 * GTM / GA4 event: select_item
 * Parameters:
 * - selection_method: "card" | "arrow" | "dot" | "keyboard" (custom,
 *   next to "ecommerce")
 * - ecommerce.item_list_id:   "featured_sneakers"
 * - ecommerce.item_list_name: "Featured Sneakers"
 * - ecommerce.items: [ the selected product with index, price, quantity 1 ]
 *
 * EXPECTED GA4 IMPACT:
 * - select_item event count: +1 if GA4 receives the event.
 * - No new page_view.
 * - Engagement time may increase naturally as the visitor interacts.
 * - Engagement rate is not guaranteed to change.
 *
 * VERIFICATION (Test A / Test D): GTM Preview + GA4 DebugView. Click a
 *   different card once: exactly one select_item with that item.
 *
 * FAILURE BEHAVIOR: Unknown product id -> nothing changes, NO event.
 *   If the new photo fails to download, the selection still stands (the
 *   name, price and link changed) and the alt text is shown.
 *
 * DUPLICATE PREVENTION: Clicking the card that is already active does
 *   nothing and sends nothing. The slide animation never tracks.
 */
function selectProduct(productId, selectionMethod) {
  var products = getFeaturedProducts();
  var newIndex = -1;
  for (var i = 0; i < products.length; i++) {
    if (products[i].id === productId) {
      newIndex = i;
    }
  }
  if (newIndex === -1 || newIndex === featuredIndex) {
    return; // unknown, or already showing: no change, no event
  }
  showFeaturedProduct(newIndex, true);
  var product = products[newIndex];
  trackEcommerceEvent("select_item", {
    item_list_id: window.FEATURED_LIST.id,
    item_list_name: window.FEATURED_LIST.name,
    items: [buildAnalyticsItem(product, { index: newIndex, listId: window.FEATURED_LIST.id, listName: window.FEATURED_LIST.name })]
  }, { selection_method: selectionMethod || "card" });
}

/**
 * FUNCTION: showFeaturedProduct(index, animate)
 * PURPOSE: Updates everything on screen for featured sneaker number
 * "index". Used by selectProduct() and by the first page load.
 * Expected Analytics Effect: None (the caller decides about tracking).
 */
function showFeaturedProduct(index, animate) {
  var products = getFeaturedProducts();
  var product = products[index];
  featuredIndex = index;

  updateHeroImage(product, animate);

  var name = document.getElementById("hero-product-name");
  var price = document.getElementById("hero-product-price");
  var counter = document.getElementById("hero-counter");
  if (name) { name.textContent = product.name; }
  if (price) { price.innerHTML = buildPriceHtml(product); }
  if (counter) { counter.textContent = String(index + 1).padStart(2, "0") + " / " + String(products.length).padStart(2, "0"); }

  var shopNow = document.getElementById("shop-now-btn");
  if (shopNow) {
    shopNow.setAttribute("href", "products.html?id=" + product.id);
    shopNow.setAttribute("aria-label", "Shop now: " + product.name);
  }

  var cards = document.querySelectorAll("#product-cards [data-select-product], #hero-dots [data-select-product]");
  for (var c = 0; c < cards.length; c++) {
    var active = cards[c].getAttribute("data-select-product") === product.id;
    cards[c].classList.toggle("is-active", active);
    if (cards[c].classList.contains("product-card")) {
      cards[c].setAttribute("aria-pressed", active ? "true" : "false");
    } else {
      cards[c].setAttribute("aria-current", active ? "true" : "false");
    }
  }

  // Tell screen readers what changed.
  var live = document.getElementById("hero-live");
  if (live && animate) {
    live.textContent = "Showing " + product.name + ", " + formatPrice(product.price);
  }
}

/**
 * FUNCTION: updateHeroImage(product, animate)
 *
 * PURPOSE: Swaps the large hero photo with a short slide-and-fade.
 * The new photo is downloaded first, so the old one never disappears
 * into an empty space. With reduced motion the swap is instant.
 * If the visitor clicks quickly several times, only the LAST requested
 * photo is shown (heroSwapToken), so an older, slower download can
 * never replace a newer choice.
 *
 * Expected Analytics Effect: None. This is purely visual; animations
 * must never create analytics events.
 */
function updateHeroImage(product, animate) {
  var image = document.getElementById("hero-image");
  if (!image) {
    return;
  }
  var photo = getMainPhoto(product);
  var credit = document.getElementById("hero-credit");

  function swap() {
    image.src = photo.url;
    image.alt = photo.alt;
    if (credit) {
      credit.innerHTML = 'Photo: <a href="' + photo.creditUrl + '" target="_blank" rel="noopener">' + escapeHtml(photo.credit) + "</a> / Unsplash";
    }
  }

  if (!animate || prefersReducedMotion()) {
    heroSwapToken += 1; // cancel any animated swap still in progress
    window.clearTimeout(heroSwapTimer);
    image.classList.remove("is-leaving", "is-entering");
    swap();
    return;
  }
  window.clearTimeout(heroSwapTimer);
  heroSwapToken += 1;
  var myToken = heroSwapToken;
  image.classList.remove("is-entering");
  image.classList.add("is-leaving");
  var preload = new Image();
  var started = Date.now();
  function finish() {
    if (myToken !== heroSwapToken) {
      return; // a newer selection has taken over
    }
    // Wait for the leaving animation (250 ms) even if the photo was cached.
    heroSwapTimer = window.setTimeout(function () {
      if (myToken !== heroSwapToken) {
        return;
      }
      swap();
      image.classList.remove("is-leaving");
      image.classList.add("is-entering");
      heroSwapTimer = window.setTimeout(function () { image.classList.remove("is-entering"); }, 450);
    }, Math.max(0, 250 - (Date.now() - started)));
  }
  preload.onload = finish;
  preload.onerror = finish; // still swap: the browser then shows the alt text
  preload.src = photo.url;
}

/**
 * FUNCTION: showNextProduct(direction)
 *
 * PURPOSE: Moves to the next (+1) or previous (-1) featured sneaker,
 * wrapping around at the ends.
 * TRIGGER: The round left/right arrow buttons.
 *
 * EXPECTED WEBSITE RESULT: Same as selecting that product's card.
 *
 * EXPECTED ANALYTICS RESULT: select_item with selection_method "arrow"
 *   (see selectProduct for all parameters). One event per click.
 * EXPECTED GA4 IMPACT: select_item +1; no page_view.
 * VERIFICATION (Test D): Click the right arrow once: one select_item.
 * FAILURE BEHAVIOR: Fewer than 2 featured products -> nothing happens.
 * DUPLICATE RISK: None beyond selectProduct's own rule.
 */
function showNextProduct(direction) {
  var products = getFeaturedProducts();
  if (products.length < 2) {
    return;
  }
  var next = (featuredIndex + direction + products.length) % products.length;
  selectProduct(products[next].id, "arrow");
}

/**
 * FUNCTION: handleShopNowClick(event)
 *
 * PURPOSE: Records the SHOP NOW click, then the browser opens the
 * selected sneaker's product page.
 * TRIGGER: The black SHOP NOW ↗ button.
 *
 * EXPECTED WEBSITE RESULT: products.html?id=<selected> opens.
 *
 * EXPECTED ANALYTICS RESULT:
 * GTM / GA4 event: shop_now_clicked
 * Parameters: item_id, item_name, button_location "hero".
 * The product page then sends view_item (separate event, separate page).
 *
 * EXPECTED GA4 IMPACT: shop_now_clicked +1; page_view +1 on the product
 *   page; the session becomes engaged (2 page views).
 * VERIFICATION: GTM Preview: shop_now_clicked, then on the next page
 *   page_view and view_item.
 * FAILURE BEHAVIOR: Tracking never blocks the link.
 * DUPLICATE RISK: Do not add a GTM click trigger for this button.
 */
function handleShopNowClick() {
  var product = getFeaturedProducts()[featuredIndex];
  trackAnalyticsEvent("shop_now_clicked", {
    item_id: product.id,
    item_name: product.name,
    button_location: "hero"
  });
}

/**
 * FUNCTION: initHero()
 * PURPOSE: Draws the cards and connects cards, dots, arrows, keyboard
 * and SHOP NOW. Only runs on index.html.
 * Expected Analytics Effect: view_item_list once (renderFeaturedCards).
 */
function initHero() {
  if (!document.getElementById("product-cards")) {
    return;
  }
  renderFeaturedCards();

  document.addEventListener("click", function (event) {
    var target = event.target.closest("[data-select-product]");
    if (target) {
      selectProduct(target.getAttribute("data-select-product"), target.getAttribute("data-method") || "card");
    }
  });
  /* BUTTONS: Previous / Next arrows. Handler: showNextProduct(-1 / +1).
     Analytics: select_item (selection_method "arrow"). */
  document.getElementById("hero-prev-btn").addEventListener("click", function () { showNextProduct(-1); });
  document.getElementById("hero-next-btn").addEventListener("click", function () { showNextProduct(1); });
  document.getElementById("shop-now-btn").addEventListener("click", handleShopNowClick);

  // Left/Right arrow keys while a card has focus.
  document.getElementById("product-cards").addEventListener("keydown", function (event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }
    event.preventDefault();
    var products = getFeaturedProducts();
    var next = (featuredIndex + (event.key === "ArrowRight" ? 1 : -1) + products.length) % products.length;
    selectProduct(products[next].id, "keyboard");
    var card = document.querySelector('#product-cards [data-select-product="' + products[next].id + '"]');
    if (card) {
      card.focus();
    }
  });
}

/* ============================================================
 * SECTION B: PRODUCT LIST (products.html without ?id=)
 * ============================================================ */

/**
 * FUNCTION: getFilteredProducts(filterId, collectionId)
 * PURPOSE: Products matching a category ("men", ...), "sale" (has an
 * originalPrice), "all", or a collection id.
 * Expected Analytics Effect: None.
 */
function getFilteredProducts(filterId, collectionId) {
  var result = [];
  for (var i = 0; i < window.PRODUCTS.length; i++) {
    var product = window.PRODUCTS[i];
    var keep = true;
    if (collectionId) {
      keep = product.collection === collectionId;
    } else if (filterId === "sale") {
      keep = Boolean(product.originalPrice);
    } else if (filterId && filterId !== "all") {
      keep = product.category === filterId;
    }
    if (keep) {
      result.push(product);
    }
  }
  return result;
}

/**
 * FUNCTION: renderProductGrid(filterId, collectionId)
 *
 * PURPOSE: Draws the grid of sneakers for the current filter.
 * TRIGGER: products.html loads, or a filter button is clicked.
 *
 * EXPECTED WEBSITE RESULT: Matching sneaker tiles, a heading and a
 * count. Sale items show the old price struck out.
 *
 * EXPECTED ANALYTICS RESULT:
 * GTM / GA4 event: view_item_list - once per page load and once per
 *   filter change, because each shows a DIFFERENT list.
 * Parameters: item_list_id e.g. "category_men" / "collection_air-max-1"
 *   / "category_all"; item_list_name e.g. "Men"; items with index.
 *
 * EXPECTED GA4 IMPACT: view_item_list +1 per distinct list shown. Filter
 *   buttons do NOT create page_views (the address bar changes without a
 *   reload).
 * VERIFICATION: Load products.html, click "Kids": two view_item_list
 *   events, the second with item_list_id "category_kids".
 * FAILURE BEHAVIOR: Empty result -> "No sneakers here yet" and NO event
 *   (GA4 needs at least one item).
 * DUPLICATE RISK: Clicking the filter that is already active does
 *   nothing (see applyProductFilter).
 */
function renderProductGrid(filterId, collectionId) {
  var grid = document.getElementById("product-grid");
  if (!grid) {
    return;
  }
  var products = getFilteredProducts(filterId, collectionId);
  var listName = "All sneakers";
  var listId = "category_all";
  if (collectionId) {
    for (var c = 0; c < window.COLLECTIONS.length; c++) {
      if (window.COLLECTIONS[c].id === collectionId) {
        listName = window.COLLECTIONS[c].name;
      }
    }
    listId = "collection_" + collectionId;
  } else if (filterId && filterId !== "all") {
    for (var f = 0; f < FILTERS.length; f++) {
      if (FILTERS[f].id === filterId) {
        listName = FILTERS[f].label;
      }
    }
    listId = "category_" + filterId;
  }
  document.getElementById("list-title").textContent = listName;
  document.getElementById("list-count").textContent = products.length + (products.length === 1 ? " style" : " styles");

  if (products.length === 0) {
    grid.innerHTML = '<li class="muted">No sneakers here yet. <a href="products.html">See all</a>.</li>';
    return;
  }
  var html = "";
  for (var i = 0; i < products.length; i++) {
    var product = products[i];
    var photo = getMainPhoto(product);
    /* LINK: product tile -> products.html?id=...
       Handler: the grid click listener in initProductList() sends
       select_item (selection_method "grid") just before the page opens. */
    html += '<li><a class="tile" href="products.html?id=' + product.id + '" data-tile-index="' + i + '" data-product-id="' + product.id + '">' +
      '<span class="tile__image"><img src="' + resizeImageUrl(photo.url, 700) + '" alt="' + escapeHtml(photo.alt) + '" width="420" height="420" loading="lazy"></span>' +
      (product.originalPrice ? '<span class="tile__badge">Sale</span>' : "") +
      '<span class="tile__name">' + escapeHtml(product.name) + "</span>" +
      '<span class="tile__meta">' + escapeHtml(product.tagline) + " &middot; " + product.colors.length + (product.colors.length === 1 ? " colour" : " colours") + "</span>" +
      '<span class="tile__price">' + buildPriceHtml(product) + "</span></a></li>";
  }
  grid.innerHTML = html;
  grid.setAttribute("data-list-id", listId);
  grid.setAttribute("data-list-name", listName);

  var items = [];
  for (var j = 0; j < products.length; j++) {
    items.push(buildAnalyticsItem(products[j], { index: j, listId: listId, listName: listName }));
  }
  trackEcommerceEvent("view_item_list", { item_list_id: listId, item_list_name: listName, items: items });
}

/**
 * FUNCTION: applyProductFilter(filterId)
 *
 * PURPOSE: Switches the grid to another filter without reloading, and
 * updates the address bar (?category=kids) so the link can be shared.
 * TRIGGER: A filter button (All / Men / Women / Kids / Sale).
 *
 * EXPECTED WEBSITE RESULT: The grid, heading and active button change.
 *
 * EXPECTED ANALYTICS RESULT: view_item_list for the new list (sent by
 *   renderProductGrid). No navigation_clicked: the filter buttons are
 *   on-page controls, not site navigation.
 * EXPECTED GA4 IMPACT: view_item_list +1; no page_view.
 * VERIFICATION: Click "Sale": one view_item_list, item_list_id category_sale.
 * FAILURE BEHAVIOR: Unknown filter -> treated as "all".
 * DUPLICATE RISK: Clicking the active filter again does nothing.
 */
function applyProductFilter(filterId) {
  var current = getQueryParameter("collection") ? null : (getQueryParameter("category") || "all");
  if (filterId === current) {
    return;
  }
  var url = filterId === "all" ? "products.html" : "products.html?category=" + filterId;
  window.history.replaceState(null, "", url);
  markActiveFilter(filterId);
  markActiveNavigationLink(); // keep the header underline in step
  renderProductGrid(filterId, null);
}

/** FUNCTION: markActiveFilter(filterId) - highlights the active filter button. Analytics: None. */
function markActiveFilter(filterId) {
  var buttons = document.querySelectorAll("[data-filter]");
  for (var i = 0; i < buttons.length; i++) {
    var active = buttons[i].getAttribute("data-filter") === filterId;
    buttons[i].classList.toggle("is-active", active);
    buttons[i].setAttribute("aria-pressed", active ? "true" : "false");
  }
}

/**
 * FUNCTION: renderPhotoCredits()
 * PURPOSE: Lists every photographer under the grid (Unsplash credit).
 * Expected Analytics Effect: None.
 */
function renderPhotoCredits() {
  var box = document.getElementById("photo-credits");
  if (!box) {
    return;
  }
  var seen = {};
  var parts = [];
  for (var i = 0; i < window.PRODUCTS.length; i++) {
    var colors = window.PRODUCTS[i].colors;
    for (var c = 0; c < colors.length; c++) {
      for (var p = 0; p < colors[c].photos.length; p++) {
        var photo = colors[c].photos[p];
        if (!seen[photo.creditUrl]) {
          seen[photo.creditUrl] = true;
          parts.push('<a href="' + photo.creditUrl + '" target="_blank" rel="noopener">' + escapeHtml(photo.credit) + "</a>");
        }
      }
    }
  }
  box.innerHTML = "Photos from Unsplash (Unsplash License) by " + parts.join(", ") + ". Photos are illustrative and may not show the exact model named.";
}

/**
 * FUNCTION: initProductList()
 * PURPOSE: Builds the filter buttons and the grid on products.html.
 * Expected Analytics Effect: view_item_list once (renderProductGrid);
 * select_item when a tile is clicked (below).
 */
function initProductList() {
  var grid = document.getElementById("product-grid");
  if (!grid) {
    return;
  }
  var filterBar = document.getElementById("filter-bar");
  var collectionId = getQueryParameter("collection");
  var filterId = collectionId ? null : (getQueryParameter("category") || "all");
  var html = "";
  for (var i = 0; i < FILTERS.length; i++) {
    /* BUTTON: Filter (All / Men / Women / Kids / Sale)
       Handler: applyProductFilter(id). Result: grid changes without
       reloading. Analytics: view_item_list for the new list. */
    html += '<button type="button" class="chip" data-filter="' + FILTERS[i].id + '" aria-pressed="false">' + FILTERS[i].label + "</button>";
  }
  filterBar.innerHTML = html;
  markActiveFilter(filterId);
  filterBar.addEventListener("click", function (event) {
    var button = event.target.closest("[data-filter]");
    if (button) {
      applyProductFilter(button.getAttribute("data-filter"));
    }
  });

  renderProductGrid(filterId, collectionId);
  renderPhotoCredits();

  /**
   * Tile click -> select_item (selection_method "grid").
   * EXPECTED GA4 IMPACT: select_item +1, then page_view + view_item on
   * the product page. Sent once per click; the page then changes.
   * FAILURE: tracking never blocks the link.
   */
  grid.addEventListener("click", function (event) {
    var tile = event.target.closest("[data-product-id]");
    if (!tile) {
      return;
    }
    var product = getProductById(tile.getAttribute("data-product-id"));
    var listId = grid.getAttribute("data-list-id");
    var listName = grid.getAttribute("data-list-name");
    trackEcommerceEvent("select_item", {
      item_list_id: listId,
      item_list_name: listName,
      items: [buildAnalyticsItem(product, { index: Number(tile.getAttribute("data-tile-index")), listId: listId, listName: listName })]
    }, { selection_method: "grid" });
  });
}

/* ============================================================
 * SECTION C: PRODUCT DETAILS (products.html?id=...)
 * ============================================================ */

/**
 * FUNCTION: renderProductDetails(product)
 *
 * PURPOSE: Fills the product page: photos, name, price, colors, sizes,
 * quantity, Add to Bag, description and photo credit.
 * TRIGGER: products.html?id=<id> loads (e.g. from SHOP NOW or a tile).
 *
 * EXPECTED WEBSITE RESULT: The details view replaces the grid.
 *
 * EXPECTED ANALYTICS RESULT:
 * GTM / GA4 event: view_item (once per page load)
 * Parameters: currency "INR", value = price, items: [ product,
 *   item_variant = first colour, quantity 1 ].
 *
 * EXPECTED GA4 IMPACT: view_item +1 together with the page_view of
 *   this page. Shows in "Items viewed".
 * VERIFICATION: Open products.html?id=air-max-excee: one view_item.
 * FAILURE BEHAVIOR: Unknown id -> "Sneaker not found" message and NO
 *   view_item.
 * DUPLICATE RISK: Changing colour does not resend view_item.
 */
function renderProductDetails(product) {
  detailState = { product: product, colorIndex: 0, size: null, quantity: 1 };
  document.title = product.name + " | " + window.STORE_CONFIG.storeName;
  document.getElementById("detail-name").textContent = product.name;
  document.getElementById("detail-tagline").textContent = product.tagline;
  document.getElementById("detail-price").innerHTML = buildPriceHtml(product);
  document.getElementById("detail-description").textContent = product.description;
  document.getElementById("detail-category").textContent = product.category === "kids" ? "Kids' shoe" : (product.category === "women" ? "Women's shoe" : "Men's shoe");

  var colorsHtml = "";
  for (var c = 0; c < product.colors.length; c++) {
    /* BUTTON: Colour swatch
       Handler: selectColor(index). Result: photos and colour name change.
       Analytics: none (see selectColor). */
    colorsHtml += '<button type="button" class="swatch" data-color-index="' + c + '" style="--swatch:' + product.colors[c].hex + '" aria-label="' + escapeHtml(product.colors[c].name) + '" aria-pressed="false"></button>';
  }
  document.getElementById("detail-colors").innerHTML = colorsHtml;

  var sizesHtml = "";
  for (var s = 0; s < product.sizes.length; s++) {
    var size = product.sizes[s];
    var soldOut = product.soldOutSizes.indexOf(size) !== -1;
    /* BUTTON: Size (one per size; sold-out sizes are disabled)
       Handler: selectSize(size). Result: size highlighted, error cleared.
       Analytics: size_selected. */
    sizesHtml += '<button type="button" class="size" data-size="' + escapeHtml(size) + '" aria-pressed="false"' + (soldOut ? ' disabled aria-label="UK ' + escapeHtml(size) + ', sold out"' : ' aria-label="UK ' + escapeHtml(size) + '"') + ">" + escapeHtml(size) + "</button>";
  }
  document.getElementById("detail-sizes").innerHTML = sizesHtml;
  document.getElementById("detail-quantity").textContent = "1";

  selectColor(0);
  document.getElementById("detail-view").hidden = false;

  trackEcommerceEvent("view_item", {
    currency: window.STORE_CONFIG.currency,
    value: product.price,
    items: [buildAnalyticsItem(product, { colorName: product.colors[0].name })]
  });
  rememberRecentlyViewed(product.id);
}

/**
 * FUNCTION: selectColor(colorIndex)
 *
 * PURPOSE: Shows the photos and name of another colourway.
 * TRIGGER: A colour swatch on the product page.
 * EXPECTED WEBSITE RESULT: Main photo, thumbnails, colour name and photo
 *   credit change. The chosen size is kept.
 * EXPECTED ANALYTICS RESULT:
 * Expected Analytics Effect: No direct event; possible indirect effect
 * described below. The chosen colour is sent later as part of
 * item_variant in add_to_cart.
 * VERIFICATION: Air Max 1 has three colours; click each.
 * FAILURE BEHAVIOR: Invalid index -> ignored.
 */
function selectColor(colorIndex) {
  var product = detailState.product;
  var color = product.colors[colorIndex];
  if (!color) {
    return;
  }
  detailState.colorIndex = colorIndex;
  document.getElementById("detail-color-name").textContent = color.name;
  showGalleryPhoto(0);

  var thumbs = "";
  for (var p = 0; p < color.photos.length; p++) {
    /* BUTTON: Photo thumbnail. Handler: showGalleryPhoto(index).
       Result: main photo changes. Analytics: none. */
    thumbs += '<button type="button" class="thumb" data-photo-index="' + p + '" aria-label="Show photo ' + (p + 1) + '"><img src="' + resizeImageUrl(color.photos[p].url, 200) + '" alt="" width="72" height="72"></button>';
  }
  var thumbBox = document.getElementById("detail-thumbs");
  thumbBox.innerHTML = color.photos.length > 1 ? thumbs : "";
  markGalleryThumb(0);

  var swatches = document.querySelectorAll("[data-color-index]");
  for (var s = 0; s < swatches.length; s++) {
    var active = Number(swatches[s].getAttribute("data-color-index")) === colorIndex;
    swatches[s].classList.toggle("is-active", active);
    swatches[s].setAttribute("aria-pressed", active ? "true" : "false");
  }
}

/** FUNCTION: showGalleryPhoto(photoIndex) - large photo + credit. Analytics: None. */
function showGalleryPhoto(photoIndex) {
  var photo = detailState.product.colors[detailState.colorIndex].photos[photoIndex];
  if (!photo) {
    return;
  }
  var image = document.getElementById("detail-image");
  image.src = photo.url;
  image.alt = photo.alt;
  document.getElementById("detail-credit").innerHTML = 'Photo: <a href="' + photo.creditUrl + '" target="_blank" rel="noopener">' + escapeHtml(photo.credit) + "</a> on Unsplash";
  markGalleryThumb(photoIndex);
}

/** FUNCTION: markGalleryThumb(photoIndex) - outlines the active thumbnail. Analytics: None. */
function markGalleryThumb(photoIndex) {
  var thumbs = document.querySelectorAll("[data-photo-index]");
  for (var i = 0; i < thumbs.length; i++) {
    thumbs[i].classList.toggle("is-active", Number(thumbs[i].getAttribute("data-photo-index")) === photoIndex);
  }
}

/**
 * FUNCTION: selectSize(size)
 *
 * PURPOSE: Chooses a shoe size for Add to Bag.
 * TRIGGER: Clicking an available size button.
 *
 * EXPECTED WEBSITE RESULT: The size turns black; "Select a size" error
 * (if visible) disappears.
 *
 * EXPECTED ANALYTICS RESULT:
 * GTM / GA4 event: size_selected (custom event)
 * Parameters: item_id, item_name, size (e.g. "8"), size_system "UK".
 *
 * EXPECTED GA4 IMPACT: size_selected +1; no page_view; engagement
 *   unchanged.
 * VERIFICATION: Click size 8: one size_selected with size "8".
 * FAILURE BEHAVIOR: Sold-out sizes are disabled buttons and cannot be
 *   clicked; an invalid size is ignored without an event.
 * DUPLICATE RISK: Clicking the size that is already selected sends
 *   nothing.
 */
function selectSize(size) {
  var product = detailState.product;
  if (product.sizes.indexOf(size) === -1 || product.soldOutSizes.indexOf(size) !== -1 || size === detailState.size) {
    return;
  }
  detailState.size = size;
  var buttons = document.querySelectorAll("[data-size]");
  for (var i = 0; i < buttons.length; i++) {
    var active = buttons[i].getAttribute("data-size") === size;
    buttons[i].classList.toggle("is-active", active);
    buttons[i].setAttribute("aria-pressed", active ? "true" : "false");
  }
  setSizeError("");
  trackAnalyticsEvent("size_selected", {
    item_id: product.id,
    item_name: product.name,
    size: size,
    size_system: "UK"
  });
}

/** FUNCTION: setSizeError(message) - shows/clears the red size message. Analytics: None. */
function setSizeError(message) {
  var error = document.getElementById("size-error");
  error.textContent = message;
  document.getElementById("detail-sizes").classList.toggle("has-error", Boolean(message));
}

/**
 * FUNCTION: changeDetailQuantity(change)
 * PURPOSE: +/- buttons next to Add to Bag (1 to the maximum in config.js).
 * Expected Analytics Effect: None. The final quantity is sent in
 * add_to_cart when the visitor clicks Add to Bag.
 */
function changeDetailQuantity(change) {
  var max = window.STORE_CONFIG.maxQuantityPerLine;
  detailState.quantity = Math.min(max, Math.max(1, detailState.quantity + change));
  document.getElementById("detail-quantity").textContent = detailState.quantity;
  document.getElementById("detail-qty-minus").disabled = detailState.quantity <= 1;
  document.getElementById("detail-qty-plus").disabled = detailState.quantity >= max;
}

/**
 * BUTTON: Add to Bag
 * FUNCTION: handleAddToBag()
 *
 * PURPOSE: Adds the selected sneaker (colour, size, quantity) to the bag.
 * TRIGGER: User clicks "Add to Bag".
 *
 * EXPECTED WEBSITE RESULT: Product is added to the bag. Bag count and
 * total update; a "View bag" link appears; toast "Added to bag".
 *
 * EXPECTED ANALYTICS EVENT: add_to_cart (sent by addProductToCart)
 * EXPECTED PARAMETERS: currency INR, value = price x quantity,
 *   items: selected product with item_variant "Colour - UK size".
 *
 * VERIFICATION (Test B):
 * 1. Open GTM Preview.  2. Pick a size, click Add to Bag once.
 * 3. Confirm ONE add_to_cart.  4. Check it in GA4 DebugView.
 *
 * FAILURE BEHAVIOR (Test E): No size selected -> red message "Please
 * select a size", focus moves to the sizes, and add_to_cart is NOT sent.
 */
function handleAddToBag() {
  if (!detailState.size) {
    setSizeError("Please select a size.");
    var firstSize = document.querySelector("[data-size]:not([disabled])");
    if (firstSize) {
      firstSize.focus();
    }
    return;
  }
  var result = addProductToCart(detailState.product.id, detailState.colorIndex, detailState.size, detailState.quantity);
  var status = document.getElementById("add-status");
  if (!result.ok) {
    setSizeError(result.message);
    return;
  }
  status.hidden = false;
  document.getElementById("add-status-text").textContent = result.limited
    ? "Added " + result.added + " (bag limit reached)."
    : "Added " + result.added + " to your bag.";
  showToast("Added to bag");
}

/**
 * FUNCTION: rememberRecentlyViewed(productId)
 * PURPOSE: Keeps the last 4 viewed products in localStorage for the
 * Account panel. Only product ids are stored.
 * Expected Analytics Effect: None.
 */
function rememberRecentlyViewed(productId) {
  try {
    var ids = JSON.parse(window.localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
    ids = ids.filter(function (id) { return id !== productId; });
    ids.unshift(productId);
    window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids.slice(0, 4)));
  } catch (error) {
    // Storage blocked: the Account panel simply shows no history.
  }
}

/**
 * FUNCTION: initProductDetails()
 * PURPOSE: On products.html?id=..., shows the details view and connects
 * swatches, sizes, quantity, thumbnails and Add to Bag.
 * Expected Analytics Effect: view_item once (renderProductDetails).
 */
function initProductDetails() {
  var view = document.getElementById("detail-view");
  var productId = getQueryParameter("id");
  if (!view || !productId) {
    return false;
  }
  document.getElementById("list-view").hidden = true;
  var product = getProductById(productId);
  if (!product) {
    document.getElementById("not-found").hidden = false;
    return true;
  }
  renderProductDetails(product);

  view.addEventListener("click", function (event) {
    var swatch = event.target.closest("[data-color-index]");
    if (swatch) { selectColor(Number(swatch.getAttribute("data-color-index"))); return; }
    var size = event.target.closest("[data-size]");
    if (size) { selectSize(size.getAttribute("data-size")); return; }
    var thumb = event.target.closest("[data-photo-index]");
    if (thumb) { showGalleryPhoto(Number(thumb.getAttribute("data-photo-index"))); }
  });
  document.getElementById("detail-qty-minus").addEventListener("click", function () { changeDetailQuantity(-1); });
  document.getElementById("detail-qty-plus").addEventListener("click", function () { changeDetailQuantity(1); });
  document.getElementById("add-to-bag-btn").addEventListener("click", handleAddToBag);
  changeDetailQuantity(0);
  return true;
}

document.addEventListener("DOMContentLoaded", function () {
  initHero();
  if (!initProductDetails()) {
    initProductList();
  }
});
