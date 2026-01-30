// Workout Plan Calendar - Weekly workout scheduling
import React, { useState, useMemo } from "react";
import {
  Exercise,
  WorkoutPlan,
  WorkoutPlanDay,
  PlannedWorkout,
  GymProfile,
} from "../../types/workout";

interface WorkoutPlanCalendarProps {
  exercises: Exercise[];
  workoutPlans: WorkoutPlan[];
  gymProfile: GymProfile | null;
  onSavePlan: (plan: WorkoutPlan) => void;
  onSelectExercise: (exercise: Exercise) => void;
  onBack: () => void;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatWeekOf(date: Date): string {
  return date.toISOString().split("T")[0];
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

const WORKOUT_TYPES: { value: PlannedWorkout["type"]; label: string; icon: string }[] = [
  { value: "lower", label: "Lower Body", icon: "🦵" },
  { value: "upper", label: "Upper Body", icon: "💪" },
  { value: "full_body", label: "Full Body", icon: "🏋️" },
  { value: "push", label: "Push", icon: "⬆️" },
  { value: "pull", label: "Pull", icon: "⬇️" },
  { value: "conditioning", label: "Conditioning", icon: "🔥" },
  { value: "mobility", label: "Mobility", icon: "🧘" },
  { value: "sport_specific", label: "Sport Specific", icon: "🥋" },
];

export function WorkoutPlanCalendar({
  exercises,
  workoutPlans,
  gymProfile,
  onSavePlan,
  onSelectExercise,
  onBack,
}: WorkoutPlanCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [showWorkoutPicker, setShowWorkoutPicker] = useState<string | null>(null);
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<PlannedWorkout["type"]>("full_body");

  const weekOf = formatWeekOf(currentWeekStart);
  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);

  // Find or create current week's plan
  const currentPlan = useMemo((): WorkoutPlan => {
    const existing = workoutPlans.find((p) => p.weekOf === weekOf);
    if (existing) return existing;

    // Create new empty plan
    const days: WorkoutPlanDay[] = weekDates.map((date) => ({
      date: date.toISOString().split("T")[0],
      dayOfWeek: DAYS_OF_WEEK[date.getDay() === 0 ? 6 : date.getDay() - 1],
      workout: undefined,
      isRestDay: true,
    }));

    return {
      id: `plan_${Date.now()}`,
      name: `Week of ${currentWeekStart.toLocaleDateString()}`,
      weekOf,
      days,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [weekOf, workoutPlans, weekDates]);

  const handlePrevWeek = () => {
    const newWeek = new Date(currentWeekStart);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeekStart(newWeek);
  };

  const handleNextWeek = () => {
    const newWeek = new Date(currentWeekStart);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeekStart(newWeek);
  };

  const handleAddWorkout = (dateStr: string) => {
    setShowWorkoutPicker(dateStr);
  };

  const handleSelectWorkoutType = () => {
    if (!showWorkoutPicker) return;

    const typeInfo = WORKOUT_TYPES.find((t) => t.value === selectedWorkoutType);
    const newWorkout: PlannedWorkout = {
      id: `workout_${Date.now()}`,
      name: typeInfo?.label || selectedWorkoutType,
      type: selectedWorkoutType,
      targetDuration: gymProfile?.preferredDuration || 45,
      blocks: [],
      tags: [],
    };

    const updatedDays = currentPlan.days.map((day) =>
      day.date === showWorkoutPicker
        ? { ...day, workout: newWorkout, isRestDay: false }
        : day
    );

    const updatedPlan = {
      ...currentPlan,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    };

    onSavePlan(updatedPlan);
    setShowWorkoutPicker(null);
  };

  const handleRemoveWorkout = (dateStr: string) => {
    const updatedDays = currentPlan.days.map((day) =>
      day.date === dateStr
        ? { ...day, workout: undefined, isRestDay: true }
        : day
    );

    const updatedPlan = {
      ...currentPlan,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    };

    onSavePlan(updatedPlan);
  };

  const handleToggleRestDay = (dateStr: string) => {
    const day = currentPlan.days.find((d) => d.date === dateStr);
    if (!day) return;

    if (day.workout) {
      handleRemoveWorkout(dateStr);
    } else {
      handleAddWorkout(dateStr);
    }
  };

  const getWorkoutForDate = (dateStr: string): PlannedWorkout | undefined => {
    return currentPlan.days.find((d) => d.date === dateStr)?.workout;
  };

  const plannedWorkoutsCount = currentPlan.days.filter((d) => d.workout).length;

  return (
    <div className="workout-calendar">
      {/* Header */}
      <div className="workout-calendar__header">
        <button className="workout-calendar__back" onClick={onBack}>
          ← Back
        </button>
        <div className="workout-calendar__title-section">
          <h2>Workout Plan</h2>
          <span className="workout-calendar__week-info">
            {plannedWorkoutsCount} workouts this week
          </span>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="workout-calendar__nav">
        <button onClick={handlePrevWeek}>← Previous Week</button>
        <span className="workout-calendar__week-label">
          Week of {currentWeekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
        <button onClick={handleNextWeek}>Next Week →</button>
      </div>

      {/* Calendar Grid */}
      <div className="workout-calendar__grid">
        {weekDates.map((date) => {
          const dateStr = date.toISOString().split("T")[0];
          const workout = getWorkoutForDate(dateStr);
          const dayName = DAYS_OF_WEEK[date.getDay() === 0 ? 6 : date.getDay() - 1];
          const workoutTypeInfo = workout
            ? WORKOUT_TYPES.find((t) => t.value === workout.type)
            : null;

          return (
            <div
              key={dateStr}
              className={`workout-calendar__day ${isToday(date) ? "workout-calendar__day--today" : ""} ${
                workout ? "workout-calendar__day--has-workout" : ""
              }`}
            >
              <div className="workout-calendar__day-header">
                <span className="workout-calendar__day-name">{dayName.slice(0, 3)}</span>
                <span className="workout-calendar__day-date">
                  {date.getDate()}
                </span>
              </div>

              <div className="workout-calendar__day-content">
                {workout ? (
                  <div className="workout-calendar__workout">
                    <span className="workout-calendar__workout-icon">
                      {workoutTypeInfo?.icon || "🏋️"}
                    </span>
                    <span className="workout-calendar__workout-name">
                      {workout.name}
                    </span>
                    <span className="workout-calendar__workout-duration">
                      {workout.targetDuration} min
                    </span>
                    <button
                      className="workout-calendar__remove-btn"
                      onClick={() => handleRemoveWorkout(dateStr)}
                      title="Remove workout"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    className="workout-calendar__add-btn"
                    onClick={() => handleAddWorkout(dateStr)}
                  >
                    + Add Workout
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="workout-calendar__stats">
        <div className="workout-calendar__stat">
          <span className="workout-calendar__stat-value">{plannedWorkoutsCount}</span>
          <span className="workout-calendar__stat-label">Workouts</span>
        </div>
        <div className="workout-calendar__stat">
          <span className="workout-calendar__stat-value">{7 - plannedWorkoutsCount}</span>
          <span className="workout-calendar__stat-label">Rest Days</span>
        </div>
        <div className="workout-calendar__stat">
          <span className="workout-calendar__stat-value">
            {currentPlan.days.reduce(
              (total, day) => total + (day.workout?.targetDuration || 0),
              0
            )}
          </span>
          <span className="workout-calendar__stat-label">Total Minutes</span>
        </div>
      </div>

      {/* Workout Picker Modal */}
      {showWorkoutPicker && (
        <div className="workout-calendar__modal-overlay" onClick={() => setShowWorkoutPicker(null)}>
          <div className="workout-calendar__modal" onClick={(e) => e.stopPropagation()}>
            <div className="workout-calendar__modal-header">
              <h3>Add Workout</h3>
              <button onClick={() => setShowWorkoutPicker(null)}>×</button>
            </div>
            <div className="workout-calendar__modal-content">
              <label>Workout Type</label>
              <div className="workout-calendar__type-grid">
                {WORKOUT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    className={`workout-calendar__type-btn ${
                      selectedWorkoutType === type.value ? "workout-calendar__type-btn--selected" : ""
                    }`}
                    onClick={() => setSelectedWorkoutType(type.value)}
                  >
                    <span className="workout-calendar__type-icon">{type.icon}</span>
                    <span className="workout-calendar__type-label">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="workout-calendar__modal-actions">
              <button
                className="workout-calendar__modal-cancel"
                onClick={() => setShowWorkoutPicker(null)}
              >
                Cancel
              </button>
              <button
                className="workout-calendar__modal-confirm"
                onClick={handleSelectWorkoutType}
              >
                Add Workout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
