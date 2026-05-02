import { Link, NavLink } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext.jsx";
import { CatProvider, useCats } from "../context/CatContext.jsx";
import homeImg from "../assets/images/home1.png";

const navAuthed = [
  { to: "/", label: "Home" },
  { to: "/cats", label: "Cat profiles" },
  { to: "/daily-care", label: "Daily care" },
  { to: "/behavior", label: "Behavior" },
  { to: "/insights", label: "Insights" },
  { to: "/vet-appointments", label: "Vet appointments" },
  { to: "/medical-records", label: "Medical records" },
  { to: "/food", label: "Food guide" },
  { to: "/chat", label: "Chatbot" },
];

const navGuest = [
  { to: "/", label: "Home" },
  { to: "/food", label: "Food guide" },
  { to: "/chat", label: "Chatbot" },
];

function SidebarUserCard() {
  const { user, ready } = useAuth();

  if (!ready) {
    return <div className="sidebar-user-card muted-block">Loading user…</div>;
  }

  if (!user) {
  return (
    <div className="sidebar-user-card">
      <div className="sidebar-avatar">👤</div>
      <div>
        <div className="sidebar-user-title">Guest</div>
        <div className="sidebar-user-subtitle">Sign in to manage your cats</div>
      </div>
    </div>
  );
}
  return (
  <Link
    to="/profile"
    className="sidebar-user-card sidebar-user-card-link"
    style={{ textDecoration: "none" }}
  >
    <div className="sidebar-avatar">
      {user.photoUrl ? (
        <img
          src={user.photoUrl}
          alt="profile"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "14px",
          }}
        />
      ) : (
        "👤"
      )}
    </div>
    <div style={{ minWidth: 0 }}>
      <div className="sidebar-user-title">{user.fullName}</div>
      <div className="sidebar-user-subtitle">User profile</div>
    </div>
  </Link>
);
}

function CatProfilePanel() {
  const { user } = useAuth();
  const { selectedCat, clearSelectedCat } = useCats();

  if (!user || !selectedCat) {
    return (
      <div className="cat-profile-panel empty">
        <div className="cat-profile-empty">No cat selected</div>
      </div>
    );
  }

  const photoSrc = selectedCat.photoData || selectedCat.photoUrl || "";

  return (
    <div className="cat-profile-panel">
      <div className="cat-profile-main">
        {photoSrc ? (
          <img src={photoSrc} alt={selectedCat.name} className="cat-profile-photo" />
        ) : (
          <div className="cat-profile-placeholder">🐱</div>
        )}

        <div className="cat-profile-info">
          <div className="cat-profile-name">{selectedCat.name}</div>
          <div className="cat-profile-meta">
            {[selectedCat.breed, selectedCat.gender].filter(Boolean).join(" · ") || "Cat profile"}
          </div>
        </div>
      </div>

      <div className="cat-profile-actions">
        <Link
          to="/cats"
          className="btn secondary btn-sm cat-action-btn"
          style={{ textDecoration: "none" }}
        >
          Open profile
        </Link>
        <button
          type="button"
          className="btn ghost btn-sm cat-action-btn"
          onClick={clearSelectedCat}
        >
          Cat logout
        </button>
      </div>
    </div>
  );
}

