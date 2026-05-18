import { Routes } from "express";
import { verifyToken } from "../../middleware/auth.middleware";
import { getUserProfile, updateUserProfile } from "../controllers/user.controller.js";

const router = Routes();

router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);

export default router;
