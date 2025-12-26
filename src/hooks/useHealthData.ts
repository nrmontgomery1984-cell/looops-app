// Shared hook for fetching health data from Fitbit API or Google Sheets
import { useState, useEffect, useCallback } from 'react';

export interface HealthData {
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
    caloriesIn?: number;
    waterOz?: number;
    scores?: {
      steps: number | null;
      sleep: number | null;
      activity: number | null;
      readiness: number | null;
    };
  } | null;
  weeklyAvg: {
    steps: number;
    sleepDurationHours: number;
    activeMinutes: number;
    mindfulnessMinutes: number;
  } | null;
  weeklyData: any[];
  mindfulnessStreak: number;
}

interface UseHealthDataResult {
  data: HealthData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Singleton cache for health data to avoid multiple simultaneous requests
let cachedData: HealthData | null = null;
let lastFetchTime: number = 0;
let fetchPromise: Promise<HealthData | null> | null = null;
const CACHE_DURATION = 60 * 1000; // 1 minute cache

async function fetchHealthData(): Promise<HealthData | null> {
  // Check if we have Fitbit tokens in localStorage
  const fitbitTokens = localStorage.getItem('looops_fitbit_tokens');

  if (fitbitTokens) {
    // Use direct Fitbit API with stored tokens
    try {
      const tokens = JSON.parse(fitbitTokens);
      const response = await fetch("/api/fitbit/health", {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });
      const result = await response.json();

      // Handle token expiration
      if (result.needsReauth) {
        localStorage.removeItem('looops_fitbit_tokens');
        throw new Error("Fitbit session expired. Please reconnect in Integrations.");
      }

      if (result.source === "error" || result.data === null) {
        throw new Error(result.message || "Failed to fetch Fitbit data");
      }

      // Transform Fitbit API response to match HealthData structure
      return {
        today: result.data.today,
        weeklyAvg: null, // Fitbit direct API doesn't have weekly averages yet
        weeklyData: [],
        mindfulnessStreak: 0,
      };
    } catch (err) {
      console.error("Fitbit API error:", err);
      throw err;
    }
  } else {
    // Fall back to Google Sheets (IFTTT) data
    const response = await fetch("/api/health/summary");
    const result = await response.json();

    if (result.source === "local" || result.data === null) {
      throw new Error("Health data not configured. Connect Fitbit in Integrations.");
    }

    return {
      today: result.data.today,
      weeklyAvg: result.data.weeklyAvg,
      weeklyData: result.data.weeklyData || [],
      mindfulnessStreak: result.data.mindfulnessStreak || 0,
    };
  }
}

export function useHealthData(): UseHealthDataResult {
  const [data, setData] = useState<HealthData | null>(cachedData);
  const [isLoading, setIsLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const now = Date.now();

    // If there's an ongoing fetch, wait for it
    if (fetchPromise) {
      try {
        const result = await fetchPromise;
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch health data");
      }
      return;
    }

    // If cache is still valid, use it
    if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
      setData(cachedData);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      fetchPromise = fetchHealthData();
      const result = await fetchPromise;
      cachedData = result;
      lastFetchTime = Date.now();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch health data");
      setData(null);
    } finally {
      setIsLoading(false);
      fetchPromise = null;
    }
  }, []);

  useEffect(() => {
    refetch();

    // Refresh every 5 minutes
    const interval = setInterval(refetch, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

// Export a function to clear the cache (useful when reconnecting integrations)
export function clearHealthDataCache(): void {
  cachedData = null;
  lastFetchTime = 0;
}
