import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCats } from "../context/CatContext.jsx";

function formatWhen(d) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function categoryLabel(c) {
  const map = { feeding: "Fed", water: "Water", litter: "Litter", vet: "Vet" };
  return map[c] || c;
}

/** Landing page for guests  */
function HomeLanding() {
  return (
    <div className="page">
      <div style={{ marginLeft: "100px" }}>
        <h1 style={{ marginBottom: "0.35rem" }}>PurrCare</h1>
        <p
          className="lede"
          style={{ marginTop: 0, marginBottom: "1.25rem", maxWidth: "700px" }}
        >
          Help for cat owners: track feeding, water, litter, and vet visits; learn about safe foods;
          and chat about behavior. Sign in to manage your cats, or create an account to get started.
        </p>
      </div>

      <div
        className="grid-2"
        style={{
          gap: "0.8rem",
          justifyContent: "center",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <div
          className="card"
          style={{
            background: "rgba(247, 244, 255, 0.96)",
            border: "1px solid #8f79c9",
            boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
          }}
        >
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontSize: "1.2rem", textAlign: "center" }}>
            What you can do
          </h2>
          <ul>
            <li>Log meals, water changes, and litter maintenance</li>
            <li>Schedule and record vet visits</li>
            <li>Browse the food and care guide</li>
            <li>Use the behavior chatbot (general guidance only)</li>
          </ul>
        </div>

        <div
          className="card"
          style={{
            background: "rgba(247, 244, 255, 0.96)",
            border: "1px solid #8f79c9",
            boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
            maxWidth: "380px",
            margin: "0 auto",
            padding: "1.2rem",
          }}
        >
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontSize: "1.1rem", textAlign: "center" }}>
            Get started
          </h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Cat profiles and care logs require a account.
          </p>
          <div className="row" style={{ marginTop: "1rem", gap: "3.5rem", justifyContent: "center" }}>
            <Link to="/login" className="btn">
              Log in
            </Link>
            <Link to="/signup" className="btn secondary">
              Sign up
            </Link>
          </div>
          <p className="muted" style={{ marginTop: "1rem", marginBottom: 0, fontSize: "0.9rem" }}>
            <Link to="/food">Food guide</Link>
            {" · "}
            <Link to="/chat">Chatbot</Link> — available without signin.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Dashboard for signed-in users */
function HomeDashboard({ user }) {
  const { cats, loading: catsLoading, error: catsError } = useCats();
  const [dash, setDash] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await api.dashboard();
        if (!cancelled) setDash(d);
      } catch (e) {
        if (!cancelled) setErr(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, cats.length, cats.map((c) => c._id).join(",")]);

  return (
    <div className="page">
      <h1
        style={{
          marginBottom: "0.35rem",
          textAlign: "center",
        }}
      >
        Welcome, {user.fullName}
      </h1>
      <p
        className="lede"
        style={{
          marginTop: 0,
          marginBottom: "1.25rem",
          maxWidth: "700px",
          textAlign: "center",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        Track feeding and water, litter hygiene, vet visits, and learn what foods support a healthy
        cat. Use the chatbot for behavior related queries.
      </p>

      {(err || catsError) && <div className="alert error">{err || catsError}</div>}

      <div
        className="grid-2"
        style={{
          gap: "0.8rem",
          justifyContent: "center",
          maxWidth: "860px",
          margin: "0 auto",
        }}
      >
        <div
          className="card"
          style={{
            background: "rgba(247, 244, 255, 0.96)",
            border: "1px solid #8f79c9",
            boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
            maxWidth: "380px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontSize: "1.2rem", textAlign: "center" }}>
            Your cats
          </h2>
          {catsLoading ? (
            <p className="muted">Loading…</p>
          ) : cats.length === 0 ? (
            <p className="muted">
              No profiles yet.{" "}
              <Link to="/cats">Add your first cat</Link> — use your registered full name (
              <strong>{user.fullName}</strong>) as owner name.
            </p>
          ) : (
            <ul className="list-plain">
              {cats.map((c) => (
                <li key={c._id}>
                  <strong style={{ color: "#24143f" }}>{c.name}</strong>
                  {c.breed ? <span className="muted"> · {c.breed}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className="card"
          style={{
            background: "rgba(247, 244, 255, 0.96)",
            border: "1px solid #8f79c9",
            boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
            maxWidth: "380px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontSize: "1.2rem", textAlign: "center" }}>
            Quick links
          </h2>
          <ul className="list-plain">
            <li>
              <Link to="/daily-care" style={{ color: "#4f239e", fontWeight: 600 }}>
                Log feeding, water, or litter
              </Link>
            </li>
            <li>
              <Link to="/vet-appointments" style={{ color: "#4f239e", fontWeight: 600 }}>
                Plan a veterinary visit
              </Link>
            </li>
            <li>
              <Link to="/medical-records" style={{ color: "#4f239e", fontWeight: 600 }}>
                View medical records
              </Link>
            </li>
            <li>
              <Link to="/food" style={{ color: "#4f239e", fontWeight: 600 }}>
                Food safety guide
              </Link>
            </li>
            <li>
              <Link to="/chat" style={{ color: "#4f239e", fontWeight: 600 }}>
                Behavior chatbot
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {dash && (
        <>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.25rem",
              marginTop: "2rem",
              marginBottom: "0.75rem",
              textAlign: "center",
            }}
          >
            Last 24 hours
          </h2>
          <div
            className="card"
            style={{
              background: "rgba(247, 244, 255, 0.96)",
              border: "1px solid #8f79c9",
              boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
              maxWidth: "620px",
              margin: "0 auto",
              fontSize: "1.02rem",
              lineHeight: "1.65",
            }}
          >
            {dash.recentLogs?.length ? (
              <ul className="list-plain">
                {dash.recentLogs.slice(0, 12).map((log) => (
                  <li key={log._id} style={{ marginBottom: "0.7rem" }}>
                    <span className={`badge ${log.category}`}>{categoryLabel(log.category)}</span>{" "}
                    <strong style={{ fontSize: "1.02rem" }}>{log.cat?.name || "Cat"}</strong>
                    <span className="muted" style={{ fontSize: "0.96rem" }}>
                      {" "}· {formatWhen(log.completedAt)}
                    </span>
                    {log.title ? <div className="muted" style={{ fontSize: "0.96rem" }}>{log.title}</div> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted" style={{ margin: 0, fontSize: "1rem" }}>
                No care logs in the last day. Visit <Link to="/daily-care">Care tracker</Link> to log a
                meal or water change.
              </p>
            )}
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.25rem",
              marginTop: "1.5rem",
              marginBottom: "0.75rem",
              textAlign: "center",
            }}
          >
            Upcoming vet appointments
          </h2>
          <div
            className="card"
            style={{
              background: "rgba(247, 244, 255, 0.96)",
              border: "1px solid #8f79c9",
              boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
              maxWidth: "620px",
              margin: "0 auto",
            }}
          >
            {dash.upcomingVet?.length ? (
              <ul className="list-plain">
                {dash.upcomingVet.map((log) => (
                  <li key={log._id}>
                    <strong>{log.cat?.name || "Cat"}</strong>
                    <span className="muted"> · scheduled {formatWhen(log.scheduledFor)}</span>
                    {log.vetClinic ? <div className="muted">{log.vetClinic}</div> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                No upcoming appointments on file. Add one on the{" "}
                <Link to="/vet-appointments">Vet tracker</Link> page.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function Home() {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div className="page">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <HomeLanding />;
  }

  return <HomeDashboard user={user} />;
}