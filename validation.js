(function () {
  const requiredMessages = {
    nombre: "Ingresá tu nombre completo.",
    telefono: "Ingresá tu teléfono.",
    departamento: "Seleccioná tu departamento.",
    ciudad: "Ingresá tu ciudad.",
    direccion: "Ingresá tu dirección exacta.",
    cantidad: "La cantidad mínima es 1."
  };

  function field(form, name) {
    return form.elements[name];
  }

  function errorNode(form, name) {
    return form.querySelector(`[data-error-for="${name}"]`);
  }

  function setError(form, name, message) {
    const input = field(form, name);
    const error = errorNode(form, name);
    if (input) input.classList.add("field-invalid");
    if (error) {
      error.textContent = message;
      error.style.display = "block";
    }
  }

  function clearError(form, name) {
    const input = field(form, name);
    const error = errorNode(form, name);
    if (input) input.classList.remove("field-invalid");
    if (error) {
      error.textContent = "";
      error.style.display = "none";
    }
  }

  function validateField(form, name) {
    const input = field(form, name);
    if (!input) return true;
    const value = String(input.value || "").trim();
    clearError(form, name);

    if (requiredMessages[name] && !value) {
      setError(form, name, requiredMessages[name]);
      return false;
    }

    if (name === "telefono" && LandingUtils.onlyDigits(value).length < 8) {
      setError(form, name, "Ingresá un teléfono válido con al menos 8 números.");
      return false;
    }

    if (name === "cantidad" && Number(value) < 1) {
      setError(form, name, requiredMessages.cantidad);
      return false;
    }

    return true;
  }

  function validateForm(form) {
    const names = ["nombre", "telefono", "departamento", "ciudad", "direccion", "cantidad"];
    const valid = names.map((name) => validateField(form, name)).every(Boolean);
    const honeypot = field(form, "empresa");
    if (honeypot && honeypot.value.trim()) return { valid: false, spam: true };
    if (!valid) {
      const firstInvalid = form.querySelector(".field-invalid");
      if (firstInvalid && firstInvalid.focus) firstInvalid.focus();
    }
    return { valid, spam: false };
  }

  function attachLiveValidation(form) {
    Array.from(form.elements).forEach((input) => {
      if (!input.name || input.name === "empresa") return;
      input.addEventListener("input", () => validateField(form, input.name));
      input.addEventListener("change", () => validateField(form, input.name));
      input.addEventListener("focus", () => { input.style.borderColor = "#FF6A00"; });
      input.addEventListener("blur", () => { if (!input.classList.contains("field-invalid")) input.style.borderColor = "#333"; });
    });
  }

  window.OrderValidation = { validateForm, validateField, attachLiveValidation, clearError };
})();
