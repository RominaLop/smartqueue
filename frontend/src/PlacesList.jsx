import { useEffect, useState } from 'react'

const imageModules = import.meta.glob('./assets/*', {
  eager: true,
  query: '?url',
  import: 'default',
})

const IMAGES = {
  'BBVA México': 'bbva.jpg',
  'Banorte': 'banorte.jpg',
  'Citibanamex': 'citibanamex.jpg',
  'Santander': 'santander.jpg',
  'HSBC México': 'HSBC.jpg',
  'Scotiabank': 'scotiabank.jpg',
  'Banco Azteca': 'banco-azteca.jpg',
  'Banco Inbursa': 'banco-inbursa.jpg',

  'Pampas': 'Pampas.jpg',
  'Harrys': 'Harrys.jpg',
  'Freds': 'Freds.jpg',
  'Puerto Madero': 'puerto-madero.jpg',
  'RosaNegra': 'RosaNegra.jpg',
  'Navios': 'Navios.jpg',
  'Ilios': 'Ilios.jpg',
  'Taboo': 'Taboo.jpg',

  'Clínica SmartCare': 'SmartCare.jpg',
  'Universidad SmartQueue': 'SmartQueue.jpg',
}

function PlacesList({ onGoToTurno }) {
  const [categorias, setCategorias] = useState([])
  const [activeCategory, setActiveCategory] = useState('')
  const [places, setPlaces] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const usuario = JSON.parse(sessionStorage.getItem('usuario') || '{}')
  const userName = usuario.Nombre || 'Usuario'
  const userInitial = userName.charAt(0).toUpperCase()

  useEffect(() => {
    cargarCategorias()
  }, [])

  useEffect(() => {
    if (activeCategory) {
      cargarEstablecimientos(activeCategory)
    }
  }, [activeCategory])

  const getImageUrl = (placeName) => {
    const fileName = IMAGES[placeName]
    if (!fileName) return null

    return imageModules[`./assets/${fileName}`] || null
  }

  const cargarCategorias = async () => {
    try {
      const res = await fetch('http://localhost:3001/categorias')
      const data = await res.json()

      setCategorias(data)

      if (data.length > 0) {
        setActiveCategory(data[0].NombreCategoria)
      }
    } catch (error) {
      console.error('Error cargando categorías:', error)
      setCategorias([])
    }
  }

  const cargarEstablecimientos = async (categoria) => {
    setLoading(true)

    try {
      const res = await fetch(
        `http://localhost:3001/establecimientos/${encodeURIComponent(categoria)}`
      )

      const data = await res.json()
      setPlaces(data)
    } catch (error) {
      console.error('Error cargando establecimientos:', error)
      setPlaces([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('usuario')
    window.location.reload()
  }

  const goToQueue = (place) => {
    localStorage.setItem('smartqueue_place', place.NombreEstablecimiento)
    localStorage.setItem('smartqueue_categoria', activeCategory)

    if (onGoToTurno) {
      onGoToTurno()
    }
  }

  const filteredPlaces = places.filter((place) =>
    place.NombreEstablecimiento?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="blob blob-top"></div>
      <div className="blob blob-bottom"></div>

      <main className="card places-card">
        <div className="top-bar">
          <h1 className="brand">
            <span>Smart</span>Queue
          </h1>

          <div className="top-actions">
            <div className="user-chip">
              <div className="avatar">{userInitial}</div>
              <span>{userName}</span>
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </div>

        <div className="categories">
          {categorias.map((cat) => (
            <button
              key={cat.IDCategoria}
              className={`cat-btn ${
                cat.NombreCategoria === activeCategory ? 'active' : ''
              }`}
              onClick={() => setActiveCategory(cat.NombreCategoria)}
            >
              {cat.NombreCategoria === activeCategory ? '✓ ' : ''}
              {cat.NombreCategoria.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar lugar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <section className="grid places-horizontal-grid">
          {loading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <div className="skeleton" key={index}>
                <div className="sk-img"></div>
                <div className="sk-line"></div>
                <div className="sk-line short"></div>
              </div>
            ))
          ) : filteredPlaces.length > 0 ? (
            filteredPlaces.map((place) => {
              const imgUrl = getImageUrl(place.NombreEstablecimiento)

              return (
                <article
                  key={place.IDEstablecimiento}
                  className="place-card"
                  onClick={() => goToQueue(place)}
                >
                  <div className="place-img">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={place.NombreEstablecimiento}
                      />
                    ) : (
                      <div className="place-img-fallback">
                        {place.NombreEstablecimiento?.charAt(0)}
                      </div>
                    )}
                  </div>

                  <p className="place-name">
                    {place.NombreEstablecimiento}
                  </p>

                  <p className="place-meta">
                    {place.Direccion || 'Disponible'}
                  </p>
                </article>
              )
            })
          ) : (
            <div className="empty-state">Sin resultados</div>
          )}
        </section>
      </main>
    </>
  )
}

export default PlacesList