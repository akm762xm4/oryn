import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { authenticate } from "../middleware/auth.js";
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  searchUsers,
  searchMessages,
  debugConversations,
  fixDuplicateConversations,
} from "../controllers/chatController.js";

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage (Cloudinary upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

router.use(authenticate);

router.get("/conversations", getConversations);
router.post("/conversations", createConversation);
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/messages", sendMessage);
router.get("/search/users", searchUsers);
router.get("/search/messages", searchMessages);
router.get("/debug/conversations", debugConversations);
router.post("/fix/duplicate-conversations", fixDuplicateConversations);

// Image upload route with Cloudinary
router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "image",
            folder: "chat-images", // Optional: organize images in a folder
            transformation: [
              { width: 800, height: 600, crop: "limit" }, // Resize large images
              { quality: "auto" }, // Auto optimize quality
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(req.file.buffer);
    });

    res.json({
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

export default router;
