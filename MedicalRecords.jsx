import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";
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

const TEST_OPTIONS = [
  "Blood test",
  "Urine test",
  "Stool test",
  "X-ray",
  "Ultrasound",
  "CT scan",
  "MRI scan",
  "Skin scraping",
  "Allergy test",
  "Temperature check",
  "Weight check",
  "Dental check",
  "Eye examination",
  "Ear examination",
  "Fecal examination",
  "Kidney function test",
  "Liver function test",
];

const MEDICINE_OPTIONS = [
  "Amoxicillin",
  "Doxycycline",
  "Metronidazole",
  "Prednisolone",
  "Cetirizine",
  "Meloxicam",
  "Deworming syrup",
  "Vitamin supplement",
  "Probiotic syrup",
  "Eye drops",
  "Ear drops",
  "Skin ointment",
  "Appetite stimulant",
  "Pain relief syrup",
  "Antibiotic syrup",
];

const DOSAGE_OPTIONS = [
  "1/4 tablet",
  "1/2 tablet",
  "1 tablet",
  "2 tablets",
  "1 ml",
  "2 ml",
  "2.5 ml",
  "5 ml",
  "10 ml",
  "1 drop",
  "2 drops",
  "Apply small amount",
];

const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every 6 hours",
  "Every 8 hours",
  "Every 12 hours",
  "Weekly",
  "As needed",
];

const DURATION_OPTIONS = [1, 2, 3, 5, 7, 10, 14, 21, 30];

const VACCINE_OPTIONS = [
  "FVRCP",
  "Rabies",
  "FeLV",
  "Feline Bordetella",
  "Chlamydia",
  "FIP vaccine",
  "Booster dose",
  "Deworming",
  "Tick and flea prevention",
];

const HOUR_OPTIONS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const MINUTE_OPTIONS = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const AM_PM_OPTIONS = ["AM", "PM"];

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

