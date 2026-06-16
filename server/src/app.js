import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import analysisRoutes from "./routes/analysisRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const localOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174"
];

function normalizeOrigin(origin = "") {
  return origin.trim().replace(/\/+$/, "");
}

const configuredOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);
const allowedOrigins = new Set([...localOrigins, ...configuredOrigins]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({ message: "CodeScope API is running." });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api", analysisRoutes);

app.use((error, req, res, next) => {
  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "Origin is not allowed by CORS." });
  }

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Each file must be 5 MB or smaller." });
  }

  if (error.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({ message: "Please upload 120 files or fewer." });
  }

  return res.status(500).json({ message: "Server error.", error: error.message });
});

export default app;
