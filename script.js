const thumbs = document.querySelectorAll('.thumb');
const mainImage = document.querySelector('#mainProductImage');
const CONFIG = {
  productName: 'Bolso Impermeable',
  productPrice: 199000,
  currency: 'PYG',
  origin: 'landing_bolso_impermeable',
  whatsappNumber: '595972738779',
  supabaseUrl: 'https://roruinqorwgolcrhhmpm.supabase.co',
  supabaseAnonKey: 'sb_publishable_aRPb1yNunMEheat00BxwtQ_Uft732KJ',
  supabaseTable: 'pedidos_web',
  metaPixelId: '2412226475899711',
  // Telegram se envía server-side desde el trigger de Supabase (notify_telegram_new_order).
  // NUNCA poner el bot token aquí: es código de cliente y quedaría público.
};

const trackingFired = new Set();

thumbs.forEach((thumb) => {
  thumb.addEventListener('click', () => {
    thumbs.forEach((item) => item.classList.remove('active'));
    thumb.classList.add('active');
    if (mainImage) mainImage.src = thumb.dataset.image;
  });
});

document.querySelector('.gallery-arrow-right')?.addEventListener('click', () => {
  const currentIndex = Array.from(thumbs).findIndex((thumb) => thumb.classList.contains('active'));
  const nextThumb = thumbs[(currentIndex + 1) % thumbs.length];
  nextThumb.click();
});

document.querySelector('.gallery-arrow-left')?.addEventListener('click', () => {
  const currentIndex = Array.from(thumbs).findIndex((thumb) => thumb.classList.contains('active'));
  const prevThumb = thumbs[(currentIndex - 1 + thumbs.length) % thumbs.length];
  prevThumb.click();
});

const offerDuration = 9 * 60;
let remaining = offerDuration;
const minutes = document.querySelector('#minutes');
const seconds = document.querySelector('#seconds');

function updateTimer() {
  const currentMinutes = Math.floor(remaining / 60);
  const currentSeconds = remaining % 60;

  if (minutes) minutes.textContent = String(currentMinutes).padStart(2, '0');
  if (seconds) seconds.textContent = String(currentSeconds).padStart(2, '0');

  remaining = remaining > 0 ? remaining - 1 : offerDuration;
}

updateTimer();
setInterval(updateTimer, 1000);

const viewerCount = document.querySelector('#viewerCount');

function updateViewerCount() {
  if (!viewerCount) return;
  viewerCount.textContent = String(Math.floor(Math.random() * 12) + 9);
}

setInterval(updateViewerCount, 6500);

const purchaseForm = document.querySelector('#purchaseForm');
const orderForms = document.querySelectorAll('[data-order-form]');
const confirmation = document.querySelector('#confirmation');
const orderNumber = document.querySelector('#confOrderNumber');
const confirmationWhatsapp = document.querySelector('#confirmationWhatsapp');
const confProduct = document.querySelector('#confProduct');
const confQuantity = document.querySelector('#confQuantity');
const confTotal = document.querySelector('#confTotal');
const confCity = document.querySelector('#confCity');
const productPage = document.querySelector('[data-page="product"]');
const checkoutPage = document.querySelector('[data-page="checkout"]');
const buyButton = document.querySelector('#pedido');
const backLink = document.querySelector('.back-link');
const closeCheckout = document.querySelector('.checkout-close');

const productPriceTop = document.querySelector('#productPriceTop');
const summaryQuantity = document.querySelector('#summaryQuantity');
const summaryUnitPrice = document.querySelector('#summaryUnitPrice');
const summaryTotal = document.querySelector('#summaryTotal');
const summaryCity = document.querySelector('#summaryCity');
const summaryAddress = document.querySelector('#summaryAddress');
const summaryPayment = document.querySelector('#summaryPayment');
const summaryEstimate = document.querySelector('#summaryEstimate');
const summaryDeliveryCost = document.querySelector('#summaryDeliveryCost');
const summaryColor = document.querySelector('#summaryColor');
const colorSelect = document.querySelector('#colorSelect');
const quantitySelect = document.querySelector('#quantitySelect');
const cityInput = document.querySelector('#cityInput');
const departmentSelect = document.querySelector('#departmentSelect');
const neighborhoodInput = document.querySelector('input[name="neighborhood"]');
const addressInput = document.querySelector('textarea[name="address"]');
const notesInput = document.querySelector('input[name="notes"]');
const mapsInput = document.querySelector('input[name="map"]');
const nameInput = document.querySelector('input[name="name"]');
const phoneInput = document.querySelector('input[name="phone"]');
const step1 = document.querySelector('.step-panel[data-step-panel="1"]');
const step2 = document.querySelector('.step-panel[data-step-panel="2"]');
const step3 = document.querySelector('.step-panel[data-step-panel="3"]');
const stepDots = document.querySelectorAll('.step-dot');
const formError = document.querySelector('#formError');
const step2FormError = document.querySelector('#step2FormError');
const deliveryNotice = document.querySelector('#deliveryNotice');
const paymentNote = document.querySelector('#paymentNote');
const checkoutLoader = document.querySelector('#checkoutLoader');
const floatCta = document.querySelector('#floatCta');
let map;
let mapMarker;
let selectedMapLink = '';
let activeMapInput = null;
let currentQuantity = 1;

