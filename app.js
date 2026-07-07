(function () {
  let isSubmitting = false;

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function scrollToForm() {
    const target = $("#pedido");
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.pageYOffset - 60;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  function initScrollUi() {
    $$('[data-buy]').forEach((button) => {
      button.addEventListener("click", () => {
        const qty = Number($("#cantidad")?.value || 1);
        OrderAnalytics.beginCheckout(qty);
        scrollToForm();
      });
    });

    const header = $("#site-header");
    const bar = $("#mobile-bar");
    const formSection = $("#pedido");

    const onScroll = () => {
      const y = window.pageYOffset;
      if (header) header.style.boxShadow = y > 20 ? "0 4px 20px rgba(0,0,0,.08)" : "none";
      if (!bar) return;
      const isMobile = window.innerWidth < 760;
      const pastHero = y > 620;
      let nearForm = false;
      if (formSection) {
        const rect = formSection.getBoundingClientRect();
        nearForm = rect.top < window.innerHeight && rect.bottom > 0;
      }
      bar.style.transform = isMobile && pastHero && !nearForm ? "translateY(0)" : "translateY(120%)";
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
    if (!modal || !icon || !titleEl || !messageEl) return;
    icon.className = "order-modal__icon " + (success ? "ok" : "fail");
    icon.textContent = success ? "✓" : "!";
    titleEl.textContent = title;
    messageEl.textContent = message;
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

  document.addEventListener("DOMContentLoaded", () => {
    OrderAnalytics.initMetaPixel();
    OrderAnalytics.initGA4();
    initScrollUi();
    initFaqAndReveal();
    initForm();

    $("#order-modal-accept")?.addEventListener("click", () => {
      const modal = $("#order-modal");
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    });
  });
})();
