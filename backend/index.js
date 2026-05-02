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
 * /turnos:
 *   post:
 *     summary: Crear un nuevo turno
 *     description: Crea un turno en la base de datos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               IDUsuario:
 *                 type: integer
 *                 example: 2
 *               IDServicio:
 *                 type: integer
 *                 example: 1
 *               CodigoTurno:
 *                 type: string
 *                 example: "A-24"
 *               NumeroTurno:
 *                 type: integer
 *                 example: 24
 *     responses:
 *       201:
 *         description: Turno creado correctamente
 */
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

/**
 * @swagger
 * /turnos:
 *   get:
 *     summary: Obtener lista de turnos
 *     description: Obtiene todos los turnos desde la base de datos
 *     responses:
 *       200:
 *         description: Lista de turnos
 */
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

// Swagger config
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

// 🔥 AL FINAL SIEMPRE
app.listen(3001, () => {
    console.log("Servidor corriendo en http://localhost:3001");
});