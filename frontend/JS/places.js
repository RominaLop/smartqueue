// ============================================================
// places.js  –  SmartQueue
// ============================================================



// ── Ruta imágenes ─────────────────────────────────────────────
const IMG_PATH = '/src/assets/';
const IMAGES = {
    "BBVA México": "bbva.jpg",
    "Banorte": "banorte.jpg",
    "Citibanamex": "citibanamex.jpg",
    "Santander": "santander.jpg",
    "HSBC México": "HSBC.jpg",
    "Scotiabank": "scotiabank.jpg",
    "Banco Azteca": "banco-azteca.jpg",
    "Banco Inbursa": "banco-inbursa.jpg",

    "Pampas": "Pampas.jpg",
    "Harrys": "Harrys.jpg",
    "Freds": "Freds.jpg",
    "Puerto Madero": "puerto-madero.jpg",
    "RosaNegra": "RosaNegra.jpg",
    "Navios": "Navios.jpg",
    "Ilios": "Ilios.jpg",
    "Taboo": "Taboo.jpg",

    "Clínica SmartCare": "SmartCare.jpg",
    "Universidad SmartQueue": "SmartQueue.jpg"
};

let categorias = []; // 🔥 ahora vienen de MySQL
let activeCategory = null;

function loadSession() {
    const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');
    const name = user.Nombre || user.email || 'Usuario';

    document.getElementById('user-name').textContent = name;
    document.getElementById('user-initial').textContent = name.charAt(0).toUpperCase();
}

function logout() {
    sessionStorage.clear();
    localStorage.removeItem('smartqueue_place');
    localStorage.removeItem('smartqueue_categoria');
    window.location.href = '../HTML/index.html';
}


async function getCategorias() {
    try {
        const res = await fetch("http://localhost:3001/categorias");
        return await res.json();
    } catch (error) {
        console.error("Error cargando categorías:", error);
        return [];
    }
}

async function getEstablecimientos(categoria) {
    try {
        const res = await fetch(`http://localhost:3001/establecimientos/${categoria}`);
        return await res.json();
    } catch (error) {
        console.error("Error cargando establecimientos:", error);
        return [];
    }
}

function renderCategories() {
    const container = document.getElementById('categories');

    container.innerHTML = categorias.map(cat => `
    <button class="cat-btn ${cat.NombreCategoria === activeCategory ? 'active' : ''}"
            onclick="selectCategory('${cat.NombreCategoria}')">
      ${cat.NombreCategoria === activeCategory ? '✓ ' : ''}${cat.NombreCategoria.toUpperCase()}
    </button>
  `).join('');
}

function selectCategory(cat) {
    activeCategory = cat;
    renderCategories();
    renderPlaces();
}


function renderSkeletons() {
    document.getElementById('grid').innerHTML = Array(8).fill(`
    <div class="skeleton">
      <div class="sk-img"></div>
      <div class="sk-line"></div>
      <div class="sk-line short"></div>
    </div>
  `).join('');
}

async function renderPlaces() {
    renderSkeletons();

    const grid = document.getElementById('grid');
    const query = (document.getElementById('search')?.value || '').toLowerCase();

    try {
        const data = await getEstablecimientos(activeCategory);

        const places = data.filter(p =>
            p.NombreEstablecimiento.toLowerCase().includes(query)
        );

        if (places.length === 0) {
            grid.innerHTML = `<div class="empty-state">Sin resultados</div>`;
            return;
        }

        grid.innerHTML = places.map(place => `
      <div class="place-card" onclick="goToQueue('${place.NombreEstablecimiento}')">
        <div class="place-img">
          <img
            src="${IMG_PATH}${IMAGES[place.NombreEstablecimiento] || 'default.jpg'}"
            alt="${place.NombreEstablecimiento}"
            onerror="console.warn('Imagen no encontrada:', this.src); this.src='${IMG_PATH}default.jpg'"
          />
        </div>
        <p class="place-name">${place.NombreEstablecimiento}</p>
        <p class="place-meta">${place.Direccion || ''}</p>
      </div>
    `).join('');

    } catch (error) {
        console.error(error);
        grid.innerHTML = `<div class="empty-state">Error al cargar</div>`;
    }
}


function goToQueue(placeName) {
    sessionStorage.setItem('smartqueue_place', placeName);
    sessionStorage.setItem('smartqueue_categoria', activeCategory);
    window.location.href = '../HTML/turno.html';
}


document.addEventListener('DOMContentLoaded', async () => {
    loadSession();

    categorias = await getCategorias();


    if (categorias.length > 0) {
        activeCategory = categorias[0].NombreCategoria;
    }

    renderCategories();
    renderPlaces();
});