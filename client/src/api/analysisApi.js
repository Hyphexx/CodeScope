function getDefaultApiBaseUrl() {
  if (typeof window !== "undefined" && window.location.port === "5174") {
    return "http://127.0.0.1:5001/api";
  }

  return "http://localhost:5000/api";
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || getDefaultApiBaseUrl()).replace(/\/+$/, "");

async function readJsonResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function signUp(credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });

  return readJsonResponse(response, "Could not create account.");
}

export async function logIn(credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });

  return readJsonResponse(response, "Could not sign in.");
}

export async function getCurrentUser(token) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: authHeaders(token)
  });

  return readJsonResponse(response, "Could not load account.");
}

export async function analyzeFiles(files, token) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
    formData.append("paths", file.name);
  });

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData
  });

  return readJsonResponse(response, "Analysis failed.");
}

export async function getAnalyses(token) {
  const response = await fetch(`${API_BASE_URL}/analyses`, {
    headers: authHeaders(token)
  });

  return readJsonResponse(response, "Could not load analyses.");
}

export async function getAnalysisById(id, token) {
  const response = await fetch(`${API_BASE_URL}/analyses/${id}`, {
    headers: authHeaders(token)
  });

  return readJsonResponse(response, "Could not load analysis.");
}

export async function deleteAnalysis(id, token) {
  const response = await fetch(`${API_BASE_URL}/analyses/${id}`, {
    method: "DELETE",
    headers: authHeaders(token)
  });

  return readJsonResponse(response, "Could not delete analysis.");
}
