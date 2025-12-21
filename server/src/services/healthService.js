// Health Service - Read Fitbit data from Google Sheets (populated via IFTTT)
import { readSheet } from "../integrations/googleSheets.js";

const SHEET_ID = process.env.SHEETS_HEALTH_ID;

// Column mapping for IFTTT Fitbit data
// Adjust based on how your IFTTT applets format data
const COLUMNS = {
  date: 0,
  steps: 1,
  distance_km: 2,
  calories_burned: 3,
  active_minutes: 4,
  resting_heart_rate: 5,
  sleep_duration_hours: 6,
  sleep_score: 7,
  deep_sleep_minutes: 8,
  rem_sleep_minutes: 9,
  mindfulness_minutes: 10,
  weight_kg: 11,
  synced_at: 12,
};

/**
 * Parse a row into a health data object
 */
function parseHealthRow(row, index) {
  return {
    id: `health_${index}`,
    date: row[COLUMNS.date] || "",
    steps: parseInt(row[COLUMNS.steps]) || 0,
    distanceKm: parseFloat(row[COLUMNS.distance_km]) || 0,
    caloriesBurned: parseInt(row[COLUMNS.calories_burned]) || 0,
    activeMinutes: parseInt(row[COLUMNS.active_minutes]) || 0,
    restingHeartRate: parseInt(row[COLUMNS.resting_heart_rate]) || null,
    sleepDurationHours: parseFloat(row[COLUMNS.sleep_duration_hours]) || 0,
    sleepScore: parseInt(row[COLUMNS.sleep_score]) || null,
    deepSleepMinutes: parseInt(row[COLUMNS.deep_sleep_minutes]) || 0,
    remSleepMinutes: parseInt(row[COLUMNS.rem_sleep_minutes]) || 0,
    mindfulnessMinutes: parseInt(row[COLUMNS.mindfulness_minutes]) || 0,
    weightKg: parseFloat(row[COLUMNS.weight_kg]) || null,
    syncedAt: row[COLUMNS.synced_at] || null,
  };
}

/**
 * Get health data for a date range
 */
export async function getHealthData(options = {}) {
  if (!SHEET_ID) {
    console.warn("SHEETS_HEALTH_ID not configured");
    return null;
  }

  const rows = await readSheet(SHEET_ID, "Health!A2:M");
  if (!rows) return [];

  let data = rows.map(parseHealthRow);

  // Filter by date range
  if (options.startDate) {
    data = data.filter((d) => d.date >= options.startDate);
  }
  if (options.endDate) {
    data = data.filter((d) => d.date <= options.endDate);
  }

  // Sort by date descending (most recent first)
  data.sort((a, b) => b.date.localeCompare(a.date));

  return data;
}

/**
 * Get today's health data
 */
export async function getTodayHealth() {
  const today = new Date().toISOString().split("T")[0];
  const data = await getHealthData({ startDate: today, endDate: today });
  return data?.[0] || null;
}

/**
 * Get last 7 days of health data
 */
export async function getWeekHealth() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  return getHealthData({
    startDate: weekAgo.toISOString().split("T")[0],
    endDate: today.toISOString().split("T")[0],
  });
}

/**
 * Calculate health scores based on thresholds
 */
export function calculateHealthScores(data) {
  if (!data) return null;

  const scores = {
    steps: getStepsScore(data.steps),
    sleep: getSleepScore(data.sleepScore),
    activity: getActivityScore(data.activeMinutes),
  };

  // Overall readiness (average of available scores)
  const validScores = Object.values(scores).filter((s) => s !== null);
  scores.readiness = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : null;

  return scores;
}

function getStepsScore(steps) {
  if (steps === null || steps === undefined) return null;
  if (steps >= 10000) return 100;
  if (steps >= 7500) return 80;
  if (steps >= 5000) return 60;
  if (steps >= 2500) return 40;
  return 20;
}

function getSleepScore(score) {
  if (score === null || score === undefined) return null;
  // Fitbit sleep score is already 0-100
  return score;
}

function getActivityScore(minutes) {
  if (minutes === null || minutes === undefined) return null;
  if (minutes >= 60) return 100;
  if (minutes >= 45) return 80;
  if (minutes >= 30) return 60;
  if (minutes >= 15) return 40;
  return 20;
}

/**
 * Get health summary with scores
 */
export async function getHealthSummary() {
  const today = await getTodayHealth();
  const week = await getWeekHealth();

  if (!today && (!week || week.length === 0)) {
    return null;
  }

  const todayScores = today ? calculateHealthScores(today) : null;

  // Calculate weekly averages
  const weeklyAvg = week && week.length > 0 ? {
    steps: Math.round(week.reduce((sum, d) => sum + d.steps, 0) / week.length),
    sleepHours: Math.round(week.reduce((sum, d) => sum + d.sleepDurationHours, 0) / week.length * 10) / 10,
    activeMinutes: Math.round(week.reduce((sum, d) => sum + d.activeMinutes, 0) / week.length),
    mindfulnessMinutes: Math.round(week.reduce((sum, d) => sum + d.mindfulnessMinutes, 0) / week.length),
  } : null;

  // Mindfulness streak (consecutive days with mindfulness)
  let mindfulnessStreak = 0;
  if (week) {
    for (const day of week) {
      if (day.mindfulnessMinutes > 0) {
        mindfulnessStreak++;
      } else {
        break;
      }
    }
  }

  return {
    today: today ? { ...today, scores: todayScores } : null,
    weeklyAvg,
    weeklyData: week || [],
    mindfulnessStreak,
  };
}
