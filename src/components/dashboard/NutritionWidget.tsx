// Nutrition Widget - Calories, water, weight tracking
import React, { useEffect, useState } from "react";

interface NutritionData {
  caloriesIn: number;
  caloriesBurned: number;
  waterOz: number;
  weight?: number;
  weightUnit?: string;
}

interface WeeklyData {
  caloriesIn: number;
  weight?: number;
}

export function NutritionWidget() {
  const [data, setData] = useState<NutritionData | null>(null);
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
        // Map the health data to nutrition fields
        const today = result.data.today;
        setData({
          caloriesIn: today.caloriesIn || 0,
          caloriesBurned: today.caloriesBurned || 0,
          waterOz: today.waterOz || 0,
          weight: today.weight,
          weightUnit: today.weightUnit || "lbs",
        });
        if (result.data.weeklyAvg) {
          setWeeklyAvg({
            caloriesIn: result.data.weeklyAvg.caloriesIn || 0,
            weight: result.data.weeklyAvg.weight,
          });
        }
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
        <span className="fitbit-error-icon">🥗</span>
        <p>{error}</p>
        <button className="fitbit-retry-btn" onClick={fetchData}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fitbit-widget fitbit-widget--empty">
        <span className="fitbit-empty-icon">🥗</span>
        <p>No nutrition data</p>
      </div>
    );
  }

  const calorieBalance = data.caloriesIn - data.caloriesBurned;
  const balanceStatus = calorieBalance > 500 ? "over" : calorieBalance < -500 ? "under" : "balanced";
  const waterGoal = 64; // 64 oz = 8 glasses
  const waterPercent = Math.min(100, Math.round((data.waterOz / waterGoal) * 100));

  return (
    <div className="fitbit-widget nutrition-widget">
      {/* Calorie Balance - Main Focus */}
      <div className="fitbit-hero fitbit-hero--calories">
        <div className="nutrition-balance">
          <div className="nutrition-balance-row">
            <span className="nutrition-label">In</span>
            <span className="nutrition-value nutrition-value--in">
              {data.caloriesIn > 0 ? data.caloriesIn.toLocaleString() : "--"}
            </span>
          </div>
          <div className="nutrition-balance-row">
            <span className="nutrition-label">Out</span>
            <span className="nutrition-value nutrition-value--out">
              {data.caloriesBurned > 0 ? data.caloriesBurned.toLocaleString() : "--"}
            </span>
          </div>
          <div className={`nutrition-balance-row nutrition-balance-total nutrition-balance--${balanceStatus}`}>
            <span className="nutrition-label">=</span>
            <span className="nutrition-value">
              {calorieBalance > 0 ? "+" : ""}{calorieBalance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Water & Weight */}
      <div className="fitbit-metrics">
        <div className="fitbit-metric">
          <span className="fitbit-metric-icon">💧</span>
          <div className="fitbit-metric-content">
            <span className="fitbit-metric-value">
              {data.waterOz > 0 ? `${data.waterOz}oz` : "--"}
            </span>
            <span className="fitbit-metric-label">Water</span>
          </div>
          {data.waterOz > 0 && (
            <div className="fitbit-metric-bar">
              <div className="fitbit-metric-bar-fill fitbit-metric-bar--water" style={{ width: `${waterPercent}%` }} />
            </div>
          )}
        </div>

        {data.weight && (
          <div className="fitbit-metric">
            <span className="fitbit-metric-icon">⚖️</span>
            <div className="fitbit-metric-content">
              <span className="fitbit-metric-value">
                {data.weight.toFixed(1)}
              </span>
              <span className="fitbit-metric-label">{data.weightUnit}</span>
            </div>
          </div>
        )}
      </div>

      {/* Weekly Trend */}
      {weeklyAvg && weeklyAvg.weight && data.weight && (
        <div className="fitbit-footer">
          <span className="fitbit-avg">
            {data.weight > weeklyAvg.weight ? "↑" : data.weight < weeklyAvg.weight ? "↓" : "→"}
            {" "}
            {Math.abs(data.weight - weeklyAvg.weight).toFixed(1)} {data.weightUnit} vs avg
          </span>
        </div>
      )}
    </div>
  );
}
