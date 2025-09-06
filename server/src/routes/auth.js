import express from "express";
import {
  register,
  login,
  verifyOTP,
  resendOTP,
  updateProfile,
  uploadAvatar,
} from "../controllers/authController.js";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { message: "Too many attempts, please try again later" },
});

const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 OTP per minute
  message: { message: "Please wait before requesting another OTP" },
});

// Public routes
router.post("/register", authLimiter, register);
router.post("/login", login);
router.post("/verify-otp", authLimiter, verifyOTP);
router.post("/resend-otp", otpLimiter, resendOTP);

// Protected routes
router.put("/profile", authenticate, updateProfile);
router.post(
  "/upload-avatar",
  authenticate,
  upload.single("avatar"),
  uploadAvatar
);

export default router;
