// Tiller Money API Routes - Financial data for Wealth loop
import { Router } from "express";
import * as tillerService from "../services/tillerService.js";

const router = Router();

/**
 * GET /api/tiller/status
 * Check if Tiller is configured
 */
router.get("/status", (req, res) => {
  const configured = tillerService.isConfigured();
  res.json({
    configured,
    message: configured
      ? "Tiller Money is connected"
      : "Add SHEETS_TILLER_ID to .env",
  });
});

/**
 * GET /api/tiller/summary
 * Get full financial summary for Wealth loop
 */
router.get("/summary", async (req, res, next) => {
  try {
    const { days } = req.query;
    const data = await tillerService.getFinancialSummary(
      days ? parseInt(days) : 30
    );
    if (data === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "tiller", data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tiller/transactions
 * Get recent transactions
 */
router.get("/transactions", async (req, res, next) => {
  try {
    const { days } = req.query;
    const data = await tillerService.getTransactions(days ? parseInt(days) : 30);
    if (data === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "tiller", data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tiller/balances
 * Get account balances
 */
router.get("/balances", async (req, res, next) => {
  try {
    const data = await tillerService.getBalances();
    if (data === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "tiller", data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tiller/spending
 * Get spending by category
 */
router.get("/spending", async (req, res, next) => {
  try {
    const { days } = req.query;
    const data = await tillerService.getSpendingByCategory(
      days ? parseInt(days) : 30
    );
    if (data === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "tiller", data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tiller/income-expenses
 * Get income vs expenses
 */
router.get("/income-expenses", async (req, res, next) => {
  try {
    const { days } = req.query;
    const data = await tillerService.getIncomeExpenses(
      days ? parseInt(days) : 30
    );
    if (data === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "tiller", data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tiller/net-worth
 * Get net worth calculation
 */
router.get("/net-worth", async (req, res, next) => {
  try {
    const data = await tillerService.getNetWorth();
    if (data === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "tiller", data });
  } catch (error) {
    next(error);
  }
});

export default router;