const pricesByQuantity = {
  1: 199000,
  2: 369000,
  3: 519000,
};

function trackingPayload(quantity = currentQuantity) {
  const subtotal = pricesByQuantity[quantity] || pricesByQuantity[1] || CONFIG.productPrice;
  return {
    producto: CONFIG.productName,
    precio: CONFIG.productPrice,
    cantidad: quantity,
    subtotal,
    moneda: CONFIG.currency,
    currency: CONFIG.currency,
    value: subtotal,
    items: [{ item_name: CONFIG.productName, price: CONFIG.productPrice, quantity }],
    origen: CONFIG.origin,
    url: window.location.href,
  };
}

function metaPayload(payload) {
  const quantity = Number(payload.cantidad || payload.quantity || 1);
  const value = Number(payload.subtotal || payload.value || CONFIG.productPrice * quantity);

  return {
    content_name: CONFIG.productName,
    content_type: 'product',
    content_ids: [CONFIG.origin],
    contents: [{ id: CONFIG.origin, quantity, item_price: CONFIG.productPrice }],
    value,
    currency: CONFIG.currency,
    quantity,
    num_items: quantity,
    order_id: payload.transaction_id,
  };
}

function sendMetaFallback(eventName, payload = trackingPayload()) {
  const eventPayload = metaPayload(payload);
  const params = new URLSearchParams({
    id: CONFIG.metaPixelId,
    ev: eventName,
    dl: window.location.href,
    rl: document.referrer || '',
    if: 'false',
    ts: String(Date.now()),
    cd: JSON.stringify(eventPayload),
  });

  const img = new Image();
  img.src = `https://www.facebook.com/tr?${params.toString()}`;
}

function fireTracking(key, callback) {
  if (trackingFired.has(key)) return;
  trackingFired.add(key);
  callback();
}

function trackGA(eventName, payload = trackingPayload()) {
  if (typeof window.gtag === 'function') window.gtag('event', eventName, payload);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...payload });
}

function trackMeta(eventName, payload = trackingPayload()) {
  if (typeof window.fbq !== 'function') {
    sendMetaFallback(eventName, payload);
    return;
  }
  const options = payload.transaction_id ? { eventID: payload.transaction_id } : undefined;
  window.fbq('trackSingle', CONFIG.metaPixelId, eventName, metaPayload(payload), options);
}

function trackMetaPageView() {
  // PageView is already fired by the Meta Pixel snippet in index.html.
}

function trackLandingEvent(eventName, payload = trackingPayload()) {
  const events = {
    page_view: () => {
      fireTracking('ga4:page_view', () => trackGA('page_view', payload));
      fireTracking('meta:PageView', () => trackMetaPageView());
    },
    view_item: () => {
      fireTracking('ga4:view_item', () => trackGA('view_item', payload));
      fireTracking('meta:ViewContent', () => trackMeta('ViewContent', payload));
    },
    add_to_cart: () => {
      fireTracking('ga4:add_to_cart', () => trackGA('add_to_cart', payload));
      fireTracking('meta:AddToCart', () => trackMeta('AddToCart', payload));
    },
    begin_checkout: () => {
      fireTracking('ga4:begin_checkout', () => trackGA('begin_checkout', payload));
      fireTracking('meta:InitiateCheckout', () => trackMeta('InitiateCheckout', payload));
    },
    add_payment_info: () => {
      fireTracking('ga4:add_payment_info', () => trackGA('add_payment_info', payload));
      fireTracking('meta:AddPaymentInfo', () => trackMeta('AddPaymentInfo', payload));
    },
    lead: () => {
      fireTracking('ga4:generate_lead', () => trackGA('generate_lead', payload));
      fireTracking('meta:Lead', () => trackMeta('Lead', payload));
    },
    purchase: () => {
      fireTracking('ga4:purchase', () => trackGA('purchase', payload));
      fireTracking('meta:Purchase', () => trackMeta('Purchase', payload));
    },
    contact: () => {
      fireTracking('ga4:contact', () => trackGA('contact', payload));
      fireTracking('meta:Contact', () => trackMeta('Contact', payload));
    },
  };
  events[eventName]?.();
}

