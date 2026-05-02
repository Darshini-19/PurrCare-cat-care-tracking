import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCats } from "../context/CatContext.jsx";

export default function CatPicker({ label = "Cat" }) {
  const { user, ready } = useAuth();
  const { cats, selectedCat, loading } = useCats();

  if (!ready) return <p className="muted">Loading…</p>;

  if (!user) {
    return (
      <div className="alert">
        <Link to="/login">Sign in</Link> to manage cats.
      </div>
    );
  }

  if (loading) return <p className="muted">Loading cats…</p>;

  if (!cats.length) {
    return (
      <div className="alert">
        Add a cat on the <strong>Cat profiles</strong> page first.
      </div>
    );
  }

  if (!selectedCat) {
    return (
      <div className="alert">
        No cat selected. Open <strong>Cat profiles</strong> and choose one cat profile first.
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "1.2rem", fontWeight: "600", color: "var(--ink)" }}>{label}</label>
      <div
        className="card"
        style={{
          padding: "0.9rem 0.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          boxShadow: "none",
          marginTop: "0.2rem",
          maxWidth: "350px",
          marginRight: "auto",
          marginLeft: "auto",
        }}
      >
        {selectedCat.photoData || selectedCat.photoUrl ? (
          <img
            src={selectedCat.photoData || selectedCat.photoUrl}
            alt={selectedCat.name}
            style={{
              width: 90,
              height: 90,
              borderRadius: "16px",
              objectFit: "cover",
              border: "1px solid var(--line)",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 25,
              height: 25,
              borderRadius: "12px",
              display: "grid",
              placeItems: "center",
              background: "var(--surface-2)",
              border: "1px solid var(--line)",
              fontSize: "1.3rem",
              flexShrink: 0,
            }}
          >
            🐱
          </div>
        )}

        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>{selectedCat.name}</div>
          <div className="muted" style={{ fontSize: "0.85rem" }}>
            {[selectedCat.breed, selectedCat.gender, selectedCat.ageCategory]
              .filter(Boolean)
              .join(" · ") || "Selected cat profile"}
          </div>
        </div>
      </div>
    </div>
  );
}