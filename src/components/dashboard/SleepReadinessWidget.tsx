// Sleep & Readiness Widget - Fitbit sleep and readiness data
import React from "react";
import { getHealthStatusColor, formatSleepHours } from "../../types";
import { useHealthData } from "../../hooks/useHealthData";

export function SleepReadinessWidget() {
  const { data: healthData, isLoading, error, refetch } = useHealthData();
  const data = healthData?.today;
  const weeklyAvg = healthData?.weeklyAvg;

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
        <button className="fitbit-retry-btn" onClick={refetch}>Retry</button>
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
