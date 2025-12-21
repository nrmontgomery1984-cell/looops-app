// Steps Widget - Focused step counter with progress ring
import React, { useEffect, useState } from "react";
import { getHealthStatusColor, formatSteps, HEALTH_THRESHOLDS } from "../../types";

interface StepsData {
  steps: number;
  distanceKm: number;
}

interface WeeklyAvg {
  steps: number;
}

export function StepsWidget() {
  const [data, setData] = useState<StepsData | null>(null);
  const [weeklyAvg, setWeeklyAvg] = useState<WeeklyAvg | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/health/summary");
      const result = await response.json();

      if (result.source === "local" || result.data === null) {
        setError("Connect Fitbit");
        setData(null);
      } else {
        setData({
          steps: result.data.today?.steps || 0,
          distanceKm: result.data.today?.distanceKm || 0,
        });
        setWeeklyAvg(result.data.weeklyAvg);
      }
    } catch {
      setError("Offline");
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
      <div className="steps-widget steps-widget--loading">
        <div className="steps-loading-spinner" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="steps-widget steps-widget--error">
        <span className="steps-error-icon">👟</span>
        <p>{error}</p>
        <button className="steps-retry-btn" onClick={fetchData}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="steps-widget steps-widget--empty">
        <span className="steps-empty-icon">👟</span>
        <p>No data</p>
      </div>
    );
  }

  const stepsGoal = HEALTH_THRESHOLDS.steps.good; // 10,000
  const stepsPercent = Math.min(100, Math.round((data.steps / stepsGoal) * 100));
  const statusColor = getHealthStatusColor("steps", data.steps);

  return (
    <div className="steps-widget">
      <div className={`steps-ring-container steps-status--${statusColor}`}>
        <svg className="steps-ring" viewBox="0 0 100 100">
          <circle
            className="steps-ring-bg"
            cx="50"
            cy="50"
            r="42"
            fill="none"
            strokeWidth="8"
          />
          <circle
            className="steps-ring-fill"
            cx="50"
            cy="50"
            r="42"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${stepsPercent * 2.64} 264`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="steps-content">
          <span className="steps-value">{formatSteps(data.steps)}</span>
          <span className="steps-label">steps</span>
        </div>
      </div>

      <div className="steps-details">
        <div className="steps-goal">
          <span className="steps-goal-percent">{stepsPercent}%</span>
          <span className="steps-goal-label">of {formatSteps(stepsGoal)} goal</span>
        </div>
        {data.distanceKm > 0 && (
          <div className="steps-distance">
            <span className="steps-distance-value">{data.distanceKm.toFixed(1)}</span>
            <span className="steps-distance-unit">km</span>
          </div>
        )}
      </div>

      {weeklyAvg && (
        <div className="steps-footer">
          <span className="steps-avg">Avg: {formatSteps(weeklyAvg.steps)}/day</span>
        </div>
      )}
    </div>
  );
}
