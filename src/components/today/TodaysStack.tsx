// Today's Stack - Priority tasks and habits for the day

import { useMemo } from "react";
import {
  Task,
  LoopId,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
  LoopStateType,
  Habit,
  HabitCompletion,
  getHabitsDueToday,
} from "../../types";
import { useSmartSchedule } from "../../context/AppContext";
import { getDayType, getDayTypeConfig } from "../../engines/smartSchedulerEngine";

type TodaysStackProps = {
  tasks: Task[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  loopStates: Record<LoopId, { currentState: LoopStateType }>;
  onCompleteTask: (taskId: string) => void;
  onSkipTask: (taskId: string) => void;
  onSelectTask: (taskId: string) => void;
  onCompleteHabit: (habitId: string, date: string) => void;
  onUncompleteHabit: (habitId: string, date: string) => void;
};

export function TodaysStack({
  tasks,
  habits,
  habitCompletions,
  loopStates,
  onCompleteTask,
  onSkipTask,
  onSelectTask,
  onCompleteHabit,
  onUncompleteHabit,
}: TodaysStackProps) {
  const today = new Date().toISOString().split("T")[0];
  const smartSchedule = useSmartSchedule();

  // Get today's day type for badge display
  const todayDayType = useMemo(() => {
    const dayType = getDayType(new Date(), smartSchedule);
    const config = getDayTypeConfig(dayType, smartSchedule);
    return { dayType, config };
  }, [smartSchedule]);

  // Get habits due today
  const todaysHabits = useMemo(() => getHabitsDueToday(habits), [habits]);

  // Check if habit is completed today
  const isHabitCompletedToday = (habitId: string) => {
    return habitCompletions.some(
      (c) => c.habitId === habitId && c.date === today
    );
  };

  // Count completed habits
  const completedHabitsCount = todaysHabits.filter((h) =>
    isHabitCompletedToday(h.id)
  ).length;

  const totalItems = tasks.length + todaysHabits.length;

  if (totalItems === 0) {
    return (
      <div className="todays-stack todays-stack--empty">
        <div className="todays-stack__empty-state">
          <span className="todays-stack__empty-icon">✨</span>
          <h3>All clear!</h3>
          <p>No tasks or habits for today. Enjoy your freedom or add some tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="todays-stack">
      <div className="todays-stack__header">
        <div className="todays-stack__title-row">
          <h3>Today's Stack</h3>
          {smartSchedule.enabled && todayDayType.dayType !== "regular" && (
            <span
              className="todays-stack__day-badge"
              style={{ backgroundColor: todayDayType.config.color }}
            >
              {todayDayType.config.icon} {todayDayType.config.label}
            </span>
          )}
        </div>
        <span className="todays-stack__count">
          {tasks.length} tasks, {completedHabitsCount}/{todaysHabits.length} habits
        </span>
      </div>

      <div className="todays-stack__list">
        {/* Habits Section */}
        {todaysHabits.length > 0 && (
          <div className="todays-stack__section">
            <div className="todays-stack__section-header">
              <span className="todays-stack__section-icon">🔄</span>
              <span className="todays-stack__section-title">Daily Habits</span>
            </div>
            {todaysHabits.map((habit) => {
              const loop = LOOP_DEFINITIONS[habit.loop];
              const loopColor = LOOP_COLORS[habit.loop];
              const isCompleted = isHabitCompletedToday(habit.id);

              return (
                <div
                  key={habit.id}
                  className={`habit-card ${isCompleted ? "habit-card--completed" : ""}`}
                >
                  {/* Habit type indicator */}
                  <div
                    className="habit-card__type-bar"
                    style={{
                      backgroundColor: habit.type === "build" ? "#73A58C" : "#F27059",
                    }}
                  />

                  <div className="habit-card__content">
                    <div className="habit-card__header">
                      <span
                        className="habit-card__loop-badge"
                        style={{
                          backgroundColor: loopColor.bg,
                          color: loopColor.text,
                          borderColor: loopColor.border,
                        }}
                      >
                        {loop.icon} {loop.name}
                      </span>
                      {habit.streak > 0 && (
                        <span className="habit-card__streak">
                          🔥 {habit.streak}
                        </span>
                      )}
                    </div>

                    <h4 className={`habit-card__title ${isCompleted ? "habit-card__title--completed" : ""}`}>
                      {habit.title}
                    </h4>

                    {habit.response && (
                      <p className="habit-card__response">
                        {habit.response}
                      </p>
                    )}

                    {habit.cue && (
                      <p className="habit-card__cue">
                        <span className="habit-card__cue-label">Cue:</span> {habit.cue.value}
                      </p>
                    )}
                  </div>

                  {/* Habit completion toggle */}
                  <div className="habit-card__actions">
                    <button
                      className={`habit-card__btn ${isCompleted ? "habit-card__btn--completed" : ""}`}
                      onClick={() => {
                        if (isCompleted) {
                          onUncompleteHabit(habit.id, today);
                        } else {
                          onCompleteHabit(habit.id, today);
                        }
                      }}
                      title={isCompleted ? "Mark incomplete" : "Mark complete"}
                    >
                      {isCompleted ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tasks Section */}
        {tasks.length > 0 && (
          <div className="todays-stack__section">
            {todaysHabits.length > 0 && (
              <div className="todays-stack__section-header">
                <span className="todays-stack__section-icon">✓</span>
                <span className="todays-stack__section-title">Tasks</span>
              </div>
            )}
            {tasks.map((task) => {
              const loop = LOOP_DEFINITIONS[task.loop];
              const loopColor = LOOP_COLORS[task.loop];

              return (
                <div
                  key={task.id}
                  className={`task-card task-card--priority-${task.priority}`}
                  onClick={() => onSelectTask(task.id)}
                >
                  {/* Priority indicator */}
                  <div
                    className="task-card__priority-bar"
                    style={{
                      backgroundColor:
                        task.priority === 1
                          ? "#F27059"  // Coral for high priority
                          : task.priority === 2
                          ? "#F4B942"  // Amber for medium
                          : task.priority === 3
                          ? "#73A58C"  // Sage for low
                          : "#737390", // Navy gray for none
                    }}
                  />

                  <div className="task-card__content">
                    {/* Header */}
                    <div className="task-card__header">
                      <span
                        className="task-card__loop-badge"
                        style={{
                          backgroundColor: loopColor.bg,
                          color: loopColor.text,
                          borderColor: loopColor.border,
                        }}
                      >
                        {loop.icon} {loop.name}
                      </span>
                      {task.estimateMinutes && (
                        <span className="task-card__duration">
                          {task.estimateMinutes} min
                        </span>
                      )}
                    </div>

                    {/* Title with framing */}
                    <h4 className="task-card__title">
                      {task.framing?.framedTitle || task.title}
                    </h4>

                    {/* Description */}
                    {task.description && (
                      <p className="task-card__description">{task.description}</p>
                    )}

                    {/* Motivational note from archetype */}
                    {task.framing?.motivationalNote && (
                      <p className="task-card__motivation">
                        "{task.framing.motivationalNote}"
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="task-card__meta">
                      {task.subLoop && (
                        <span className="task-card__subloop">{task.subLoop}</span>
                      )}
                      {task.dueDate && (
                        <span className="task-card__due">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="task-card__actions">
                    <button
                      className="task-card__btn task-card__btn--complete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCompleteTask(task.id);
                      }}
                      title="Complete"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    </button>
                    <button
                      className="task-card__btn task-card__btn--skip"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSkipTask(task.id);
                      }}
                      title="Skip for today"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default TodaysStack;
