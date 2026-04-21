import controller from '../controllers/paypal.controller';
import { Router } from 'express';
const router = Router();

router.post('/create-order', controller.createOrder);
router.post('/capture-order', controller.captureOrder);

export default router;