import mongoose from "mongoose";

const catSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, default: null },
    userame: { type: String, default: "", trim: true },
    name: { type: String, required: true, trim: true },
    breed: { type: String, default: "", trim: true },
    gender: { type: String, default: "", trim: true },
    ageCategory: { type: String, default: "", trim: true },
    sleepHours: { type: String, default: "", trim: true },
    foodIntake: { type: String, default: "", trim: true },
    waterChangePeriod: { type: String, default: "", trim: true },
    litterChangePeriod: { type: String, default: "", trim: true },
    playTimeApprox: { type: String, default: "", trim: true },
    birthDate: { type: Date, default: null },
    notes: { type: String, default: "" },
    feedingScheduleNotes: { type: String, default: "" },

    feedingTime1: { type: String, default: "", trim: true },
    feedingTime2: { type: String, default: "", trim: true },
    feedingTime3: { type: String, default: "", trim: true },
    feedingTime4: { type: String, default: "", trim: true },

    waterReminderTime: { type: String, default: "", trim: true },
    litterReminderTime: { type: String, default: "", trim: true },

    /** Legacy external URL */
    photoUrl: { type: String, default: "" },
    /** Base64 data URL from upload or paste */
    photoData: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Cat", catSchema);