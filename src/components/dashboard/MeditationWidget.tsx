// Meditation Widget - Fitbit mindfulness data for Health loop
import React, { useEffect, useState } from "react";

interface MeditationData {
  mindfulnessMinutes: number;
  mindfulnessStreak: number;
}

export function MeditationWidget() {
  const [data, setData] = useState<MeditationData | null>(null);
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
        setData({
          mindfulnessMinutes: result.data.today?.mindfulnessMinutes || 0,
          mindfulnessStreak: result.data.mindfulnessStreak || 0,
        });
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

  const handleOpenMeditation = () => {
    // Open Fitbit meditation or a meditation app
    window.open("https://www.fitbit.com/mindfulness", "_blank");
  };

  if (isLoading && !data) {
    return (
      <div className="meditation-widget meditation-widget--loading">
        <div className="meditation-loading-spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="meditation-widget meditation-widget--error">
        <span className="meditation-error-icon">🧘</span>
        <p>{error}</p>
        <button className="meditation-retry-btn" onClick={fetchData}>Retry</button>
      </div>
    );
  }

  const minutes = data?.mindfulnessMinutes || 0;
  const streak = data?.mindfulnessStreak || 0;
  const goalMinutes = 10;
  const progress = Math.min(100, Math.round((minutes / goalMinutes) * 100));

  return (
    <div className="meditation-widget">
      {/* Today's Progress */}
      <div className="meditation-hero">
        <div className="meditation-circle">
          <svg viewBox="0 0 100 100">
            <circle className="meditation-circle-bg" cx="50" cy="50" r="42" />
            <circle
              className="meditation-circle-fill"
              cx="50"
              cy="50"
              r="42"
              strokeDasharray={`${progress * 2.64} 264`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="meditation-circle-content">
            <span className="meditation-minutes">{minutes}</span>
            <span className="meditation-label">min</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="meditation-stats">
        <div className="meditation-stat">
          <span className="meditation-stat-icon">🔥</span>
          <div className="meditation-stat-content">
            <span className="meditation-stat-value">{streak}</span>
            <span className="meditation-stat-label">Day Streak</span>
          </div>
        </div>
        <div className="meditation-stat">
          <span className="meditation-stat-icon">🎯</span>
          <div className="meditation-stat-content">
            <span className="meditation-stat-value">{goalMinutes}m</span>
            <span className="meditation-stat-label">Daily Goal</span>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <div className="meditation-actions">
        <button className="meditation-start-btn" onClick={handleOpenMeditation}>
          🧘 Start Session
        </button>
      </div>

      {/* Encouragement */}
      {minutes === 0 && (
        <div className="meditation-encouragement">
          Take a moment to breathe today
        </div>
      )}
      {minutes > 0 && minutes < goalMinutes && (
        <div className="meditation-encouragement">
          {goalMinutes - minutes} more minutes to reach your goal
        </div>
      )}
      {minutes >= goalMinutes && (
        <div className="meditation-encouragement meditation-encouragement--success">
          Goal reached! Great job today 🎉
        </div>
      )}
    </div>
  );
}

export default MeditationWidget;
