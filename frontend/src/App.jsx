import { useState } from 'react'
import PlacesList from './PlacesList'
import TurnoEspera from './TurnoEspera'

function App() {
  const [screen, setScreen] = useState('login')

  if (screen === 'places') {
    return <PlacesList />
  }

  if (screen === 'espera') {
    return <TurnoEspera />
  }

  return (
    <div className="app">
      <div className="background-shape shape-top"></div>
      <div className="background-shape shape-bottom"></div>

      <div className="phone-frame">
        <div className="login-card">
          <h1 className="title">SmartQueue</h1>
          <p className="subtitle">Gestiona tu turno de forma rápida y sencilla</p>

          <label>Email</label>
          <input type="email" placeholder="Enter tu email" />

          <label>Password</label>
          <input type="password" placeholder="Enter tu contraseña" />

          <button className="login-btn" onClick={() => setScreen('places')}>
            Sign In
          </button>

          <a href="#" className="forgot-password">Forgot password?</a>

          {/* Botón temporal para probar la pantalla de espera */}
          <button
            className="login-btn"
            style={{ marginTop: '10px', backgroundColor: '#444' }}
            onClick={() => setScreen('espera')}
          >
            Ver turno en espera
          </button>
        </div>
      </div>
    </div>
  )
}

export default App