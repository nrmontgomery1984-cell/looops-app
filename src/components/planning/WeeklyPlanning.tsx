// Weekly Planning Component - Sunday Ritual for setting up the week

import { useState, useMemo, useEffect } from "react";
import {
  Task,
  LoopId,
  ALL_LOOPS,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
  LoopStateType,
  ArchetypeId,
  CalendarEvent,
} from "../../types";
import { Goal } from "../../types";
import {
  DayType,
  SmartScheduleState,
  DEFAULT_DAY_TYPE_CONFIGS,
  BUILT_IN_DAY_TYPES,
  MarkedDate,
  DayTypeConfig,
  createCustomDayType,
} from "../../types/dayTypes";
import { getDayTypes } from "../../engines/smartSchedulerEngine";
import { StateSelector } from "../common";
import { getRandomMotivation, celebrateCompletion } from "../../engines/voiceEngine";
import { AppAction } from "../../context/AppContext";

type WeeklyPlanningProps = {
  loopStates: Record<LoopId, { currentState: LoopStateType }>;
  tasks: Task[];
  goals: Goal[];
  calendarEvents?: CalendarEvent[];
  calendarEmbedUrl?: string; // Google Calendar embed URL
  archetype?: ArchetypeId;
  smartSchedule: SmartScheduleState;
  dispatch: React.Dispatch<AppAction>;
  onLoopStateChange: (loopId: LoopId, state: LoopStateType) => void;
  onTaskUpdate: (task: Task) => void;
  onComplete: () => void;
};

type PlanningStep = "review" | "reflect" | "states" | "dayTypes" | "priorities" | "schedule" | "complete";

const STEPS: { id: PlanningStep; title: string; description: string }[] = [
  {
    id: "review",
    title: "Review Last Week",
    description: "Celebrate wins and learn from challenges",
  },
  {
    id: "reflect",
    title: "Reflect & Learn",
    description: "What worked? What needs adjustment?",
  },
  {
    id: "states",
    title: "Set Loop States",
    description: "Choose your focus for each life area",
  },
  {
    id: "dayTypes",
    title: "Plan Day Types",
    description: "Set context for each day this week",
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

// Reflection prompts for guided thinking
const REFLECTION_PROMPTS = [
  "What's one thing that went better than expected last week?",
  "What drained your energy the most? Can you reduce it this week?",
  "What habit or system would make next week easier?",
  "Is there anything you're avoiding that you need to face?",
  "What would make this week feel successful?",
];

// Helper to get NEXT week's dates (Mon-Sun) for planning ahead
// If today is Thursday-Sunday, show the upcoming Monday-Sunday
// If today is Mon-Wed, show the current week (since you're still in it)
function getUpcomingWeekDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Thursday (4), Friday (5), Saturday (6), or Sunday (0) = plan NEXT week
  // Monday (1), Tuesday (2), Wednesday (3) = plan current week
  const planNextWeek = currentDay === 0 || currentDay >= 4;

  let daysToTargetMonday: number;
  if (planNextWeek) {
    // Days until next Monday
    // Sunday (0) -> 1 day to Monday
    // Thursday (4) -> 4 days to Monday
    // Friday (5) -> 3 days to Monday
    // Saturday (6) -> 2 days to Monday
    daysToTargetMonday = currentDay === 0 ? 1 : 8 - currentDay;
  } else {
    // Days back to current week's Monday
    // Monday (1) -> 0 days back
    // Tuesday (2) -> 1 day back
    // Wednesday (3) -> 2 days back
    daysToTargetMonday = -(currentDay - 1);
  }

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + daysToTargetMonday + i);
    dates.push(date);
  }

  return dates;
}

