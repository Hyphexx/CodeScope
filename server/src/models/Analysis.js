import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  fileCount: {
    type: Number,
    required: true
  },
  folderCount: {
    type: Number,
    required: true
  },
  languageStats: {
    type: Array,
    default: []
  },
  fileTree: {
    type: Object,
    default: {}
  },
  skippedFiles: {
    type: Array,
    default: []
  },
  geminiResult: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Analysis", analysisSchema);
