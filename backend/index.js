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
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               correo:
 *                 type: string
 *               contrasena:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales incorrectas
 */
app.post("/login", (req, res) => {
  const { correo, contrasena } = req.body;
  if (!correo || !contrasena)
    return res.status(400).json({ error: "Correo y contraseña son requeridos" });

  db.query("CALL LoginUsuario(?, ?)", [correo, contrasena], (err, results) => {
    if (err) { console.error("Error en login:", err); return res.status(500).json({ error: "Error del servidor" }); }
    const usuario = results[0][0];
    if (!usuario) return res.status(401).json({ error: "Credenciales incorrectas" });
    res.json({ success: true, usuario });
  });
});

// ================= CATEGORÍAS =================
/**
 * @swagger
 * /categorias:
 *   get:
 *     summary: Obtener categorías activas
 *     tags: [Categorias]
 *     responses:
 *       200:
 *         description: Lista de categorías
 */
app.get("/categorias", (req, res) => {
  db.query("CALL ObtenerCategorias()", (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ error: "Error al obtener categorias" }); }
    res.json(results[0]);
  });
});

// ================= ESTABLECIMIENTOS =================
/**
 * @swagger
 * /establecimientos/{categoria}:
 *   get:
 *     summary: Obtener establecimientos por categoría
 *     tags: [Establecimientos]
 *     parameters:
 *       - in: path
 *         name: categoria
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de establecimientos
 */
app.get("/establecimientos/:categoria", (req, res) => {
  const { categoria } = req.params;
  db.query("CALL ObtenerEstablecimientos(?)", [categoria], (err, results) => {
    if (err) { console.error(err); return res.status(500).json({ error: "Error al obtener establecimientos" }); }
    res.json(results[0]);
  });
});

// ================= BUSCAR ESTABLECIMIENTO =================
/**
 * @swagger
 * /establecimiento/buscar:
 *   get:
 *     summary: Buscar establecimiento por nombre
 *     tags: [Establecimientos]
 *     parameters:
 *       - in: query
 *         name: nombre
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Establecimiento encontrado
 *       404:
 *         description: No encontrado
 */
app.get("/establecimiento/buscar", (req, res) => {
  const { nombre } = req.query;
  if (!nombre) return res.status(400).json({ error: "Falta nombre" });

  db.query("CALL BuscarEstablecimiento(?)", [nombre], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const establecimiento = results[0][0];
    if (!establecimiento) return res.status(404).json({ error: "No encontrado" });
    res.json(establecimiento);
  });
});

// ================= SERVICIOS =================
/**
 * @swagger
 * /servicios/{idEstablecimiento}:
 *   get:
 *     summary: Obtener servicios de un establecimiento
 *     tags: [Servicios]
 *     parameters:
 *       - in: path
 *         name: idEstablecimiento
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de servicios
 */
app.get("/servicios/:idEstablecimiento", (req, res) => {
  const { idEstablecimiento } = req.params;
  db.query("CALL ObtenerServicios(?)", [idEstablecimiento], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results[0]);
  });
});

// ================= COLA =================
/**
 * @swagger
 * /cola/{idEstablecimiento}:
 *   get:
 *     summary: Obtener cola activa de un establecimiento
 *     tags: [Cola]
 *     parameters:
 *       - in: path
 *         name: idEstablecimiento
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de turnos activos
 */
app.get("/cola/:idEstablecimiento", (req, res) => {
  const { idEstablecimiento } = req.params;
  db.query("CALL ObtenerCola(?)", [idEstablecimiento], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results[0]);
  });
});

// ================= NUEVO TURNO =================
/**
 * @swagger
 * /turno/nuevo:
 *   post:
 *     summary: Cliente toma un turno (reutiliza si ya tiene uno activo)
 *     tags: [Turnos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idUsuario:
 *                 type: integer
 *               idServicio:
 *                 type: integer
 *               idEstablecimiento:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Turno creado o reutilizado
 */
app.post("/turno/nuevo", (req, res) => {
  const { idUsuario, idServicio, idEstablecimiento } = req.body;
  if (!idUsuario || !idServicio || !idEstablecimiento)
    return res.status(400).json({ error: "Faltan datos requeridos" });

  db.query("CALL TomarTurno(?, ?, ?)", [idUsuario, idServicio, idEstablecimiento], (err, results) => {
    if (err) { console.error("❌ Error TomarTurno:", err.message); return res.status(500).json({ error: err.message }); }
    const turno = results[0][0];
    res.json({ success: true, ...turno });
  });
});

// ================= ESTADO DE UN TURNO =================
/**
 * @swagger
 * /turno/{idTurno}/estado:
 *   get:
 *     summary: Obtener estado de un turno
 *     tags: [Turnos]
 *     parameters:
 *       - in: path
 *         name: idTurno
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estado del turno
 *       404:
 *         description: Turno no encontrado
 */
app.get("/turno/:idTurno/estado", (req, res) => {
  const { idTurno } = req.params;
  db.query("CALL EstadoTurno(?)", [idTurno], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const turno = results[0][0];
    if (!turno) return res.status(404).json({ error: "Turno no encontrado" });
    res.json(turno);
  });
});

// ================= LLAMAR CLIENTE =================
/**
 * @swagger
 * /turno/{idTurno}/llamar:
 *   post:
 *     summary: Llamar a un cliente
 *     tags: [Turnos]
 *     parameters:
 *       - in: path
 *         name: idTurno
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idAdmin:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cliente llamado
 */
app.post("/turno/:idTurno/llamar", (req, res) => {
  const { idTurno } = req.params;
  const { idAdmin } = req.body;
  db.query("CALL LlamarCliente(?, ?)", [idTurno, idAdmin || null], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ================= ATENDER TURNO =================
/**
 * @swagger
 * /turno/{idTurno}/atendido:
 *   post:
 *     summary: Marcar turno como atendido
 *     tags: [Turnos]
 *     parameters:
 *       - in: path
 *         name: idTurno
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idAdmin:
 *                 type: integer
 *               idEstablecimiento:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Turno atendido
 */
app.post("/turno/:idTurno/atendido", (req, res) => {
  const { idTurno } = req.params;
  const { idAdmin, idEstablecimiento } = req.body;
  if (!idEstablecimiento) return res.status(400).json({ error: "Falta idEstablecimiento" });

  db.query("CALL AtenderTurno(?, ?, ?)", [idTurno, idAdmin || null, idEstablecimiento], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ================= CANCELAR TURNO =================
/**
 * @swagger
 * /turno/{idTurno}/cancelar:
 *   post:
 *     summary: Cancelar un turno
 *     tags: [Turnos]
 *     parameters:
 *       - in: path
 *         name: idTurno
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idAdmin:
 *                 type: integer
 *               idEstablecimiento:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Turno cancelado
 */
app.post("/turno/:idTurno/cancelar", (req, res) => {
  const { idTurno } = req.params;
  const { idAdmin, idEstablecimiento } = req.body;

  db.query("CALL CancelarTurno(?, ?, ?)", [idTurno, idAdmin || null, idEstablecimiento || null], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/turno/manual', (req, res) => {
  const { nombre, detalle, idEstablecimiento, idAdmin } = req.body;
  console.log('📥 /turno/manual recibido:', { nombre, detalle, idEstablecimiento, idAdmin });

  if (!nombre || !idEstablecimiento) return res.status(400).json({ error: 'Faltan datos' });

  const ID_PRESENCIAL = 5;

  // Obtener el primer servicio del establecimiento
  const sqlServicio = `SELECT IDServicio FROM Servicio WHERE IDEstablecimiento = ? AND Estatus = 'Activo' LIMIT 1`;

  db.query(sqlServicio, [idEstablecimiento], (err, servicios) => {
    if (err) { console.error('❌ Error sqlServicio:', err.message); return res.status(500).json({ error: err.message }); }
    if (!servicios.length) return res.status(400).json({ error: 'No hay servicios para este establecimiento' });

    const idServicio = servicios[0].IDServicio;
    console.log('✅ idServicio:', idServicio);

    db.query('CALL TomarTurno(?, ?, ?)', [ID_PRESENCIAL, idServicio, idEstablecimiento], (err2, results) => {
      if (err2) { console.error('❌ Error CALL TomarTurno manual:', err2.message); return res.status(500).json({ error: err2.message }); }

      const turno = results[0][0];
      console.log('✅ Turno creado:', turno);

      // Registrar en historial con nombre del cliente manual
      db.query(
        `INSERT INTO HistorialTurno (IDTurno, IDEstadoAnterior, IDEstadoNuevo, IDAdministrador, Comentario)
         VALUES (?, NULL, 1, ?, ?)`,
        [turno.idTurno, idAdmin || null, `Agregado manualmente: ${nombre} — ${detalle || ''}`],
        (err3) => {
          if (err3) console.error('⚠️ Error historial:', err3.message);
        }
      );

      res.json({ success: true, ...turno, nombreMostrar: nombre });
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