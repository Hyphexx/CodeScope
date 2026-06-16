import { useEffect, useState } from "react";
import { getCurrentUser } from "./api/analysisApi.js";
import AuthPage from "./pages/AuthPage.jsx";
import Home from "./pages/Home.jsx";

const TOKEN_STORAGE_KEY = "codescope_token";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setIsCheckingAuth(false);
      return;
    }

    let isMounted = true;

    getCurrentUser(token)
      .then((data) => {
        if (isMounted) {
          setUser(data.user);
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        if (isMounted) {
          setToken("");
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  function handleAuth(authResult) {
    localStorage.setItem(TOKEN_STORAGE_KEY, authResult.token);
    setToken(authResult.token);
    setUser(authResult.user);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken("");
    setUser(null);
  }

  if (isCheckingAuth) {
    return (
      <main className="center-shell">
        <div className="loading-card compact">
          <div className="spinner" />
          <p>Checking account...</p>
        </div>
      </main>
    );
  }

  if (!user || !token) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return <Home token={token} user={user} onLogout={handleLogout} />;
}
