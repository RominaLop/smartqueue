// ============================================================
// turno.js  –  SmartQueue
// ============================================================

const IMG_PATH = '/frontend/src/assets/';

const IMAGES = {
    "BBVA México":       "bbva.jpg",
    "Banorte":           "banorte.jpg",
    "Citibanamex":       "citibanamex.jpg",
    "Santander":         "santander.jpg",
    "HSBC México":       "HSBC.jpg",
    "Scotiabank":        "scotiabank.jpg",
    "Banco Azteca":      "banco-azteca.jpg",
    "Banco Inbursa":     "banco-inbursa.jpg",
    "Pampas":            "pampas.jpg",
    "Harrys":            "harrys.jpg",
    "Freds":             "freds.jpg",
    "Puerto Madero":     "puerto-madero.jpg",
    "RosaNegra":         "rosanegra.jpg",
    "Navios":            "navios.jpg",
    "Ilios":             "ilios.jpg",
    "Taboo":             "taboo.jpg",
    "Clínica SmartCare": "clinica.jpg"
};

// Horarios ficticios para clínicas
const HORARIOS_CLINICA = {
    "Clínica SmartCare": { apertura: 7, cierre: 21, emergencias: true }
};

// Info extra para restaurantes
const INFO_RESTAURANTES = {
    "Pampas":        { rating: 4.8, precio: "$$$", tipo: "Asador argentino" },
    "Harrys":        { rating: 4.6, precio: "$$",  tipo: "Bar & Grill" },
    "Freds":         { rating: 4.5, precio: "$$",  tipo: "Mariscos" },
    "Puerto Madero": { rating: 4.9, precio: "$$$", tipo: "Cortes & Vinos" },
    "RosaNegra":     { rating: 4.7, precio: "$$$", tipo: "Fusión mexicana" },
    "Navios":        { rating: 4.4, precio: "$$",  tipo: "Cocina del mar" },
    "Ilios":         { rating: 4.6, precio: "$$",  tipo: "Mediterráneo" },
    "Taboo":         { rating: 4.5, precio: "$$$", tipo: "Beach club" }
};

// ── Estado global ─────────────────────────────────────────────
let placeName   = '';
let categoria   = '';
let countdownVal = 30;
let countdownTimer = null;
let autoRefreshTimer = null;

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    placeName = localStorage.getItem('smartqueue_place') || '';
    categoria = localStorage.getItem('smartqueue_categoria') || '';

    // Mostrar nombre del lugar
    const serviceEl = document.getElementById('service-name');
    if (serviceEl) serviceEl.textContent = placeName || 'Sin servicio';

    await actualizarTurno();
    iniciarAutoRefresh();
    renderExtra();
});

// ── Turno ─────────────────────────────────────────────────────
async function actualizarTurno() {
    try {
        const res = await fetch(`http://localhost:3001/turno/${encodeURIComponent(placeName)}`);
        if (!res.ok) throw new Error('Sin respuesta');
        const data = await res.json();

        setVal('mi-turno',        data.miTurno       ?? '–');
        setVal('turno-actual',    data.turnoActual   ?? '–');
        setVal('personas-delante',data.personasDelante ?? '–');
        setVal('tiempo-estimado', data.tiempoEstimado ? `${data.tiempoEstimado} min` : '–');

        const pct = data.progreso ?? 0;
        document.getElementById('pct').textContent          = `${pct}%`;
        document.getElementById('progress-fill').style.width = `${pct}%`;

        const estado = data.estado || 'En espera';
        document.getElementById('status-text').textContent = estado;
        const dot = document.getElementById('status-dot');
        dot.className = 'status-dot ' + (estado === 'En turno' ? 'green' : estado === 'Cancelado' ? 'red' : '');

        const banner = document.getElementById('notify-banner');
        if (data.personasDelante <= 2 && data.personasDelante !== null) {
            banner.style.display = 'flex';
        } else {
            banner.style.display = 'none';
        }

        resetCountdown();
    } catch (e) {
        console.warn('No se pudo obtener turno:', e);
    }
}

