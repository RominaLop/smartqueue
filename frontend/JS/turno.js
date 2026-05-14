// ============================================================
// turno.js  –  SmartQueue
// ============================================================

const IMG_PATH = '/src/assets/';

const IMAGES = {
    "BBVA México":       "bbva.jpg",
    "Banorte":           "banorte.jpg",
    "Citibanamex":       "citibanamex.jpg",
    "Santander":         "santander.jpg",
    "HSBC México":       "HSBC.jpg",
    "Scotiabank":        "scotiabank.jpg",
    "Banco Azteca":      "banco-azteca.jpg",
    "Banco Inbursa":     "banco-inbursa.jpg",
    "Pampas":            "Pampas.jpg",
    "Harrys":            "Harrys.jpg",
    "Freds":             "Freds.jpg",
    "Puerto Madero":     "puerto-madero.jpg",
    "RosaNegra":         "RosaNegra.jpg",
    "Navios":            "Navios.jpg",
    "Ilios":             "Ilios.jpg",
    "Taboo":             "Taboo.jpg",
    "Clínica SmartCare": "SmartCare.jpg"
};

const HORARIOS_CLINICA = {
    "Clínica SmartCare": { apertura: 7, cierre: 21, emergencias: true }
};

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
let placeName         = '';
let categoria         = '';
let idEstablecimiento = null;
let idTurnoActual     = null;
let countdownVal      = 5;
let countdownTimer    = null;
let autoRefreshTimer  = null;
let yaNotificado      = false;

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    placeName         = sessionStorage.getItem('smartqueue_place') || '';
    categoria         = sessionStorage.getItem('smartqueue_categoria') || '';
    idEstablecimiento = sessionStorage.getItem('idEstablecimiento') || null;
    idTurnoActual     = sessionStorage.getItem('idTurno') || null;

    // Pedir permiso de notificaciones
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }

    const serviceEl = document.getElementById('service-name');
    if (serviceEl) serviceEl.textContent = placeName || 'Sin servicio';

    // Si no tenemos idEstablecimiento, buscarlo por nombre
    if (!idEstablecimiento && placeName) {
        try {
            const res  = await fetch(`http://localhost:3001/establecimiento/buscar?nombre=${encodeURIComponent(placeName)}`);
            const data = await res.json();
            if (data && data.IDEstablecimiento) {
                idEstablecimiento = data.IDEstablecimiento;
                sessionStorage.setItem('idEstablecimiento', idEstablecimiento);
            }
        } catch (e) {
            console.warn('No se pudo obtener establecimiento:', e);
        }
    }

    // Si el cliente no tiene turno aún, tomarlo automáticamente
    if (!idTurnoActual && idEstablecimiento) {
        await tomarTurno();
    } else {
        await actualizarTurno();
    }

    iniciarAutoRefresh();
    renderExtra();

    // ── FIX SCROLL: asegura que el body y la card sean scrolleables ──
    document.body.style.overflowY    = 'auto';
    document.body.style.height       = '100%';
    const card = document.querySelector('.turno-card');
    if (card) {
        card.style.overflowY  = 'auto';
        card.style.maxHeight  = '100vh';
        card.style.scrollbarWidth = 'thin'; // Firefox
        card.style.scrollbarColor = '#a8b56a transparent';
    }
    // Webkit scrollbar (Chrome/Safari) — inyecta estilo dinámico
    const style = document.createElement('style');
    style.textContent = `
        .turno-card::-webkit-scrollbar { width: 4px; }
        .turno-card::-webkit-scrollbar-thumb { background: #a8b56a; border-radius: 4px; }
        .turno-card::-webkit-scrollbar-track { background: transparent; }
        body::-webkit-scrollbar { width: 4px; }
        body::-webkit-scrollbar-thumb { background: #a8b56a; border-radius: 4px; }
    `;
    document.head.appendChild(style);
});