// Format date to YYYY-MM-DD
function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function WeeklyPlanning({
  loopStates,
  tasks,
  goals,
  calendarEvents = [],
  calendarEmbedUrl,
  archetype,
  smartSchedule,
  dispatch,
  onLoopStateChange,
  onTaskUpdate,
  onComplete,
}: WeeklyPlanningProps) {
  const [currentStep, setCurrentStep] = useState<PlanningStep>("review");
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [reflections, setReflections] = useState<Record<number, string>>({});
  const [weeklyIntention, setWeeklyIntention] = useState<string>("");
  const [activeDayTypePicker, setActiveDayTypePicker] = useState<string | null>(null);
  const [showCreateDayType, setShowCreateDayType] = useState(false);
  const [newDayTypeName, setNewDayTypeName] = useState("");
  const [newDayTypeIcon, setNewDayTypeIcon] = useState("📌");
  const [newDayTypeColor, setNewDayTypeColor] = useState("#6366F1");

  // Get the upcoming week's dates
  const weekDates = useMemo(() => getUpcomingWeekDates(), []);

  // Fetch calendar events when component mounts
  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        const stored = localStorage.getItem('looops_google_calendar_tokens');
        if (!stored) return;

        const tokens = JSON.parse(stored);
        if (!tokens?.access_token) return;

        const headers = { 'Authorization': `Bearer ${tokens.access_token}` };
        const res = await fetch('/api/calendar?action=week', { headers });
        const data = await res.json();

        if (data.needsReauth) {
          localStorage.removeItem('looops_google_calendar_tokens');
          return;
        }

        if (data.source === 'google' && data.data) {
          dispatch({ type: 'SET_CALENDAR_EVENTS', payload: data.data });
        }
      } catch (err) {
        console.error('Failed to fetch calendar events:', err);
      }
    };

    // Only fetch if we don't already have events
    if (calendarEvents.length === 0) {
      fetchCalendarEvents();
    }
  }, [dispatch, calendarEvents.length]);

  // Get day types for each day of the upcoming week (now returns array)
  const weekDayTypes = useMemo(() => {
    const types: Record<string, DayType[]> = {};
    weekDates.forEach((date) => {
      const dateKey = formatDateKey(date);
      types[dateKey] = getDayTypes(date, smartSchedule);
    });
    return types;
  }, [weekDates, smartSchedule]);

  // Toggle a day type for a specific date (multi-select)
  const handleDayTypeToggle = (dateKey: string, dayType: DayType) => {
    const date = new Date(dateKey);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const autoType = isWeekend ? "weekend" : "regular";
    const currentTypes = weekDayTypes[dateKey] || [autoType];

    let newTypes: DayType[];

    if (currentTypes.includes(dayType)) {
      // Remove this type
      newTypes = currentTypes.filter(t => t !== dayType);
      // If empty, revert to auto-detected type
      if (newTypes.length === 0) {
        newTypes = [autoType];
      }
    } else {
      // Add this type
      // If it's one of the auto types and we're adding a different type, remove auto
      if (dayType !== autoType && currentTypes.includes(autoType) && currentTypes.length === 1) {
        newTypes = [dayType];
      } else if (dayType === autoType) {
        // If adding auto type back, just use auto
        newTypes = [autoType];
      } else {
        newTypes = [...currentTypes.filter(t => t !== autoType), dayType];
      }
    }

    // If just the auto type, remove the mark entirely
    if (newTypes.length === 1 && newTypes[0] === autoType) {
      dispatch({ type: "UNMARK_DATE", payload: dateKey });
    } else {
      // Mark the date with multiple types
      dispatch({
        type: "MARK_DATE",
        payload: {
          date: dateKey,
          dayType: newTypes[0], // Primary for backward compat
          dayTypes: newTypes,
        },
      });
    }
  };

  // Get all day types (built-in + custom)
  const allDayTypes = useMemo(() => {
    const customTypes = smartSchedule.customDayTypes || [];
    return [
      ...BUILT_IN_DAY_TYPES,
      ...customTypes.map((c) => c.dayType),
    ];
  }, [smartSchedule.customDayTypes]);

  // Get config for any day type (built-in or custom)
  const getDayTypeConfigForType = (dt: DayType): DayTypeConfig => {
    return (
      smartSchedule.dayTypeConfigs[dt] ||
      DEFAULT_DAY_TYPE_CONFIGS[dt] ||
      { dayType: dt, label: dt, color: "#666", icon: "📌" }
    );
  };

  // Handle creating a new custom day type
  const handleCreateCustomDayType = () => {
    if (!newDayTypeName.trim()) return;

    const newDayType = createCustomDayType(
      newDayTypeName.trim(),
      newDayTypeIcon,
      newDayTypeColor
    );

    dispatch({
      type: "ADD_CUSTOM_DAY_TYPE",
      payload: newDayType,
    });

    // Reset form
    setNewDayTypeName("");
    setNewDayTypeIcon("📌");
    setNewDayTypeColor("#6366F1");
    setShowCreateDayType(false);
  };

  // Get archetype-specific motivation for this session
  const [motivationPhrase] = useState(() =>
    archetype ? getRandomMotivation(archetype) : "Let's make this week count."
  );

  // Pick 3 random prompts for this session
  const [activePrompts] = useState(() => {
    const shuffled = [...REFLECTION_PROMPTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  });

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

      case "reflect":
        return (
          <div className="weekly-step-content">
            <p className="weekly-step-intro">
              Take a moment to reflect on last week. These insights will guide your planning.
            </p>

            <div className="weekly-reflection-prompts">
              {activePrompts.map((prompt, idx) => (
                <div key={idx} className="weekly-reflection-prompt">
                  <label className="weekly-reflection-label">{prompt}</label>
                  <textarea
                    className="weekly-reflection-input"
                    placeholder="Type your thoughts..."
                    value={reflections[idx] || ""}
                    onChange={(e) => setReflections(prev => ({ ...prev, [idx]: e.target.value }))}
                    rows={2}
                  />
                </div>
              ))}
            </div>

            <div className="weekly-intention-section">
              <h4>Weekly Intention</h4>
              <p className="weekly-intention-hint">
                In one sentence, what would make this week successful?
              </p>
              <textarea
                className="weekly-intention-input"
                placeholder="This week I will..."
                value={weeklyIntention}
                onChange={(e) => setWeeklyIntention(e.target.value)}
                rows={2}
              />
            </div>

            {/* Quick insights based on last week */}
            {lastWeekCompleted.length > 0 && (
              <div className="weekly-insights">
                <h4>Insights from Last Week</h4>
                <div className="weekly-insights-list">
                  {/* Find the loop with most completions */}
                  {(() => {
                    const topLoop = ALL_LOOPS.reduce((best, loopId) => {
                      const count = loopStats[loopId].completed;
                      return count > (loopStats[best]?.completed || 0) ? loopId : best;
                    }, ALL_LOOPS[0]);
                    const topCount = loopStats[topLoop].completed;

                    return topCount > 0 ? (
                      <div className="weekly-insight">
                        <span className="weekly-insight-icon">🏆</span>
                        <span>Your strongest loop was <strong>{LOOP_DEFINITIONS[topLoop].name}</strong> with {topCount} tasks completed</span>
                      </div>
                    ) : null;
                  })()}

                  {/* Find loop that might need attention */}
                  {(() => {
                    const neglectedLoop = ALL_LOOPS.find(loopId =>
                      loopId !== "Meaning" &&
                      loopStats[loopId].completed === 0 &&
                      loopStats[loopId].pending > 0
                    );

                    return neglectedLoop ? (
                      <div className="weekly-insight">
                        <span className="weekly-insight-icon">💡</span>
                        <span><strong>{LOOP_DEFINITIONS[neglectedLoop].name}</strong> has pending tasks but no completions - consider adjusting its state</span>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
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

      case "dayTypes":
        return (
          <div className="weekly-step-content">
            <p className="weekly-step-intro">
              Set the context for each day. Days can have multiple types (e.g., workday + custody).
            </p>

            <div className="weekly-daytype-grid">
              {weekDates.map((date) => {
                const dateKey = formatDateKey(date);
                const dayTypes = weekDayTypes[dateKey] || ["regular"];
                const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
                const dayNum = date.getDate();
                const isPickerOpen = activeDayTypePicker === dateKey;

                return (
                  <div key={dateKey} className="weekly-daytype-card">
                    <div className="weekly-daytype-date">
                      <span className="weekly-daytype-day">{dayName}</span>
                      <span className="weekly-daytype-num">{dayNum}</span>
                    </div>
                    {/* Show all selected day type badges */}
                    <div
                      className="weekly-daytype-badges"
                      onClick={() => setActiveDayTypePicker(isPickerOpen ? null : dateKey)}
                    >
                      {dayTypes.map((dt) => {
                        const config = getDayTypeConfigForType(dt);
                        return (
                          <span
                            key={dt}
                            className="weekly-daytype-badge-mini"
                            style={{ background: config.color }}
                            title={config.label}
                          >
                            {config.icon}
                          </span>
                        );
                      })}
                    </div>
                    {isPickerOpen && (
                      <div className="weekly-daytype-picker">
                        <div className="weekly-daytype-picker-header">
                          Select day types (can pick multiple)
                        </div>
                        {allDayTypes.map((dt) => {
                          const dtConfig = getDayTypeConfigForType(dt);
                          const isSelected = dayTypes.includes(dt);
                          return (
                            <button
                              key={dt}
                              className={`weekly-daytype-option ${isSelected ? "selected" : ""}`}
                              style={{ "--dt-color": dtConfig.color } as React.CSSProperties}
                              onClick={() => handleDayTypeToggle(dateKey, dt)}
                            >
                              <span className="weekly-daytype-option-check">
                                {isSelected ? "✓" : ""}
                              </span>
                              <span className="weekly-daytype-option-icon">{dtConfig.icon}</span>
                              <span className="weekly-daytype-option-label">{dtConfig.label}</span>
                            </button>
                          );
                        })}
                        <button
                          className="weekly-daytype-add-new"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCreateDayType(true);
                          }}
                        >
                          <span>+</span>
                          <span>Add New Day Type</span>
                        </button>
                        <button
                          className="weekly-daytype-done"
                          onClick={() => setActiveDayTypePicker(null)}
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Create Custom Day Type Modal */}
            {showCreateDayType && (
              <div className="weekly-daytype-create-modal">
                <div className="weekly-daytype-create-content">
                  <h4>Create Custom Day Type</h4>
                  <div className="weekly-daytype-create-field">
                    <label>Name</label>
                    <input
                      type="text"
                      value={newDayTypeName}
                      onChange={(e) => setNewDayTypeName(e.target.value)}
                      placeholder="e.g., Deep Work Day"
                      autoFocus
                    />
                  </div>
                  <div className="weekly-daytype-create-row">
                    <div className="weekly-daytype-create-field">
                      <label>Icon</label>
                      <input
                        type="text"
                        value={newDayTypeIcon}
                        onChange={(e) => setNewDayTypeIcon(e.target.value)}
                        placeholder="📌"
                        className="weekly-daytype-icon-input"
                      />
                    </div>
                    <div className="weekly-daytype-create-field">
                      <label>Color</label>
                      <input
                        type="color"
                        value={newDayTypeColor}
                        onChange={(e) => setNewDayTypeColor(e.target.value)}
                        className="weekly-daytype-color-input"
                      />
                    </div>
                  </div>
                  <div className="weekly-daytype-create-preview">
                    <span
                      className="weekly-daytype-badge-mini"
                      style={{ background: newDayTypeColor }}
                    >
                      {newDayTypeIcon}
                    </span>
                    <span>{newDayTypeName || "Preview"}</span>
                  </div>
                  <div className="weekly-daytype-create-actions">
                    <button
                      className="weekly-daytype-create-cancel"
                      onClick={() => setShowCreateDayType(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="weekly-daytype-create-save"
                      onClick={handleCreateCustomDayType}
                      disabled={!newDayTypeName.trim()}
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="weekly-daytype-tips">
              <h4>Day Type Combinations</h4>
              <ul>
                <li><strong>Workday + Custody</strong> - Work during day, family evening</li>
                <li><strong>Workday + Solo</strong> - Work focus, personal time after</li>
                <li><strong>Weekend + Custody</strong> - Family weekend time</li>
                <li><strong>Travel</strong> - Minimal commitments while traveling</li>
              </ul>
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
              Review your week. Tap day type badges to change them.
            </p>

            <div className="weekly-schedule">
              {weekDates.map((date, idx) => {
                const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const day = dayNames[date.getDay()];
                const dateStr = formatDateKey(date);
                const dayTypes = weekDayTypes[dateStr] || ["regular"];
                const isPickerOpen = activeDayTypePicker === dateStr;

                const dayTasks = pendingTasks.filter((t) => t.dueDate === dateStr);

                return (
                  <div key={dateStr} className="weekly-day-column">
                    <div className="weekly-day-header">
                      <span className="weekly-day-name">{day}</span>
                      <span className="weekly-day-date">
                        {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    {/* Day type badges - clickable to change */}
                    <div
                      className="weekly-schedule-daytypes"
                      onClick={() => setActiveDayTypePicker(isPickerOpen ? null : dateStr)}
                    >
                      {dayTypes.map((dt) => {
                        const config = getDayTypeConfigForType(dt);
                        return (
                          <span
                            key={dt}
                            className="weekly-daytype-badge-mini"
                            style={{ background: config.color }}
                            title={config.label}
                          >
                            {config.icon}
                          </span>
                        );
                      })}
                    </div>
                    {isPickerOpen && (
                      <div className="weekly-daytype-picker weekly-daytype-picker-schedule">
                        <div className="weekly-daytype-picker-header">
                          Select day types
                        </div>
                        {allDayTypes.map((dt) => {
                          const dtConfig = getDayTypeConfigForType(dt);
                          const isSelected = dayTypes.includes(dt);
                          return (
                            <button
                              key={dt}
                              className={`weekly-daytype-option ${isSelected ? "selected" : ""}`}
                              style={{ "--dt-color": dtConfig.color } as React.CSSProperties}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDayTypeToggle(dateStr, dt);
                              }}
                            >
                              <span className="weekly-daytype-option-check">
                                {isSelected ? "✓" : ""}
                              </span>
                              <span className="weekly-daytype-option-icon">{dtConfig.icon}</span>
                              <span className="weekly-daytype-option-label">{dtConfig.label}</span>
                            </button>
                          );
                        })}
                        <button
                          className="weekly-daytype-done"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDayTypePicker(null);
                          }}
                        >
                          Done
                        </button>
                      </div>
                    )}
                    {/* Calendar Events */}
                    {calendarEvents.filter((e) => {
                      const eventDate = e.startTime.split("T")[0];
                      return eventDate === dateStr;
                    }).length > 0 && (
                      <div className="weekly-day-events">
                        {calendarEvents
                          .filter((e) => {
                            const eventDate = e.startTime.split("T")[0];
                            return eventDate === dateStr;
                          })
                          .slice(0, 3)
                          .map((event) => {
                            const startTime = event.allDay
                              ? "All day"
                              : new Date(event.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                            return (
                              <div key={event.id} className="weekly-day-event">
                                <span className="weekly-event-time">{startTime}</span>
                                <span className="weekly-event-title">{event.title}</span>
                              </div>
                            );
                          })}
                        {calendarEvents.filter((e) => {
                          const eventDate = e.startTime.split("T")[0];
                          return eventDate === dateStr;
                        }).length > 3 && (
                          <div className="weekly-day-more">
                            +{calendarEvents.filter((e) => {
                              const eventDate = e.startTime.split("T")[0];
                              return eventDate === dateStr;
                            }).length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                    {/* Tasks */}
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
                      {dayTasks.length === 0 && calendarEvents.filter((e) => {
                        const eventDate = e.startTime.split("T")[0];
                        return eventDate === dateStr;
                      }).length === 0 && (
                        <div className="weekly-day-empty">No events</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "complete":
        // Get archetype-specific celebration message
        const celebrationMessage = archetype
          ? celebrateCompletion(archetype, `${lastWeekCompleted.length} tasks completed`)
          : "Great work this week!";

        return (
          <div className="weekly-step-content weekly-complete">
            <div className="weekly-complete-icon">🎯</div>
            <h3>You're All Set!</h3>
            <p className="weekly-complete-motivation">{motivationPhrase}</p>
            {lastWeekCompleted.length > 0 && (
              <p className="weekly-complete-celebration">{celebrationMessage}</p>
            )}

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
    <div className="weekly-planning-container with-calendar">
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

      {/* Calendar Events Panel - Always show */}
      <div className="weekly-calendar-panel">
          <div className="weekly-calendar-panel-header">
            <span className="weekly-calendar-panel-icon">📅</span>
            <span className="weekly-calendar-panel-title">Week's Events</span>
          </div>
          <div className="weekly-calendar-panel-content">
            {weekDates.map((date) => {
              const dateStr = formatDateKey(date);
              const dayEvents = calendarEvents.filter((e) => {
                const eventDate = e.startTime.split("T")[0];
                return eventDate === dateStr;
              });
              const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
              const dayNum = date.getDate();
              const month = date.toLocaleDateString("en-US", { month: "short" });
              const isToday = formatDateKey(new Date()) === dateStr;

              return (
                <div key={dateStr} className={`weekly-calendar-day ${isToday ? "today" : ""}`}>
                  <div className="weekly-calendar-day-header">
                    <span className="weekly-calendar-day-name">{dayName}</span>
                    <span className="weekly-calendar-day-date">{month} {dayNum}</span>
                  </div>
                  <div className="weekly-calendar-day-events">
                    {dayEvents.length === 0 ? (
                      <div className="weekly-calendar-no-events">No events</div>
                    ) : (
                      dayEvents.map((event) => {
                        const startTime = event.allDay
                          ? "All day"
                          : new Date(event.startTime).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            });
                        return (
                          <div
                            key={event.id}
                            className="weekly-calendar-event"
                            style={{ borderLeftColor: event.color || "#6366F1" }}
                          >
                            <span className="weekly-calendar-event-time">{startTime}</span>
                            <span className="weekly-calendar-event-title">{event.title}</span>
                            {event.location && (
                              <span className="weekly-calendar-event-location">📍 {event.location}</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );
}

export default WeeklyPlanning;
