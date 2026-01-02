// Component Tracker - Track system components (behaviors) with streaks
// Shows today's components grouped by system with visual streak indicators
// Enhanced with archetype-aware personalization

import React, { useState, useMemo } from "react";
import {
  System,
  SystemComponent,
  ComponentCompletion,
  LoopId,
  LOOP_COLORS,
  LOOP_DEFINITIONS,
  getAllComponentsDueToday,
  getEffectiveComponentTimeOfDay,
  getEffectiveComponentCue,
  Routine,
} from "../../types";
import { SmartScheduleState, DayType, BUILT_IN_DAY_TYPES, DEFAULT_DAY_TYPE_CONFIGS } from "../../types/dayTypes";
import { getDayTypes } from "../../engines/smartSchedulerEngine";
import { useApp, useRoutines } from "../../context";

interface ComponentTrackerProps {
  systems: System[];
  completions: ComponentCompletion[];
  smartSchedule?: SmartScheduleState;
  onComplete: (systemId: string, componentId: string, date: string, notes?: string) => void;
  onUncomplete: (systemId: string, componentId: string, date: string) => void;
  onUpdateComponent?: (systemId: string, component: SystemComponent) => void;
  onDeleteComponent?: (systemId: string, componentId: string) => void;
  filterLoop?: LoopId;
  groupBySystem?: boolean;
  showAll?: boolean;
}

interface ComponentWithSystem {
  component: SystemComponent;
  system: System;
}

