(function () {
  let checkoutSent = false;

  function loadScript(src) {
    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }

  function eventId() {
    return "evt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  }

  function initMetaPixel() {
    if (!LandingUtils.isConfigured(CONFIG.META_PIXEL_ID)) return;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", CONFIG.META_PIXEL_ID);
    fbq("trackSingle", CONFIG.META_PIXEL_ID, "PageView", { eventID: eventId() });
    fbq("trackSingle", CONFIG.META_PIXEL_ID, "ViewContent", productParams({ eventID: eventId() }));
  }

  function initGA4() {
    if (!LandingUtils.isConfigured(CONFIG.GA4_ID)) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ dataLayer.push(arguments); };
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${CONFIG.GA4_ID}`);
    gtag("js", new Date());
    gtag("config", CONFIG.GA4_ID);
    gaEvent("view_item", { quantity: 1 });
  }

  function productParams(extra) {
    return Object.assign({
      content_name: CONFIG.PRODUCT_NAME,
      content_ids: [String(CONFIG.PRICE)],
      content_type: "product",
      value: CONFIG.PRICE,
      currency: CONFIG.CURRENCY
    }, extra || {});
  }

  function gaParams(extra) {
    const quantity = Number(extra && extra.quantity) || 1;
    return Object.assign({
      currency: CONFIG.CURRENCY,
      value: CONFIG.PRICE * quantity,
      items: [{ item_name: CONFIG.PRODUCT_NAME, price: CONFIG.PRICE, currency: CONFIG.CURRENCY, quantity }]
    }, extra || {});
  }

  function metaEvent(name, params) {
    if (typeof fbq === "function") fbq("trackSingle", CONFIG.META_PIXEL_ID, name, productParams(params));
  }

  function gaEvent(name, params) {
    if (typeof gtag === "function") gtag("event", name, gaParams(params));
  }

  function beginCheckout(quantity) {
    if (checkoutSent) return;
    checkoutSent = true;
    metaEvent("InitiateCheckout", { value: CONFIG.PRICE * (Number(quantity) || 1), eventID: eventId() });
    gaEvent("begin_checkout", { quantity: Number(quantity) || 1 });
  }

  function addPaymentInfo(quantity) {
    metaEvent("AddPaymentInfo", { value: CONFIG.PRICE * (Number(quantity) || 1), eventID: eventId() });
    gaEvent("add_payment_info", { quantity: Number(quantity) || 1 });
  }

  function lead(quantity) {
    metaEvent("Lead", { value: CONFIG.PRICE * (Number(quantity) || 1), eventID: eventId() });
    gaEvent("generate_lead", { quantity: Number(quantity) || 1 });
  }

  function purchase(quantity, orderId) {
    const qty = Number(quantity) || 1;
    metaEvent("Purchase", { value: CONFIG.PRICE * qty, eventID: orderId || eventId() });
    gaEvent("purchase", { quantity: qty, transaction_id: orderId || String(Date.now()) });
  }

  window.OrderAnalytics = { initMetaPixel, initGA4, beginCheckout, addPaymentInfo, lead, purchase };
})();
