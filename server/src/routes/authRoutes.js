import express from "express";
import { getMe, logIn, signUp } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", logIn);
router.get("/me", requireAuth, getMe);

export default router;
