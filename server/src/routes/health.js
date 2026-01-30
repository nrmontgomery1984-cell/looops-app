// Health API Routes - Fitbit data (direct API or Google Sheets fallback)
import { Router } from "express";
import * as healthService from "../services/healthService.js";
import * as fitbitService from "../services/fitbitService.js";

const router = Router();

/**
 * GET /api/health/today
 * Get today's health data with scores
 */
router.get("/today", async (req, res, next) => {
  try {
    const data = await healthService.getTodayHealth();
    if (data === null) {
      return res.json({ source: "local", data: null });
    }
    const scores = healthService.calculateHealthScores(data);
    res.json({ source: "sheets", data: { ...data, scores } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/health/week
 * Get last 7 days of health data
 */
router.get("/week", async (req, res, next) => {
  try {
    const data = await healthService.getWeekHealth();
    if (data === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "sheets", data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/health/summary
 * Get health summary with today's data, weekly averages, and scores
 * Uses Fitbit API when authorized, falls back to Google Sheets
 */
router.get("/summary", async (req, res, next) => {
  try {
    // Try Fitbit API first if authorized
    if (fitbitService.isAuthorized()) {
      const fitbitData = await fitbitService.getHealthSummary();
      if (!fitbitData.error) {
        return res.json({ source: "fitbit", data: fitbitData });
      }
      console.warn("Fitbit API error, falling back to Sheets:", fitbitData.error);
    }

    // Fall back to Google Sheets
    const summary = await healthService.getHealthSummary();
    if (summary === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "sheets", data: summary });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/health/range
 * Get health data for a custom date range
 * Query params: startDate, endDate
 */
router.get("/range", async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await healthService.getHealthData({ startDate, endDate });
    if (data === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "sheets", data });
  } catch (error) {
    next(error);
  }
});

export default router;
