import mongoose from "mongoose";
import User from "../models/User.js";
import { createToken, hashPassword, verifyPassword } from "../services/authService.js";

function cleanUsername(username = "") {
  return username.trim().toLowerCase();
}

function sendAuthResponse(res, user, status = 200) {
  return res.status(status).json({
    token: createToken(user),
    user: {
      id: user._id,
      username: user.username
    }
  });
}

function validateCredentials(username, password) {
  if (!username || username.length < 3 || username.length > 32) {
    return "Username must be 3 to 32 characters.";
  }

  if (!/^[a-z0-9._-]+$/.test(username)) {
    return "Use only letters, numbers, dots, dashes, or underscores for the username.";
  }

  if (!password || password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  return "";
}

export async function signUp(req, res) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "MongoDB is required for user accounts." });
  }

  try {
    const username = cleanUsername(req.body.username);
    const password = req.body.password || "";
    const validationError = validateCredentials(username, password);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(409).json({ message: "That username is already taken." });
    }

    const user = await User.create({
      username,
      passwordHash: await hashPassword(password)
    });

    return sendAuthResponse(res, user, 201);
  } catch (error) {
    return res.status(500).json({ message: "Could not create account.", error: error.message });
  }
}

export async function logIn(req, res) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "MongoDB is required for user accounts." });
  }

  try {
    const username = cleanUsername(req.body.username);
    const password = req.body.password || "";
    const user = await User.findOne({ username });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ message: "Username or password is incorrect." });
    }

    return sendAuthResponse(res, user);
  } catch (error) {
    return res.status(500).json({ message: "Could not sign in.", error: error.message });
  }
}

export function getMe(req, res) {
  return res.json({
    user: {
      id: req.user._id,
      username: req.user.username
    }
  });
}
