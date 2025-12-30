// Systems Screen - View and manage all behavior change systems
// Shows systems, habits, and system health across all loops

import React, { useState, useMemo } from "react";
import {
  System,
  Habit,
  HabitCompletion,
  LoopId,
  LOOP_COLORS,
  LOOP_DEFINITIONS,
  ALL_LOOPS,
  SYSTEM_TEMPLATES,
  calculateSystemHealth,
  getHabitsDueToday,
  getHabitsDueTodayWithDayType,
} from "../../types";
import { SmartScheduleState, DayType } from "../../types/dayTypes";
import { getDayTypes } from "../../engines/smartSchedulerEngine";
import { SystemBuilder } from "./SystemBuilder";
import { HabitsTracker } from "./HabitsTracker";

type SystemsView = "overview" | "habits" | "systems";

interface SystemsScreenProps {
  systems: System[];
  habits: Habit[];
  completions: HabitCompletion[];
  smartSchedule?: SmartScheduleState;
  onAddSystem: (system: System) => void;
  onUpdateSystem: (system: System) => void;
  onDeleteSystem: (systemId: string) => void;
  onAddHabit: (habit: Habit) => void;
  onUpdateHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onCompleteHabit: (habitId: string, date: string, notes?: string) => void;
  onUncompleteHabit: (habitId: string, date: string) => void;
}

