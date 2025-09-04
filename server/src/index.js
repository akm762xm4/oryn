import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import connectDB from "./config/database.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import openRouterRoutes from "./routes/openRouter.js";
import { socketAuth } from "./middleware/auth.js";
import { handleConnection } from "./socket/socketHandlers.js";

const app = express();
const server = createServer(app);

// ✅ CORS configuration (dynamic to allow vercel previews)
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow requests like Postman

    const allowed = [
      process.env.CLIENT_URL || "http://localhost:5173",
      "https://oryn-frontend.vercel.app",
    ];

    if (
      allowed.includes(origin) ||
      origin.endsWith(".vercel.app") // allow all vercel previews
    ) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

// ✅ Apply CORS first
app.use(cors(corsOptions));

// ✅ Explicitly handle preflight requests
app.options("*", cors(corsOptions));

// ✅ Then Helmet (so it doesn’t override CORS headers)
app.use(helmet());

// Other middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// --- Socket.io setup with dynamic CORS ---
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman / local scripts

      const allowed = [
        process.env.CLIENT_URL || "http://localhost:5173",
        "https://oryn-frontend.vercel.app",
      ];

      if (
        allowed.includes(origin) ||
        origin.endsWith(".vercel.app") // ✅ allow Vercel previews
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Make io available to routes
app.set("io", io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ai", openRouterRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Socket.io middleware
io.use(socketAuth);

// Socket.io connection handling
io.on("connection", (socket) => {
  handleConnection(io, socket);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
