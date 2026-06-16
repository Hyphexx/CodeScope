import fs from "fs/promises";
import path from "path";
import {
  binaryExtensions,
  ignoredFileNames,
  ignoredFolderNames,
  textFileExtensions
} from "../utils/extensionMap.js";

const MAX_TEXT_CHARS = 220000;
const MAX_SINGLE_FILE_CHARS = 40000;

function normalizeRelativePath(filePath = "") {
  return filePath.replace(/\\/g, "/").replace(/^\/+/, "");
}

function getUploadedFileName(filePath = "") {
  const normalized = normalizeRelativePath(filePath);
  return path.basename(normalized) || "uploaded-file";
}

function shouldIgnorePath(relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  const parts = normalized.split("/").filter(Boolean);
  const fileName = parts[parts.length - 1]?.toLowerCase() || "";

  if (parts.some((part) => ignoredFolderNames.has(part.toLowerCase()))) {
    return "Ignored folder";
  }

  if (ignoredFileNames.has(fileName)) {
    return "Ignored sensitive or lock file";
  }

  const extension = path.extname(fileName);
  if (binaryExtensions.has(extension)) {
    return "Binary or media file";
  }

  if (!textFileExtensions.has(extension) && !textFileExtensions.has(fileName)) {
    return "Unsupported file type";
  }

  return null;
}

function addPathToTree(tree, relativePath) {
  tree.files.push(getUploadedFileName(relativePath));
}

export async function scanUploadedFiles(uploadedFiles, providedPaths) {
  const paths = Array.isArray(providedPaths) ? providedPaths : [providedPaths].filter(Boolean);
  const safeFiles = [];
  const skippedFiles = [];
  const fileTree = { name: "root", children: {}, files: [] };
  let totalChars = 0;

  for (let index = 0; index < uploadedFiles.length; index += 1) {
    const file = uploadedFiles[index];
    const relativePath = getUploadedFileName(paths[index] || file.originalname);
    const ignoreReason = shouldIgnorePath(relativePath);

    if (ignoreReason) {
      skippedFiles.push({ path: relativePath, reason: ignoreReason });
      continue;
    }

    addPathToTree(fileTree, relativePath);

    if (totalChars >= MAX_TEXT_CHARS) {
      skippedFiles.push({ path: relativePath, reason: "Project text limit reached" });
      continue;
    }

    const rawText = await fs.readFile(file.path, "utf8");
    const textForGemini = rawText.slice(0, MAX_SINGLE_FILE_CHARS);
    const remainingChars = MAX_TEXT_CHARS - totalChars;
    const clippedText = textForGemini.slice(0, remainingChars);

    if (rawText.length > clippedText.length) {
      skippedFiles.push({
        path: relativePath,
        reason: `Only the first ${clippedText.length.toLocaleString()} characters were included`
      });
    }

    totalChars += clippedText.length;
    safeFiles.push({
      originalName: file.originalname,
      relativePath,
      size: file.size,
      content: clippedText
    });
  }

  return {
    projectName: "Uploaded Files",
    fileCount: safeFiles.length,
    folderCount: 0,
    fileTree,
    safeFiles,
    skippedFiles,
    totalChars
  };
}
