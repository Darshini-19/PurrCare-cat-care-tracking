import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import CatPicker from "../components/CatPicker.jsx";
import { useCats } from "../context/CatContext.jsx";

function isToday(dateString) {
  if (!dateString) return false;
  const d = new Date(dateString);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function formatWhen(d) {
  return new Date(d).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getExpectedFeedingCount(cat) {
  const text = String(cat?.foodIntake || cat?.feedingScheduleNotes || "")
    .toLowerCase()
    .trim();

  if (
    text.includes("4 times") ||
    text.includes("four times") ||
    text.includes("4x") ||
    text.includes("4 meals") ||
    text.includes("4 feeds") ||
    text.includes("4 per day")
  ) {
    return 4;
  }

  if (
    text.includes("3 times") ||
    text.includes("three times") ||
    text.includes("3x") ||
    text.includes("thrice") ||
    text.includes("3 meals") ||
    text.includes("3 feeds") ||
    text.includes("3x daily") ||
    text.includes("3 per day")
  ) {
    return 3;
  }

  if (
    text.includes("2 times") ||
    text.includes("two times") ||
    text.includes("2x") ||
    text.includes("twice") ||
    text.includes("2 meals") ||
    text.includes("2 feeds") ||
    text.includes("2x daily") ||
    text.includes("2 per day")
  ) {
    return 2;
  }

  if (
    text.includes("1 time") ||
    text.includes("once") ||
    text.includes("once daily") ||
    text.includes("1x") ||
    text.includes("1 meal") ||
    text.includes("1 feed") ||
    text.includes("1 per day")
  ) {
    return 1;
  }

  const match = text.match(/\b([1-4])\b/);
  if (match) return Number(match[1]);

  return 1;
}

function timeToMinutes(timeStr) {
  if (!timeStr || !String(timeStr).includes(":")) return null;
  const [hh, mm] = String(timeStr).split(":").map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

function isLogNearScheduledTime(logs, timeStr, windowMinutes = 90) {
  const scheduledMinutes = timeToMinutes(timeStr);
  if (scheduledMinutes == null) return false;

  return logs.some((log) => {
    if (!log?.completedAt || !isToday(log.completedAt)) return false;
    const d = new Date(log.completedAt);
    const logMinutes = d.getHours() * 60 + d.getMinutes();
    return Math.abs(logMinutes - scheduledMinutes) <= windowMinutes;
  });
}

function currentTimeHHMM() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function canUseNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

function sendBrowserNotification(title, body) {
  if (!canUseNotifications()) return;
  if (Notification.permission !== "granted") return;
  new Notification(title, { body });
}

export default function DailyCare() {
  const { selectedCatId, cats } = useCats();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [feedingTitle, setFeedingTitle] = useState("");
  const [waterBowlCleaned, setWaterBowlCleaned] = useState(false);
  const [waterChanged, setWaterChanged] = useState(false);
  const [litterAction, setLitterAction] = useState("scoop");
  const [litterNotes, setLitterNotes] = useState("");
  const [litterFeedback, setLitterFeedback] = useState("");

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
      const careOnly = data.filter((l) => ["feeding", "water", "litter"].includes(l.category));
      setLogs(careOnly);
    } catch (e) {
      setErr(e?.message || "Something went wrong while loading logs.");
    } finally {
      setLoading(false);
    }
  }, [selectedCatId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!canUseNotifications()) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

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
      setErr(e?.message || "Could not save care log.");
    }
  }

  async function removeLog(id) {
    try {
      await api.deleteLog(id);
      await load();
    } catch (e) {
      setErr(e?.message || "Could not remove care log.");
    }
  }

  const todayLogs = useMemo(() => logs.filter((l) => isToday(l.completedAt)), [logs]);
  const todayFeedingLogs = todayLogs.filter((l) => l.category === "feeding");
  const todayWaterLogs = todayLogs.filter((l) => l.category === "water");
  const todayLitterLogs = todayLogs.filter((l) => l.category === "litter");

  const expectedFeedingCount = useMemo(() => getExpectedFeedingCount(selected), [selected]);
  const feedingCompletedToday = Math.min(todayFeedingLogs.length, expectedFeedingCount);
  const totalTasks = expectedFeedingCount + 1 + 1;

  const completedTasks =
    feedingCompletedToday +
    (todayWaterLogs.length > 0 ? 1 : 0) +
    (todayLitterLogs.length > 0 ? 1 : 0);

  const dailyProgress = Math.round((completedTasks / totalTasks) * 100);

  const feedingTimes = useMemo(() => {
    const allTimes = [
      selected?.feedingTime1 || "",
      selected?.feedingTime2 || "",
      selected?.feedingTime3 || "",
      selected?.feedingTime4 || "",
    ].filter(Boolean);

    return allTimes.slice(0, expectedFeedingCount);
  }, [selected, expectedFeedingCount]);

  const waterReminderTime = selected?.waterReminderTime || "";
  const litterReminderTime = selected?.litterReminderTime || "";

  useEffect(() => {
    if (!selectedCatId || !selected) return;
    if (!canUseNotifications()) return;
    if (Notification.permission !== "granted") return;

    const checkReminders = () => {
      const current = currentTimeHHMM();
      const todayKey = new Date().toISOString().slice(0, 10);

      feedingTimes.forEach((time, index) => {
        if (time !== current) return;

        const alreadyLogged = isLogNearScheduledTime(todayFeedingLogs, time, 90);
        const notifyKey = `feed-${selectedCatId}-${todayKey}-${time}`;

        if (!alreadyLogged && !sessionStorage.getItem(notifyKey)) {
          sendBrowserNotification(
            "PurrCare feeding reminder",
            `${selected.name || "Your cat"} feeding ${index + 1} is scheduled now (${time}).`
          );
          sessionStorage.setItem(notifyKey, "1");
        }
      });

      if (waterReminderTime === current) {
        const alreadyLogged = isLogNearScheduledTime(todayWaterLogs, waterReminderTime, 180);
        const notifyKey = `water-${selectedCatId}-${todayKey}-${waterReminderTime}`;

        if (!alreadyLogged && !sessionStorage.getItem(notifyKey)) {
          sendBrowserNotification(
            "PurrCare water reminder",
            `${selected.name || "Your cat"} water refresh is scheduled now (${waterReminderTime}).`
          );
          sessionStorage.setItem(notifyKey, "1");
        }
      }

      if (litterReminderTime === current) {
        const alreadyLogged = isLogNearScheduledTime(todayLitterLogs, litterReminderTime, 180);
        const notifyKey = `litter-${selectedCatId}-${todayKey}-${litterReminderTime}`;

        if (!alreadyLogged && !sessionStorage.getItem(notifyKey)) {
          sendBrowserNotification(
            "PurrCare litter reminder",
            `${selected.name || "Your cat"} litter cleaning is scheduled now (${litterReminderTime}).`
          );
          sessionStorage.setItem(notifyKey, "1");
        }
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 30000);

    return () => clearInterval(interval);
  }, [
    selectedCatId,
    selected,
    feedingTimes,
    waterReminderTime,
    litterReminderTime,
    todayFeedingLogs,
    todayWaterLogs,
    todayLitterLogs,
  ]);

  const canLogFeeding = Boolean(feedingTitle.trim());
  const canLogWater = waterBowlCleaned || waterChanged;
  const canLogLitter = Boolean(litterNotes);

  function handleFeedingLog() {
    if (!canLogFeeding) {
      setErr("Please enter a meal label before logging feeding.");
      return;
    }

    logCare("feeding", {
      title: feedingTitle,
    });

    setFeedingTitle("");
  }

  function handleWaterLog() {
    if (!canLogWater) {
      setErr("Please select at least one water update before logging.");
      return;
    }

    const notes = [
      waterBowlCleaned ? "Bowl cleaned" : "",
      waterChanged ? "Water changed" : "",
    ]
      .filter(Boolean)
      .join(", ");

    logCare("water", { notes });

    setWaterBowlCleaned(false);
    setWaterChanged(false);
  }

  function handleLitterLog() {
    if (!canLogLitter) {
      setErr("Please choose litter condition before logging litter maintenance.");
      return;
    }

    logCare("litter", {
      litterAction,
      notes: litterNotes,
    });

    setLitterNotes("");
    setLitterFeedback("");
  }

  return (
    <div className="page">
      <div style={{ textAlign: "center", margin: "0 auto 1.2rem" }}>
  <h1>Daily care</h1>
  <p style={{textAlign: "center", color: "var(--muted)"}}>
    Log feeding, water refresh, and litter maintenance for your cat’s daily routine.
  </p>
</div>

      {err && <div className="alert error">{err}</div>}

      <div
        className="card"
        style={{
          marginBottom: "1rem",
          background: "rgba(247, 244, 255, 0.92)",
          border: "1px solid #8f79c9",
          boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
          maxWidth: "620px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <CatPicker />
        {selected ? (
          <div
            className="muted"
            style={{ marginTop: "0.75rem", marginBottom: 0, fontSize: "1.0rem", lineHeight: 1.5, textAlign: "left",
    maxWidth: "235px",
    marginLeft: "auto",
    marginRight: "auto",}}
          >
            <strong style={{ color: "var(--ink)" }}>From profile:</strong>
            <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.2rem" }}>
              {selected.foodIntake ? <li>Food: {selected.foodIntake}</li> : null}
              {!selected.foodIntake && selected.feedingScheduleNotes ? (
                <li>Food: {selected.feedingScheduleNotes}</li>
              ) : null}
              {feedingTimes.length
                ? feedingTimes.map((time, index) => (
                    <li key={`${time}-${index}`}>Feeding time {index + 1}: {time}</li>
                  ))
                : null}
              {selected.waterChangePeriod ? <li>Water changes: {selected.waterChangePeriod}</li> : null}
              {waterReminderTime ? <li>Water reminder time: {waterReminderTime}</li> : null}
              {selected.litterChangePeriod ? <li>Litter: {selected.litterChangePeriod}</li> : null}
              {litterReminderTime ? <li>Litter reminder time: {litterReminderTime}</li> : null}
            </ul>
          </div>
        ) : null}
      </div>

      {selectedCatId && (
        <>
          <div
            className="grid-2"
            style={{
              marginBottom: "1rem",
              alignItems: "stretch",
              gridAutoRows: "1fr",
              maxWidth: "700px",
              marginLeft: "auto",
              marginRight: "auto",
              gap: "0.8rem",
            }}
          >
            <div
              className="card"
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: "rgba(247, 244, 255, 0.96)",
                border: "1px solid #8f79c9",
                boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
                maxWidth: "340px",
                width: "100%",
                margin: "0 auto",
              }}
            >
              <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontSize: "1.1rem", textAlign: "center" }}>
                Today status
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <p style={{ marginBottom: "0.2rem" }}>
                  Feeding:{" "}
                  <strong>
                    {todayFeedingLogs.length
                      ? `${feedingCompletedToday}/${expectedFeedingCount} done`
                      : `Pending (0/${expectedFeedingCount})`}
                  </strong>
                </p>
                <p style={{ marginBottom: "0.2rem" }}>
                  Water: <strong>{todayWaterLogs.length ? "Done" : "Pending"}</strong>
                </p>
                <p style={{ marginBottom: 0 }}>
                  Litter: <strong>{todayLitterLogs.length ? "Done" : "Pending"}</strong>
                </p>
              </div>
            </div>

            <div
              className="card"
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: "rgba(247, 244, 255, 0.96)",
                border: "1px solid #8f79c9",
                boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
                maxWidth: "340px",
                width: "100%",
                margin: "0 auto",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
  <div>
    <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontSize: "1.1rem", textAlign: "center" }}>
      Daily progress
    </h2>

    <div style={{ marginTop: "2.1rem" }}>
      <div
        style={{
          width: "100%",
          height: "14px",
          background: "#ddd0ff",
          borderRadius: "999px",
          overflow: "hidden",
          marginBottom: "0.55rem",
        }}
      >
                    <div
                      style={{
                        width: `${dailyProgress}%`,
                        height: "100%",
                        background: "var(--accent)",
                        borderRadius: "999px",
                      }}
                    />
                  </div>
                </div>
                </div>

                <div style={{ marginTop: "auto" }}>
                  <p className="muted" style={{ margin: 0 }}>
                    Care completion today:{" "}
                    <strong style={{ color: "var(--ink)" }}>{dailyProgress}%</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "0.8rem",
    maxWidth: "1080px",
    margin: "0 auto 1rem",
    alignItems: "stretch",
  }}
