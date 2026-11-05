/**
 * ============================================================
 * FILE: assets/js/navigation.js
 * ============================================================
 *
 * 1. WHAT THIS FILE IS USED FOR
 *    Everything in the header: navigation links, the hamburger menu
 *    panel, the Collections panel, the Search panel and the demo
 *    Account panel.
 *
 * 2. MAIN COMPONENTS
 *    - handleNavigationClick()   tracks header/menu/footer link clicks
 *    - openMenuPanel()           hamburger menu
 *    - openCollectionsPanel()    list of collections from config.js
 *    - openSearchPanel(), searchProducts(), handleSearchSubmit()
 *    - openAccountPanel()        demonstration account area
 *
 * 3. IMPORTANT VARIABLES
 *    - RECENTLY_VIEWED_KEY: localStorage key written by products.js and
 *      read here for the Account panel.
 *
 * 4. DEPENDENCIES
 *    config.js, analytics.js, main.js (openPanel, escapeHtml,
 *    formatPrice, getProductById, resizeImageUrl, getMainPhoto).
 *
 * 5. SAFE CUSTOMIZATION AREAS
 *    - Header link text and order: in each HTML file.
 *    - Collections: config.js -> COLLECTIONS.
 *    - Account panel wording: openAccountPanel().
 *
 * 6. ANALYTICS CONFIGURATION LOCATION
 *    IDs: config.js. Events sent from here:
 *    navigation_clicked and search (GA4 recommended event name).
 * ============================================================
 */

// ==========================================
// GA4 AND GTM EVENT TRACKING SECTION
// ==========================================
// Purpose: header interactions use trackAnalyticsEvent() from
// analytics.js.
// - navigation_clicked: every nav link, AND the Collections button
//   (it is a navigation choice even though it opens a panel).
// - search: once per submitted search, never per keystroke.
// - Opening the menu, search or account panel is NOT tracked by itself.

var RECENTLY_VIEWED_KEY = "airmax_recently_viewed";

/**
 * FUNCTION: handleNavigationClick(event)
 *
 * PURPOSE: Records a click on any link marked data-nav-location
 * (header Men/Women/Kids/Sale, logo, menu panel, collections panel,
 * footer), then lets the browser follow the link.
 *
 * TRIGGER: Clicking one of those links.
 *
 * EXPECTED WEBSITE RESULT: products.html opens filtered by the chosen
 * category or collection (or the linked page). Panels close.
 *
 * EXPECTED ANALYTICS RESULT:
 * GTM / GA4 event: navigation_clicked
 * Parameters:
 * - link_text:     visible text, e.g. "Men"
 * - link_url:      e.g. "products.html?category=men"
 * - link_location: "header", "menu_panel", "collections_panel", "footer"
 *
 * EXPECTED GA4 IMPACT:
 * - navigation_clicked count: +1.
 * - page_view: +1 on the NEXT page (sent by the GA4 tag in GTM when
 *   that page loads, not by this function).
 * - Engagement: a second page view makes the session "engaged".
 * - The next page (products.html) also sends view_item_list.
 *
 * VERIFICATION: GTM Preview: click "Men"; navigation_clicked appears
 *   just before the new page's Container Loaded / page_view.
 * FAILURE BEHAVIOR: Tracking never blocks the link.
 * DUPLICATE RISK: Do not also create a GTM "All Links" trigger that
 *   sends a GA4 event for these links.
 */
function handleNavigationClick(event) {
  var link = event.currentTarget;
  trackAnalyticsEvent("navigation_clicked", {
    link_text: link.getAttribute("data-nav-label") || link.textContent.trim(),
    link_url: link.getAttribute("href"),
    link_location: link.getAttribute("data-nav-location")
  });
}

/**
 * FUNCTION: attachNavigationTracking(container)
 * PURPOSE: Connects handleNavigationClick to every [data-nav-location]
 * link inside container (default: the whole page). Panels call this
 * after drawing new links. Each link is connected only once.
 * Expected Analytics Effect: None directly.
 */
