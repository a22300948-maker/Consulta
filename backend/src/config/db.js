const mysql = require('mysql2');
require('dotenv').config();
const conexion = mysql.createConnection({
    host: process.env.DB_HOST,
    user:process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database:process.env.DB_NAME
});
conexion.connect((err)=>{
    if(err){
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexión a la base de datos establecida');
});
module.exports = conexion;
