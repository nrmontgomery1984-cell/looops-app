// Fitbit Service - Direct API integration for health data
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLIENT_ID = process.env.FITBIT_CLIENT_ID;
const CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET;
let REFRESH_TOKEN = process.env.FITBIT_REFRESH_TOKEN;
let ACCESS_TOKEN = null;
let TOKEN_EXPIRY = null;

// Cache for health summary to avoid rate limiting
let cachedHealthSummary = null;
let cacheExpiry = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const FITBIT_API_BASE = "https://api.fitbit.com";
const FITBIT_AUTH_BASE = "https://www.fitbit.com/oauth2";

/**
 * Get OAuth2 authorization URL
 */
export function getAuthUrl(redirectUri) {
  const scopes = [
    "activity",
    "heartrate",
    "sleep",
    "weight",
    "profile",
  ].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    scope: scopes,
    expires_in: "604800", // 1 week
  });

  return `${FITBIT_AUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code, redirectUri) {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const response = await fetch(`${FITBIT_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  const data = await response.json();
  ACCESS_TOKEN = data.access_token;
  REFRESH_TOKEN = data.refresh_token;
  TOKEN_EXPIRY = Date.now() + data.expires_in * 1000;

  // Persist the initial token to .env
  persistRefreshToken(REFRESH_TOKEN);

  return {
    accessToken: ACCESS_TOKEN,
    refreshToken: REFRESH_TOKEN,
    expiresIn: data.expires_in,
  };
}

/**
 * Refresh the access token
 */
async function refreshAccessToken() {
  if (!REFRESH_TOKEN) {
    throw new Error("No refresh token available. Please authorize first.");
  }

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const response = await fetch(`${FITBIT_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();
  ACCESS_TOKEN = data.access_token;
  REFRESH_TOKEN = data.refresh_token;
  TOKEN_EXPIRY = Date.now() + data.expires_in * 1000;

  // Persist new refresh token to .env file
  persistRefreshToken(REFRESH_TOKEN);

  return ACCESS_TOKEN;
}

/**
 * Persist refresh token to .env file
 */
function persistRefreshToken(newToken) {
  try {
    const envPath = path.join(__dirname, "../../.env");
    let envContent = fs.readFileSync(envPath, "utf8");

    // Replace the refresh token line
    envContent = envContent.replace(
      /FITBIT_REFRESH_TOKEN=.*/,
      `FITBIT_REFRESH_TOKEN=${newToken}`
    );

    fs.writeFileSync(envPath, envContent);
    console.log("Fitbit refresh token persisted to .env");
  } catch (error) {
    console.error("Failed to persist refresh token:", error.message);
    console.log("New Fitbit refresh token (save manually):", newToken);
  }
}

/**
 * Get valid access token (refresh if needed)
 */
async function getAccessToken() {
  if (!ACCESS_TOKEN || !TOKEN_EXPIRY || Date.now() >= TOKEN_EXPIRY - 60000) {
    return refreshAccessToken();
  }
  return ACCESS_TOKEN;
}

/**
 * Make authenticated API request
 */
async function fitbitRequest(endpoint) {
  const token = await getAccessToken();

  const response = await fetch(`${FITBIT_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, try refresh
      await refreshAccessToken();
      return fitbitRequest(endpoint);
    }
    const error = await response.text();
    throw new Error(`Fitbit API error: ${error}`);
  }

  return response.json();
}

/**
 * Get today's activity summary
 */
export async function getTodayActivity() {
  const today = new Date().toISOString().split("T")[0];
  const data = await fitbitRequest(`/1/user/-/activities/date/${today}.json`);

  return {
    date: today,
    steps: data.summary?.steps || 0,
    distanceKm: data.summary?.distances?.find((d) => d.activity === "total")?.distance || 0,
    caloriesBurned: data.summary?.caloriesOut || 0,
    activeMinutes:
      (data.summary?.fairlyActiveMinutes || 0) +
      (data.summary?.veryActiveMinutes || 0),
    restingHeartRate: data.summary?.restingHeartRate || null,
    floors: data.summary?.floors || 0,
  };
}

/**
 * Get today's sleep data
 */
export async function getTodaySleep() {
  const today = new Date().toISOString().split("T")[0];
  const data = await fitbitRequest(`/1.2/user/-/sleep/date/${today}.json`);

  const mainSleep = data.sleep?.find((s) => s.isMainSleep) || data.sleep?.[0];

  if (!mainSleep) {
    return {
      date: today,
      sleepDurationHours: 0,
      sleepScore: null,
      deepSleepMinutes: 0,
      remSleepMinutes: 0,
      lightSleepMinutes: 0,
      awakeDuration: 0,
    };
  }

  const stages = mainSleep.levels?.summary || {};

  return {
    date: today,
    sleepDurationHours: Math.round((mainSleep.duration / 3600000) * 10) / 10,
    sleepScore: mainSleep.efficiency || null,
    deepSleepMinutes: stages.deep?.minutes || 0,
    remSleepMinutes: stages.rem?.minutes || 0,
    lightSleepMinutes: stages.light?.minutes || 0,
    awakeDuration: stages.wake?.minutes || 0,
  };
}

/**
 * Get heart rate data for today
 */