function attachNavigationTracking(container) {
  var links = (container || document).querySelectorAll("a[data-nav-location]");
  for (var i = 0; i < links.length; i++) {
    if (!links[i].hasAttribute("data-nav-ready")) {
      links[i].setAttribute("data-nav-ready", "true");
      links[i].addEventListener("click", handleNavigationClick);
    }
  }
}

/**
 * FUNCTION: markActiveNavigationLink()
 * PURPOSE: Underlines the header link that matches the current filter
 * (?category=men underlines "Men"). Also called by products.js after a
 * filter button changes the address bar.
 * Expected Analytics Effect: None.
 */
function markActiveNavigationLink() {
  var category = getQueryParameter("category");
  var links = document.querySelectorAll('.main-nav a[href*="category="]');
  for (var i = 0; i < links.length; i++) {
    var active = Boolean(category) && links[i].getAttribute("href").indexOf("category=" + category) !== -1;
    links[i].classList.toggle("is-active", active);
    if (active) {
      links[i].setAttribute("aria-current", "page");
    } else {
      links[i].removeAttribute("aria-current");
    }
  }
}

/**
 * FUNCTION: openMenuPanel(openerButton)
 *
 * PURPOSE: Opens the hamburger navigation panel.
 * TRIGGER: The ☰ button in the header.
 * EXPECTED WEBSITE RESULT: A panel slides in with all store links.
 * EXPECTED ANALYTICS RESULT:
 * Expected Analytics Effect: No direct event; possible indirect effect
 * described below. Opening is not tracked. Each link inside sends
 * navigation_clicked (link_location: "menu_panel") when clicked.
 * VERIFICATION: Click ☰: panel opens; nothing in GTM Preview yet.
 * FAILURE BEHAVIOR: If the panel is missing nothing happens.
 */
function openMenuPanel(openerButton) {
  openPanel("menu-panel", openerButton);
}

/**
 * FUNCTION: openCollectionsPanel(openerButton)
 *
 * PURPOSE: Shows every collection from config.js with its product count.
 * TRIGGER: "Collections" in the header or in the menu panel.
 *
 * EXPECTED WEBSITE RESULT: A panel lists the collections; each one
 * links to products.html?collection=<id>.
 *
 * EXPECTED ANALYTICS RESULT:
 * GTM / GA4 event: navigation_clicked
 * Parameters: link_text "Collections", link_url "#collections",
 *   link_location "header" or "menu_panel".
 * Clicking a collection afterwards sends a second navigation_clicked
 * (link_location "collections_panel") - two different user choices.
 *
 * EXPECTED GA4 IMPACT: navigation_clicked +1; no page_view (panel only).
 * VERIFICATION: Click Collections: one navigation_clicked.
 * FAILURE BEHAVIOR: Panel missing -> nothing opens and NO event.
 * DUPLICATE RISK: One listener per Collections button.
 */
function openCollectionsPanel(openerButton) {
  var list = document.getElementById("collections-list");
  if (!list) {
    return;
  }
  var html = "";
  for (var i = 0; i < window.COLLECTIONS.length; i++) {
    var collection = window.COLLECTIONS[i];
    var count = 0;
    for (var p = 0; p < window.PRODUCTS.length; p++) {
      if (window.PRODUCTS[p].collection === collection.id) {
        count++;
      }
    }
    /* LINK: one collection
       Handler: handleNavigationClick (navigation_clicked, collections_panel).
       Result: products.html filtered to this collection. */
    html += '<li><a class="collection-link" href="products.html?collection=' + collection.id + '" data-nav-location="collections_panel" data-nav-label="' + escapeHtml(collection.name) + '">' +
      "<strong>" + escapeHtml(collection.name) + "</strong><span>" + escapeHtml(collection.text) + "</span>" +
      '<em>' + count + (count === 1 ? " style" : " styles") + "</em></a></li>";
  }
  list.innerHTML = html;
  attachNavigationTracking(list);
  if (openPanel("collections-panel", openerButton)) {
    trackAnalyticsEvent("navigation_clicked", {
      link_text: "Collections",
      link_url: "#collections",
      link_location: openerButton && openerButton.getAttribute("data-nav-location") || "header"
    });
  }
}

