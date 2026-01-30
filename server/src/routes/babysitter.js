// Babysitter API Routes
import { Router } from "express";
import * as babysitterService from "../services/babysitterService.js";

const router = Router();

/**
 * GET /api/babysitter/caregivers
 * List all caregivers
 */
router.get("/caregivers", async (req, res, next) => {
  try {
    const caregivers = await babysitterService.getCaregivers();
    if (caregivers === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "sheets", data: caregivers });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/babysitter/caregivers
 * Add a new caregiver
 */
router.post("/caregivers", async (req, res, next) => {
  try {
    const caregiver = await babysitterService.addCaregiver(req.body);
    res.status(201).json(caregiver);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/babysitter/caregivers/:id
 * Update a caregiver
 */
router.patch("/caregivers/:id", async (req, res, next) => {
  try {
    const caregiver = await babysitterService.updateCaregiver(req.params.id, req.body);
    res.json(caregiver);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/babysitter/sessions
 * List sessions with optional filters
 * Query params: startDate, endDate, caregiverId
 */
router.get("/sessions", async (req, res, next) => {
  try {
    const { startDate, endDate, caregiverId } = req.query;
    const sessions = await babysitterService.getSessions({ startDate, endDate, caregiverId });
    if (sessions === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "sheets", data: sessions });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/babysitter/sessions
 * Log a new session
 */
router.post("/sessions", async (req, res, next) => {
  try {
    const session = await babysitterService.addSession(req.body);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/babysitter/sessions/:id
 * Delete a session
 */
router.delete("/sessions/:id", async (req, res, next) => {
  try {
    await babysitterService.deleteSession(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/babysitter/summary
 * Get summary statistics
 */
router.get("/summary", async (req, res, next) => {
  try {
    const summary = await babysitterService.getSummary();
    if (summary === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "sheets", data: summary });
  } catch (error) {
    next(error);
  }
});

export default router;
