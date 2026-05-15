// ============================================================
// admin.js  –  SmartQueue Administrador
// ============================================================

const dataByType = {
    restaurante: {
        subtitle: "Panel restaurante",
        settingsTitle: "Configuración del restaurante",
        switchTitle: "Abrir lista de espera",
        switchDescription: "Permite que los clientes se unan a la fila del restaurante.",
        endTimeLabel: "Hora en la que termina la lista de espera",
        maxPeopleLabel: "Máximo de clientes en espera",
        waitingLabel: "En espera", servedLabel: "Atendidos",
        nextTitle: "Siguiente cliente", addTitle: "Agregar cliente manualmente",
        queueTitle: "Lista de espera actual",
        amountPlaceholder: "Número de personas en la mesa", peopleText: "Mesa para"
    },
    clinica: {
        subtitle: "Panel clínica",
        settingsTitle: "Configuración de la clínica",
        switchTitle: "Abrir recepción de pacientes",
        switchDescription: "Permite que los pacientes se registren en la fila de atención.",
        endTimeLabel: "Hora en la que termina la recepción",
        maxPeopleLabel: "Máximo de pacientes en espera",
        waitingLabel: "Pacientes", servedLabel: "Atendidos",
        nextTitle: "Siguiente paciente", addTitle: "Agregar paciente manualmente",
        queueTitle: "Pacientes en espera",
        amountPlaceholder: "Motivo / prioridad", peopleText: "Consulta"
    },
    banco: {
        subtitle: "Panel banco",
        settingsTitle: "Configuración del banco",
        switchTitle: "Abrir atención al público",
        switchDescription: "Permite que los usuarios tomen turno para atención bancaria.",
        endTimeLabel: "Hora de cierre de turnos",
        maxPeopleLabel: "Máximo de usuarios en espera",
        waitingLabel: "Usuarios", servedLabel: "Atendidos",
        nextTitle: "Siguiente usuario", addTitle: "Agregar usuario manualmente",
        queueTitle: "Usuarios en espera",
        amountPlaceholder: "Tipo de trámite", peopleText: "Trámite"
    },
    universidad: {
        subtitle: "Panel universidad",
        settingsTitle: "Configuración de atención universitaria",
        switchTitle: "Abrir atención a estudiantes",
        switchDescription: "Permite que los estudiantes tomen turno para ser atendidos.",
        endTimeLabel: "Hora de cierre de atención",
        maxPeopleLabel: "Máximo de estudiantes en espera",
        waitingLabel: "Estudiantes", servedLabel: "Atendidos",
        nextTitle: "Siguiente estudiante", addTitle: "Agregar estudiante manualmente",
        queueTitle: "Estudiantes en espera",
        amountPlaceholder: "Área o trámite", peopleText: "Trámite"
    }
};

// ── Estado global ─────────────────────────────────────────────
let currentType = 'restaurante';
let isOpen = false;
let served = 0;
let queue = [];
let idEstablecimiento = null;
let nombreEstablecimiento = '';
let idAdmin = null;
let autoRefreshTimer = null;

// ══════════════════════════════════════════════════════════════
// SELECTOR DE ESTABLECIMIENTO
// ══════════════════════════════════════════════════════════════

