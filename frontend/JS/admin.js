// ============================================================
// admin.js  –  SmartQueue Administrador
// ============================================================

const dataByType = {
    restaurante: {
        subtitle: "Panel restaurante", logo: "R",
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
        subtitle: "Panel clínica", logo: "C",
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
        subtitle: "Panel banco", logo: "B",
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
        subtitle: "Panel universidad", logo: "U",
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

// ── Estado ────────────────────────────────────────────────────
let currentType        = 'restaurante';
let isOpen             = false;
let served             = 0;
let queue              = [];
let idEstablecimiento  = null;
let idAdmin            = null;
let autoRefreshTimer   = null;

// ── Sesión ────────────────────────────────────────────────────
async function loadSession() {
    const usuario = JSON.parse(sessionStorage.getItem('usuario') || '{}');

    if (!usuario || !usuario.NombreRol) { window.location.href = 'index.html'; return; }
    if (usuario.NombreRol === 'Cliente') { window.location.href = 'places.html'; return; }

    idAdmin     = usuario.IDUsuario;
    currentType = (usuario.TipoNegocio || 'restaurante').toLowerCase();
    const nombre = usuario.NombreNegocio || usuario.Nombre || 'Establecimiento';

    const config = dataByType[currentType] || dataByType['restaurante'];

    document.getElementById('businessLogo').textContent     = nombre.charAt(0).toUpperCase();
    document.getElementById('businessName').textContent     = nombre.toUpperCase();
    document.getElementById('businessSubtitle').textContent = config.subtitle;

    applyTexts(config);
    updateStatus();

    // 🔥 Buscar IDEstablecimiento desde el backend por nombre
    try {
        const res  = await fetch(`http://localhost:3001/establecimiento/buscar?nombre=${encodeURIComponent(nombre)}`);
        const data = await res.json();
        if (data && data.IDEstablecimiento) {
            idEstablecimiento = data.IDEstablecimiento;
            sessionStorage.setItem('idEstablecimiento', idEstablecimiento);
            await cargarCola();
            iniciarAutoRefresh();
        } else {
            console.warn('Establecimiento no encontrado en BD');
        }
    } catch (err) {
        console.error('Error buscando establecimiento:', err);
    }

    served = 0;
    isOpen = false;
    document.getElementById('openSwitch').checked = false;
}

function logout() {
    clearInterval(autoRefreshTimer);
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// ── Auto-refresh ──────────────────────────────────────────────
function iniciarAutoRefresh() {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = setInterval(cargarCola, 15000); // cada 15 segundos
}

// ── 🔥 Cargar cola desde backend ──────────────────────────────
async function cargarCola() {
    if (!idEstablecimiento) return;
    try {
        const res  = await fetch(`http://localhost:3001/cola/${idEstablecimiento}`);
        const data = await res.json();
        queue = data.map(t => ({
            idTurno: t.IDTurno,
            name:    t.Nombre,
            amount:  t.CodigoTurno,
            time:    `${t.TiempoEstimadoMin} min`,
            estado:  t.NombreEstado
        }));
        renderQueue();
    } catch (err) {
        console.error('Error cargando cola:', err);
    }
}

// ── Switch ────────────────────────────────────────────────────
document.getElementById('openSwitch').addEventListener('change', function () {
    isOpen = this.checked;
    updateStatus();
});

function updateStatus() {
    const badge = document.getElementById('statusBadge');
    if (isOpen) {
        badge.textContent = 'Abierto';
        badge.className   = 'status-badge open';
    } else {
        badge.textContent = 'Cerrado';
        badge.className   = 'status-badge closed';
    }
}

// ── Textos dinámicos ──────────────────────────────────────────
function applyTexts(config) {
    document.getElementById('settingsTitle').textContent     = config.settingsTitle;
    document.getElementById('switchTitle').textContent       = config.switchTitle;
    document.getElementById('switchDescription').textContent = config.switchDescription;
    document.getElementById('endTimeLabel').textContent      = config.endTimeLabel;
    document.getElementById('maxPeopleLabel').textContent    = config.maxPeopleLabel;
    document.getElementById('waitingLabel').textContent      = config.waitingLabel;
    document.getElementById('servedLabel').textContent       = config.servedLabel;
    document.getElementById('nextTitle').textContent         = config.nextTitle;
    document.getElementById('addTitle').textContent          = config.addTitle;
    document.getElementById('queueTitle').textContent        = config.queueTitle;
    document.getElementById('personAmount').placeholder      = config.amountPlaceholder;
}

// ── Cola ──────────────────────────────────────────────────────
function renderQueue() {
    const config    = dataByType[currentType] || dataByType['restaurante'];
    const queueList = document.getElementById('queueList');
    const nextText  = document.getElementById('nextText');

    document.getElementById('waitingCount').textContent = queue.length;
    document.getElementById('servedCount').textContent  = served;

    queueList.innerHTML = '';

    if (queue.length === 0) {
        nextText.textContent = 'No hay personas en espera';
        queueList.innerHTML  = `<p class="empty">No hay personas en espera actualmente.</p>`;
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

function addPerson() {
    const name   = document.getElementById('personName').value.trim();
    const amount = document.getElementById('personAmount').value.trim();
    if (!name || !amount) { alert('Completa los datos.'); return; }
    // Solo agrega localmente por ahora (sin cuenta de cliente)
    queue.push({ idTurno: null, name, amount, time: 'Nuevo', estado: 'En espera' });
    document.getElementById('personName').value   = '';
    document.getElementById('personAmount').value = '';
    renderQueue();
}

function callPerson(index) {
    alert('Llamando a: ' + queue[index].name);
}

// 🔥 Marcar como atendido → llama al backend
async function servePerson(index) {
    const person = queue[index];
    if (!person.idTurno) {
        // Turno agregado manualmente sin BD
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
        await cargarCola(); // refresca la lista desde BD
    } catch (err) {
        alert('Error al marcar como atendido: ' + err.message);
    }
}

// 🔥 Cancelar turno → cambia estado a Cancelado (4)
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

async function callPerson(index) {
    const person = queue[index];
    if (!person.idTurno) {
        alert('Llamando a: ' + person.name);
        return;
    }
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

function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Guardar configuración ─────────────────────────────────────
function saveSettings() {
    const endTime   = document.getElementById('endTime').value;
    const maxPeople = document.getElementById('maxPeople').value;
    if (!endTime)                     { alert('Selecciona una hora de cierre.'); return; }
    if (!maxPeople || maxPeople <= 0) { alert('Ingresa una cantidad máxima válida.'); return; }
    alert(`Configuración guardada:\nEstado: ${isOpen ? 'Abierto' : 'Cerrado'}\nHora de cierre: ${endTime}\nMáximo en espera: ${maxPeople}`);
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadSession);