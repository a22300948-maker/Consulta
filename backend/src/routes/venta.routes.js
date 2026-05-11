const express = require('express');
const { createVenta } = require('../controller/venta.controller');
const router = express.Router();

router.post('/', createVenta);

module.exports = router;
