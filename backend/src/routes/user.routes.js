const express = require('express');
const { verifyToken } = require('../../middleware/auth.middleware');
const { getUserProfile, updateUserProfile, getUserOrders } = require('../controller/user.controller');

const router = express.Router();

router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);
router.get('/orders', verifyToken, getUserOrders);

module.exports = router;
