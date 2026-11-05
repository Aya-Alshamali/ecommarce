/**
 * ============================================================
 * FILE: assets/js/analytics.js
 * ============================================================
 *
 * 1. WHAT THIS FILE IS USED FOR
 *    The ONLY file that talks to Google Tag Manager (GTM). Every other
 *    file records user actions by calling one of two functions here:
 *      - trackAnalyticsEvent(name, parameters)  for normal events
 *      - trackEcommerceEvent(name, ecommerce)   for GA4 shop events
 *    Keeping all tracking in one place keeps event names consistent and
 *    makes duplicates easy to spot.
 *
 * 2. MAIN COMPONENTS
 *    - Consent banner handling (Accept / Decline).
 *    - loadGoogleTagManager(): inserts the official GTM snippet.
 *    - trackAnalyticsEvent(), trackEcommerceEvent(): dataLayer pushes.
 *    - buildAnalyticsItem(): turns a product into a GA4 "item".
 *
 * 3. IMPORTANT VARIABLES
 *    - window.dataLayer: the list GTM reads. Created immediately.
 *    - CONSENT_STORAGE_KEY: where the visitor's choice is remembered.
 *
 * 4. DEPENDENCIES
 *    - assets/js/config.js must load before this file.
 *    - Each HTML page contains the consent banner markup.
 *
 * 5. SAFE CUSTOMIZATION AREAS
 *    Normally none: change IDs in config.js. To add a new event, call
 *    trackAnalyticsEvent() from the function where the action happens
 *    and document it in ANALYTICS_GUIDE.md.
 *
 * 6. ANALYTICS CONFIGURATION LOCATION
 *    IDs: config.js -> STORE_CONFIG.analytics.
 *    Loader: loadGoogleTagManager() below.
 *    GA4 is configured INSIDE GTM. This site never loads gtag.js
 *    directly, so GA4 cannot be installed twice by accident.
 *
 * HOW TO TEST
 *    Console (F12): every push prints "[Air Max analytics] ...".
 *    Type window.dataLayer to see them all.
 *    With real IDs: GTM Preview + GA4 DebugView (see ANALYTICS_GUIDE.md).
 * ============================================================
 */

// ==========================================
// GA4 AND GTM EVENT TRACKING SECTION
// ==========================================
// Purpose: everything in this file. The dataLayer is created right away
// so that events pushed before GTM finishes loading are not lost.

window.dataLayer = window.dataLayer || [];

var CONSENT_STORAGE_KEY = "airmax_analytics_consent";

/**
 * FUNCTION: isAnalyticsConfigured()
 * PURPOSE: true when a real GTM ID (not the placeholder) is in config.js.
 * INPUTS: none. OUTPUT: true / false.
 * Expected Analytics Effect: None (reads a setting).
 */
function isAnalyticsConfigured() {
  var id = window.STORE_CONFIG.analytics.gtmContainerId || "";
  return id.indexOf("GTM-") === 0 && id.indexOf("XXXX") === -1;
}

/**
 * FUNCTION: getConsentStatus()
 * PURPOSE: Reads the saved choice: "granted", "denied" or null.
 * Expected Analytics Effect: None directly; decides whether GTM may load.
 */
function getConsentStatus() {
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch (error) {
    return null; // storage blocked (e.g. private mode): treat as "not chosen"
  }
}

/**
 * FUNCTION: handleConsentChoice(choice)
 *
 * PURPOSE: Saves the visitor's choice and loads GTM if they accepted.
 * TRIGGER: "Accept" or "Decline" in the cookie banner.
 * INPUT: "granted" or "denied".
 *
 * EXPECTED WEBSITE RESULT: The banner disappears.
 *
 * EXPECTED ANALYTICS RESULT:
 * - GTM event: "gtm.js" (Google's own start event) after Accept.
 * - GA4 event: page_view from the GA4 tag in GTM, sent NOW rather than
 *   at page load. No custom event records the choice itself.
 * - Decline: GTM never loads, GA4 receives nothing from this visitor.
 *
 * EXPECTED GA4 IMPACT:
 * - page_view: +1 after Accept (if GTM + GA4 tag are configured).
 * - Engagement time starts counting from Accept.
 * - Visitors who decline are missing from every GA4 number.
 *
 * VERIFICATION: Network tab shows googletagmanager.com/gtm.js after Accept.
 * FAILURE BEHAVIOR: If storage is blocked the choice is not remembered and
 *   the banner returns on the next page; GTM still loads for this page.
 * DUPLICATE RISK: None; loadGoogleTagManager() never loads twice.
 */
function handleConsentChoice(choice) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch (error) {
    logAnalyticsDebug("Consent choice could not be saved (storage blocked).");
  }
  var banner = document.getElementById("consent-banner");
  if (banner) {
    banner.hidden = true;
  }
  if (choice === "granted") {
    loadGoogleTagManager();
  }
}

