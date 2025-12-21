// Weekly Planning Component - Sunday Ritual for setting up the week

import { useState, useMemo } from "react";
import {
  Task,
  LoopId,
  ALL_LOOPS,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
  LoopStateType,
} from "../../types";
import { Goal } from "../../types";
import { StateSelector } from "../common";
import { getStateDisplayName } from "../../engines/stateEngine";

type WeeklyPlanningProps = {
  loopStates: Record<LoopId, { currentState: LoopStateType }>;
  tasks: Task[];
  goals: Goal[];
  onLoopStateChange: (loopId: LoopId, state: LoopStateType) => void;
  onTaskUpdate: (task: Task) => void;
  onComplete: () => void;
};

type PlanningStep = "review" | "states" | "priorities" | "schedule" | "complete";

const STEPS: { id: PlanningStep; title: string; description: string }[] = [
  {
    id: "review",
    title: "Review Last Week",
    description: "Celebrate wins and learn from challenges",
  },
  {
    id: "states",
    title: "Set Loop States",
    description: "Choose your focus for each life area",
  },
  {
    id: "priorities",
    title: "Weekly Priorities",
    description: "Select your top priorities for the week",
  },
  {
    id: "schedule",
    title: "Schedule Tasks",
    description: "Assign tasks to specific days",
  },
  {
    id: "complete",
    title: "Ready to Go",
    description: "Your week is planned!",
  },
];

