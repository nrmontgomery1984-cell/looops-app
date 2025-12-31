// QuickActionsFAB - Floating action button with multiple quick actions
// Combines quick task add, habit add, routine start, and day types editing

import React, { useState, useMemo } from "react";
import { WeekDayTypesEditor } from "../planning/WeekDayTypesEditor";
import {
  LoopId,
  ALL_LOOPS,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
  Task,
  Habit,
  Routine,
  getRoutinesDueTodayWithDayType,
  sortRoutinesByTimeOfDay,
  getRoutineDuration,
} from "../../types";
import { useApp, useRoutines, useSmartSchedule } from "../../context";
import { getDayTypes } from "../../engines/smartSchedulerEngine";
import { DayType } from "../../types/dayTypes";

interface QuickActionsFABProps {
  onAddTask?: (task: Task) => void;
  onStartRoutine?: (routineId: string) => void;
}

export function QuickActionsFAB({ onAddTask, onStartRoutine }: QuickActionsFABProps) {
  const { dispatch } = useApp();
  const routines = useRoutines();
  const smartSchedule = useSmartSchedule();

  const [isOpen, setIsOpen] = useState(false);
  const [showDayTypes, setShowDayTypes] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showRoutinePicker, setShowRoutinePicker] = useState(false);

  // Quick add task state
  const [title, setTitle] = useState("");
  const [selectedLoop, setSelectedLoop] = useState<LoopId>("Work");

  // Quick add habit state
  const [habitTitle, setHabitTitle] = useState("");
  const [habitResponse, setHabitResponse] = useState("");
  const [habitLoop, setHabitLoop] = useState<LoopId>("Health");
  const [habitType, setHabitType] = useState<"build" | "break">("build");

  // Get today's routines for the picker
  const todaysRoutines = useMemo(() => {
    const activeRoutines = routines.items.filter(r => r.status === "active");
    if (smartSchedule.enabled) {
      const dayTypes = getDayTypes(new Date(), smartSchedule) as DayType[];
      const filtered = getRoutinesDueTodayWithDayType(activeRoutines, dayTypes);
      return sortRoutinesByTimeOfDay(filtered);
    }
    // Without smart schedule, just get routines due today based on frequency
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    return sortRoutinesByTimeOfDay(activeRoutines.filter(r => {
      if (r.schedule.frequency === "daily") return true;
      if (r.schedule.frequency === "weekdays") return !isWeekend;
      if (r.schedule.frequency === "weekends") return isWeekend;
      return true;
    }));
  }, [routines.items, smartSchedule]);

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const newTask: Task = {
        id: `task_${Date.now()}`,
        title: title.trim(),
        loop: selectedLoop,
        priority: 3,
        status: "todo",
        order: 0,
        dueDate: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      };

      if (onAddTask) {
        onAddTask(newTask);
      } else {
        dispatch({ type: "ADD_TASK", payload: newTask });
      }

      setTitle("");
      setShowQuickAdd(false);
      setIsOpen(false);
    }
  };

  const handleAddHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (habitTitle.trim()) {
      const newHabit: Habit = {
        id: `habit_${Date.now()}`,
        title: habitTitle.trim(),
        response: habitResponse.trim() || habitTitle.trim(),
        type: habitType,
        loop: habitLoop,
        cue: { type: "time", value: "daily" },
        reward: "",
        frequency: "daily",
        status: "active",
        streak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: "ADD_HABIT", payload: newHabit });

      setHabitTitle("");
      setHabitResponse("");
      setHabitLoop("Health");
      setHabitType("build");
      setShowAddHabit(false);
      setIsOpen(false);
    }
  };

  const handleStartRoutine = (routineId: string) => {
    if (onStartRoutine) {
      onStartRoutine(routineId);
    } else {
      // Default: navigate to routines tab
      dispatch({ type: "SET_ACTIVE_TAB", payload: "routines" });
    }
    setShowRoutinePicker(false);
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowDayTypes(false);
    setShowQuickAdd(false);
    setShowAddHabit(false);
    setShowRoutinePicker(false);
    setTitle("");
    setHabitTitle("");
    setHabitResponse("");
  };

  return (
    <>
      {/* Main FAB */}
      <div className={`quick-actions-fab ${isOpen ? "open" : ""}`}>
        {/* Action buttons that appear when open */}
        {isOpen && (
          <div className="quick-actions-menu">
            <button
              className="quick-action-item"
              onClick={() => {
                setShowQuickAdd(true);
                setIsOpen(false);
              }}
              title="Add Task"
            >
              <span className="quick-action-icon">+</span>
              <span className="quick-action-label">Add Task</span>
            </button>
            <button
              className="quick-action-item"
              onClick={() => {
                setShowAddHabit(true);
                setIsOpen(false);
              }}
              title="Add Habit"
            >
              <span className="quick-action-icon">🔄</span>
              <span className="quick-action-label">Add Habit</span>
            </button>
            {todaysRoutines.length > 0 && (
              <button
                className="quick-action-item"
                onClick={() => {
                  setShowRoutinePicker(true);
                  setIsOpen(false);
                }}
                title="Start Routine"
              >
                <span className="quick-action-icon">▶️</span>
                <span className="quick-action-label">Routines</span>
              </button>
            )}
            <button
              className="quick-action-item"
              onClick={() => {
                setShowDayTypes(true);
                setIsOpen(false);
              }}
              title="Edit Day Types"
            >
              <span className="quick-action-icon">📅</span>
              <span className="quick-action-label">Day Types</span>
            </button>
          </div>
        )}

        {/* Main button */}
        <button
          className="quick-actions-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
        >
          <span className={`quick-actions-icon ${isOpen ? "rotated" : ""}`}>
            {isOpen ? "×" : "+"}
          </span>
        </button>
      </div>

      {/* Backdrop when open */}
      {isOpen && (
        <div className="quick-actions-backdrop" onClick={handleClose} />
      )}

      {/* Day Types Modal */}
      {showDayTypes && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="week-types-modal" onClick={(e) => e.stopPropagation()}>
            <WeekDayTypesEditor onClose={handleClose} />
          </div>
        </div>
      )}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="quick-add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quick-add-header">
              <h3>Add Task</h3>
              <span className="quick-add-date">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <button className="quick-add-close" onClick={handleClose}>
                ×
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit}>
              <div className="quick-add-field">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  autoFocus
                  className="quick-add-input"
                />
              </div>

              <div className="quick-add-field">
                <label>Loop</label>
                <div className="quick-add-loops">
                  {ALL_LOOPS.map((loopId) => {
                    const loop = LOOP_DEFINITIONS[loopId];
                    const colors = LOOP_COLORS[loopId];
                    const isSelected = selectedLoop === loopId;

                    return (
                      <button
                        key={loopId}
                        type="button"
                        className={`quick-add-loop-btn ${isSelected ? "selected" : ""}`}
                        style={{
                          backgroundColor: isSelected ? colors.bg : "transparent",
                          borderColor: colors.border,
                          color: isSelected ? colors.text : "var(--color-text-secondary)",
                        }}
                        onClick={() => setSelectedLoop(loopId)}
                      >
                        {loop.icon}
                      </button>
                    );
                  })}
                </div>
                <span className="quick-add-loop-name">
                  {LOOP_DEFINITIONS[selectedLoop].name}
                </span>
              </div>

              <div className="quick-add-actions">
                <button type="button" className="quick-add-cancel" onClick={handleClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="quick-add-submit"
                  disabled={!title.trim()}
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Habit Modal */}
      {showAddHabit && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="quick-add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quick-add-header">
              <h3>Add Habit</h3>
              <button className="quick-add-close" onClick={handleClose}>
                ×
              </button>
            </div>

            <form onSubmit={handleAddHabitSubmit}>
              <div className="quick-add-field">
                <input
                  type="text"
                  value={habitTitle}
                  onChange={(e) => setHabitTitle(e.target.value)}
                  placeholder="What habit do you want to build?"
                  autoFocus
                  className="quick-add-input"
                />
              </div>

              <div className="quick-add-field">
                <label>2-minute action</label>
                <input
                  type="text"
                  value={habitResponse}
                  onChange={(e) => setHabitResponse(e.target.value)}
                  placeholder="What's the smallest version of this?"
                  className="quick-add-input"
                />
              </div>

              <div className="quick-add-field">
                <label>Type</label>
                <div className="quick-add-type-toggle">
                  <button
                    type="button"
                    className={`quick-add-type-btn ${habitType === "build" ? "selected" : ""}`}
                    onClick={() => setHabitType("build")}
                    style={habitType === "build" ? { backgroundColor: "#73A58C", borderColor: "#73A58C", color: "white" } : {}}
                  >
                    🌱 Build
                  </button>
                  <button
                    type="button"
                    className={`quick-add-type-btn ${habitType === "break" ? "selected" : ""}`}
                    onClick={() => setHabitType("break")}
                    style={habitType === "break" ? { backgroundColor: "#F27059", borderColor: "#F27059", color: "white" } : {}}
                  >
                    🚫 Break
                  </button>
                </div>
              </div>

              <div className="quick-add-field">
                <label>Loop</label>
                <div className="quick-add-loops">
                  {ALL_LOOPS.map((loopId) => {
                    const loop = LOOP_DEFINITIONS[loopId];
                    const colors = LOOP_COLORS[loopId];
                    const isSelected = habitLoop === loopId;

                    return (
                      <button
                        key={loopId}
                        type="button"
                        className={`quick-add-loop-btn ${isSelected ? "selected" : ""}`}
                        style={{
                          backgroundColor: isSelected ? colors.bg : "transparent",
                          borderColor: colors.border,
                          color: isSelected ? colors.text : "var(--color-text-secondary)",
                        }}
                        onClick={() => setHabitLoop(loopId)}
                      >
                        {loop.icon}
                      </button>
                    );
                  })}
                </div>
                <span className="quick-add-loop-name">
                  {LOOP_DEFINITIONS[habitLoop].name}
                </span>
              </div>

              <div className="quick-add-actions">
                <button type="button" className="quick-add-cancel" onClick={handleClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="quick-add-submit"
                  disabled={!habitTitle.trim()}
                >
                  Add Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Routine Picker Modal */}
      {showRoutinePicker && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="routine-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="routine-picker-header">
              <h3>Start Routine</h3>
              <button className="routine-picker-close" onClick={handleClose}>
                ×
              </button>
            </div>

            <div className="routine-picker-list">
              {todaysRoutines.length === 0 ? (
                <div className="routine-picker-empty">
                  <p>No routines scheduled for today</p>
                </div>
              ) : (
                todaysRoutines.map((routine) => {
                  const duration = getRoutineDuration(routine);
                  const timeLabel = routine.schedule.timeOfDay === "morning" ? "🌅 Morning"
                    : routine.schedule.timeOfDay === "afternoon" ? "☀️ Afternoon"
                    : routine.schedule.timeOfDay === "evening" ? "🌆 Evening"
                    : routine.schedule.timeOfDay === "night" ? "🌙 Night"
                    : "⏰ Anytime";

                  return (
                    <button
                      key={routine.id}
                      className="routine-picker-item"
                      onClick={() => handleStartRoutine(routine.id)}
                    >
                      <span className="routine-picker-icon">{routine.icon || "📋"}</span>
                      <div className="routine-picker-info">
                        <span className="routine-picker-title">{routine.title}</span>
                        <span className="routine-picker-meta">
                          {timeLabel} • {duration} min • {routine.steps?.length || 0} steps
                        </span>
                      </div>
                      <span className="routine-picker-start">▶</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default QuickActionsFAB;
