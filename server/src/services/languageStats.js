import path from "path";
import { extensionLanguageMap } from "../utils/extensionMap.js";

function getLanguageName(filePath) {
  const lowerPath = filePath.toLowerCase();
  const baseName = path.basename(lowerPath);

  if (extensionLanguageMap[baseName]) {
    return extensionLanguageMap[baseName];
  }

  const extension = path.extname(lowerPath);
  return extensionLanguageMap[extension] || "Other";
}

export function calculateLanguageStats(files) {
  const totals = new Map();
  let totalBytes = 0;

  files.forEach((file) => {
    const language = getLanguageName(file.relativePath);
    const bytes = file.size || Buffer.byteLength(file.content || "", "utf8");

    totals.set(language, (totals.get(language) || 0) + bytes);
    totalBytes += bytes;
  });

  return Array.from(totals.entries())
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: totalBytes ? Number(((bytes / totalBytes) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.bytes - a.bytes);
}
