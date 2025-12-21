// Habits Tracker - Track daily habits with streaks and completion
// Shows today's habits with visual streak indicators
// Enhanced with archetype-aware personalization

import React, { useState } from "react";
import {
  Habit,
  HabitCompletion,
  LoopId,
  LOOP_COLORS,
  LOOP_DEFINITIONS,
  getHabitsDueToday,
} from "../../types";
import {
  getHabitActionPhrase,
  getHabitCompletionMessage,
} from "../../engines/habitEngine";
import { useApp } from "../../context";

interface HabitsTrackerProps {
  habits: Habit[];
  completions: HabitCompletion[];
  onComplete: (habitId: string, date: string, notes?: string) => void;
  onUncomplete: (habitId: string, date: string) => void;
  onEditHabit?: (habit: Habit) => void;
  filterLoop?: LoopId;
  showAll?: boolean;
}

export function HabitsTracker({
  habits,
  completions,
  onComplete,
  onUncomplete,
  onEditHabit,
  filterLoop,
  showAll = false,
}: HabitsTrackerProps) {
  const { state } = useApp();
  const prototype = state.user.prototype;
  const archetype = prototype?.archetypeBlend?.primary;

  const today = new Date().toISOString().split("T")[0];

  // Track recently completed habit for celebration message
  const [celebratingHabitId, setCelebratingHabitId] = useState<string | null>(null);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);

  // Filter habits
  let displayHabits = showAll ? habits : getHabitsDueToday(habits);
  if (filterLoop) {
    displayHabits = displayHabits.filter(h => h.loop === filterLoop);
  }

  // Check if habit is completed today
  const isCompletedToday = (habitId: string) => {
    return completions.some(c => c.habitId === habitId && c.date === today);
  };

  // Get last 7 days for mini calendar
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split("T")[0],
        dayLetter: date.toLocaleDateString("en", { weekday: "narrow" }),
        isToday: i === 0,
      });
    }
    return days;
  };

  const last7Days = getLast7Days();

  // Check completion for specific day
  const isCompletedOnDay = (habitId: string, date: string) => {
    return completions.some(c => c.habitId === habitId && c.date === date);
  };

  const handleToggle = (habit: Habit) => {
    if (isCompletedToday(habit.id)) {
      onUncomplete(habit.id, today);
      setCelebratingHabitId(null);
      setCelebrationMessage(null);
    } else {
      onComplete(habit.id, today);
      // Show archetype-personalized celebration message
      if (archetype) {
        const message = getHabitCompletionMessage(habit, archetype, habit.streak + 1);
        setCelebratingHabitId(habit.id);
        setCelebrationMessage(message);
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          setCelebratingHabitId(null);
          setCelebrationMessage(null);
        }, 3000);
      }
    }
  };

  // Get archetype-styled action phrase for habit title
  const getDisplayTitle = (habit: Habit) => {
    if (archetype) {
      return getHabitActionPhrase(habit, archetype);
    }
    return habit.title;
  };

  if (displayHabits.length === 0) {
    return (
      <div className="habits-tracker habits-tracker--empty">
        <div className="habits-empty-state">
          <span className="habits-empty-icon">🔥</span>
          <p>No habits {filterLoop ? `for ${filterLoop}` : "due today"}</p>
          <span className="habits-empty-hint">
            Create habits in a System to track them here
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="habits-tracker">
      <div className="habits-list">
        {displayHabits.map(habit => {
          const completed = isCompletedToday(habit.id);
          const loopColor = LOOP_COLORS[habit.loop].border;
          const isCelebrating = celebratingHabitId === habit.id;

          return (
            <div
              key={habit.id}
              className={`habit-item ${completed ? "completed" : ""} ${isCelebrating ? "celebrating" : ""}`}
              style={{ "--loop-color": loopColor } as React.CSSProperties}
            >
              <button
                className="habit-check"
                onClick={() => handleToggle(habit)}
                aria-label={completed ? "Mark incomplete" : "Mark complete"}
              >
                {completed ? (
                  <span className="check-icon">✓</span>
                ) : (
                  <span className="check-empty" />
                )}
              </button>

              <div className="habit-content" onClick={() => onEditHabit?.(habit)}>
                <div className="habit-title-row">
                  <span className="habit-title">{getDisplayTitle(habit)}</span>
                  {habit.streak > 0 && (
                    <span className="habit-streak">
                      🔥 {habit.streak}
                    </span>
                  )}
                </div>

                {/* Celebration message when habit is just completed */}
                {isCelebrating && celebrationMessage && (
                  <div className="habit-celebration">
                    {celebrationMessage}
                  </div>
                )}

                <div className="habit-meta">
                  <span
                    className="habit-loop-tag"
                    style={{ background: `${loopColor}20`, color: loopColor }}
                  >
                    {LOOP_DEFINITIONS[habit.loop].icon} {habit.loop}
                  </span>
                  <span className="habit-cue">{habit.cue.value}</span>
                </div>

                {/* Mini 7-day calendar */}
                <div className="habit-week">
                  {last7Days.map(day => (
                    <div
                      key={day.date}
                      className={`habit-day ${isCompletedOnDay(habit.id, day.date) ? "completed" : ""} ${day.isToday ? "today" : ""}`}
                      title={day.date}
                    >
                      <span className="day-letter">{day.dayLetter}</span>
                      <span className="day-dot" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for widgets
interface HabitsWidgetProps {
  habits: Habit[];
  completions: HabitCompletion[];
  onComplete: (habitId: string, date: string) => void;
  onUncomplete: (habitId: string, date: string) => void;
  loop?: LoopId;
  limit?: number;
}

export function HabitsWidget({
  habits,
  completions,
  onComplete,
  onUncomplete,
  loop,
  limit = 5,
}: HabitsWidgetProps) {
  const { state } = useApp();
  const archetype = state.user.prototype?.archetypeBlend?.primary;

  const today = new Date().toISOString().split("T")[0];

  let displayHabits = getHabitsDueToday(habits);
  if (loop) {
    displayHabits = displayHabits.filter(h => h.loop === loop);
  }
  displayHabits = displayHabits.slice(0, limit);

  const isCompletedToday = (habitId: string) => {
    return completions.some(c => c.habitId === habitId && c.date === today);
  };

  const completedCount = displayHabits.filter(h => isCompletedToday(h.id)).length;
  const totalCount = displayHabits.length;

  // Get archetype-styled action phrase for habit title
  const getDisplayTitle = (habit: Habit) => {
    if (archetype) {
      return getHabitActionPhrase(habit, archetype);
    }
    return habit.title;
  };

  return (
    <div className="habits-widget">
      <div className="habits-widget-header">
        <span className="habits-widget-title">Today's Habits</span>
        <span className="habits-widget-count">
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className="habits-widget-progress">
        <div
          className="habits-widget-progress-fill"
          style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%" }}
        />
      </div>

      <div className="habits-widget-list">
        {displayHabits.map(habit => {
          const completed = isCompletedToday(habit.id);
          return (
            <button
              key={habit.id}
              className={`habits-widget-item ${completed ? "completed" : ""}`}
              onClick={() => {
                if (completed) {
                  onUncomplete(habit.id, today);
                } else {
                  onComplete(habit.id, today);
                }
              }}
            >
              <span className="habits-widget-check">
                {completed ? "✓" : "○"}
              </span>
              <span className="habits-widget-name">{getDisplayTitle(habit)}</span>
              {habit.streak > 0 && (
                <span className="habits-widget-streak">🔥{habit.streak}</span>
              )}
            </button>
          );
        })}
      </div>

      {displayHabits.length === 0 && (
        <div className="habits-widget-empty">
          No habits due today
        </div>
      )}
    </div>
  );
}

export default HabitsTracker;