// Inyecta el modal de selección en el DOM
function inyectarModalSelector() {
    if (document.getElementById('modalSelector')) return;
    const modal = document.createElement('div');
    modal.id = 'modalSelector';
    modal.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center;
    `;
    modal.innerHTML = `
        <div style="
            background: #fff; border-radius: 16px;
            padding: 28px 24px; width: 90%; max-width: 420px;
            max-height: 80vh; overflow-y: auto;
            box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        ">
            <h2 style="margin: 0 0 6px; font-size: 1.2rem; color: #333;">
                Selecciona tu establecimiento
            </h2>
            <p style="margin: 0 0 18px; font-size: 0.85rem; color: #888;">
                Elige el lugar que vas a administrar hoy.
            </p>
            <div id="selectorLista" style="display:flex; flex-direction:column; gap:10px;">
                <p style="color:#aaa; text-align:center;">Cargando establecimientos...</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Carga todos los establecimientos agrupados por categoría
async function mostrarSelectorEstablecimiento() {
    inyectarModalSelector();
    const lista = document.getElementById('selectorLista');

    try {
        // Traer todas las categorías
        const resCats = await fetch('http://localhost:3001/categorias');
        const categorias = await resCats.json();

        let html = '';
        for (const cat of categorias) {
            const resEst = await fetch(`http://localhost:3001/establecimientos/${encodeURIComponent(cat.NombreCategoria)}`);
            const establecimientos = await resEst.json();
            if (!establecimientos.length) continue;

            html += `<p style="font-size:0.75rem; font-weight:700; color:#a8b56a;
                         text-transform:uppercase; margin:8px 0 4px;">${cat.NombreCategoria}</p>`;
            for (const est of establecimientos) {
                html += `
                    <button onclick="seleccionarEstablecimiento(${est.IDEstablecimiento}, '${est.NombreEstablecimiento.replace(/'/g, "\\'")}', '${cat.NombreCategoria}')"
                        style="
                            background: #f7f9f0; border: 1.5px solid #e0e8c8;
                            border-radius: 10px; padding: 12px 16px;
                            text-align: left; cursor: pointer; font-size: 0.95rem;
                            color: #333; transition: background 0.15s;
                        "
                        onmouseover="this.style.background='#eef3da'"
                        onmouseout="this.style.background='#f7f9f0'"
                    >
                        <strong>${est.NombreEstablecimiento}</strong>
                        <span style="font-size:0.78rem; color:#888; display:block; margin-top:2px;">
                            ${est.Direccion || cat.NombreCategoria}
                        </span>
                    </button>`;
            }
        }

        lista.innerHTML = html || '<p style="color:#aaa; text-align:center;">No hay establecimientos disponibles.</p>';
    } catch (err) {
        console.error('Error cargando establecimientos:', err);
        lista.innerHTML = '<p style="color:red; text-align:center;">Error al cargar establecimientos.</p>';
    }
}

// Cuando el admin elige un establecimiento
function seleccionarEstablecimiento(id, nombre, categoria) {
    idEstablecimiento = id;
    nombreEstablecimiento = nombre;

    // Detectar tipo según categoría
    const cat = categoria.toLowerCase();
    if (cat.includes('restaurante') || cat.includes('bar') || cat.includes('food')) {
        currentType = 'restaurante';
    } else if (cat.includes('cl') || cat.includes('salud') || cat.includes('m')) {
        currentType = 'clinica';
    } else if (cat.includes('banco') || cat.includes('financ')) {
        currentType = 'banco';
    } else if (cat.includes('universidad') || cat.includes('escuela')) {
        currentType = 'universidad';
    } else {
        currentType = 'restaurante'; // default
    }

    // Guardar en sessionStorage
    sessionStorage.setItem('idEstablecimiento', idEstablecimiento);
    sessionStorage.setItem('nombreEstablecimiento', nombreEstablecimiento);
    sessionStorage.setItem('tipoEstablecimiento', currentType);

    // Cerrar modal
    const modal = document.getElementById('modalSelector');
    if (modal) modal.remove();

    // Aplicar al panel
    aplicarEstablecimiento();
}

// Aplica el establecimiento seleccionado al panel
async function aplicarEstablecimiento() {
    const config = dataByType[currentType] || dataByType['restaurante'];

    document.getElementById('businessLogo').textContent = nombreEstablecimiento.charAt(0).toUpperCase();
    document.getElementById('businessName').textContent = nombreEstablecimiento.toUpperCase();
    document.getElementById('businessSubtitle').textContent = config.subtitle;

    applyTexts(config);
    updateStatus();

    served = 0;
    isOpen = false;
    document.getElementById('openSwitch').checked = false;

    await cargarCola();
    iniciarAutoRefresh();
}

// ══════════════════════════════════════════════════════════════
// SESIÓN
// ══════════════════════════════════════════════════════════════
async function loadSession() {
    const usuario = JSON.parse(sessionStorage.getItem('usuario') || '{}');

    if (!usuario || !usuario.NombreRol) { window.location.href = 'index.html'; return; }
    if (usuario.NombreRol === 'Cliente') { window.location.href = 'places.html'; return; }

    idAdmin = usuario.IDUsuario;

    // ¿Ya eligió establecimiento en esta sesión?
    const idGuardado = sessionStorage.getItem('idEstablecimiento');
    const nombreGuardado = sessionStorage.getItem('nombreEstablecimiento');
    const tipoGuardado = sessionStorage.getItem('tipoEstablecimiento');

    if (idGuardado && nombreGuardado) {
        idEstablecimiento = idGuardado;
        nombreEstablecimiento = nombreGuardado;
        currentType = tipoGuardado || 'restaurante';
        await aplicarEstablecimiento();
    } else {
        // Mostrar selector para que elija
        await mostrarSelectorEstablecimiento();
    }
}

function logout() {
    clearInterval(autoRefreshTimer);
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// ── Auto-refresh cada 15 segundos ─────────────────────────────
function iniciarAutoRefresh() {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = setInterval(cargarCola, 15000);
}

// ── Cargar cola desde backend ─────────────────────────────────
async function cargarCola() {
    if (!idEstablecimiento) return;
    try {
        const res = await fetch(`http://localhost:3001/cola/${idEstablecimiento}`);
        const data = await res.json();

        // Turnos de la BD
        const deBD = data.map(t => ({
            idTurno: t.IDTurno,
            name: t.Nombre,
            amount: t.CodigoTurno,
            time: `${t.TiempoEstimadoMin} min`,
            estado: t.NombreEstado
        }));

        // ✅ Preservar los agregados manualmente (idTurno === null)
        const manuales = queue.filter(q => q.idTurno === null);

        // Combinar: BD primero, manuales al final
        queue = [...deBD, ...manuales];

        renderQueue();
    } catch (err) {
        console.error('Error cargando cola:', err);
    }
}

// ── Switch abierto/cerrado ─────────────────────────────────────
document.getElementById('openSwitch').addEventListener('change', function () {
    isOpen = this.checked;
    updateStatus();
});

function updateStatus() {
    const badge = document.getElementById('statusBadge');
    if (isOpen) {
        badge.textContent = 'Abierto';
        badge.className = 'status-badge open';
    } else {
        badge.textContent = 'Cerrado';
        badge.className = 'status-badge closed';
    }
}

// ── Textos dinámicos ──────────────────────────────────────────
function applyTexts(config) {
    document.getElementById('settingsTitle').textContent = config.settingsTitle;
    document.getElementById('switchTitle').textContent = config.switchTitle;
    document.getElementById('switchDescription').textContent = config.switchDescription;
    document.getElementById('endTimeLabel').textContent = config.endTimeLabel;
    document.getElementById('maxPeopleLabel').textContent = config.maxPeopleLabel;
    document.getElementById('waitingLabel').textContent = config.waitingLabel;
    document.getElementById('servedLabel').textContent = config.servedLabel;
    document.getElementById('nextTitle').textContent = config.nextTitle;
    document.getElementById('addTitle').textContent = config.addTitle;
    document.getElementById('queueTitle').textContent = config.queueTitle;
    document.getElementById('personAmount').placeholder = config.amountPlaceholder;
}

// ── Renderizar cola ───────────────────────────────────────────
function renderQueue() {
    const config = dataByType[currentType] || dataByType['restaurante'];
    const queueList = document.getElementById('queueList');
    const nextText = document.getElementById('nextText');

    document.getElementById('waitingCount').textContent = queue.length;
    document.getElementById('servedCount').textContent = served;

    queueList.innerHTML = '';

    if (queue.length === 0) {
        nextText.textContent = 'No hay personas en espera';
        queueList.innerHTML = `<p class="empty">No hay personas en espera actualmente.</p>`;
        return;
    }

    nextText.textContent = `${config.peopleText}: ${queue[0].amount} — ${queue[0].name}`;

    queue.forEach((person, index) => {
        const item = document.createElement('div');
        item.className = 'queue-item';
        item.innerHTML = `
            <div class="queue-top">
                <div class="client-info">
                    <h4>${index + 1}. ${person.name}</h4>
                    <p>Turno: ${person.amount}</p>
                    <p>Tiempo estimado: ${person.time}</p>
                    <p>Estado: ${person.estado}</p>
                </div>
            </div>
            <div class="actions">
                <button class="action-btn call"   onclick="callPerson(${index})">Llamar</button>
                <button class="action-btn done"   onclick="servePerson(${index})">Atendido</button>
                <button class="action-btn cancel" onclick="cancelPerson(${index})">Cancelar</button>
            </div>`;
        queueList.appendChild(item);
    });
}

// ── Agregar cliente manual ─────────────────────────────────────
async function addPerson() {
    const name = document.getElementById('personName').value.trim();
    const amount = document.getElementById('personAmount').value.trim();
    if (!name || !amount) { alert('Completa los datos.'); return; }

    try {
        const res = await fetch('http://localhost:3001/turno/manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: name,
                detalle: amount,
                idEstablecimiento: idEstablecimiento,
                idAdmin: idAdmin
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        document.getElementById('personName').value = '';
        document.getElementById('personAmount').value = '';
        showToast(`✅ ${name} agregado a la lista`);
        await cargarCola(); // refresca desde BD
    } catch (err) {
        alert('Error al agregar: ' + err.message);
    }
}

// ── Llamar cliente ─────────────────────────────────────────────
async function callPerson(index) {
    const person = queue[index];
    if (!person.idTurno) { alert('Llamando a: ' + person.name); return; }
    try {
        const res = await fetch(`http://localhost:3001/turno/${person.idTurno}/llamar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idAdmin })
        });
        if (!res.ok) throw new Error('Error');
        showToast(`✅ Llamando a ${person.name}`);
        await cargarCola();
    } catch (e) {
        alert('Error al llamar cliente');
    }
}

// ── Marcar como atendido ───────────────────────────────────────
async function servePerson(index) {
    const person = queue[index];
    if (!person.idTurno) {
        queue.splice(index, 1);
        served++;
        renderQueue();
        return;
    }
    try {
        const res = await fetch(`http://localhost:3001/turno/${person.idTurno}/atendido`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idAdmin, idEstablecimiento })
        });
        if (!res.ok) throw new Error('Error al marcar atendido');
        served++;
        await cargarCola();
    } catch (err) {
        alert('Error al marcar como atendido: ' + err.message);
    }
}

// ── Cancelar turno ─────────────────────────────────────────────
async function cancelPerson(index) {
    const person = queue[index];
    if (!confirm(`¿Seguro que deseas cancelar el turno de ${person.name}?`)) return;
    if (!person.idTurno) {
        queue.splice(index, 1);
        renderQueue();
        return;
    }
    try {
        const res = await fetch(`http://localhost:3001/turno/${person.idTurno}/cancelar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idAdmin, idEstablecimiento })
        });
        if (!res.ok) throw new Error('Error al cancelar');
        await cargarCola();
    } catch (err) {
        alert('Error al cancelar turno: ' + err.message);
    }
}

// ── Cambiar establecimiento (botón opcional en el panel) ───────
async function cambiarEstablecimiento() {
    sessionStorage.removeItem('idEstablecimiento');
    sessionStorage.removeItem('nombreEstablecimiento');
    sessionStorage.removeItem('tipoEstablecimiento');
    clearInterval(autoRefreshTimer);
    idEstablecimiento = null;
    await mostrarSelectorEstablecimiento();
}

// ── Toast ──────────────────────────────────────────────────────
function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Guardar configuración ─────────────────────────────────────
function saveSettings() {
    const endTime = document.getElementById('endTime').value;
    const maxPeople = document.getElementById('maxPeople').value;
    if (!endTime) { alert('Selecciona una hora de cierre.'); return; }
    if (!maxPeople || maxPeople <= 0) { alert('Ingresa una cantidad máxima válida.'); return; }
    alert(`Configuración guardada:\nEstado: ${isOpen ? 'Abierto' : 'Cerrado'}\nHora de cierre: ${endTime}\nMáximo en espera: ${maxPeople}`);
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadSession);