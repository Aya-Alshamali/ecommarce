/**
 * ============================================================
 * FILE: assets/js/main.js
 * ============================================================
 *
 * 1. WHAT THIS FILE IS USED FOR
 *    Small helpers shared by every page, plus the system that opens
 *    and closes "panels" (search, account, menu, collections, bag).
 *
 * 2. MAIN COMPONENTS
 *    - Helpers: formatPrice(), escapeHtml(), getProductById(),
 *      getQueryParameter(), resizeImageUrl(), getIconSvg().
 *    - Panels: openPanel(), closePanel(), closeAllPanels().
 *    - Toast messages: showToast().
 *    - Footer: social links, disclaimer and year from config.js.
 *
 * 3. IMPORTANT VARIABLES
 *    - currentlyOpenPanel: the panel that is open right now (or null).
 *    - panelOpener: the button that opened it (focus returns there).
 *
 * 4. DEPENDENCIES
 *    - config.js and analytics.js (loaded in <head>).
 *    - Loaded BEFORE navigation.js, cart.js and products.js, which use
 *      these helpers.
 *
 * 5. SAFE CUSTOMIZATION AREAS
 *    - Icon drawings in getIconSvg().
 *    - Toast duration (TOAST_DURATION_MS).
 *
 * 6. ANALYTICS CONFIGURATION LOCATION
 *    IDs: config.js. This file sends NO events of its own; panels that
 *    need tracking (bag -> view_cart) send it from their own file.
 * ============================================================
 */

// ==========================================
// GA4 AND GTM EVENT TRACKING SECTION
// ==========================================
// Purpose: none of the functions in this file track anything. Opening a
// panel is tracked (when needed) by the function that asked for it, e.g.
// openShoppingCart() in cart.js sends view_cart. Keeping tracking out of
// the shared openPanel() helper prevents one click being counted twice.

var TOAST_DURATION_MS = 3200;
var currentlyOpenPanel = null;
var panelOpener = null;

/* ============================================================
 * SECTION A: SMALL HELPERS (Expected Analytics Effect: None)
 * ============================================================ */

/**
 * FUNCTION: formatPrice(amount)
 * PURPOSE: 12995 -> "₹12,995" using the currency in config.js.
 */
