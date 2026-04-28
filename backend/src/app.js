const express = require('express');
const cors = require('cors');
const productosRoutes = require('./routes/producto.routes');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', productosRoutes);
const paypalRouter = require('./router/paypal.router');
app.use('/api/paypal', paypalRouter);
module.exports = app;