import { useState } from 'react'
import PlacesList from './PlacesList'

function App() {
  const [loggedIn, setLoggedIn] = useState(false)

  if (loggedIn) return <PlacesList />

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

          <button className="login-btn" onClick={() => setLoggedIn(true)}>Sign In</button>

          <a href="#" className="forgot-password">Forgot password?</a>
        </div>
      </div>
    </div>
  )
}

export default App