export function ComponentTracker({
  systems,
  completions,
  smartSchedule,
  onComplete,
  onUncomplete,
  onUpdateComponent,
  onDeleteComponent,
  filterLoop,
  groupBySystem = true,
  showAll = false,
}: ComponentTrackerProps) {
  const { state } = useApp();
  const prototype = state.user.prototype;
  const archetype = prototype?.archetypeBlend?.primary;

  const today = new Date().toISOString().split("T")[0];

  // Track recently completed component for celebration message
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);

  // Editing state
  const [editingComponent, setEditingComponent] = useState<{ component: SystemComponent; system: System } | null>(null);

  // Get today's day types
  const todayDayTypes = useMemo(() => {
    if (!smartSchedule?.enabled) return ["regular"] as DayType[];
    return getDayTypes(new Date(), smartSchedule);
  }, [smartSchedule]);

  // Get all components due today from all systems
  const displayComponents = useMemo(() => {
    // Filter active systems only
    const activeSystems = (systems || []).filter(s => s.status === "active");

    // Optionally filter by loop
    const filteredSystems = filterLoop
      ? activeSystems.filter(s => s.loop === filterLoop)
      : activeSystems;

    if (showAll) {
      // Show all active components from filtered systems
      const allComponents: ComponentWithSystem[] = [];
      for (const system of filteredSystems) {
        if (!system.components) continue;
        for (const component of system.components.filter(c => c.status === "active")) {
          allComponents.push({ component, system });
        }
      }
      return allComponents;
    }

    // Use the helper function to get components due today
    return getAllComponentsDueToday(filteredSystems, todayDayTypes);
  }, [systems, filterLoop, showAll, todayDayTypes]);

  // Check if component is completed today
  const isCompletedToday = (componentId: string) => {
    return (completions || []).some(c => c.componentId === componentId && c.date === today);
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
  const isCompletedOnDay = (componentId: string, date: string) => {
    return (completions || []).some(c => c.componentId === componentId && c.date === date);
  };

  const handleToggle = (component: SystemComponent, system: System) => {
    if (isCompletedToday(component.id)) {
      onUncomplete(system.id, component.id, today);
      setCelebratingId(null);
      setCelebrationMessage(null);
    } else {
      onComplete(system.id, component.id, today);
      // Show celebration message
      const message = getCompletionMessage(component, component.streak + 1);
      setCelebratingId(component.id);
      setCelebrationMessage(message);
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setCelebratingId(null);
        setCelebrationMessage(null);
      }, 3000);
    }
  };

  // Generate completion message based on streak
  const getCompletionMessage = (component: SystemComponent, streak: number): string => {
    if (streak >= 30) return `Legendary! ${streak} day streak on ${component.title}!`;
    if (streak >= 14) return `On fire! ${streak} days and counting!`;
    if (streak >= 7) return `A full week! Keep it up!`;
    if (streak >= 3) return `Building momentum! ${streak} days strong`;
    return "Nice! Keep going!";
  };

  if (displayComponents.length === 0) {
    return (
      <div className="component-tracker component-tracker--empty">
        <div className="component-empty-state">
          <span className="component-empty-icon">🎯</span>
          <p>No components {filterLoop ? `for ${filterLoop}` : "due today"}</p>
          <span className="component-empty-hint">
            Create a System to start tracking components
          </span>
        </div>
      </div>
    );
  }

  // Group by system if requested
  const groupedComponents = useMemo(() => {
    if (!groupBySystem) {
      return new Map([["all", displayComponents]]);
    }
    const groups = new Map<string, ComponentWithSystem[]>();
    for (const item of displayComponents) {
      const key = item.system.id;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }
    return groups;
  }, [displayComponents, groupBySystem]);

  return (
    <div className="component-tracker">
      {Array.from(groupedComponents.entries()).map(([groupKey, items]) => {
        const system = groupKey !== "all" ? items[0]?.system : null;
        const loopColor = system ? LOOP_COLORS[system.loop].border : "#666";

        return (
          <div key={groupKey} className="component-group">
            {system && groupBySystem && (
              <div className="component-group-header" style={{ borderLeftColor: loopColor }}>
                <span className="component-group-icon">{LOOP_DEFINITIONS[system.loop].icon}</span>
                <span className="component-group-title">{system.title}</span>
                <span className="component-group-count">
                  {items.filter(i => isCompletedToday(i.component.id)).length}/{items.length}
                </span>
              </div>
            )}

            <div className="component-list">
              {items.map(({ component, system }) => {
                const completed = isCompletedToday(component.id);
                const itemLoopColor = LOOP_COLORS[system.loop].border;
                const isCelebrating = celebratingId === component.id;
                // Use first day type for getting effective values
                const primaryDayType = todayDayTypes[0] || "regular";
                const cue = getEffectiveComponentCue(component, primaryDayType);
                const timeOfDay = getEffectiveComponentTimeOfDay(component, primaryDayType);

                return (
                  <div
                    key={component.id}
                    className={`component-item ${completed ? "completed" : ""} ${isCelebrating ? "celebrating" : ""}`}
                    style={{ "--loop-color": itemLoopColor } as React.CSSProperties}
                  >
                    <button
                      className="component-check"
                      onClick={() => handleToggle(component, system)}
                      aria-label={completed ? "Mark incomplete" : "Mark complete"}
                    >
                      {completed ? (
                        <span className="check-icon">✓</span>
                      ) : (
                        <span className="check-empty" />
                      )}
                    </button>

                    <div className="component-content" onClick={() => setEditingComponent({ component, system })}>
                      <div className="component-title-row">
                        <span className="component-title">{component.title}</span>
                        {component.streak > 0 && (
                          <span className="component-streak">
                            🔥 {component.streak}
                          </span>
                        )}
                      </div>

                      {/* Celebration message when component is just completed */}
                      {isCelebrating && celebrationMessage && (
                        <div className="component-celebration">
                          {celebrationMessage}
                        </div>
                      )}

                      <div className="component-meta">
                        {!groupBySystem && (
                          <span
                            className="component-loop-tag"
                            style={{ background: `${itemLoopColor}20`, color: itemLoopColor }}
                          >
                            {LOOP_DEFINITIONS[system.loop].icon} {system.title}
                          </span>
                        )}
                        {cue && (
                          <span className="component-cue">{cue.value}</span>
                        )}
                        {timeOfDay && timeOfDay !== "anytime" && (
                          <span className="component-time">{timeOfDay}</span>
                        )}
                      </div>

                      {/* Mini 7-day calendar */}
                      <div className="component-week">
                        {last7Days.map(day => (
                          <div
                            key={day.date}
                            className={`component-day ${isCompletedOnDay(component.id, day.date) ? "completed" : ""} ${day.isToday ? "today" : ""}`}
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
      })}

      {/* Edit Component Modal */}
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

// Component Edit Modal
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
  const routines = useRoutines();
  const activeRoutines = (routines?.items || []).filter(r => r.status === "active");

  const [title, setTitle] = useState(component.title);
  const [response, setResponse] = useState(component.response);
  const [cueValue, setCueValue] = useState(component.cue.value);
  const [dayTypes, setDayTypes] = useState<DayType[]>(component.dayTypes || []);
  const [status, setStatus] = useState(component.status);
  const [linkedRoutineId, setLinkedRoutineId] = useState(component.linkedRoutineId || "");

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
      linkedRoutineId: linkedRoutineId || undefined,
      status,
      updatedAt: new Date().toISOString(),
    });
  };

  const loopColor = LOOP_COLORS[system.loop].border;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="component-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <span style={{ color: loopColor }}>{LOOP_DEFINITIONS[system.loop].icon}</span>
            <h3>Edit Component</h3>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="component-edit-content">
          <div className="component-edit-system">
            <span className="component-edit-system-label">Part of:</span>
            <span className="component-edit-system-name">{system.title}</span>
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

          {/* Routine Integration */}
          {activeRoutines.length > 0 && (
            <div className="form-field">
              <label>Include in Routine</label>
              <p className="form-field-hint">Add this component as a step in an existing routine</p>
              <select
                value={linkedRoutineId}
                onChange={(e) => setLinkedRoutineId(e.target.value)}
                className="routine-select"
              >
                <option value="">None - track separately</option>
                {activeRoutines.map(routine => (
                  <option key={routine.id} value={routine.id}>
                    {routine.icon || "📋"} {routine.title}
                  </option>
                ))}
              </select>
              {linkedRoutineId && (
                <p className="form-field-note">
                  This component will appear as a step when you run this routine
                </p>
              )}
            </div>
          )}

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
          <div className="component-edit-stats">
            <div className="component-edit-stat">
              <span className="component-edit-stat-value">🔥 {component.streak}</span>
              <span className="component-edit-stat-label">Current Streak</span>
            </div>
            <div className="component-edit-stat">
              <span className="component-edit-stat-value">🏆 {component.longestStreak}</span>
              <span className="component-edit-stat-label">Best Streak</span>
            </div>
            <div className="component-edit-stat">
              <span className="component-edit-stat-value">{component.totalCompletions}</span>
              <span className="component-edit-stat-label">Total</span>
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

// Compact widget version for dashboard
interface ComponentWidgetProps {
  systems: System[];
  completions: ComponentCompletion[];
  onComplete: (systemId: string, componentId: string, date: string) => void;
  onUncomplete: (systemId: string, componentId: string, date: string) => void;
  loop?: LoopId;
  limit?: number;
}

export function ComponentWidget({
  systems,
  completions,
  onComplete,
  onUncomplete,
  loop,
  limit = 5,
}: ComponentWidgetProps) {
  const { state } = useApp();
  const smartSchedule = state.smartSchedule;

  const today = new Date().toISOString().split("T")[0];

  // Get today's day types
  const todayDayTypes = useMemo(() => {
    if (!smartSchedule?.enabled) return ["regular"] as DayType[];
    return getDayTypes(new Date(), smartSchedule);
  }, [smartSchedule]);

  // Get all components due today
  const displayComponents = useMemo(() => {
    const activeSystems = (systems || []).filter(s => s.status === "active");
    const filteredSystems = loop
      ? activeSystems.filter(s => s.loop === loop)
      : activeSystems;

    // Use the helper function to get components due today
    const allDueComponents = getAllComponentsDueToday(filteredSystems, todayDayTypes);

    return allDueComponents.slice(0, limit);
  }, [systems, loop, limit, todayDayTypes]);

  const isCompletedToday = (componentId: string) => {
    return (completions || []).some(c => c.componentId === componentId && c.date === today);
  };

  const completedCount = displayComponents.filter(({ component }) => isCompletedToday(component.id)).length;
  const totalCount = displayComponents.length;

  return (
    <div className="component-widget">
      <div className="component-widget-header">
        <span className="component-widget-title">Today's Components</span>
        <span className="component-widget-count">
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className="component-widget-progress">
        <div
          className="component-widget-progress-fill"
          style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%" }}
        />
      </div>

      <div className="component-widget-list">
        {displayComponents.map(({ component, system }) => {
          const completed = isCompletedToday(component.id);
          return (
            <button
              key={component.id}
              className={`component-widget-item ${completed ? "completed" : ""}`}
              onClick={() => {
                if (completed) {
                  onUncomplete(system.id, component.id, today);
                } else {
                  onComplete(system.id, component.id, today);
                }
              }}
            >
              <span className="component-widget-check">
                {completed ? "✓" : "○"}
              </span>
              <span className="component-widget-name">{component.title}</span>
              {component.streak > 0 && (
                <span className="component-widget-streak">🔥{component.streak}</span>
              )}
            </button>
          );
        })}
      </div>

      {displayComponents.length === 0 && (
        <div className="component-widget-empty">
          No components due today
        </div>
      )}
    </div>
  );
}

export default ComponentTracker;
