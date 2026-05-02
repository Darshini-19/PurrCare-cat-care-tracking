import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api.js";

const DIGIT_6 = /^[A-Za-z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\-]{4,10}$/;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [err, setErr] = useState(null);
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setSuccess("");

    if (!token) {
      setErr("Reset token is missing or invalid.");
      return;
    }

    if (!DIGIT_6.test(newPassword)) {
      setErr("Password must be 4-10 characters and include alphabets, numbers, or special characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErr("New password and confirm password do not match.");
      return;
    }

    setBusy(true);
    try {
      await api.resetPassword({
        token,
        newPassword,
      });

      setSuccess("Password reset successful. Redirecting to login...");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (e) {
      setErr(e.message || "Could not reset password.");
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
      <h1>Reset password</h1>
      <p
        className="lede"
        style={{
          maxWidth: "420px",
          margin: "0 auto 1rem",
        }}
      >
        Enter your new password below.
      </p>

      {err && (
        <div
          className="alert error"
          style={{ maxWidth: "420px", width: "100%", marginBottom: "1rem" }}
        >
          {err}
        </div>
      )}
      {success && (
        <div
          className="alert"
          style={{ maxWidth: "420px", width: "100%", marginBottom: "1rem" }}
        >
          {success}
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
          <label htmlFor="rp-pass">New password</label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            <input
              id="rp-pass"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value.slice(0, 10))}
              required
              maxLength={10}
              autoComplete="new-password"
              style={{ marginBottom: 0, flex: 1 }}
            />
            <button
              type="button"
              className="btn secondary"
              onClick={() => setShowNewPassword((prev) => !prev)}
              style={{ minWidth: "80px" }}
            >
              {showNewPassword ? "Hide" : "Show"}
            </button>
          </div>

          <label htmlFor="rp-confirm">Confirm new password</label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            <input
              id="rp-confirm"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value.slice(0, 10))}
              required
              maxLength={10}
              autoComplete="new-password"
              style={{ marginBottom: 0, flex: 1 }}
            />
            <button
              type="button"
              className="btn secondary"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              style={{ minWidth: "80px" }}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button type="submit" className="btn" disabled={busy}>
              {busy ? "Resetting..." : "Reset password"}
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