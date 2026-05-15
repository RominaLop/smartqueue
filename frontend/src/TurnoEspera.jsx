import { useEffect, useState, useRef } from 'react'

function TurnoEspera({ onBack }) {
  const [placeName, setPlaceName]             = useState('')
  const [miTurno, setMiTurno]                 = useState('–')
  const [turnoActual, setTurnoActual]          = useState('–')
  const [personasDelante, setPersonasDelante]  = useState('–')
  const [tiempoEstimado, setTiempoEstimado]    = useState('–')
  const [progreso, setProgreso]                = useState(0)
  const [estado, setEstado]                    = useState('En espera')
  const [countdown, setCountdown]              = useState(5)

  const idTurnoRef             = useRef(null)
  const idEstablecimientoRef   = useRef(null)
  const yaNotificadoRef        = useRef(false)

  const INFO_RESTAURANTES = {
    Pampas:          { rating: 4.8, precio: '$$$', tipo: 'Asador argentino' },
    Harrys:          { rating: 4.6, precio: '$$',  tipo: 'Bar & Grill' },
    Freds:           { rating: 4.5, precio: '$$',  tipo: 'Mariscos' },
    'Puerto Madero': { rating: 4.9, precio: '$$$', tipo: 'Cortes & Vinos' },
    RosaNegra:       { rating: 4.7, precio: '$$$', tipo: 'Fusión mexicana' },
    Navios:          { rating: 4.4, precio: '$$',  tipo: 'Cocina del mar' },
    Ilios:           { rating: 4.6, precio: '$$',  tipo: 'Mediterráneo' },
    Taboo:           { rating: 4.5, precio: '$$$', tipo: 'Beach club' },
  }

  const HORARIOS_CLINICA = {
    'Clínica SmartCare': { apertura: 7, cierre: 21, emergencias: true },
  }

  // ── Init ──────────────────────────────────────────────────
  useEffect(() => {
    const savedPlace = sessionStorage.getItem('smartqueue_place') || ''
    setPlaceName(savedPlace)

    if (Notification.permission === 'default') Notification.requestPermission()

    iniciar(savedPlace)

    const refreshTimer = setInterval(() => actualizarTurno(), 5000)
    const countTimer   = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 5 : prev - 1))
    }, 1000)

    return () => {
      clearInterval(refreshTimer)
      clearInterval(countTimer)
    }
  }, [])

  // ── Resolver idEstablecimiento y arrancar ─────────────────
  const iniciar = async (savedPlace) => {
    if (!savedPlace) return

    try {
      const res  = await fetch(`http://localhost:3001/establecimiento/buscar?nombre=${encodeURIComponent(savedPlace)}`)
      const data = await res.json()
      if (data && data.IDEstablecimiento) {
        idEstablecimientoRef.current = data.IDEstablecimiento
        sessionStorage.setItem('idEstablecimiento', data.IDEstablecimiento)
        console.log('✅ idEstablecimiento:', data.IDEstablecimiento)
      }
    } catch (e) {
      console.warn('No se pudo resolver establecimiento:', e)
    }

    const idTurnoGuardado = sessionStorage.getItem('idTurno')
    if (idTurnoGuardado) {
      idTurnoRef.current = idTurnoGuardado
      await actualizarTurno()
    } else {
      await tomarTurno()
    }
  }

  // ── Tomar turno nuevo ─────────────────────────────────────
  const tomarTurno = async () => {
    const usuario   = JSON.parse(sessionStorage.getItem('usuario') || '{}')
    const idUsuario = usuario.IDUsuario
    const idEst     = idEstablecimientoRef.current || sessionStorage.getItem('idEstablecimiento')

    console.log('🟡 tomarTurno → idUsuario:', idUsuario, '| idEst:', idEst)

    if (!idUsuario || !idEst) {
      console.warn('❌ Faltan datos para tomar turno')
      return
    }

    try {
      const resServ   = await fetch(`http://localhost:3001/servicios/${idEst}`)
      const servicios = await resServ.json()
      if (!servicios || servicios.length === 0) { console.warn('Sin servicios'); return }
      const idServicio = servicios[0].IDServicio

      const res  = await fetch('http://localhost:3001/turno/nuevo', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idUsuario, idServicio, idEstablecimiento: Number(idEst) })
      })
      const data = await res.json()
      console.log('📥 Respuesta /turno/nuevo:', data)

      if (data.success) {
        idTurnoRef.current = data.idTurno
        sessionStorage.setItem('idTurno', data.idTurno)

        setMiTurno(data.codigoTurno)
        setPersonasDelante(data.personasDelante)
        setTiempoEstimado(data.tiempoEstimadoMin > 0 ? `${data.tiempoEstimadoMin} min` : '< 5 min')
        setTurnoActual(data.personasDelante === 0 ? data.codigoTurno : '–')
        setEstado('En espera')
        const pct = data.personasDelante === 0 ? 100 : Math.max(0, 100 - data.personasDelante * 10)
        setProgreso(pct)
        setCountdown(5)
      }
    } catch (e) {
      console.error('❌ Error al tomar turno:', e)
    }
  }

  // ── Actualizar turno desde BD ─────────────────────────────
  const actualizarTurno = async () => {
    const idTurno = idTurnoRef.current || sessionStorage.getItem('idTurno')
    const idEst   = idEstablecimientoRef.current || sessionStorage.getItem('idEstablecimiento')
    if (!idTurno || !idEst) return

    try {
      const [resTurno, reCola] = await Promise.all([
        fetch(`http://localhost:3001/turno/${idTurno}/estado`),
        fetch(`http://localhost:3001/cola/${idEst}`)
      ])

      if (resTurno.status === 404) {
        sessionStorage.removeItem('idTurno')
        idTurnoRef.current = null
        await tomarTurno()
        return
      }
      if (!resTurno.ok) return

      const data = await resTurno.json()
      const cola = reCola.ok ? await reCola.json() : []

      const miPos          = cola.findIndex(t => String(t.IDTurno) === String(idTurno))
      const delante        = miPos > 0 ? miPos : miPos === 0 ? 0 : (data.PersonasDelante ?? 0)
      const tiempoReal     = delante * 5
      const turnoActualCod = cola.length > 0 ? cola[0].CodigoTurno : (data.CodigoTurno ?? '–')

      setMiTurno(data.CodigoTurno ?? '–')
      setTurnoActual(turnoActualCod)
      setPersonasDelante(delante)
      setTiempoEstimado(tiempoReal > 0 ? `${tiempoReal} min` : '< 5 min')
      const pct = delante === 0 ? 100 : Math.max(5, 100 - delante * 10)
      setProgreso(pct)

      const nuevoEstado = data.NombreEstado || 'En espera'
      setEstado(nuevoEstado)
      setCountdown(5)

      if (nuevoEstado === 'En atención' && !yaNotificadoRef.current) {
        yaNotificadoRef.current = true
        if (Notification.permission === 'granted') {
          new Notification('¡Te están llamando! 🔔', {
            body: `${sessionStorage.getItem('smartqueue_place')} te está llamando. Acércate al mostrador.`
          })
        }
      }

      if (nuevoEstado === 'Finalizado' || nuevoEstado === 'Cancelado') {
        sessionStorage.removeItem('idTurno')
        idTurnoRef.current = null
      }
    } catch (e) {
      console.warn('Error actualizando turno:', e)
    }
  }

  // ── Cancelar turno ────────────────────────────────────────
  const cancelarTurno = async () => {
    if (!window.confirm('¿Seguro que deseas cancelar tu turno?')) return
    const idTurno = idTurnoRef.current || sessionStorage.getItem('idTurno')
    const idEst   = idEstablecimientoRef.current || sessionStorage.getItem('idEstablecimiento')

    if (idTurno) {
      try {
        await fetch(`http://localhost:3001/turno/${idTurno}/cancelar`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ idEstablecimiento: idEst })
        })
      } catch (e) { console.warn('Error cancelando:', e) }
    }

    sessionStorage.removeItem('idTurno')
    sessionStorage.removeItem('idEstablecimiento')
    sessionStorage.removeItem('smartqueue_place')
    sessionStorage.removeItem('smartqueue_categoria')
    if (onBack) onBack()
  }

  const volver = () => { if (onBack) onBack() }

  const esRestaurante = Object.keys(INFO_RESTAURANTES).includes(placeName)
  const esClinica     = Object.keys(HORARIOS_CLINICA).includes(placeName)

  // ── Render clínica ────────────────────────────────────────
  const renderClinicaExtra = () => {
    const info    = HORARIOS_CLINICA[placeName] || { apertura: 8, cierre: 20, emergencias: false }
    const ahora   = new Date().getHours()
    const abierto = ahora >= info.apertura && ahora < info.cierre
    return (
      <div className="extra-section">
        <div className="extra-clinica">
          <div className="horario-row">
            <span className="horario-icon">{abierto ? '🟢' : '🔴'}</span>
            <div>
              <p className="extra-label">Horario</p>
              <p className="extra-value">
                {abierto ? 'Abierto ahora' : 'Cerrado'} · {info.apertura}:00 – {info.cierre}:00 hrs
              </p>
            </div>
          </div>
          {info.emergencias && (
            <div className="emergencia-banner">
              🚨 <strong>Urgencias 24/7</strong> — Atención de emergencias disponible en todo momento.
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Render restaurantes cercanos ──────────────────────────
  const renderRestaurantesExtra = () => {
    const otros = Object.keys(INFO_RESTAURANTES).filter(n => n !== placeName)
    return (
      <div className="extra-section">
        <div className="extra-restaurantes">
          <p className="extra-title">Otros restaurantes cerca</p>
          <div className="rest-list">
            {otros.map((nombre) => {
              const info      = INFO_RESTAURANTES[nombre]
              const estrellas = '★'.repeat(Math.round(info.rating)) + '☆'.repeat(5 - Math.round(info.rating))
              return (
                <div className="rest-item" key={nombre} onClick={() => {
                  sessionStorage.removeItem('idTurno')
                  sessionStorage.removeItem('idEstablecimiento')
                  idTurnoRef.current           = null
                  idEstablecimientoRef.current  = null
                  yaNotificadoRef.current       = false
                  sessionStorage.setItem('smartqueue_place', nombre)
                  sessionStorage.setItem('smartqueue_categoria', 'Restaurantes')
                  setPlaceName(nombre)
                  iniciar(nombre)
                }}>
                  <div className="rest-thumb">
                    <span style={{
                      width: '100%', height: '100%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontWeight: '700', color: '#fff',
                      background: 'linear-gradient(135deg, #c7d88a, #b8cb73)'
                    }}>
                      {nombre.charAt(0)}
                    </span>
                  </div>
                  <div className="rest-info">
                    <p className="rest-name">{nombre}</p>
                    <p className="rest-meta">{info.tipo} · {info.precio}</p>
                    <p className="rest-stars">{estrellas} <span>{info.rating}</span></p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── JSX ───────────────────────────────────────────────────
  return (
    <>
      <div className="blob blob-top"></div>
      <div className="blob blob-bottom"></div>

      <main className="card turno-card">
        <div className="top-bar">
          <button className="back-btn" onClick={volver}>← Volver</button>
          <span className="brand"><span>Smart</span>Queue</span>
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
            <h3>{tiempoEstimado}</h3>
          </div>
        </div>

        <div className="progress-wrap">
          <div className="progress-header">
            <span className="box-label">Progreso de la fila</span>
            <span className="progress-pct">{progreso}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progreso}%` }}></div>
          </div>
        </div>

        <div className="status-box">
          <div>
            <p className="box-label">Estado</p>
            <h3 className="status-text">{estado}</h3>
          </div>
          <div className={`status-dot ${
            estado === 'En atención' ? 'green' : estado === 'Cancelado' ? 'red' : ''
          }`}></div>
        </div>

        <div className={`notify-banner ${
          personasDelante !== '–' && personasDelante <= 2 ? 'show' : ''
        }`}>
          🔔 <span>
            {estado === 'En atención'
              ? '¡Te están llamando! Acércate al mostrador 🏃'
              : `¡Casi es tu turno! Solo ${personasDelante} persona(s) delante.`}
          </span>
        </div>

        {esClinica     && renderClinicaExtra()}
        {esRestaurante && renderRestaurantesExtra()}

        <div className="btn-row">
          <button className="btn btn-primary" onClick={actualizarTurno}>🔄 Actualizar</button>
          <button className="btn btn-danger"  onClick={cancelarTurno}>✕ Cancelar</button>
        </div>

        <div className="refresh-chip">
          <div className="refresh-dot"></div>
          <span>Actualización automática en <span>{countdown}</span>s</span>
        </div>
      </main>
    </>
  )
}

export default TurnoEspera