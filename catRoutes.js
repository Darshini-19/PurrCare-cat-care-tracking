import express from "express";
import Cat from "../models/Cat.js";
import CareLog from "../models/CareLog.js";
import User, { DIGIT_PASSWORD_REGEX } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { OWNER_NOT_REGISTERED } from "../constants/messages.js";
import PDFDocument from "pdfkit";

const router = express.Router();

async function assertUsernameRegistered(username, reqUser) {
  const usernameTrim = String(username || "").trim();
  if (!usernameTrim) {
    return { error: { status: 400, message: "Username is required." } };
  }

  const registered = await User.findOne({
    usernameNormalized: usernameTrim.toLowerCase(),
  });

  if (!registered) {
    return {
      error: {
        status: 400,
        message: "This username is not registered. Please use your signed-up username.",
      },
    };
  }

  if (!registered._id.equals(reqUser._id)) {
    return {
      error: {
        status: 403,
        message: "Use your registered username, or sign in as that user.",
      },
    };
  }

  return { registered, usernameTrim };
}
async function verifyAccountPassword(userId, plain) {
  if (!plain || !DIGIT_PASSWORD_REGEX.test(String(plain))) {
    return {
      ok: false,
      status: 400,
      message: "Enter your account password to confirm.",
    };
  }

  const u = await User.findById(userId).select("+passwordHash");
  if (!u || !(await u.comparePassword(plain))) {
    return { ok: false, status: 401, message: "Incorrect password." };
  }

  return { ok: true };
}

async function getOwnedCat(catId, userId) {
  const cat = await Cat.findById(catId);
  if (!cat) return null;
  if (!cat.userId || !cat.userId.equals(userId)) return null;
  return cat;
}

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function normalizeCatPayload(body) {
  return {
    ...body,
    username: normalizeString(body.username),
    name: normalizeString(body.name),
    breed: normalizeString(body.breed),
    gender: normalizeString(body.gender),
    ageCategory: normalizeString(body.ageCategory),
    sleepHours: normalizeString(body.sleepHours),
    foodIntake: normalizeString(body.foodIntake),
    waterChangePeriod: normalizeString(body.waterChangePeriod),
    litterChangePeriod: normalizeString(body.litterChangePeriod),
    playTimeApprox: normalizeString(body.playTimeApprox),
    notes: String(body.notes || ""),
    feedingScheduleNotes: String(body.feedingScheduleNotes || ""),
    photoUrl: String(body.photoUrl || ""),
    photoData: String(body.photoData || ""),
    feedingTime1: normalizeString(body.feedingTime1),
    feedingTime2: normalizeString(body.feedingTime2),
    feedingTime3: normalizeString(body.feedingTime3),
    feedingTime4: normalizeString(body.feedingTime4),
    waterReminderTime: normalizeString(body.waterReminderTime),
    litterReminderTime: normalizeString(body.litterReminderTime),
    birthDate: body.birthDate ? new Date(body.birthDate) : null,
  };
}

