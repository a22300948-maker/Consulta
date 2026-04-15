const express = require('express');
const cors = require('cors');
const productosRoutes = require('./controller/producto.controller');
const express = require('express');

app.use(cors());
app.use(express.json());
app.use('/api', productosRoutes);
module.exports = app;