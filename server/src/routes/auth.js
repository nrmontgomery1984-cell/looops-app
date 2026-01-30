// Authentication routes
import { Router } from "express";
import crypto from "crypto";

const router = Router();

// Simple password hash comparison
// The password is stored as a hash in the environment variable
function verifyPassword(inputPassword, storedHash) {
  const inputHash = crypto.createHash("sha256").update(inputPassword).digest("hex");
  return inputHash === storedHash;
}

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  const storedHash = process.env.APP_PASSWORD_HASH;

  if (!storedHash) {
    // No password configured - allow access (for development)
    console.warn("Warning: APP_PASSWORD_HASH not set. Private mode disabled.");
    return res.status(503).json({ error: "Private mode not configured" });
  }

  if (verifyPassword(password, storedHash)) {
    // Generate a simple session token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    res.json({
      success: true,
      token,
      expiresAt,
    });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

// POST /api/auth/verify - Verify a token is still valid
router.post("/verify", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  // For simple implementation, just check token exists and is valid format
  // In production, you'd store tokens and check expiry
  if (token && token.length === 64) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});

// Utility endpoint to generate a password hash
// Usage: curl -X POST http://localhost:3001/api/auth/hash -H "Content-Type: application/json" -d '{"password":"your-password"}'
router.post("/hash", (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  const hash = crypto.createHash("sha256").update(password).digest("hex");
  res.json({
    hash,
    instruction: "Add this to your .env file as APP_PASSWORD_HASH=" + hash,
  });
});

export default router;
