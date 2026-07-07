(function () {
  let checkoutSent = false;

  function loadScript(src) {
    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }

  function initMetaPixel() {
    if (!LandingUtils.isConfigured(CONFIG.META_PIXEL_ID)) return;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", CONFIG.META_PIXEL_ID);
    fbq("track", "PageView");
    fbq("track", "ViewContent", productParams());
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
      value: CONFIG.PRICE,
      currency: CONFIG.CURRENCY,
      content_type: "product"
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
    if (typeof fbq === "function") fbq("track", name, params || productParams());
  }

  function gaEvent(name, params) {
    if (typeof gtag === "function") gtag("event", name, gaParams(params));
  }

  function beginCheckout(quantity) {
    if (checkoutSent) return;
    checkoutSent = true;
    metaEvent("InitiateCheckout", productParams({ value: CONFIG.PRICE * (Number(quantity) || 1) }));
    gaEvent("begin_checkout", { quantity: Number(quantity) || 1 });
  }

  function lead(quantity) {
    metaEvent("Lead", productParams({ value: CONFIG.PRICE * (Number(quantity) || 1) }));
    gaEvent("generate_lead", { quantity: Number(quantity) || 1 });
  }

  function purchase(quantity, orderId) {
    const qty = Number(quantity) || 1;
    metaEvent("Purchase", productParams({ value: CONFIG.PRICE * qty }));
    gaEvent("purchase", { quantity: qty, transaction_id: orderId || String(Date.now()) });
  }

  window.OrderAnalytics = { initMetaPixel, initGA4, beginCheckout, lead, purchase };
})();