export async function getTodayHeartRate() {
  const today = new Date().toISOString().split("T")[0];

  try {
    const data = await fitbitRequest(`/1/user/-/activities/heart/date/${today}/1d.json`);
    const heartData = data["activities-heart"]?.[0]?.value;

    return {
      date: today,
      restingHeartRate: heartData?.restingHeartRate || null,
      zones: heartData?.heartRateZones || [],
    };
  } catch (error) {
    console.warn("Could not fetch heart rate data:", error.message);
    return { date: today, restingHeartRate: null, zones: [] };
  }
}

/**
 * Get weight data
 */
export async function getLatestWeight() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  try {
    const data = await fitbitRequest(
      `/1/user/-/body/log/weight/date/${thirtyDaysAgo}/${today}.json`
    );
    const weights = data.weight || [];
    const latest = weights[weights.length - 1];

    return latest
      ? {
          date: latest.date,
          weightKg: latest.weight,
          bmi: latest.bmi,
        }
      : null;
  } catch (error) {
    console.warn("Could not fetch weight data:", error.message);
    return null;
  }
}

/**
 * Get comprehensive health summary for today
 * Results are cached for 5 minutes to avoid rate limiting
 */
export async function getHealthSummary() {
  if (!REFRESH_TOKEN && !ACCESS_TOKEN) {
    return { error: "Not authorized. Visit /api/fitbit/auth to connect." };
  }

  // Return cached data if still valid
  if (cachedHealthSummary && cacheExpiry && Date.now() < cacheExpiry) {
    console.log("Returning cached Fitbit data");
    return cachedHealthSummary;
  }

  try {
    const [activity, sleep, heartRate, weight] = await Promise.all([
      getTodayActivity(),
      getTodaySleep(),
      getTodayHeartRate(),
      getLatestWeight(),
    ]);

    const today = {
      date: activity.date,
      steps: activity.steps,
      distanceKm: activity.distanceKm,
      caloriesBurned: activity.caloriesBurned,
      activeMinutes: activity.activeMinutes,
      restingHeartRate: heartRate.restingHeartRate || activity.restingHeartRate,
      sleepDurationHours: sleep.sleepDurationHours,
      sleepScore: sleep.sleepScore,
      deepSleepMinutes: sleep.deepSleepMinutes,
      remSleepMinutes: sleep.remSleepMinutes,
      weightKg: weight?.weightKg || null,
    };

    // Calculate scores
    const scores = {
      steps: getStepsScore(today.steps),
      sleep: getSleepScore(today.sleepScore),
      activity: getActivityScore(today.activeMinutes),
    };

    const validScores = Object.values(scores).filter((s) => s !== null);
    scores.readiness =
      validScores.length > 0
        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
        : null;

    const result = {
      today: { ...today, scores },
      heartRateZones: heartRate.zones,
    };

    // Cache the result
    cachedHealthSummary = result;
    cacheExpiry = Date.now() + CACHE_DURATION_MS;
    console.log("Cached Fitbit data for 5 minutes");

    return result;
  } catch (error) {
    console.error("Error fetching Fitbit data:", error);
    return { error: error.message };
  }
}

/**
 * Get activity data for a date range (for weekly summary)
 */
export async function getWeekActivity() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const todayStr = today.toISOString().split("T")[0];
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  try {
    const [stepsData, caloriesData, activeMinData] = await Promise.all([
      fitbitRequest(`/1/user/-/activities/steps/date/${weekAgoStr}/${todayStr}.json`),
      fitbitRequest(`/1/user/-/activities/calories/date/${weekAgoStr}/${todayStr}.json`),
      fitbitRequest(`/1/user/-/activities/minutesFairlyActive/date/${weekAgoStr}/${todayStr}.json`),
    ]);

    const steps = stepsData["activities-steps"] || [];
    const calories = caloriesData["activities-calories"] || [];
    const activeMin = activeMinData["activities-minutesFairlyActive"] || [];

    // Combine into daily records
    const weeklyData = steps.map((day, i) => ({
      date: day.dateTime,
      steps: parseInt(day.value) || 0,
      caloriesBurned: parseInt(calories[i]?.value) || 0,
      activeMinutes: parseInt(activeMin[i]?.value) || 0,
    }));

    // Calculate averages
    const avgSteps = Math.round(
      weeklyData.reduce((sum, d) => sum + d.steps, 0) / weeklyData.length
    );
    const avgCalories = Math.round(
      weeklyData.reduce((sum, d) => sum + d.caloriesBurned, 0) / weeklyData.length
    );
    const avgActiveMinutes = Math.round(
      weeklyData.reduce((sum, d) => sum + d.activeMinutes, 0) / weeklyData.length
    );

    return {
      weeklyData,
      averages: {
        steps: avgSteps,
        caloriesBurned: avgCalories,
        activeMinutes: avgActiveMinutes,
      },
    };
  } catch (error) {
    console.error("Error fetching weekly activity:", error);
    return { error: error.message };
  }
}

// Score calculation helpers
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
 * Check if Fitbit is configured and authorized
 */
export function isConfigured() {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

export function isAuthorized() {
  return Boolean(REFRESH_TOKEN || ACCESS_TOKEN);
}
