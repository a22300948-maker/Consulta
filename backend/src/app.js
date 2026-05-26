const express = require('express');
const cors = require('cors');
const productosRoutes = require('./routes/producto.routes');
const paypalRoutes = require('./router/paypal.router');
const ventaRoutes = require('./routes/venta.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', productosRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/venta', ventaRoutes);
module.exports = app;
