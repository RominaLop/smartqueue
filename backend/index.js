const db = require("./db");
const express = require("express");
const cors = require("cors");

const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();

app.use(cors());
app.use(express.json());

// ================= RAÍZ =================
app.get("/", (req, res) => {
  res.send("Servidor SmartQueue funcionando 🚀");
});

// ================= LOGIN =================
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Valida correo y contraseña del usuario
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               correo:
 *                 type: string
 *                 example: cliente@smartqueue.com
 *               contrasena:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     IDUsuario:
 *                       type: integer
 *                       example: 2
 *                     Nombre:
 *                       type: string
 *                       example: Cliente
 *                     Correo:
 *                       type: string
 *                       example: cliente@smartqueue.com
 *                     NombreRol:
 *                       type: string
 *                       example: Cliente
 *       401:
 *         description: Credenciales incorrectas
 *       500:
 *         description: Error del servidor
 */
app.post("/login", (req, res) => {
  const { correo, contrasena } = req.body;
  if (!correo || !contrasena) {
    return res.status(400).json({ error: "Correo y contraseña son requeridos" });
  }
  const sql = `
    SELECT u.IDUsuario, u.IDRol, u.Nombre,
      u.ApellidoPaterno, u.ApellidoMaterno,
      u.Telefono, u.Correo, u.Estatus, r.NombreRol
    FROM Usuario u
    INNER JOIN Rol r ON u.IDRol = r.IDRol
    WHERE u.Correo = ? AND u.Contrasena = ? AND u.Estatus = 'Activo'
    LIMIT 1
  `;
  db.query(sql, [correo, contrasena], (err, results) => {
    if (err) { console.error("Error en login:", err); return res.status(500).json({ error: "Error del servidor" }); }
    if (results.length === 0) return res.status(401).json({ error: "Credenciales incorrectas" });
    res.json({ success: true, usuario: results[0] });
  });
});

// ================= CATEGORIAS =================
/**
 * @swagger
 * /categorias:
 *   get:
 *     summary: Obtener categorías
 *     description: Devuelve todas las categorías activas
 *     tags:
 *       - Categorias
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   IDCategoria:
 *                     type: integer
 *                     example: 1
 *                   NombreCategoria:
 *                     type: string
 *                     example: Bancos
 *                   Descripcion:
 *                     type: string
 *                     example: Instituciones bancarias
 *                   Estatus:
 *                     type: string
 *                     example: Activo
 *       500:
 *         description: Error del servidor
 */
app.get("/categorias", (req, res) => {
  const sql = "SELECT * FROM Categoria WHERE Estatus = 'Activo'";
  db.query(sql, (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ error: "Error al obtener categorias" }); }
    res.json(results);
  });
});

// ================= ESTABLECIMIENTOS =================
/**
 * @swagger
 * /establecimientos/{categoria}:
 *   get:
 *     summary: Obtener establecimientos por categoría
 *     tags:
 *       - Establecimientos
 *     parameters:
 *       - in: path
 *         name: categoria
 *         required: true
 *         schema:
 *           type: string
 *         example: Clínicas
 *     responses:
 *       200:
 *         description: Lista de establecimientos
 *       500:
 *         description: Error del servidor
 */
app.get("/establecimientos/:categoria", (req, res) => {
  const categoria = req.params.categoria;
  const sql = `
    SELECT e.* FROM Establecimiento e
    INNER JOIN Categoria c ON e.IDCategoria = c.IDCategoria
    WHERE c.NombreCategoria = ? AND e.Estatus = 'Activo'
  `;
  db.query(sql, [categoria], (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ error: "Error al obtener establecimientos" }); }
    res.json(results);
  });
});

// ================= BUSCAR ESTABLECIMIENTO =================
/**
 * @swagger
 * /establecimiento/buscar:
 *   get:
 *     summary: Buscar establecimiento por nombre
 *     description: Devuelve el ID y nombre de un establecimiento activo
 *     tags:
 *       - Establecimientos
 *     parameters:
 *       - in: query
 *         name: nombre
 *         required: true
 *         schema:
 *           type: string
 *         example: Pampas
 *     responses:
 *       200:
 *         description: Establecimiento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 IDEstablecimiento:
 *                   type: integer
 *                   example: 9
 *                 NombreEstablecimiento:
 *                   type: string
 *                   example: Pampas
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error del servidor
 */
