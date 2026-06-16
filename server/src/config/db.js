import mongoose from "mongoose";

const READY_STATE_NAMES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting"
};

let lastConnectionError = "";

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    lastConnectionError = "MONGO_URI is missing.";
    console.warn(`${lastConnectionError} Analysis results will not be saved.`);
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    lastConnectionError = "";
    console.log("MongoDB connected");
  } catch (error) {
    lastConnectionError = error.message;
    console.error("MongoDB connection failed:", error.message);
  }
}

export function getDbStatus() {
  const readyState = mongoose.connection.readyState;

  return {
    readyState,
    state: READY_STATE_NAMES[readyState] || "unknown",
    hasMongoUri: Boolean(process.env.MONGO_URI),
    lastConnectionError: lastConnectionError || null
  };
}