function formatDateOnly(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function num(val) {
  if (val === "" || val == null) return "";
  return Number(val);
}

function emptyMedicalForm() {
  return {
    completedDate: "",
    completedHour: "09",
    completedMinute: "00",
    completedAmPm: "AM",
    vetClinic: "",
    doctorName: "",
    visitStatus: "completed",
    appointmentKept: "yes",
    symptoms: [],
    diagnosis: "",
    treatment: "",
    testsRecommended: "",
    followUpDate: "",
    followUpAdvice: "",
    weightKg: "",
    medicineName: "",
    medicineDosage: "",
    medicineFrequency: "",
    medicineDurationDays: "",
    vaccineName: "",
    vaccineDueDate: "",
    vaccineStatus: "",
    doctorContactNumber: "",
    reportName: "",
    reportType: "",
    reportData: "",
  };
}

function buildCompletedAt(form) {
  if (!form.completedDate) return new Date();

  const [year, month, day] = String(form.completedDate).split("-").map(Number);
  let hour = Number(form.completedHour || "09");
  const minute = Number(form.completedMinute || "00");

  if (form.completedAmPm === "PM" && hour !== 12) hour += 12;
  if (form.completedAmPm === "AM" && hour === 12) hour = 0;

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function makeMedicalPayload(form) {
  const when = buildCompletedAt(form);

  return {
    category: "vet",
    title: "Medical record",
    completedAt: when.toISOString(),
    vetClinic: form.vetClinic,
    doctorName: form.doctorName,
    notes: "",
    symptoms: form.symptoms,
    visitStatus: form.visitStatus || "completed",
    appointmentKept:
      form.appointmentKept === "yes"
        ? true
        : form.appointmentKept === "no"
          ? false
          : null,
    diagnosis: form.diagnosis,
    treatment: form.treatment,
    testsRecommended: form.testsRecommended,
    followUpDate:
      form.followUpDate && !isNaN(new Date(form.followUpDate))
        ? new Date(form.followUpDate).toISOString()
        : null,
    followUpAdvice: form.followUpAdvice,
    weightKg: form.weightKg === "" ? null : Number(form.weightKg),
    costTotal: null,
    medicineName: form.medicineName,
    medicineDosage: form.medicineDosage,
    medicineFrequency: form.medicineFrequency,
    medicineDurationDays:
      form.medicineDurationDays === "" ? null : Number(form.medicineDurationDays),
    vaccineName: form.vaccineName,
    vaccineDueDate:
      form.vaccineDueDate && !isNaN(new Date(form.vaccineDueDate))
        ? new Date(form.vaccineDueDate).toISOString()
        : null,
    vaccineStatus: form.vaccineStatus,
    emergencyContactName: "",
    emergencyContactPhone: form.doctorContactNumber,
    reportName: form.reportName,
    reportType: form.reportType,
    reportData: form.reportData,
  };
}

function hasUsefulMedicalData(form) {
  return Boolean(
    form.completedDate ||
      form.vetClinic.trim() ||
      form.doctorName.trim() ||
      form.symptoms.length ||
      form.diagnosis.trim() ||
      form.treatment.trim() ||
      form.testsRecommended.trim() ||
      form.followUpDate ||
      form.followUpAdvice.trim() ||
      form.weightKg !== "" ||
      form.medicineName.trim() ||
      form.medicineDosage.trim() ||
      form.medicineFrequency.trim() ||
      form.medicineDurationDays !== "" ||
      form.vaccineName.trim() ||
      form.vaccineDueDate ||
      form.vaccineStatus.trim() ||
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

function toDateOnlyKey(dateValue) {
  const d = new Date(dateValue);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getTodayKey() {
  return toDateOnlyKey(new Date());
}

function getMedicineTimesByFrequency(frequency, startDateValue) {
  const frequencyText = String(frequency || "").toLowerCase().trim();

  if (!frequencyText || frequencyText === "as needed") return [];

  if (frequencyText === "once daily") return ["09:00"];
  if (frequencyText === "twice daily") return ["09:00", "21:00"];
  if (frequencyText === "three times daily") return ["08:00", "14:00", "20:00"];
  if (frequencyText === "every 6 hours") return ["00:00", "06:00", "12:00", "18:00"];
  if (frequencyText === "every 8 hours") return ["06:00", "14:00", "22:00"];
  if (frequencyText === "every 12 hours") return ["08:00", "20:00"];

  if (frequencyText === "weekly") {
    const base = startDateValue ? new Date(startDateValue) : new Date();
    const weekday = base.toLocaleDateString(undefined, { weekday: "long" });
    return [`09:00 (${weekday})`];
  }

  return [];
}

function formatTime12From24(time24) {
  if (!time24) return "";
  const [h, m] = String(time24).split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function isMedicineStillActive(log) {
  if (!log.medicineName || !log.completedAt) return false;

  const duration = Number(log.medicineDurationDays);
  if (!duration || duration <= 0) return true;

  const start = new Date(log.completedAt);
  const end = new Date(start);
  end.setDate(end.getDate() + duration - 1);

  const today = new Date();
  return toDateOnlyKey(today) <= toDateOnlyKey(end);
}

function getTodayMedicineReminders(logs) {
  const today = new Date();
  const todayWeekday = today.toLocaleDateString(undefined, { weekday: "long" });
  const reminders = [];

  logs.forEach((log) => {
    if (!isMedicineStillActive(log)) return;

    const times = getMedicineTimesByFrequency(log.medicineFrequency, log.completedAt);

    times.forEach((time, index) => {
      const isWeekly = time.includes("(");
      if (isWeekly && !time.includes(todayWeekday)) return;

      const cleanTime = time.split(" ")[0];

      reminders.push({
        id: `${log._id}-${index}-${cleanTime}`,
        medicineName: log.medicineName,
        dosage: log.medicineDosage || "",
        frequency: log.medicineFrequency || "",
        time: cleanTime,
      });
    });
  });

  return reminders.sort((a, b) => a.time.localeCompare(b.time));
}

function getTodayVaccineReminders(logs) {
  const todayKey = getTodayKey();

  return logs
    .filter((log) => {
      if (!log.vaccineDueDate) return false;
      if (String(log.vaccineStatus || "").toLowerCase() === "given") return false;
      return toDateOnlyKey(log.vaccineDueDate) === todayKey;
    })
    .map((log) => ({
      id: `vaccine-${log._id}`,
      vaccineName: log.vaccineName || "Vaccine",
      dueDate: log.vaccineDueDate,
    }));
}

function getExpectedWeightRange(ageCategory, gender) {
  const age = String(ageCategory || "").toLowerCase();
  const g = String(gender || "").toLowerCase();

  if (age.includes("kitten")) return { min: 0.8, max: 2.5 };
  if (age.includes("senior")) return { min: 2.5, max: 5.5 };
  if (g === "male") return { min: 3.5, max: 6.5 };
  if (g === "female") return { min: 2.5, max: 5.5 };
  return { min: 2.5, max: 6 };
}

function getWeightComment(weight, cat) {
  const value = Number(weight);
  if (!value || Number.isNaN(value)) return "";

  const range = getExpectedWeightRange(cat?.ageCategory, cat?.gender);

  if (value < range.min) {
    return "Underweight for this cat’s age/gender range.";
  }
  if (value > range.max) {
    return "Overweight for this cat’s age/gender range.";
  }
  return "Weight looks within a suitable range.";
}

function getWeightTrendComment(currentLog, previousLog) {
  if (!currentLog || !previousLog) return "";
  const current = Number(currentLog.weightKg);
  const previous = Number(previousLog.weightKg);
  if (Number.isNaN(current) || Number.isNaN(previous)) return "";

  const diff = Number((current - previous).toFixed(2));

  if (diff <= -1) return "Weight decreased a lot this time.";
  if (diff < 0) return "Weight decreased compared to previous record.";
  if (diff >= 1) return "Weight increased a lot this time.";
  if (diff > 0) return "Weight increased compared to previous record.";
  return "Weight is unchanged from previous record.";
}

const EQUAL_CARD_STYLE = {
  height: "100%",
  boxSizing: "border-box",
  borderRadius: "14px",
};

export default function MedicalRecords() {
  const { selectedCatId, cats } = useCats();
  const selectedCat = cats.find((c) => c._id === selectedCatId);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(emptyMedicalForm);

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
      setErr(e?.message || "Could not load medical records.");
    } finally {
      setLoading(false);
    }
  }, [selectedCatId]);

  useEffect(() => {
    load();
  }, [load]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleSymptom(symptom) {
    setForm((f) => ({
      ...f,
      symptoms: f.symptoms.includes(symptom)
        ? f.symptoms.filter((s) => s !== symptom)
        : [...f.symptoms, symptom],
    }));
  }

  async function addMedicalRecord(e) {
    e.preventDefault();
    if (!selectedCatId) return;

    if (!hasUsefulMedicalData(form)) {
      setErr("Please fill at least one medical detail before saving.");
      return;
    }

    if (
      form.doctorContactNumber &&
      !/^\d{10}$/.test(String(form.doctorContactNumber).trim())
    ) {
      setErr("Doctor contact number must be exactly 10 digits.");
      return;
    }

    setErr(null);

    try {
      await api.createVetLog(selectedCatId, makeMedicalPayload(form));
      setForm(emptyMedicalForm());
      await load();
    } catch (e) {
      setErr(e?.message || "Could not save medical record.");
    }
  }

  async function removeLog(id) {
    try {
      await api.deleteLog(id);
      await load();
    } catch (e) {
      setErr(e?.message || "Could not remove medical record.");
    }
  }

  async function downloadMedicalPdfFromForm() {
    if (!selectedCatId) {
      setErr("Please select a cat first.");
      return;
    }

    if (!hasUsefulMedicalData(form)) {
      setErr("Please fill at least one medical detail before downloading PDF.");
      return;
    }

    setErr(null);

    try {
      const blob = await api.generateMedicalRecordPdf(selectedCatId, makeMedicalPayload(form));

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `medical-record-${form.completedDate || "record"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e?.message || "Could not generate medical record PDF.");
    }
  }

  async function downloadMedicalPdfFromLog(log) {
    if (!selectedCatId) return;

    try {
      const blob = await api.generateMedicalRecordPdf(selectedCatId, log);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `medical-record-${log._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e?.message || "Could not generate medical record PDF.");
    }
  }

  const now = Date.now();

  const weightLogs = useMemo(() => {
    return [...logs]
      .filter((l) => l.weightKg != null && l.completedAt)
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
      .slice(-6);
  }, [logs]);

  const latestWeightLog = useMemo(() => {
    return (
      [...logs]
        .filter((l) => l.weightKg != null && l.completedAt)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0] || null
    );
  }, [logs]);

  const previousWeightLog = useMemo(() => {
    return (
      [...logs]
        .filter((l) => l.weightKg != null && l.completedAt)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[1] || null
    );
  }, [logs]);

  const vaccineLogs = useMemo(() => {
    return logs.filter((l) => l.vaccineName || l.vaccineDueDate);
  }, [logs]);

  const medicineLogs = useMemo(() => {
    return logs.filter((l) => l.medicineName);
  }, [logs]);

  const medicineReminders = useMemo(() => {
    return getTodayMedicineReminders(logs);
  }, [logs]);

  const todayVaccineReminders = useMemo(() => {
    return getTodayVaccineReminders(logs);
  }, [logs]);

  const summary = useMemo(() => {
    const missedVisits = logs.filter(
      (l) => l.visitStatus === "missed" || l.appointmentKept === false
    ).length;

    const vaccineDue = logs
      .filter(
        (l) =>
          l.vaccineDueDate &&
          ["due", "overdue", ""].includes(String(l.vaccineStatus || "")) &&
          new Date(l.vaccineDueDate).getTime() >= now
      )
      .sort((a, b) => new Date(a.vaccineDueDate) - new Date(b.vaccineDueDate))[0];

    return { missedVisits, vaccineDue: vaccineDue || null };
  }, [logs, now]);

  const insight = useMemo(() => {
    const digestiveCount = logs.filter(
      (l) =>
        String(l.symptoms || []).toLowerCase().includes("vomiting") ||
        String(l.symptoms || []).toLowerCase().includes("diarrhea")
    ).length;

    const respiratoryCount = logs.filter(
      (l) =>
        String(l.symptoms || []).toLowerCase().includes("sneezing") ||
        String(l.symptoms || []).toLowerCase().includes("coughing")
    ).length;

    if (digestiveCount >= 3) {
      return "Your cat had several digestive-related notes recently. Keep food routine stable and consider discussing diet with your vet.";
    }
    if (respiratoryCount >= 3) {
      return "Your cat had repeated respiratory-related notes. Monitor sneezing or coughing closely and keep your next vet check on time.";
    }
    if (summary.missedVisits >= 2) {
      return "There are repeated missed or rescheduled vet records. Try keeping treatment and follow-up details updated.";
    }
    return "Medical history looks manageable. Keep diagnosis, treatment, medicines, vaccines, and reports updated for better long-term tracking.";
  }, [logs, summary.missedVisits]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "vaccines"
            ? Boolean(log.vaccineName || log.vaccineDueDate)
            : statusFilter === "medicines"
              ? Boolean(log.medicineName)
              : statusFilter === "records"
                ? Boolean(log.diagnosis || log.treatment || log.testsRecommended)
                : true;

      return matchesStatus;
    });
  }, [logs, statusFilter]);

  useEffect(() => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const timer = setInterval(() => {
      const nowDate = new Date();
      const currentTime = `${String(nowDate.getHours()).padStart(2, "0")}:${String(
        nowDate.getMinutes()
      ).padStart(2, "0")}`;
      const todayKey = getTodayKey();

      medicineReminders.forEach((item) => {
        const key = `med-notified-${item.id}-${todayKey}`;

        if (
          item.time === currentTime &&
          Notification.permission === "granted" &&
          !sessionStorage.getItem(key)
        ) {
          new Notification("PurrCare medicine reminder", {
            body: `${item.medicineName}${item.dosage ? ` - ${item.dosage}` : ""}`,
          });
          sessionStorage.setItem(key, "1");
        }
      });

      todayVaccineReminders.forEach((item) => {
        const key = `vaccine-notified-${item.id}-${todayKey}`;

        if (
          Notification.permission === "granted" &&
          !sessionStorage.getItem(key) &&
          currentTime === "09:00"
        ) {
          new Notification("PurrCare vaccine reminder", {
            body: `${item.vaccineName} is due today.`,
          });
          sessionStorage.setItem(key, "1");
        }
      });
    }, 30000);

    return () => clearInterval(timer);
  }, [medicineReminders, todayVaccineReminders]);

  return (
    <div className="page">
      <h1 style={{textAlign: "center"}}>Medical records</h1>
      <p style={{textAlign: "center", color: "var(--muted)" }}>
        Store diagnosis, treatment, medicines, vaccines, weight, reports, and detailed vet history.
      </p>

      {selectedCatId && (
        <>
          <div
            className="card"
            style={{
              marginBottom: "1rem",
              background: "rgba(247, 244, 255, 0.96)",
              border: "1px solid #8f79c9",
              boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
              maxWidth: "580px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <CatPicker />
          </div>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginBottom: "1rem",
              alignItems: "stretch",
              maxWidth: "760px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <div style={{ flex: 1, display: "flex" }}>
              <div
                className="card"
                style={{
                  ...EQUAL_CARD_STYLE,
                  width: "100%",
                  margin: 0,
                  background: "rgba(247, 244, 255, 0.96)",
                  border: "1px solid #8f79c9",
                  boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
                }}
              >
                <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontSize: "1.1rem", textAlign: "center" }}>
                  Medicine reminders
                </h2>

                {!medicineReminders.length ? (
                  <p className="muted" style={{ margin: 0 }}>
                    No medicine reminders for today.
                  </p>
                ) : (
                  <ul className="list-plain">
                    {medicineReminders.map((item) => (
                      <li key={item.id}>
                        <strong>{item.medicineName}</strong>
                        <div className="muted">
                          {formatTime12From24(item.time)}
                          {item.dosage ? ` · ${item.dosage}` : ""}
                          {item.frequency ? ` · ${item.frequency}` : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div style={{ flex: 1, display: "flex" }}>
              <div
                className="card"
                style={{
                  ...EQUAL_CARD_STYLE,
                  width: "100%",
                  margin: 0,
                  background: "rgba(247, 244, 255, 0.96)",
                  border: "1px solid #8f79c9",
                  boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
                }}
              >
                <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontSize: "1.1rem", textAlign: "center" }}>
                  Vaccine reminders
                </h2>

                {!todayVaccineReminders.length ? (
                  <p className="muted" style={{ margin: 0 }}>
                    No vaccine due today.
                  </p>
                ) : (
                  <ul className="list-plain">
                    {todayVaccineReminders.map((item) => (
                      <li key={item.id}>
                        <strong>{item.vaccineName}</strong>
                        <div className="muted">
                          Due today · {formatDateOnly(item.dueDate)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginBottom: "1rem",
              alignItems: "stretch",
              maxWidth: "760px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <div style={{ flex: 1, display: "flex" }}>
              <div
                className="card"
                style={{
                  ...EQUAL_CARD_STYLE,
                  width: "100%",
                  margin: 0,
                  background: "rgba(247, 244, 255, 0.96)",
                  border: "1px solid #8f79c9",
                  boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
                }}
              >
                <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontSize: "1.1rem", textAlign: "center" }}>
                  Medicine tracker
                </h2>
                {!medicineLogs.length ? (
                  <p className="muted" style={{ margin: 0 }}>
                    No medicine records yet.
                  </p>
                ) : (
                  <ul className="list-plain">
                    {medicineLogs.map((log) => {
                      const autoTimes = getMedicineTimesByFrequency(log.medicineFrequency, log.completedAt)
                        .map((t) => t.split(" ")[0])
                        .filter(Boolean);

                      return (
                        <li key={`m-${log._id}`}>
                          <strong>{log.medicineName}</strong>
                          <div className="muted">
                            {[log.medicineDosage, log.medicineFrequency].filter(Boolean).join(" · ")}
                            {log.medicineDurationDays != null ? ` · ${log.medicineDurationDays} day(s)` : ""}
                          </div>
                          {autoTimes.length ? (
                            <div className="muted">
                              Reminder times: {autoTimes.map(formatTime12From24).join(", ")}
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div style={{ flex: 1, display: "flex" }}>
              <div
                className="card"
                style={{
                  ...EQUAL_CARD_STYLE,
                  width: "100%",
                  margin: 0,
                  background: "rgba(247, 244, 255, 0.96)",
                  border: "1px solid #8f79c9",
                  boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
                }}
              >
                <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontSize: "1.1rem", textAlign: "center"}}>
                  Vaccination tracker
                </h2>
                {!vaccineLogs.length ? (
                  <p className="muted" style={{ margin: 0 }}>
                    No vaccine records yet.
                  </p>
                ) : (
                  <ul className="list-plain">
                    {vaccineLogs.map((log) => (
                      <li key={`v-${log._id}`}>
                        <strong>{log.vaccineName || "Vaccine entry"}</strong>
                        <div className="muted">
                          Due: {formatDateOnly(log.vaccineDueDate)}{" "}
                          {log.vaccineStatus ? `· Status: ${log.vaccineStatus}` : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div
            className="card"
            style={{
              marginBottom: "1rem",
              background: "rgba(247, 244, 255, 0.96)",
              border: "1px solid #8f79c9",
              boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
              maxWidth: "580px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontSize: "1.1rem", textAlign: "center" }}>
              Weight tracker
            </h2>
            {!weightLogs.length ? (
              <p className="muted" style={{ margin: 0 }}>
                No weight records yet.
              </p>
            ) : (
              <div>
                {weightLogs.map((log) => (
                  <div key={log._id} style={{ marginBottom: "0.65rem" }}>
                    <div
                      className="muted"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.2rem",
                      }}
                    >
                      <span>{formatDateOnly(log.completedAt)}</span>
                      <span>{num(log.weightKg)} kg</span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "12px",
                        background: "#ddd0ff",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min((Number(log.weightKg || 0) / 10) * 100, 100)}%`,
                          height: "100%",
                          background: "var(--accent)",
                          borderRadius: "999px",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {latestWeightLog ? (
              <div className="muted" style={{ marginTop: "0.75rem", marginBottom: 0, lineHeight: 1.5 }}>
                <div>{getWeightComment(latestWeightLog.weightKg, selectedCat)}</div>
                <div>{getWeightTrendComment(latestWeightLog, previousWeightLog)}</div>
              </div>
            ) : null}
          </div>

          <div
            className="card"
            style={{
              marginBottom: "1rem",
              background: "rgba(247, 244, 255, 0.98)",
              border: "1px solid #8f79c9",
              boxShadow: "0 10px 22px rgba(60, 34, 112, 0.12)",
              maxWidth: "720px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontSize: "1.1rem", textAlign: "center" }}>
              Add medical record
            </h2>
            <form onSubmit={addMedicalRecord}>
              <FieldRow label="Visit date">
                <input
                  type="date"
                  value={form.completedDate}
                  onChange={(e) => setField("completedDate", e.target.value)}
                />
              </FieldRow>

              <FieldRow label="Visit time">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 120px 120px",
                    gap: "0.5rem",
                    alignItems: "center",
                    maxWidth: "400px",
                  }}
                >
                  <select
                    value={form.completedHour}
                    onChange={(e) => setField("completedHour", e.target.value)}
                    style={{ margin: 0 }}
                  >
                    {HOUR_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <select
                    value={form.completedMinute}
                    onChange={(e) => setField("completedMinute", e.target.value)}
                    style={{ margin: 0 }}
                  >
                    {MINUTE_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <select
                    value={form.completedAmPm}
                    onChange={(e) => setField("completedAmPm", e.target.value)}
                    style={{ margin: 0 }}
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
                  value={form.vetClinic}
                  onChange={(e) => setField("vetClinic", e.target.value)}
                />
              </FieldRow>

              <FieldRow label="Doctor name">
                <input
                  value={form.doctorName}
                  onChange={(e) => setField("doctorName", e.target.value)}
                />
              </FieldRow>

              <FieldRow label="Symptoms">
                <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                  {SYMPTOM_OPTIONS.map((symptom) => (
                    <label
                      key={symptom}
                      style={{
                        display: "flex",
                        gap: "0.35rem",
                        alignItems: "center",
                        background: "#f2ebff",
                        padding: "0.45rem 0.65rem",
                        borderRadius: "12px",
                        border: "1px solid #d5c2ff",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.symptoms.includes(symptom)}
                        onChange={() => toggleSymptom(symptom)}
                      />
                      <span>{symptom}</span>
                    </label>
                  ))}
                </div>
              </FieldRow>

              <FieldRow label="Diagnosis">
                <input
                  value={form.diagnosis}
                  onChange={(e) => setField("diagnosis", e.target.value)}
                />
              </FieldRow>

              <FieldRow label="Treatment">
                <textarea
                  value={form.treatment}
                  onChange={(e) => setField("treatment", e.target.value)}
                />
              </FieldRow>

              <FieldRow label="Tests recommended">
                <input
                  list="test-options"
                  value={form.testsRecommended}
                  onChange={(e) => setField("testsRecommended", e.target.value)}
                  placeholder="Type or choose test"
                />
                <datalist id="test-options">
                  {TEST_OPTIONS.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </FieldRow>

              <FieldRow label="Medicine name">
                <input
                  list="medicine-options"
                  value={form.medicineName}
                  onChange={(e) => setField("medicineName", e.target.value)}
                  placeholder="Type or choose medicine"
                />
                <datalist id="medicine-options">
                  {MEDICINE_OPTIONS.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </FieldRow>

              <div className="row" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <FieldRow label="Dosage">
                    <select
                      value={form.medicineDosage}
                      onChange={(e) => setField("medicineDosage", e.target.value)}
                    >
                      <option value="">— Select dosage —</option>
                      {DOSAGE_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </FieldRow>
                </div>

                <div style={{ flex: 1, minWidth: "180px" }}>
                  <FieldRow label="Frequency">
                    <select
                      value={form.medicineFrequency}
                      onChange={(e) => setField("medicineFrequency", e.target.value)}
                    >
                      <option value="">— Select frequency —</option>
                      {FREQUENCY_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </FieldRow>
                </div>

                <div style={{ flex: 1, minWidth: "180px" }}>
                  <FieldRow label="Days">
                    <select
                      value={form.medicineDurationDays}
                      onChange={(e) => setField("medicineDurationDays", e.target.value)}
                    >
                      <option value="">— Select days —</option>
                      {DURATION_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item} day(s)
                        </option>
                      ))}
                    </select>
                  </FieldRow>
                </div>
              </div>

              <FieldRow label="Vaccine name">
                <select
                  value={form.vaccineName}
                  onChange={(e) => setField("vaccineName", e.target.value)}
                >
                  <option value="">— Select vaccine —</option>
                  {VACCINE_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </FieldRow>

              <div className="row" style={{ gap: "0.75rem" }}>
                <div style={{ flex: 1 }}>
                  <FieldRow label="Vaccine due date">
                    <input
                      type="date"
                      value={form.vaccineDueDate}
                      onChange={(e) => setField("vaccineDueDate", e.target.value)}
                    />
                  </FieldRow>
                </div>
                <div style={{ flex: 1 }}>
                  <FieldRow label="Vaccine status">
                    <select
                      value={form.vaccineStatus}
                      onChange={(e) => setField("vaccineStatus", e.target.value)}
                    >
                      <option value="">— Select —</option>
                      <option value="due">Due</option>
                      <option value="given">Given</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </FieldRow>
                </div>
              </div>

              <FieldRow label="Weight (kg)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.weightKg}
                  onChange={(e) => setField("weightKg", e.target.value)}
                />
              </FieldRow>

              <FieldRow label="Next appointment date">
                <input
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) => setField("followUpDate", e.target.value)}
                />
              </FieldRow>

              <FieldRow label="Advice by doctor">
                <textarea
                  value={form.followUpAdvice}
                  onChange={(e) => setField("followUpAdvice", e.target.value)}
                />
              </FieldRow>

              <FieldRow label="Doctor contact number">
                <input
                  value={form.doctorContactNumber}
                  onChange={(e) =>
                    setField("doctorContactNumber", e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit number"
                />
              </FieldRow>

              <div className="row" style={{ justifyContent: "center", marginTop: "0.5rem", gap: "0.75rem" }}>
                <button type="submit" className="btn">
                  Save medical record
                </button>

                <button
                  type="button"
                  className="btn secondary"
                  onClick={downloadMedicalPdfFromForm}
                >
                  Download PDF
                </button>
              </div>
            </form>
          </div>

          {err && (
            <div className="alert error" style={{ marginBottom: "1rem", maxWidth: "580px", marginInline: "auto" }}>
              {err}
            </div>
          )}

          <div
            className="card"
            style={{
              marginBottom: "1rem",
              background: "rgba(247, 244, 255, 0.96)",
              border: "1px solid #8f79c9",
              boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
              maxWidth: "580px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontSize: "1.1rem", textAlign: "center"}}>
              Quick health summary
            </h2>
            <p style={{ marginBottom: "0.45rem" }}>
              Vaccine due:{" "}
              <strong>
                {summary.vaccineDue
                  ? `${summary.vaccineDue.vaccineName || "Vaccine"} on ${formatDateOnly(summary.vaccineDue.vaccineDueDate)}`
                  : "No due vaccine noted"}
              </strong>
            </p>
            <p className="muted" style={{ marginBottom: 0, lineHeight: 1.6 }}>
              {insight}
            </p>
          </div>

          <div
            style={{
              maxWidth: "580px",
              margin: "0 auto 0.75rem",
            }}
          >
            <label htmlFor="medical-filter">Filter</label>
            <select
              id="medical-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All records</option>
              <option value="records">Diagnosis / treatment</option>
              <option value="vaccines">Vaccines</option>
              <option value="medicines">Medicines</option>
            </select>
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
            Medical history
          </h2>
          <div
            className="card"
            style={{
              background: "rgba(247, 244, 255, 0.96)",
              border: "1px solid #8f79c9",
              boxShadow: "0 8px 18px rgba(60, 34, 112, 0.10)",
              maxWidth: "580px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {loading ? (
              <p className="muted">Loading…</p>
            ) : !filteredLogs.length ? (
              <p className="muted" style={{ margin: 0 }}>
                No medical records found.
              </p>
            ) : (
              <ul className="list-plain">
                {filteredLogs.map((log) => {
                  const autoTimes = getMedicineTimesByFrequency(log.medicineFrequency, log.completedAt)
                    .map((t) => t.split(" ")[0])
                    .filter(Boolean);

                  const currentWeightIndex = weightLogs.findIndex((item) => item._id === log._id);
                  const previousWeightForThisLog =
                    currentWeightIndex >= 0 ? weightLogs[currentWeightIndex - 1] : null;

                  return (
                    <li key={log._id}>
                      <div
                        className="row"
                        style={{ justifyContent: "space-between", width: "100%", gap: "1rem", alignItems: "flex-start" }}
                      >
                        <div
  style={{
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    
  }}
>
  <span className="badge vet">Vet</span>{" "}
  {log.title ? <strong>{log.title}</strong> : null}

  <div className="muted" style={{ marginTop: "0.2rem" }}>
    {log.completedAt ? <span>Recorded: {formatWhen(log.completedAt)}</span> : null}
  </div>

  {log.vetClinic ? <div>{log.vetClinic}</div> : null}

  
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
    {log.diagnosis && <div className="muted">Diagnosis: {log.diagnosis}</div>}
    {log.treatment && <div className="muted">Treatment: {log.treatment}</div>}
    {log.testsRecommended && <div className="muted">Tests: {log.testsRecommended}</div>}
    {log.medicineName && (
      <div className="muted">
        Medicine: {log.medicineName}
      </div>
    )}
    {log.vaccineName && (
      <div className="muted">Vaccine: {log.vaccineName}</div>
    )}
    {log.followUpDate && (
      <div className="muted">
        Next appointment date: {formatDateOnly(log.followUpDate)}
      </div>
    )}
    {log.weightKg != null && (
      <div className="muted">Weight: {log.weightKg} kg</div>
    )}
    {log.emergencyContactPhone && (
      <div className="muted">
        Doctor contact number: {log.emergencyContactPhone}
      </div>
    )}
  </div>
</div>

                        <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "0.55rem",
    alignItems: "flex-end",  
  }}
>
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

  <button
    type="button"
    className="btn secondary"
    onClick={() => downloadMedicalPdfFromLog(log)}
  >
    Download PDF
  </button>
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