// Today's Stack - Priority tasks, system components, and routines for the day

import { useMemo, useState } from "react";
import {
  Task,
  LoopId,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
  LoopStateType,
  System,
  SystemComponent,
  ComponentCompletion,
  Routine,
  getAllComponentsDueToday,
  getRoutinesDueTodayWithDayType,
  getRoutineDuration,
  sortRoutinesByTimeOfDay,
  SpecialDate,
  getSpecialDatesToday,
  getUpcomingSpecialDates,
  getDateTypeIcon,
  getReminderActionLabel,
  getYearsSince,
  formatLocalDate,
} from "../../types";
import { useSmartSchedule } from "../../context/AppContext";
import { getDayTypes, getDayTypeConfig } from "../../engines/smartSchedulerEngine";
import { DayType, BUILT_IN_DAY_TYPES, DEFAULT_DAY_TYPE_CONFIGS } from "../../types/dayTypes";

type TodaysStackProps = {
  tasks: Task[];
  systems: System[];
  componentCompletions: ComponentCompletion[];
  routines: Routine[];
  specialDates: SpecialDate[];
  loopStates: Record<LoopId, { currentState: LoopStateType }>;
  onCompleteTask: (taskId: string) => void;
  onSkipTask: (taskId: string) => void;
  onSelectTask: (taskId: string) => void;
  onCompleteComponent: (systemId: string, componentId: string, date: string) => void;
  onUncompleteComponent: (systemId: string, componentId: string, date: string) => void;
  onUpdateComponent?: (systemId: string, component: SystemComponent) => void;
  onDeleteComponent?: (systemId: string, componentId: string) => void;
  onStartRoutine?: (routineId: string) => void;
};

interface ComponentWithSystem {
  component: SystemComponent;
  system: System;
}

// Helper to get status color based on completion percentage
function getStatusColor(completed: number, total: number): string {
  if (total === 0) return "var(--color-text-tertiary)";
  const pct = completed / total;
  if (pct === 1) return "#73A58C"; // Sage - all done
  if (pct >= 0.5) return "#F4B942"; // Amber - in progress
  if (pct > 0) return "#F27059"; // Coral - started
  return "var(--color-text-tertiary)"; // Not started
}

