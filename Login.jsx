import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const DIGIT_6 = /^[A-Za-z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\-]{4,10}$/;

export default function Login() {
  const { login, user, ready } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) navigate("/", { replace: true });
  }, [ready, user, navigate]);

  useEffect(() => {
    setUsername("");
    setPassword("");
    setShowPassword(false);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);

    if (!username.trim()) {
      setErr("Username is required.");
      return;
    }

    if (!DIGIT_6.test(password)) {
      setErr("Password must be 4-10 characters and include alphabets, numbers, or special characters.");
      return;
    }

    setBusy(true);

    try {
      await login(username.trim(), password);
      navigate("/", { replace: true });
    } catch (e) {
      setErr(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="page">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="page page-auth">
      <h1>Log in</h1>
      <p className="lede">Sign in with your username and password.</p>
      <p className="muted auth-sub">
        If you are not a user, <Link to="/signup">sign up first</Link>.
      </p>

      <div className="auth-stack">
        {err && <div className="alert error">{err}</div>}

        <div className="card">
          <form onSubmit={onSubmit} autoComplete="off">
            <input
              type="text"
              name="fake_username"
              autoComplete="username"
              style={{ display: "none" }}
            />
            <input
              type="password"
              name="fake_password"
              autoComplete="current-password"
              style={{ display: "none" }}
            />

            <label htmlFor="login-user">Username</label>
            <input
              id="login-user"
              name="login_user_manual"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ marginBottom: "0.65rem" }}
            />

            <label htmlFor="login-pass">Password (4-10 characters)</label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.65rem",
              }}
            >
              <input
                id="login-pass"
                name="login_pass_manual"
                type={showPassword ? "text" : "password"}
                maxLength={10}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={password}
                onChange={(e) => setPassword(e.target.value.slice(0, 10))}
                required
                style={{ marginBottom: 0, flex: 1 }}
              />
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{ minWidth: "80px" }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button type="submit" className="btn" disabled={busy}>
              {busy ? "Signing in..." : "Sign in"}
            </button>

            <p style={{ marginTop: "0.75rem", marginBottom: 0 }}>
              <Link to="/forgot-password">Forgot password?</Link>
            </p>
          </form>

          <p className="muted" style={{ marginTop: "1rem", marginBottom: 0 }}>
            <Link to="/">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}