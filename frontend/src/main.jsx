import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

import '../CSS/base.css'
import '../CSS/login.css'
import '../CSS/places.css'
import '../CSS/turno.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)