export function TodaysStack({
  tasks,
  systems,
  componentCompletions,
  routines,
  specialDates,
  loopStates: _loopStates,
  onCompleteTask,
  onSkipTask,
  onSelectTask,
  onCompleteComponent,
  onUncompleteComponent,
  onUpdateComponent,
  onDeleteComponent,
  onStartRoutine,
}: TodaysStackProps) {
  const today = new Date().toISOString().split("T")[0];
  const smartSchedule = useSmartSchedule();

  // Collapsed state for each section
  const [routinesCollapsed, setRoutinesCollapsed] = useState(false);
  const [componentsCollapsed, setComponentsCollapsed] = useState(false);
  const [tasksCollapsed, setTasksCollapsed] = useState(false);

  // Component editing state
  const [editingComponent, setEditingComponent] = useState<ComponentWithSystem | null>(null);

  // Get today's day types for badge display (now supports multiple day types per day)
  const todayDayTypes = useMemo(() => {
    const dayTypes = getDayTypes(new Date(), smartSchedule);
    const primaryDayType = dayTypes[0] || "regular";
    const config = getDayTypeConfig(primaryDayType, smartSchedule);
    return { dayTypes, primaryDayType, config };
  }, [smartSchedule]);

  // Get components due today from active systems
  const todaysComponents = useMemo(() => {
    const activeSystems = (systems || []).filter(s => s.status === "active");
    return getAllComponentsDueToday(activeSystems, todayDayTypes.dayTypes as DayType[]);
  }, [systems, todayDayTypes.dayTypes]);

  // Get special dates for today (birthdays, anniversaries, etc.)
  const todaysSpecialDates = useMemo(() => {
    return getSpecialDatesToday(specialDates || []);
  }, [specialDates]);

  // Get upcoming special dates (next 7 days, excluding today)
  const upcomingSpecialDates = useMemo(() => {
    const upcoming = getUpcomingSpecialDates(specialDates || [], 7);
    // Filter out today's dates
    return upcoming.filter(d => !getSpecialDatesToday([d]).length);
  }, [specialDates]);

  // Get routines due today (with day type filtering)
  const todaysRoutines = useMemo(() => {
    const activeRoutines = (routines || []).filter(r => r.status === "active");
    if (smartSchedule.enabled) {
      const filtered = getRoutinesDueTodayWithDayType(activeRoutines, todayDayTypes.dayTypes as DayType[]);
      return sortRoutinesByTimeOfDay(filtered);
    }
    // Without smart schedule, just get routines due today based on frequency
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    return sortRoutinesByTimeOfDay(activeRoutines.filter(r => {
      if (r.schedule.frequency === "daily") return true;
      if (r.schedule.frequency === "weekdays") return !isWeekend;
      if (r.schedule.frequency === "weekends") return isWeekend;
      if (r.schedule.frequency === "weekly") {
        // Show on the specified day, default to Monday
        const scheduledDay = r.schedule.daysOfWeek?.[0] ?? 1;
        return dayOfWeek === scheduledDay;
      }
      return true;
    }));
  }, [routines, smartSchedule.enabled, todayDayTypes.dayTypes]);

  // Check if component is completed today
  const isComponentCompletedToday = (componentId: string) => {
    return (componentCompletions || []).some(
      (c) => c.componentId === componentId && c.date === today
    );
  };

  // Count completed items
  const completedComponentsCount = todaysComponents.filter(({ component }) =>
    isComponentCompletedToday(component.id)
  ).length;

  const completedTasksCount = tasks.filter(t => t.status === "done").length;

  // For routines, we don't have completion tracking in this view yet, so default to 0
  const completedRoutinesCount = 0;

  const totalItems = tasks.length + todaysComponents.length + todaysRoutines.length + todaysSpecialDates.length;

  if (totalItems === 0 && upcomingSpecialDates.length === 0) {
    return (
      <div className="todays-stack todays-stack--empty">
        <div className="todays-stack__empty-state">
          <span className="todays-stack__empty-icon">✨</span>
          <h3>All clear!</h3>
          <p>No tasks, components, or routines for today. Enjoy your freedom or add some tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="todays-stack">
      <div className="todays-stack__header">
        <div className="todays-stack__title-row">
          <h3>Today's Stack</h3>
          {smartSchedule.enabled && todayDayTypes.primaryDayType !== "regular" && (
            <span
              className="todays-stack__day-badge"
              style={{ backgroundColor: todayDayTypes.config.color }}
            >
              {todayDayTypes.config.icon} {todayDayTypes.config.label}
            </span>
          )}
        </div>
      </div>

      <div className="todays-stack__list">
        {/* Routines Section */}
        {todaysRoutines.length > 0 && (
          <div className={`todays-stack__section ${routinesCollapsed ? "collapsed" : ""}`}>
            <button
              className="todays-stack__section-header todays-stack__section-header--clickable"
              onClick={() => setRoutinesCollapsed(!routinesCollapsed)}
            >
              <span className="todays-stack__section-icon">📋</span>
              <span className="todays-stack__section-title">Routines</span>
              <span
                className="todays-stack__section-badge"
                style={{ backgroundColor: getStatusColor(completedRoutinesCount, todaysRoutines.length) }}
              >
                {completedRoutinesCount}/{todaysRoutines.length}
              </span>
              <span className={`todays-stack__section-chevron ${routinesCollapsed ? "collapsed" : ""}`}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </span>
            </button>
            {!routinesCollapsed && (
              <div className="todays-stack__section-content">
                {todaysRoutines.map((routine) => {
                  const duration = getRoutineDuration(routine);
                  const timeLabel = routine.schedule.timeOfDay === "morning" ? "🌅 Morning"
                    : routine.schedule.timeOfDay === "afternoon" ? "☀️ Afternoon"
                    : routine.schedule.timeOfDay === "evening" ? "🌆 Evening"
                    : routine.schedule.timeOfDay === "night" ? "🌙 Night"
                    : "⏰ Anytime";

                  return (
                    <div
                      key={routine.id}
                      className="routine-card routine-card--today"
                      onClick={() => onStartRoutine?.(routine.id)}
                    >
                      <div className="routine-card__icon-container">
                        <span className="routine-card__icon">{routine.icon || "📋"}</span>
                      </div>
                      <div className="routine-card__content">
                        <div className="routine-card__header">
                          <h4 className="routine-card__title">{routine.title}</h4>
                          {routine.streak && routine.streak.currentStreak > 0 && (
                            <span className="routine-card__streak">
                              🔥 {routine.streak.currentStreak}
                            </span>
                          )}
                        </div>
                        <div className="routine-card__meta">
                          <span className="routine-card__time">{timeLabel}</span>
                          <span className="routine-card__duration">{duration} min</span>
                          <span className="routine-card__steps">{routine.steps?.length || 0} steps</span>
                        </div>
                      </div>
                      <div className="routine-card__actions">
                        <button
                          className="routine-card__btn routine-card__btn--start"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartRoutine?.(routine.id);
                          }}
                          title="Start Routine"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Components Section (formerly Habits) */}
        {todaysComponents.length > 0 && (
          <div className={`todays-stack__section ${componentsCollapsed ? "collapsed" : ""}`}>
            <button
              className="todays-stack__section-header todays-stack__section-header--clickable"
              onClick={() => setComponentsCollapsed(!componentsCollapsed)}
            >
              <span className="todays-stack__section-icon">🔄</span>
              <span className="todays-stack__section-title">Components</span>
              <span
                className="todays-stack__section-badge"
                style={{ backgroundColor: getStatusColor(completedComponentsCount, todaysComponents.length) }}
              >
                {completedComponentsCount}/{todaysComponents.length}
              </span>
              <span className={`todays-stack__section-chevron ${componentsCollapsed ? "collapsed" : ""}`}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </span>
            </button>
            {!componentsCollapsed && (
              <div className="todays-stack__section-content">
                {todaysComponents.map(({ component, system }) => {
                  const loop = LOOP_DEFINITIONS[system.loop];
                  const loopColor = LOOP_COLORS[system.loop];
                  const isCompleted = isComponentCompletedToday(component.id);

                  return (
                    <div
                      key={component.id}
                      className={`habit-card ${isCompleted ? "habit-card--completed" : ""}`}
                      onClick={() => setEditingComponent({ component, system })}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Component loop indicator */}
                      <div
                        className="habit-card__type-bar"
                        style={{
                          backgroundColor: loopColor.border,
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
                            {loop.icon} {system.title}
                          </span>
                          {component.streak > 0 && (
                            <span className="habit-card__streak">
                              🔥 {component.streak}
                            </span>
                          )}
                        </div>

                        <h4 className={`habit-card__title ${isCompleted ? "habit-card__title--completed" : ""}`}>
                          {component.title}
                        </h4>

                        {component.response && (
                          <p className="habit-card__response">
                            {component.response}
                          </p>
                        )}

                        {component.cue && (
                          <p className="habit-card__cue">
                            <span className="habit-card__cue-label">Cue:</span> {component.cue.value}
                          </p>
                        )}
                      </div>

                      {/* Component completion toggle */}
                      <div className="habit-card__actions">
                        <button
                          className={`habit-card__btn ${isCompleted ? "habit-card__btn--completed" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCompleted) {
                              onUncompleteComponent(system.id, component.id, today);
                            } else {
                              onCompleteComponent(system.id, component.id, today);
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
          </div>
        )}

        {/* Tasks Section */}
        {tasks.length > 0 && (
          <div className={`todays-stack__section ${tasksCollapsed ? "collapsed" : ""}`}>
            <button
              className="todays-stack__section-header todays-stack__section-header--clickable"
              onClick={() => setTasksCollapsed(!tasksCollapsed)}
            >
              <span className="todays-stack__section-icon">✓</span>
              <span className="todays-stack__section-title">Tasks</span>
              <span
                className="todays-stack__section-badge"
                style={{ backgroundColor: getStatusColor(completedTasksCount, tasks.length) }}
              >
                {completedTasksCount}/{tasks.length}
              </span>
              <span className={`todays-stack__section-chevron ${tasksCollapsed ? "collapsed" : ""}`}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </span>
            </button>
            {!tasksCollapsed && (
              <div className="todays-stack__section-content">
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
                              Due: {formatLocalDate(task.dueDate)}
                              {task.dueTime && ` at ${task.dueTime}`}
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
        )}

        {/* Special Dates Section - Today's reminders */}
        {todaysSpecialDates.length > 0 && (
          <div className="todays-stack__section todays-stack__section--special-dates">
            <div className="todays-stack__section-header">
              <span className="todays-stack__section-icon">🎉</span>
              <span className="todays-stack__section-title">Today's Special Dates</span>
            </div>
            <div className="todays-stack__section-content">
              {todaysSpecialDates.map((specialDate) => {
                const years = getYearsSince(specialDate);
                const icon = getDateTypeIcon(specialDate.type);
                const action = getReminderActionLabel(specialDate.reminderAction);

                return (
                  <div
                    key={specialDate.id}
                    className="special-date-card special-date-card--today"
                  >
                    <span className="special-date-card__icon">{icon}</span>
                    <div className="special-date-card__content">
                      <h4 className="special-date-card__title">{specialDate.title}</h4>
                      <p className="special-date-card__action">
                        {action} {specialDate.personName}
                        {years !== null && specialDate.type === "birthday" && (
                          <span className="special-date-card__years"> - turning {years + 1}!</span>
                        )}
                        {years !== null && specialDate.type === "wedding_anniversary" && (
                          <span className="special-date-card__years"> - {years} years!</span>
                        )}
                        {years !== null && specialDate.type === "death_anniversary" && (
                          <span className="special-date-card__years"> - {years} years</span>
                        )}
                      </p>
                      {specialDate.notes && (
                        <p className="special-date-card__notes">{specialDate.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Special Dates (next 7 days) */}
        {upcomingSpecialDates.length > 0 && (
          <div className="todays-stack__section todays-stack__section--upcoming">
            <div className="todays-stack__section-header">
              <span className="todays-stack__section-icon">📅</span>
              <span className="todays-stack__section-title">Coming Up</span>
            </div>
            <div className="todays-stack__section-content">
              {upcomingSpecialDates.slice(0, 3).map((specialDate) => {
                const icon = getDateTypeIcon(specialDate.type);
                // Calculate days until
                const [, month, day] = specialDate.date.split("-").map(Number);
                const thisYear = new Date().getFullYear();
                let targetDate = new Date(thisYear, month - 1, day);
                if (targetDate < new Date()) {
                  targetDate = new Date(thisYear + 1, month - 1, day);
                }
                const daysUntil = Math.ceil(
                  (targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={specialDate.id}
                    className="special-date-card special-date-card--upcoming"
                  >
                    <span className="special-date-card__icon">{icon}</span>
                    <div className="special-date-card__content">
                      <h4 className="special-date-card__title">{specialDate.title}</h4>
                      <p className="special-date-card__meta">
                        {specialDate.personName} &middot;{" "}
                        {daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Component Edit Modal */}
      {editingComponent && onUpdateComponent && (
        <ComponentEditModal
          component={editingComponent.component}
          system={editingComponent.system}
          onClose={() => setEditingComponent(null)}
          onSave={(updated) => {
            onUpdateComponent(editingComponent.system.id, updated);
            setEditingComponent(null);
          }}
          onDelete={onDeleteComponent ? () => {
            onDeleteComponent(editingComponent.system.id, editingComponent.component.id);
            setEditingComponent(null);
          } : undefined}
        />
      )}
    </div>
  );
}

// Component Edit Modal with day type selection
function ComponentEditModal({
  component,
  system,
  onClose,
  onSave,
  onDelete,
}: {
  component: SystemComponent;
  system: System;
  onClose: () => void;
  onSave: (component: SystemComponent) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(component.title);
  const [response, setResponse] = useState(component.response);
  const [cueValue, setCueValue] = useState(component.cue.value);
  const [dayTypes, setDayTypes] = useState<DayType[]>(component.dayTypes || []);
  const [status, setStatus] = useState(component.status);

  const handleToggleDayType = (dayType: DayType) => {
    setDayTypes((prev) =>
      prev.includes(dayType)
        ? prev.filter((dt) => dt !== dayType)
        : [...prev, dayType]
    );
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      ...component,
      title: title.trim(),
      response,
      cue: { ...component.cue, value: cueValue },
      dayTypes: dayTypes.length > 0 ? dayTypes : undefined,
      status,
      updatedAt: new Date().toISOString(),
    });
  };

  const loopColor = LOOP_COLORS[system.loop].border;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="habit-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <span style={{ color: loopColor }}>{LOOP_DEFINITIONS[system.loop].icon}</span>
            <h3>Edit Component</h3>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="habit-edit-content">
          {/* Show which system this component belongs to */}
          <div className="habit-edit-system-info">
            <span className="habit-edit-system-label">Part of system:</span>
            <span className="habit-edit-system-id">{system.title}</span>
          </div>

          <div className="form-field">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Component title"
            />
          </div>

          <div className="form-field">
            <label>Action (2-minute version)</label>
            <input
              type="text"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="What you do"
            />
          </div>

          <div className="form-field">
            <label>Cue ({component.cue.type})</label>
            <input
              type="text"
              value={cueValue}
              onChange={(e) => setCueValue(e.target.value)}
              placeholder="When/where this happens"
            />
          </div>

          <div className="form-field">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Day Types */}
          <div className="form-field">
            <label>Active on Day Types</label>
            <p className="form-field-hint">Leave empty to run on all days</p>
            <div className="day-type-selector">
              {BUILT_IN_DAY_TYPES.map((dt) => {
                const config = DEFAULT_DAY_TYPE_CONFIGS[dt];
                const isSelected = dayTypes.includes(dt);
                return (
                  <button
                    key={dt}
                    type="button"
                    className={`day-type-chip ${isSelected ? "selected" : ""}`}
                    onClick={() => handleToggleDayType(dt)}
                    style={isSelected ? { backgroundColor: config.color, borderColor: config.color } : {}}
                  >
                    <span className="day-type-chip-icon">{config.icon}</span>
                    <span className="day-type-chip-label">{config.label}</span>
                  </button>
                );
              })}
            </div>
            {dayTypes.length === 0 && (
              <p className="form-field-note">This component will run on all day types</p>
            )}
          </div>

          {/* Stats */}
          <div className="habit-edit-stats">
            <div className="habit-edit-stat">
              <span className="habit-edit-stat-value">🔥 {component.streak}</span>
              <span className="habit-edit-stat-label">Current Streak</span>
            </div>
            <div className="habit-edit-stat">
              <span className="habit-edit-stat-value">🏆 {component.longestStreak}</span>
              <span className="habit-edit-stat-label">Best Streak</span>
            </div>
            <div className="habit-edit-stat">
              <span className="habit-edit-stat-value">{component.totalCompletions}</span>
              <span className="habit-edit-stat-label">Total</span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          {onDelete && (
            <button
              className="modal-btn modal-btn--danger"
              onClick={() => {
                if (confirm("Delete this component? This cannot be undone.")) {
                  onDelete();
                }
              }}
            >
              Delete
            </button>
          )}
          <div className="modal-actions-right">
            <button className="modal-btn modal-btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="modal-btn modal-btn--primary"
              onClick={handleSave}
              disabled={!title.trim()}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TodaysStack;
