// Goal Breakdown Wizard - Manual goal decomposition with customizable milestones
// User defines their own milestones for maximum flexibility

import React, { useState, useMemo } from "react";
import {
  Goal,
  GoalTimeframe,
  LOOP_COLORS,
  LOOP_DEFINITIONS,
  getNextTimeframe,
  Task,
} from "../../types";

type WizardSuggestion = {
  id: string;
  title: string;
  customTitle: string;
  targetDate: string;
  selected: boolean;
  addToLoop: boolean;
};

type GoalBreakdownWizardProps = {
  parentGoal: Goal;
  onCreateGoals: (goals: Goal[], tasks: Task[]) => void;
  onClose: () => void;
};

// Get timeframe label
function getTimeframeLabel(timeframe: GoalTimeframe): string {
  switch (timeframe) {
    case "annual": return "Annual";
    case "quarterly": return "Quarterly";
    case "monthly": return "Monthly";
    case "weekly": return "Weekly";
    case "daily": return "Daily";
  }
}

// Progress phases for breaking down goals
const PROGRESS_PHASES = {
  quarterly: [
    { phase: "Foundation", description: "Set up systems and establish baseline" },
    { phase: "Build momentum", description: "Take consistent action and track progress" },
    { phase: "Push through", description: "Overcome obstacles and stay committed" },
    { phase: "Finish strong", description: "Complete the goal and celebrate" },
  ],
  monthly: [
    { phase: "Plan & prepare", description: "Define approach and gather resources" },
    { phase: "Execute", description: "Take action and build habits" },
    { phase: "Review & adjust", description: "Evaluate progress and refine" },
  ],
  weekly: [
    { phase: "Quick win", description: "Start with an easy action" },
    { phase: "Core work", description: "Focus on the main task" },
    { phase: "Deepen", description: "Go deeper or expand scope" },
    { phase: "Consolidate", description: "Lock in progress" },
  ],
};

// Get milestone target dates based on timeframe
function getMilestoneDefaults(_parentGoal: Goal, timeframe: GoalTimeframe): { title: string; targetDate: string }[] {
  const now = new Date();
  const milestones: { title: string; targetDate: string }[] = [];

  if (timeframe === "quarterly") {
    const year = now.getFullYear();
    const phases = PROGRESS_PHASES.quarterly;
    const quarters = [
      { label: "Q1", period: "Jan-Mar", end: `${year}-03-31` },
      { label: "Q2", period: "Apr-Jun", end: `${year}-06-30` },
      { label: "Q3", period: "Jul-Sep", end: `${year}-09-30` },
      { label: "Q4", period: "Oct-Dec", end: `${year}-12-31` },
    ];
    quarters.forEach((q, idx) => {
      milestones.push({
        title: `${q.label}: ${phases[idx].phase}`,
        targetDate: q.end
      });
    });
  } else if (timeframe === "monthly") {
    const phases = PROGRESS_PHASES.monthly;
    for (let i = 0; i < 3; i++) {
      const date = new Date(now);
      date.setMonth(date.getMonth() + i + 1);
      date.setDate(0); // Last day of month
      const monthName = date.toLocaleDateString("en-US", { month: "long" });
      milestones.push({
        title: `${monthName}: ${phases[i].phase}`,
        targetDate: date.toISOString().split("T")[0]
      });
    }
  } else if (timeframe === "weekly") {
    const phases = PROGRESS_PHASES.weekly;
    for (let i = 0; i < 4; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + ((i + 1) * 7));
      milestones.push({
        title: `Week ${i + 1}: ${phases[i].phase}`,
        targetDate: date.toISOString().split("T")[0]
      });
    }
  } else if (timeframe === "daily") {
    for (let i = 1; i <= 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      milestones.push({
        title: `${dayName}: [Your action]`,
        targetDate: date.toISOString().split("T")[0]
      });
    }
  }

  return milestones;
}