app.get('/establecimiento/buscar', (req, res) => {
  const { nombre } = req.query;
  if (!nombre) return res.status(400).json({ error: 'Falta nombre' });
  const sql = `
    SELECT IDEstablecimiento, NombreEstablecimiento 
    FROM Establecimiento 
    WHERE NombreEstablecimiento = ? AND Estatus = 'Activo' LIMIT 1
  `;
  db.query(sql, [nombre], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(results[0]);
  });
});

// ================= SERVICIOS POR ESTABLECIMIENTO =================
/**
 * @swagger
 * /servicios/{idEstablecimiento}:
 *   get:
 *     summary: Obtener servicios de un establecimiento
 *     tags:
 *       - Servicios
 *     parameters:
 *       - in: path
 *         name: idEstablecimiento
 *         required: true
 *         schema:
 *           type: integer
 *         example: 9
 *     responses:
 *       200:
 *         description: Lista de servicios
 *       500:
 *         description: Error del servidor
 */
app.get('/servicios/:idEstablecimiento', (req, res) => {
  const { idEstablecimiento } = req.params;
  const sql = `SELECT * FROM Servicio WHERE IDEstablecimiento = ? AND Estatus = 'Activo'`;
  db.query(sql, [idEstablecimiento], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ================= COLA DE UN ESTABLECIMIENTO =================
/**
 * @swagger
 * /cola/{idEstablecimiento}:
 *   get:
 *     summary: Obtener cola activa de un establecimiento
 *     description: Devuelve todos los turnos en espera o en atención
 *     tags:
 *       - Cola
 *     parameters:
 *       - in: path
 *         name: idEstablecimiento
 *         required: true
 *         schema:
 *           type: integer
 *         example: 9
 *     responses:
 *       200:
 *         description: Lista de turnos activos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   IDTurno:
 *                     type: integer
 *                   CodigoTurno:
 *                     type: string
 *                   NumeroTurno:
 *                     type: integer
 *                   PersonasDelante:
 *                     type: integer
 *                   TiempoEstimadoMin:
 *                     type: integer
 *                   NombreEstado:
 *                     type: string
 *                   Nombre:
 *                     type: string
 *       500:
 *         description: Error del servidor
 */
app.get('/cola/:idEstablecimiento', (req, res) => {
  const { idEstablecimiento } = req.params;
  const sql = `
    SELECT t.IDTurno, t.CodigoTurno, t.NumeroTurno,
      t.PersonasDelante, t.TiempoEstimadoMin,
      et.NombreEstado, u.Nombre
    FROM Turno t
    INNER JOIN EstadoTurno et ON t.IDEstadoTurno = et.IDEstadoTurno
    INNER JOIN Usuario u ON t.IDUsuario = u.IDUsuario
    WHERE t.IDEstadoTurno IN (1, 2)
    AND t.IDServicio IN (SELECT IDServicio FROM Servicio WHERE IDEstablecimiento = ?)
    ORDER BY t.NumeroTurno ASC
  `;
  db.query(sql, [idEstablecimiento], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ================= TURNOS (legacy) =================
app.post("/turnos", (req, res) => {
  const { IDUsuario, IDServicio, CodigoTurno, NumeroTurno } = req.body;
  if (!IDUsuario || !IDServicio || !CodigoTurno || !NumeroTurno) {
    return res.status(400).json({ error: "Faltan datos" });
  }
  const sql = `INSERT INTO Turno (IDUsuario, IDServicio, CodigoTurno, NumeroTurno) VALUES (?, ?, ?, ?)`;
  db.query(sql, [IDUsuario, IDServicio, CodigoTurno, NumeroTurno], (err, result) => {
    if (err) { console.error(err); return res.status(500).json({ error: "Error al crear turno" }); }
    res.status(201).json({ message: "Turno creado", id: result.insertId });
  });
});

app.get("/turnos", (req, res) => {
  const sql = "SELECT * FROM Turno";
  db.query(sql, (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ error: "Error al obtener turnos" }); }
    res.json(results);
  });
});

// ================= NUEVO TURNO =================
/**
 * @swagger
 * /turno/nuevo:
 *   post:
 *     summary: Cliente toma un turno
 *     description: Crea un nuevo turno para un cliente en un establecimiento
 *     tags:
 *       - Turnos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idUsuario:
 *                 type: integer
 *                 example: 2
 *               idServicio:
 *                 type: integer
 *                 example: 6
 *               idEstablecimiento:
 *                 type: integer
 *                 example: 9
 *     responses:
 *       200:
 *         description: Turno creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 codigoTurno:
 *                   type: string
 *                   example: A-04
 *                 numeroTurno:
 *                   type: integer
 *                 personasDelante:
 *                   type: integer
 *                 idTurno:
 *                   type: integer
 *       500:
 *         description: Error del servidor
 */
app.post('/turno/nuevo', (req, res) => {
  const { idUsuario, idServicio, idEstablecimiento } = req.body;
  if (!idUsuario || !idServicio || !idEstablecimiento) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }
  const sqlContar = `
    SELECT COUNT(*) as total FROM Turno t
    INNER JOIN Servicio s ON t.IDServicio = s.IDServicio
    WHERE s.IDEstablecimiento = ? AND t.IDEstadoTurno IN (1, 2)
  `;
  db.query(sqlContar, [idEstablecimiento], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const personasDelante = result[0].total;
    const numeroTurno     = personasDelante + 1;
    const codigoTurno     = `A-${String(numeroTurno).padStart(2, '0')}`;
    const tiempoEstimado  = personasDelante * 5;
    const sqlInsert = `
      INSERT INTO Turno (IDUsuario, IDServicio, IDEstadoTurno, CodigoTurno, NumeroTurno, PersonasDelante, TiempoEstimadoMin)
      VALUES (?, ?, 1, ?, ?, ?, ?)
    `;
    db.query(sqlInsert, [idUsuario, idServicio, codigoTurno, numeroTurno, personasDelante, tiempoEstimado], (err2, result2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      const sqlHistorial = `
        INSERT INTO HistorialTurno (IDTurno, IDEstadoAnterior, IDEstadoNuevo, IDAdministrador, Comentario)
        VALUES (?, NULL, 1, NULL, 'Turno creado por el cliente.')
      `;
      db.query(sqlHistorial, [result2.insertId]);
      res.json({ success: true, codigoTurno, numeroTurno, personasDelante, tiempoEstimadoMin: tiempoEstimado, idTurno: result2.insertId });
    });
  });
});

// ================= ESTADO DE UN TURNO =================
/**
 * @swagger
 * /turno/{idTurno}/estado:
 *   get:
 *     summary: Obtener estado de un turno específico
 *     tags:
 *       - Turnos
 *     parameters:
 *       - in: path
 *         name: idTurno
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Estado del turno
 *       404:
 *         description: Turno no encontrado
 *       500:
 *         description: Error del servidor
 */
app.get('/turno/:idTurno/estado', (req, res) => {
  const { idTurno } = req.params;
  const sql = `
    SELECT t.IDTurno, t.CodigoTurno, t.NumeroTurno,
      t.PersonasDelante, t.TiempoEstimadoMin,
      et.NombreEstado,
      (SELECT MIN(NumeroTurno) FROM Turno 
       WHERE IDEstadoTurno IN (1, 2) AND IDServicio = t.IDServicio) as turnoActual
    FROM Turno t
    INNER JOIN EstadoTurno et ON t.IDEstadoTurno = et.IDEstadoTurno
    WHERE t.IDTurno = ?
  `;
  db.query(sql, [idTurno], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Turno no encontrado' });
    const t        = results[0];
    const progreso = t.PersonasDelante === 0 ? 100 : Math.max(0, 100 - (t.PersonasDelante * 10));
    res.json({ ...t, progreso });
  });
});

