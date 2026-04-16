import { useState } from "react";

function TurnoEspera() {
  const [turnoActual, setTurnoActual] = useState(18);
  const miTurno = 23;
  const personasDelante = miTurno - turnoActual;
  const tiempoPorTurno = 5; // minutos aproximados por turno
  const tiempoEstimado = personasDelante * tiempoPorTurno;

  const actualizarTurno = () => {
    if (turnoActual < miTurno) {
      setTurnoActual(turnoActual + 1);
    }
  };

  const progreso = ((turnoActual - 18) / (miTurno - 18)) * 100;

  return (
    <div className="page-bg">
      <div className="circle top-left"></div>
      <div className="circle bottom-right"></div>

      <div className="card">
        <h1 className="title">SmartQueue</h1>
        <p className="subtitle">Seguimiento de tu turno en tiempo real</p>

        <div className="turn-box">
          <p className="label">Servicio seleccionado</p>
          <h2 className="service-name">Atención al cliente</h2>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <p className="label">Tu turno</p>
            <h3> A-{miTurno} </h3>
          </div>

          <div className="info-card">
            <p className="label">Turno actual</p>
            <h3> A-{turnoActual} </h3>
          </div>

          <div className="info-card">
            <p className="label">Personas delante</p>
            <h3>{personasDelante >= 0 ? personasDelante : 0}</h3>
          </div>

          <div className="info-card">
            <p className="label">Tiempo estimado</p>
            <h3>{tiempoEstimado >= 0 ? tiempoEstimado : 0} min</h3>
          </div>
        </div>

        <div className="progress-section">
          <p className="label">Progreso de la fila</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progreso > 100 ? 100 : progreso}%` }}
            ></div>
          </div>
        </div>

        <div className="status-box">
          <p className="label">Estado</p>
          <h3 className="status-text">
            {turnoActual < miTurno ? "En espera" : "Es tu turno"}
          </h3>
        </div>

        <button className="main-btn" onClick={actualizarTurno}>
          Actualizar estado
        </button>
      </div>
    </div>
  );
}

export default TurnoEspera;