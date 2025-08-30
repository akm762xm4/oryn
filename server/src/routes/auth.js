import express from "express";
import {
  register,
  login,
  verifyOTP,
  resendOTP,
} from "../controllers/authController.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

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

router.post("/register", authLimiter, register);
// router.post("/login",authLimiter, login);
router.post("/login", login);
router.post("/verify-otp", authLimiter, verifyOTP);
router.post("/resend-otp", otpLimiter, resendOTP);

export default router;