/**
 * FUNCTION: openSearchPanel(openerButton)
 *
 * PURPOSE: Opens the search panel with the cursor in the search box.
 * TRIGGER: The magnifier icon in the header.
 * EXPECTED WEBSITE RESULT: Panel opens with popular suggestions.
 * EXPECTED ANALYTICS RESULT:
 * Expected Analytics Effect: No direct event; possible indirect effect
 * described below. Only a SUBMITTED search sends "search" (see
 * handleSearchSubmit). A result click leads to products.html, which
 * sends view_item there.
 * VERIFICATION: Open the panel: nothing new in GTM Preview.
 * FAILURE BEHAVIOR: Panel missing -> nothing happens.
 */
function openSearchPanel(openerButton) {
  var input = document.getElementById("search-input");
  if (input) {
    input.value = "";
  }
  renderSearchResults([], "");
  openPanel("search-panel", openerButton);
}

/**
 * FUNCTION: searchProducts(query)
 * PURPOSE: Finds products whose name, category, collection, colors or
 * tagline contain EVERY typed word (not case-sensitive).
 * INPUT: query text. OUTPUT: array of products (may be empty).
 * Expected Analytics Effect: None (pure lookup).
 */
function searchProducts(query) {
  var words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }
  var results = [];
  for (var i = 0; i < window.PRODUCTS.length; i++) {
    var product = window.PRODUCTS[i];
    var text = [product.name, product.category, product.collection, product.tagline, product.originalPrice ? "sale" : ""];
    for (var c = 0; c < product.colors.length; c++) {
      text.push(product.colors[c].name);
    }
    var haystack = text.join(" ").toLowerCase();
    var allFound = true;
    for (var w = 0; w < words.length; w++) {
      if (haystack.indexOf(words[w]) === -1) {
        allFound = false;
        break;
      }
    }
    if (allFound) {
      results.push(product);
    }
  }
  return results;
}

/**
 * FUNCTION: renderSearchResults(results, query)
 * PURPOSE: Draws result links (or a hint / "no results") in the panel.
 * The typed text is escaped, so it is always shown as plain text.
 * Expected Analytics Effect: None.
 */
function renderSearchResults(results, query) {
  var box = document.getElementById("search-results");
  if (!box) {
    return;
  }
  if (!query.trim()) {
    box.innerHTML = '<p class="muted">Popular: <button type="button" class="link-btn" data-search-suggestion="270">270</button>, <button type="button" class="link-btn" data-search-suggestion="red">red</button>, <button type="button" class="link-btn" data-search-suggestion="kids">kids</button>, <button type="button" class="link-btn" data-search-suggestion="sale">sale</button></p>';
    return;
  }
  if (results.length === 0) {
    box.innerHTML = '<p class="muted">No sneakers match &ldquo;' + escapeHtml(query) + '&rdquo;. Try another word or <a href="products.html">browse all</a>.</p>';
    return;
  }
  var html = '<p class="muted">' + results.length + (results.length === 1 ? " result" : " results") + '</p><ul class="search-list">';
  for (var i = 0; i < results.length; i++) {
    var product = results[i];
    /* LINK: search result -> product page (which sends view_item).
       Not tracked separately; the search event already recorded the search. */
    html += '<li><a href="products.html?id=' + product.id + '">' +
      '<img src="' + resizeImageUrl(getMainPhoto(product).url, 160) + '" alt="" width="56" height="56" loading="lazy">' +
      "<span><strong>" + escapeHtml(product.name) + "</strong><small>" + formatPrice(product.price) + "</small></span></a></li>";
  }
  box.innerHTML = html + "</ul>";
}

