const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../env.env') });

// Inicializar/sembrar la base de datos al iniciar el servidor
try {
    const initializeDatabase = require('./database/initDb');
    initializeDatabase();
} catch (e) {
    console.warn('No se pudo inicializar la BD automáticamente:', e.message || e);
}

const app= require('./app');
const PORT = process.env.PORT || 3000;


app.listen(PORT,()=>{
        console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`);
});
