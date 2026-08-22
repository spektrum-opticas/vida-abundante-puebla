/* =========================================================
   Vida Abundante de Puebla — Cargador de contenido editable
   Lee los archivos /data/*.json y llena los elementos marcados
   con data-field / data-field-list. Así el panel de administración
   (/admin) puede editar el sitio sin tocar el HTML.
   ========================================================= */

(function () {
  async function fetchJSON(path) {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  function applySimpleFields(data, prefix) {
    document.querySelectorAll('[data-field^="' + prefix + '."]').forEach(function (el) {
      var key = el.getAttribute('data-field').slice(prefix.length + 1);
      var value = data[key];
      if (value === undefined || value === null || value === '') return;
      if (el.tagName === 'IMG') {
        el.src = value;
      } else if (el.tagName === 'A' && el.hasAttribute('href')) {
        el.textContent = value;
      } else {
        el.textContent = value;
      }
    });
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderHorariosHero(data) {
    var el = document.querySelector('[data-field-list="horarios-hero"]');
    if (!el || !data || !data.length) return;
    el.innerHTML = data.slice(0, 4).map(function (h) {
      return '<div class="hero-schedule-item"><span class="day">' + esc(h.dia) + ' · ' + esc(h.hora) +
        '</span><span>' + esc(h.actividad) + '</span></div>';
    }).join('');
  }

  function renderHorariosTabla(data) {
    var el = document.querySelector('[data-field-list="horarios-tabla"]');
    if (!el || !data || !data.length) return;
    el.innerHTML = '<tr><th>Día</th><th>Actividad</th><th>Hora</th></tr>' +
      data.map(function (h) {
        return '<tr><td>' + esc(h.dia) + '</td><td>' + esc(h.actividad) + '</td><td>' + esc(h.hora) + '</td></tr>';
      }).join('');
  }

  function photoBox(imgUrl, fallbackText) {
    if (imgUrl) {
      return '<div class="card-photo" style="padding:0;"><img src="' + esc(imgUrl) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;"></div>';
    }
    return '<div class="card-photo">' + fallbackText + '</div>';
  }

  function renderMinisterios(data) {
    var el = document.querySelector('[data-field-list="ministerios"]');
    if (!el || !data || !data.length) return;
    el.innerHTML = data.map(function (m) {
      return '<div class="card--photo card">' +
        photoBox(m.imagen, 'Foto de ' + esc(m.nombre) + '<br>(sustituir)') +
        '<div class="card-body"><span class="badge">' + esc(m.categoria) + '</span>' +
        '<h3>' + esc(m.nombre) + '</h3><p>' + esc(m.descripcion) + '</p></div></div>';
    }).join('');
  }

  function renderEventos(data) {
    var el = document.querySelector('[data-field-list="eventos"]');
    if (!el || !data || !data.length) return;
    el.innerHTML = data.map(function (e) {
      return '<div class="card--photo card">' +
        photoBox(e.imagen, 'Evento especial<br>(imagen a sustituir)') +
        '<div class="card-body"><span class="badge">' + esc(e.fecha) + '</span>' +
        '<h3>' + esc(e.nombre) + '</h3><p>' + esc(e.descripcion) + '</p></div></div>';
    }).join('');
  }

  function renderLiderazgo(data) {
    var el = document.querySelector('[data-field-list="liderazgo"]');
    if (!el || !data || !data.length) return;
    el.innerHTML = data.map(function (p) {
      return '<div class="card--photo card">' +
        photoBox(p.foto, 'Foto de ' + esc(p.nombre) + '<br>(sustituir)') +
        '<div class="card-body"><h3>' + esc(p.nombre) + '</h3><p>' + esc(p.cargo) + ' — ' + esc(p.bio) + '</p></div></div>';
    }).join('');
  }

  async function init() {
    var results = await Promise.all([
      fetchJSON('/data/general.json'),
      fetchJSON('/data/hero.json'),
      fetchJSON('/data/horarios.json'),
      fetchJSON('/data/nosotros.json'),
      fetchJSON('/data/ministerios.json'),
      fetchJSON('/data/eventos.json'),
      fetchJSON('/data/instituto.json'),
      fetchJSON('/data/donaciones.json')
    ]);

    var general = results[0], hero = results[1], horarios = results[2], nosotros = results[3],
      ministerios = results[4], eventos = results[5], instituto = results[6], donaciones = results[7];

    if (general) applySimpleFields(general, 'general');
    if (hero) applySimpleFields(hero, 'hero');
    if (nosotros) applySimpleFields(nosotros, 'nosotros');
    if (instituto) applySimpleFields(instituto, 'instituto');
    if (donaciones) applySimpleFields(donaciones, 'donaciones');
    if (horarios) { renderHorariosHero(horarios); renderHorariosTabla(horarios); }
    if (ministerios) renderMinisterios(ministerios);
    if (eventos) renderEventos(eventos);
    if (nosotros && nosotros.liderazgo) renderLiderazgo(nosotros.liderazgo);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