// ── Tomar turno ───────────────────────────────────────────────
async function tomarTurno() {
    const usuario   = JSON.parse(sessionStorage.getItem('usuario') || '{}');
    const idUsuario = usuario.IDUsuario;

    if (!idUsuario || !idEstablecimiento) {
        console.warn('Faltan datos para tomar turno');
        return;
    }

    try {
        const resServ   = await fetch(`http://localhost:3001/servicios/${idEstablecimiento}`);
        const servicios = await resServ.json();
        if (!servicios || servicios.length === 0) {
            console.warn('No hay servicios disponibles');
            return;
        }
        const idServicio = servicios[0].IDServicio;

        const res  = await fetch('http://localhost:3001/turno/nuevo', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ idUsuario, idServicio, idEstablecimiento })
        });
        const data = await res.json();

        if (data.success) {
            idTurnoActual = data.idTurno;
            sessionStorage.setItem('idTurno', idTurnoActual);

            // Mostrar datos iniciales del turno recién creado
            setVal('mi-turno',         data.codigoTurno);
            setVal('personas-delante', data.personasDelante);
            setVal('tiempo-estimado',  data.tiempoEstimadoMin > 0 ? `${data.tiempoEstimadoMin} min` : '< 5 min');
            setVal('status-text',      'En espera');

            // Turno actual: si soy el primero, mi turno ES el actual
            setVal('turno-actual', data.personasDelante === 0 ? data.codigoTurno : '–');

            const pct = data.personasDelante === 0 ? 100 : Math.max(0, 100 - (data.personasDelante * 10));
            document.getElementById('pct').textContent           = `${pct}%`;
            document.getElementById('progress-fill').style.width = `${pct}%`;

            const dot = document.getElementById('status-dot');
            if (dot) dot.className = 'status-dot';
        }
    } catch (e) {
        console.warn('Error al tomar turno:', e);
    }
}

// ── Actualizar turno desde BD (con cola en tiempo real) ───────
async function actualizarTurno() {
    if (!idTurnoActual || !idEstablecimiento) return;

    try {
        
        const [resTurno, reCola] = await Promise.all([
            fetch(`http://localhost:3001/turno/${idTurnoActual}/estado`),
            fetch(`http://localhost:3001/cola/${idEstablecimiento}`)
        ]);

        if (!resTurno.ok) throw new Error('Sin respuesta del turno');

        const data = await resTurno.json();
        const cola = reCola.ok ? await reCola.json() : [];

        
        const miPosEnCola   = cola.findIndex(t => String(t.IDTurno) === String(idTurnoActual));
        // Si mi turno ya no aparece en la cola (atendido/cancelado), miPosEnCola = -1
        const personasDelante = miPosEnCola > 0 ? miPosEnCola : (miPosEnCola === 0 ? 0 : data.PersonasDelante ?? 0);
        const tiempoReal      = personasDelante * 5;

        
        const turnoActualCodigo = cola.length > 0 ? cola[0].CodigoTurno : (data.CodigoTurno ?? '–');

        
        setVal('mi-turno',         data.CodigoTurno ?? '–');
        setVal('turno-actual',     turnoActualCodigo);
        setVal('personas-delante', personasDelante);
        setVal('tiempo-estimado',  tiempoReal > 0 ? `${tiempoReal} min` : '< 5 min');

        
        const pct = personasDelante === 0 ? 100 : Math.max(5, 100 - (personasDelante * 10));
        document.getElementById('pct').textContent           = `${pct}%`;
        document.getElementById('progress-fill').style.width = `${pct}%`;

        
        const estado = data.NombreEstado || 'En espera';
        setVal('status-text', estado);

        const dot = document.getElementById('status-dot');
        if (dot) {
            dot.className = 'status-dot ' +
                (estado === 'En atención' ? 'green' : estado === 'Cancelado' ? 'red' : '');
        }

        
        if (estado === 'En atención' && !yaNotificado) {
            yaNotificado = true;

            if (Notification.permission === 'granted') {
                new Notification('¡Te están llamando! 🔔', {
                    body: `${placeName} te está llamando. Por favor acércate al mostrador.`,
                    icon: '/src/assets/SmartQueue.jpg'
                });
            }

            const banner = document.getElementById('notify-banner');
            if (banner) {
                banner.style.display = 'flex';
                const bannerText = banner.querySelector('p');
                if (bannerText) bannerText.textContent = '¡Te están llamando! Acércate al mostrador 🏃';
            }

            showToast('🔔 ¡Es tu turno! Acércate al mostrador');
        }

        
        if (estado !== 'En atención') {
            const banner = document.getElementById('notify-banner');
            if (banner) {
                if (personasDelante <= 2 && personasDelante > 0) {
                    banner.style.display = 'flex';
                    const bannerText = banner.querySelector('p');
                    if (bannerText) bannerText.textContent = `¡Casi es tu turno! Solo ${personasDelante} persona(s) delante.`;
                } else if (personasDelante > 2) {
                    banner.style.display = 'none';
                }
            }
        }

        // Limpiar sesión si el turno terminó
        if (estado === 'Finalizado' || estado === 'Cancelado') {
            sessionStorage.removeItem('idTurno');
            idTurnoActual = null;
            clearInterval(autoRefreshTimer);
            clearInterval(countdownTimer);
        }

        resetCountdown();
    } catch (e) {
        console.warn('No se pudo actualizar turno:', e);
    }
}