function formatGuarani(value) {
  return `Gs. ${Number(value).toLocaleString('es-PY')}`;
}

function getQuantityText(quantity) {
  return `${quantity} ${quantity === 1 ? 'unidad' : 'unidades'}`;
}

function updateOrderSummary() {
  const quantity = currentQuantity;
  const price = pricesByQuantity[quantity] || pricesByQuantity[1];
  const quantityText = getQuantityText(quantity);
  const totalText = formatGuarani(price);
  const unitPriceText = formatGuarani(CONFIG.productPrice);

  if (qtyNumber) qtyNumber.textContent = quantity;
  if (productPriceTop) productPriceTop.textContent = totalText;
  if (summaryUnitPrice) summaryUnitPrice.textContent = unitPriceText;
  if (summaryQuantityText) summaryQuantityText.textContent = quantityText;
  if (summaryQuantity) summaryQuantity.textContent = quantityText;
  if (summaryTotal) summaryTotal.textContent = totalText;
  if (summaryUnitPriceDisplay) summaryUnitPriceDisplay.textContent = unitPriceText;
  if (summaryQtyDisplay) summaryQtyDisplay.textContent = quantityText;
  if (summaryTotalDisplay) summaryTotalDisplay.textContent = totalText;
  if (summaryProfit) summaryProfit.textContent = 'Se calcula en Panel Admin';
}

function updateCheckoutSummary() {
  const quantity = currentQuantity;
  const price = pricesByQuantity[quantity] || pricesByQuantity[1];
  const totalText = formatGuarani(price);
  const unitPriceText = formatGuarani(CONFIG.productPrice);
  if (summaryUnitPriceDisplay) summaryUnitPriceDisplay.textContent = unitPriceText;
  if (summaryQtyDisplay) summaryQtyDisplay.textContent = getQuantityText(quantity);
  if (summaryTotalDisplay) summaryTotalDisplay.textContent = totalText;
}

function setupQtyStepper() {
  if (qtyMinus) {
    qtyMinus.addEventListener('click', () => {
      if (currentQuantity > 1) {
        currentQuantity--;
        updateOrderSummary();
        updateStep3Summary();
        updateDeliveryNotice();
        saveFormDataToLocalStorage();
      }
    });
  }
  if (qtyPlus) {
    qtyPlus.addEventListener('click', () => {
      if (currentQuantity < 3) {
        currentQuantity++;
        updateOrderSummary();
        updateStep3Summary();
        updateDeliveryNotice();
        saveFormDataToLocalStorage();
      }
    });
  }
}

function updateFooterSummary() {
  const footerQty = document.querySelector('#footerQuantitySelect');
  const footerSummaryQty = document.querySelector('#footerSummaryQuantity');
  const footerSummaryQtyText = document.querySelector('#footerSummaryQty');
  const footerSummaryTotal = document.querySelector('#footerSummaryTotal');

  if (!footerQty) return;

  const quantity = Number(footerQty.value || 1);
  const price = pricesByQuantity[quantity] || pricesByQuantity[1];
  const quantityText = getQuantityText(quantity);
  const totalText = formatGuarani(price);

  if (footerSummaryQty) footerSummaryQty.textContent = quantityText;
  if (footerSummaryQtyText) footerSummaryQtyText.textContent = quantityText;
  if (footerSummaryTotal) footerSummaryTotal.textContent = totalText;
}

function isCashOnDeliveryArea(value) {
  const city = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const centralCities = ['asuncion', 'central', 'san lorenzo', 'fernando de la mora', 'luque', 'capitata', 'capiata', 'lambare', 'mariano roque alonso', 'nemby', '├▒emby', 'villa elisa', 'san antonio', 'limpio', 'itaugua', 'ita', 'aregua', 'ypane', 'yaguaron'];

  return centralCities.some((area) => city.includes(area.normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
}

function cleanText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function getDeliveryZone(city) {
  if (!city) return 'No informado';
  return isCashOnDeliveryArea(city) ? 'Asunci├│n/Central' : 'Interior';
}

function updateDeliveryNotice() {
  if (!citySelect || !deliveryNotice) return;

  const value = citySelect.value;
  if (!value) {
    deliveryNotice.textContent = 'Seleccioná una ciudad para ver los detalles de envío.';
    deliveryNotice.className = 'delivery-notice';
    if (summaryShippingDisplay) { summaryShippingDisplay.textContent = 'Según ciudad'; summaryShippingDisplay.className = 'summary-value'; }
    return;
  }

  const isKnownCashArea = isCashOnDeliveryArea(value);

  if (isKnownCashArea) {
    deliveryNotice.textContent = 'Pago contra entrega disponible en esta zona.';
    deliveryNotice.className = 'delivery-notice delivery-ok';
    if (paymentNote) paymentNote.textContent = 'No pagás nada ahora, abonás al recibir.';
    if (summaryShippingDisplay) { summaryShippingDisplay.textContent = 'Gratis'; summaryShippingDisplay.className = 'summary-value shipping-value'; }
  } else {
    deliveryNotice.textContent = 'Coordinaremos el envío y la forma de pago por WhatsApp.';
    deliveryNotice.className = 'delivery-notice delivery-interior';
    if (paymentNote) paymentNote.textContent = 'Coordinaremos el envío y el medio de pago por WhatsApp.';
    if (summaryShippingDisplay) { summaryShippingDisplay.textContent = 'A coordinar'; summaryShippingDisplay.className = 'summary-value'; }
  }
}

function setDeliveryNoticeText(notice, value) {
  if (!notice) return;

  const isKnownCashArea = value && isCashOnDeliveryArea(value);
  notice.classList.toggle('delivery-ok', Boolean(isKnownCashArea));
  notice.classList.toggle('delivery-interior', Boolean(value && !isKnownCashArea));

  if (!value) {
    notice.textContent = 'Asunci├│n y Central: env├¡o gratis y pago contra entrega. Interior: se coordina antes del despacho.';
    return;
  }

  notice.textContent = isKnownCashArea
    ? 'Zona habilitada para env├¡o gratis y pago contra entrega. No abon├ís nada ahora.'
    : 'Para env├¡os al interior se coordina una se├▒a previa antes del despacho.';
}

function initFormDeliveryNotices() {
  orderForms.forEach((form) => {
    const city = form.querySelector('[name="city"]');
    const notice = form.querySelector('.delivery-notice');
    if (!city || !notice) return;

    setDeliveryNoticeText(notice, city.value.trim());
    city.addEventListener('input', () => setDeliveryNoticeText(notice, city.value.trim()));
  });
}

function setMapLink(link) {
  selectedMapLink = link;
  const mapLinkInput = document.querySelector('#mapLinkInput');
  const mapOpenLink = document.querySelector('#mapOpenLink');

  if (mapLinkInput) mapLinkInput.value = link;
  if (mapOpenLink) mapOpenLink.href = link || 'https://www.google.com/maps';
}

function createGoogleMapsLink(lat, lng) {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

function updateMapLocation(lat, lng, zoom = 16) {
  setMapLink(createGoogleMapsLink(lat, lng));

  if (!map) return;
  map.setView([lat, lng], zoom);
  if (!mapMarker) {
    mapMarker = L.marker([lat, lng], { draggable: true }).addTo(map);
    mapMarker.on('dragend', () => {
      const position = mapMarker.getLatLng();
      updateMapLocation(position.lat, position.lng, map.getZoom());
    });
    return;
  }

  mapMarker.setLatLng([lat, lng]);
}

function initMapInstance() {
  if (map || typeof L === 'undefined') return;

  const defaultLocation = [-25.2637, -57.5759];
  map = L.map('mapPicker', { zoomControl: true }).setView(defaultLocation, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);
  map.on('click', (event) => updateMapLocation(event.latlng.lat, event.latlng.lng, map.getZoom()));
  updateMapLocation(defaultLocation[0], defaultLocation[1], 13);
}

function openMapModal(event) {
  const mapModal = document.querySelector('#mapModal');
  if (!mapModal) return;

  activeMapInput = document.querySelector(`#${event?.currentTarget?.dataset?.mapTarget || 'mapsInput'}`) || document.querySelector('#mapsInput');
  mapModal.classList.remove('hidden');
  initMapInstance();
  setTimeout(() => { if (map) map.invalidateSize(); }, 100);
}

function closeMapModal() {
  document.querySelector('#mapModal')?.classList.add('hidden');
}

async function searchMapLocation() {
  const mapSearch = document.querySelector('#mapSearch');
  const mapError = document.querySelector('#mapError');
  const query = mapSearch?.value.trim();

  if (!query) {
    if (mapError) mapError.textContent = 'Escrib├¡ una direcci├│n o lugar para buscar.';
    return;
  }

  if (mapError) mapError.textContent = 'Buscando ubicaci├│n...';
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(`${query}, Paraguay`)}`);
    const results = await response.json();
    if (!results.length) {
      if (mapError) mapError.textContent = 'No encontramos esa direcci├│n. Prob├í con otra referencia.';
      return;
    }

    updateMapLocation(Number(results[0].lat), Number(results[0].lon), 17);
    if (mapError) mapError.textContent = 'Toc├í el mapa o arrastr├í el pin para ajustar la ubicaci├│n exacta.';
  } catch (error) {
    if (mapError) mapError.textContent = 'No se pudo buscar. Toc├í directamente el mapa para marcar la ubicaci├│n.';
  }
}

function initMapPicker() {
  document.querySelectorAll('[data-open-map]').forEach((button) => button.addEventListener('click', (event) => openMapModal(event)));
  document.querySelectorAll('[data-close-map]').forEach((button) => button.addEventListener('click', closeMapModal));
  document.querySelector('#mapModal')?.addEventListener('click', (event) => {
    if (event.target.id === 'mapModal') closeMapModal();
  });
  document.querySelector('#mapSearchButton')?.addEventListener('click', searchMapLocation);
  document.querySelector('#mapSearch')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      searchMapLocation();
    }
  });
  document.querySelector('#mapLinkInput')?.addEventListener('input', (event) => {
    selectedMapLink = event.target.value.trim();
    const mapOpenLink = document.querySelector('#mapOpenLink');
    if (mapOpenLink) mapOpenLink.href = selectedMapLink || 'https://www.google.com/maps';
  });
  document.querySelector('#mapConfirm')?.addEventListener('click', () => {
    const link = document.querySelector('#mapLinkInput')?.value.trim() || selectedMapLink;
    if (activeMapInput) activeMapInput.value = link;
    closeMapModal();
  });
}

function showCheckout() {
  if (!productPage || !checkoutPage) return;

  trackLandingEvent('begin_checkout');
  productPage.hidden = true;
  checkoutPage.hidden = false;
  document.body.classList.add('checkout-open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showProduct() {
  if (!productPage || !checkoutPage) return;

  checkoutPage.hidden = true;
  productPage.hidden = false;
  document.body.classList.remove('checkout-open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function generateOrderNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 90000) + 10000);
  return `VG-${y}${m}${d}-${seq}`;
}

function getComboName(quantity) {
  return `${quantity} ${quantity === 1 ? 'unidad' : 'unidades'}`;
}

function saveOrder(order) {
  const orders = JSON.parse(localStorage.getItem('bagOrders') || '[]');
  orders.push(order);
  localStorage.setItem('bagOrders', JSON.stringify(orders));
}

function buildSupabasePayload(order) {
  // La tabla compartida `pedidos_web` solo tiene el conjunto base de columnas.
  // Los datos extra (barrio, observaciones, envío, UTM, dispositivo) se guardan
  // dentro de `referencia` para no perder información ni romper el insert.
  const refParts = [];
  if (order.barrio) refParts.push(`Barrio: ${order.barrio}`);
  if (order.referencia) refParts.push(`Ref: ${order.referencia}`);
  if (order.observaciones) refParts.push(`Obs: ${order.observaciones}`);
  refParts.push(order.costo_envio === 0
    ? 'Envío gratis · Pago contra entrega'
    : 'Interior · Coordinar envío y pago por WhatsApp');
  const utm = [order.utm_source, order.utm_medium, order.utm_campaign].filter(Boolean).join('/');
  if (utm) refParts.push(`UTM: ${utm}`);
  if (order.dispositivo || order.device_type) refParts.push(`Disp: ${order.dispositivo || order.device_type}`);

  return {
    id: order.id || order.numero_pedido,
    producto: order.producto || order.producto_nombre,
    precio: order.precio_unitario || order.precio,
    cantidad: order.cantidad,
    subtotal: order.total || order.subtotal,
    ganancia: order.ganancia || 0,
    nombre: order.nombre || order.nombre_cliente,
    telefono: order.telefono || order.telefono_whatsapp,
    correo: 'No informado',
    ci: 'No informado',
    departamento: order.departamento || 'No informado',
    ciudad: order.ciudad,
    direccion: order.direccion || 'No informado',
    referencia: refParts.join(' | ') || 'Sin referencia',
    ubicacion_maps: order.ubicacion_maps || 'No informado',
    estado: order.estado || 'Pendiente',
    origen: order.origen || CONFIG.origin,
    created_at: order.created_at || new Date().toISOString(),
  };
}

async function saveOrderToSupabase(order) {
  const payload = buildSupabasePayload(order);
  const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/${CONFIG.supabaseTable}`, {
    method: 'POST',
    headers: {
      apikey: CONFIG.supabaseAnonKey,
      Authorization: `Bearer ${CONFIG.supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Error guardando pedido en Supabase.');
  }
}

function showConfirmation(order) {
  if (orderNumber) orderNumber.textContent = order.id;
  if (confProduct) confProduct.textContent = CONFIG.productName;
  if (confQuantity) confQuantity.textContent = getQuantityText(order.cantidad || currentQuantity);
  if (confTotal) confTotal.textContent = formatGuarani(order.total || pricesByQuantity[currentQuantity]);
  if (confCity) confCity.textContent = order.ciudad || '—';
  if (confirmationWhatsapp) {
    const msg = encodeURIComponent(`Hola, realicé el pedido ${order.id} de ${CONFIG.productName}. Quiero confirmar mis datos para la entrega.`);
    confirmationWhatsapp.href = `https://wa.me/595972738779?text=${msg}`;
  }
  if (productPage) productPage.hidden = true;
  if (checkoutPage) checkoutPage.hidden = false;
  confirmation?.classList.remove('hidden');
  document.body.classList.add('checkout-open');
  document.documentElement.style.overflow = 'hidden';
}

function closeConfirmation() {
  confirmation?.classList.add('hidden');
  document.documentElement.style.overflow = '';
  showProduct();
}

// Step navigation
let currentStep = 1;

function goToStep(step) {
  currentStep = step;
  document.querySelectorAll('.step-panel').forEach(p => { p.hidden = Number(p.dataset.stepPanel) !== step; });
  document.querySelectorAll('.step-dot').forEach(d => {
    const s = Number(d.dataset.stepDot);
    d.classList.toggle('active', s === step);
    d.classList.toggle('done', s < step);
  });
  document.querySelector('.checkout-shell')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (step === 3) updateFinalSummary();
}

function validateStep(step) {
  if (step === 2) {
    if (!nameInput?.value?.trim()) { if (step2FormError) step2FormError.textContent = 'Ingresá tu nombre.'; nameInput?.focus(); return false; }
    if (!phoneInput?.value?.trim()) { if (step2FormError) step2FormError.textContent = 'Ingresá tu WhatsApp.'; phoneInput?.focus(); return false; }
    if (!cityInput?.value?.trim()) { if (step2FormError) step2FormError.textContent = 'Ingresá tu ciudad.'; cityInput?.focus(); return false; }
    if (!addressInput?.value?.trim()) { if (step2FormError) step2FormError.textContent = 'Ingresá tu dirección.'; addressInput?.focus(); return false; }
    if (step2FormError) step2FormError.textContent = '';
    return true;
  }
  return true;
}

document.querySelectorAll('.step-next').forEach(btn => {
  btn.addEventListener('click', () => {
    if (validateStep(currentStep)) goToStep(Number(btn.dataset.next));
  });
});

document.querySelectorAll('.step-back').forEach(btn => {
  btn.addEventListener('click', () => goToStep(Number(btn.dataset.back)));
});

purchaseForm?.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && currentStep !== 3) {
    e.preventDefault();
    document.querySelector(`.step-panel[data-step-panel="${currentStep}"] .step-next`)?.click();
  }
});

function updateOrderSummary() {
  const qty = Number(quantitySelect?.value || 1);
  const price = pricesByQuantity[qty] || pricesByQuantity[1];
  if (productPriceTop) productPriceTop.textContent = formatGuarani(price);
}

quantitySelect?.addEventListener('change', updateOrderSummary);
updateOrderSummary();

backLink?.addEventListener('click', (event) => {
  event.preventDefault();
  showProduct();
});

closeCheckout?.addEventListener('click', showProduct);

document.querySelectorAll('a[href="#checkout"]').forEach((link) => {
  if (link.id === 'floatCta') return;
  link.addEventListener('click', (event) => {
    event.preventDefault();
    trackLandingEvent('add_to_cart');
    showCheckout();
  });
});

document.querySelector('[data-close-confirmation]')?.addEventListener('click', closeConfirmation);
confirmation?.addEventListener('click', (event) => {
  if (event.target.id === 'confirmation') closeConfirmation();
});

setupWhatsAppTracking();
trackLandingEvent('page_view');
trackLandingEvent('view_item');

const COVERAGE_CITIES = [
  'Asunción', 'San Lorenzo', 'Capiatá', 'Luque', 'Fernando de la Mora',
  'Lambaré', 'Mariano Roque Alonso', 'Limpio', 'Ñemby', 'Villa Elisa',
  'Areguá', 'Ypané'
];