export function SystemsScreen({
  systems,
  habits,
  completions,
  smartSchedule,
  onAddSystem,
  onUpdateSystem,
  onDeleteSystem,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit,
  onCompleteHabit,
  onUncompleteHabit,
}: SystemsScreenProps) {
  const [view, setView] = useState<SystemsView>("overview");
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedLoop, setSelectedLoop] = useState<LoopId | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);

  const today = new Date().toISOString().split("T")[0];

  // Get today's day types (now supports multiple day types per day)
  const todayDayTypes = useMemo(() => {
    if (!smartSchedule?.enabled) return ["regular"] as DayType[];
    return getDayTypes(new Date(), smartSchedule);
  }, [smartSchedule]);

  // Get habits due today with day type filtering
  const todayHabits = useMemo(() => {
    if (smartSchedule?.enabled) {
      return getHabitsDueTodayWithDayType(habits, todayDayTypes);
    }
    return getHabitsDueToday(habits);
  }, [habits, smartSchedule?.enabled, todayDayTypes]);

  const completedToday = todayHabits.filter(h =>
    completions.some(c => c.habitId === h.id && c.date === today)
  ).length;

  // Calculate overall health
  const activeSystemsCount = systems.filter(s => s.status === "active").length;
  const totalStreaks = habits.reduce((sum, h) => sum + h.streak, 0);

  const handleCreateSystem = (system: System, newHabits: Habit[]) => {
    onAddSystem(system);
    newHabits.forEach(h => onAddHabit(h));
    setShowBuilder(false);
  };

  if (showBuilder) {
    return (
      <SystemBuilder
        onComplete={handleCreateSystem}
        onCancel={() => setShowBuilder(false)}
        initialLoop={selectedLoop || undefined}
      />
    );
  }

  return (
    <div className="systems-screen">
      <div className="systems-header">
        <div className="systems-header-content">
          <h1>Systems & Habits</h1>
          <p className="systems-subtitle">
            Build behavior systems that make success inevitable
          </p>
        </div>
        <button
          className="systems-add-btn"
          onClick={() => setShowBuilder(true)}
        >
          + New System
        </button>
      </div>

      {/* Quick Stats */}
      <div className="systems-stats">
        <div className="systems-stat">
          <span className="systems-stat-value">{completedToday}/{todayHabits.length}</span>
          <span className="systems-stat-label">Habits Today</span>
          <div className="systems-stat-bar">
            <div
              className="systems-stat-fill"
              style={{
                width: todayHabits.length > 0
                  ? `${(completedToday / todayHabits.length) * 100}%`
                  : "0%"
              }}
            />
          </div>
        </div>
        <div className="systems-stat">
          <span className="systems-stat-value">{activeSystemsCount}</span>
          <span className="systems-stat-label">Active Systems</span>
        </div>
        <div className="systems-stat">
          <span className="systems-stat-value">🔥 {totalStreaks}</span>
          <span className="systems-stat-label">Total Streaks</span>
        </div>
      </div>

      {/* View Tabs */}
      <div className="systems-tabs">
        <button
          className={`systems-tab ${view === "overview" ? "active" : ""}`}
          onClick={() => setView("overview")}
        >
          Overview
        </button>
        <button
          className={`systems-tab ${view === "habits" ? "active" : ""}`}
          onClick={() => setView("habits")}
        >
          Today's Habits
        </button>
        <button
          className={`systems-tab ${view === "systems" ? "active" : ""}`}
          onClick={() => setView("systems")}
        >
          All Systems
        </button>
      </div>

      {/* Content */}
      <div className="systems-content">
        {view === "overview" && (
          <div className="systems-overview">
            {/* Today's Habits Section */}
            <section className="systems-section">
              <h2>Today's Habits</h2>
              <HabitsTracker
                habits={habits}
                completions={completions}
                smartSchedule={smartSchedule}
                onComplete={onCompleteHabit}
                onUncomplete={onUncompleteHabit}
                onUpdateHabit={onUpdateHabit}
                onDeleteHabit={onDeleteHabit}
              />
            </section>

            {/* Active Systems Section */}
            <section className="systems-section">
              <h2>Active Systems</h2>
              {systems.filter(s => s.status === "active").length === 0 ? (
                <div className="systems-empty">
                  <span className="systems-empty-icon">🎯</span>
                  <h3>No active systems</h3>
                  <p>Create your first behavior system to start building lasting habits</p>
                  <button
                    className="systems-empty-btn"
                    onClick={() => setShowBuilder(true)}
                  >
                    + Create System
                  </button>
                </div>
              ) : (
                <div className="systems-grid">
                  {systems.filter(s => s.status === "active").map(system => {
                    const systemHabits = habits.filter(h => h.systemId === system.id);
                    const health = calculateSystemHealth(system, systemHabits, completions);

                    return (
                      <div
                        key={system.id}
                        className="system-card"
                        onClick={() => setSelectedSystem(system)}
                        style={{
                          "--loop-color": LOOP_COLORS[system.loop]
                        } as React.CSSProperties}
                      >
                        <div className="system-card-header">
                          <span className="system-card-loop">
                            {LOOP_DEFINITIONS[system.loop].icon} {system.loop}
                          </span>
                          <span className="system-card-health">{health}%</span>
                        </div>
                        <h3 className="system-card-title">{system.title}</h3>
                        <p className="system-card-goal">{system.goalStatement}</p>
                        <div className="system-card-stats">
                          <span>{systemHabits.length} habits</span>
                          <span>Started {new Date(system.startedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="system-card-health-bar">
                          <div
                            className="system-card-health-fill"
                            style={{ width: `${health}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Quick Start Templates */}
            {systems.length < 3 && (
              <section className="systems-section">
                <h2>Quick Start Templates</h2>
                <div className="templates-scroll">
                  {SYSTEM_TEMPLATES.slice(0, 4).map(template => (
                    <button
                      key={template.id}
                      className="template-quick-card"
                      onClick={() => {
                        setSelectedLoop(template.loop);
                        setShowBuilder(true);
                      }}
                      style={{
                        "--loop-color": LOOP_COLORS[template.loop]
                      } as React.CSSProperties}
                    >
                      <span className="template-quick-loop">
                        {LOOP_DEFINITIONS[template.loop].icon}
                      </span>
                      <span className="template-quick-title">{template.title}</span>
                      <span className="template-quick-duration">{template.estimatedDuration}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {view === "habits" && (
          <div className="systems-habits-view">
            <div className="loop-filter-bar">
              <button
                className={`loop-filter-btn ${selectedLoop === null ? "active" : ""}`}
                onClick={() => setSelectedLoop(null)}
              >
                All Loops
              </button>
              {ALL_LOOPS.map(loop => (
                <button
                  key={loop}
                  className={`loop-filter-btn ${selectedLoop === loop ? "active" : ""}`}
                  onClick={() => setSelectedLoop(loop)}
                  style={{ "--loop-color": LOOP_COLORS[loop] } as React.CSSProperties}
                >
                  {LOOP_DEFINITIONS[loop].icon} {loop}
                </button>
              ))}
            </div>

            <HabitsTracker
              habits={habits}
              completions={completions}
              smartSchedule={smartSchedule}
              onComplete={onCompleteHabit}
              onUncomplete={onUncompleteHabit}
              onUpdateHabit={onUpdateHabit}
              onDeleteHabit={onDeleteHabit}
              filterLoop={selectedLoop || undefined}
              showAll={false}
            />
          </div>
        )}

        {view === "systems" && (
          <div className="systems-all-view">
            <div className="loop-filter-bar">
              <button
                className={`loop-filter-btn ${selectedLoop === null ? "active" : ""}`}
                onClick={() => setSelectedLoop(null)}
              >
                All Loops
              </button>
              {ALL_LOOPS.map(loop => (
                <button
                  key={loop}
                  className={`loop-filter-btn ${selectedLoop === loop ? "active" : ""}`}
                  onClick={() => setSelectedLoop(loop)}
                  style={{ "--loop-color": LOOP_COLORS[loop] } as React.CSSProperties}
                >
                  {LOOP_DEFINITIONS[loop].icon} {loop}
                </button>
              ))}
            </div>

            <div className="systems-list">
              {systems
                .filter(s => !selectedLoop || s.loop === selectedLoop)
                .map(system => {
                  const systemHabits = habits.filter(h => h.systemId === system.id);
                  const health = calculateSystemHealth(system, systemHabits, completions);

                  return (
                    <div
                      key={system.id}
                      className="system-list-item"
                      style={{
                        "--loop-color": LOOP_COLORS[system.loop]
                      } as React.CSSProperties}
                    >
                      <div className="system-list-main">
                        <div className="system-list-header">
                          <span className="system-list-loop">
                            {LOOP_DEFINITIONS[system.loop].icon} {system.loop}
                          </span>
                          <span className={`system-list-status status--${system.status}`}>
                            {system.status}
                          </span>
                        </div>
                        <h3 className="system-list-title">{system.title}</h3>
                        <p className="system-list-identity">{system.identity.statement}</p>
                      </div>
                      <div className="system-list-stats">
                        <div className="system-list-health">
                          <span className="health-value">{health}%</span>
                          <span className="health-label">Health</span>
                        </div>
                        <div className="system-list-habits">
                          <span className="habits-value">{systemHabits.length}</span>
                          <span className="habits-label">Habits</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {systems.filter(s => !selectedLoop || s.loop === selectedLoop).length === 0 && (
                <div className="systems-empty">
                  <p>No systems {selectedLoop ? `for ${selectedLoop}` : ""}</p>
                  <button
                    className="systems-empty-btn"
                    onClick={() => setShowBuilder(true)}
                  >
                    + Create System
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SystemsScreen;