function formatPrice(amount) {
  return new Intl.NumberFormat(window.STORE_CONFIG.currencyLocale, {
    style: "currency",
    currency: window.STORE_CONFIG.currency,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * FUNCTION: escapeHtml(text)
 * PURPOSE: Makes any text safe to put inside HTML (e.g. a search term
 * typed by a visitor) so it is shown as text, never run as code.
 */
function escapeHtml(text) {
  var div = document.createElement("div");
  div.textContent = text === undefined || text === null ? "" : String(text);
  return div.innerHTML;
}

/**
 * FUNCTION: getProductById(productId)
 * PURPOSE: Finds one product in window.PRODUCTS. Returns null if missing.
 */
function getProductById(productId) {
  for (var i = 0; i < window.PRODUCTS.length; i++) {
    if (window.PRODUCTS[i].id === productId) {
      return window.PRODUCTS[i];
    }
  }
  return null;
}

/**
 * FUNCTION: getQueryParameter(name)
 * PURPOSE: Reads ?name=value from the address bar, e.g. ?id=air-max-90.
 */
function getQueryParameter(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/**
 * FUNCTION: resizeImageUrl(url, width)
 * PURPOSE: Asks Unsplash for a smaller copy of a photo (faster thumbnails)
 * by changing the "w=" value in the photo address.
 */
function resizeImageUrl(url, width) {
  return url.replace(/([?&])w=\d+/, "$1w=" + width);
}

/**
 * FUNCTION: getMainPhoto(product, colorIndex)
 * PURPOSE: First photo of a product's colorway (colorway 0 by default).
 */
function getMainPhoto(product, colorIndex) {
  var color = product.colors[colorIndex || 0] || product.colors[0];
  return color.photos[0];
}

/**
 * FUNCTION: getIconSvg(name)
 * PURPOSE: Returns a small SVG icon by name. All icons are simple line
 * drawings in the current text color. Add new ones to the list.
 */
function getIconSvg(name) {
  var open = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';
  var paths = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrowLeft: '<path d="M15 5l-7 7 7 7"/>',
    arrowRight: '<path d="M9 5l7 7-7 7"/>',
    arrowUpRight: '<path d="M7 17 17 7M9 7h8v8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    check: '<path d="M5 12l4 4L19 7"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor"/>',
    youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor"/>',
    facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>',
    x: '<path d="M4 4l16 16M20 4 4 20"/>'
  };
  return paths[name] ? open + paths[name] + "</svg>" : "";
}

/* ============================================================
 * SECTION B: PANELS (search, account, menu, collections, bag)
 * A panel is any element with class "panel" and the hidden attribute.
 * ============================================================ */

/**
 * FUNCTION: openPanel(panelId, openerButton)
 *
 * PURPOSE: Shows one panel, closes any other, dims the page, moves
 * keyboard focus inside the panel and marks the opener as expanded.
 *
 * INPUTS: panelId (e.g. "cart-panel"), openerButton (optional element).
 * OUTPUT: true if opened, false if the panel does not exist.
 *
 * Expected Analytics Effect: None. The CALLER decides whether opening is
 * tracked (only the bag is, with view_cart). See the section note above.
 */
function openPanel(panelId, openerButton) {
  var panel = document.getElementById(panelId);
  if (!panel) {
    return false;
  }
  if (currentlyOpenPanel && currentlyOpenPanel !== panel) {
    closePanel();
  }
  panel.hidden = false;
  // Next frame: add the class that starts the slide/fade animation.
  window.requestAnimationFrame(function () {
    panel.classList.add("is-open");
  });
  currentlyOpenPanel = panel;
  panelOpener = openerButton || document.activeElement;
  if (openerButton) {
    openerButton.setAttribute("aria-expanded", "true");
  }
  var backdrop = document.getElementById("panel-backdrop");
  if (backdrop) {
    backdrop.hidden = false;
  }
  document.body.classList.add("panel-open");
  var focusTarget = panel.querySelector("[data-autofocus]") || panel.querySelector("button, a, input, select");
  if (focusTarget) {
    focusTarget.focus();
  }
  return true;
}

/**
 * FUNCTION: closePanel()
 * PURPOSE: Hides the open panel and returns focus to the button that
 * opened it. Triggered by the X button, the dark backdrop or Escape.
 * Expected Analytics Effect: None (closing is not tracked).
 */
function closePanel() {
  if (!currentlyOpenPanel) {
    return;
  }
  var panel = currentlyOpenPanel;
  panel.classList.remove("is-open");
  panel.hidden = true;
  currentlyOpenPanel = null;
  var backdrop = document.getElementById("panel-backdrop");
  if (backdrop) {
    backdrop.hidden = true;
  }
  document.body.classList.remove("panel-open");
  if (panelOpener) {
    if (panelOpener.hasAttribute("aria-expanded")) {
      panelOpener.setAttribute("aria-expanded", "false");
    }
    if (panelOpener.focus) {
      panelOpener.focus();
    }
  }
  panelOpener = null;
}

/* ============================================================
 * SECTION C: TOAST MESSAGES (short pop-up confirmations)
 * ============================================================ */

/**
 * FUNCTION: showToast(message, type)
 * PURPOSE: Shows a short message at the bottom of the screen, e.g.
 * "Added to bag". type = "success" (default) or "error".
 * Screen readers announce it (the container has aria-live).
 * Expected Analytics Effect: None.
 */
function showToast(message, type) {
  var container = document.getElementById("toast-container");
  if (!container) {
    return;
  }
  var toast = document.createElement("div");
  toast.className = "toast" + (type === "error" ? " toast--error" : "");
  toast.textContent = message;
  container.appendChild(toast);
  window.setTimeout(function () {
    toast.classList.add("is-leaving");
    window.setTimeout(function () { toast.remove(); }, 300);
  }, TOAST_DURATION_MS);
}

/* ============================================================
 * SECTION D: PAGE SETUP
 * ============================================================ */

/**
 * FUNCTION: fillFooter()
 * PURPOSE: Writes the social links, disclaimer and year from config.js.
 * Expected Analytics Effect: None. Social links are external; if GA4
 * Enhanced Measurement "Outbound clicks" is on, GA4 records them as an
 * automatic "click" event (not sent by this code).
 */
function fillFooter() {
  var links = document.querySelectorAll("[data-social]");
  for (var i = 0; i < links.length; i++) {
    var url = window.STORE_CONFIG.socialLinks[links[i].getAttribute("data-social")];
    if (url) {
      links[i].setAttribute("href", url);
    }
  }
  var disclaimer = document.querySelectorAll("[data-disclaimer]");
  for (var d = 0; d < disclaimer.length; d++) {
    disclaimer[d].textContent = window.STORE_CONFIG.disclaimer;
  }
  var year = document.getElementById("current-year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }
}

/**
 * FUNCTION: initPanels()
 * PURPOSE: Makes every [data-close-panel] button, the backdrop and the
 * Escape key close the open panel.
 * Expected Analytics Effect: None.
 */
function initPanels() {
  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-close-panel]") || event.target.id === "panel-backdrop") {
      closePanel();
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closePanel();
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initPanels();
  fillFooter();
});