function normalizeLogPayload(body, catId) {
  const payload = { ...body, cat: catId };

  payload.title = normalizeString(payload.title);
  payload.notes = normalizeString(payload.notes);
  payload.vetClinic = normalizeString(payload.vetClinic);
  payload.doctorName = normalizeString(payload.doctorName);
  payload.visitStatus = normalizeString(payload.visitStatus);
  payload.diagnosis = normalizeString(payload.diagnosis);
  payload.treatment = normalizeString(payload.treatment);
  payload.testsRecommended = normalizeString(payload.testsRecommended);
  payload.followUpAdvice = normalizeString(payload.followUpAdvice);

  payload.medicineName = normalizeString(payload.medicineName);
  payload.medicineDosage = normalizeString(payload.medicineDosage);
  payload.medicineFrequency = normalizeString(payload.medicineFrequency);
  payload.medicineReminderTime1 = normalizeString(payload.medicineReminderTime1);
  payload.medicineReminderTime2 = normalizeString(payload.medicineReminderTime2);
  payload.medicineReminderTime3 = normalizeString(payload.medicineReminderTime3);

  payload.vaccineName = normalizeString(payload.vaccineName);
  payload.vaccineStatus = normalizeString(payload.vaccineStatus);
  payload.emergencyContactName = normalizeString(payload.emergencyContactName);
  payload.emergencyContactPhone = normalizeString(payload.emergencyContactPhone);

  payload.reminderNote = normalizeString(payload.reminderNote);
  payload.litterAction = normalizeString(payload.litterAction);
  payload.mood = normalizeString(payload.mood);
  payload.sleepHoursLogged = normalizeString(payload.sleepHoursLogged);
  payload.reminderType = normalizeString(payload.reminderType);

  payload.symptoms = normalizeStringArray(payload.symptoms);

  if (payload.weightKg !== undefined && payload.weightKg !== null && payload.weightKg !== "") {
    payload.weightKg = Number(payload.weightKg);
  } else {
    payload.weightKg = null;
  }

  if (payload.costTotal !== undefined && payload.costTotal !== null && payload.costTotal !== "") {
    payload.costTotal = Number(payload.costTotal);
  } else {
    payload.costTotal = null;
  }

  if (
    payload.medicineDurationDays !== undefined &&
    payload.medicineDurationDays !== null &&
    payload.medicineDurationDays !== ""
  ) {
    payload.medicineDurationDays = Number(payload.medicineDurationDays);
  } else {
    payload.medicineDurationDays = null;
  }

  if (payload.scheduledFor) payload.scheduledFor = new Date(payload.scheduledFor);
  if (payload.completedAt) payload.completedAt = new Date(payload.completedAt);
  if (payload.followUpDate) payload.followUpDate = new Date(payload.followUpDate);
  if (payload.vaccineDueDate) payload.vaccineDueDate = new Date(payload.vaccineDueDate);

  return payload;
}

function hasUsefulVetDetails(payload) {
  return Boolean(
    payload.title ||
      payload.notes ||
      payload.vetClinic ||
      payload.doctorName ||
      payload.visitStatus ||
      payload.diagnosis ||
      payload.treatment ||
      payload.testsRecommended ||
      payload.followUpAdvice ||
      payload.followUpDate ||
      payload.medicineName ||
      payload.medicineDosage ||
      payload.medicineFrequency ||
      payload.medicineDurationDays !== null ||
      payload.medicineReminderTime1 ||
      payload.medicineReminderTime2 ||
      payload.medicineReminderTime3 ||
      payload.vaccineName ||
      payload.vaccineDueDate ||
      payload.vaccineStatus ||
      payload.weightKg !== null ||
      payload.costTotal !== null ||
      (Array.isArray(payload.symptoms) && payload.symptoms.length > 0) ||
      payload.emergencyContactName ||
      payload.emergencyContactPhone ||
      payload.reminderNote ||
      payload.scheduledFor ||
      payload.completedAt
  );
}

function safePdfText(value) {
  return String(value ?? "").trim() || "—";
}

function safePdfDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

router.use(requireAuth);

router.get("/cats", async (req, res) => {
  try {
    const cats = await Cat.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/cats/:id", async (req, res) => {
  try {
    const cat = await Cat.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!cat) return res.status(404).json({ message: "Cat not found" });
    res.json(cat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/cats", async (req, res) => {
  try {
    const { username, password, userId: _u1, ...rest } = req.body;

    const pw = await verifyAccountPassword(req.user._id, password);
    if (!pw.ok) {
      return res.status(pw.status).json({ message: pw.message });
    }

    const check = await assertUsernameRegistered(username, req.user);
    if (check.error) {
      return res.status(check.error.status).json({ message: check.error.message });
    }

    const normalized = normalizeCatPayload(rest);

    const body = {
      ...normalized,
      userId: req.user._id,
      username: check.registered.username,
    };

    const cat = new Cat(body);
    await cat.save();
    res.status(201).json(cat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/cats/:id", async (req, res) => {
  try {
    const existing = await getOwnedCat(req.params.id, req.user._id);
    if (!existing) return res.status(404).json({ message: "Cat not found" });

    const { username, password, userId: _u2, ...rest } = req.body;

    const pw = await verifyAccountPassword(req.user._id, password);
    if (!pw.ok) {
      return res.status(pw.status).json({ message: pw.message });
    }

    const check = await assertUsernameRegistered(username, req.user);
    if (check.error) {
      return res.status(check.error.status).json({ message: check.error.message });
    }

    const normalized = normalizeCatPayload(rest);

    const body = {
      ...normalized,
      userId: req.user._id,
      username: check.registered.username,
    };

    const cat = await Cat.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });

    res.json(cat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/cats/:id", async (req, res) => {
  try {
    const existing = await getOwnedCat(req.params.id, req.user._id);
    if (!existing) return res.status(404).json({ message: "Cat not found" });

    await CareLog.deleteMany({ cat: req.params.id });
    await Cat.findByIdAndDelete(req.params.id);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/cats/:catId/logs", async (req, res) => {
  try {
    const cat = await getOwnedCat(req.params.catId, req.user._id);
    if (!cat) return res.status(404).json({ message: "Cat not found" });

    const { category } = req.query;
    const filter = { cat: req.params.catId };
    if (category) filter.category = category;

    const logs = await CareLog.find(filter).sort({ updatedAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/cats/:catId/logs", async (req, res) => {
  try {
    const cat = await getOwnedCat(req.params.catId, req.user._id);
    if (!cat) return res.status(404).json({ message: "Cat not found" });

    const payload = normalizeLogPayload(req.body, req.params.catId);

    if (!["feeding", "water", "litter", "vet", "mood", "sleep"].includes(payload.category)) {
      return res.status(400).json({ message: "Invalid log category." });
    }

    if (payload.category !== "vet") {
      if (!payload.title && !payload.notes) {
        return res.status(400).json({
          message: "Please enter some details before logging.",
        });
      }
    } else {
      if (!hasUsefulVetDetails(payload)) {
        return res.status(400).json({
          message: "Please add at least one vet detail before saving.",
        });
      }
    }

    if (!payload.completedAt && payload.category !== "vet") {
      payload.completedAt = new Date();
    }

    const log = new CareLog(payload);
    await log.save();

    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post("/cats/:catId/medical-record-pdf", async (req, res) => {
  try {
    const cat = await getOwnedCat(req.params.catId, req.user._id);
    if (!cat) return res.status(404).json({ message: "Cat not found" });

    const payload = normalizeLogPayload(req.body, req.params.catId);

    if (!hasUsefulVetDetails(payload)) {
      return res.status(400).json({
        message: "Please add at least one medical detail before generating PDF.",
      });
    }

    const fileDate = payload.completedAt
      ? new Date(payload.completedAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const filename = `${String(cat.name || "cat")
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()}-medical-record-${fileDate}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(res);

    doc.fontSize(20).text("PurrCare Medical Record", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Cat Name: ${safePdfText(cat.name)}`);
    doc.text(`Username: ${safePdfText(cat.username)}`);
    doc.text(`Recorded On: ${safePdfDate(payload.completedAt || new Date())}`);
    doc.moveDown();

    doc.fontSize(14).text("Visit Details", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Clinic: ${safePdfText(payload.vetClinic)}`);
    doc.text(`Doctor Name: ${safePdfText(payload.doctorName)}`);
    doc.text(`Visit Status: ${safePdfText(payload.visitStatus)}`);
    doc.text(
      `Appointment Kept: ${
        payload.appointmentKept === true
          ? "Yes"
          : payload.appointmentKept === false
            ? "No"
            : "—"
      }`
    );
    doc.moveDown();

    doc.fontSize(14).text("Health Details", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(
      `Symptoms: ${Array.isArray(payload.symptoms) && payload.symptoms.length ? payload.symptoms.join(", ") : "—"}`
    );
    doc.text(`Diagnosis: ${safePdfText(payload.diagnosis)}`);
    doc.text(`Treatment: ${safePdfText(payload.treatment)}`);
    doc.text(`Tests Recommended: ${safePdfText(payload.testsRecommended)}`);
    doc.moveDown();

    doc.fontSize(14).text("Medicine", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Medicine Name: ${safePdfText(payload.medicineName)}`);
    doc.text(`Dosage: ${safePdfText(payload.medicineDosage)}`);
    doc.text(`Frequency: ${safePdfText(payload.medicineFrequency)}`);
    doc.text(
      `Duration (Days): ${
        payload.medicineDurationDays != null ? payload.medicineDurationDays : "—"
      }`
    );
    doc.moveDown();

    doc.fontSize(14).text("Vaccine", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Vaccine Name: ${safePdfText(payload.vaccineName)}`);
    doc.text(`Vaccine Due Date: ${safePdfDate(payload.vaccineDueDate)}`);
    doc.text(`Vaccine Status: ${safePdfText(payload.vaccineStatus)}`);
    doc.moveDown();

    doc.fontSize(14).text("Follow-up & Extra Info", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Follow-up Date: ${safePdfDate(payload.followUpDate)}`);
    doc.text(`Follow-up Advice: ${safePdfText(payload.followUpAdvice)}`);
    doc.text(`Weight (kg): ${payload.weightKg != null ? payload.weightKg : "—"}`);
    doc.text(`Cost: ${payload.costTotal != null ? payload.costTotal : "—"}`);
    doc.text(`Emergency Contact Name: ${safePdfText(payload.emergencyContactName)}`);
    doc.text(`Emergency Contact Phone: ${safePdfText(payload.emergencyContactPhone)}`);
    doc.moveDown();

    doc.fontSize(14).text("Notes", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(safePdfText(payload.notes), {
      width: 500,
      align: "left",
    });

    doc.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ message: err.message || "Could not generate medical record PDF." });
    }
  }
});

router.put("/logs/:logId", async (req, res) => {
  try {
    const existing = await CareLog.findById(req.params.logId);
    if (!existing) return res.status(404).json({ message: "Log not found" });

    const cat = await getOwnedCat(existing.cat, req.user._id);
    if (!cat) return res.status(404).json({ message: "Log not found" });

    const payload = normalizeLogPayload(req.body, existing.cat);

    if (
      payload.category &&
      !["feeding", "water", "litter", "vet", "mood", "sleep"].includes(payload.category)
    ) {
      return res.status(400).json({ message: "Invalid log category." });
    }

    const nextCategory = payload.category || existing.category;
    const nextTitle = payload.title ?? existing.title;
    const nextNotes = payload.notes ?? existing.notes;

    if (nextCategory !== "vet") {
      if (!String(nextTitle || "").trim() && !String(nextNotes || "").trim()) {
        return res.status(400).json({
          message: "Please enter some details before saving.",
        });
      }
    } else {
      const mergedPayload = {
        ...existing.toObject(),
        ...payload,
      };

      if (!hasUsefulVetDetails(mergedPayload)) {
        return res.status(400).json({
          message: "Please add at least one vet detail before saving.",
        });
      }
    }

    const updated = await CareLog.findByIdAndUpdate(
      req.params.logId,
      { ...payload, cat: existing.cat },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/logs/:logId", async (req, res) => {
  try {
    const log = await CareLog.findById(req.params.logId);
    if (!log) return res.status(404).json({ message: "Log not found" });

    const cat = await getOwnedCat(log.cat, req.user._id);
    if (!cat) return res.status(404).json({ message: "Log not found" });

    await CareLog.findByIdAndDelete(req.params.logId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    const cats = await Cat.find({ userId: req.user._id });
    const catIds = cats.map((c) => c._id);

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recent = await CareLog.find({
      cat: { $in: catIds },
      completedAt: { $gte: since24h },
    })
      .populate("cat", "name")
      .sort({ completedAt: -1 });

    const upcomingVet = await CareLog.find({
      category: "vet",
      scheduledFor: { $gte: new Date() },
      cat: { $in: catIds },
    })
      .populate("cat", "name")
      .sort({ scheduledFor: 1 })
      .limit(5);

    res.json({ cats, recentLogs: recent, upcomingVet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;