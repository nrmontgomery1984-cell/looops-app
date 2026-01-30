// Health Widget - Display Fitbit data for Health loop
// Data comes from Fitbit API or Google Sheets (via IFTTT)

import React, { useEffect, useState } from "react";
import {
  HealthSummary,
  getHealthStatusColor,
  formatSteps,
  formatSleepHours,
} from "../../types";
import { useHealthData } from "../../hooks/useHealthData";

interface HealthWidgetProps {
  onHealthLoaded?: (summary: HealthSummary) => void;
}

export function HealthWidget({ onHealthLoaded }: HealthWidgetProps) {
  const { data: healthData, isLoading, error, refetch } = useHealthData();
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Convert hook data to HealthSummary format
  const summary: HealthSummary | null = healthData ? {
    today: healthData.today ? {
      ...healthData.today,
      id: `health_${healthData.today.date}`,
      syncedAt: new Date().toISOString(),
      scores: healthData.today.scores || {
        steps: null,
        sleep: null,
        activity: null,
        readiness: null,
      },
    } : null,
    weeklyAvg: healthData.weeklyAvg,
    weeklyData: healthData.weeklyData,
    mindfulnessStreak: healthData.mindfulnessStreak,
  } as HealthSummary : null;

  useEffect(() => {
    if (summary) {
      setLastSynced(new Date().toISOString());
      onHealthLoaded?.(summary);
    }
  }, [healthData]);

  if (isLoading && !summary) {
    return (
      <div className="health-widget health-widget--loading">
        <div className="health-loading-spinner" />
        <span>Loading health data...</span>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="health-widget health-widget--error">
        <span className="health-error-icon">⚠️</span>
        <p className="health-error-message">{error}</p>
        <button className="health-btn" onClick={refetch}>
          Retry
        </button>
      </div>
    );
  }

  if (!summary || !summary.today) {
    return (
      <div className="health-widget health-widget--empty">
        <span className="health-empty-icon">📊</span>
        <p>No health data for today</p>
        <p className="health-hint">Data syncs from Fitbit via IFTTT</p>
      </div>
    );
  }

  const { today, weeklyAvg, mindfulnessStreak } = summary;
  const scores = today.scores;

  return (
    <div className="health-widget">
      {/* Readiness Score */}
      <div className="health-readiness">
        <div className={`health-readiness-score health-status--${getHealthStatusColor("readiness", scores?.readiness ?? null)}`}>
          <span className="health-readiness-value">{scores?.readiness ?? "--"}</span>
          <span className="health-readiness-label">Readiness</span>
        </div>
      </div>

      {/* Today's Metrics */}
      <div className="health-metrics">
        <MetricCard
          icon="👟"
          label="Steps"
          value={formatSteps(today.steps)}
          status={getHealthStatusColor("steps", today.steps)}
          subtext={weeklyAvg ? `Avg: ${formatSteps(weeklyAvg.steps)}` : undefined}
        />
        <MetricCard
          icon="😴"
          label="Sleep"
          value={formatSleepHours(today.sleepDurationHours)}
          status={getHealthStatusColor("sleep", scores?.sleep ?? null)}
          subtext={today.sleepScore ? `Score: ${today.sleepScore}` : undefined}
        />
        <MetricCard
          icon="🏃"
          label="Active"
          value={`${today.activeMinutes}m`}
          status={getHealthStatusColor("activity", today.activeMinutes)}
          subtext={weeklyAvg ? `Avg: ${weeklyAvg.activeMinutes}m` : undefined}
        />
        <MetricCard
          icon="🧘"
          label="Mindful"
          value={`${today.mindfulnessMinutes}m`}
          status={today.mindfulnessMinutes > 0 ? "green" : "gray"}
          subtext={mindfulnessStreak > 0 ? `${mindfulnessStreak} day streak` : undefined}
        />
      </div>

      {/* Additional Stats */}
      <div className="health-stats">
        {today.restingHeartRate && (
          <div className="health-stat">
            <span className="health-stat-icon">❤️</span>
            <span className="health-stat-value">{today.restingHeartRate}</span>
            <span className="health-stat-label">Resting HR</span>
          </div>
        )}
        {today.caloriesBurned > 0 && (
          <div className="health-stat">
            <span className="health-stat-icon">🔥</span>
            <span className="health-stat-value">{today.caloriesBurned.toLocaleString()}</span>
            <span className="health-stat-label">Calories</span>
          </div>
        )}
        {today.distanceKm > 0 && (
          <div className="health-stat">
            <span className="health-stat-icon">📍</span>
            <span className="health-stat-value">{today.distanceKm.toFixed(1)}</span>
            <span className="health-stat-label">km</span>
          </div>
        )}
      </div>

      {/* Sync Info */}
      <div className="health-footer">
        <span className="health-synced">
          {lastSynced
            ? `Updated ${new Date(lastSynced).toLocaleTimeString()}`
            : ""}
        </span>
        <button
          className="health-sync-btn"
          onClick={refetch}
          disabled={isLoading}
        >
          {isLoading ? "..." : "↻"}
        </button>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  icon,
  label,
  value,
  status,
  subtext,
}: {
  icon: string;
  label: string;
  value: string;
  status: "green" | "yellow" | "red" | "gray";
  subtext?: string;
}) {
  return (
    <div className={`health-metric health-status--${status}`}>
      <span className="health-metric-icon">{icon}</span>
      <div className="health-metric-content">
        <span className="health-metric-value">{value}</span>
        <span className="health-metric-label">{label}</span>
        {subtext && <span className="health-metric-subtext">{subtext}</span>}
      </div>
    </div>
  );
}
