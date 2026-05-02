import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import CatPicker from "../components/CatPicker.jsx";
import { useCats } from "../context/CatContext.jsx";

function formatWhen(d) {
  return new Date(d).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const SLEEP_OPTIONS = [
  "Less than 6 hours",
  "6 to 8 hours",
  "8 to 10 hours",
  "10 to 12 hours",
  "12 to 14 hours",
  "14 to 16 hours",
  "16 to 18 hours",
  "More than 18 hours",
];

export default function BehaviorTracker() {
  const { selectedCatId, cats } = useCats();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [moodType, setMoodType] = useState("");
  const [sleepHours, setSleepHours] = useState("");

  const selected = cats.find((c) => c._id === selectedCatId);

  const load = useCallback(async () => {
    if (!selectedCatId) {
      setLogs([]);
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const data = await api.listLogs(selectedCatId);
      const behaviorOnly = data.filter((l) => ["mood", "sleep"].includes(l.category));
      setLogs(behaviorOnly);
    } catch (e) {
      setErr(e?.message || "Something went wrong while loading logs.");
    } finally {
      setLoading(false);
    }
  }, [selectedCatId]);

  useEffect(() => {
    load();
  }, [load]);

  async function logCare(category, extra = {}) {
    if (!selectedCatId) return;
    setErr(null);

    try {
      await api.createLog(selectedCatId, {
        category,
        completedAt: new Date().toISOString(),
        ...extra,
      });
      await load();
    } catch (e) {
      setErr(e?.message || "Could not save behavior log.");
    }
  }

  async function removeLog(id) {
    try {
      await api.deleteLog(id);
      await load();
    } catch (e) {
      setErr(e?.message || "Could not remove behavior log.");
    }
  }

  function handleSleepLog() {
  if (!sleepHours) {
    setErr("Please select sleep hours.");
    return;
  }

  logCare("sleep", {
    title: `Sleep: ${sleepHours}`,
    sleepHoursLogged: sleepHours,
    notes: "",
  });

  setSleepHours("");
}

  function handleMoodLog() {
    logCare("mood", {
      title: `Mood: ${moodType.replace(/_/g, " ")}`,
      mood: moodType,
      notes: "",
    });

    setMoodType("normal");
  }

  const moodCount = useMemo(
    () => logs.filter((l) => l.category === "mood").length,
    [logs]
  );

  const sleepCount = useMemo(
    () => logs.filter((l) => l.category === "sleep").length,
    [logs]
  );

  const canLogSleep = Boolean(sleepHours);
  const canLogMood = Boolean(moodType);

  return (
    <div className="page">
      <div
  style={{
    textAlign: "center",
    maxWidth: "600px",
    margin: "0 auto 1.2rem",
  }}
>
  <h1>Behavior tracker</h1>
  <p style={{ textAlign: "center", color: "var(--muted)" }}>
    Record mood, behavior, and sleep notes to understand your cat’s daily patterns.
  </p>
</div>

      {err && <div className="alert error">{err}</div>}

      <div
        className="card"
        style={{
          marginBottom: "1rem",
          maxWidth: "580px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <CatPicker />
        {selected ? (
          <div className="muted" style={{ marginTop: "0.75rem", textAlign: "center" }}>
            {selected.sleepHours ? (
              <div>
                <strong style={{ color: "var(--ink)" }}>From profile:</strong> Sleep target:{" "}
                {selected.sleepHours}
              </div>
            ) : (
              <div>
                <strong style={{ color: "var(--ink)" }}>From profile:</strong> Add sleep routine in
                Cat Profiles for better tracking.
              </div>
            )}
          </div>
        ) : null}
      </div>

      {selectedCatId && (
        <>
          <div className="grid-2" 
          style={{ maxWidth: "720px",
              margin: "0 auto",
              gap: "0.9rem", }}>
            <div className="card">
              <h2 style={{ marginTop: 0, fontSize: "1.1rem", textAlign: "center"}}>Behavior snapshot</h2>
              <p style={{ marginBottom: "0.45rem" }}>
                Mood logs: <strong>{moodCount}</strong>
              </p>
              <p style={{ marginBottom: 0 }}>
                Sleep logs: <strong>{sleepCount}</strong>
              </p>
            </div>

            <div className="card">
              <h2 style={{ marginTop: 0, fontSize: "1.1rem", textAlign: "center" }}>Why this matters</h2>
              <p className="muted" style={{ margin: 0 }}>
                Repeated mood and sleep logs help you notice changes early and understand patterns
                before they become bigger health issues.
              </p>
            </div>
          </div>

          <div
            className="grid-2"
            style={{
              maxWidth: "720px",
              margin: "0 auto",
              gap: "0.9rem",
            }}
          >
            <div
              className="card"
              style={{
                minHeight: "260px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2 style={{ marginTop: 0, fontSize: "1.1rem", textAlign: "center" }}>Sleep</h2>
                <label htmlFor="sleep-hours">Sleep hours</label>
<select
  id="sleep-hours"
  value={sleepHours}
  onChange={(e) => setSleepHours(e.target.value)}
  style={{ marginTop: "0.35rem" }}
>
  <option value="">— Select —</option>
  {SLEEP_OPTIONS.map((opt) => (
    <option key={opt} value={opt}>
      {opt}
    </option>
  ))}
</select>
              </div>

              <button
  type="button"
  className="btn"
  onClick={handleSleepLog}
  disabled={!canLogSleep}
  style={{ alignSelf: "center" }}
>
  Log sleep
</button>
            </div>

            <div
              className="card"
              style={{
                minHeight: "260px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2 style={{ marginTop: 0, fontSize: "1.1rem", textAlign: "center" }}>Mood / behavior</h2>
                <label htmlFor="mood-type">Mood</label>
                <select
  id="mood-type"
  value={moodType}
  onChange={(e) => setMoodType(e.target.value)}
  style={{ marginTop: "0.35rem" }}
>
  <option value="">— Select —</option>
  <option value="normal">Normal</option>
  <option value="playful">Playful</option>
  <option value="sleepy">Sleepy</option>
  <option value="restless">Restless</option>
  <option value="hiding">Hiding</option>
  <option value="not_eating_well">Not eating well</option>
</select>
              </div>

              <button
  type="button"
  className="btn"
  onClick={handleMoodLog}
  disabled={!canLogMood}
  style={{ alignSelf: "center" }}
>
  Log mood
</button>
            </div>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.2rem",
              marginTop: "1.75rem",
              marginBottom: "0.65rem",
              textAlign: "center",
            }}
          >
            Recent behavior history
          </h2>
          <div
            className="card"
            style={{
              maxWidth: "580px",
              margin: "0 auto",
            }}
          >
            {loading ? (
              <p className="muted">Loading logs…</p>
            ) : !logs.length ? (
              <p className="muted" style={{ margin: 0 }}>
                No mood or sleep logs yet for this cat.
              </p>
            ) : (
              <ul className="list-plain">
                {logs.map((log) => (
  <li key={log._id}>
    <div
      className="row"
      style={{
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        gap: "1rem",
      }}
    >
      <div
        style={{
          flex: 1,
          textAlign: "center",
        }}
      >
        {/* badge + date */}
        <div>
          <span className={`badge ${log.category}`}>{log.category}</span>{" "}
          <span className="muted">{formatWhen(log.completedAt)}</span>
        </div>

        {/* title */}
        {log.title ? (
          <div style={{ fontWeight: "400" }}>{log.title}</div>
        ) : null}

        {/* mood */}
        {!log.title && log.mood ? (
          <div className="muted">
            Mood: {log.mood.replace(/_/g, " ")}
          </div>
        ) : null}

        {/* sleep */}
        {!log.title && log.sleepHoursLogged ? (
          <div className="muted">
            Sleep: {log.sleepHoursLogged}
          </div>
        ) : null}
      </div>

      {/* REMOVE BUTTON  */}
      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => removeLog(log._id)}
                        style={{
                          color: "#5b2db8",
                          border: "1px solid #cdb7ff",
                          background: "#f7f1ff",
                        }}
                      >
                        Remove
                      </button>
    </div>
  </li>
))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}