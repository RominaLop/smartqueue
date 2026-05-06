const db = require("./db");
const express = require("express");
const cors = require("cors");

const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();

app.use(cors());
app.use(express.json());

// Ruta raíz
app.get("/", (req, res) => {
    res.send("Servidor SmartQueue funcionando 🚀");
});
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Valida correo y contraseña del usuario mediante un procedimiento almacenado en MySQL
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
// ================= LOGIN =================
app.post("/login", (req, res) => {
  const { correo, contrasena } = req.body;

  db.query(
    "CALL LoginUsuario(?, ?)",
    [correo, contrasena],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error del servidor" });
      }

      const data = results[0];

      if (data.length === 0) {
        return res.status(401).json({ error: "Credenciales incorrectas" });
      }

      res.json({
        success: true,
        usuario: data[0]
      });
    }
  );
});

// ================= TURNOS =================
app.post("/turnos", (req, res) => {
    const { IDUsuario, IDServicio, CodigoTurno, NumeroTurno } = req.body;

    if (!IDUsuario || !IDServicio || !CodigoTurno || !NumeroTurno) {
        return res.status(400).json({ error: "Faltan datos" });
    }

    const sql = `
        INSERT INTO Turno 
        (IDUsuario, IDServicio, CodigoTurno, NumeroTurno)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [IDUsuario, IDServicio, CodigoTurno, NumeroTurno], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al crear turno" });
        }

        res.status(201).json({
            message: "Turno creado",
            id: result.insertId
        });
    });
});

app.get("/turnos", (req, res) => {
    const sql = "SELECT * FROM Turno";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al obtener turnos" });
        }

        res.json(results);
    });
});
/**
 * @swagger
 * /categorias:
 *   get:
 *     summary: Obtener categorías
 *     description: Devuelve todas las categorías activas (Bancos, Restaurantes, etc.)
 *     tags:
 *       - Categorias
 *     responses:
 *       200:
 *         description: Lista de categorías obtenida correctamente
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
// ================= CATEGORIAS =================
app.get("/categorias", (req, res) => {
    const sql = "SELECT * FROM Categoria WHERE Estatus = 'Activo'";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al obtener categorias" });
        }

        res.json(results);
    });
});
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
 */
// ================= ESTABLECIMIENTOS =================
app.get("/establecimientos/:categoria", (req, res) => {
    const categoria = req.params.categoria;

    const sql = `
        SELECT e.*
        FROM Establecimiento e
        INNER JOIN Categoria c ON e.IDCategoria = c.IDCategoria
        WHERE c.NombreCategoria = ?
        AND e.Estatus = 'Activo'
    `;

    db.query(sql, [categoria], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al obtener establecimientos" });
        }

        res.json(results);
    });
});

// ================= SWAGGER =================
const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "API SmartQueue",
            version: "1.0.0",
            description: "API para gestión de turnos"
        }
    },
    apis: ["./index.js"]
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// ================= SERVER =================
app.listen(3001, () => {
    console.log("Servidor corriendo en http://localhost:3001");
});