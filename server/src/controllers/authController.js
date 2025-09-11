import jwt from "jsonwebtoken";
import fs from "fs";
import User from "../models/User.js";
import { sendOTP } from "../utils/email.js";
import cloudinary from "../config/cloudinary.js";
import sharp from "sharp";

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email
            ? "Email already exists"
            : "Username already exists",
      });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = new User({
      username,
      email,
      password,
      otp: {
        code: otp,
        expiresAt: otpExpires,
      },
    });

    await user.save();
    await sendOTP(email, otp);

    res.status(201).json({
      message: "User registered successfully. Please verify your email.",
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp.code !== otp || user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: "Email verified successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your email first" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = {
      code: otp,
      expiresAt: otpExpires,
    };

    await user.save();
    await sendOTP(user.email, otp);

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const userId = req.user._id;

    // Check if username or email already exists (excluding current user)
    const existingUser = await User.findOne({
      $and: [{ _id: { $ne: userId } }, { $or: [{ email }, { username }] }],
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email
            ? "Email already exists"
            : "Username already exists",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, email },
      { new: true, runValidators: true }
    ).select("-password");

    // Emit real-time profile update to all connected clients
    const io = req.app.get("io");
    if (io) {
      io.emit("profileUpdated", {
        userId: userId.toString(),
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
      });
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        isVerified: updatedUser.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch)
      return res.status(400).json({ message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old avatar from Cloudinary if it exists
    if (user.avatar) {
      try {
        // Extract public_id from the Cloudinary URL
        const urlParts = user.avatar.split("/");
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = `avatars/${publicIdWithExtension.split(".")[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.log("Error deleting old avatar:", error);
      }
    }

    // Compress and optimize image before uploading to Cloudinary
    const compressedImageBuffer = await sharp(req.file.path)
      .rotate() // auto-orient based on EXIF
      .resize(400, 400, {
        fit: "cover",
        position: "center",
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toBuffer();

    // Upload compressed image to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${compressedImageBuffer.toString("base64")}`,
      {
        folder: "avatars",
        width: 200,
        height: 200,
        crop: "fill",
        quality: "auto",
        format: "webp",
      }
    );

    // Update user avatar in database
    user.avatar = result.secure_url;
    await user.save();

    // Clean up temporary file
    try {
      fs.unlinkSync(req.file.path);
    } catch (error) {
      console.log("Error deleting temporary file:", error);
    }

    // Emit real-time avatar update to all connected clients
    const io = req.app.get("io");
    if (io) {
      io.emit("avatarUpdated", {
        userId: userId.toString(),
        username: user.username,
        avatar: result.secure_url,
      });
    }

    res.json({
      message: "Avatar uploaded successfully",
      avatarUrl: result.secure_url,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