async function cancelarTurno() {
    if (!confirm('¿Seguro que deseas cancelar tu turno?')) return;
    try {
        await fetch(`http://localhost:3001/turno/${encodeURIComponent(placeName)}/cancelar`, { method: 'POST' });
        showToast('Turno cancelado');
        setTimeout(() => window.location.href = 'places.html', 1500);
    } catch (e) {
        showToast('Error al cancelar');
    }
}

// ── Auto-refresh ──────────────────────────────────────────────
function iniciarAutoRefresh() {
    clearInterval(autoRefreshTimer);
    clearInterval(countdownTimer);

    countdownVal = 30;
    autoRefreshTimer = setInterval(async () => {
        await actualizarTurno();
        resetCountdown();
    }, 30000);

    countdownTimer = setInterval(() => {
        countdownVal--;
        const el = document.getElementById('countdown');
        if (el) el.textContent = countdownVal;
        if (countdownVal <= 0) countdownVal = 30;
    }, 1000);
}

function resetCountdown() {
    countdownVal = 30;
    const el = document.getElementById('countdown');
    if (el) el.textContent = 30;
}

// ── Sección extra por categoría ───────────────────────────────
function renderExtra() {
    // Detectar categoría desde el nombre si no viene en localStorage
    const esRestaurante = Object.keys(INFO_RESTAURANTES).includes(placeName);
    const esClinica     = Object.keys(HORARIOS_CLINICA).includes(placeName);

    if (!esRestaurante && !esClinica) return; // bancos u otros: nada extra

    const card = document.querySelector('.turno-card');
    const btnRow = card.querySelector('.btn-row');

    const section = document.createElement('div');
    section.className = 'extra-section';

    if (esClinica) {
        section.innerHTML = renderClinicaExtra(placeName);
    } else {
        section.innerHTML = renderRestauranteExtra(placeName);
    }

    card.insertBefore(section, btnRow);
}

// ── Clínica: horario + emergencias ────────────────────────────
function renderClinicaExtra(nombre) {
    const info  = HORARIOS_CLINICA[nombre] || { apertura: 8, cierre: 20, emergencias: false };
    const ahora = new Date().getHours();
    const abierto = ahora >= info.apertura && ahora < info.cierre;

    return `
    <div class="extra-clinica">
      <div class="horario-row">
        <span class="horario-icon">${abierto ? '🟢' : '🔴'}</span>
        <div>
          <p class="extra-label">Horario</p>
          <p class="extra-value">${abierto ? 'Abierto ahora' : 'Cerrado'} · ${info.apertura}:00 – ${info.cierre}:00 hrs</p>
        </div>
      </div>
      ${info.emergencias ? `
      <div class="emergencia-banner">
        🚨 <strong>Urgencias 24/7</strong> — Atención de emergencias disponible en todo momento.
      </div>` : ''}
    </div>`;
}

// ── Restaurante: otros lugares recomendados ───────────────────
function renderRestauranteExtra(actual) {
    const otros = Object.keys(INFO_RESTAURANTES).filter(n => n !== actual);

    const items = otros.map(nombre => {
        const info = INFO_RESTAURANTES[nombre];
        const img  = IMAGES[nombre] || 'default.jpg';
        const estrellas = '★'.repeat(Math.round(info.rating)) + '☆'.repeat(5 - Math.round(info.rating));

        return `
        <div class="rest-item" onclick="irARestaurante('${nombre}')">
          <div class="rest-thumb">
            <img src="${IMG_PATH}${img}" alt="${nombre}"
                 onerror="this.src='${IMG_PATH}default.jpg'" />
          </div>
          <div class="rest-info">
            <p class="rest-name">${nombre}</p>
            <p class="rest-meta">${info.tipo} · ${info.precio}</p>
            <p class="rest-stars">${estrellas} <span>${info.rating}</span></p>
          </div>
        </div>`;
    }).join('');

    return `
    <div class="extra-restaurantes">
      <p class="extra-title">Otros restaurantes cerca</p>
      <div class="rest-list">${items}</div>
    </div>`;
}

function irARestaurante(nombre) {
    localStorage.setItem('smartqueue_place', nombre);
    localStorage.setItem('smartqueue_categoria', 'Restaurantes');
    window.location.reload();
}

// ── Helpers ───────────────────────────────────────────────────
function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}