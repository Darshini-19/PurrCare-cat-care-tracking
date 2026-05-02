import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "purrcare-dev-secret-change-me";

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, JWT_SECRET, { expiresIn: "30d" });
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "Please sign in." });
    }
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }
    req.user = user;
    req.userPayload = { _id: user._id, fullName: user.fullName, email: user.email };
    next();
  } catch {
    return res.status(401).json({ message: "Please sign in." });
  }
}