>
<div
  className="card"
  style={{
    background: "rgba(247, 244, 255, 0.96)",
    border: "1px solid #8f79c9",
    boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
    minWidth: 0,
    height: "290px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "1.25rem",
    margin: 0,
    alignSelf: "stretch",
  }}
>
  <div>
    <h2
      style={{
        marginTop: 0,
        marginBottom: "1rem",
        fontFamily: "var(--font-display)",
        fontSize: "1.1rem",
        textAlign: "center",
      }}
    >
      Feeding
    </h2>

    <label htmlFor="feed-title">Meal label</label>
    <input
      id="feed-title"
      type="text"
      value={feedingTitle}
      onChange={(e) => setFeedingTitle(e.target.value)}
      placeholder="e.g. Morning wet food"
      autoComplete="off"
      spellCheck={false}
      style={{ marginTop: "0.35rem", marginBottom: "0.65rem" }}
    />
  </div>

  <button
    type="button"
    className="btn"
    onClick={handleFeedingLog}
    disabled={!canLogFeeding}
    style={{ alignSelf: "center" }}
  >
    Log feeding now
  </button>
</div>

  <div
  className="card"
  style={{
    background: "rgba(247, 244, 255, 0.96)",
    border: "1px solid #8f79c9",
    boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
    minWidth: 0,
    height: "290px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "1.25rem",
    margin: 0,
    alignSelf: "stretch",
  }}
