// ============================================================
// admin.js  –  SmartQueue Administrador
// ============================================================

// ── Textos por tipo de negocio ────────────────────────────────
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
        amountPlaceholder: "Número de personas en la mesa", peopleText: "Mesa para",
        sampleQueue: [
            { name: "Juan Pérez",   amount: 2,         time: "10 min" },
            { name: "María López",  amount: 4,         time: "15 min" },
            { name: "Carlos Ruiz",  amount: 3,         time: "20 min" }
        ]
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
        amountPlaceholder: "Motivo / prioridad", peopleText: "Consulta",
        sampleQueue: [
            { name: "Ana Torres",     amount: "General", time: "12 min" },
            { name: "Luis Mendoza",   amount: "Control", time: "18 min" },
            { name: "Sofía Herrera",  amount: "Urgente", time: "25 min" }
        ]
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
        amountPlaceholder: "Tipo de trámite", peopleText: "Trámite",
        sampleQueue: [
            { name: "Pedro Ramírez", amount: "Caja",        time: "8 min" },
            { name: "Valeria Cruz",  amount: "Asesoría",    time: "16 min" },
            { name: "Miguel Arias",  amount: "Cuenta nueva",time: "22 min" }
        ]
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
        amountPlaceholder: "Área o trámite", peopleText: "Trámite",
        sampleQueue: [
            { name: "Daniela Castro", amount: "Pagos",               time: "10 min" },
            { name: "Andrés Vega",    amount: "Becas",               time: "15 min" },
            { name: "Camila Reyes",   amount: "Servicios escolares", time: "20 min" }
        ]
    }
};

// ── Estado ────────────────────────────────────────────────────
let currentType = 'restaurante';
let isOpen      = false;
let served      = 0;
let queue       = [];

// ── Sesión ────────────────────────────────────────────────────
function loadSession() {
    const usuario = JSON.parse(sessionStorage.getItem('usuario') || '{}');

    // Sin sesión o es cliente → redirigir
    if (!usuario || !usuario.NombreRol) {
        window.location.href = 'index.html';
        return;
    }
    if (usuario.NombreRol === 'Cliente') {
        window.location.href = 'places.html';
        return;
    }

    // Tipo y nombre de negocio desde sessionStorage
    currentType = (usuario.TipoNegocio || 'restaurante').toLowerCase();
    const nombre = usuario.NombreNegocio || usuario.Nombre || 'Establecimiento';

    const config = dataByType[currentType] || dataByType['restaurante'];

    document.getElementById('businessLogo').textContent    = nombre.charAt(0).toUpperCase();
    document.getElementById('businessName').textContent    = nombre.toUpperCase();
    document.getElementById('businessSubtitle').textContent = config.subtitle;

    queue  = [...config.sampleQueue];
    served = 0;
    isOpen = false;
    document.getElementById('openSwitch').checked = false;

    applyTexts(config);
    updateStatus();
    renderQueue();
}

function logout() {
    sessionStorage.removeItem('usuario');
    window.location.href = 'index.html';
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
    document.getElementById('settingsTitle').textContent    = config.settingsTitle;
    document.getElementById('switchTitle').textContent      = config.switchTitle;
    document.getElementById('switchDescription').textContent = config.switchDescription;
    document.getElementById('endTimeLabel').textContent     = config.endTimeLabel;
    document.getElementById('maxPeopleLabel').textContent   = config.maxPeopleLabel;
    document.getElementById('waitingLabel').textContent     = config.waitingLabel;
    document.getElementById('servedLabel').textContent      = config.servedLabel;
    document.getElementById('nextTitle').textContent        = config.nextTitle;
    document.getElementById('addTitle').textContent         = config.addTitle;
    document.getElementById('queueTitle').textContent       = config.queueTitle;
    document.getElementById('personAmount').placeholder     = config.amountPlaceholder;
}

// ── Cola ──────────────────────────────────────────────────────
function renderQueue() {
    const config      = dataByType[currentType] || dataByType['restaurante'];
    const queueList   = document.getElementById('queueList');
    const nextText    = document.getElementById('nextText');

    document.getElementById('waitingCount').textContent = queue.length;
    document.getElementById('servedCount').textContent  = served;

    queueList.innerHTML = '';

    if (queue.length === 0) {
        nextText.textContent = 'No hay personas en espera';
        queueList.innerHTML  = `<p class="empty">No hay personas en espera actualmente.</p>`;
        return;
    }

    nextText.textContent = `${config.peopleText}: ${queue[0].amount} - ${queue[0].name}`;

    queue.forEach((person, index) => {
        const item = document.createElement('div');
        item.className = 'queue-item';
        item.innerHTML = `
            <div class="queue-top">
                <div class="client-info">
                    <h4>${index + 1}. ${person.name}</h4>
                    <p>${config.peopleText}: ${person.amount}</p>
                    <p>Tiempo estimado: ${person.time}</p>
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
    queue.push({ name, amount, time: 'Nuevo' });
    document.getElementById('personName').value   = '';
    document.getElementById('personAmount').value = '';
    renderQueue();
}

function callPerson(index)  { alert('Llamando a: ' + queue[index].name); }

function servePerson(index) {
    const name = queue[index].name;
    queue.splice(index, 1);
    served++;
    alert(name + ' fue marcado como atendido.');
    renderQueue();
}

function cancelPerson(index) {
    if (confirm(`¿Seguro que deseas cancelar el turno de ${queue[index].name}?`)) {
        queue.splice(index, 1);
        renderQueue();
    }
}

// ── Guardar configuración ─────────────────────────────────────
function saveSettings() {
    const endTime   = document.getElementById('endTime').value;
    const maxPeople = document.getElementById('maxPeople').value;
    if (!endTime)               { alert('Selecciona una hora de cierre.'); return; }
    if (!maxPeople || maxPeople <= 0) { alert('Ingresa una cantidad máxima válida.'); return; }
    alert(`Configuración guardada:\nEstado: ${isOpen ? 'Abierto' : 'Cerrado'}\nHora de cierre: ${endTime}\nMáximo en espera: ${maxPeople}`);
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadSession);