import { useState } from "react";
import { logIn, signUp } from "../api/analysisApi.js";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const authResult = mode === "signup"
        ? await signUp({ username, password })
        : await logIn({ username, password });

      onAuth(authResult);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-copy">
          <div className="brand">
            <span className="brand-wordmark">CodeScope</span>
          </div>
          <h1>Code review notes that stay readable.</h1>
          <p>
            Upload files, get a practical developer friendly scan, and keep previous
            analyses tied to your account.
          </p>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-tabs" aria-label="Authentication mode">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              Log in
            </button>
            <button
              type="button"
              className={mode === "signup" ? "active" : ""}
              onClick={() => setMode("signup")}
            >
              Sign up
            </button>
          </div>

          <div>
            <p className="eyebrow">{mode === "signup" ? "Create account" : "Welcome back"}</p>
            <h2>{mode === "signup" ? "Start a saved history" : "Open your scans"}</h2>
          </div>

          <label>
            Username
            <input
              autoComplete="username"
              minLength={3}
              maxLength={32}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="dev_junior"
              required
              value={username}
            />
          </label>

          <label>
            Password
            <input
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="8 characters minimum"
              required
              type="password"
              value={password}
            />
          </label>

          {error && <div className="inline-error">{error}</div>}

          <button className="primary-button" disabled={isLoading} type="submit">
            {isLoading ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
          </button>
        </form>
      </section>
    </main>
  );
}