export function WeeklyPlanning({
  loopStates,
  tasks,
  goals,
  onLoopStateChange,
  onTaskUpdate,
  onComplete,
}: WeeklyPlanningProps) {
  const [currentStep, setCurrentStep] = useState<PlanningStep>("review");
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  // Get last week's completed tasks
  const lastWeekCompleted = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString();

    return tasks.filter(
      (t) => t.status === "done" && t.completedAt && t.completedAt >= weekAgoStr
    );
  }, [tasks]);

  // Get pending tasks
  const pendingTasks = useMemo(() => {
    return tasks.filter((t) => t.status === "todo" || t.status === "doing");
  }, [tasks]);

  // Get active weekly goals
  const weeklyGoals = useMemo(() => {
    return goals.filter((g) => g.timeframe === "weekly" && g.status === "active");
  }, [goals]);

  // Stats by loop
  const loopStats = useMemo(() => {
    const stats: Record<LoopId, { completed: number; pending: number }> = {} as any;
    ALL_LOOPS.forEach((loopId) => {
      stats[loopId] = {
        completed: lastWeekCompleted.filter((t) => t.loop === loopId).length,
        pending: pendingTasks.filter((t) => t.loop === loopId).length,
      };
    });
    return stats;
  }, [lastWeekCompleted, pendingTasks]);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const goPrev = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const togglePriority = (taskId: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : prev.length < 5
        ? [...prev, taskId]
        : prev
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "review":
        return (
          <div className="weekly-step-content">
            <div className="weekly-review-stats">
              <div className="weekly-stat-card highlight">
                <span className="weekly-stat-value">{lastWeekCompleted.length}</span>
                <span className="weekly-stat-label">Tasks Completed</span>
              </div>
              <div className="weekly-stat-card">
                <span className="weekly-stat-value">{pendingTasks.length}</span>
                <span className="weekly-stat-label">Tasks Pending</span>
              </div>
            </div>

            <h4>Completions by Loop</h4>
            <div className="weekly-loop-summary">
              {ALL_LOOPS.filter((id) => id !== "Meaning").map((loopId) => {
                const loop = LOOP_DEFINITIONS[loopId];
                const stats = loopStats[loopId];
                const color = LOOP_COLORS[loopId];

                return (
                  <div
                    key={loopId}
                    className="weekly-loop-stat"
                    style={{ "--loop-color": color.text, "--loop-bg": color.bg } as React.CSSProperties}
                  >
                    <span className="weekly-loop-icon">{loop.icon}</span>
                    <span className="weekly-loop-name">{loop.name}</span>
                    <span className="weekly-loop-count">{stats.completed} done</span>
                  </div>
                );
              })}
            </div>

            {lastWeekCompleted.length > 0 && (
              <>
                <h4>Recent Wins</h4>
                <ul className="weekly-wins-list">
                  {lastWeekCompleted.slice(0, 5).map((task) => (
                    <li key={task.id} className="weekly-win-item">
                      <span className="weekly-win-check">✓</span>
                      <span className="weekly-win-title">{task.title}</span>
                      <span
                        className="weekly-win-loop"
                        style={{ color: LOOP_COLORS[task.loop].text }}
                      >
                        {LOOP_DEFINITIONS[task.loop].icon}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        );

      case "states":
        return (
          <div className="weekly-step-content">
            <p className="weekly-step-intro">
              For each loop, choose how much energy you want to invest this week.
            </p>

            <div className="weekly-states-grid">
              {ALL_LOOPS.filter((id) => id !== "Meaning").map((loopId) => {
                const loop = LOOP_DEFINITIONS[loopId];
                const state = loopStates[loopId]?.currentState || "MAINTAIN";
                const color = LOOP_COLORS[loopId];

                return (
                  <div
                    key={loopId}
                    className="weekly-state-card"
                    style={{ "--loop-color": color.text, "--loop-bg": color.bg } as React.CSSProperties}
                  >
                    <div className="weekly-state-header">
                      <span className="weekly-state-icon">{loop.icon}</span>
                      <span className="weekly-state-name">{loop.name}</span>
                    </div>
                    <StateSelector
                      currentState={state}
                      onStateChange={(newState) => onLoopStateChange(loopId, newState)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "priorities":
        return (
          <div className="weekly-step-content">
            <p className="weekly-step-intro">
              Select up to 5 priorities for this week. Focus brings results.
            </p>

            <div className="weekly-priorities-count">
              {selectedPriorities.length}/5 selected
            </div>

            {weeklyGoals.length > 0 && (
              <>
                <h4>Weekly Goals</h4>
                <div className="weekly-goals-list">
                  {weeklyGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className={`weekly-priority-item ${
                        selectedPriorities.includes(goal.id) ? "selected" : ""
                      }`}
                      onClick={() => togglePriority(goal.id)}
                    >
                      <span className="weekly-priority-check">
                        {selectedPriorities.includes(goal.id) ? "✓" : "○"}
                      </span>
                      <span className="weekly-priority-title">{goal.title}</span>
                      <span
                        className="weekly-priority-loop"
                        style={{ color: LOOP_COLORS[goal.loop].text }}
                      >
                        {LOOP_DEFINITIONS[goal.loop].icon}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <h4>Pending Tasks</h4>
            <div className="weekly-tasks-list">
              {pendingTasks.slice(0, 15).map((task) => (
                <div
                  key={task.id}
                  className={`weekly-priority-item ${
                    selectedPriorities.includes(task.id) ? "selected" : ""
                  }`}
                  onClick={() => togglePriority(task.id)}
                >
                  <span className="weekly-priority-check">
                    {selectedPriorities.includes(task.id) ? "✓" : "○"}
                  </span>
                  <span className="weekly-priority-title">{task.title}</span>
                  <span
                    className="weekly-priority-loop"
                    style={{ color: LOOP_COLORS[task.loop].text }}
                  >
                    {LOOP_DEFINITIONS[task.loop].icon}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case "schedule":
        return (
          <div className="weekly-step-content">
            <p className="weekly-step-intro">
              Assign your priorities to specific days for better execution.
            </p>

            <div className="weekly-schedule">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => {
                const dayDate = new Date();
                const today = dayDate.getDay();
                const diff = idx + 1 - today;
                dayDate.setDate(dayDate.getDate() + diff);
                const dateStr = dayDate.toISOString().split("T")[0];

                const dayTasks = pendingTasks.filter((t) => t.dueDate === dateStr);

                return (
                  <div key={day} className="weekly-day-column">
                    <div className="weekly-day-header">
                      <span className="weekly-day-name">{day}</span>
                      <span className="weekly-day-date">
                        {dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className="weekly-day-tasks">
                      {dayTasks.map((task) => (
                        <div key={task.id} className="weekly-day-task">
                          <span
                            className="weekly-task-dot"
                            style={{ background: LOOP_COLORS[task.loop].text }}
                          />
                          <span className="weekly-task-title">{task.title}</span>
                        </div>
                      ))}
                      {dayTasks.length === 0 && (
                        <div className="weekly-day-empty">No tasks</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "complete":
        return (
          <div className="weekly-step-content weekly-complete">
            <div className="weekly-complete-icon">🎯</div>
            <h3>You're All Set!</h3>
            <p>Your week is planned and ready to go.</p>

            <div className="weekly-complete-summary">
              <div className="weekly-summary-item">
                <span className="weekly-summary-label">Loop States Set</span>
                <span className="weekly-summary-value">
                  {ALL_LOOPS.filter((id) => id !== "Meaning").length}
                </span>
              </div>
              <div className="weekly-summary-item">
                <span className="weekly-summary-label">Priorities Selected</span>
                <span className="weekly-summary-value">{selectedPriorities.length}</span>
              </div>
              <div className="weekly-summary-item">
                <span className="weekly-summary-label">Tasks This Week</span>
                <span className="weekly-summary-value">{pendingTasks.length}</span>
              </div>
            </div>

            <button className="weekly-done-btn" onClick={onComplete}>
              Start Your Week
            </button>
          </div>
        );
    }
  };

  return (
    <div className="weekly-planning-wizard">
      {/* Progress Steps */}
      <div className="weekly-steps">
        {STEPS.map((step, idx) => (
          <div
            key={step.id}
            className={`weekly-step ${
              idx < currentStepIndex
                ? "completed"
                : idx === currentStepIndex
                ? "active"
                : ""
            }`}
            onClick={() => idx <= currentStepIndex && setCurrentStep(step.id)}
          >
            <div className="weekly-step-indicator">
              {idx < currentStepIndex ? "✓" : idx + 1}
            </div>
            <div className="weekly-step-info">
              <span className="weekly-step-title">{step.title}</span>
              <span className="weekly-step-desc">{step.description}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="weekly-content">{renderStepContent()}</div>

      {/* Navigation */}
      {currentStep !== "complete" && (
        <div className="weekly-nav">
          <button
            className="weekly-nav-btn secondary"
            onClick={goPrev}
            disabled={currentStepIndex === 0}
          >
            Back
          </button>
          <button className="weekly-nav-btn primary" onClick={goNext}>
            {currentStepIndex === STEPS.length - 2 ? "Complete" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}

export default WeeklyPlanning;
