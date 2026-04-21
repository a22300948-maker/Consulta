const express = require('express');
const cors = require('cors');
const productosRoutes = require('./routes/producto.routes');
const app = express();
import paypalRouter from './router/paypal.router';

app.use('/api/paypal', paypalRouter);

app.use(cors());
app.use(express.json());
app.use('/api', productosRoutes);
module.exports = app;