(function () {
  async function saveOrder(order) {
    if (!LandingUtils.isConfigured(CONFIG.SUPABASE_URL) || !LandingUtils.isConfigured(CONFIG.SUPABASE_ANON_KEY)) {
      throw new Error("Configurá SUPABASE_URL y SUPABASE_ANON_KEY en config.js");
    }

    const baseUrl = CONFIG.SUPABASE_URL.replace(/\/$/, "");
    const table = CONFIG.SUPABASE_TABLE || "orders";
    let response = await postOrder(baseUrl, table, order);

    if (!response.ok && response.status === 400) {
      const details = await response.text().catch(() => "");
      if (details.includes("PGRST204") && details.includes("schema cache")) {
        response = await postOrder(baseUrl, table, toBaseOrder(order));
      } else {
        throw new Error(`Supabase rechazó el pedido (${response.status}). ${details}`.trim());
      }
    }

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(`Supabase rechazó el pedido (${response.status}). ${details}`.trim());
    }

    const data = await response.json().catch(() => []);
    return Array.isArray(data) ? data[0] : data;
  }

  function postOrder(baseUrl, table, order) {
    return fetch(`${baseUrl}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": CONFIG.SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify(order)
    });
  }

  function toBaseOrder(order) {
    const baseFields = [
      "id", "producto", "precio", "cantidad", "subtotal", "ganancia", "nombre",
      "telefono", "correo", "ci", "departamento", "ciudad", "direccion",
      "referencia", "ubicacion_maps", "estado", "origen", "created_at"
    ];
    return baseFields.reduce((base, field) => {
      if (Object.prototype.hasOwnProperty.call(order, field)) base[field] = order[field];
      return base;
    }, {});
  }

  window.OrderSupabase = { saveOrder };
})();
