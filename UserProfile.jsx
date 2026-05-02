import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function UserProfile() {
  const { refreshUser, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordErr, setPasswordErr] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    photoUrl: "",
  });

  const [original, setOriginal] = useState({
    fullName: "",
    email: "",
    phone: "",
    photoUrl: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setErr("");
      const data = await api.me();
      const u = data.user || {};

      const nextData = {
        fullName: u.fullName || "",
        email: u.email || "",
        phone: u.phone || "",
        photoUrl: u.photoUrl || "",
      };

      setForm(nextData);
      setOriginal(nextData);
    } catch (e) {
      setErr(e.message || "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        photoUrl: reader.result || "",
      }));
    };
    reader.readAsDataURL(file);
  }

  function handleRemovePhoto() {
    setForm((prev) => ({
      ...prev,
      photoUrl: "",
    }));
  }

  function handleCancel() {
    setForm(original);
    setEditing(false);
    setErr("");
    setSuccess("");
  }

  function handleLogout() {
    logout();
    window.location.href = "/login";
  }

  async function handleSave() {
    try {
      setSaving(true);
      setErr("");
      setSuccess("");

      const payload = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        photoUrl: form.photoUrl,
      };

      const result = await api.updateProfile(payload);
      const updatedUser = result.user || payload;

      setForm({
        fullName: updatedUser.fullName || "",
        email: updatedUser.email || "",
        phone: updatedUser.phone || "",
        photoUrl: updatedUser.photoUrl || "",
      });

      setOriginal({
        fullName: updatedUser.fullName || "",
        email: updatedUser.email || "",
        phone: updatedUser.phone || "",
        photoUrl: updatedUser.photoUrl || "",
      });

      await refreshUser();

      setEditing(false);
      setSuccess("Profile updated successfully.");
    } catch (e) {
      setErr(e.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordErr("");
    setPasswordSuccess("");

    if (
      !passwordForm.currentPassword.trim() ||
      !passwordForm.newPassword.trim() ||
      !passwordForm.confirmNewPassword.trim()
    ) {
      setPasswordErr("Please fill all password fields.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordErr("New password and retype password do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 4 || passwordForm.newPassword.length > 10) {
      setPasswordErr("New password must be 4-10 characters.");
      return;
    }

    try {
      setPasswordBusy(true);

      await api.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordSuccess("Password changed successfully.");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);
    } catch (e) {
      setPasswordErr(e.message || "Could not change password.");
    } finally {
      setPasswordBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 style={{ textAlign: "center" }}>User profile</h1>
      <p
        className="lede"
        style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 1.5rem" }}
      >
        View and update your profile details, including your profile photo.
      </p>

      {err ? <div className="alert error">{err}</div> : null}
      {success ? <div className="alert">{success}</div> : null}

      <div
        className="card"
        style={{
          background: "rgba(247, 244, 255, 0.96)",
          border: "1px solid #8f79c9",
          boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
          maxWidth: "780px",
          margin: "0 auto",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ width: "180px", flexShrink: 0 }}>
            <div
              style={{
                width: "160px",
                height: "160px",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid #8f79c9",
                background: "#ece4ff",
                display: "grid",
                placeItems: "center",
              }}
            >
              {form.photoUrl ? (
                <img
                  src={form.photoUrl}
                  alt="Profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: "3rem",
                    color: "#5b2db8",
                    fontWeight: 700,
                  }}
                >
                  👤
                </div>
              )}
            </div>

            <div style={{ marginTop: "0.8rem", width: "160px" }}>
              <label htmlFor="profile-photo" style={{ display: "block", marginBottom: "0.35rem" }}>
                Profile photo
              </label>
              <input
                id="profile-photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={!editing}
                style={{ width: "160px", fontSize: "0.82rem", marginBottom: "0.5rem" }}
              />
              <button
                type="button"
                className="btn secondary"
                onClick={handleRemovePhoto}
                style={{ width: "160px", padding: "0.5rem 0.7rem", fontSize: "0.9rem" }}
                disabled={!editing || !form.photoUrl}
              >
                Remove photo
              </button>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: "0.9rem" }}>
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div style={{ marginBottom: "0.9rem" }}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            <div style={{ marginBottom: "0.9rem" }}>
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                disabled={!editing}
                placeholder="Enter phone number"
              />
            </div>

            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              {!editing ? (
                <>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setEditing(true);
                      setErr("");
                      setSuccess("");
                    }}
                  >
                    Edit profile
                  </button>

                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => setShowChangePassword((prev) => !prev)}
                  >
                    {showChangePassword ? "Hide password form" : "Change password"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>

                  <button
                    type="button"
                    className="btn secondary"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => setShowChangePassword((prev) => !prev)}
                  >
                    {showChangePassword ? "Hide password form" : "Change password"}
                  </button>
                </>
              )}

              <button
                type="button"
                className="btn danger"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>

      {showChangePassword && (
        <div
          className="card"
          style={{
            background: "rgba(247, 244, 255, 0.96)",
            border: "1px solid #8f79c9",
            boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
            maxWidth: "780px",
            margin: "1.25rem auto 0",
            padding: "1.5rem",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "0.35rem" }}>Change password</h2>
          <p className="muted" style={{ marginTop: 0, marginBottom: "1rem" }}>
            Update your account password securely.
          </p>

          {passwordErr ? <div className="alert error">{passwordErr}</div> : null}
          {passwordSuccess ? <div className="alert">{passwordSuccess}</div> : null}

          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: "0.9rem" }}>
              <label htmlFor="currentPassword">Current password</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  style={{ marginBottom: 0, flex: 1 }}
                />
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  style={{ minWidth: "80px" }}
                >
                  {showCurrentPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "0.9rem" }}>
              <label htmlFor="newPassword">New password</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  maxLength={10}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
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
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="confirmNewPassword">Retype new password</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <input
                  id="confirmNewPassword"
                  type={showConfirmNewPassword ? "text" : "password"}
                  maxLength={10}
                  value={passwordForm.confirmNewPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, confirmNewPassword: e.target.value }))
                  }
                  style={{ marginBottom: 0, flex: 1 }}
                />
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                  style={{ minWidth: "80px" }}
                >
                  {showConfirmNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <button type="submit" className="btn" disabled={passwordBusy}>
                {passwordBusy ? "Changing..." : "Change password"}
              </button>
            </div>

            <p style={{ marginTop: "0.85rem", marginBottom: 0, textAlign: "center" }}>
              <Link to="/forgot-password">Forgot password?</Link>
            </p>
          </form>
        </div>
      )}
    </div>
  );
}