// ================= LLAMAR CLIENTE =================
/**
 * @swagger
 * /turno/{idTurno}/llamar:
 *   post:
 *     summary: Llamar a un cliente
 *     description: Cambia el estado del turno a En atención y notifica al cliente
 *     tags:
 *       - Turnos
 *     parameters:
 *       - in: path
 *         name: idTurno
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idAdmin:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Cliente llamado exitosamente
 *       500:
 *         description: Error del servidor
 */
app.post('/turno/:idTurno/llamar', (req, res) => {
  const { idTurno } = req.params;
  const { idAdmin } = req.body;
  const sql = `
    UPDATE Turno SET IDEstadoTurno = 2, FechaInicioAtencion = NOW()
    WHERE IDTurno = ?
  `;
  db.query(sql, [idTurno], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    const sqlHistorial = `
      INSERT INTO HistorialTurno (IDTurno, IDEstadoAnterior, IDEstadoNuevo, IDAdministrador, Comentario)
      VALUES (?, 1, 2, ?, 'Cliente llamado por administrador.')
    `;
    db.query(sqlHistorial, [idTurno, idAdmin || null]);
    res.json({ success: true });
  });
});

// ================= ATENDER TURNO =================
/**
 * @swagger
 * /turno/{idTurno}/atendido:
 *   post:
 *     summary: Marcar turno como atendido
 *     description: El administrador marca un turno como finalizado y actualiza la cola
 *     tags:
 *       - Turnos
 *     parameters:
 *       - in: path
 *         name: idTurno
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idAdmin:
 *                 type: integer
 *                 example: 1
 *               idEstablecimiento:
 *                 type: integer
 *                 example: 9
 *     responses:
 *       200:
 *         description: Turno marcado como atendido
 *       500:
 *         description: Error del servidor
 */
