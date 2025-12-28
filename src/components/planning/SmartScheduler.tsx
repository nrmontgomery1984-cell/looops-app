// SmartScheduler - Main container for smart scheduling features
import { useState } from "react";
import { useApp, useSmartSchedule, useRoutines } from "../../context/AppContext";
import { DEFAULT_DAY_TYPE_CONFIGS } from "../../types/dayTypes";
import {
  getDayType,
  getDayTypeConfig,
  getTodayScheduleSummary,
} from "../../engines/smartSchedulerEngine";
import { CustodyCalendar } from "./CustodyCalendar";
import { DayTypeConfigEditor } from "./DayTypeConfigEditor";

type SmartSchedulerView = "overview" | "calendar" | "config";

export function SmartScheduler() {
  const { dispatch } = useApp();
  const smartSchedule = useSmartSchedule();
  const { items: routines } = useRoutines();

  const [activeView, setActiveView] = useState<SmartSchedulerView>("overview");

  const today = new Date();
  const todaySummary = getTodayScheduleSummary(routines, smartSchedule, today);
  const todayConfig = getDayTypeConfig(todaySummary.dayType, smartSchedule);

  const toggleEnabled = () => {
    dispatch({
      type: "SET_SMART_SCHEDULE_ENABLED",
      payload: !smartSchedule.enabled,
    });
  };

  const renderOverview = () => (
    <div className="smart-scheduler-overview">
      {/* Today's Status */}
      <div className="smart-today-card">
        <div
          className="smart-today-badge"
          style={{ background: todayConfig.color }}
        >
          <span className="smart-today-icon">{todayConfig.icon}</span>
          <span className="smart-today-label">{todayConfig.label}</span>
        </div>
        <div className="smart-today-info">
          <p className="smart-today-date">
            {today.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          {todaySummary.disabledRoutineCount > 0 && (
            <p className="smart-today-note">
              {todaySummary.disabledRoutineCount} routine(s) adjusted for this day type
            </p>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="smart-stats-grid">
        <div className="smart-stat-card">
          <span className="smart-stat-value">
            {smartSchedule.markedDates.length}
          </span>
          <span className="smart-stat-label">Marked Dates</span>
        </div>
        <div className="smart-stat-card">
          <span className="smart-stat-value">
            {smartSchedule.markedDates.filter(m => m.dayType === "custody").length}
          </span>
          <span className="smart-stat-label">Custody Days</span>
        </div>
        <div className="smart-stat-card">
          <span className="smart-stat-value">
            {smartSchedule.markedDates.filter(m => m.dayType === "holiday").length}
          </span>
          <span className="smart-stat-label">Holidays</span>
        </div>
      </div>

      {/* Upcoming Special Days */}
      <div className="smart-upcoming">
        <h4>Upcoming Special Days</h4>
        <div className="smart-upcoming-list">
          {smartSchedule.markedDates
            .filter(m => {
              const date = new Date(m.date);
              return date >= today;
            })
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 5)
            .map(m => {
              const date = new Date(m.date);
              const config = DEFAULT_DAY_TYPE_CONFIGS[m.dayType];
              return (
                <div key={m.date} className="smart-upcoming-item">
                  <span
                    className="smart-upcoming-icon"
                    style={{ background: config.color }}
                  >
                    {config.icon}
                  </span>
                  <span className="smart-upcoming-date">
                    {date.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="smart-upcoming-type">{config.label}</span>
                </div>
              );
            })}
          {smartSchedule.markedDates.filter(m => new Date(m.date) >= today).length === 0 && (
            <p className="smart-upcoming-empty">
              No upcoming marked dates. Use the calendar to mark special days.
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="smart-actions">
        <button
          className="smart-action-btn primary"
          onClick={() => setActiveView("calendar")}
        >
          <span>📅</span>
          Mark Dates
        </button>
        <button
          className="smart-action-btn"
          onClick={() => setActiveView("config")}
        >
          <span>⚙️</span>
          Configure Day Types
        </button>
      </div>
    </div>
  );

  return (
    <div className="smart-scheduler">
      {/* Header */}
      <div className="smart-scheduler-header">
        <div className="smart-header-title">
          <h3>Smart Scheduler</h3>
          <p className="smart-header-subtitle">
            Automatically adjusts your routines based on day type
          </p>
        </div>
        <label className="smart-toggle">
          <input
            type="checkbox"
            checked={smartSchedule.enabled}
            onChange={toggleEnabled}
          />
          <span className="smart-toggle-slider" />
          <span className="smart-toggle-label">
            {smartSchedule.enabled ? "Enabled" : "Disabled"}
          </span>
        </label>
      </div>

      {/* Navigation Tabs (when not on overview) */}
      {activeView !== "overview" && (
        <div className="smart-nav-tabs">
          <button
            className={`smart-nav-tab ${activeView === "calendar" ? "active" : ""}`}
            onClick={() => setActiveView("calendar")}
          >
            Calendar
          </button>
          <button
            className={`smart-nav-tab ${activeView === "config" ? "active" : ""}`}
            onClick={() => setActiveView("config")}
          >
            Day Types
          </button>
          <button
            className="smart-nav-tab back"
            onClick={() => setActiveView("overview")}
          >
            &larr; Back
          </button>
        </div>
      )}

      {/* Content */}
      <div className="smart-scheduler-content">
        {!smartSchedule.enabled ? (
          <div className="smart-disabled-notice">
            <p>Smart Scheduler is disabled.</p>
            <p className="smart-disabled-hint">
              Enable it to automatically adjust routines and tasks based on day type
              (workdays, weekends, custody days, holidays, etc.)
            </p>
          </div>
        ) : (
          <>
            {activeView === "overview" && renderOverview()}
            {activeView === "calendar" && (
              <CustodyCalendar onClose={() => setActiveView("overview")} />
            )}
            {activeView === "config" && (
              <DayTypeConfigEditor onClose={() => setActiveView("overview")} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SmartScheduler;
