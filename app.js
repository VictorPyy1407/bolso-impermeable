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

  const COLOR_HEX = { Negro: "#141414", Gris: "#9a9a9a", Rosa: "#e59ab8", Lila: "#b9a7e0" };

  function maxQty() {
    return Math.max(1, parseInt(CONFIG.MAX_QTY || 3, 10));
  }

  function clampQty(value) {
    let qty = parseInt(value || "1", 10);
    if (!Number.isFinite(qty) || qty < 1) qty = 1;
    if (qty > maxQty()) qty = maxQty();
    return qty;
  }

  // Precio por packs: 1u=219.000 · 2u=360.000 · 3u=480.000 (ver CONFIG.PRICE_TIERS)
  function bundleTotal(qty) {
    const tiers = CONFIG.PRICE_TIERS || {};
    if (tiers[qty] != null) return tiers[qty];
    const keys = Object.keys(tiers).map(Number).sort((a, b) => a - b);
    if (!keys.length) return CONFIG.PRICE * qty;
    const top = keys[keys.length - 1];
    if (qty <= top) return tiers[qty] != null ? tiers[qty] : CONFIG.PRICE * qty;
    const marginal = (tiers[top] - (tiers[top - 1] || 0)) || CONFIG.PRICE;
    return tiers[top] + (qty - top) * marginal;
  }

  function initQuantity(form, onChange) {
    const input = form.elements.cantidad;
    if (!input) return;

    const update = () => {
      input.value = String(clampQty(input.value));
      if (typeof onChange === "function") onChange();
    };

    $('[data-qty-minus]', form)?.addEventListener("click", () => { input.value = String(clampQty(Number(input.value || 1) - 1)); update(); });
    $('[data-qty-plus]', form)?.addEventListener("click", () => { input.value = String(clampQty(Number(input.value || 1) + 1)); update(); });
    input.addEventListener("input", update);
    // Los chips actualizan #cantidad y disparan 'change'; escuchamos ese evento.
    input.addEventListener("change", update);
    update();
  }

  // Chips de cantidad: reflejan CONFIG.PRICE_TIERS y setean #cantidad.
  function initQuantityChips(form) {
    const input = form.elements.cantidad;
    if (!input) return;
    const fmt = LandingUtils.formatGs;
    $$("#qty-chips .qty-chip").forEach((chip) => {
      const qty = clampQty(chip.getAttribute("data-qty"));
      const priceEl = $('[data-chip-price]', chip);
      if (priceEl) priceEl.textContent = fmt(bundleTotal(qty));
      chip.addEventListener("click", () => {
        input.value = String(qty);
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
  }

  function buildSummaryRenderer(form) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const fmt = LandingUtils.formatGs;
    return function renderSummary() {
      const qty = clampQty(form.elements.cantidad?.value);
      const total = bundleTotal(qty);
      const unit = Math.round(total / qty);
      const shipping = CONFIG.SHIPPING_VALUE || 0;
      const oldTotal = (CONFIG.OLD_PRICE || unit) * qty + shipping;
      const save = Math.max(0, oldTotal - total);
      set("summary-qty", String(qty));
      set("summary-unit", fmt(unit) + (qty > 1 ? " c/u" : ""));
      set("summary-subtotal", fmt(total));
      set("summary-save", "− " + fmt(save));
      set("summary-old", fmt(oldTotal));
      set("summary-total", fmt(total));

      const color = form.elements.color?.value || "";
      const chip = document.getElementById("summary-color-chip");
      if (chip) {
        if (color) {
          chip.style.display = "inline-flex";
          chip.innerHTML = `<span class="dot" style="background:${COLOR_HEX[color] || "#888"}"></span>${color}`;
        } else {
          chip.style.display = "none";
        }
      }

      // Chips de cantidad: marcar el activo según qty.
      $$("#qty-chips .qty-chip").forEach((c) => {
        c.classList.toggle("active", Number(c.getAttribute("data-qty")) === qty);
      });

      // Línea de precio por unidad + ahorro (base: precio unitario CONFIG.PRICE).
      const unitLine = document.getElementById("unit-price-line");
      if (unitLine) {
        const base = CONFIG.PRICE || unit;
        const saved = Math.max(0, base * qty - total);
        if (qty <= 1 || saved <= 0) {
          unitLine.innerHTML = `<span class="up-muted">Precio por unidad:</span> ${fmt(unit)}`;
        } else {
          unitLine.innerHTML = `${fmt(unit)} por unidad — ahorrás ${fmt(saved)} 🎉`;
        }
      }
    };
  }

  function initColorSwatches(form, renderSummary) {
    const input = form.elements.color;
    const label = document.getElementById("color-selected-label");
    const thumb = document.getElementById("summary-thumb");
    const swatches = $$(".color-swatch", form);

    function reset() {
      swatches.forEach((s) => s.classList.remove("selected"));
      if (input) input.value = "";
      if (label) label.textContent = "Tocá para elegir";
      if (thumb) thumb.src = "assets/Imagen%20principal.jpg";
    }

    swatches.forEach((sw) => {
      sw.addEventListener("click", () => {
        const color = sw.getAttribute("data-color");
        const img = sw.getAttribute("data-img");
        swatches.forEach((s) => s.classList.remove("selected"));
        sw.classList.add("selected");
        if (input) input.value = color;
        if (label) label.textContent = color;
        if (thumb && img) {
          thumb.style.opacity = "0.3";
          setTimeout(() => { thumb.src = img; thumb.style.opacity = "1"; }, 120);
        }
        renderSummary();
      });
    });

    return { reset };
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
    if (message.includes("Falta configurar Supabase")) {
      return "Falta configurar Supabase para recibir pedidos.";
    }
    return message || "No pudimos guardar el pedido en el sistema, pero lo recibimos por WhatsApp.";
  }

  // kind: "ok" (verde) | "warn" (ámbar, recibido por WhatsApp) | "fail" (rojo).
  // Acepta booleano por compatibilidad (true→ok, false→fail).
  function showModal(kind, title, message, waUrl, details) {
    const modal = $("#order-modal");
    const icon = $("#order-modal-icon");
    const titleEl = $("#order-modal-title");
    const messageEl = $("#order-modal-message");
    const waBtn = $("#order-modal-wa");
    if (!modal || !icon || !titleEl || !messageEl) return;
    const k = kind === true ? "ok" : kind === false ? "fail" : (kind || "ok");
    const glyphs = { ok: "✓", warn: "💬", fail: "!" };
    icon.className = "order-modal__icon " + k;
    icon.textContent = glyphs[k] || "✓";
    titleEl.textContent = title;
    messageEl.textContent = message;

    // Resumen del pedido (solo cuando hay datos, p.ej. compra exitosa).
    const summary = document.getElementById("order-modal-summary");
    if (summary) {
      if (details) {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set("oms-id", details.id || "—");
        set("oms-product", details.producto || CONFIG.PRODUCT_NAME);
        set("oms-qty", String(details.cantidad || 1));
        set("oms-total", LandingUtils.formatGs(details.total || 0));
        const colorRow = document.getElementById("oms-color-row");
        const colorEl = document.getElementById("oms-color");
        if (details.color && colorRow && colorEl) {
          colorRow.hidden = false;
          colorEl.innerHTML = `<span class="oms-dot" style="background:${COLOR_HEX[details.color] || "#888"}"></span>${LandingUtils.escapeHtml(details.color)}`;
        } else if (colorRow) {
          colorRow.hidden = true;
        }
        summary.hidden = false;
      } else {
        summary.hidden = true;
      }
    }

    if (waBtn) {
      waBtn.style.display = "inline-flex";
      waBtn.href = waUrl || `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent("¡Hola! Acabo de realizar mi pedido de la Bolsa Impermeable XL Premium. Quedo atento a la confirmación.")}`;
    }
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function collectOrder(form) {
    const value = (name) => LandingUtils.sanitizeInput(form.elements[name]?.value);
    const quantity = clampQty(value("cantidad"));
    const total = bundleTotal(quantity);
    const unitPrice = Math.round(total / quantity);
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
      precio: unitPrice,
      cantidad: quantity,
      subtotal: total,
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

  // Departamentos con pago contra entrega real (área metropolitana).
  // El resto = interior → se coordina el pago por WhatsApp antes de despachar.
  const METRO_DEPTS = ["Central", "Asunción (Capital)"];

  function updateCodReassure(dept) {
    const box = document.getElementById("cod-reassure");
    const icon = document.getElementById("cod-reassure-icon");
    const text = document.getElementById("cod-reassure-text");
    if (!box || !text) return;
    const isInterior = dept && METRO_DEPTS.indexOf(dept) === -1;
    if (isInterior) {
      box.classList.add("is-interior");
      if (icon) icon.textContent = "📦";
      text.innerHTML = '<strong>Envío al interior.</strong> Lo despachamos por empresa de encomiendas con número de seguimiento. Coordinamos el pago de forma segura por WhatsApp y te pasamos el comprobante de despacho antes de enviarlo.';
    } else {
      box.classList.remove("is-interior");
      if (icon) icon.textContent = "💵";
      text.innerHTML = '<strong>Pago contra entrega.</strong> No pagás nada ahora: recibís la bolsa en tu casa y pagás en efectivo, recién cuando la tengas en la mano. Antes de enviártela te escribimos por WhatsApp para confirmar todo.';
    }
  }

  function initForm() {
    const form = $("#order-form");
    const button = $("#submit-order");
    if (!form || !button) return;

    const renderSummary = buildSummaryRenderer(form);
    OrderValidation.attachLiveValidation(form);
    initQuantity(form, renderSummary);
    initQuantityChips(form);
    initOptionalDetails();
    const colorControl = initColorSwatches(form, renderSummary);
    initGeo(form);
    renderSummary();

    const deptSelect = form.elements.departamento;
    if (deptSelect) {
      deptSelect.addEventListener("change", () => updateCodReassure(deptSelect.value));
      updateCodReassure(deptSelect.value);
    }

    let checkoutFromFormSent = false;
    form.addEventListener("focusin", () => {
      if (checkoutFromFormSent) return;
      checkoutFromFormSent = true;
      const qty = Number(form.elements.cantidad?.value || 1);
      OrderAnalytics.beginCheckout(qty);
      window.VisitorTracker?.trackEcommerce("begin_checkout", { revenue: bundleTotal(clampQty(qty)) });
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
        OrderTelegram.sendOrderNotification(order).catch(function (e) { console.warn("Telegram notif failed:", e); });
        OrderAnalytics.lead(order.cantidad);
        OrderAnalytics.purchase(order.cantidad, savedOrder && savedOrder.id);
        const orderId = (savedOrder && savedOrder.id) || order.id;
        window.VisitorTracker && window.VisitorTracker.trackEcommerce("generate_lead", { orderId: orderId, revenue: order.subtotal });
        window.VisitorTracker && window.VisitorTracker.trackEcommerce("purchase", { orderId: orderId, revenue: order.subtotal });
        // Capturar datos para el resumen ANTES de resetear el formulario.
        const summaryDetails = {
          id: orderId,
          producto: order.producto,
          color: form.elements.color?.value || "",
          cantidad: order.cantidad,
          total: order.subtotal
        };
        form.reset();
        colorControl.reset();
        renderSummary();
        // Restaurar el botón: sin esto queda trabado en "Enviando pedido…".
        isSubmitting = false;
        setSubmitting(button, false);
        showModal("ok", "¡Pedido recibido!", "Gracias por tu compra. Te escribimos por WhatsApp para confirmar los datos de entrega antes del envío.", null, summaryDetails);
      } catch (error) {
        console.error(error);
        const waUrl = error.waFallback ? OrderSupabase.buildWhatsAppFallbackUrl(order) : null;
        if (waUrl) {
          window.open(waUrl, "_blank");
        }
        const message = publicSubmitError(error);
        showFormMessage(message);
        // Mismo resumen que en el flujo exitoso: el pedido se recibió igual (por WhatsApp).
        const summaryDetails = {
          id: order.id,
          producto: order.producto,
          color: form.elements.color?.value || "",
          cantidad: order.cantidad,
          total: order.subtotal
        };
        showModal("warn", "Pedido recibido por WhatsApp", message, waUrl, summaryDetails);
        form.reset();
        colorControl.reset();
        renderSummary();
        isSubmitting = false;
        setSubmitting(button, false);
      }
    });
  }

  // Colapsable de "detalles de entrega (opcional)".
  function initOptionalDetails() {
    const toggle = document.getElementById("opt-toggle");
    const panel = document.getElementById("opt-collapse");
    if (!toggle || !panel) return;
    const inner = panel.querySelector(".opt-collapse-inner");

    function open() {
      panel.style.maxHeight = (inner ? inner.scrollHeight : panel.scrollHeight) + "px";
      toggle.setAttribute("aria-expanded", "true");
      toggle.textContent = "− Ocultar detalles de entrega";
    }
    function close() {
      // Fijamos la altura actual antes de colapsar para animar suave.
      panel.style.maxHeight = panel.scrollHeight + "px";
      requestAnimationFrame(() => { panel.style.maxHeight = "0px"; });
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "+ Agregar detalles de entrega (opcional)";
    }

    // Una vez abierto del todo, permitimos que crezca (p.ej. al cargar ubicación).
    panel.addEventListener("transitionend", () => {
      if (toggle.getAttribute("aria-expanded") === "true") panel.style.maxHeight = "none";
    });

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen) close(); else open();
    });
  }

  // Contador de urgencia de 24 h persistido en localStorage.
  function initCountdown() {
    const el = document.getElementById("countdown-time");
    if (!el) return;
    const KEY = "bolso_offer_deadline";
    const DAY = 24 * 60 * 60 * 1000;

    function deadline() {
      let end = parseInt(localStorage.getItem(KEY) || "0", 10);
      if (!Number.isFinite(end) || end <= Date.now()) {
        end = Date.now() + DAY;
        try { localStorage.setItem(KEY, String(end)); } catch (e) {}
      }
      return end;
    }

    const pad = (n) => String(n).padStart(2, "0");

    function tick() {
      let remaining = deadline() - Date.now();
      if (remaining < 0) remaining = 0;
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      el.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
    }

    tick();
    setInterval(tick, 1000);
  }

  // Stock decreciente: 7 → 5 (45s) → 4 (90s) → 3 (3min).
  function initStockCounter() {
    const el = document.getElementById("stock-count");
    if (!el) return;
    const steps = [
      { at: 45000, value: 5 },
      { at: 90000, value: 4 },
      { at: 180000, value: 3 }
    ];
    steps.forEach((step) => {
      setTimeout(() => { el.textContent = String(step.value); }, step.at);
    });
  }

  // Toasts de prueba social cada 25–50 s.
  function initSocialToasts() {
    const wrap = document.getElementById("social-toast-wrap");
    if (!wrap) return;
    const NAMES = ["Sofía", "María", "Camila", "Lucía", "Rocío", "Belén", "Fernanda", "Carlos", "Diego", "Javier", "Mateo", "Rodrigo", "Gustavo", "Alejandra", "Verónica", "Patricia", "Andrea", "Marcos", "Ramón", "Julia"];
    const CITIES = ["Asunción", "Luque", "San Lorenzo", "Fernando de la Mora", "Capiatá", "Lambaré", "Ñemby", "Encarnación", "Ciudad del Este", "Mariano Roque Alonso", "Villa Elisa", "Itauguá", "Limpio", "Coronel Oviedo"];
    const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

    function show() {
      const name = rand(NAMES);
      const city = rand(CITIES);
      const toast = document.createElement("div");
      toast.className = "social-toast";
      toast.innerHTML =
        '<div class="social-toast-emoji">📦</div>' +
        '<div class="social-toast-body">' +
        `<div class="social-toast-title"><strong>${LandingUtils.escapeHtml(name)}</strong> de ${LandingUtils.escapeHtml(city)}</div>` +
        '<div class="social-toast-sub">acaba de pedir · hace instantes</div>' +
        '</div>';
      wrap.appendChild(toast);
      setTimeout(() => {
        toast.classList.add("out");
        setTimeout(() => toast.remove(), 450);
      }, 4000);
    }

    function schedule() {
      const delay = 25000 + Math.random() * 25000; // 25–50 s
      setTimeout(() => { show(); schedule(); }, delay);
    }
    schedule();
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
    initCountdown();
    initStockCounter();
    initSocialToasts();

    $("#order-modal-accept")?.addEventListener("click", () => {
      const modal = $("#order-modal");
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    });

    const finalWa = $("#final-whatsapp");
    if (finalWa) {
      const txt = encodeURIComponent("¡Hola! Tengo una consulta sobre la Bolsa Impermeable XL Premium antes de hacer mi pedido.");
      finalWa.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${txt}`;
    }

    $("#checkout-panel-close")?.addEventListener("click", closeCheckoutPanel);
    $("#checkout-overlay")?.addEventListener("click", closeCheckoutPanel);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCheckoutPanel(); });
  });
})();
