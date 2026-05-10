import { useEffect, useState } from 'react'

function TurnoEspera({ onBack }) {
  const [placeName, setPlaceName] = useState('')
  const [categoria, setCategoria] = useState('')

  const [miTurno, setMiTurno] = useState('A-23')
  const [turnoActual, setTurnoActual] = useState('A-18')
  const [personasDelante, setPersonasDelante] = useState(5)
  const [tiempoEstimado, setTiempoEstimado] = useState(25)
  const [progreso, setProgreso] = useState(0)
  const [estado, setEstado] = useState('En espera')
  const [countdown, setCountdown] = useState(30)

  const INFO_RESTAURANTES = {
    Pampas: { rating: 4.8, precio: '$$$', tipo: 'Asador argentino' },
    Harrys: { rating: 4.6, precio: '$$', tipo: 'Bar & Grill' },
    Freds: { rating: 4.5, precio: '$$', tipo: 'Mariscos' },
    'Puerto Madero': { rating: 4.9, precio: '$$$', tipo: 'Cortes & Vinos' },
    RosaNegra: { rating: 4.7, precio: '$$$', tipo: 'Fusión mexicana' },
    Navios: { rating: 4.4, precio: '$$', tipo: 'Cocina del mar' },
    Ilios: { rating: 4.6, precio: '$$', tipo: 'Mediterráneo' },
    Taboo: { rating: 4.5, precio: '$$$', tipo: 'Beach club' },
  }

  const HORARIOS_CLINICA = {
    'Clínica SmartCare': { apertura: 7, cierre: 21, emergencias: true },
  }

  useEffect(() => {
    const savedPlace = localStorage.getItem('smartqueue_place') || 'Atención al cliente'
    const savedCategoria = localStorage.getItem('smartqueue_categoria') || ''

    setPlaceName(savedPlace)
    setCategoria(savedCategoria)

    actualizarTurno()

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          actualizarTurno()
          return 30
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const actualizarTurno = async () => {
    const savedPlace = localStorage.getItem('smartqueue_place') || 'Atención al cliente'

    try {
      const res = await fetch(
        `http://localhost:3001/turno/${encodeURIComponent(savedPlace)}`
      )

      if (!res.ok) {
        throw new Error('No hay endpoint de turno todavía')
      }

      const data = await res.json()

      setMiTurno(data.miTurno ?? 'A-23')
      setTurnoActual(data.turnoActual ?? 'A-18')
      setPersonasDelante(data.personasDelante ?? 5)
      setTiempoEstimado(data.tiempoEstimado ?? 25)
      setProgreso(data.progreso ?? 0)
      setEstado(data.estado || 'En espera')
      setCountdown(30)
    } catch (error) {
      console.warn('No se pudo obtener turno desde backend. Usando datos de prueba.')

      setMiTurno('A-23')
      setTurnoActual('A-18')
      setPersonasDelante(5)
      setTiempoEstimado(25)
      setProgreso(25)
      setEstado('En espera')
      setCountdown(30)
    }
  }

  const cancelarTurno = () => {
    const confirmar = window.confirm('¿Seguro que deseas cancelar tu turno?')

    if (!confirmar) return

    localStorage.removeItem('smartqueue_place')
    localStorage.removeItem('smartqueue_categoria')

    if (onBack) {
      onBack()
    }
  }

  const volver = () => {
    if (onBack) {
      onBack()
    }
  }

  const esRestaurante = Object.keys(INFO_RESTAURANTES).includes(placeName)
  const esClinica = Object.keys(HORARIOS_CLINICA).includes(placeName)

  const renderClinicaExtra = () => {
    const info = HORARIOS_CLINICA[placeName] || {
      apertura: 8,
      cierre: 20,
      emergencias: false,
    }

    const ahora = new Date().getHours()
    const abierto = ahora >= info.apertura && ahora < info.cierre

    return (
      <div className="extra-section">
        <div className="extra-clinica">
          <div className="horario-row">
            <span className="horario-icon">{abierto ? '🟢' : '🔴'}</span>

            <div>
              <p className="extra-label">Horario</p>
              <p className="extra-value">
                {abierto ? 'Abierto ahora' : 'Cerrado'} · {info.apertura}:00 –{' '}
                {info.cierre}:00 hrs
              </p>
            </div>
          </div>

          {info.emergencias && (
            <div className="emergencia-banner">
              🚨 <strong>Urgencias 24/7</strong> — Atención de emergencias
              disponible en todo momento.
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderRestaurantesExtra = () => {
    const otros = Object.keys(INFO_RESTAURANTES).filter(
      (nombre) => nombre !== placeName
    )

    return (
      <div className="extra-section">
        <div className="extra-restaurantes">
          <p className="extra-title">Otros restaurantes cerca</p>

          <div className="rest-list">
            {otros.map((nombre) => {
              const info = INFO_RESTAURANTES[nombre]
              const estrellas =
                '★'.repeat(Math.round(info.rating)) +
                '☆'.repeat(5 - Math.round(info.rating))

              return (
                <div
                  className="rest-item"
                  key={nombre}
                  onClick={() => {
                    localStorage.setItem('smartqueue_place', nombre)
                    localStorage.setItem('smartqueue_categoria', 'Restaurantes')
                    setPlaceName(nombre)
                    setCategoria('Restaurantes')
                    actualizarTurno()
                  }}
                >
                  <div className="rest-thumb">
                    <span
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        color: '#fff',
                        background: 'linear-gradient(135deg, #c7d88a, #b8cb73)',
                      }}
                    >
                      {nombre.charAt(0)}
                    </span>
                  </div>

                  <div className="rest-info">
                    <p className="rest-name">{nombre}</p>
                    <p className="rest-meta">
                      {info.tipo} · {info.precio}
                    </p>
                    <p className="rest-stars">
                      {estrellas} <span>{info.rating}</span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="blob blob-top"></div>
      <div className="blob blob-bottom"></div>

      <main className="card turno-card">
        <div className="top-bar">
          <button className="back-btn" onClick={volver}>
            ← Volver
          </button>

          <span className="brand">
            <span>Smart</span>Queue
          </span>
        </div>

        <div className="service-box">
          <p className="box-label">Servicio seleccionado</p>
          <h2 className="service-name">{placeName || 'Sin servicio'}</h2>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <p className="box-label">Tu turno</p>
            <h3>{miTurno}</h3>
          </div>

          <div className="info-card">
            <p className="box-label">Turno actual</p>
            <h3>{turnoActual}</h3>
          </div>

          <div className="info-card">
            <p className="box-label">Personas delante</p>
            <h3>{personasDelante}</h3>
          </div>

          <div className="info-card">
            <p className="box-label">Tiempo estimado</p>
            <h3>{tiempoEstimado} min</h3>
          </div>
        </div>

        <div className="progress-wrap">
          <div className="progress-header">
            <span className="box-label">Progreso de la fila</span>
            <span className="progress-pct">{progreso}%</span>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progreso}%` }}
            ></div>
          </div>
        </div>

        <div className="status-box">
          <div>
            <p className="box-label">Estado</p>
            <h3 className="status-text">{estado}</h3>
          </div>

          <div
            className={`status-dot ${
              estado === 'En turno' || estado === 'Es tu turno' ? 'active' : ''
            }`}
          ></div>
        </div>

        <div
          className={`notify-banner ${
            personasDelante <= 2 && personasDelante !== null ? 'show' : ''
          }`}
        >
          🔔 <span>¡Tu turno se acerca! Prepárate.</span>
        </div>

        {esClinica && renderClinicaExtra()}
        {esRestaurante && renderRestaurantesExtra()}

        <div className="btn-row">
          <button className="btn btn-primary" onClick={actualizarTurno}>
            🔄 Actualizar
          </button>

          <button className="btn btn-danger" onClick={cancelarTurno}>
            ✕ Cancelar
          </button>
        </div>

        <div className="refresh-chip">
          <div className="refresh-dot"></div>
          <span>
            Actualización automática en <span>{countdown}</span>s
          </span>
        </div>
      </main>
    </>
  )
}

export default TurnoEspera