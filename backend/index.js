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

// "Base de datos" temporal
let turnos = [];

/**
 * @swagger
 * /turnos:
 *   post:
 *     summary: Crear un nuevo turno
 *     description: Agrega un turno a la lista
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Romina López"
 *     responses:
 *       200:
 *         description: Turno creado correctamente
 */
app.post("/turnos", (req, res) => {
    const { nombre } = req.body;

    const nuevoTurno = {
        id: turnos.length + 1,
        nombre
    };

    turnos.push(nuevoTurno);

    res.json(nuevoTurno);
});

/**
 * @swagger
 * /turnos:
 *   get:
 *     summary: Obtener lista de turnos
 *     responses:
 *       200:
 *         description: Lista de turnos
 *       404:
 *         description: No se encontraron turnos
 */

// Obtener turnos
app.get("/turnos", (req, res) => {
    res.json(turnos);
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