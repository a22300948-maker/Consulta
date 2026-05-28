const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../../middleware/auth.middleware');
const { getProductos, getProductosAdmin, getProductoById, createProduct, updateProduct, deleteProduct, setProductActive, updateProductStock } = require('../controller/producto.controller');

// Public
router.get('/productos', getProductos);
router.get('/productos/:id', getProductoById);

// Admin CRUD
router.get('/admin/productos', verifyToken, verifyAdmin, getProductosAdmin);
router.post('/productos', verifyToken, verifyAdmin, createProduct);
router.put('/productos/:id', verifyToken, verifyAdmin, updateProduct);
router.delete('/productos/:id', verifyToken, verifyAdmin, deleteProduct);
router.put('/productos/:id/active', verifyToken, verifyAdmin, setProductActive);

// Admin: actualizar únicamente el stock
router.put('/productos/:id/stock', verifyToken, verifyAdmin, updateProductStock);
module.exports = router;

