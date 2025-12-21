// Sleep & Readiness Widget - Fitbit sleep and readiness data
import React, { useEffect, useState } from "react";
import { getHealthStatusColor, formatSleepHours } from "../../types";

interface SleepData {
  sleepDurationHours: number;
  sleepScore: number | null;
  restingHeartRate: number | null;
  scores?: {
    readiness: number | null;
    sleep: number | null;
  };
}

interface WeeklyData {
  sleepDurationHours: number;
}

export function SleepReadinessWidget() {
  const [data, setData] = useState<SleepData | null>(null);
  const [weeklyAvg, setWeeklyAvg] = useState<WeeklyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/health/summary");
      const result = await response.json();

      if (result.source === "local" || result.data === null) {
        setError("Connect Fitbit via IFTTT");
        setData(null);
      } else {
        setData(result.data.today);
        setWeeklyAvg(result.data.weeklyAvg);
      }
    } catch {
      setError("Server offline");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !data) {
    return (
      <div className="fitbit-widget fitbit-widget--loading">
        <div className="fitbit-loading-spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="fitbit-widget fitbit-widget--error">
        <span className="fitbit-error-icon">😴</span>
        <p>{error}</p>
        <button className="fitbit-retry-btn" onClick={fetchData}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fitbit-widget fitbit-widget--empty">
        <span className="fitbit-empty-icon">😴</span>
        <p>No sleep data</p>
      </div>
    );
  }

  const readinessScore = data.scores?.readiness ?? null;
  const sleepScore = data.scores?.sleep ?? null;
  const readinessStatus = getHealthStatusColor("readiness", readinessScore);

  return (
    <div className="fitbit-widget sleep-readiness-widget">
      {/* Readiness Score - Main Focus */}
      <div className="fitbit-hero">
        <div className={`fitbit-hero-score fitbit-status--${readinessStatus}`}>
          <span className="fitbit-hero-value">{readinessScore ?? "--"}</span>
          <span className="fitbit-hero-label">Readiness</span>
        </div>
      </div>

      {/* Sleep Metrics */}
      <div className="fitbit-metrics">
        <div className={`fitbit-metric fitbit-status--${getHealthStatusColor("sleep", sleepScore)}`}>
          <span className="fitbit-metric-icon">🛏️</span>
          <div className="fitbit-metric-content">
            <span className="fitbit-metric-value">{formatSleepHours(data.sleepDurationHours)}</span>
            <span className="fitbit-metric-label">Sleep</span>
          </div>
        </div>

        {data.sleepScore !== null && (
          <div className="fitbit-metric">
            <span className="fitbit-metric-icon">⭐</span>
            <div className="fitbit-metric-content">
              <span className="fitbit-metric-value">{data.sleepScore}</span>
              <span className="fitbit-metric-label">Score</span>
            </div>
          </div>
        )}

        {data.restingHeartRate !== null && (
          <div className="fitbit-metric">
            <span className="fitbit-metric-icon">❤️</span>
            <div className="fitbit-metric-content">
              <span className="fitbit-metric-value">{data.restingHeartRate}</span>
              <span className="fitbit-metric-label">RHR</span>
            </div>
          </div>
        )}
      </div>

      {/* Weekly Average */}
      {weeklyAvg && (
        <div className="fitbit-footer">
          <span className="fitbit-avg">
            7-day avg: {formatSleepHours(weeklyAvg.sleepDurationHours)}
          </span>
        </div>
      )}
    </div>
  );
}
