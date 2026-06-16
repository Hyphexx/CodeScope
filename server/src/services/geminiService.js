import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const RETRY_DELAYS_MS = [800, 1600];

function buildProjectSnapshot({ safeFiles, fileTree, languageStats, skippedFiles }) {
  const fileSections = safeFiles
    .map((file) => {
      return [
        `FILE: ${file.relativePath}`,
        `SIZE: ${file.size} bytes`,
        "CONTENT:",
        file.content
      ].join("\n");
    })
    .join("\n\n---\n\n");

  return JSON.stringify(
    {
      fileTree,
      languageStats,
      skippedFiles,
      files: fileSections
    },
    null,
    2
  );
}

function extractJson(text) {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return JSON.parse(trimmed);
  }

  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (match?.[1]) {
    return JSON.parse(match[1].trim());
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }

  throw new Error("No JSON object found in Gemini response");
}

function buildLocalFallback(projectData, status = "failed") {
  const fileCount = projectData.safeFiles?.length || 0;
  const languageNames = (projectData.languageStats || [])
    .map((stat) => stat.language)
    .filter(Boolean);
  const languageSummary = languageNames.length
    ? `Detected languages: ${languageNames.join(", ")}.`
    : "No dominant language could be detected from the uploaded files.";
  const isBusy = status === "busy";

  return {
    analysisStatus: status,
    overviewParagraph: isBusy
      ? "Analysis is busy right now. Please try again in a moment."
      : "Analysis failed. Please try again.",
    summary: isBusy
      ? "Analysis is busy right now. Please try again in a moment."
      : "Analysis failed. Please try again.",
    purpose: "",
    structureNotes: `Your ${fileCount === 1 ? "file was" : "files were"} uploaded and scanned as individual files. ${languageSummary}`,
    issues: [
      isBusy
        ? "Analysis is busy right now. Please try again in a moment."
        : "Analysis failed. Please try again."
    ],
    securityConcerns: [],
    qualityNotes: [],
    improvements: [],
    beginnerExplanation: ""
  };
}

function getAnalysisModels() {
  const configuredModels = [
    process.env.GEMINI_MODEL,
    ...(process.env.GEMINI_FALLBACK_MODELS || "").split(",")
  ]
    .map((model) => model?.trim())
    .filter(Boolean);

  return [...new Set(configuredModels.length ? configuredModels : DEFAULT_MODELS)];
}

function getErrorStatus(error) {
  if (Number.isInteger(error?.status)) {
    return error.status;
  }

  if (Number.isInteger(error?.code)) {
    return error.code;
  }

  try {
    const parsed = JSON.parse(error?.message || "{}");
    return parsed?.error?.code;
  } catch {
    return null;
  }
}

function isRetryableGeminiError(error) {
  return RETRYABLE_STATUS_CODES.has(getErrorStatus(error));
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function generateContentWithFallbacks(ai, prompt) {
  const models = getAnalysisModels();
  let lastError;

  for (const model of models) {
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        return response.text || "";
      } catch (error) {
        lastError = error;
        const shouldRetry = isRetryableGeminiError(error);

        console.error(
          `Gemini analysis failed for ${model} on attempt ${attempt + 1}:`,
          error.message
        );

        if (!shouldRetry) {
          break;
        }

        const delay = RETRY_DELAYS_MS[attempt];
        if (delay) {
          await wait(delay);
        }
      }
    }
  }

  throw lastError;
}

export async function analyzeProjectWithGemini(projectData) {
  if (!process.env.GEMINI_API_KEY) {
    return buildLocalFallback(projectData);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const snapshot = buildProjectSnapshot(projectData);
  const prompt = `
You are a senior developer writing a concise review note to another developer. The note should feel like a polished dev-to-dev message: plain language, direct, useful, and professional enough that a manager could read it. Do not make it personal. Do not invent names, teams, or company context.

Return only valid JSON with these keys:
overviewParagraph, summary, purpose, structureNotes, issues, securityConcerns, qualityNotes, improvements, beginnerExplanation.

The overviewParagraph must be one clear paragraph, 3 to 5 sentences long. It should say what the uploaded files appear to do, the main languages or technologies used, and the biggest thing a developer should notice first.
The purpose must be 1 to 3 sentences.
The issues and securityConcerns arrays should be practical and specific. If nothing stands out, return an empty array.
The qualityNotes array should describe maintainability, readability, structure, naming, error handling, tests, or duplication.
The beginnerExplanation must be an ELI5-style explanation for a junior developer, but it should still sound respectful and technical enough for interview prep.
Avoid scientific-report language. Avoid filler. Keep each list item under 24 words when possible.

Use arrays for issues, securityConcerns, qualityNotes, and possible improvements. Keep it specific to the uploaded code. Do not mention Gemini, AI providers, API keys, internal server logs, or backend implementation details.

Uploaded project snapshot:
${snapshot}
`;

  try {
    const text = await generateContentWithFallbacks(ai, prompt);

    try {
      return extractJson(text);
    } catch (error) {
      return {
        analysisStatus: "failed",
        overviewParagraph: "Analysis failed. Please try again.",
        summary: "Analysis failed. Please try again.",
        purpose: "",
        structureNotes: "",
        issues: ["Analysis failed. Please try again."],
        securityConcerns: [],
        qualityNotes: [],
        improvements: [],
        beginnerExplanation: ""
      };
    }
  } catch (error) {
    console.error("Gemini analysis failed after all attempts:", error.message);
    return buildLocalFallback(
      projectData,
      isRetryableGeminiError(error) ? "busy" : "failed"
    );
  }
}
