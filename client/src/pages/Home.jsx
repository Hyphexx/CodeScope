import { useEffect, useState } from "react";
import {
  analyzeFiles,
  deleteAnalysis,
  getAnalyses,
  getAnalysisById
} from "../api/analysisApi.js";
import AnalysisResult from "../components/AnalysisResult.jsx";
import UploadBox from "../components/UploadBox.jsx";

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function Home({ token, user, onLogout }) {
  const [files, setFiles] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");

  async function refreshHistory() {
    setHistoryError("");
    setIsHistoryLoading(true);

    try {
      setHistory(await getAnalyses(token));
    } catch (apiError) {
      setHistoryError(apiError.message);
    } finally {
      setIsHistoryLoading(false);
    }
  }

  useEffect(() => {
    refreshHistory();
  }, [token]);

  async function handleSubmit() {
    setError("");
    setAnalysis(null);
    setIsLoading(true);

    try {
      const result = await analyzeFiles(files, token);
      setAnalysis(result);
      setFiles([]);
      await refreshHistory();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLoadAnalysis(id) {
    setError("");

    try {
      setAnalysis(await getAnalysisById(id, token));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function handleDeleteAnalysis(id) {
    setHistoryError("");

    try {
      await deleteAnalysis(id, token);
      if (analysis?._id === id) {
        setAnalysis(null);
      }
      await refreshHistory();
    } catch (apiError) {
      setHistoryError(apiError.message);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <nav className="top-nav">
          <div className="brand">
            <span className="brand-wordmark">CodeScope</span>
          </div>
          <div className="nav-actions">
            <span className="nav-status">{user.username}</span>
            <button type="button" className="ghost-button" onClick={onLogout}>
              Log out
            </button>
          </div>
        </nav>

        <div className="hero-content">
          <p className="eyebrow">Saved code scans</p>
          <h1>CodeScope</h1>
          <p className="hero-copy">
            File uploads, plain English review notes, and history you can clean up.
          </p>
        </div>
      </section>

      <section className="workspace two-column">
        <div>
          <UploadBox
            files={files}
            onFilesChange={setFiles}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />

          {error && <div className="error-box">{error}</div>}

          {isLoading && (
            <div className="loading-card">
              <div className="spinner" />
              <div>
                <h3>Reading files and writing notes</h3>
                <p>The scan is pulling out purpose, risks, quality notes, and ELI5 context.</p>
              </div>
            </div>
          )}

          <AnalysisResult analysis={analysis} />
        </div>

        <aside className="history-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Saved history</p>
              <h2>Previous scans</h2>
            </div>
            <button type="button" className="text-button" onClick={refreshHistory}>
              Refresh
            </button>
          </div>

          {historyError && <div className="inline-error">{historyError}</div>}

          {isHistoryLoading ? (
            <p className="muted">Loading scans...</p>
          ) : history.length ? (
            <div className="history-list">
              {history.map((item) => (
                <article className="history-item" key={item._id}>
                  <button type="button" onClick={() => handleLoadAnalysis(item._id)}>
                    <strong>{item.projectName}</strong>
                    <span>
                      {item.fileCount} files · {formatDate(item.createdAt)}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => handleDeleteAnalysis(item._id)}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">No saved scans yet.</p>
          )}
        </aside>
      </section>
    </main>
  );
}
