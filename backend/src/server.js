const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../env.env') });
const app= require('./app');
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>{
    console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`);
});