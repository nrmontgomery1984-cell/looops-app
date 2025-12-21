// Vercel Serverless Function - Health Summary API
// Reads Fitbit data from Google Sheets (populated via IFTTT)

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

// Column mapping for IFTTT Fitbit data
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

interface HealthData {
  id: string;
  date: string;
  steps: number;
  distanceKm: number;
  caloriesBurned: number;
  activeMinutes: number;
  restingHeartRate: number | null;
  sleepDurationHours: number;
  sleepScore: number | null;
  deepSleepMinutes: number;
  remSleepMinutes: number;
  mindfulnessMinutes: number;
  weightKg: number | null;
  syncedAt: string | null;
  scores?: HealthScores;
}

interface HealthScores {
  steps: number | null;
  sleep: number | null;
  activity: number | null;
  readiness: number | null;
}

async function initSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    return null;
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

async function readSheet(spreadsheetId: string, range: string) {
  const sheets = await initSheetsClient();
  if (!sheets) return null;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return response.data.values || [];
  } catch (error) {
    console.error('Error reading sheet:', error);
    return null;
  }
}

function parseHealthRow(row: string[], index: number): HealthData {
  return {
    id: `health_${index}`,
    date: row[COLUMNS.date] || '',
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

function getStepsScore(steps: number | null): number | null {
  if (steps === null || steps === undefined) return null;
  if (steps >= 10000) return 100;
  if (steps >= 7500) return 80;
  if (steps >= 5000) return 60;
  if (steps >= 2500) return 40;
  return 20;
}

function getSleepScore(score: number | null): number | null {
  return score; // Fitbit sleep score is already 0-100
}

function getActivityScore(minutes: number | null): number | null {
  if (minutes === null || minutes === undefined) return null;
  if (minutes >= 60) return 100;
  if (minutes >= 45) return 80;
  if (minutes >= 30) return 60;
  if (minutes >= 15) return 40;
  return 20;
}

function calculateHealthScores(data: HealthData): HealthScores {
  const scores: HealthScores = {
    steps: getStepsScore(data.steps),
    sleep: getSleepScore(data.sleepScore),
    activity: getActivityScore(data.activeMinutes),
    readiness: null,
  };

  const validScores = [scores.steps, scores.sleep, scores.activity].filter(
    (s): s is number => s !== null
  );

  scores.readiness = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : null;

  return scores;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sheetId = process.env.SHEETS_HEALTH_ID;

  if (!sheetId) {
    return res.status(200).json({
      source: 'local',
      data: null,
      message: 'Health data not configured',
    });
  }

  try {
    const rows = await readSheet(sheetId, 'Health!A2:M');

    if (!rows || rows.length === 0) {
      return res.status(200).json({
        source: 'sheets',
        data: null,
        message: 'No health data found',
      });
    }

    // Parse all rows
    const allData = rows.map((row, index) => parseHealthRow(row as string[], index));

    // Sort by date descending
    allData.sort((a, b) => b.date.localeCompare(a.date));

    // Get today's data
    const today = new Date().toISOString().split('T')[0];
    const todayData = allData.find(d => d.date === today);

    // Get last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    const weekData = allData.filter(d => d.date >= weekAgoStr && d.date <= today);

    // Calculate scores for today
    const todayWithScores = todayData ? {
      ...todayData,
      scores: calculateHealthScores(todayData),
    } : null;

    // Calculate weekly averages
    const weeklyAvg = weekData.length > 0 ? {
      steps: Math.round(weekData.reduce((sum, d) => sum + d.steps, 0) / weekData.length),
      sleepDurationHours: Math.round(weekData.reduce((sum, d) => sum + d.sleepDurationHours, 0) / weekData.length * 10) / 10,
      activeMinutes: Math.round(weekData.reduce((sum, d) => sum + d.activeMinutes, 0) / weekData.length),
      mindfulnessMinutes: Math.round(weekData.reduce((sum, d) => sum + d.mindfulnessMinutes, 0) / weekData.length),
    } : null;

    // Mindfulness streak
    let mindfulnessStreak = 0;
    for (const day of weekData) {
      if (day.mindfulnessMinutes > 0) {
        mindfulnessStreak++;
      } else {
        break;
      }
    }

    return res.status(200).json({
      source: 'sheets',
      data: {
        today: todayWithScores,
        weeklyAvg,
        weeklyData: weekData,
        mindfulnessStreak,
      },
    });
  } catch (error) {
    console.error('Health API error:', error);
    return res.status(500).json({
      source: 'error',
      data: null,
      message: 'Failed to fetch health data',
    });
  }
}
