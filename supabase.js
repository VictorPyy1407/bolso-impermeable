(function () {
  async function saveOrder(order) {
    if (!LandingUtils.isConfigured(CONFIG.SUPABASE_URL) || !LandingUtils.isConfigured(CONFIG.SUPABASE_ANON_KEY)) {
      throw new OrderSaveError("Falta configurar Supabase en config.js.", false);
    }

    const baseUrl = CONFIG.SUPABASE_URL.replace(/\/$/, "");
    const table = CONFIG.SUPABASE_TABLE || "orders";

    const response = await tryPost(baseUrl, table, order);
    if (response.ok) {
      const data = await response.json().catch(() => []);
      return Array.isArray(data) ? data[0] : data;
    }

    const status = response.status;
    const details = await response.text().catch(() => "");

    if (status === 400 && details.includes("PGRST204") && details.includes("schema cache")) {
      const retry = await tryPost(baseUrl, table, toBaseOrder(order));
      if (retry.ok) {
        const data = await retry.json().catch(() => []);
        return Array.isArray(data) ? data[0] : data;
      }
    }

    if (status === 404) {
      throw new OrderSaveError("La tabla de pedidos no existe en Supabase. El pedido igual se capturó.", true);
    }
    if (status === 401 || status === 403) {
      throw new OrderSaveError("Supabase rechazó el guardado (RLS). El pedido igual se capturó.", true);
    }
    throw new OrderSaveError(`Error de servidor (${status}). El pedido igual se capturó.`, true);
  }

  async function tryPost(baseUrl, table, body) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(`${baseUrl}/rest/v1/${table}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": CONFIG.SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
            "Prefer": "return=representation"
          },
          body: JSON.stringify(body)
        });
        return response;
      } catch (err) {
        if (attempt === 0) await sleep(1000);
        else throw new OrderSaveError("No hay conexión con Supabase. El pedido igual se capturó.", true);
      }
    }
  }

  function OrderSaveError(message, waFallback) {
    this.message = message;
    this.waFallback = waFallback;
    this.toString = function () { return this.message; };
  }

  function toBaseOrder(order) {
    const baseFields = [
      "id", "producto", "precio", "cantidad", "subtotal", "ganancia", "nombre",
      "telefono", "correo", "ci", "departamento", "ciudad", "direccion",
      "referencia", "ubicacion_maps", "estado", "origen", "created_at"
    ];
    return baseFields.reduce(function (base, field) {
      if (Object.prototype.hasOwnProperty.call(order, field)) base[field] = order[field];
      return base;
    }, {});
  }

  function buildWhatsAppFallbackUrl(order) {
    var lines = [
      "\uD83D\uDECD\uFE0F *Nuevo pedido (web)*",
      "*Producto:* " + (order.producto || CONFIG.PRODUCT_NAME),
      "*Cantidad:* " + (order.cantidad || 1),
      "*Total:* " + (typeof LandingUtils !== "undefined" && LandingUtils.formatGs ? LandingUtils.formatGs(order.subtotal) : "Gs. " + ((order.subtotal || 0).toLocaleString ? (order.subtotal || 0).toLocaleString("es-PY") : order.subtotal)),
      "",
      "*Nombre:* " + (order.nombre || ""),
      "*Tel\u00E9fono:* " + (order.telefono || ""),
      "*Direcci\u00F3n:* " + (order.direccion || "") + ", " + (order.ciudad || "") + ", " + (order.departamento || ""),
      "*Referencia:* " + (order.referencia || "Ninguna"),
      "*ID:* " + (order.id || "")
    ];
    return "https://wa.me/" + CONFIG.WHATSAPP_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
  }

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  window.OrderSupabase = { saveOrder: saveOrder, buildWhatsAppFallbackUrl: buildWhatsAppFallbackUrl };
})();
