import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import CatPicker from "../components/CatPicker.jsx";
import { useCats } from "../context/CatContext.jsx";

const SYMPTOM_OPTIONS = [
  "Vomiting",
  "Not eating",
  "Low activity",
  "Diarrhea",
  "Sneezing",
  "Coughing",
  "Fever",
  "Hiding",
  "Limping",
  "Skin issue",
];

const HOUR_OPTIONS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const MINUTE_OPTIONS = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const AM_PM_OPTIONS = ["AM", "PM"];

const REMINDER_OPTIONS = [
  { label: "At appointment time", value: "at time" },
  { label: "30 minutes before", value: "30 minutes before" },
  { label: "1 hour before", value: "1 hour before" },
  { label: "2 hours before", value: "2 hours before" },
  { label: "1 day before", value: "1 day before" },
];

function formatWhen(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function emptyPlannedForm() {
  return {
    scheduledDate: "",
    scheduledHour: "09",
    scheduledMinute: "00",
    scheduledAmPm: "AM",
    vetClinic: "",
    doctorName: "",
    notes: "",
    symptoms: [],
    reminderNote: "30 minutes before",
    doctorContactNumber: "",
    reportName: "",
    reportType: "",
    reportData: "",
    visitStatus: "scheduled",
  };
}

function buildScheduledDateTime(form) {
  if (!form.scheduledDate) return null;

  const year = Number(form.scheduledDate.slice(0, 4));
  const month = Number(form.scheduledDate.slice(5, 7)) - 1;
  const day = Number(form.scheduledDate.slice(8, 10));

  let hour = Number(form.scheduledHour || "12");
  const minute = Number(form.scheduledMinute || "0");
  const ampm = String(form.scheduledAmPm || "AM").toUpperCase();

  if (ampm === "AM") {
    if (hour === 12) hour = 0;
  } else if (ampm === "PM") {
    if (hour !== 12) hour += 12;
  }

  return new Date(year, month, day, hour, minute, 0, 0);
}

function makePlannedPayload(form) {
  const scheduled = buildScheduledDateTime(form);

  return {
    category: "vet",
    title: "Scheduled appointment",
    scheduledFor: scheduled ? scheduled.toISOString() : null,
    completedAt: null,
    vetClinic: form.vetClinic,
    doctorName: form.doctorName,
    notes: form.notes,
    symptoms: form.symptoms,
    reminderNote: form.reminderNote,
    emergencyContactName: "",
    emergencyContactPhone: form.doctorContactNumber,
    reportName: form.reportName,
    reportType: form.reportType,
    reportData: form.reportData,
    visitStatus: form.visitStatus || "scheduled",
  };
}

function hasUsefulPlannedData(form) {
  return Boolean(
    form.scheduledDate ||
      form.vetClinic.trim() ||
      form.doctorName.trim() ||
      form.notes.trim() ||
      form.symptoms.length ||
      form.reminderNote.trim() ||
      form.doctorContactNumber.trim() ||
      form.reportData
  );
}

function FieldRow({ label, children }) {
  return (
    <div style={{ marginBottom: "0.65rem" }}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read selected file."));
    reader.readAsDataURL(file);
  });
}

function isImageType(type) {
  return String(type || "").startsWith("image/");
}

function parseReminderOffsetMinutes(note) {
  const text = String(note || "").toLowerCase().trim();
  if (!text) return null;

  const minuteMatch = text.match(/(\d+)\s*(minute|minutes|min|mins)\s*before/);
  if (minuteMatch) return Number(minuteMatch[1]);

  const hourMatch = text.match(/(\d+)\s*(hour|hours|hr|hrs)\s*before/);
  if (hourMatch) return Number(hourMatch[1]) * 60;

  const dayMatch = text.match(/(\d+)\s*(day|days)\s*before/);
  if (dayMatch) return Number(dayMatch[1]) * 24 * 60;

  if (
    text.includes("at time") ||
    text.includes("on time") ||
    text.includes("appointment time") ||
    text === "now"
  ) {
    return 0;
  }

  return null;
}

