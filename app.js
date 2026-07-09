(function () {
  let isSubmitting = false;

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function openCheckoutPanel() {
    const panel = $("#checkout-panel");
    const overlay = $("#checkout-overlay");
    if (panel && overlay) {
      panel.classList.add("active");
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";
    }
    const qty = Number(document.querySelector("#order-form [name=cantidad]")?.value || 1);
    OrderAnalytics.addPaymentInfo(qty);
  }

  function closeCheckoutPanel() {
    const panel = $("#checkout-panel");
    const overlay = $("#checkout-overlay");
    if (panel && overlay) {
      panel.classList.remove("active");
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  const ZONA_1 = [
    "aregua","asuncion","asunción","capiatá","capiata",
    "fernando de la mora","lambaré","lambare","limpio",
    "mariano roque alonso","san lorenzo","villa elisa",
    "ypane","ypané","ñemby","nemby"
  ];

  function esZona1(ciudad, departamento) {
    if (!ciudad) return false;
    const dep = (departamento || "").toLowerCase().trim();
    const c = ciudad.toLowerCase().trim();
    if (dep === "asunción (capital)" || dep === "asuncion (capital)") return true;
    if (dep === "central" && !ZONA_1.some(z => c.includes(z) || z.includes(c))) return false;
    return ZONA_1.some(z => c.includes(z) || z.includes(c));
  }

  function buildWhatsAppUrl(order) {
    const txt = encodeURIComponent(
      `¡Hola! Quiero comprar la Bolsa Impermeable XL Premium.\n\n` +
      `*Producto:* ${order.producto}\n` +
      `*Cantidad:* ${order.cantidad}\n` +
      `*Total:* ${LandingUtils.formatGs(order.subtotal)}\n` +
      `*Nombre:* ${order.nombre}\n` +
      `*Teléfono:* ${order.telefono}\n` +
      `*Departamento:* ${order.departamento}\n` +
      `*Ciudad:* ${order.ciudad}\n` +
      `*Dirección:* ${order.direccion}\n` +
      (order.referencia !== "No informado" ? `*Referencia:* ${order.referencia}\n` : "") +
      (order.color ? `*Color:* ${order.color}\n` : "") +
      `\nQuedo atento a la confirmación.`
    );
    return `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${txt}`;
  }

  function initScrollUi() {
    $$('[data-buy]').forEach((button) => {
      button.addEventListener("click", () => {
        const qty = Number(document.querySelector("#order-form [name=cantidad]")?.value || 1);
        OrderAnalytics.beginCheckout(qty);
        openCheckoutPanel();
      });
    });

    const header = $("#site-header");
    const bar = $("#mobile-bar");

    const onScroll = () => {
      const y = window.pageYOffset;
      if (header) header.style.boxShadow = y > 20 ? "0 4px 20px rgba(0,0,0,.08)" : "none";
      if (!bar) return;
      const isMobile = window.innerWidth < 760;
      const pastHero = y > 620;
      bar.style.transform = isMobile && pastHero ? "translateY(0)" : "translateY(120%)";
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  }

  function initFaqAndReveal() {
    $$('[data-faq]').forEach((item) => {
      const question = $('[data-faq-q]', item);
      const answer = $('[data-faq-a]', item);
      const icon = $('[data-faq-i]', item);
      if (!question || !answer || !icon) return;
      question.addEventListener("click", () => {
        const open = answer.style.maxHeight && answer.style.maxHeight !== "0px";
        $$('[data-faq]').forEach((other) => {
          const otherAnswer = $('[data-faq-a]', other);
          const otherIcon = $('[data-faq-i]', other);
          if (otherAnswer) otherAnswer.style.maxHeight = "0px";
          if (otherIcon) otherIcon.style.transform = "rotate(0deg)";
        });
        if (!open) {
          answer.style.maxHeight = answer.scrollHeight + "px";
          icon.style.transform = "rotate(45deg)";
        }
      });
    });

    const reveals = $$('[data-reveal]');
    reveals.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      el.style.transition = "opacity .6s ease, transform .6s ease";
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      reveals.forEach((el) => observer.observe(el));
    } else {
      reveals.forEach((el) => { el.style.opacity = "1"; el.style.transform = "none"; });
    }

    $$('[data-card]').forEach((card) => {
      card.addEventListener("mouseenter", () => { card.style.transform = "translateY(-5px)"; card.style.boxShadow = "0 16px 30px -14px rgba(0,0,0,.2)"; });
      card.addEventListener("mouseleave", () => { card.style.transform = "translateY(0)"; card.style.boxShadow = "none"; });
    });
  }

  function initQuantity(form) {
    const input = form.elements.cantidad;
    const total = $("#order-total");
    if (!input || !total) return;

    const update = () => {
      let qty = parseInt(input.value || "1", 10);
      if (!Number.isFinite(qty) || qty < 1) qty = 1;
      input.value = String(qty);
      total.textContent = LandingUtils.formatGs(qty * CONFIG.PRICE);
    };

    $('[data-qty-minus]', form)?.addEventListener("click", () => { input.value = String(Math.max(1, Number(input.value || 1) - 1)); update(); });
    $('[data-qty-plus]', form)?.addEventListener("click", () => { input.value = String(Number(input.value || 1) + 1); update(); });
    input.addEventListener("input", update);
    update();
  }

  function setSubmitting(button, submitting) {
    const text = $('[data-submit-text]', button);
    button.disabled = submitting;
    button.classList.toggle("is-loading", submitting);
    if (text) text.textContent = submitting ? "Enviando pedido..." : "FINALIZAR PEDIDO";
    if (text && !submitting) {
      const form = button.closest("form");
      const ciudad = form?.elements?.ciudad?.value || "";
      const depto = form?.elements?.departamento?.value || "";
      text.textContent = (ciudad && !esZona1(ciudad, depto)) ? "CONSULTAR POR WHATSAPP" : "FINALIZAR PEDIDO";
    }
  }

  function showFormMessage(message) {
    const box = $("#form-error");
    if (!box) return;
    box.textContent = message;
    box.style.display = message ? "block" : "none";
  }

  function publicSubmitError(error) {
    const message = String(error && error.message ? error.message : "");
    if (message.includes("Configurá SUPABASE_URL")) {
      return "Falta configurar Supabase en config.js para poder recibir pedidos.";
    }
    return "No pudimos enviar tu pedido. Verificá tu conexión e intentá nuevamente.";
  }

  function showModal(success, title, message) {
    const modal = $("#order-modal");
    const icon = $("#order-modal-icon");
    const titleEl = $("#order-modal-title");
    const messageEl = $("#order-modal-message");
    const waBtn = $("#order-modal-wa");
    if (!modal || !icon || !titleEl || !messageEl) return;
    icon.className = "order-modal__icon " + (success ? "ok" : "fail");
    icon.textContent = success ? "✓" : "!";
    titleEl.textContent = title;
    messageEl.textContent = message;
    if (waBtn) {
      waBtn.style.display = success ? "inline-flex" : "none";
      if (success) {
        const txt = encodeURIComponent("¡Hola! Acabo de realizar mi pedido de la Bolsa Impermeable XL Premium. Quedo atento a la confirmación.");
        waBtn.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${txt}`;
      }
    }
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function collectOrder(form) {
    const value = (name) => LandingUtils.sanitizeInput(form.elements[name]?.value);
    const quantity = Math.max(1, parseInt(value("cantidad") || "1", 10));
    const campaign = LandingUtils.campaignData();
    const referenceParts = [];
    if (value("referencia")) referenceParts.push(value("referencia"));
    if (value("barrio")) referenceParts.push(`Barrio: ${value("barrio")}`);
    if (value("color")) referenceParts.push(`Color: ${value("color")}`);
    // Solo columnas que existen en la tabla `pedidos_web` (compartida con el panel admin).
    // El barrio y el color van dentro de `referencia`; la ubicación en `ubicacion_maps`.
    return LandingUtils.removeEmptyFields({
      id: `PY${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`,
      producto: CONFIG.PRODUCT_NAME,
      precio: CONFIG.PRICE,
      cantidad: quantity,
      subtotal: CONFIG.PRICE * quantity,
      ganancia: 0,
      nombre: value("nombre"),
      telefono: LandingUtils.formatParaguayPhone(value("telefono")),
      correo: "No informado",
      ci: "No informado",
      departamento: value("departamento"),
      ciudad: value("ciudad"),
      direccion: value("direccion"),
      referencia: referenceParts.join(" | ") || "No informado",
      ubicacion_maps: value("maps") || "No informado",
      observaciones: value("observaciones") || "Sin observaciones",
      estado: "Pendiente",
      origen: "landing_bolso_impermeable",
      created_at: new Date().toISOString(),
      user_agent: campaign.user_agent,
      utm_source: campaign.utm_source,
      utm_medium: campaign.utm_medium,
      utm_campaign: campaign.utm_campaign,
      fbclid: campaign.fbclid,
      gclid: campaign.gclid
    });
  }

  function initGeo(form) {
    const button = $('[data-geo]', form);
    const input = form.elements.maps;
    const hint = $('[data-maps-hint]', form);
    if (!button || !input) return;

    button.addEventListener("click", () => {
      if (!navigator.geolocation) {
        if (hint) hint.textContent = "Tu navegador no permite ubicación. Pegá el link de Google Maps manualmente.";
        return;
      }

      const previousText = button.textContent;
      button.disabled = true;
      button.textContent = "📍 Buscando...";

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          input.value = `https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
          if (hint) hint.textContent = "✅ Ubicación cargada. Podés ajustarla abriendo el link.";
          OrderValidation.clearError(form, "maps");
          button.disabled = false;
          button.textContent = previousText;
        },
        () => {
          if (hint) hint.textContent = "No pudimos obtener tu ubicación. Pegá el link de Google Maps manualmente.";
          button.disabled = false;
          button.textContent = previousText;
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  function initForm() {
    const form = $("#order-form");
    const button = $("#submit-order");
    if (!form || !button) return;

    OrderValidation.attachLiveValidation(form);
    initQuantity(form);
    initGeo(form);

    const ciudadInput = form.elements.ciudad;
    const paymentZone = $("#payment-zone");
    const paymentZoneIcon = $("#payment-zone-icon");
    const paymentZoneText = $("#payment-zone-text");
    const whatsappZone = $("#whatsapp-zone");
    const whatsappBtn = $("#whatsapp-btn");

    function updateZone() {
      const ciudad = ciudadInput?.value || "";
      const depto = form.elements.departamento?.value || "";
      const z1 = esZona1(ciudad, depto);
      const submitText = $("[data-submit-text]", form);
      if (paymentZone && z1) {
        paymentZone.style.display = "flex";
        paymentZone.style.background = "#1a2e1a";
        paymentZone.style.border = "1px solid #1fa463";
        paymentZoneIcon.textContent = "📦";
        paymentZoneText.textContent = "Excelente — tu ciudad está en Zona 1. Recibís el pedido en tu casa y pagás contra entrega en efectivo o transferencia.";
        if (submitText) submitText.textContent = "FINALIZAR PEDIDO";
      } else if (paymentZone) {
        paymentZone.style.display = "none";
      }
      if (whatsappZone) {
        whatsappZone.style.display = (ciudad && !z1) ? "block" : "none";
        if (submitText && ciudad && !z1) submitText.textContent = "CONSULTAR POR WHATSAPP";
        else if (submitText && !ciudad) submitText.textContent = "FINALIZAR PEDIDO";
      }
    }

    ciudadInput?.addEventListener("input", updateZone);
    ciudadInput?.addEventListener("blur", updateZone);
    updateZone();

    let checkoutFromFormSent = false;
    form.addEventListener("focusin", () => {
      if (checkoutFromFormSent) return;
      checkoutFromFormSent = true;
      const qty = Number(form.elements.cantidad?.value || 1);
      OrderAnalytics.beginCheckout(qty);
      window.VisitorTracker?.trackEcommerce("begin_checkout", { revenue: qty * CONFIG.PRICE });
    });

    form.elements.telefono?.addEventListener("blur", () => {
      form.elements.telefono.value = LandingUtils.formatParaguayPhone(form.elements.telefono.value);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      showFormMessage("");
      if (isSubmitting) return;

      const validation = OrderValidation.validateForm(form);
      if (validation.spam) return;
      if (!validation.valid) {
        showFormMessage("Verificá los campos marcados en rojo.");
        return;
      }

      const order = collectOrder(form);

      if (!esZona1(order.ciudad, order.departamento)) {
        setSubmitting(button, true);
        showFormMessage("Redirigiendo a WhatsApp para coordinar el pago por adelantado...");
        const waUrl = buildWhatsAppUrl(order);
        window.open(waUrl, "_blank");
        setTimeout(() => {
          closeCheckoutPanel();
          setTimeout(() => { form.reset(); showFormMessage(""); isSubmitting = false; setSubmitting(button, false); }, 350);
        }, 500);
        return;
      }

      isSubmitting = true;
      setSubmitting(button, true);

      try {
        const savedOrder = await OrderSupabase.saveOrder(order);
        OrderTelegram.sendOrderNotification(order).catch((error) => console.warn("Telegram notification failed:", error));
        OrderAnalytics.lead(order.cantidad);
        OrderAnalytics.purchase(order.cantidad, savedOrder && savedOrder.id);
        const orderId = (savedOrder && savedOrder.id) || order.id;
        window.VisitorTracker?.trackEcommerce("generate_lead", { orderId, revenue: order.subtotal });
        window.VisitorTracker?.trackEcommerce("purchase", { orderId, revenue: order.subtotal });
        form.reset();
        initQuantity(form);
        showModal(true, "Pedido recibido correctamente", "Gracias por tu compra. Nuestro equipo se comunicará contigo en breve para confirmar los datos de entrega.");
      } catch (error) {
        console.error(error);
        const message = publicSubmitError(error);
        showFormMessage(message);
        showModal(false, "No pudimos enviar tu pedido.", message);
        isSubmitting = false;
        setSubmitting(button, false);
      }
    });
  }

  function initGallery() {
    const mainImg = $("#gallery-main");
    const thumbs = $$(".gallery-thumb");
    const prev = $("#gallery-prev");
    const next = $("#gallery-next");
    const counter = $("#gallery-current-idx");
    if (!mainImg || !thumbs.length) return;

    const images = [
      "assets/Imagen%20principal.jpg",
      "assets/Bolso-Gris.jpg",
      "assets/Bolso-Negro.jpg",
      "assets/Bolso-Rosa.jpg",
      "assets/Bolso-Lila.jpg"
    ];

    let current = 0;

    function updateGallery(index) {
      current = index;
      mainImg.style.opacity = "0.3";
      setTimeout(() => {
        mainImg.src = images[current];
        mainImg.style.opacity = "1";
      }, 150);
      thumbs.forEach((t, i) => t.classList.toggle("active", i === current));
      if (counter) counter.textContent = current + 1;
    }

    thumbs.forEach((t) => {
      t.addEventListener("click", () => updateGallery(parseInt(t.getAttribute("data-index"), 10)));
    });
    prev?.addEventListener("click", () => updateGallery(current - 1 < 0 ? images.length - 1 : current - 1));
    next?.addEventListener("click", () => updateGallery(current + 1 >= images.length ? 0 : current + 1));
  }

  document.addEventListener("DOMContentLoaded", () => {
    OrderAnalytics.initMetaPixel();
    OrderAnalytics.initGA4();
    initScrollUi();
    initFaqAndReveal();
    initForm();
    initGallery();

    $("#order-modal-accept")?.addEventListener("click", () => {
      const modal = $("#order-modal");
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    });

    $("#checkout-panel-close")?.addEventListener("click", closeCheckoutPanel);
    $("#checkout-overlay")?.addEventListener("click", closeCheckoutPanel);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCheckoutPanel(); });
  });
})();