function SidebarFooter() {
  const { user, ready, logout } = useAuth();

  if (!ready) return null;

  if (!user) {
    return (
      <div className="sidebar-footer">
        <Link to="/login" className="sidebar-auth-link sidebar-footer-btn">
          Log in
        </Link>
        <Link
          to="/signup"
          className="btn btn-sm sidebar-footer-btn"
          style={{ textDecoration: "none" }}
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="sidebar-footer">
      <button
        type="button"
        className="btn danger sidebar-logout-btn sidebar-footer-btn"
        onClick={logout}
      >
        Log out
      </button>
    </div>
  );
}

function Shell({ children }) {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <SidebarUserCard />
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          {(user ? navAuthed : navGuest).map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <SidebarFooter />
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left-card" />

          <div className="topbar-center">
            <Link to="/" className="center-brand-card">
  <img src={homeImg} alt="PurrCare" className="center-brand-image" />

  <div className="center-brand-copy">
    <div className="center-brand-text">PurrCare</div>
    <div className="center-brand-tagline">
      Care for your cat, track routines, <br/> and understand behavior — all in one place.
    </div>
  </div>
</Link>
          </div>

          <div className="topbar-right">
            <CatProfilePanel />
          </div>
        </header>
        <div className="topbar-divider"></div>
        <main className="page-content">{children}</main>

        <footer className="site-footer">
          <p>PurrCare — daily care, vet visits, and gentle guidance for your cat.</p>
        </footer>
      </div>

      <style>{`
        .app-shell {
          min-height: 100vh;
          display: flex;
          background: #b39df0;
        }

        .sidebar {
          width: 250px;
          min-width: 250px;
          background: #f7f4ff;
          border-right: 1px solid #8f79c9;
          display: flex;
          flex-direction: column;
          padding: 1rem 0.9rem;
          position: sticky;
          top: 0;
          height: 100vh;
          box-sizing: border-box;
        }

        .sidebar-top {
          margin-bottom: 1rem;
        }

        .sidebar-user-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem;
          border: 1px solid #8f79c9;
          border-radius: 14px;
          background: #ece4ff;
        }

        .sidebar-user-card-link {
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.sidebar-user-card-link:hover {
  background: #e4d8ff;
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(60, 34, 112, 0.12);
}

        .muted-block {
          color: #5f4b8a;
          font-size: 0.9rem;
        }

        .sidebar-avatar {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: #5b2db8;
          color: white;
          display: grid;
          place-items: center;
          font-size: 1.1rem;
          flex-shrink: 0;
          overflow: hidden;
        }

        .sidebar-user-title {
          font-weight: 700;
          color: #24143f;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-user-subtitle {
          font-size: 0.82rem;
          color: #5f4d8a;
          margin-top: 0.15rem;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          margin-bottom: auto;
          overflow-y: auto;
          padding-right: 0.1rem;
        }

        .sidebar-link {
          display: block;
          text-decoration: none;
          color: #5f4b8a;
          font-weight: 600;
          font-size: 0.92rem;
          padding: 0.8rem 0.9rem;
          border-radius: 14px;
          transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }

        .sidebar-link:hover {
          background: #ece4ff;
          color: #24143f;
          text-decoration: none;
          transform: translateX(2px);
        }

        .sidebar-link-active {
          background: #5b2db8;
          color: white;
        }

        .sidebar-footer {
          padding-top: 1rem;
          border-top: 1px solid #8f79c9;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          align-items: center;
          justify-content: center;
        }

        .sidebar-footer-btn {
          width: 100%;
          text-align: center;
          justify-content: center;
          border-radius: 14px !important;
          display: inline-flex;
          align-items: center;
        }

        .sidebar-auth-link {
          text-decoration: none;
          color: #24143f;
          font-weight: 600;
          padding: 0.7rem 0.85rem;
          background: #ece4ff;
          border: 1px solid #8f79c9;
        }

        .sidebar-auth-link:hover {
          text-decoration: none;
        }

        .sidebar-logout-btn {
          width: 100%;
        }

        .main-shell {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .topbar {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: start;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: transparent;
        }

        .topbar-left-card {
          min-height: 88px;
          width: 100%;
        }

        .topbar-center {
          display: flex;
          justify-content: center;
          align-items: center;
          justify-self: center;
          transform: translateX(-100px);
        }

        .topbar-divider {
  height: 1.2px;
  width: 100%;
  background: linear-gradient(to right, transparent, #24143f, transparent);
  opacity: 0.5;
  
}

        .center-brand-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  text-decoration: none;
  position: relative;
  width: max-content;
}

        .center-brand-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 300px;
}

        .center-brand-card:hover {
          text-decoration: none;
          background: transparent;
        }

        .center-brand-image {
  width: 180px;
  height: 180px;
  object-fit: contain;
  flex-shrink: 0;
  display: block;
}

        .center-brand-text {
          color: #24143f;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 4rem;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .center-brand-tagline {
  font-size: 0.95rem;
  color: #5f4b8a;
  margin-top: 8px;
  font-weight: 500;
  text-align: center;
  max-width: 420px;
  line-height: 1.45;
}
        

        .topbar-right {
          display: flex;
          justify-content: flex-end;
          align-items: stretch;
          min-width: 0;
          width: 100%;
          justify-self: end;
        }

        .cat-profile-panel {
          width: 250px;
          max-width: 250px;
          min-height: 88px;
          background: #ece4ff;
          border: 1px solid #8f79c9;
          border-radius: 14px;
          padding: 0.75rem;
          box-sizing: border-box;
          box-shadow: 0 8px 18px rgba(60, 34, 112, 0.08);
        }

        .cat-profile-panel.empty {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cat-profile-empty {
          color: #5f4b8a;
          font-size: 0.9rem;
          font-weight: 600;
          text-align: center;
        }

        .cat-profile-main {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .cat-profile-photo,
        .cat-profile-placeholder {
          width: 60px;
          height: 60px;
          border-radius: 14px;
          object-fit: cover;
          border: 1px solid #8f79c9;
          flex-shrink: 0;
        }

        .cat-profile-placeholder {
          display: grid;
          place-items: center;
          background: #f7f4ff;
          font-size: 1.3rem;
        }

        .cat-profile-info {
          min-width: 0;
          flex: 1;
        }

        .cat-profile-name {
          font-weight: 700;
          color: #24143f;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cat-profile-meta {
          font-size: 0.90rem;
          color: #5f4b8a;
          margin-top: 0.2rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cat-profile-actions {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.7rem;
          flex-wrap: wrap;
        }

        .cat-action-btn {
          border-radius: 14px !important;
        }

        .page-content {
          flex: 1;
          padding: 1.25rem;
        }

        .site-footer {
          padding: 1rem 1.25rem 1.25rem;
          text-align: center;
          font-size: 0.82rem;
          color: #5f4b8a;
          border-top: 1px solid #8f79c9;
          background: #f7f4ff;
        }

        .site-footer p {
          margin: 0;
        }

        @media (max-width: 1200px) {
          .topbar {
            grid-template-columns: 1fr;
          }

          .topbar-left-card {
            display: none;
          }

          .topbar-center {
            justify-content: flex-start;
          }

          .topbar-right {
            justify-content: flex-start;
          }

          .cat-profile-panel {
            max-width: 420px;
          }

          .center-brand-text {
            font-size: 2rem;
          }

          .center-brand-image {
            width: 68px;
            height: 68px;
          }
        }

        @media (max-width: 900px) {
          .app-shell {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            min-width: 0;
            height: auto;
            position: relative;
            border-right: 0;
            border-bottom: 1px solid #8f79c9;
          }

          .sidebar-nav {
            max-height: none;
          }

          .cat-profile-panel {
            max-width: none;
            width: 100%;
          }

          .center-brand-text {
            font-size: 1.9rem;
          }

          .center-brand-image {
            width: 62px;
            height: 62px;
          }
        }
      `}</style>
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <AuthProvider>
      <CatProvider>
        <Shell>{children}</Shell>
      </CatProvider>
    </AuthProvider>
  );
}