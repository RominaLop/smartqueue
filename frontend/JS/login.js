console.log("JS cargado");

document.getElementById("loginForm").addEventListener("submit", handleLogin);

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

    if (!email || !email.includes('@')) {
        emailErr.style.display = 'block';
        valid = false;
    }

    if (!password) {
        passErr.style.display = 'block';
        valid = false;
    }

    if (!valid) return;

    setLoading(true);

    try {
        const res = await fetch("http://localhost:3001/login", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                correo: email,
                contrasena: password
            })
        });

        const data = await res.json(); // 🔥 SOLO UNA VEZ

        if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');

        // 🔥 AQUÍ VA LA LÓGICA DE ROL
        if (data.success) {
            sessionStorage.setItem('usuario', JSON.stringify(data.usuario));

            if (data.usuario.NombreRol === "Cliente") {
                window.location.href = "places.html";
            } else {
                window.location.href = "admin.html";
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