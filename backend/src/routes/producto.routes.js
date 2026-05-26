const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../../middleware/auth.middleware');
const { getProductos, updateProductStock } = require('../controller/producto.controller');
router.get('/productos', getProductos);

// Admin: actualizar únicamente el stock
router.put('/productos/:id/stock', verifyToken, verifyAdmin, updateProductStock);
module.exports = router;