/**
 * FUNCTION: loadGoogleTagManager()
 *
 * PURPOSE: Inserts the official GTM container snippet (ID from config.js).
 * TRIGGER: Page load when consent already exists, or right after Accept.
 *
 * EXPECTED WEBSITE RESULT: Nothing visible.
 *
 * EXPECTED ANALYTICS RESULT:
 * - GTM: "gtm.js" event, then GTM fires its tags.
 * - GA4: page_view from the GA4 Configuration (Google tag), plus any
 *   Enhanced Measurement events you enabled (scroll, click, ...).
 *
 * EXPECTED GA4 IMPACT: page_view +1 per page load (after consent).
 *
 * VERIFICATION: GTM Preview connects; Network tab lists gtm.js.
 * FAILURE BEHAVIOR: Placeholder ID or no consent: nothing loads and a
 *   console note explains why. Ad blockers can block gtm.js; the shop
 *   keeps working, only analytics is missing.
 * DUPLICATE RISK: A flag prevents inserting the container twice, which
 *   would double every page_view and event.
 */
function loadGoogleTagManager() {
  if (window.airmaxGtmLoaded) {
    return;
  }
  if (!isAnalyticsConfigured()) {
    logAnalyticsDebug("GTM not loaded: replace GTM-XXXXXXX in config.js to activate analytics.");
    return;
  }
  if (window.STORE_CONFIG.analytics.requireConsent && getConsentStatus() !== "granted") {
    logAnalyticsDebug("GTM not loaded: waiting for consent.");
    return;
  }
  var containerId = window.STORE_CONFIG.analytics.gtmContainerId;

  // --- Official GTM snippet, written so the ID comes from config.js ---
  window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
  var script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtm.js?id=" + containerId;
  var firstScript = document.getElementsByTagName("script")[0];
  firstScript.parentNode.insertBefore(script, firstScript);
  // --- End of official snippet ---

  window.airmaxGtmLoaded = true;
  logAnalyticsDebug("GTM container " + containerId + " loaded.");
}

/**
 * FUNCTION: trackAnalyticsEvent(eventName, parameters)
 *
 * PURPOSE: Records a NON-shop event (navigation_clicked, size_selected,
 *   shop_now_clicked, search) by pushing one object to the dataLayer.
 *
 * INPUTS:
 * - eventName:  lowercase_with_underscores name from ANALYTICS_GUIDE.md.
 * - parameters: plain object, e.g. { link_text: "Men" }.
 *               NEVER put names, emails, phone numbers or addresses here.
 * OUTPUT: none.
 *
 * EXPECTED WEBSITE RESULT: Nothing visible (console line in debug mode).
 *
 * EXPECTED ANALYTICS RESULT:
 * - Website SENDS: { event: eventName, ...parameters } to the dataLayer,
 *   even when GTM is not loaded (useful while learning).
 * - GA4 RECEIVES it only if GTM has a Custom Event trigger with the same
 *   name and a GA4 Event tag that forwards it.
 *
 * EXPECTED GA4 IMPACT:
 * - Event count for eventName: +1 per call.
 * - page_view: unchanged.
 * - Engagement time: unchanged by the event itself.
 *
 * VERIFICATION: Console line; GTM Preview event list; GA4 DebugView.
 * FAILURE BEHAVIOR: Empty name = ignored with a console warning. Never
 *   throws, so a tracking problem can never break a button.
 * DUPLICATE RISK: Only if a caller calls it twice for one action, or if a
 *   generic GTM "All Clicks" trigger also sends a GA4 event.
 */
function trackAnalyticsEvent(eventName, parameters) {
  if (!eventName) {
    logAnalyticsDebug("trackAnalyticsEvent called without a name. Ignored.");
    return;
  }
  var data = { event: eventName };
  var extra = parameters || {};
  for (var key in extra) {
    if (Object.prototype.hasOwnProperty.call(extra, key)) {
      data[key] = extra[key];
    }
  }
  window.dataLayer.push(data);
  logAnalyticsDebug("event sent to dataLayer:", data);
}

