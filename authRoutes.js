import express from "express";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User, { DIGIT_PASSWORD_REGEX, hashPassword } from "../models/User.js";
import { requireAuth, signToken } from "../middleware/auth.js";

const router = express.Router();

function clientUrl() {
  return String(process.env.CLIENT_URL || "http://localhost:5173").trim();
}

function mailFrom() {
  return String(process.env.MAIL_FROM || process.env.SMTP_USER || "").trim();
}

function createMailer() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

router.post("/auth/forgot-password", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!username || !email) {
      return res.status(400).json({ message: "Username and email are required." });
    }

    console.log("MAIL DEBUG:", {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS ? "SET" : "",
  MAIL_FROM: process.env.MAIL_FROM,
  CLIENT_URL: process.env.CLIENT_URL,
});

    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS ||
      !mailFrom()
    ) {
      return res.status(503).json({
        message: "Password reset email is not configured on the server.",
      });
    }

    const user = await User.findOne({
      usernameNormalized: username,
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "No account found with that username and email.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30);
    await user.save();

    const resetLink = `${clientUrl()}/reset-password?token=${rawToken}`;
    const transporter = createMailer();

    await transporter.sendMail({
      from: mailFrom(),
      to: user.email,
      subject: "PurrCare password reset",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
          <h2 style="margin-bottom: 12px;">PurrCare Password Reset</h2>
          <p>Hello ${user.fullName},</p>
          <p>We received a request to reset your PurrCare password.</p>
          <p>Click the button below to choose a new password:</p>
          <p style="margin: 20px 0;">
            <a
              href="${resetLink}"
              style="display:inline-block;padding:10px 16px;background:#5b2db8;color:#ffffff;text-decoration:none;border-radius:8px;"
            >
              Reset Password
            </a>
          </p>
          <p>This link will expire in 30 minutes.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: "Password reset link sent to your email." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/auth/signup", async (req, res) => {
  try {
    const fullName = String(req.body.fullName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");

    if (!fullName || !email || !phone || !username || !password) {
      return res.status(400).json({
        message: "Full name, email, phone, username, and password are required.",
      });
    }

    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
      return res.status(400).json({
        message: "Username must be 3–32 characters: letters, numbers, or underscore only.",
      });
    }

    if (!DIGIT_PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message:
          "Password must be 4-10 characters and include alphabets, numbers, or special characters.",
      });
    }

    const existingUsername = await User.findOne({
      usernameNormalized: username.toLowerCase(),
    });

    if (existingUsername) {
      return res.status(400).json({
        message: "This username is already taken. Please choose a different username.",
      });
    }

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({
        message: "This email is already registered. Please use a different email.",
      });
    }

    const passwordHash = await hashPassword(password);

    const user = new User({
      fullName,
      email,
      phone,
      username,
      passwordHash,
    });

    await user.save();

    res.status(201).json({
      message: "Account created successfully. Please log in.",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        username: user.username,
        photoUrl: user.photoUrl || "",
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern || {})[0];

      if (duplicateField === "usernameNormalized" || duplicateField === "username") {
        return res.status(400).json({
          message: "This username is already taken. Please choose a different username.",
        });
      }

      if (duplicateField === "email") {
        return res.status(400).json({
          message: "This email is already registered. Please use a different email.",
        });
      }

      if (duplicateField === "nameNormalized") {
        return res.status(400).json({
          message: "This full name is already registered. Please contact support if needed.",
        });
      }

      return res.status(400).json({ message: "Account details already registered." });
    }

    res.status(400).json({ message: err.message });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const loginId = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!loginId || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const user = await User.findOne({
      usernameNormalized: loginId,
    }).select("+passwordHash");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        username: user.username,
        photoUrl: user.photoUrl || "",
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/auth/me", requireAuth, async (req, res) => {
  res.json({
    user: {
      _id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      phone: req.user.phone,
      username: req.user.username,
      photoUrl: req.user.photoUrl || "",
    },
  });
});

router.put("/auth/profile", requireAuth, async (req, res) => {
  try {
    const fullName = String(req.body.fullName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const photoUrl = String(req.body.photoUrl || "").trim();

    if (!fullName || !email) {
      return res.status(400).json({ message: "Full name and email are required." });
    }

    const existingEmailUser = await User.findOne({
      email,
      _id: { $ne: req.user._id },
    });

    if (existingEmailUser) {
      return res.status(400).json({ message: "That email is already in use." });
    }

    req.user.fullName = fullName;
    req.user.email = email;
    req.user.phone = phone;
    req.user.photoUrl = photoUrl;

    await req.user.save();

    res.json({
      message: "Profile updated successfully.",
      user: {
        _id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone,
        username: req.user.username,
        photoUrl: req.user.photoUrl || "",
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/auth/reset-password", async (req, res) => {
  try {
    const token = String(req.body.token || "").trim();
    const newPassword = String(req.body.newPassword || "");

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required." });
    }

    if (!DIGIT_PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        message:
          "New password must be 4-10 characters and include alphabets, numbers, or special characters.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordHash");

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or expired." });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.passwordResetToken = "";
    user.passwordResetExpires = null;

    await user.save();

    res.json({ message: "Password reset successful. Please log in." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/auth/change-password", requireAuth, async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required.",
      });
    }

    if (!DIGIT_PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        message:
          "New password must be 4-10 characters and include alphabets, numbers, or special characters.",
      });
    }

    const user = await User.findById(req.user._id).select("+passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const samePassword = await user.comparePassword(newPassword);
    if (samePassword) {
      return res.status(400).json({
        message: "New password must be different from the current password.",
      });
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    res.json({ message: "Password changed successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;