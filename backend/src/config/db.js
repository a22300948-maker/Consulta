// config/db.js
const sqlite3 = require('sqlite3');
const path = require('path');
const initializeDatabase = require('../database/initDb');

// Ruta donde estará el archivo .db (dentro de la carpeta database)
const DB_PATH = path.resolve(__dirname, '../database/database.db');

// Crear/abrir la base de datos
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error al conectar a SQLite:', err.message);
        return;
    }
    console.log('Conexión a SQLite establecida:', DB_PATH);
    db.run('PRAGMA foreign_keys = ON;');

    // initializeDatabase();
});

// Método query personalizado para emular la interfaz de mysql2
// Recibe SQL y callback (err, rows)
db.query = function(sql, callback) {
    // Para consultas SELECT usamos db.all()
    if (sql.trim().toLowerCase().startsWith('select')) {
        this.all(sql, (err, rows) => {
            callback(err, rows);
        });
    } else {
        // Para INSERT, UPDATE, DELETE usamos db.run()
        this.run(sql, function(err) {
            // this.lastID y this.changes disponibles si se necesitan
            callback(err, null);
        });
    }
};

module.exports = db;
