function PlacesList() {
  const categories = ['BANCOS', 'RESTAURANTES', 'CLÍNICAS', 'UNIVERSIDADES']
  const places = [
    { name: 'PAMPAS', info: 'hasta las 12' },
    { name: "HARRY'S", info: 'Updated yesterday' },
    { name: "FRED'S", info: 'Updated 2 days ago' },
    { name: 'PUERTO MADERO', info: 'Updated today' },
    { name: 'ROSANEGRA', info: 'Updated yesterday' },
    { name: 'NAVIOS', info: 'Updated 2 days ago' },
    { name: 'ILIOS', info: 'Updated today' },
    { name: 'TABOO', info: 'Updated yesterday' },
  ]

  return (
    <div className="app">
      <div className="background-shape shape-top"></div>
      <div className="background-shape shape-bottom"></div>

      <div className="places-container">
        <h2 className="places-title">SmartQueue</h2>

        <div className="categories">
          {categories.map((cat) => (
            <button key={cat} className={`category-btn ${cat === 'RESTAURANTES' ? 'active' : ''}`}>
              {cat === 'RESTAURANTES' && '✓ '}{cat}
            </button>
          ))}
        </div>

        <div className="places-grid">
          {places.map((place) => (
            <div key={place.name} className="place-card">
              <div className="place-image"></div>
              <p className="place-name">{place.name}</p>
              <p className="place-info">{place.info}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PlacesList