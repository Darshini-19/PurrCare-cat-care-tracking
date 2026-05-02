import mongoose from "mongoose";

const careLogSchema = new mongoose.Schema(
  {
    cat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cat",
      required: true,
      index: true,
    },

    category: {
      type: String,
      required: true,
      enum: ["feeding", "water", "litter", "vet", "mood", "sleep"],
      index: true,
    },

    completedAt: { type: Date, default: null },
    scheduledFor: { type: Date, default: null },

    title: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },

    litterAction: {
      type: String,
      enum: ["scoop", "full_clean", "replace_litter", ""],
      default: "",
    },

    mood: {
      type: String,
      enum: ["normal", "playful", "sleepy", "restless", "hiding", "not_eating_well", ""],
      default: "",
      trim: true,
    },

    sleepHoursLogged: { type: String, default: "", trim: true },

    isReminder: { type: Boolean, default: false },
    reminderType: { type: String, default: "", trim: true },
    reminderNote: { type: String, default: "", trim: true },

    vetClinic: { type: String, default: "", trim: true },
    doctorName: { type: String, default: "", trim: true },
    appointmentKept: { type: Boolean, default: null },

    visitStatus: {
      type: String,
      enum: ["", "scheduled", "completed", "missed", "rescheduled", "cancelled"],
      default: "",
      trim: true,
      index: true,
    },

    symptoms: {
      type: [String],
      default: [],
    },

    diagnosis: { type: String, default: "", trim: true },
    treatment: { type: String, default: "", trim: true },
    testsRecommended: { type: String, default: "", trim: true },

    followUpDate: { type: Date, default: null },
    followUpAdvice: { type: String, default: "", trim: true },

    weightKg: { type: Number, default: null, min: 0 },
    costTotal: { type: Number, default: null, min: 0 },

    medicineName: { type: String, default: "", trim: true },
    medicineDosage: { type: String, default: "", trim: true },
    medicineFrequency: { type: String, default: "", trim: true },
    medicineDurationDays: { type: Number, default: null, min: 0 },

    medicineReminderTime1: { type: String, default: "", trim: true },
    medicineReminderTime2: { type: String, default: "", trim: true },
    medicineReminderTime3: { type: String, default: "", trim: true },

    vaccineName: { type: String, default: "", trim: true },
    vaccineDueDate: { type: Date, default: null },
    vaccineStatus: {
      type: String,
      enum: ["", "due", "given", "overdue"],
      default: "",
      trim: true,
    },

    emergencyContactName: { type: String, default: "", trim: true },
    emergencyContactPhone: { type: String, default: "", trim: true },

    reportName: { type: String, default: "", trim: true },
    reportType: { type: String, default: "", trim: true },
    reportData: { type: String, default: "" },
  },
  { timestamps: true }
);

careLogSchema.pre("save", function (next) {
  if (this.category !== "vet") {
    const title = (this.title || "").trim();
    const notes = (this.notes || "").trim();

    if (!title && !notes) {
      return next(new Error("Log must contain at least a title or notes."));
    }
  } else {
    const hasVetData =
      (this.title || "").trim() ||
      (this.notes || "").trim() ||
      (this.vetClinic || "").trim() ||
      (this.doctorName || "").trim() ||
      (this.visitStatus || "").trim() ||
      (this.diagnosis || "").trim() ||
      (this.treatment || "").trim() ||
      (this.testsRecommended || "").trim() ||
      (this.followUpAdvice || "").trim() ||
      this.followUpDate ||
      (this.medicineName || "").trim() ||
      (this.medicineDosage || "").trim() ||
      (this.medicineFrequency || "").trim() ||
      this.medicineDurationDays !== null ||
      (this.medicineReminderTime1 || "").trim() ||
      (this.medicineReminderTime2 || "").trim() ||
      (this.medicineReminderTime3 || "").trim() ||
      (this.vaccineName || "").trim() ||
      this.vaccineDueDate ||
      (this.vaccineStatus || "").trim() ||
      this.weightKg !== null ||
      this.costTotal !== null ||
      (Array.isArray(this.symptoms) && this.symptoms.length > 0) ||
      (this.emergencyContactName || "").trim() ||
      (this.emergencyContactPhone || "").trim() ||
      (this.reportName || "").trim() ||
      (this.reportType || "").trim() ||
      (this.reportData || "").trim() ||
      (this.reminderNote || "").trim() ||
      this.scheduledFor ||
      this.completedAt;

    if (!hasVetData) {
      return next(new Error("Vet log must contain at least one useful detail."));
    }
  }

  next();
});

export default mongoose.model("CareLog", careLogSchema);