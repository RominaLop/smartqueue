const mysql = require("mysql2");

// Configuración de tu BD
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "rominamysql1110#$", // tu contraseña de MySQL
    database: "SmartQueueDB"
});

// Conectar
connection.connect((err) => {
    if (err) {
        console.error("Error de conexión:", err);
        return;
    }
    console.log("Conectado a MySQL 😎");
});

module.exports = connection;