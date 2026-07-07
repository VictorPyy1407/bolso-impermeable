(function () {
  const PLACEHOLDER = "PEGAR_AQUI";

  function isConfigured(value) {
    return Boolean(value && value !== PLACEHOLDER && !String(value).includes("XXXXX"));
  }

  function sanitizeInput(value) {
    return String(value || "")
      .replace(/[<>]/g, "")
      .replace(/javascript:/gi, "")
      .trim();
  }

  function onlyDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function formatGs(value) {
    return "Gs. " + Number(value || 0).toLocaleString("es-PY");
  }

  function formatParaguayPhone(value) {
    const digits = onlyDigits(value).replace(/^5950/, "595");
    if (!digits) return "";
    if (digits.startsWith("595")) return "+" + digits.replace(/^(595)(\d{3})(\d{3})(\d*)$/, "$1 $2 $3 $4").trim();
    if (digits.startsWith("0")) return digits.replace(/^(0\d{3})(\d{3})(\d*)$/, "$1 $2 $3").trim();
    return digits.replace(/^(\d{4})(\d{3})(\d*)$/, "$1 $2 $3").trim();
  }

  function detectDevice() {
    const ua = navigator.userAgent || "";
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) return "mobile";
    return "desktop";
  }

  function detectBrowser() {
    const ua = navigator.userAgent || "";
    if (/Edg\//.test(ua)) return "Edge";
    if (/OPR\//.test(ua)) return "Opera";
    if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return "Chrome";
    if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
    if (/Firefox\//.test(ua)) return "Firefox";
    return "Otro";
  }

  function campaignData() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: sanitizeInput(params.get("utm_source")),
      utm_medium: sanitizeInput(params.get("utm_medium")),
      utm_campaign: sanitizeInput(params.get("utm_campaign")),
      utm_content: sanitizeInput(params.get("utm_content")),
      utm_term: sanitizeInput(params.get("utm_term")),
      fbclid: sanitizeInput(params.get("fbclid")),
      gclid: sanitizeInput(params.get("gclid")),
      referer: sanitizeInput(document.referrer),
      page_url: sanitizeInput(window.location.href),
      user_agent: sanitizeInput(navigator.userAgent),
      device: detectDevice(),
      browser: detectBrowser(),
      language: sanitizeInput(navigator.language || navigator.userLanguage)
    };
  }

  function removeEmptyFields(data) {
    return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== "" && value !== null && value !== undefined));
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  window.LandingUtils = {
    isConfigured,
    sanitizeInput,
    onlyDigits,
    formatGs,
    formatParaguayPhone,
    campaignData,
    removeEmptyFields,
    escapeHtml
  };
})();