/**
 * FUNCTION: trackEcommerceEvent(eventName, ecommerceData, extraParameters)
 *
 * PURPOSE: Records a GA4 e-commerce event (view_item_list, select_item,
 *   view_item, add_to_cart, remove_from_cart, view_cart, begin_checkout)
 *   in the exact format GA4 expects:
 *     { event: "add_to_cart", ecommerce: { currency, value, items: [...] } }
 *
 * INPUTS:
 * - eventName:     one of the GA4 recommended e-commerce event names.
 * - ecommerceData: object with currency, value, items (and for lists
 *                  item_list_id / item_list_name).
 * - extraParameters (optional): custom details that are NOT part of
 *                  GA4's e-commerce format, e.g. { selection_method:
 *                  "arrow" }. They are placed next to "ecommerce".
 *
 * WHY TWO PUSHES:
 * Google recommends pushing { ecommerce: null } first. Otherwise GTM
 * merges the new "ecommerce" object with the previous one and an old
 * item could leak into the new event. The null push has no "event"
 * key, so it never triggers a tag and is NOT counted as an event.
 *
 * EXPECTED ANALYTICS RESULT:
 * - Website SENDS: { ecommerce: null } then
 *   { event: eventName, ecommerce: ecommerceData }.
 * - GA4 RECEIVES the event if the GA4 Event tag in GTM has
 *   "Send Ecommerce data" ticked (Data source: Data Layer).
 *
 * EXPECTED GA4 IMPACT:
 * - Event count for eventName: +1 per call.
 * - E-commerce reports (items viewed, added to cart, checkouts) update
 *   after GA4 processing (up to 24-48 h; DebugView is immediate).
 * - page_view: unchanged.
 *
 * VERIFICATION: GTM Preview -> the event -> "Data Layer" tab shows the
 *   ecommerce object; GA4 DebugView -> the event -> "items".
 * FAILURE BEHAVIOR: Missing name or items: ignored with a console note.
 * DUPLICATE RISK: Same as trackAnalyticsEvent(). The null push is not an
 *   event and cannot create a duplicate.
 */
function trackEcommerceEvent(eventName, ecommerceData, extraParameters) {
  if (!eventName || !ecommerceData || !ecommerceData.items || ecommerceData.items.length === 0) {
    logAnalyticsDebug("trackEcommerceEvent called without a name or items. Ignored.");
    return;
  }
  window.dataLayer.push({ ecommerce: null });
  var data = { event: eventName };
  var extra = extraParameters || {};
  for (var key in extra) {
    if (Object.prototype.hasOwnProperty.call(extra, key)) {
      data[key] = extra[key];
    }
  }
  data.ecommerce = ecommerceData;
  window.dataLayer.push(data);
  logAnalyticsDebug("e-commerce event sent to dataLayer:", data);
}

/**
 * FUNCTION: buildAnalyticsItem(product, options)
 *
 * PURPOSE: Converts one product from config.js into a GA4 "item" object.
 * INPUTS:
 * - product: an entry of window.PRODUCTS.
 * - options: optional { quantity, size, colorName, index, listId, listName }.
 * OUTPUT: e.g. { item_id: "air-max-excee", item_name: "Nike Air Max Excee",
 *   item_brand: "Nike", item_category: "Footwear", item_category2: "women",
 *   item_variant: "White / Black - UK 7", price: 9995, quantity: 1 }
 *
 * Expected Analytics Effect: None by itself; it only prepares data that
 * the e-commerce events above send.
 */
function buildAnalyticsItem(product, options) {
  options = options || {};
  var item = {
    item_id: product.id,
    item_name: product.name,
    item_brand: "Nike",
    item_category: "Footwear",
    item_category2: product.category,
    price: product.price,
    quantity: options.quantity || 1
  };
  var variantParts = [];
  if (options.colorName) {
    variantParts.push(options.colorName);
  }
  if (options.size) {
    variantParts.push("UK " + options.size);
  }
  if (variantParts.length > 0) {
    item.item_variant = variantParts.join(" - ");
  }
  if (product.originalPrice) {
    item.discount = product.originalPrice - product.price;
  }
  if (typeof options.index === "number") {
    item.index = options.index;
  }
  if (options.listId) {
    item.item_list_id = options.listId;
    item.item_list_name = options.listName;
  }
  return item;
}

/**
 * FUNCTION: logAnalyticsDebug(message, data)
 * PURPOSE: Developer-only console output when debugLogging is true.
 * Visitors never see it. Expected Analytics Effect: None.
 */
function logAnalyticsDebug(message, data) {
  if (!window.STORE_CONFIG.analytics.debugLogging) {
    return;
  }
  if (data !== undefined) {
    console.log("[Air Max analytics] " + message, data);
  } else {
    console.log("[Air Max analytics] " + message);
  }
}

/**
 * FUNCTION: initAnalytics()
 * PURPOSE: Once per page: connect the consent buttons, then load GTM
 * (consent already given) or show the banner (no choice yet).
 * Expected Analytics Effect: see loadGoogleTagManager(). No custom event.
 */
function initAnalytics() {
  var acceptButton = document.getElementById("consent-accept-btn");
  var declineButton = document.getElementById("consent-decline-btn");
  if (acceptButton) {
    acceptButton.addEventListener("click", function () { handleConsentChoice("granted"); });
  }
  if (declineButton) {
    declineButton.addEventListener("click", function () { handleConsentChoice("denied"); });
  }
  if (!isAnalyticsConfigured()) {
    logAnalyticsDebug("Analytics inactive (placeholder ID). Events are still printed here for learning.");
    return;
  }
  var settings = window.STORE_CONFIG.analytics;
  if (!settings.requireConsent || getConsentStatus() === "granted") {
    loadGoogleTagManager();
  } else if (getConsentStatus() === null) {
    var banner = document.getElementById("consent-banner");
    if (banner) {
      banner.hidden = false;
    }
  }
}

document.addEventListener("DOMContentLoaded", initAnalytics);