export function GoalBreakdownWizard({
  parentGoal,
  onCreateGoals,
  onClose,
}: GoalBreakdownWizardProps) {
  const nextTimeframe = getNextTimeframe(parentGoal.timeframe);

  if (!nextTimeframe) {
    return (
      <div className="goal-breakdown-wizard">
        <div className="goal-breakdown-header">
          <h2>Cannot Break Down Further</h2>
          <button className="goal-breakdown-close" onClick={onClose}>×</button>
        </div>
        <div className="goal-breakdown-content">
          <p>Daily goals cannot be broken down further. Consider adding this as a task instead.</p>
          <button className="goal-breakdown-btn goal-breakdown-btn--primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  // Generate empty placeholder milestones for user to customize
  const initialSuggestions = useMemo(() => {
    const defaults = getMilestoneDefaults(parentGoal, nextTimeframe);

    return defaults.map((m, idx) => ({
      id: `milestone_${idx}_${Date.now()}`,
      title: m.title,
      customTitle: m.title,
      targetDate: m.targetDate,
      selected: idx < 4, // Pre-select first 4
      addToLoop: false,
    }));
  }, [parentGoal, nextTimeframe]);

  const [suggestions, setSuggestions] = useState<WizardSuggestion[]>(initialSuggestions);
  const [customTitle, setCustomTitle] = useState("");

  const loopColor = LOOP_COLORS[parentGoal.loop];
  const loopDef = LOOP_DEFINITIONS[parentGoal.loop];

  const selectedCount = suggestions.filter((s) => s.selected).length;
  const addToLoopCount = suggestions.filter((s) => s.selected && s.addToLoop).length;

  // Toggle suggestion selection
  const toggleSelection = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, selected: !s.selected, addToLoop: !s.selected ? s.addToLoop : false } : s
      )
    );
  };

  // Toggle add to loop
  const toggleAddToLoop = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, addToLoop: !s.addToLoop } : s
      )
    );
  };

  // Update suggestion title
  const updateTitle = (id: string, title: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, customTitle: title } : s))
    );
  };

  // Add custom suggestion
  const addCustomSuggestion = () => {
    if (!customTitle.trim()) return;

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    setSuggestions((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        title: customTitle.trim(),
        customTitle: customTitle.trim(),
        targetDate: nextWeek.toISOString().split("T")[0],
        selected: true,
        addToLoop: false,
      },
    ]);
    setCustomTitle("");
  };

  // Handle create
  const handleCreate = () => {
    const selectedSuggestions = suggestions.filter((s) => s.selected);
    const now = new Date().toISOString();

    // Create goals
    const newGoals: Goal[] = selectedSuggestions.map((s, idx) => ({
      id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      title: s.customTitle || s.title,
      description: `Milestone for: ${parentGoal.title}`,
      loop: parentGoal.loop,
      timeframe: nextTimeframe,
      parentGoalId: parentGoal.id,
      childGoalIds: [],
      status: "active" as const,
      progress: 0,
      startDate: idx === 0 ? now : selectedSuggestions[idx - 1].targetDate,
      targetDate: s.targetDate,
      createdAt: now,
      updatedAt: now,
    }));

    // Create tasks for those marked "add to loop"
    const newTasks: Task[] = selectedSuggestions
      .filter((s) => s.addToLoop)
      .map((s, idx) => {
        const goalId = newGoals.find((g) => g.title === (s.customTitle || s.title))?.id;
        return {
          id: `task_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 11)}`,
          title: s.customTitle || s.title,
          description: `Goal: ${parentGoal.title}`,
          loop: parentGoal.loop,
          priority: 2,
          status: "todo" as const,
          order: idx,
          dueDate: s.targetDate,
          createdAt: now,
          goalId,
        };
      });

    onCreateGoals(newGoals, newTasks);
  };

  return (
    <div className="goal-breakdown-wizard">
      <div className="goal-breakdown-header">
        <div className="goal-breakdown-title-row">
          <span
            className="goal-breakdown-loop-badge"
            style={{ backgroundColor: loopColor.border }}
          >
            {loopDef.icon}
          </span>
          <div>
            <h2>Break Down Goal</h2>
            <p className="goal-breakdown-parent-title">{parentGoal.title}</p>
          </div>
        </div>
        <button className="goal-breakdown-close" onClick={onClose}>×</button>
      </div>

      <div className="goal-breakdown-content">
        <div className="goal-breakdown-info">
          <span className="goal-breakdown-from">{getTimeframeLabel(parentGoal.timeframe)}</span>
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
          <span className="goal-breakdown-to">{getTimeframeLabel(nextTimeframe)}</span>
        </div>

        <div className="goal-breakdown-suggestions">
          <h3>{getTimeframeLabel(nextTimeframe)} Milestones</h3>
          <p className="goal-breakdown-hint">
            Edit titles to define your specific milestones, or add custom ones below.
          </p>

          <div className="goal-breakdown-list">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`goal-breakdown-item ${suggestion.selected ? "selected" : ""}`}
              >
                <div className="goal-breakdown-item-main">
                  <label className="goal-breakdown-checkbox">
                    <input
                      type="checkbox"
                      checked={suggestion.selected}
                      onChange={() => toggleSelection(suggestion.id)}
                    />
                    <span className="goal-breakdown-checkmark" />
                  </label>

                  <div className="goal-breakdown-item-content">
                    <div className="goal-breakdown-item-header">
                      <input
                        type="text"
                        value={suggestion.customTitle}
                        onChange={(e) => updateTitle(suggestion.id, e.target.value)}
                        className="goal-breakdown-item-title"
                        placeholder="Enter your milestone..."
                      />
                    </div>

                    <div className="goal-breakdown-item-meta">
                      <span className="goal-breakdown-item-date">
                        Due: {new Date(suggestion.targetDate + "T12:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {suggestion.selected && (
                  <button
                    className={`goal-breakdown-add-to-loop ${suggestion.addToLoop ? "active" : ""}`}
                    onClick={() => toggleAddToLoop(suggestion.id)}
                    title="Also create as a task"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                    </svg>
                    {suggestion.addToLoop ? "Task Added" : "Add Task"}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="goal-breakdown-custom">
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Add custom milestone..."
              className="goal-breakdown-custom-input"
              onKeyDown={(e) => e.key === "Enter" && addCustomSuggestion()}
            />
            <button
              className="goal-breakdown-custom-add"
              onClick={addCustomSuggestion}
              disabled={!customTitle.trim()}
            >
              + Add
            </button>
          </div>
        </div>

        <div className="goal-breakdown-summary">
          <div className="goal-breakdown-summary-row">
            <span className="goal-breakdown-summary-main">
              {selectedCount} {getTimeframeLabel(nextTimeframe).toLowerCase()} goal{selectedCount !== 1 ? "s" : ""} selected
            </span>
            {addToLoopCount > 0 && (
              <span className="goal-breakdown-tasks-count">
                + {addToLoopCount} task{addToLoopCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="goal-breakdown-summary-hint">
            Goals track progress. Tasks appear in Today's Stack.
          </p>
        </div>

        <div className="goal-breakdown-actions">
          <button className="goal-breakdown-btn goal-breakdown-btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="goal-breakdown-btn goal-breakdown-btn--primary"
            onClick={handleCreate}
            disabled={selectedCount === 0}
          >
            Create {selectedCount > 0 ? `${selectedCount} ` : ""}Goal{selectedCount !== 1 ? "s" : ""}
            {addToLoopCount > 0 && ` + ${addToLoopCount} Task${addToLoopCount !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoalBreakdownWizard;
