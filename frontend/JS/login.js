// ============================================================
// login.js  –  SmartQueue
// ============================================================

console.log("JS cargado");

// ── Nombres reales por tipo de negocio ────────────────────────
const EJEMPLOS = {
    banco: [
        "BBVA México", "Banorte", "Citibanamex", "Santander",
        "HSBC México", "Scotiabank", "Banco Azteca", "Banco Inbursa"
    ],
    restaurante: [
        "Pampas", "Harrys", "Freds", "Puerto Madero",
        "RosaNegra", "Navios", "Ilios", "Taboo"
    ],
    clinica: ["Clínica SmartCare"],
    universidad: ["Universidad SmartQueue"]
};

// ── Toggle campos admin ───────────────────────────────────────
let isAdminMode = false;

document.getElementById('toggleAdmin').addEventListener('click', () => {
    isAdminMode = !isAdminMode;
    const fields = document.getElementById('adminFields');
    const label = document.querySelector('#toggleAdmin span');
    if (isAdminMode) {
        fields.classList.add('visible');
        label.textContent = 'Iniciar como cliente';
        actualizarPlaceholder();
    } else {
        fields.classList.remove('visible');
        label.textContent = 'Iniciar como admin';
    }
});

// ── Placeholder dinámico al cambiar tipo ──────────────────────
document.getElementById('businessType').addEventListener('change', actualizarPlaceholder);

function actualizarPlaceholder() {
    const tipo = document.getElementById('businessType').value;
    const ejemplos = EJEMPLOS[tipo] || [];
    const ejemplo = ejemplos[Math.floor(Math.random() * ejemplos.length)] || '';
    document.getElementById('businessName').placeholder = `Ej: ${ejemplo}`;
}

// ── Login ─────────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', handleLogin);

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const emailErr = document.getElementById('email-error');
    const passErr = document.getElementById('pass-error');
    const apiErr = document.getElementById('api-error');

    emailErr.style.display = 'none';
    passErr.style.display = 'none';
    apiErr.style.display = 'none';

    let valid = true;
    if (!email || !email.includes('@')) { emailErr.style.display = 'block'; valid = false; }
    if (!password) { passErr.style.display = 'block'; valid = false; }
    if (!valid) return;

    setLoading(true);

    try {
        const res = await fetch('http://localhost:3001/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: email, contrasena: password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');

        if (data.success) {
            const usuario = data.usuario;

            // Cliente intentando entrar como admin
            if (isAdminMode && usuario.NombreRol === 'Cliente') {
                throw new Error('Esta cuenta no tiene permisos de administrador.');
            }

            // Admin intentando entrar como cliente
            if (!isAdminMode && usuario.NombreRol !== 'Cliente') {
                throw new Error('Esta cuenta es de administrador. Usa el acceso de administrador.');
            }

            // Si está en modo admin, guardar tipo y nombre de negocio
            if (isAdminMode) {
                usuario.TipoNegocio = document.getElementById('businessType').value;
                usuario.NombreNegocio = document.getElementById('businessName').value.trim();
            }

            sessionStorage.clear();
            sessionStorage.setItem('usuario', JSON.stringify(usuario));

            if (usuario.NombreRol === 'Cliente') {
                window.location.href = 'places.html';
            } else {
                window.location.href = 'admin.html';
            }
        }
    } catch (err) {
        apiErr.textContent = err.message;
        apiErr.style.display = 'block';
    } finally {
        setLoading(false);
    }
}

function setLoading(on) {
    document.getElementById('btn-text').style.display = on ? 'none' : 'block';
    document.getElementById('spinner').style.display = on ? 'block' : 'none';
    document.getElementById('login-btn').style.opacity = on ? '0.7' : '1';
    document.getElementById('login-btn').style.pointerEvents = on ? 'none' : 'auto';
}