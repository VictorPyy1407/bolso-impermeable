import os

path = r"c:\Users\victo\Documents\MEGA\Leanding Pages\Bolso Impermeable Pages\index.html"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<option value="3" data-price="525000">3 unidades - Gs. 525.000</option>'
end_marker = '<div><dt>Envío</dt><dd class="free">Gratis (Asunción y Central)</dd></div>'

block_to_insert = """
            </select>
          </label>

          <details class="optional-fields">
            <summary>Más detalles</summary>
            <label>
              <span>Dirección</span>
              <textarea name="address" rows="2" autocomplete="street-address" placeholder="Calle, número, zona"></textarea>
            </label>
            <label>
              <span>Barrio</span>
              <input type="text" name="neighborhood" placeholder="Ej: Villa Morra">
            </label>
            <label>
              <span>Referencia</span>
              <input type="text" name="notes" placeholder="Ej: Casa color blanco, portón negro">
            </label>
            <label class="map-field">
              <span>Ubicación Maps</span>
              <div class="location-row">
                <input type="url" name="map" id="mapsInput" placeholder="Pegá enlace de Google Maps" readonly>
                <button type="button" data-open-map>Marcar en mapa</button>
              </div>
            </label>
          </details>

          <button class="order-button pulse-buy" type="submit">
            <span class="btn-text">Confirmar Pedido</span>
            <span class="btn-loader hidden"><span class="spinner"></span> Procesando...</span>
          </button>

          <section class="order-summary">
            <h3>Resumen del pedido</h3>
            <dl>
              <div><dt>Producto elegido</dt><dd>Bolso de Viaje Expandible - <span id="summaryQuantityText">1 unidad</span></dd></div>
              <div><dt>Color</dt><dd id="summaryColor">Rosa</dd></div>
              <div><dt>Cantidad</dt><dd id="summaryQuantity">1 unidad</dd></div>
              """

start_idx = content.find(start_marker) + len(start_marker)
end_idx = content.find(end_marker)

new_content = content[:start_idx] + "\n" + block_to_insert + content[end_idx:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Done")
