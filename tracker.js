/* Tracking de visitantes → alimenta "Visitantes en tiempo real" y el embudo del panel admin.
 * Envía eventos a la edge function `track-visitor` de Supabase (misma infra que las otras landings).
 * landingPage debe coincidir con PRODUCT_LANDINGS del panel: "landing_bolso_impermeable". */
(function () {
  var SUPABASE_URL = String(CONFIG.SUPABASE_URL || "").replace(/\/$/, "");
  var SUPABASE_KEY = CONFIG.SUPABASE_ANON_KEY;
  var ORIGIN = CONFIG.ORIGIN || "landing_bolso_impermeable";

  if (!window.LandingUtils || !LandingUtils.isConfigured(SUPABASE_URL) || !LandingUtils.isConfigured(SUPABASE_KEY)) {
    return;
  }

  var TRACK_URL = SUPABASE_URL + "/functions/v1/track-visitor";

  var sessionId = sessionStorage.getItem("lp_session_id") ||
    ("sess_" + Math.random().toString(36).slice(2, 15) + "_" + Date.now().toString(36));
  sessionStorage.setItem("lp_session_id", sessionId);

  var hbInterval = null;
  var hidden = false;

  function send(event, extra) {
    var params = new URLSearchParams(window.location.search);
    try {
      fetch(TRACK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": "Bearer " + SUPABASE_KEY
        },
        body: JSON.stringify(Object.assign({
          event: event,
          sessionId: sessionId,
          pageUrl: location.href,
          pageTitle: document.title,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          screenResolution: screen.width + "x" + screen.height,
          viewport: window.innerWidth + "x" + window.innerHeight,
          landingPage: ORIGIN,
          timestamp: new Date().toISOString(),
          utmSource: params.get("utm_source"),
          utmMedium: params.get("utm_medium"),
          utmCampaign: params.get("utm_campaign"),
          utmContent: params.get("utm_content"),
          utmTerm: params.get("utm_term")
        }, extra || {})),
        keepalive: event === "page_hide"
      }).catch(function () {});
    } catch (e) { /* noop */ }
  }

  function startHeartbeat() {
    if (hbInterval) return;
    hbInterval = setInterval(function () {
      if (!hidden && document.visibilityState === "visible") send("heartbeat");
    }, 30000);
  }

  function stopHeartbeat() {
    if (hbInterval) { clearInterval(hbInterval); hbInterval = null; }
  }

  document.addEventListener("visibilitychange", function () {
    hidden = document.hidden;
    if (hidden) { send("page_hide"); stopHeartbeat(); }
    else { send("page_view"); startHeartbeat(); }
  });
  window.addEventListener("beforeunload", function () { send("page_hide"); });
  window.addEventListener("pagehide", function () { send("page_hide"); });

  send("page_view");
  startHeartbeat();

  window.VisitorTracker = {
    trackEvent: send,
    trackEcommerce: function (evt, data) {
      data = data || {};
      send(evt, {
        productName: data.productName || CONFIG.PRODUCT_NAME,
        productPrice: data.productPrice || CONFIG.PRICE,
        orderId: data.orderId,
        revenue: data.revenue
      });
    },
    getSessionId: function () { return sessionId; }
  };
})();
