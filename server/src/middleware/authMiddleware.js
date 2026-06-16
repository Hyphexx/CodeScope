import mongoose from "mongoose";
import User from "../models/User.js";
import { verifyToken } from "../services/authService.js";

export async function requireAuth(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "MongoDB is required for user accounts." });
  }

  const authHeader = req.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const tokenPayload = token ? verifyToken(token) : null;

  if (!tokenPayload) {
    return res.status(401).json({ message: "Please sign in first." });
  }

  const user = await User.findById(tokenPayload.sub).select("_id username");

  if (!user) {
    return res.status(401).json({ message: "Please sign in first." });
  }

  req.user = user;
  return next();
}
