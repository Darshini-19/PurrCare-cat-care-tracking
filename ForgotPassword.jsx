import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await api.forgotPassword({
        username: username.trim(),
        email: email.trim(),
      });

      alert("Password reset link sent to your email.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="page"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <h1>Forgot password</h1>
      <p
        className="lede"
        style={{
          maxWidth: "420px",
          margin: "0 auto 1rem",
        }}
      >
        Enter your username and registered email. If both match your account, a reset link will be sent to your email.
      </p>

      {err && (
        <div
          className="alert error"
          style={{ maxWidth: "420px", width: "100%", marginBottom: "1rem" }}
        >
          {err}
        </div>
      )}

      <div
        className="card"
        style={{
          maxWidth: "420px",
          width: "100%",
          margin: "0 auto",
          textAlign: "left",
        }}
      >
        <form onSubmit={submit}>
          <label htmlFor="fp-user">Username</label>
          <input
            id="fp-user"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            style={{ marginBottom: "0.75rem" }}
          />

          <label htmlFor="fp-email">Email</label>
          <input
            id="fp-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ marginBottom: "0.75rem" }}
          />

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button type="submit" className="btn" disabled={busy}>
              {busy ? "Sending..." : "Send reset link"}
            </button>
          </div>
        </form>

        <p
          className="muted"
          style={{
            marginTop: "1rem",
            marginBottom: 0,
            fontSize: "0.88rem",
            textAlign: "center",
          }}
        >
          <Link to="/login">← Back to log in</Link>
          {" · "}
          <Link to="/">Home</Link>
        </p>
      </div>
    </div>
  );
}