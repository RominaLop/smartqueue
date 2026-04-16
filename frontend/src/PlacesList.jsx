import { useState } from 'react'

function PlacesList() {
  const [activeCategory, setActiveCategory] = useState('RESTAURANTES')

  const categories = ['BANCOS', 'RESTAURANTES', 'CLÍNICAS', 'UNIVERSIDADES']

  const data = {
    RESTAURANTES: [
      { name: 'PAMPAS', info: 'hasta las 12' },
      { name: "HARRY'S", info: 'Updated yesterday' },
      { name: "FRED'S", info: 'Updated 2 days ago' },
      { name: 'PUERTO MADERO', info: 'Updated today' },
      { name: 'ROSANEGRA', info: 'Updated yesterday' },
      { name: 'NAVIOS', info: 'Updated 2 days ago' },
      { name: 'ILIOS', info: 'Updated today' },
      { name: 'TABOO', info: 'Updated yesterday' },
    ],
    BANCOS: [
      { name: 'BBVA MÉXICO', info: 'Updated today' },
      { name: 'BANORTE', info: 'Updated yesterday' },
      { name: 'CITIBANAMEX', info: 'Updated today' },
      { name: 'SANTANDER', info: 'Updated 2 days ago' },
      { name: 'HSBC MÉXICO', info: 'Updated today' },
      { name: 'SCOTIABANK', info: 'Updated yesterday' },
      { name: 'BANCO AZTECA', info: 'Updated today' },
      { name: 'BANCO INBURSA', info: 'Updated 2 days ago' },
    ],
    CLÍNICAS: [],
    UNIVERSIDADES: [],
  }

  const places = data[activeCategory] || []

  return (
    <div className="app">
      <div className="background-shape shape-top"></div>
      <div className="background-shape shape-bottom"></div>

      <div className="places-container">
        <h2 className="places-title">SmartQueue</h2>

        <div className="categories">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-btn ${cat === activeCategory ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === activeCategory && '✓ '}{cat}
            </button>
          ))}
        </div>

        <div className="places-grid">
          {places.length > 0 ? (
            places.map((place) => (
              <div key={place.name} className="place-card">
                <div className="place-image"></div>
                <p className="place-name">{place.name}</p>
                <p className="place-info">{place.info}</p>
              </div>
            ))
          ) : (
            <p style={{ color: '#888', fontSize: '14px' }}>Próximamente...</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlacesList