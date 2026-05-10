import { useState } from 'react'
import PlacesList from './PlacesList'
import TurnoEspera from './TurnoEspera'

function App() {
  const [screen, setScreen] = useState('login')
  const [isAdminMode, setIsAdminMode] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessType, setBusinessType] = useState('restaurante')
  const [businessName, setBusinessName] = useState('')

  const [emailError, setEmailError] = useState(false)
  const [passError, setPassError] = useState(false)
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const ejemplos = {
    banco: ['BBVA México', 'Banorte', 'Citibanamex', 'Santander'],
    restaurante: ['Pampas', 'Harrys', 'Freds', 'Puerto Madero'],
    clinica: ['Clínica SmartCare'],
    universidad: ['Universidad SmartQueue'],
  }

  const getPlaceholder = () => {
    const lista = ejemplos[businessType] || []
    return `Ej: ${lista[0] || ''}`
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    setEmailError(false)
    setPassError(false)
    setApiError('')

    let valid = true

    if (!email || !email.includes('@')) {
      setEmailError(true)
      valid = false
    }

    if (!password) {
      setPassError(true)
      valid = false
    }

    if (!valid) return

    setLoading(true)

    try {
      const res = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email, contrasena: password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión')
      }

      if (data.success) {
        const usuario = data.usuario

        if (isAdminMode && usuario.NombreRol === 'Cliente') {
          throw new Error('Esta cuenta no tiene permisos de administrador.')
        }

        if (!isAdminMode && usuario.NombreRol !== 'Cliente') {
          throw new Error('Esta cuenta es de administrador. Usa el acceso de administrador.')
        }

        if (isAdminMode) {
          usuario.TipoNegocio = businessType
          usuario.NombreNegocio = businessName.trim()
        }

        sessionStorage.setItem('usuario', JSON.stringify(usuario))

        if (usuario.NombreRol === 'Cliente') {
          setScreen('places')
        } else {
          window.location.href = '/HTML/admin.html'
        }
      }
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (screen === 'places') {
    return <PlacesList onGoToTurno={() => setScreen('espera')} />
  }

  if (screen === 'espera') {
    return <TurnoEspera onBack={() => setScreen('places')} />
  }

  return (
    <>
      <div className="blob blob-top"></div>
      <div className="blob blob-bottom"></div>

      <form className="card login-card" onSubmit={handleLogin}>
        <h1 className="brand">
          <span>Smart</span>Queue
        </h1>

        <p className="login-subtitle">
          Gestiona tu turno de forma rápida y sencilla
        </p>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            placeholder="tu@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {emailError && (
            <span className="error-msg show-error">
              Ingresa un email válido
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            id="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {passError && (
            <span className="error-msg show-error">
              La contraseña es requerida
            </span>
          )}
        </div>

        <div className={`admin-fields ${isAdminMode ? 'visible' : ''}`}>
          <div className="field">
            <label htmlFor="businessType">Tipo de negocio</label>
            <select
              id="businessType"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
            >
              <option value="restaurante">Restaurante</option>
              <option value="clinica">Clínica</option>
              <option value="banco">Banco</option>
              <option value="universidad">Universidad</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="businessName">Nombre del negocio</label>
            <input
              type="text"
              id="businessName"
              placeholder={getPlaceholder()}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
        </div>

        <p
          className="toggle-admin"
          onClick={() => setIsAdminMode(!isAdminMode)}
        >
          ¿Eres administrador?{' '}
          <span>
            {isAdminMode ? 'Iniciar como cliente' : 'Iniciar como admin'}
          </span>
        </p>

        {apiError && (
          <span className="error-msg show-error api-error">
            {apiError}
          </span>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '⏳' : 'Iniciar sesión'}
        </button>

        <a className="forgot" href="#">
          ¿Olvidaste tu contraseña?
        </a>

        <div className="divider"></div>

        <p className="register-link">
          ¿No tienes cuenta? <a href="#">Regístrate</a>
        </p>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setScreen('espera')}
        >
          Ver turno en espera
        </button>
      </form>

      <div className="toast"></div>
    </>
  )
}

export default App