/**
 * FUNCTION: handleSearchSubmit(event)
 *
 * PURPOSE: Runs the search and records it.
 * TRIGGER: Enter in the search box, the Search button, or a "Popular"
 *   suggestion button.
 *
 * EXPECTED WEBSITE RESULT: Matching sneakers listed in the panel.
 *
 * EXPECTED ANALYTICS RESULT:
 * GTM / GA4 event: search (GA4 recommended event name)
 * Parameters:
 * - search_term:  the typed text, trimmed, lower-case, max 100 chars
 * - result_count: number of matches (custom parameter)
 *
 * EXPECTED GA4 IMPACT:
 * - search count: +1 per submission; search_term appears in GA4's
 *   search report once registered as a dimension.
 * - page_view: unchanged.
 *
 * VERIFICATION: Type "red", press Enter: exactly one search event.
 *   Typing alone must send nothing.
 * FAILURE BEHAVIOR: Empty search -> hint shown, NO event.
 * DUPLICATE RISK: GA4 Enhanced Measurement "Site search" only reacts to
 *   URL query parameters (?q=), which this panel never uses, so GA4
 *   will not create a second automatic view_search_results.
 */
function handleSearchSubmit(event) {
  if (event) {
    event.preventDefault();
  }
  var query = document.getElementById("search-input").value;
  var results = searchProducts(query);
  renderSearchResults(results, query);
  if (!query.trim()) {
    return;
  }
  trackAnalyticsEvent("search", {
    search_term: query.trim().toLowerCase().slice(0, 100),
    result_count: results.length
  });
}

/**
 * FUNCTION: openAccountPanel(openerButton)
 *
 * PURPOSE: Opens the DEMONSTRATION account panel. There are no real
 * accounts: no sign-in, no passwords, nothing is stored on a server.
 * It shows the bag count and the sneakers viewed recently on this
 * device (from localStorage).
 * TRIGGER: The person icon in the header.
 *
 * EXPECTED ANALYTICS RESULT:
 * Expected Analytics Effect: No direct event; possible indirect effect
 * described below. Links inside lead to product pages (view_item there)
 * or open the bag (view_cart).
 * VERIFICATION: Open it: nothing new in GTM Preview.
 * FAILURE BEHAVIOR: Panel missing -> nothing happens.
 */
function openAccountPanel(openerButton) {
  var list = document.getElementById("recently-viewed");
  if (list) {
    var ids = [];
    try {
      ids = JSON.parse(window.localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
    } catch (error) {
      ids = [];
    }
    var html = "";
    for (var i = 0; i < ids.length; i++) {
      var product = getProductById(ids[i]);
      if (product) {
        html += '<li><a href="products.html?id=' + product.id + '"><img src="' + resizeImageUrl(getMainPhoto(product).url, 160) + '" alt="" width="56" height="56" loading="lazy"><span><strong>' + escapeHtml(product.name) + "</strong><small>" + formatPrice(product.price) + "</small></span></a></li>";
      }
    }
    list.innerHTML = html || '<li class="muted">Sneakers you open will appear here.</li>';
  }
  openPanel("account-panel", openerButton);
}

/**
 * FUNCTION: initNavigation()
 * PURPOSE: Connects every header button and link once per page.
 * Expected Analytics Effect: None directly.
 */
function initNavigation() {
  attachNavigationTracking(document);
  markActiveNavigationLink();

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-open]");
    if (button) {
      var which = button.getAttribute("data-open");
      if (which === "menu") { openMenuPanel(button); }
      if (which === "collections") { openCollectionsPanel(button); }
      if (which === "search") { openSearchPanel(button); }
      if (which === "account") { openAccountPanel(button); }
      return;
    }
    var suggestion = event.target.closest("[data-search-suggestion]");
    if (suggestion) {
      var searchInput = document.getElementById("search-input");
      searchInput.value = suggestion.getAttribute("data-search-suggestion");
      handleSearchSubmit();
      searchInput.focus(); // the clicked suggestion was redrawn away
    }
  });

  var form = document.getElementById("search-form");
  if (form) {
    form.addEventListener("submit", handleSearchSubmit);
    document.getElementById("search-input").addEventListener("input", function () {
      // Live preview while typing. NOT tracked (see handleSearchSubmit).
      renderSearchResults(searchProducts(this.value), this.value);
    });
  }
}

document.addEventListener("DOMContentLoaded", initNavigation);
