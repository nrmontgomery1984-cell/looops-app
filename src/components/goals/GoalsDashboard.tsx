// Goals Dashboard - Overview of all goals with hierarchy visualization

import React, { useState, useMemo } from "react";
import {
  Goal,
  GoalHierarchy,
  GoalTimeframe,
  LoopId,
  LOOP_COLORS,
  LOOP_DEFINITIONS,
  ALL_LOOPS,
  TIMEFRAME_ORDER,
} from "../../types";
import { getChildGoals, calculateGoalProgress } from "../../types/goals";

type ViewMode = "hierarchy" | "timeline" | "byLoop";

type GoalsDashboardProps = {
  goals: GoalHierarchy;
  onGoalClick: (goal: Goal) => void;
  onAddGoal: () => void;
  onUpdateGoal: (goal: Goal) => void;
};

export function GoalsDashboard({
  goals,
  onGoalClick,
  onAddGoal,
  onUpdateGoal,
}: GoalsDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("hierarchy");
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [filterLoop, setFilterLoop] = useState<LoopId | "all">("all");

  // Calculate stats
  const stats = useMemo(() => {
    const allGoals = [
      ...goals.annual,
      ...goals.quarterly,
      ...goals.monthly,
      ...goals.weekly,
      ...goals.daily,
    ];

    const active = allGoals.filter((g) => g.status === "active");
    const completed = allGoals.filter((g) => g.status === "completed");
    const avgProgress = active.length
      ? Math.round(active.reduce((sum, g) => sum + g.progress, 0) / active.length)
      : 0;

    return {
      total: allGoals.length,
      active: active.length,
      completed: completed.length,
      avgProgress,
      byTimeframe: {
        annual: goals.annual.length,
        quarterly: goals.quarterly.length,
        monthly: goals.monthly.length,
        weekly: goals.weekly.length,
        daily: goals.daily.length,
      },
    };
  }, [goals]);

  // Filter goals by loop
  const filteredGoals = useMemo(() => {
    if (filterLoop === "all") return goals;
    return {
      annual: goals.annual.filter((g) => g.loop === filterLoop),
      quarterly: goals.quarterly.filter((g) => g.loop === filterLoop),
      monthly: goals.monthly.filter((g) => g.loop === filterLoop),
      weekly: goals.weekly.filter((g) => g.loop === filterLoop),
      daily: goals.daily.filter((g) => g.loop === filterLoop),
    };
  }, [goals, filterLoop]);

  // Toggle goal expansion
  const toggleExpand = (goalId: string) => {
    setExpandedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  // Update goal progress
  const handleProgressChange = (goal: Goal, progress: number) => {
    onUpdateGoal({ ...goal, progress, updatedAt: new Date().toISOString() });
  };

  // Render goal card
  const renderGoalCard = (goal: Goal, depth: number = 0) => {
    const color = LOOP_COLORS[goal.loop];
    const def = LOOP_DEFINITIONS[goal.loop];
    const children = getChildGoals(goals, goal.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedGoals.has(goal.id);

    return (
      <div key={goal.id} className="goal-card-wrapper" style={{ marginLeft: depth * 24 }}>
        <div
          className={`goal-card goal-card--${goal.status}`}
          style={{ borderLeftColor: color.border }}
        >
          <div className="goal-card__header">
            <div className="goal-card__title-row">
              {hasChildren && (
                <button
                  className="goal-card__expand"
                  onClick={() => toggleExpand(goal.id)}
                >
                  {isExpanded ? "▼" : "▶"}
                </button>
              )}
              <span
                className="goal-card__loop-badge"
                style={{ backgroundColor: color.border }}
              >
                {def.icon}
              </span>
              <h4
                className="goal-card__title"
                onClick={() => onGoalClick(goal)}
              >
                {goal.title}
              </h4>
              <span className="goal-card__timeframe">{goal.timeframe}</span>
            </div>
          </div>

          <div className="goal-card__progress-row">
            <div className="goal-card__progress-bar">
              <div
                className="goal-card__progress-fill"
                style={{
                  width: `${goal.progress}%`,
                  backgroundColor: color.border,
                }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={goal.progress}
              onChange={(e) => handleProgressChange(goal, Number(e.target.value))}
              className="goal-card__progress-slider"
            />
            <span className="goal-card__progress-value">{goal.progress}%</span>
          </div>

          {goal.metrics && goal.metrics.length > 0 && (
            <div className="goal-card__metrics">
              {goal.metrics.map((m) => (
                <div key={m.id} className="goal-card__metric">
                  <span className="goal-card__metric-name">{m.name}</span>
                  <span className="goal-card__metric-value">
                    {m.current}/{m.target} {m.unit}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="goal-card__footer">
            <span className="goal-card__date">
              Target: {new Date(goal.targetDate).toLocaleDateString()}
            </span>
            {hasChildren && (
              <span className="goal-card__children-count">
                {children.length} sub-goal{children.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="goal-card__children">
            {children.map((child) => renderGoalCard(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render hierarchy view
  const renderHierarchyView = () => (
    <div className="goals-dashboard__hierarchy">
      {filteredGoals.annual.length === 0 ? (
        <div className="goals-dashboard__empty">
          <div className="goals-dashboard__empty-icon">🎯</div>
          <h3>No annual goals yet</h3>
          <p>Set your annual goals to start building your plan</p>
          <button
            className="goals-dashboard__add-btn"
            onClick={onAddGoal}
          >
            Set Annual Goals
          </button>
        </div>
      ) : (
        <div className="goals-dashboard__goal-list">
          {filteredGoals.annual.map((goal) => renderGoalCard(goal))}
        </div>
      )}
    </div>
  );

  // Render timeline view
  const renderTimelineView = () => (
    <div className="goals-dashboard__timeline">
      {TIMEFRAME_ORDER.map((timeframe) => {
        const timeframeGoals = filteredGoals[timeframe];
        if (timeframeGoals.length === 0) return null;

        return (
          <div key={timeframe} className="goals-dashboard__timeframe-section">
            <h3 className="goals-dashboard__timeframe-title">
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Goals
              <span className="goals-dashboard__timeframe-count">
                {timeframeGoals.length}
              </span>
            </h3>
            <div className="goals-dashboard__timeframe-goals">
              {timeframeGoals.map((goal) => {
                const color = LOOP_COLORS[goal.loop];
                const def = LOOP_DEFINITIONS[goal.loop];
                return (
                  <div
                    key={goal.id}
                    className="goals-timeline-card"
                    style={{ borderColor: color.border }}
                    onClick={() => onGoalClick(goal)}
                  >
                    <span
                      className="goals-timeline-card__badge"
                      style={{ backgroundColor: color.border }}
                    >
                      {def.icon}
                    </span>
                    <div className="goals-timeline-card__content">
                      <h4>{goal.title}</h4>
                      <div className="goals-timeline-card__progress">
                        <div
                          className="goals-timeline-card__progress-fill"
                          style={{
                            width: `${goal.progress}%`,
                            backgroundColor: color.border,
                          }}
                        />
                      </div>
                    </div>
                    <span className="goals-timeline-card__percent">
                      {goal.progress}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Render by-loop view
  const renderByLoopView = () => (
    <div className="goals-dashboard__by-loop">
      {ALL_LOOPS.map((loop) => {
        const loopGoals = [
          ...goals.annual.filter((g) => g.loop === loop),
          ...goals.quarterly.filter((g) => g.loop === loop),
          ...goals.monthly.filter((g) => g.loop === loop),
        ];

        const color = LOOP_COLORS[loop];
        const def = LOOP_DEFINITIONS[loop];

        return (
          <div
            key={loop}
            className="goals-loop-column"
            style={{ borderTopColor: color.border }}
          >
            <div
              className="goals-loop-column__header"
              style={{ backgroundColor: color.bg }}
            >
              <span className="goals-loop-column__icon">{def.icon}</span>
              <span className="goals-loop-column__name">{loop}</span>
              <span className="goals-loop-column__count">{loopGoals.length}</span>
            </div>
            <div className="goals-loop-column__goals">
              {loopGoals.length === 0 ? (
                <div className="goals-loop-column__empty">No goals</div>
              ) : (
                loopGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="goals-loop-card"
                    onClick={() => onGoalClick(goal)}
                  >
                    <span className="goals-loop-card__timeframe">
                      {goal.timeframe}
                    </span>
                    <h4 className="goals-loop-card__title">{goal.title}</h4>
                    <div className="goals-loop-card__progress">
                      <div
                        className="goals-loop-card__progress-fill"
                        style={{
                          width: `${goal.progress}%`,
                          backgroundColor: color.border,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="goals-dashboard">
      <div className="goals-dashboard__header">
        <div className="goals-dashboard__title-row">
          <h1 className="goals-dashboard__title">Goals</h1>
          <p className="goals-dashboard__subtitle">Track your annual, quarterly, and monthly objectives across all loops</p>
          <button className="goals-dashboard__add-btn" onClick={onAddGoal}>
            + Add Goals
          </button>
        </div>

        <div className="goals-dashboard__stats">
          <div className="goals-dashboard__stat">
            <span className="goals-dashboard__stat-value">{stats.active}</span>
            <span className="goals-dashboard__stat-label">Active</span>
          </div>
          <div className="goals-dashboard__stat">
            <span className="goals-dashboard__stat-value">{stats.completed}</span>
            <span className="goals-dashboard__stat-label">Completed</span>
          </div>
          <div className="goals-dashboard__stat">
            <span className="goals-dashboard__stat-value">{stats.avgProgress}%</span>
            <span className="goals-dashboard__stat-label">Avg Progress</span>
          </div>
        </div>

        <div className="goals-dashboard__controls">
          <div className="goals-dashboard__view-toggle">
            <button
              className={`goals-dashboard__view-btn ${
                viewMode === "hierarchy" ? "goals-dashboard__view-btn--active" : ""
              }`}
              onClick={() => setViewMode("hierarchy")}
            >
              Hierarchy
            </button>
            <button
              className={`goals-dashboard__view-btn ${
                viewMode === "timeline" ? "goals-dashboard__view-btn--active" : ""
              }`}
              onClick={() => setViewMode("timeline")}
            >
              Timeline
            </button>
            <button
              className={`goals-dashboard__view-btn ${
                viewMode === "byLoop" ? "goals-dashboard__view-btn--active" : ""
              }`}
              onClick={() => setViewMode("byLoop")}
            >
              By Loop
            </button>
          </div>

          <div className="goals-dashboard__filter">
            <select
              value={filterLoop}
              onChange={(e) => setFilterLoop(e.target.value as LoopId | "all")}
              className="goals-dashboard__filter-select"
            >
              <option value="all">All Loops</option>
              {ALL_LOOPS.map((loop) => (
                <option key={loop} value={loop}>
                  {LOOP_DEFINITIONS[loop].icon} {loop}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="goals-dashboard__content">
        {viewMode === "hierarchy" && renderHierarchyView()}
        {viewMode === "timeline" && renderTimelineView()}
        {viewMode === "byLoop" && renderByLoopView()}
      </div>
    </div>
  );
}

export default GoalsDashboard;