export default function VetAppointments() {
  const { selectedCatId } = useCats();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [fileBusy, setFileBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [planForm, setPlanForm] = useState(emptyPlannedForm);

  const load = useCallback(async () => {
    if (!selectedCatId) {
      setLogs([]);
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const data = await api.listVetLogs(selectedCatId);
      setLogs(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCatId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const timer = setInterval(() => {
      const now = new Date();

      logs.forEach((log) => {
        if (!log.scheduledFor) return;
        if (log.title !== "Scheduled appointment") return;
        if (log.visitStatus && log.visitStatus !== "scheduled") return;

        const offsetMinutes = parseReminderOffsetMinutes(log.reminderNote);
        if (offsetMinutes == null) return;

        const scheduled = new Date(log.scheduledFor);
        const diffMinutes = Math.round((scheduled.getTime() - now.getTime()) / (1000 * 60));
        const notifyKey = `vet-reminder-${log._id}-${scheduled.toDateString()}-${offsetMinutes}`;

        if (
          diffMinutes <= offsetMinutes &&
          diffMinutes > offsetMinutes - 2 &&
          Notification.permission === "granted" &&
          !sessionStorage.getItem(notifyKey)
        ) {
          new Notification("Vet Appointment Reminder 🐾", {
            body: `${
              log.reminderNote || "Upcoming appointment"
            }${log.vetClinic ? ` · ${log.vetClinic}` : ""}`,
          });
          sessionStorage.setItem(notifyKey, "1");
        }
      });
    }, 60000);

    return () => clearInterval(timer);
  }, [logs]);

  function setPlan(key, value) {
    setPlanForm((f) => ({ ...f, [key]: value }));
  }

  function toggleSymptom(symptom) {
    setPlanForm((f) => ({
      ...f,
      symptoms: f.symptoms.includes(symptom)
        ? f.symptoms.filter((s) => s !== symptom)
        : [...f.symptoms, symptom],
    }));
  }

  async function handleReportFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const allowed =
      file.type === "application/pdf" || String(file.type || "").startsWith("image/");

    if (!allowed) {
      setErr("Please choose only an image or PDF report.");
      return;
    }

    setErr(null);
    setFileBusy(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPlanForm((f) => ({
        ...f,
        reportName: file.name || "",
        reportType: file.type || "",
        reportData: dataUrl,
      }));
    } catch (error) {
      setErr(error.message || "Could not process selected report.");
    } finally {
      setFileBusy(false);
    }
  }

  function removeSelectedReport() {
    setPlanForm((f) => ({
      ...f,
      reportName: "",
      reportType: "",
      reportData: "",
    }));
  }

  async function addPlannedVisit(e) {
    e.preventDefault();
    if (!selectedCatId) return;

    if (!hasUsefulPlannedData(planForm)) {
      setErr("Please fill at least one useful appointment detail before saving.");
      return;
    }

    if (!planForm.scheduledDate) {
      setErr("Please choose appointment date.");
      return;
    }

    if (
      planForm.doctorContactNumber &&
      !/^\d{10}$/.test(String(planForm.doctorContactNumber).trim())
    ) {
      setErr("Doctor contact number must be exactly 10 digits.");
      return;
    }

    setErr(null);

    try {
      await api.createVetLog(selectedCatId, makePlannedPayload(planForm));
      setPlanForm(emptyPlannedForm());
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function removeLog(id) {
    try {
      await api.deleteLog(id);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  const now = Date.now();

  const appointmentLogs = useMemo(
    () => logs.filter((log) => log.title === "Scheduled appointment" || log.scheduledFor),
    [logs]
  );

  const summary = useMemo(() => {
    const totalVisits = appointmentLogs.filter((l) => l.completedAt).length;
    const missedVisits = appointmentLogs.filter(
      (l) => l.visitStatus === "missed" || l.appointmentKept === false
    ).length;

    const sortedCompleted = [...appointmentLogs]
      .filter((l) => l.completedAt)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    const sortedUpcoming = [...appointmentLogs]
      .filter(
        (l) =>
          l.scheduledFor &&
          new Date(l.scheduledFor).getTime() >= now &&
          (l.visitStatus === "scheduled" || !l.visitStatus)
      )
      .sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));

    const overdueReminders = appointmentLogs.filter(
      (l) =>
        l.scheduledFor &&
        !l.completedAt &&
        new Date(l.scheduledFor).getTime() < now &&
        (l.visitStatus === "scheduled" || !l.visitStatus)
    ).length;

    return {
      totalVisits,
      missedVisits,
      lastVisit: sortedCompleted[0] || null,
      nextVisit: sortedUpcoming[0] || null,
      overdueReminders,
    };
  }, [appointmentLogs, now]);

  const filteredLogs = useMemo(() => {
    return appointmentLogs.filter((log) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "upcoming"
            ? log.scheduledFor && new Date(log.scheduledFor).getTime() > now
            : statusFilter === "scheduled"
              ? log.visitStatus === "scheduled"
              : statusFilter === "missed"
                ? log.visitStatus === "missed" || log.appointmentKept === false
                : statusFilter === "rescheduled"
                  ? log.visitStatus === "rescheduled"
                  : true;

      return matchesStatus;
    });
  }, [appointmentLogs, statusFilter, now]);

  return (
    <div className="page">
      <h1 style={{textAlign: "center"}}>Vet appointments</h1>
      <p style={{textAlign: "center", color: "var(--muted)" }}>
        Schedule appointments, track follow-ups, and manage appointment history.
      </p>

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
      </div>

      {selectedCatId && (
        <>
          <div
            className="grid-2"
            style={{
              marginBottom: "1rem",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              maxWidth: "900px",
              marginLeft: "auto",
              marginRight: "auto",
              gap: "0.8rem",
            }}
          >
            <div className="card">
              <div className="muted">Last visit</div>
              <strong>{summary.lastVisit ? formatWhen(summary.lastVisit.completedAt) : "—"}</strong>
            </div>
            <div className="card">
              <div className="muted">Next appointment</div>
              <strong>{summary.nextVisit ? formatWhen(summary.nextVisit.scheduledFor) : "—"}</strong>
            </div>
            <div className="card">
              <div className="muted">Total completed visits</div>
              <strong>{summary.totalVisits}</strong>
            </div>
            <div className="card">
              <div className="muted">Missed / overdue</div>
              <strong>{summary.missedVisits + summary.overdueReminders}</strong>
            </div>
          </div>

          <div
            className="grid-2"
            style={{
              marginBottom: "1rem",
              gridTemplateColumns: "1fr",
              maxWidth: "720px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <div className="card">
              <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontSize: "1.1rem", textAlign: "center" }}>
                Schedule an appointment
              </h2>
              <form onSubmit={addPlannedVisit}>
                <FieldRow label="Date *">
                  <input
                    type="date"
                    value={planForm.scheduledDate}
                    onChange={(e) => setPlan("scheduledDate", e.target.value)}
                    required
                  />
                </FieldRow>

                <FieldRow label="Time *">
                  <div className="row" style={{ gap: "0.6rem", flexWrap: "wrap" }}>
                    <select
                      value={planForm.scheduledHour}
                      onChange={(e) => setPlan("scheduledHour", e.target.value)}
                      style={{ maxWidth: "120px" }}
                    >
                      {HOUR_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>

                    <select
                      value={planForm.scheduledMinute}
                      onChange={(e) => setPlan("scheduledMinute", e.target.value)}
                      style={{ maxWidth: "120px" }}
                    >
                      {MINUTE_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>

                    <select
                      value={planForm.scheduledAmPm}
                      onChange={(e) => setPlan("scheduledAmPm", e.target.value)}
                      style={{ maxWidth: "120px" }}
                    >
                      {AM_PM_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </FieldRow>

                <FieldRow label="Clinic">
                  <input
                    value={planForm.vetClinic}
                    onChange={(e) => setPlan("vetClinic", e.target.value)}
                  />
                </FieldRow>

                <FieldRow label="Doctor name">
                  <input
                    value={planForm.doctorName}
                    onChange={(e) => setPlan("doctorName", e.target.value)}
                  />
                </FieldRow>

                <FieldRow label="Symptoms before visit">
                  <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                    {SYMPTOM_OPTIONS.map((symptom) => (
                      <label
                        key={symptom}
                        style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}
                      >
                        <input
                          type="checkbox"
                          checked={planForm.symptoms.includes(symptom)}
                          onChange={() => toggleSymptom(symptom)}
                        />
                        <span>{symptom}</span>
                      </label>
                    ))}
                  </div>
                </FieldRow>

                <FieldRow label="Notes">
                  <textarea
                    value={planForm.notes}
                    onChange={(e) => setPlan("notes", e.target.value)}
                    placeholder="Reason, doctor name, prep instructions..."
                  />
                </FieldRow>

                <FieldRow label="Reminder">
                  <select
                    value={planForm.reminderNote}
                    onChange={(e) => setPlan("reminderNote", e.target.value)}
                  >
                    {REMINDER_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </FieldRow>

                <FieldRow label="Doctor contact number">
                  <input
                    value={planForm.doctorContactNumber}
                    onChange={(e) =>
                      setPlan("doctorContactNumber", e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit number"
                  />
                </FieldRow>

                <FieldRow label="Last time visit report / document">
                  <input
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    onChange={handleReportFileChange}
                    disabled={fileBusy}
                  />
                  {fileBusy ? (
                    <p className="muted" style={{ marginTop: "0.35rem" }}>
                      Processing report...
                    </p>
                  ) : null}

                  {planForm.reportData ? (
                    <div
                      style={{
                        marginTop: "0.65rem",
                        padding: "0.75rem",
                        border: "1px solid var(--line)",
                        borderRadius: "12px",
                        background: "var(--surface-2)",
                      }}
                    >
                      <div className="muted" style={{ marginBottom: "0.5rem" }}>
                        Selected:{" "}
                        <strong style={{ color: "var(--ink)" }}>
                          {planForm.reportName || "Report file"}
                        </strong>
                      </div>

                      {isImageType(planForm.reportType) ? (
                        <img
                          src={planForm.reportData}
                          alt="Report preview"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "220px",
                            borderRadius: "10px",
                            border: "1px solid var(--line)",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div className="muted">PDF selected and ready to save.</div>
                      )}

                      <button
                        type="button"
                        className="btn ghost"
                        style={{ marginTop: "0.65rem" }}
                        onClick={removeSelectedReport}
                      >
                        Remove report
                      </button>
                    </div>
                  ) : null}
                </FieldRow>

                <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
                  <button type="submit" className="btn" disabled={fileBusy}>
                    Save planned visit
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div
            style={{
              maxWidth: "580px",
              margin: "0 auto 0.75rem",
            }}
          >
            <label htmlFor="vet-filter">Filter</label>
            <select
              id="vet-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All entries</option>
              <option value="upcoming">Upcoming</option>
              <option value="scheduled">Scheduled</option>
              <option value="missed">Missed</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.2rem",
              marginTop: "1.25rem",
              marginBottom: "0.65rem",
              textAlign: "center",
            }}
          >
            Appointment history
          </h2>
          <div
            className="card"
            style={{
              maxWidth: "580px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {loading ? (
              <p className="muted">Loading…</p>
            ) : !filteredLogs.length ? (
              <p className="muted" style={{ margin: 0 }}>
                No appointment entries found.
              </p>
            ) : (
              <ul className="list-plain">
                {filteredLogs.map((log) => {
                  const upcoming = log.scheduledFor && new Date(log.scheduledFor).getTime() > now;
                  return (
                    <li key={log._id}>
  <div style={{ width: "100%", position: "relative" }}>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <span className="badge vet">Vet</span>

      {log.title && <div style={{ fontWeight: 500 }}>{log.title}</div>}

      <div className="muted" style={{ marginTop: "4px" }}>
        {log.scheduledFor && <span>Scheduled: {formatWhen(log.scheduledFor)}</span>}
      </div>

      {log.vetClinic && <div>{log.vetClinic}</div>}

      {/* 🔥 FIXED PART */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          marginTop: "6px",
        }}
      >
        {log.doctorName && <div className="muted">Doctor: {log.doctorName}</div>}
        {log.symptoms?.length && (
          <div className="muted">Symptoms: {log.symptoms.join(", ")}</div>
        )}
        {log.reminderNote && (
          <div className="muted">Reminder: {log.reminderNote}</div>
        )}
        {log.emergencyContactPhone && (
          <div className="muted">Doctor contact number: {log.emergencyContactPhone}</div>
        )}
        {log.notes && <div className="muted">{log.notes}</div>}
        {log.visitStatus && <div className="muted">Status: {log.visitStatus}</div>}
      </div>
    </div>

  </div>
</li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}