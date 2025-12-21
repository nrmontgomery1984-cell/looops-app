// Looops Backend Server
import "./config.js"; // Must be first to load env vars

import express from "express";
import cors from "cors";

// Routes
import authRoutes from "./routes/auth.js";
import healthRoutes from "./routes/health.js";
import babysitterRoutes from "./routes/babysitter.js";
import calendarRoutes from "./routes/calendar.js";
import todoistRoutes from "./routes/todoist.js";
import spotifyRoutes from "./routes/spotify.js";
import tillerRoutes from "./routes/tiller.js";
import fitbitRoutes from "./routes/fitbit.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    // Allow any localhost port for development
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    // Allow configured CLIENT_URL
    if (origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "looops-server" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/babysitter", babysitterRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/todoist", todoistRoutes);
app.use("/api/spotify", spotifyRoutes);
app.use("/api/tiller", tillerRoutes);
app.use("/api/fitbit", fitbitRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Looops server running on http://localhost:${PORT}`);
});
