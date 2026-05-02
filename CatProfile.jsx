import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCats } from "../context/CatContext.jsx";
import {
  AGE_OPTIONS,
  CAT_BREEDS_ORDERED,
  FOOD_INTAKE_OPTIONS,
  GENDERS,
  LITTER_CHANGE_OPTIONS,
  PLAY_TIME_OPTIONS,
  SLEEP_HOURS_OPTIONS,
  WATER_CHANGE_OPTIONS,
  matchBreedToOption,
  matchOption,
} from "../data/catProfileOptions.js";
import { dataUrlFromPasteEvent, fileToCompressedDataUrl } from "../utils/imageDataUrl.js";

const DIGIT_6 = /^[A-Za-z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\-]{4,10}$/;

const P = {
  breed: "— Select breed —",
  gender: "— Select —",
  age: "— Select —",
  sleep: "— Select —",
  food: "— Select —",
  water: "— Select —",
  litter: "— Select —",
  play: "— Select —",
};

const HOUR_OPTIONS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const MINUTE_OPTIONS = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const AM_PM_OPTIONS = ["AM", "PM"];

function cleanSelect(val, placeholder) {
  if (!val || val === placeholder) return "";
  return val;
}

function getExpectedFeedingCountFromText(textValue) {
  const text = String(textValue || "").toLowerCase().trim();

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

function getWaterReminderCountFromText(textValue) {
  const text = String(textValue || "").toLowerCase().trim();

  if (text.includes("twice daily") || text.includes("2x daily") || text.includes("2 times")) {
    return 2;
  }

  if (
    text.includes("once daily") ||
    text.includes("daily") ||
    text.includes("every 2 days") ||
    text.includes("every 3 days") ||
    text.includes("fountain") ||
    text.includes("empty or low") ||
    text.includes("other")
  ) {
    return 1;
  }

  return 0;
}

function getLitterReminderCountFromText(textValue) {
  const text = String(textValue || "").toLowerCase().trim();

  if (text.includes("scoop twice daily")) return 2;

  if (
    text.includes("scoop daily") ||
    text.includes("full clean") ||
    text.includes("weekly") ||
    text.includes("2 weeks") ||
    text.includes("monthly") ||
    text.includes("other")
  ) {
    return 1;
  }

  return 0;
}

function empty12HourTime() {
  return { hour: "09", minute: "00", ampm: "AM" };
}

function emptyForm() {
  return {
    username: "",
    accountPassword: "",
    name: "",
    breed: "",
    gender: "",
    ageCategory: "",
    sleepHours: "",
    foodIntake: "",
    waterChangePeriod: "",
    litterChangePeriod: "",
    playTimeApprox: "",
    birthDate: "",
    notes: "",
    photoData: "",
    photoUrl: "",

    feedingTime1: empty12HourTime(),
    feedingTime2: empty12HourTime(),
    feedingTime3: empty12HourTime(),
    feedingTime4: empty12HourTime(),

    waterReminderTimes: [empty12HourTime()],
    litterReminderTimes: [empty12HourTime()],
  };
}

function parse24To12(value) {
  const text = String(value || "").trim();
  if (!text || !text.includes(":")) return empty12HourTime();

  const [hhRaw, mmRaw] = text.split(":");
  let hh = Number(hhRaw);
  const mm = String(mmRaw || "00").padStart(2, "0");

  if (Number.isNaN(hh)) return empty12HourTime();

  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12;
  if (hh === 0) hh = 12;

  return {
    hour: String(hh).padStart(2, "0"),
    minute: mm,
    ampm,
  };
}

function format12To24(timeObj) {
  if (!timeObj) return "";
  let hour = Number(timeObj.hour || "09");
  const minute = String(timeObj.minute || "00").padStart(2, "0");
  const ampm = String(timeObj.ampm || "AM");

  if (Number.isNaN(hour)) return "";

  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function format24To12Display(value) {
  const t = parse24To12(value);
  return `${t.hour}:${t.minute} ${t.ampm}`;
}

function parseMultiTimeString(value, fallbackCount = 1) {
  const raw = String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!raw.length) {
    return Array.from({ length: fallbackCount }, () => empty12HourTime());
  }

  return raw.map(parse24To12);
}

function serializeMultiTimes(list, count) {
  return list
    .slice(0, count)
    .map(format12To24)
    .filter(Boolean)
    .join(" | ");
}

function SelectField({ id, label, value, onChange, options, placeholder }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value || ""} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt} value={opt === placeholder ? "" : opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function Time12Field({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <label>{label}</label>
      <div
        className="row"
        style={{
          gap: "0.5rem",
          flexWrap: "nowrap",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <select
          value={value.hour}
          onChange={(e) => onChange({ ...value, hour: e.target.value })}
          style={{ flex: 1, minWidth: 0 }}
        >
          {HOUR_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={value.minute}
          onChange={(e) => onChange({ ...value, minute: e.target.value })}
          style={{ flex: 1, minWidth: 0 }}
        >
          {MINUTE_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={value.ampm}
          onChange={(e) => onChange({ ...value, ampm: e.target.value })}
          style={{ flex: 1, minWidth: 0 }}
        >
          {AM_PM_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function CatProfile() {
  const { user, ready } = useAuth();
  const { cats, loading, error, refreshCats, selectedCatId, setSelectedCatId } = useCats();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [imgBusy, setImgBusy] = useState(false);
  const pasteRef = useRef(null);

  function handleLogin(catId) {
    setSelectedCatId(catId);
  }

  useEffect(() => {
    if (user && !editingId) {
      setForm((f) => ({
        ...f,
        username: f.username || user.username|| "",
      }));
    }
  }, [user, editingId]);

  const feedingCount = useMemo(() => getExpectedFeedingCountFromText(form.foodIntake), [form.foodIntake]);
  const waterReminderCount = useMemo(
    () => getWaterReminderCountFromText(form.waterChangePeriod),
    [form.waterChangePeriod]
  );
  const litterReminderCount = useMemo(
    () => getLitterReminderCountFromText(form.litterChangePeriod),
    [form.litterChangePeriod]
  );

  useEffect(() => {
    setForm((f) => ({
      ...f,
      waterReminderTimes:
        waterReminderCount > 0
          ? Array.from({ length: waterReminderCount }, (_, i) => f.waterReminderTimes[i] || empty12HourTime())
          : [],
    }));
  }, [waterReminderCount]);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      litterReminderTimes:
        litterReminderCount > 0
          ? Array.from({ length: litterReminderCount }, (_, i) => f.litterReminderTimes[i] || empty12HourTime())
          : [],
    }));
  }, [litterReminderCount]);

  function startEdit(cat) {
    setEditingId(cat._id);

    let foodIntake = matchOption(cat.foodIntake, FOOD_INTAKE_OPTIONS, P.food) || "";
    if (!foodIntake && cat.feedingScheduleNotes) {
      foodIntake = matchOption(cat.feedingScheduleNotes, FOOD_INTAKE_OPTIONS, P.food) || "";
    }

    const waterPeriod = matchOption(cat.waterChangePeriod, WATER_CHANGE_OPTIONS, P.water) || "";
    const litterPeriod = matchOption(cat.litterChangePeriod, LITTER_CHANGE_OPTIONS, P.litter) || "";

    setForm({
      username: cat.username || user?.username || "",
      accountPassword: "",
      name: cat.name || "",
      breed: cat.breed ? matchBreedToOption(cat.breed) : "",
      gender: matchOption(cat.gender, GENDERS, P.gender) || "",
      ageCategory: matchOption(cat.ageCategory, AGE_OPTIONS, P.age) || "",
      sleepHours: matchOption(cat.sleepHours, SLEEP_HOURS_OPTIONS, P.sleep) || "",
      foodIntake,
      waterChangePeriod: waterPeriod,
      litterChangePeriod: litterPeriod,
      playTimeApprox: matchOption(cat.playTimeApprox, PLAY_TIME_OPTIONS, P.play) || "",
      birthDate: cat.birthDate ? cat.birthDate.slice(0, 10) : "",
      notes: cat.notes || "",
      photoData: cat.photoData || "",
      photoUrl: cat.photoUrl || "",

      feedingTime1: parse24To12(cat.feedingTime1),
      feedingTime2: parse24To12(cat.feedingTime2),
      feedingTime3: parse24To12(cat.feedingTime3),
      feedingTime4: parse24To12(cat.feedingTime4),

      waterReminderTimes: parseMultiTimeString(
        cat.waterReminderTime,
        Math.max(getWaterReminderCountFromText(waterPeriod), 1)
      ),
      litterReminderTimes: parseMultiTimeString(
        cat.litterReminderTime,
        Math.max(getLitterReminderCountFromText(litterPeriod), 1)
      ),
    });

    setMsg(null);
    setSelectedCatId(cat._id);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
    setMsg(null);
  }

  async function applyImageFile(file) {
    setImgBusy(true);
    setMsg(null);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setForm((f) => ({ ...f, photoData: dataUrl, photoUrl: "" }));
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Could not use image." });
    } finally {
      setImgBusy(false);
    }
  }

  async function onPaste(e) {
    e.preventDefault();
    setImgBusy(true);
    setMsg(null);
    try {
      const dataUrl = await dataUrlFromPasteEvent(e);
      setForm((f) => ({ ...f, photoData: dataUrl, photoUrl: "" }));
    } catch {
      setMsg({ type: "error", text: "Clipboard has no image. Copy a picture first, then paste here." });
    } finally {
      setImgBusy(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      setMsg({ type: "error", text: "Cat name is required." });
      return;
    }

    if (!String(form.username || "").trim()) {
      setMsg({ type: "error", text: "Username is required." });
      return;
    }

    if (!DIGIT_6.test(String(form.accountPassword || ""))) {
      setMsg({
        type: "error",
        text: "Password must be 4-10 characters and include alphabets, numbers, or special characters.",
      });
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      const breedVal = cleanSelect(form.breed, P.breed);

      const payload = {
        username: String(form.username).trim(),
        password: String(form.accountPassword),
        name: form.name.trim(),
        breed: breedVal,
        gender: cleanSelect(form.gender, P.gender),
        ageCategory: cleanSelect(form.ageCategory, P.age),
        sleepHours: cleanSelect(form.sleepHours, P.sleep),
        foodIntake: cleanSelect(form.foodIntake, P.food),
        waterChangePeriod: cleanSelect(form.waterChangePeriod, P.water),
        litterChangePeriod: cleanSelect(form.litterChangePeriod, P.litter),
        playTimeApprox: cleanSelect(form.playTimeApprox, P.play),
        birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : null,
        notes: form.notes,
        photoData: form.photoData || "",
        photoUrl: form.photoData ? "" : form.photoUrl || "",
        feedingScheduleNotes: cleanSelect(form.foodIntake, P.food) || form.notes || "",

        feedingTime1: feedingCount >= 1 ? format12To24(form.feedingTime1) : "",
        feedingTime2: feedingCount >= 2 ? format12To24(form.feedingTime2) : "",
        feedingTime3: feedingCount >= 3 ? format12To24(form.feedingTime3) : "",
        feedingTime4: feedingCount >= 4 ? format12To24(form.feedingTime4) : "",

        waterReminderTime:
          waterReminderCount > 0 ? serializeMultiTimes(form.waterReminderTimes, waterReminderCount) : "",
        litterReminderTime:
          litterReminderCount > 0 ? serializeMultiTimes(form.litterReminderTimes, litterReminderCount) : "",
      };

      if (editingId) {
        await api.updateCat(editingId, payload);
        setMsg({ type: "ok", text: "Profile updated." });
      } else {
        const created = await api.createCat(payload);
        setSelectedCatId(created._id);
        setMsg({ type: "ok", text: "Cat added." });
        setForm(emptyForm());
      }

      await refreshCats();

      if (editingId) cancelEdit();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this cat and all care logs?")) return;

    setSaving(true);
    try {
      await api.deleteCat(id);

      if (selectedCatId === id) {
        const remainingCats = cats.filter((cat) => cat._id !== id);
        setSelectedCatId(remainingCats[0]?._id || "");
      }

      await refreshCats();
      setMsg({ type: "ok", text: "Cat removed." });
      cancelEdit();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  const breedOptionsForSelect = CAT_BREEDS_ORDERED;
  const previewSrc = form.photoData || form.photoUrl || null;

  if (!ready) {
    return (
      <div className="page">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <h1>Cat profiles</h1>
        <div className="alert">
          Please <Link to="/login">sign in</Link> or <Link to="/signup">sign up</Link> to manage cats.
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}>
        <h1>Cat profiles</h1>
        <p className="lede" style={{ marginInline: "auto" }}>
          You can add a cat profile or edit the existing cat profile, and you can login to any of your cat profiles.
        </p>
      </div>

      {error && <div className="alert error" style={{ maxWidth: "760px", margin: "0 auto 1rem" }}>{error}</div>}
      {msg?.type === "error" && (
        <div className="alert error" style={{ maxWidth: "760px", margin: "0 auto 1rem" }}>
          {msg.text}
        </div>
      )}
      {msg?.type === "ok" && (
        <div className="alert" style={{ maxWidth: "760px", margin: "0 auto 1rem" }}>
          {msg.text}
        </div>
      )}

      <div style={{ maxWidth: "580px", margin: "0 auto", display: "grid", gap: "1rem" }}>
        <div className="card">
          <h2
            style={{
              marginTop: 0,
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              textAlign: "center",
            }}
          >
            Your cats
          </h2>

          {loading ? (
            <p className="muted">Loading…</p>
          ) : !cats.length ? (
            <p className="muted">No cats yet. Use the form below to add one.</p>
          ) : (
            <ul className="list-plain" style={{ textAlign: "center" }}>
              {cats.map((c) => {
                const thumb = c.photoData || c.photoUrl;
                const waterTimes = String(c.waterReminderTime || "")
                  .split("|")
                  .map((item) => item.trim())
                  .filter(Boolean);
                const litterTimes = String(c.litterReminderTime || "")
                  .split("|")
                  .map((item) => item.trim())
                  .filter(Boolean);

                return (
                  <li key={c._id}>
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "0.4rem 0",
    }}
  >
    {thumb ? (
      <img
        src={thumb}
        alt=""
        style={{
          width: 300,
          height: 300,
          objectFit: "cover",
          borderRadius: "30px",
          border: "1px solid var(--line)",
          marginBottom: "0.75rem",
        }}
      />
    ) : null}

    <div style={{ width: "100%" }}>
      <div style={{ fontSize: "1.8rem", fontWeight: 1000, color: "var(--ink)", marginBottom: "0.5rem" }}>
        {c.name}
      </div>

      <div
  className="muted"
  style={{
    marginTop: "0.75rem",
    fontSize: "1.05rem",
    lineHeight: 1.8,
    textAlign: "center",
  
  }}
>
        {[c.breed, c.gender, c.ageCategory].filter(Boolean).join(" · ") || ""}
      </div>

      {c.username ? (
        <div
  className="muted"
  style={{
    marginTop: "0.75rem",
    fontSize: "1.05rem",
    lineHeight: 1.8,
    textAlign: "left",
    maxWidth: "235px",
    marginLeft: "auto",
    marginRight: "auto",
  }}
>
          Username: {c.username}
        </div>
      ) : null}

      <div
  className="muted"
  style={{
    marginTop: "0.75rem",
    fontSize: "1.05rem",
    lineHeight: 1.8,
    textAlign: "left",
    maxWidth: "235px",
    marginLeft: "auto",
    marginRight: "auto",
  }}
>
        {c.foodIntake ? <div>Food: {c.foodIntake}</div> : null}
        {c.waterChangePeriod ? <div>Water: {c.waterChangePeriod}</div> : null}
        {c.litterChangePeriod ? <div>Litter: {c.litterChangePeriod}</div> : null}
        {c.sleepHours ? <div>Sleep: {c.sleepHours}</div> : null}
        {c.playTimeApprox ? <div>Play: {c.playTimeApprox}</div> : null}
        {!c.foodIntake && c.feedingScheduleNotes ? <div>Food: {c.feedingScheduleNotes}</div> : null}

        {c.feedingTime1 ? <div>Feed time 1: {format24To12Display(c.feedingTime1)}</div> : null}
        {c.feedingTime2 ? <div>Feed time 2: {format24To12Display(c.feedingTime2)}</div> : null}
        {c.feedingTime3 ? <div>Feed time 3: {format24To12Display(c.feedingTime3)}</div> : null}
        {c.feedingTime4 ? <div>Feed time 4: {format24To12Display(c.feedingTime4)}</div> : null}

        {waterTimes.length
          ? waterTimes.map((t, i) => (
              <div key={`water-${c._id}-${i}`}>
                Water reminder {i + 1}: {format24To12Display(t)}
              </div>
            ))
          : null}

        {litterTimes.length
          ? litterTimes.map((t, i) => (
              <div key={`litter-${c._id}-${i}`}>
                Litter reminder {i + 1}: {format24To12Display(t)}
              </div>
            ))
          : null}
      </div>
    </div>

    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "0.8rem",
        flexWrap: "wrap",
        marginTop: "1rem",
      }}
    >
      <button
        type="button"
        className="btn"
        onClick={() => handleLogin(c._id)}
        disabled={selectedCatId && selectedCatId !== c._id}
      >
        {selectedCatId === c._id ? "Logged In" : "Login"}
      </button>

      <button type="button" className="btn secondary" onClick={() => startEdit(c)}>
        Edit
      </button>

      <button
        type="button"
        className="btn danger"
        onClick={() => handleDelete(c._id)}
        disabled={saving}
      >
        Delete
      </button>
    </div>
  </div>
</li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card">
          <h2
            style={{
              marginTop: 0,
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              textAlign: "center",
            }}
          >
            {editingId ? "Edit cat" : "Add a cat"}
          </h2>

          <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
            <div style={{ marginBottom: "0.75rem" }}>
  <label htmlFor="username">Username *</label>
  <input
    id="username"
    placeholder={user.username}
    value={form.username}
    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
    required
    autoComplete="username"
  />
  <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.82rem" }}>
    Must match your sign-up username.
  </p>
</div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label htmlFor="acct-pass">Your account password (4-10 characters) *</label>
              <input
                id="acct-pass"
                type="password"
                maxLength={10}
                autoComplete="current-password"
                value={form.accountPassword}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    accountPassword: e.target.value.slice(0, 10),
                  }))
                }
                required
              />
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label htmlFor="name">Cat name *</label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoComplete="off"
              />
            </div>

            <SelectField
              id="breed"
              label="Breed"
              value={form.breed}
              onChange={(v) => setForm((f) => ({ ...f, breed: v }))}
              options={breedOptionsForSelect}
              placeholder={P.breed}
            />

            <SelectField
              id="gender"
              label="Gender"
              value={form.gender}
              onChange={(v) => setForm((f) => ({ ...f, gender: v }))}
              options={GENDERS}
              placeholder={P.gender}
            />

            <SelectField
              id="age"
              label="Age"
              value={form.ageCategory}
              onChange={(v) => setForm((f) => ({ ...f, ageCategory: v }))}
              options={AGE_OPTIONS}
              placeholder={P.age}
            />

            <SelectField
              id="sleep"
              label="Sleep (approx.)"
              value={form.sleepHours}
              onChange={(v) => setForm((f) => ({ ...f, sleepHours: v }))}
              options={SLEEP_HOURS_OPTIONS}
              placeholder={P.sleep}
            />

            <SelectField
              id="food"
              label="Food intake — how often & when"
              value={form.foodIntake}
              onChange={(v) =>
                setForm((f) => ({
                  ...f,
                  foodIntake: v,
                  feedingTime2: getExpectedFeedingCountFromText(v) >= 2 ? f.feedingTime2 : empty12HourTime(),
                  feedingTime3: getExpectedFeedingCountFromText(v) >= 3 ? f.feedingTime3 : empty12HourTime(),
                  feedingTime4: getExpectedFeedingCountFromText(v) >= 4 ? f.feedingTime4 : empty12HourTime(),
                }))
              }
              options={FOOD_INTAKE_OPTIONS}
              placeholder={P.food}
            />

            <h3 style={{ marginTop: "1rem", marginBottom: "0.75rem", fontSize: "1rem" }}>
              Exact feeding reminder times
            </h3>

            {feedingCount >= 1 ? (
              <Time12Field
                label="Feeding time 1"
                value={form.feedingTime1}
                onChange={(v) => setForm((f) => ({ ...f, feedingTime1: v }))}
              />
            ) : null}

            {feedingCount >= 2 ? (
              <Time12Field
                label="Feeding time 2"
                value={form.feedingTime2}
                onChange={(v) => setForm((f) => ({ ...f, feedingTime2: v }))}
              />
            ) : null}

            {feedingCount >= 3 ? (
              <Time12Field
                label="Feeding time 3"
                value={form.feedingTime3}
                onChange={(v) => setForm((f) => ({ ...f, feedingTime3: v }))}
              />
            ) : null}

            {feedingCount >= 4 ? (
              <Time12Field
                label="Feeding time 4"
                value={form.feedingTime4}
                onChange={(v) => setForm((f) => ({ ...f, feedingTime4: v }))}
              />
            ) : null}

            <SelectField
              id="water"
              label="Water change period"
              value={form.waterChangePeriod}
              onChange={(v) => setForm((f) => ({ ...f, waterChangePeriod: v }))}
              options={WATER_CHANGE_OPTIONS}
              placeholder={P.water}
            />

            {waterReminderCount > 0 ? (
              <>
                <h3 style={{ marginTop: "1rem", marginBottom: "0.75rem", fontSize: "1rem" }}>
                  Exact water reminder times
                </h3>
                {Array.from({ length: waterReminderCount }).map((_, index) => (
                  <Time12Field
                    key={`water-time-${index}`}
                    label={`Water reminder time ${index + 1}`}
                    value={form.waterReminderTimes[index] || empty12HourTime()}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        waterReminderTimes: f.waterReminderTimes.map((item, i) =>
                          i === index ? v : item
                        ),
                      }))
                    }
                  />
                ))}
              </>
            ) : null}

            <SelectField
              id="litter"
              label="Litter box change period"
              value={form.litterChangePeriod}
              onChange={(v) => setForm((f) => ({ ...f, litterChangePeriod: v }))}
              options={LITTER_CHANGE_OPTIONS}
              placeholder={P.litter}
            />

            {litterReminderCount > 0 ? (
              <>
                <h3 style={{ marginTop: "1rem", marginBottom: "0.75rem", fontSize: "1rem" }}>
                  Exact litter reminder times
                </h3>
                {Array.from({ length: litterReminderCount }).map((_, index) => (
                  <Time12Field
                    key={`litter-time-${index}`}
                    label={`Litter reminder time ${index + 1}`}
                    value={form.litterReminderTimes[index] || empty12HourTime()}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        litterReminderTimes: f.litterReminderTimes.map((item, i) =>
                          i === index ? v : item
                        ),
                      }))
                    }
                  />
                ))}
              </>
            ) : null}

            <SelectField
              id="play"
              label="Playing time (approx.)"
              value={form.playTimeApprox}
              onChange={(v) => setForm((f) => ({ ...f, playTimeApprox: v }))}
              options={PLAY_TIME_OPTIONS}
              placeholder={P.play}
            />

            <div style={{ marginBottom: "0.75rem" }}>
              <label htmlFor="birth">Birth date (optional)</label>
              <input
                id="birth"
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
              />
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label>Photo (optional)</label>
              <div
                ref={pasteRef}
                tabIndex={0}
                onPaste={onPaste}
                className="photo-drop"
                style={{
                  border: "2px dashed var(--line)",
                  borderRadius: "12px",
                  padding: "0.75rem",
                  marginTop: "0.35rem",
                  background: "var(--surface-2)",
                  outline: "none",
                }}
              >
                <p className="muted" style={{ margin: "0 0 0.5rem", fontSize: "0.88rem" }}>
                  Click here, then paste an image or choose a file.
                </p>

                <input
                  type="file"
                  accept="image/*"
                  disabled={imgBusy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) applyImageFile(f);
                  }}
                />

                {imgBusy ? <p className="muted" style={{ margin: "0.5rem 0 0" }}>Processing…</p> : null}

                {previewSrc ? (
                  <div style={{ marginTop: "0.75rem" }}>
                    <img
                      src={previewSrc}
                      alt="Preview"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "200px",
                        borderRadius: "8px",
                        border: "1px solid var(--line)",
                      }}
                    />
                    <div className="row" style={{ marginTop: "0.5rem" }}>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => setForm((f) => ({ ...f, photoData: "", photoUrl: "" }))}
                      >
                        Remove photo
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="row" style={{ justifyContent: "center" }}>
              <button type="submit" className="btn" disabled={saving || imgBusy}>
                {editingId ? "Save changes" : "Add cat"}
              </button>

              {editingId ? (
                <button
                  type="button"
                  className="btn secondary"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}