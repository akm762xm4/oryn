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

// Define allowed origins
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  // "https://oryn-frontend-5w0e7ebhv-akm762xm4s-projects.vercel.app",
  "https://oryn-frontend.vercel.app",
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

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
  console.log(`Server running on port ${PORT}`);
});