>
  <div>
    <h2
      style={{
        marginTop: 0,
        marginBottom: "1rem",
        fontFamily: "var(--font-display)",
        fontSize: "1.1rem",
        textAlign: "center",
      }}
    >
      Water
    </h2>

    <div style={{ marginTop: "0.35rem" }}>
      <label
        style={{
          display: "grid",
          gridTemplateColumns: "18px 1fr",
          alignItems: "center",
          columnGap: "0.65rem",
          marginBottom: "0.55rem",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={waterBowlCleaned}
          onChange={(e) => setWaterBowlCleaned(e.target.checked)}
          style={{ margin: 0 }}
        />
        <span>Bowl cleaned</span>
      </label>

      <label
        style={{
          display: "grid",
          gridTemplateColumns: "18px 1fr",
          alignItems: "center",
          columnGap: "0.65rem",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={waterChanged}
          onChange={(e) => setWaterChanged(e.target.checked)}
          style={{ margin: 0 }}
        />
        <span>Water changed</span>
      </label>
    </div>
  </div>

  <button
    type="button"
    className="btn"
    onClick={handleWaterLog}
    disabled={!canLogWater}
    style={{ alignSelf: "center" }}
  >
    Log water refresh
  </button>
</div>

  <div
  className="card"
  style={{
    background: "rgba(247, 244, 255, 0.96)",
    border: "1px solid #8f79c9",
    boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
    minWidth: 0,
    height: "290px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "1.25rem",
    margin: 0,
    alignSelf: "stretch",
  }}
>
  <div>
    <h2
      style={{
        marginTop: 0,
        marginBottom: "1rem",
        fontFamily: "var(--font-display)",
        fontSize: "1.1rem",
        textAlign: "center",
      }}
    >
      Litter box
    </h2>

    <div className="row" style={{ marginBottom: "0.65rem" }}>
      <label htmlFor="litter-act" style={{ margin: 0 }}>
        Action
      </label>
      <select
        id="litter-act"
        value={litterAction}
        onChange={(e) => setLitterAction(e.target.value)}
        style={{ maxWidth: "220px" }}
      >
        <option value="scoop">Quick scoop</option>
        <option value="full_clean">Full clean (same litter)</option>
        <option value="replace_litter">Replaced litter</option>
      </select>
    </div>

    <label htmlFor="litter-notes">Condition</label>
    <select
      id="litter-notes"
      value={litterNotes}
      onChange={(e) => {
        const val = e.target.value;
        setLitterNotes(val);

        if (val === "clean") {
          setLitterFeedback("Good job! Your cat is happy 😺");
        } else if (val === "slightly_dirty") {
          setLitterFeedback("Slightly dirty. A quick scoop and refresh will help keep it comfortable ✨");
        } else if (val === "smelly") {
          setLitterFeedback("Better clean soon or consult vet if behavior changes 🏥");
        } else {
          setLitterFeedback("");
        }
      }}
      style={{ marginTop: "0.35rem", marginBottom: "0.65rem" }}
    >
      <option value="">— Select condition —</option>
      <option value="clean">Clean</option>
      <option value="slightly_dirty">Slightly dirty</option>
      <option value="smelly">Bad smell</option>
    </select>
  </div>

  <button
    type="button"
    className="btn"
    onClick={handleLitterLog}
    disabled={!canLogLitter}
    style={{ alignSelf: "center" }}
  >
    Log litter maintenance
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
            Recent daily care history
          </h2>
          <div
            className="card"
            style={{
              background: "rgba(247, 244, 255, 0.96)",
              border: "1px solid #8f79c9",
              boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
              maxWidth: "580px",
              margin: "0 auto",
            }}
          >
            {loading ? (
              <p className="muted">Loading logs…</p>
            ) : !logs.length ? (
              <p className="muted" style={{ margin: 0 }}>
                No feeding, water, or litter logs yet for this cat.
              </p>
            ) : (
              <ul className="list-plain">
                {logs.map((log) => (
                  <li key={log._id}>
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "center",width: "100%", gap: "1rem" }}>
                      <div style={{ flex: 1, textAlign: "center", fontWeight: "400"}}>
                        <div style={{ textAlign: "center" }}>
  <span className={`badge ${log.category}`}>{log.category}</span>{" "}
  <span className="muted">{formatWhen(log.completedAt)}</span>
</div>
                        {log.title ? <div className="muted">{log.title}</div> : null}
                        {log.notes ? <div className="muted">{log.notes}</div> : null}
                        {log.litterAction ? (
                          <div className="muted">Action: {log.litterAction.replace(/_/g, " ")}</div>
                        ) : null}
                      </div>
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