app.post('/turno/:idTurno/atendido', (req, res) => {
  const { idTurno } = req.params;
  const { idAdmin, idEstablecimiento } = req.body;
  if (!idEstablecimiento) return res.status(400).json({ error: 'Falta idEstablecimiento' });
  const sqlAtender = `UPDATE Turno SET IDEstadoTurno = 3, FechaFinalizacion = NOW() WHERE IDTurno = ?`;
  db.query(sqlAtender, [idTurno], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    const sqlUpdate = `
      UPDATE Turno t
      INNER JOIN Servicio s ON t.IDServicio = s.IDServicio
      SET t.PersonasDelante = GREATEST(t.PersonasDelante - 1, 0),
          t.TiempoEstimadoMin = GREATEST(t.TiempoEstimadoMin - 5, 0)
      WHERE s.IDEstablecimiento = ? AND t.IDEstadoTurno = 1
    `;
    db.query(sqlUpdate, [idEstablecimiento], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      const sqlHistorial = `
        INSERT INTO HistorialTurno (IDTurno, IDEstadoAnterior, IDEstadoNuevo, IDAdministrador, Comentario)
        VALUES (?, 1, 3, ?, 'Turno marcado como atendido por administrador.')
      `;
      db.query(sqlHistorial, [idTurno, idAdmin || null]);
      res.json({ success: true });
    });
  });
});

// ================= CANCELAR TURNO =================
/**
 * @swagger
 * /turno/{idTurno}/cancelar:
 *   post:
 *     summary: Cancelar un turno
 *     description: Cambia el estado del turno a Cancelado y actualiza la cola
 *     tags:
 *       - Turnos
 *     parameters:
 *       - in: path
 *         name: idTurno
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idAdmin:
 *                 type: integer
 *                 example: 1
 *               idEstablecimiento:
 *                 type: integer
 *                 example: 9
 *     responses:
 *       200:
 *         description: Turno cancelado
 *       500:
 *         description: Error del servidor
 */
app.post('/turno/:idTurno/cancelar', (req, res) => {
  const { idTurno } = req.params;
  const { idAdmin, idEstablecimiento } = req.body;
  const sqlCancelar = `UPDATE Turno SET IDEstadoTurno = 4, FechaFinalizacion = NOW() WHERE IDTurno = ?`;
  db.query(sqlCancelar, [idTurno], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    const sqlUpdate = `
      UPDATE Turno t
      INNER JOIN Servicio s ON t.IDServicio = s.IDServicio
      SET t.PersonasDelante = GREATEST(t.PersonasDelante - 1, 0),
          t.TiempoEstimadoMin = GREATEST(t.TiempoEstimadoMin - 5, 0)
      WHERE s.IDEstablecimiento = ? AND t.IDEstadoTurno = 1
    `;
    db.query(sqlUpdate, [idEstablecimiento], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      const sqlHistorial = `
        INSERT INTO HistorialTurno (IDTurno, IDEstadoAnterior, IDEstadoNuevo, IDAdministrador, Comentario)
        VALUES (?, 1, 4, ?, 'Turno cancelado.')
      `;
      db.query(sqlHistorial, [idTurno, idAdmin || null]);
      res.json({ success: true });
    });
  });
});

// ================= SWAGGER =================
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "API SmartQueue",
      version: "1.0.0",
      description: "API para gestión de turnos",
    },
  },
  apis: ["./index.js"],
};
const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ================= SERVER =================
app.listen(3001, () => {
  console.log("Servidor corriendo en http://localhost:3001");
});