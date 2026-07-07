(function () {
  function telegramText(order) {
    const fecha = new Date().toLocaleString("es-PY", { timeZone: "America/Asuncion" });
    return [
      "🛒 NUEVO PEDIDO",
      "",
      `👜 Producto: ${order.producto}`,
      `💰 Precio: ${LandingUtils.formatGs(order.precio)}`,
      `📦 Cantidad: ${order.cantidad}`,
      "",
      `👤 Cliente: ${order.nombre}`,
      `📱 Teléfono: ${order.telefono}`,
      "",
      `📍 Departamento: ${order.departamento}`,
      `🏙 Ciudad: ${order.ciudad}`,
      `🏘 Barrio: ${order.barrio || "-"}`,
      `📌 Dirección: ${order.direccion}`,
      `📍 Referencia: ${order.referencia || "-"}`,
      `🗺 Maps: ${order.maps || "-"}`,
      "",
      `🎨 Color: ${order.color || "-"}`,
      `📝 Observaciones: ${order.observaciones || "-"}`,
      "",
      "📊 Campaña:",
      `UTM Source: ${order.utm_source || "-"}`,
      `UTM Campaign: ${order.utm_campaign || "-"}`,
      `FBCLID: ${order.fbclid || "-"}`,
      "",
      `🕒 Fecha: ${fecha}`
    ].join("\n");
  }

  async function sendOrderNotification(order) {
    if (!LandingUtils.isConfigured(CONFIG.TELEGRAM_BOT_TOKEN) || !LandingUtils.isConfigured(CONFIG.TELEGRAM_CHAT_ID)) {
      return { skipped: true };
    }

    const replyMarkup = /^https?:\/\//i.test(order.maps || "") ? { inline_keyboard: [[{ text: "Abrir ubicación en Maps", url: order.maps }]] } : undefined;
    const response = await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CONFIG.TELEGRAM_CHAT_ID,
        text: telegramText(order),
        disable_web_page_preview: false,
        reply_markup: replyMarkup
      })
    });

    if (!response.ok) throw new Error(`Telegram falló (${response.status})`);
    return response.json();
  }

  window.OrderTelegram = { sendOrderNotification };
})();