async function cancelarTurno() {
    if (!confirm('¿Seguro que deseas cancelar tu turno?')) return;
    if (!idTurnoActual) { showToast('No tienes un turno activo'); return; }

    try {
        const res = await fetch(`http://localhost:3001/turno/${idTurnoActual}/cancelar`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ idEstablecimiento })
        });
        if (!res.ok) throw new Error('Error al cancelar');
        sessionStorage.removeItem('idTurno');
        idTurnoActual = null;
        showToast('Turno cancelado');
        setTimeout(() => window.location.href = 'places.html', 1500);
    } catch (e) {
        showToast('Error al cancelar');
    }
}


function iniciarAutoRefresh() {
    clearInterval(autoRefreshTimer);
    clearInterval(countdownTimer);

    countdownVal     = 5;
    autoRefreshTimer = setInterval(async () => {
        await actualizarTurno();
        resetCountdown();
    }, 5000);

    countdownTimer = setInterval(() => {
        countdownVal--;
        const el = document.getElementById('countdown');
        if (el) el.textContent = countdownVal;
        if (countdownVal <= 0) countdownVal = 5;
    }, 1000);
}

function resetCountdown() {
    countdownVal = 5;
    const el = document.getElementById('countdown');
    if (el) el.textContent = 5;
}


function renderExtra() {
    const esRestaurante = Object.keys(INFO_RESTAURANTES).includes(placeName);
    const esClinica     = Object.keys(HORARIOS_CLINICA).includes(placeName);
    if (!esRestaurante && !esClinica) return;

    const card    = document.querySelector('.turno-card');
    const btnRow  = card.querySelector('.btn-row');
    const section = document.createElement('div');
    section.className = 'extra-section';

    section.innerHTML = esClinica
        ? renderClinicaExtra(placeName)
        : renderRestauranteExtra(placeName);

    card.insertBefore(section, btnRow);
}

function renderClinicaExtra(nombre) {
    const info    = HORARIOS_CLINICA[nombre] || { apertura: 8, cierre: 20, emergencias: false };
    const ahora   = new Date().getHours();
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

function renderRestauranteExtra(actual) {
    const otros = Object.keys(INFO_RESTAURANTES).filter(n => n !== actual);
    const items = otros.map(nombre => {
        const info      = INFO_RESTAURANTES[nombre];
        const img       = IMAGES[nombre] || 'default.jpg';
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
    sessionStorage.removeItem('idTurno');
    sessionStorage.removeItem('idEstablecimiento');
    sessionStorage.setItem('smartqueue_place', nombre);
    sessionStorage.setItem('smartqueue_categoria', 'Restaurantes');
    window.location.reload();
}


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