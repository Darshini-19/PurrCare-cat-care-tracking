import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const DIGIT_6 = /^[A-Za-z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\-]{4,10}$/;

export default function Signup() {
  const { signup, user, ready } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (ready && user) {
      setSuccess("Account created successfully. Please log in with your username and password.");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    }
  }, [ready, user, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);

    if (!DIGIT_6.test(password)) {
      setErr("Password must be 4-10 characters and include alphabets, numbers, or special characters.");
      return;
    }

    setBusy(true);
    try {
      await signup({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        username: username.trim(),
        password,
      });

      setSuccess("Account created successfully. Please log in with your username and password.");

      setFullName("");
      setEmail("");
      setPhone("");
      setUsername("");
      setPassword("");
      setShowPassword(false);

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (e) {
      if (String(e.message || "").toLowerCase().includes("username")) {
        setErr("That username is already taken. Please choose a different username.");
      } else {
        setErr(e.message);
      }
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
    <div className="page page-auth page-auth--signup">
      <h1>Sign up</h1>
      <p className="lede">
        Create your owner account.
      </p>
      <p className="muted auth-sub">
        If you are already signed up, <Link to="/login">go to log in</Link>.
      </p>

      <div className="auth-stack">
        {err && <div className="alert error">{err}</div>}
        {success && <div className="alert">{success}</div>}

        <div className="card">
          <form onSubmit={onSubmit}>
            <label htmlFor="su-full">Full name</label>
            <input
              id="su-full"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
              style={{ marginBottom: "0.65rem" }}
            />

            <label htmlFor="su-email">Email</label>
            <input
              id="su-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{ marginBottom: "0.65rem" }}
            />

            <label htmlFor="su-phone">Phone number</label>
            <input
              id="su-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
              style={{ marginBottom: "0.65rem" }}
            />

            <label htmlFor="su-user">Username</label>
            <input
              id="su-user"
              placeholder="Letters, numbers, underscore (3–32)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              minLength={3}
              maxLength={32}
              style={{ marginBottom: "0.65rem" }}
            />

            <label htmlFor="su-pass">Password (4-10 characters)</label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              <input
                id="su-pass"
                type={showPassword ? "text" : "password"}
                minLength={4}
                maxLength={10}
                value={password}
                onChange={(e) => setPassword(e.target.value.slice(0, 10))}
                required
                autoComplete="new-password"
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
              Create account
            </button>
          </form>

          <p className="muted" style={{ marginTop: "1rem", marginBottom: 0 }}>
            <Link to="/">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}