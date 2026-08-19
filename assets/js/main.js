/* =========================================================
   Vida Abundante de Puebla — Script principal
   - Menú móvil
   - Resaltado de enlace activo
   - Pestañas de la sección de registro
   - Validación y envío de formularios (Formspree)
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Menú móvil ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  /* ---------- Resaltar enlace activo ---------- */
  var current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === current) { a.classList.add('active'); }
  });

  /* ---------- Pestañas genéricas (data-tab-group) ---------- */
  document.querySelectorAll('[data-tab-group]').forEach(function (group) {
    var groupId = group.getAttribute('data-tab-group');
    var buttons = group.querySelectorAll('.tab-btn');
    var panels = document.querySelectorAll('[data-tab-panel="' + groupId + '"]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('active'); });
        panels.forEach(function (p) { p.classList.remove('active'); });
        btn.classList.add('active');
        var target = btn.getAttribute('data-tab-target');
        var panel = document.querySelector('[data-tab-panel="' + groupId + '"][data-tab-id="' + target + '"]');
        if (panel) { panel.classList.add('active'); }
      });
    });
  });

  /* ---------- Alternador modo de registro (rápido / completo) ---------- */
  document.querySelectorAll('[data-mode-group]').forEach(function (group) {
    var buttons = group.querySelectorAll('.reg-mode-btn');
    var panels = document.querySelectorAll('[data-mode-panel]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('active'); });
        panels.forEach(function (p) { p.style.display = 'none'; });
        btn.classList.add('active');
        var target = btn.getAttribute('data-mode-target');
        var panel = document.querySelector('[data-mode-panel="' + target + '"]');
        if (panel) { panel.style.display = 'block'; }
      });
    });
  });

  /* ---------- Validación y envío AJAX para formularios Formspree ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  document.querySelectorAll('form[data-ajax-form]').forEach(function (form) {
    /* Las cajas de alerta viven junto al formulario (mismo contenedor padre),
       no dentro de él, así que buscamos en el padre para encontrarlas. */
    var alertScope = form.parentElement || form;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var isValid = true;
      var firstInvalid = null;

      form.querySelectorAll('[required]').forEach(function (field) {
        var row = field.closest('.form-row');
        var value = field.value.trim();
        var fieldValid = value.length > 0;

        if (field.type === 'email' && value.length > 0) {
          fieldValid = EMAIL_RE.test(value);
        }

        if (row) {
          row.classList.toggle('invalid', !fieldValid);
        }
        if (!fieldValid) {
          isValid = false;
          if (!firstInvalid) firstInvalid = field;
        }
      });

      var successAlert = alertScope.querySelector('.alert--success');
      var errorAlert = alertScope.querySelector('.alert--error');
      if (successAlert) successAlert.classList.remove('show');
      if (errorAlert) errorAlert.classList.remove('show');

      if (!isValid) {
        if (errorAlert) {
          errorAlert.textContent = 'Por favor revisa los campos marcados en rojo.';
          errorAlert.classList.add('show');
        }
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var endpoint = form.getAttribute('action') || '';
      var placeholderEndpoint = endpoint.indexOf('TU_ID_DE_FORMSPREE') !== -1 || endpoint.trim() === '' || endpoint.indexOf('#') === 0;

      if (placeholderEndpoint) {
        /* Formspree todavía no está configurado: mostramos aviso claro en vez de fallar en silencio */
        if (errorAlert) {
          errorAlert.textContent = 'Este formulario aún no está conectado. Configura tu ID de Formspree en el código (ver instrucciones.txt) para que las inscripciones te lleguen por correo.';
          errorAlert.classList.add('show');
        }
        return;
      }

      var submitBtn = form.querySelector('[type="submit"]');
      var originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) { submitBtn.textContent = 'Enviando...'; submitBtn.disabled = true; }

      var data = new FormData(form);

      fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      }).then(function (response) {
        if (response.ok) {
          form.reset();
          form.querySelectorAll('.form-row.invalid').forEach(function (r) { r.classList.remove('invalid'); });
          if (successAlert) {
            successAlert.classList.add('show');
            successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          if (errorAlert) {
            errorAlert.textContent = 'No se pudo enviar el formulario. Intenta de nuevo o contáctanos directamente.';
            errorAlert.classList.add('show');
          }
        }
      }).catch(function () {
        if (errorAlert) {
          errorAlert.textContent = 'No se pudo enviar el formulario. Revisa tu conexión e intenta de nuevo.';
          errorAlert.classList.add('show');
        }
      }).finally(function () {
        if (submitBtn) { submitBtn.textContent = originalText; submitBtn.disabled = false; }
      });
    });

    /* Quitar el estado de error al escribir */
    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      field.addEventListener('input', function () {
        var row = field.closest('.form-row');
        if (row) row.classList.remove('invalid');
      });
    });
  });

  /* ---------- Año actual en el footer ---------- */
  document.querySelectorAll('[data-current-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
});
