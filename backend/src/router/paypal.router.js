const express = require('express');
const controller = require('../controller/paypal.controller');
const router = express.Router();

router.post('/create-order', controller.createOrder);
router.post('/capture-order', controller.captureOrder);

// Expose client ID for frontend to load the PayPal SDK (safe to expose)
router.get('/client-id', (req, res) => {
	try {
		const clientId = process.env.PAYPAL_CLIENT_ID || null;
		if (!clientId) {
			return res.status(500).json({ error: 'PayPal client id not configured' });
		}

		res.json({ clientId: clientId.trim() });
	} catch (err) {
		res.status(500).json({ error: 'Unable to read PayPal client id' });
	}
});

module.exports = router;