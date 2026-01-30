// Fitbit Health Data endpoint - fetches directly from Fitbit API
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface HealthData {
  today: {
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
    scores: {
      steps: number | null;
      sleep: number | null;
      activity: number | null;
      readiness: number | null;
    };
  } | null;
  heartRateZones: Array<{
    name: string;
    min: number;
    max: number;
    minutes: number;
  }>;
}

function getStepsScore(steps: number): number | null {
  if (steps >= 10000) return 100;
  if (steps >= 7500) return 80;
  if (steps >= 5000) return 60;
  if (steps >= 2500) return 40;
  return 20;
}

function getActivityScore(minutes: number): number | null {
  if (minutes >= 60) return 100;
  if (minutes >= 45) return 80;
  if (minutes >= 30) return 60;
  if (minutes >= 15) return 40;
  return 20;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get access token from Authorization header
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.replace('Bearer ', '');

  if (!accessToken) {
    return res.status(200).json({
      source: 'local',
      data: null,
      message: 'No Fitbit access token provided. Connect Fitbit first.',
    });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // Fetch data in parallel
    const [activityRes, sleepRes, heartRes] = await Promise.all([
      fetch(`https://api.fitbit.com/1/user/-/activities/date/${today}.json`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }),
      fetch(`https://api.fitbit.com/1.2/user/-/sleep/date/${today}.json`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }),
      fetch(`https://api.fitbit.com/1/user/-/activities/heart/date/${today}/1d.json`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }),
    ]);

    // Check if token is expired
    if (activityRes.status === 401) {
      return res.status(401).json({
        source: 'error',
        data: null,
        message: 'Fitbit token expired. Please reconnect.',
        needsReauth: true,
      });
    }

    const activityData = activityRes.ok ? await activityRes.json() : null;
    const sleepData = sleepRes.ok ? await sleepRes.json() : null;
    const heartData = heartRes.ok ? await heartRes.json() : null;

    // Parse activity data
    const summary = activityData?.summary || {};
    const steps = summary.steps || 0;
    const distanceKm = (summary.distances?.find((d: any) => d.activity === 'total')?.distance || 0);
    const caloriesBurned = summary.caloriesOut || 0;
    const activeMinutes = (summary.fairlyActiveMinutes || 0) + (summary.veryActiveMinutes || 0);

    // Parse sleep data
    const sleepSummary = sleepData?.summary || {};
    const sleepMinutes = sleepSummary.totalMinutesAsleep || 0;
    const sleepDurationHours = Math.round((sleepMinutes / 60) * 10) / 10;

    // Get sleep stages from the main sleep record
    const mainSleep = sleepData?.sleep?.find((s: any) => s.isMainSleep) || sleepData?.sleep?.[0];
    const sleepLevels = mainSleep?.levels?.summary || {};
    const deepSleepMinutes = sleepLevels.deep?.minutes || 0;
    const remSleepMinutes = sleepLevels.rem?.minutes || 0;

    // Parse heart rate data
    const heartRateData = heartData?.['activities-heart']?.[0]?.value || {};
    const restingHeartRate = heartRateData.restingHeartRate || null;
    const heartRateZones = (heartRateData.heartRateZones || []).map((zone: any) => ({
      name: zone.name,
      min: zone.min,
      max: zone.max,
      minutes: zone.minutes || 0,
    }));

    // Calculate scores
    const stepsScore = getStepsScore(steps);
    const sleepScore = sleepDurationHours >= 7 ? 80 : sleepDurationHours >= 6 ? 60 : 40;
    const activityScore = getActivityScore(activeMinutes);

    const validScores = [stepsScore, sleepScore, activityScore].filter((s): s is number => s !== null);
    const readinessScore = validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : null;

    const healthData: HealthData = {
      today: {
        date: today,
        steps,
        distanceKm,
        caloriesBurned,
        activeMinutes,
        restingHeartRate,
        sleepDurationHours,
        sleepScore,
        deepSleepMinutes,
        remSleepMinutes,
        mindfulnessMinutes: 0, // Fitbit API doesn't expose mindfulness directly
        weightKg: null, // Would need separate weight API call
        scores: {
          steps: stepsScore,
          sleep: sleepScore,
          activity: activityScore,
          readiness: readinessScore,
        },
      },
      heartRateZones,
    };

    return res.status(200).json({
      source: 'fitbit',
      data: healthData,
    });
  } catch (error) {
    console.error('Fitbit API error:', error);
    return res.status(500).json({
      source: 'error',
      data: null,
      message: 'Failed to fetch Fitbit data',
    });
  }
}
