import fs from "fs/promises";
import mongoose from "mongoose";
import Analysis from "../models/Analysis.js";
import { analyzeProjectWithGemini } from "../services/geminiService.js";
import { scanUploadedFiles } from "../services/fileScanner.js";
import { calculateLanguageStats } from "../services/languageStats.js";

async function cleanupUploads(files = []) {
  await Promise.all(
    files.map((file) => fs.unlink(file.path).catch(() => null))
  );
}

export async function createAnalysis(req, res) {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ message: "Please upload at least one file." });
    }

    const scanResult = await scanUploadedFiles(req.files, req.body.paths);

    if (!scanResult.safeFiles.length) {
      await cleanupUploads(req.files);
      return res.status(400).json({
        message: "No supported text/code files were found.",
        skippedFiles: scanResult.skippedFiles
      });
    }

    const languageStats = calculateLanguageStats(scanResult.safeFiles);
    const geminiResult = await analyzeProjectWithGemini({
      ...scanResult,
      languageStats
    });

    const analysisPayload = {
      userId: req.user._id,
      originalName: scanResult.projectName,
      projectName: scanResult.projectName,
      fileCount: scanResult.fileCount,
      folderCount: scanResult.folderCount,
      languageStats,
      fileTree: scanResult.fileTree,
      skippedFiles: scanResult.skippedFiles,
      geminiResult
    };

    let savedAnalysis = analysisPayload;

    if (mongoose.connection.readyState === 1) {
      savedAnalysis = await Analysis.create(analysisPayload);
    }

    await cleanupUploads(req.files);
    return res.status(201).json(savedAnalysis);
  } catch (error) {
    await cleanupUploads(req.files);
    return res.status(500).json({
      message: "Analysis failed.",
      error: error.message
    });
  }
}

export async function getAnalyses(req, res) {
  try {
    const analyses = await Analysis.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select("projectName fileCount folderCount languageStats createdAt")
      .limit(25);

    return res.json(analyses);
  } catch (error) {
    return res.status(500).json({ message: "Could not load analyses.", error: error.message });
  }
}

export async function getAnalysisById(req, res) {
  try {
    const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.user._id });

    if (!analysis) {
      return res.status(404).json({ message: "Analysis not found." });
    }

    return res.json(analysis);
  } catch (error) {
    return res.status(500).json({ message: "Could not load analysis.", error: error.message });
  }
}

export async function deleteAnalysis(req, res) {
  try {
    const analysis = await Analysis.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!analysis) {
      return res.status(404).json({ message: "Analysis not found." });
    }

    return res.json({ message: "Analysis deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Could not delete analysis.", error: error.message });
  }
}