function isCashOnDeliveryArea(city) {
  if (!city) return false;
  const c = city.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return COVERAGE_CITIES.some(ci => ci.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') === c);
}

function setDeliveryNotice(value) {
  if (!deliveryNotice) return;
  const available = isCashOnDeliveryArea(value);
  deliveryNotice.classList.toggle('delivery-ok', Boolean(value && available));
  deliveryNotice.classList.toggle('delivery-interior', Boolean(value && !available));
  deliveryNotice.innerHTML = value
    ? (available
      ? '<strong>✅ Zona habilitada:</strong> envío gratis y pago contra entrega.'
      : '<strong>📦 Envío por transportadora:</strong> coordinamos el pago previo y el despacho.')
    : '<strong>Formas de pago:</strong> Asunción y Central: envío gratis y pago contra entrega. Interior: te contactamos para coordinar.';
}

cityInput?.addEventListener('input', () => setDeliveryNotice(cityInput.value));

function updateFinalSummary() {
  const qty = Number(quantitySelect?.value || 1);
  const color = colorSelect?.value || 'Negro';
  const price = pricesByQuantity[qty] || pricesByQuantity[1];
  const city = cityInput?.value?.trim() || '';
  const address = addressInput?.value?.trim() || '';
  const neighborhood = neighborhoodInput?.value?.trim() || '';
  const available = isCashOnDeliveryArea(city);

  if (summaryColor) summaryColor.textContent = color;
  if (summaryQuantity) summaryQuantity.textContent = getQuantityText(qty);
  if (summaryUnitPrice) summaryUnitPrice.textContent = formatGuarani(price);
  if (summaryDeliveryCost) summaryDeliveryCost.textContent = available ? 'Gratis' : 'A coordinar';
  if (summaryTotal) summaryTotal.textContent = formatGuarani(price);
  if (summaryCity) summaryCity.textContent = city || '-';
  if (summaryAddress) summaryAddress.textContent = address ? address + (neighborhood ? ' - Barrio ' + neighborhood : '') : '-';
  if (summaryPayment) summaryPayment.textContent = available ? 'Pago contra entrega' : 'Pago previo (transportadora)';
  if (summaryEstimate) summaryEstimate.textContent = available ? '24 a 72 horas' : 'A coordinar';
  if (paymentNote) paymentNote.textContent = available
    ? 'No pagás nada ahora. Pagás en efectivo cuando recibís tu pedido.'
    : 'Coordinaremos el pago previo y el envío por transportadora antes del despacho.';
}

// Visitor tracking
(function () {
  const cfg = CONFIG;
  const SUPABASE_URL = cfg.supabaseUrl;
  const SUPABASE_KEY = cfg.supabaseAnonKey;
  const TRACK_URL = `${SUPABASE_URL}/functions/v1/track-visitor`;
  let sessionId = sessionStorage.getItem('lp_session_id') || 'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
  sessionStorage.setItem('lp_session_id', sessionId);
  let hbInterval = null;
  let hidden = false;

  function send(event, extra = {}) {
    if (!SUPABASE_URL || !SUPABASE_KEY) return;
    const params = new URLSearchParams(window.location.search);
    fetch(TRACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({
        event, sessionId, pageUrl: location.href, pageTitle: document.title,
        referrer: document.referrer, userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`, viewport: `${innerWidth}x${innerHeight}`,
        landingPage: cfg.origin, timestamp: new Date().toISOString(),
        utmSource: params.get('utm_source'), utmMedium: params.get('utm_medium'),
        utmCampaign: params.get('utm_campaign'), utmContent: params.get('utm_content'),
        utmTerm: params.get('utm_term'), ...extra
      }),
      keepalive: event === 'page_hide'
    }).catch(() => { });
  }

  function startHb() { if (!hbInterval) hbInterval = setInterval(() => { if (!hidden && document.visibilityState === 'visible') send('heartbeat'); }, 30000); }
  function stopHb() { if (hbInterval) { clearInterval(hbInterval); hbInterval = null; } }
  document.addEventListener('visibilitychange', () => { hidden = document.hidden; if (hidden) { send('page_hide'); stopHb(); } else { send('page_view'); startHb(); } });
  window.addEventListener('beforeunload', () => send('page_hide'));
  window.addEventListener('pagehide', () => send('page_hide'));

  send('page_view');
  startHb();

  window.VisitorTracker = { trackEvent: send, trackEcommerce: (evt, data) => send(evt, { productName: data?.productName || cfg.productName, productPrice: data?.productPrice || cfg.productPrice, orderId: data?.orderId, revenue: data?.revenue }), getSessionId: () => sessionId };
})();

function setupInputAutoSave() {
  const inputs = [nameInput, phoneInput, citySelect, neighborhoodInput, addressInput, referenceInput, observationsInput, mapsInput].filter(Boolean);
  inputs.forEach(input => {
    input.addEventListener('input', saveFormDataToLocalStorage);
    if (input.tagName === 'SELECT') {
      input.addEventListener('change', saveFormDataToLocalStorage);
    }
  });
}

function setupWhatsAppTracking() {
  document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
    link.addEventListener('click', () => {
      trackLandingEvent('contact');
    });
  });
}

// Enable confirm button when checkbox is checked
orderForms.forEach((form) => form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const quantity = Number(formData.get('quantity') || 1);
  const submitButton = form.querySelector('button[type="submit"]');
  const currentFormError = form.querySelector('.form-error') || formError;

  // Prevent double click
  if (window._submitting) return;
  window._submitting = true;

  const city = cleanText(formData.get('city'));
  const department = cleanText(formData.get('department'), getDeliveryZone(city));
  const address = cleanText(formData.get('address'), 'No informado');
  const neighborhood = cleanText(formData.get('neighborhood'));
  const notes = cleanText(formData.get('notes'));
  const observations = cleanText(formData.get('observations'));
  const mapUrl = cleanText(formData.get('map'), 'No informado');
  const subtotal = pricesByQuantity[quantity] || pricesByQuantity[1];
  const paymentMode = isCashOnDeliveryArea(city) ? 'cash_on_delivery' : 'deposit_required_for_interior';
  const orderId = generateOrderNumber();
  const shipping = isCashOnDeliveryArea(city) ? 0 : null;
  const total = shipping === 0 ? subtotal : subtotal;

  // Get UTM params
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source') || '';
  const utmMedium = params.get('utm_medium') || '';
  const utmCampaign = params.get('utm_campaign') || '';
  const utmContent = params.get('utm_content') || '';
  const utmTerm = params.get('utm_term') || '';
  const trafficSource = document.referrer ? 'referral' : 'direct';

  // Get device type
  const ua = navigator.userAgent;
  const deviceType = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua) ? 'tablet' : /Mobile|Android|iPhone|iP(hone|od)|BlackBerry|IEMobile|Opera Mini/i.test(ua) ? 'mobile' : 'desktop';

  // Get FBP/FBC from cookie
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : '';
  };
  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');

  const order = {
    id: orderId,
    numero_pedido: orderId,
    producto_id: CONFIG.origin,
    producto_nombre: CONFIG.productName,
    producto: CONFIG.productName,
    producto_imagen: 'IMG/Inicio1.png',
    precio_unitario: CONFIG.productPrice,
    precio: CONFIG.productPrice,
    cantidad: quantity,
    subtotal,
    costo_envio: shipping,
    total,
    ganancia: 0,
    nombre_cliente: cleanText(formData.get('name')),
    nombre: cleanText(formData.get('name')),
    telefono_whatsapp: cleanText(formData.get('phone')),
    telefono: cleanText(formData.get('phone')),
    departamento: department,
    ciudad: city,
    barrio: neighborhood,
    direccion: address,
    referencia: notes,
    ubicacion_maps: mapUrl,
    observaciones: observations,
    estado: 'Pendiente de confirmación',
    origen: CONFIG.origin,
    fuente_trafico: trafficSource,
    pagina_origen: CONFIG.origin,
    dispositivo: deviceType,
    device_type: deviceType,
    traffic_source: trafficSource,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_content: utmContent,
    utm_term: utmTerm,
    meta_fbp: fbp,
    meta_fbc: fbc,
    created_at: new Date().toISOString(),
  };

  if (currentFormError) currentFormError.textContent = '';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Registrando pedido…';
  }
  if (checkoutLoader) checkoutLoader.classList.remove('hidden');

  try {
    saveOrder(order);
    await saveOrderToSupabase(order);

    const payload = { ...trackingPayload(quantity), transaction_id: order.id, value: total };
    trackLandingEvent('lead', payload);
    trackLandingEvent('purchase', payload);

    // La notificación a Telegram la dispara el trigger de Supabase al insertar el pedido.

    localStorage.removeItem('checkout_name');
    localStorage.removeItem('checkout_phone');
    localStorage.removeItem('checkout_city');
    localStorage.removeItem('checkout_address');
    localStorage.removeItem('checkout_neighborhood');

    form.reset();
    currentQuantity = 1;
    if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Realizar pedido'; }
    if (checkoutLoader) checkoutLoader.classList.add('hidden');

    updateOrderSummary();
    setDeliveryNotice(cityInput?.value || '');

    showConfirmation({
      id: order.id,
      phone: order.telefono,
      nombre: order.nombre,
      ciudad: order.ciudad,
      direccion: order.direccion,
      cantidad: order.cantidad,
      total: order.total,
    });
  } catch (error) {
    console.error(error);
    if (currentFormError) currentFormError.textContent = 'Ocurrió un error al procesar tu pedido. Por favor, intentá nuevamente.';
    if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Realizar pedido'; }
    if (checkoutLoader) checkoutLoader.classList.add('hidden');
  } finally {
    window._submitting = false;
  }
}));

// Floating CTA scroll behavior
if (floatCta) {
  let floatCtaTimer = null;

  window.addEventListener('scroll', () => {
    if (floatCtaTimer) clearTimeout(floatCtaTimer);
    floatCta.classList.add('visible');

    floatCtaTimer = setTimeout(() => {
      const checkoutOpen = document.body.classList.contains('checkout-open');
      if (!checkoutOpen) {
        floatCta.classList.remove('visible');
      }
    }, 3000);
  });

  floatCta.addEventListener('click', (event) => {
    event.preventDefault();
    trackLandingEvent('add_to_cart');
    showCheckout();
  });
}

