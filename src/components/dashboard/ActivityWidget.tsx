// Activity Widget - Fitbit steps, active minutes, distance, calories
import React, { useEffect, useState } from "react";
import { getHealthStatusColor, formatSteps, HEALTH_THRESHOLDS } from "../../types";

interface ActivityData {
  steps: number;
  activeMinutes: number;
  distanceKm: number;
  caloriesBurned: number;
  floors?: number;
}

interface WeeklyData {
  steps: number;
  activeMinutes: number;
}

export function ActivityWidget() {
  const [data, setData] = useState<ActivityData | null>(null);
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
        <span className="fitbit-error-icon">🏃</span>
        <p>{error}</p>
        <button className="fitbit-retry-btn" onClick={fetchData}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fitbit-widget fitbit-widget--empty">
        <span className="fitbit-empty-icon">🏃</span>
        <p>No activity data</p>
      </div>
    );
  }

  const stepsGoal = HEALTH_THRESHOLDS.steps.good;
  const stepsPercent = Math.min(100, Math.round((data.steps / stepsGoal) * 100));
  const activeGoal = HEALTH_THRESHOLDS.activity.good;
  const activePercent = Math.min(100, Math.round((data.activeMinutes / activeGoal) * 100));

  return (
    <div className="fitbit-widget activity-widget">
      {/* Steps - Main Focus */}
      <div className="fitbit-hero fitbit-hero--steps">
        <div className={`fitbit-hero-ring fitbit-status--${getHealthStatusColor("steps", data.steps)}`}>
          <svg viewBox="0 0 100 100">
            <circle className="fitbit-ring-bg" cx="50" cy="50" r="42" />
            <circle
              className="fitbit-ring-fill"
              cx="50"
              cy="50"
              r="42"
              strokeDasharray={`${stepsPercent * 2.64} 264`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="fitbit-hero-content">
            <span className="fitbit-hero-value">{formatSteps(data.steps)}</span>
            <span className="fitbit-hero-label">steps</span>
          </div>
        </div>
      </div>

      {/* Activity Metrics */}
      <div className="fitbit-metrics">
        <div className={`fitbit-metric fitbit-status--${getHealthStatusColor("activity", data.activeMinutes)}`}>
          <span className="fitbit-metric-icon">⚡</span>
          <div className="fitbit-metric-content">
            <span className="fitbit-metric-value">{data.activeMinutes}m</span>
            <span className="fitbit-metric-label">Active</span>
          </div>
          <div className="fitbit-metric-bar">
            <div className="fitbit-metric-bar-fill" style={{ width: `${activePercent}%` }} />
          </div>
        </div>

        {data.distanceKm > 0 && (
          <div className="fitbit-metric">
            <span className="fitbit-metric-icon">📍</span>
            <div className="fitbit-metric-content">
              <span className="fitbit-metric-value">{data.distanceKm.toFixed(1)}</span>
              <span className="fitbit-metric-label">km</span>
            </div>
          </div>
        )}

        {data.caloriesBurned > 0 && (
          <div className="fitbit-metric">
            <span className="fitbit-metric-icon">🔥</span>
            <div className="fitbit-metric-content">
              <span className="fitbit-metric-value">{data.caloriesBurned.toLocaleString()}</span>
              <span className="fitbit-metric-label">cal</span>
            </div>
          </div>
        )}

        {data.floors && data.floors > 0 && (
          <div className="fitbit-metric">
            <span className="fitbit-metric-icon">🪜</span>
            <div className="fitbit-metric-content">
              <span className="fitbit-metric-value">{data.floors}</span>
              <span className="fitbit-metric-label">floors</span>
            </div>
          </div>
        )}
      </div>

      {/* Weekly Average */}
      {weeklyAvg && (
        <div className="fitbit-footer">
          <span className="fitbit-avg">
            7-day avg: {formatSteps(weeklyAvg.steps)} steps
          </span>
        </div>
      )}
    </div>
  );
}
