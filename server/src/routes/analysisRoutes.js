import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import {
  createAnalysis,
  deleteAnalysis,
  getAnalyses,
  getAnalysisById
} from "../controllers/analysisController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, "../../uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-z0-9._-]/gi, "_");
    callback(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 120
  }
});

router.post("/analyze", requireAuth, upload.array("files"), createAnalysis);
router.get("/analyses", requireAuth, getAnalyses);
router.get("/analyses/:id", requireAuth, getAnalysisById);
router.delete("/analyses/:id", requireAuth, deleteAnalysis);

export default router;
