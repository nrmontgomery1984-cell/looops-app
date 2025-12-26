// Routines Screen - Multi-step routines spanning multiple loops

import React, { useState, useMemo } from "react";
import {
  Routine,
  RoutineStep,
  RoutineTemplate,
  ROUTINE_TEMPLATES,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
  LoopId,
  ALL_LOOPS,
  TimeOfDay,
  RoutineFrequency,
  getRoutinesDueToday,
  getScheduleDescription,
  sortRoutinesByTimeOfDay,
  createRoutineFromTemplate,
  getRoutineDuration,
  getRoutineLoops,
} from "../../types";

type RoutinesScreenProps = {
  routines: Routine[];
  onAddRoutine: (routine: Routine) => void;
  onUpdateRoutine: (routine: Routine) => void;
  onDeleteRoutine: (routineId: string) => void;
  onCompleteRoutine: (routineId: string) => void;
  onSkipRoutine: (routineId: string) => void;
};

type RoutineView = "today" | "all" | "time";

export function RoutinesScreen({
  routines,
  onAddRoutine,
  onUpdateRoutine,
  onDeleteRoutine,
  onCompleteRoutine,
  onSkipRoutine,
}: RoutinesScreenProps) {
  const [currentView, setCurrentView] = useState<RoutineView>("today");
  const [selectedTime, setSelectedTime] = useState<TimeOfDay | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Get routines due today
  const todayRoutines = useMemo(() => {
    return sortRoutinesByTimeOfDay(getRoutinesDueToday(routines));
  }, [routines]);

  // Get active routines
  const activeRoutines = useMemo(() => {
    return routines.filter((r) => r.status === "active");
  }, [routines]);

  // Group by time of day
  const routinesByTime = useMemo(() => {
    const grouped: Record<TimeOfDay, Routine[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      night: [],
      anytime: [],
    };
    activeRoutines.forEach((r) => {
      grouped[r.schedule.timeOfDay].push(r);
    });
    return grouped;
  }, [activeRoutines]);

  // Count routines per time
  const getTimeCount = (time: TimeOfDay) => routinesByTime[time].length;

  // Filtered routines based on view
  const filteredRoutines = useMemo(() => {
    switch (currentView) {
      case "today":
        return todayRoutines;
      case "all":
        return activeRoutines;
      case "time":
        if (!selectedTime) return [];
        return routinesByTime[selectedTime];
      default:
        return activeRoutines;
    }
  }, [currentView, todayRoutines, activeRoutines, routinesByTime, selectedTime]);

  // Time labels
  const timeLabels: Record<TimeOfDay, { label: string; icon: string }> = {
    morning: { label: "Morning", icon: "🌅" },
    afternoon: { label: "Afternoon", icon: "☀️" },
    evening: { label: "Evening", icon: "🌆" },
    night: { label: "Night", icon: "🌙" },
    anytime: { label: "Anytime", icon: "⏰" },
  };

  // Get view title
  const getViewTitle = () => {
    switch (currentView) {
      case "today":
        return "Today's Routines";
      case "all":
        return "All Routines";
      case "time":
        return selectedTime ? `${timeLabels[selectedTime].icon} ${timeLabels[selectedTime].label}` : "Time";
      default:
        return "Routines";
    }
  };

  // Get view description
  const getViewDescription = () => {
    switch (currentView) {
      case "today":
        return `${todayRoutines.length} routine${todayRoutines.length !== 1 ? "s" : ""} scheduled for today`;
      case "all":
        return `${activeRoutines.length} active routine${activeRoutines.length !== 1 ? "s" : ""}`;
      case "time":
        return selectedTime ? `Routines scheduled for ${timeLabels[selectedTime].label.toLowerCase()}` : "";
      default:
        return "";
    }
  };

  return (
    <div className="routines-screen">
      {/* Sidebar */}
      <div className={`routines-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? "▶" : "◀"}
        </button>

        {!sidebarCollapsed && (
          <>
            {/* Main views */}
            <div className="sidebar-section">
              <button
                className={`sidebar-item ${currentView === "today" ? "active" : ""}`}
                onClick={() => setCurrentView("today")}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="sidebar-icon today-icon">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
                </svg>
                <span>Today</span>
                {todayRoutines.length > 0 && (
                  <span className="sidebar-badge">{todayRoutines.length}</span>
                )}
              </button>

              <button
                className={`sidebar-item ${currentView === "all" ? "active" : ""}`}
                onClick={() => setCurrentView("all")}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="sidebar-icon">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span>All Routines</span>
                {activeRoutines.length > 0 && (
                  <span className="sidebar-badge">{activeRoutines.length}</span>
                )}
              </button>
            </div>

            {/* By Time */}
            <div className="sidebar-section">
              <div className="sidebar-section-header">
                <span>By Time</span>
              </div>
              {(Object.keys(timeLabels) as TimeOfDay[]).map((time) => {
                const { label, icon } = timeLabels[time];
                const count = getTimeCount(time);
                return (
                  <button
                    key={time}
                    className={`sidebar-item ${currentView === "time" && selectedTime === time ? "active" : ""}`}
                    onClick={() => {
                      setCurrentView("time");
                      setSelectedTime(time);
                    }}
                  >
                    <span className="sidebar-icon loop-icon">{icon}</span>
                    <span>{label}</span>
                    {count > 0 && <span className="sidebar-badge">{count}</span>}
                  </button>
                );
              })}
            </div>

            {/* Stats */}
            <div className="sidebar-section">
              <div className="sidebar-section-header">
                <span>Stats</span>
              </div>
              <div className="sidebar-stats">
                <div className="sidebar-stat-item">
                  <span className="sidebar-stat-value">{activeRoutines.length}</span>
                  <span className="sidebar-stat-label">Active</span>
                </div>
                <div className="sidebar-stat-item">
                  <span className="sidebar-stat-value">{todayRoutines.length}</span>
                  <span className="sidebar-stat-label">Today</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main content */}
      <div className="routines-main">
        {/* Header */}
        <div className="routines-header">
          <div className="routines-header-left">
            <h2>{getViewTitle()}</h2>
            <p className="routines-description">{getViewDescription()}</p>
          </div>
          <div className="routines-header-right">
            <button
              className="routines-add-btn"
              onClick={() => setShowAddModal(true)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              Add Routine
            </button>
          </div>
        </div>

        {/* Routine list */}
        <div className="routines-list">
          {filteredRoutines.length === 0 ? (
            <div className="routines-empty">
              <div className="routines-empty-icon">📋</div>
              <h3>
                {currentView === "today"
                  ? "No routines for today"
                  : "No routines yet"}
              </h3>
              <p>
                {currentView === "today"
                  ? "All caught up! Check back later or add a new routine."
                  : "Add a routine to start building healthy habits."}
              </p>
              <button
                className="routines-add-btn"
                onClick={() => setShowAddModal(true)}
              >
                Add Routine
              </button>
            </div>
          ) : (
            filteredRoutines.map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                isToday={currentView === "today"}
                onStart={() => setActiveRoutine(routine)}
                onEdit={() => setEditingRoutine(routine)}
              />
            ))
          )}
        </div>
      </div>

      {/* Active Routine Modal - Step-by-step completion */}
      {activeRoutine && (
        <ActiveRoutineModal
          routine={activeRoutine}
          onClose={() => setActiveRoutine(null)}
          onComplete={() => {
            onCompleteRoutine(activeRoutine.id);
            setActiveRoutine(null);
          }}
          onSkip={() => {
            onSkipRoutine(activeRoutine.id);
            setActiveRoutine(null);
          }}
        />
      )}

      {/* Add Routine Modal */}
      {showAddModal && (
        <AddRoutineModal
          onClose={() => setShowAddModal(false)}
          onAdd={(routine) => {
            onAddRoutine(routine);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Edit Routine Modal */}
      {editingRoutine && (
        <EditRoutineModal
          routine={editingRoutine}
          onClose={() => setEditingRoutine(null)}
          onSave={(routine) => {
            onUpdateRoutine(routine);
            setEditingRoutine(null);
          }}
          onDelete={() => {
            onDeleteRoutine(editingRoutine.id);
            setEditingRoutine(null);
          }}
        />
      )}

      {/* Floating Action Button */}
      <button
        className="fab-quick-add"
        onClick={() => setShowAddModal(true)}
        title="Add Routine"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      </button>
    </div>
  );
}

// Routine Card - Shows routine with steps preview
function RoutineCard({
  routine,
  isToday,
  onStart,
  onEdit,
}: {
  routine: Routine;
  isToday: boolean;
  onStart: () => void;
  onEdit: () => void;
}) {
  const duration = getRoutineDuration(routine);
  const loops = getRoutineLoops(routine);

  return (
    <div className="routine-card" onClick={onEdit}>
      <div className="routine-card-header">
        <div className="routine-card-icon">{routine.icon || "📋"}</div>
        <div className="routine-card-info">
          <div className="routine-card-title">{routine.title}</div>
          <div className="routine-card-meta">
            <span className="routine-card-schedule">
              {getScheduleDescription(routine.schedule)}
            </span>
            <span className="routine-card-duration">{duration}m</span>
            <span className="routine-card-steps">{routine.steps?.length || 0} steps</span>
          </div>
        </div>
        {routine.streak.currentStreak > 0 && (
          <div className="routine-card-streak">
            <span className="routine-streak-fire">🔥</span>
            <span className="routine-streak-count">{routine.streak.currentStreak}</span>
          </div>
        )}
      </div>

      {/* Loop badges */}
      <div className="routine-card-loops">
        {loops.map((loopId) => {
          const loop = LOOP_DEFINITIONS[loopId];
          const color = LOOP_COLORS[loopId];
          return (
            <span
              key={loopId}
              className="routine-loop-badge"
              style={{ backgroundColor: color.bg, color: color.text }}
            >
              {loop.icon} {loopId}
            </span>
          );
        })}
      </div>

      {/* Steps preview */}
      <div className="routine-card-steps-preview">
        {(routine.steps || []).slice(0, 4).map((step) => {
          const color = LOOP_COLORS[step.loop];
          return (
            <div key={step.id} className="routine-step-preview">
              <span
                className="routine-step-dot"
                style={{ backgroundColor: color.border }}
              />
              <span className="routine-step-title">{step.title}</span>
              {step.optional && <span className="routine-step-optional">optional</span>}
            </div>
          );
        })}
        {(routine.steps?.length || 0) > 4 && (
          <div className="routine-steps-more">
            +{routine.steps.length - 4} more steps
          </div>
        )}
      </div>

      {isToday && (
        <button
          className="routine-start-btn"
          onClick={(e) => {
            e.stopPropagation();
            onStart();
          }}
        >
          Start Routine
        </button>
      )}
    </div>
  );
}

// Active Routine Modal - Step-by-step completion
function ActiveRoutineModal({
  routine,
  onClose,
  onComplete,
  onSkip,
}: {
  routine: Routine;
  onClose: () => void;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [skippedSteps, setSkippedSteps] = useState<Set<string>>(new Set());

  const requiredSteps = routine.steps.filter((s) => !s.optional);
  const allRequiredDone = requiredSteps.every(
    (s) => completedSteps.has(s.id) || skippedSteps.has(s.id)
  );

  const toggleStep = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
      // Remove from skipped if it was skipped
      const newSkipped = new Set(skippedSteps);
      newSkipped.delete(stepId);
      setSkippedSteps(newSkipped);
    }
    setCompletedSteps(newCompleted);
  };

  const skipStep = (stepId: string) => {
    const newSkipped = new Set(skippedSteps);
    newSkipped.add(stepId);
    setSkippedSteps(newSkipped);
    // Remove from completed if it was completed
    const newCompleted = new Set(completedSteps);
    newCompleted.delete(stepId);
    setCompletedSteps(newCompleted);
  };

  const progress = Math.round(
    ((completedSteps.size + skippedSteps.size) / routine.steps.length) * 100
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="routine-active-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <span className="modal-header-icon">{routine.icon || "📋"}</span>
            <h3>{routine.title}</h3>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Progress bar */}
        <div className="routine-progress">
          <div className="routine-progress-bar">
            <div
              className="routine-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="routine-progress-text">
            {completedSteps.size}/{routine.steps.length} completed
          </span>
        </div>

        {/* Steps checklist */}
        <div className="routine-steps-list">
          {routine.steps.map((step) => {
            const isCompleted = completedSteps.has(step.id);
            const isSkipped = skippedSteps.has(step.id);
            const color = LOOP_COLORS[step.loop];
            const loop = LOOP_DEFINITIONS[step.loop];

            return (
              <div
                key={step.id}
                className={`routine-step-item ${isCompleted ? "completed" : ""} ${isSkipped ? "skipped" : ""}`}
                style={{ borderLeftColor: color.border }}
              >
                <button
                  className={`routine-step-checkbox ${isCompleted ? "checked" : ""}`}
                  onClick={() => toggleStep(step.id)}
                >
                  {isCompleted && (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </button>

                <div className="routine-step-content">
                  <div className="routine-step-title">{step.title}</div>
                  <div className="routine-step-meta">
                    <span style={{ color: color.text }}>{loop.icon} {step.loop}</span>
                    {step.estimateMinutes && <span>{step.estimateMinutes}m</span>}
                    {step.optional && <span className="optional-tag">optional</span>}
                  </div>
                </div>

                {!isCompleted && !isSkipped && step.optional && (
                  <button
                    className="routine-step-skip"
                    onClick={() => skipStep(step.id)}
                  >
                    Skip
                  </button>
                )}

                {isSkipped && (
                  <span className="routine-step-skipped-badge">Skipped</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="modal-actions">
          <button className="modal-btn modal-btn--secondary" onClick={onSkip}>
            Skip Today
          </button>
          <button
            className="modal-btn modal-btn--primary"
            onClick={onComplete}
            disabled={!allRequiredDone}
          >
            {allRequiredDone ? "Complete Routine" : "Complete Required Steps"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Routine Modal with tabs for Templates and Custom
function AddRoutineModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (routine: Routine) => void;
}) {
  const [activeTab, setActiveTab] = useState<"templates" | "custom">("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<RoutineTemplate | null>(null);
  const [filterTime, setFilterTime] = useState<TimeOfDay | "all">("all");

  // Custom routine state
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customIcon, setCustomIcon] = useState("📋");
  const [customFrequency, setCustomFrequency] = useState<"daily" | "weekdays" | "weekends" | "weekly">("daily");
  const [customTimeOfDay, setCustomTimeOfDay] = useState<TimeOfDay>("morning");
  const [customSteps, setCustomSteps] = useState<Array<{
    id: string;
    title: string;
    loop: LoopId;
    estimateMinutes: number;
    optional: boolean;
  }>>([]);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepLoop, setNewStepLoop] = useState<LoopId>("Health");
  const [newStepMinutes, setNewStepMinutes] = useState(5);

  const filteredTemplates = useMemo(() => {
    if (filterTime === "all") return ROUTINE_TEMPLATES;
    return ROUTINE_TEMPLATES.filter((t) => t.schedule.timeOfDay === filterTime);
  }, [filterTime]);

  const handleAddTemplate = () => {
    if (selectedTemplate) {
      const routine = createRoutineFromTemplate(selectedTemplate);
      onAdd(routine);
    }
  };

  const handleAddStep = () => {
    if (!newStepTitle.trim()) return;
    const newStep = {
      id: `step_${Date.now()}`,
      title: newStepTitle.trim(),
      loop: newStepLoop,
      estimateMinutes: newStepMinutes,
      optional: false,
    };
    setCustomSteps([...customSteps, newStep]);
    setNewStepTitle("");
    setNewStepMinutes(5);
  };

  const handleRemoveStep = (stepId: string) => {
    setCustomSteps(customSteps.filter((s) => s.id !== stepId));
  };

  const handleToggleOptional = (stepId: string) => {
    setCustomSteps(
      customSteps.map((s) =>
        s.id === stepId ? { ...s, optional: !s.optional } : s
      )
    );
  };

  const handleCreateCustom = () => {
    if (!customTitle.trim() || customSteps.length === 0) return;

    const routine: Routine = {
      id: `routine_${Date.now()}`,
      title: customTitle.trim(),
      description: customDescription.trim() || undefined,
      icon: customIcon,
      steps: customSteps.map((s, i) => ({ ...s, order: i })),
      schedule: {
        frequency: customFrequency,
        timeOfDay: customTimeOfDay,
      },
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        completionRate: 0,
      },
    };
    onAdd(routine);
  };

  const iconOptions = ["📋", "🌅", "🌙", "💪", "🧘", "📚", "✨", "🎯", "⚡", "🔥", "💼", "🏠", "🍎", "💰"];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="routine-add-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Routine</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="routine-add-tabs">
          <button
            className={`routine-add-tab ${activeTab === "templates" ? "active" : ""}`}
            onClick={() => setActiveTab("templates")}
          >
            Templates
          </button>
          <button
            className={`routine-add-tab ${activeTab === "custom" ? "active" : ""}`}
            onClick={() => setActiveTab("custom")}
          >
            Create Custom
          </button>
        </div>

        {activeTab === "templates" ? (
          <>
            <div className="routine-templates">
              <div className="routine-templates-filter">
                <select
                  value={filterTime}
                  onChange={(e) => setFilterTime(e.target.value as TimeOfDay | "all")}
                >
                  <option value="all">All Times</option>
                  <option value="morning">🌅 Morning</option>
                  <option value="afternoon">☀️ Afternoon</option>
                  <option value="evening">🌆 Evening</option>
                  <option value="night">🌙 Night</option>
                </select>
              </div>

              <div className="routine-templates-list">
                {filteredTemplates.map((template) => {
                  const isSelected = selectedTemplate?.id === template.id;
                  const loops = [...new Set(template.steps.map((s) => s.loop))];
                  const totalMinutes = template.steps.reduce((sum, s) => sum + (s.estimateMinutes || 0), 0);

                  return (
                    <div
                      key={template.id}
                      className={`routine-template-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="routine-template-header">
                        <span className="routine-template-icon">{template.icon}</span>
                        <div className="routine-template-info">
                          <div className="routine-template-title">{template.title}</div>
                          <div className="routine-template-meta">
                            <span>{getScheduleDescription(template.schedule)}</span>
                            <span>{totalMinutes}m</span>
                            <span>{template.steps.length} steps</span>
                          </div>
                        </div>
                        {isSelected && (
                          <svg className="routine-template-check" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        )}
                      </div>

                      <p className="routine-template-description">{template.description}</p>

                      <div className="routine-template-loops">
                        {loops.map((loopId) => {
                          const loop = LOOP_DEFINITIONS[loopId];
                          const color = LOOP_COLORS[loopId];
                          return (
                            <span
                              key={loopId}
                              className="routine-loop-badge-sm"
                              style={{ backgroundColor: color.bg, color: color.text }}
                            >
                              {loop.icon}
                            </span>
                          );
                        })}
                      </div>

                      {isSelected && (
                        <div className="routine-template-steps">
                          {template.steps.map((step, index) => {
                            const color = LOOP_COLORS[step.loop];
                            return (
                              <div key={index} className="routine-template-step">
                                <span
                                  className="routine-step-dot"
                                  style={{ backgroundColor: color.border }}
                                />
                                <span>{step.title}</span>
                                {step.optional && <span className="optional-badge">optional</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-btn modal-btn--secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                className="modal-btn modal-btn--primary"
                onClick={handleAddTemplate}
                disabled={!selectedTemplate}
              >
                Add Routine
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="routine-custom-form">
              {/* Basic Info */}
              <div className="routine-custom-row">
                <div className="routine-custom-icon-picker">
                  <label>Icon</label>
                  <div className="icon-grid">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        className={`icon-option ${customIcon === icon ? "selected" : ""}`}
                        onClick={() => setCustomIcon(icon)}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-field">
                <label>Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="My Morning Routine"
                />
              </div>

              <div className="form-field">
                <label>Description (optional)</label>
                <textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="What is this routine for?"
                  rows={2}
                />
              </div>

              <div className="routine-custom-schedule">
                <div className="form-field">
                  <label>Frequency</label>
                  <select
                    value={customFrequency}
                    onChange={(e) => setCustomFrequency(e.target.value as typeof customFrequency)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekends">Weekends</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Time of Day</label>
                  <select
                    value={customTimeOfDay}
                    onChange={(e) => setCustomTimeOfDay(e.target.value as TimeOfDay)}
                  >
                    <option value="morning">🌅 Morning</option>
                    <option value="afternoon">☀️ Afternoon</option>
                    <option value="evening">🌆 Evening</option>
                    <option value="night">🌙 Night</option>
                    <option value="anytime">⏰ Anytime</option>
                  </select>
                </div>
              </div>

              {/* Steps */}
              <div className="routine-custom-steps">
                <label>Steps ({customSteps.length})</label>

                {customSteps.length > 0 && (
                  <div className="routine-custom-steps-list">
                    {customSteps.map((step, index) => {
                      const color = LOOP_COLORS[step.loop];
                      const loop = LOOP_DEFINITIONS[step.loop];
                      return (
                        <div
                          key={step.id}
                          className="routine-custom-step"
                          style={{ borderLeftColor: color.border }}
                        >
                          <span className="routine-custom-step-num">{index + 1}</span>
                          <div className="routine-custom-step-content">
                            <span className="routine-custom-step-title">{step.title}</span>
                            <span className="routine-custom-step-meta">
                              {loop.icon} {step.loop} • {step.estimateMinutes}m
                              {step.optional && " • optional"}
                            </span>
                          </div>
                          <button
                            className="routine-custom-step-optional"
                            onClick={() => handleToggleOptional(step.id)}
                            title={step.optional ? "Make required" : "Make optional"}
                          >
                            {step.optional ? "Optional" : "Required"}
                          </button>
                          <button
                            className="routine-custom-step-remove"
                            onClick={() => handleRemoveStep(step.id)}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Step Form */}
                <div className="routine-add-step-form">
                  <div className="routine-add-step-row">
                    <input
                      type="text"
                      value={newStepTitle}
                      onChange={(e) => setNewStepTitle(e.target.value)}
                      placeholder="Step title..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddStep();
                        }
                      }}
                    />
                    <select
                      value={newStepLoop}
                      onChange={(e) => setNewStepLoop(e.target.value as LoopId)}
                    >
                      {ALL_LOOPS.map((loop) => (
                        <option key={loop} value={loop}>
                          {LOOP_DEFINITIONS[loop].icon} {loop}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="routine-add-step-row">
                    <input
                      type="number"
                      value={newStepMinutes}
                      onChange={(e) => setNewStepMinutes(parseInt(e.target.value) || 5)}
                      min={1}
                      max={120}
                      className="routine-step-minutes"
                    />
                    <span className="routine-step-minutes-label">min</span>
                    <button
                      type="button"
                      className="routine-add-step-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddStep();
                      }}
                    >
                      + Add Step
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="modal-btn modal-btn--secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                className="modal-btn modal-btn--primary"
                onClick={handleCreateCustom}
                disabled={!customTitle.trim() || customSteps.length === 0}
              >
                Create Routine
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Edit Routine Modal - Full editing with steps
function EditRoutineModal({
  routine,
  onClose,
  onSave,
  onDelete,
}: {
  routine: Routine;
  onClose: () => void;
  onSave: (routine: Routine) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(routine.title);
  const [description, setDescription] = useState(routine.description || "");
  const [icon, setIcon] = useState(routine.icon || "📋");
  const [status, setStatus] = useState(routine.status);
  const [frequency, setFrequency] = useState(routine.schedule.frequency);
  const [timeOfDay, setTimeOfDay] = useState(routine.schedule.timeOfDay);
  const [steps, setSteps] = useState(routine.steps || []);

  // New step form
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepLoop, setNewStepLoop] = useState<LoopId>("Health");
  const [newStepMinutes, setNewStepMinutes] = useState(5);

  const duration = steps.reduce((sum, s) => sum + (s.estimateMinutes || 0), 0);
  const loops = [...new Set(steps.map((s) => s.loop))];

  const iconOptions = ["📋", "🌅", "🌙", "💪", "🧘", "📚", "✨", "🎯", "⚡", "🔥", "💼", "🏠", "🍎", "💰"];

  const handleAddStep = () => {
    if (!newStepTitle.trim()) return;
    setSteps([
      ...steps,
      {
        id: `step_${Date.now()}`,
        title: newStepTitle.trim(),
        loop: newStepLoop,
        estimateMinutes: newStepMinutes,
        order: steps.length,
        optional: false,
      },
    ]);
    setNewStepTitle("");
    setNewStepMinutes(5);
  };

  const handleRemoveStep = (stepId: string) => {
    setSteps(steps.filter((s) => s.id !== stepId));
  };

  const handleToggleOptional = (stepId: string) => {
    setSteps(
      steps.map((s) =>
        s.id === stepId ? { ...s, optional: !s.optional } : s
      )
    );
  };

  const handleMoveStep = (stepId: string, direction: "up" | "down") => {
    const index = steps.findIndex((s) => s.id === stepId);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === steps.length - 1) return;

    const newSteps = [...steps];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newSteps[index], newSteps[swapIndex]] = [newSteps[swapIndex], newSteps[index]];
    setSteps(newSteps.map((s, i) => ({ ...s, order: i })));
  };

  const handleSave = () => {
    if (!title.trim() || steps.length === 0) return;
    onSave({
      ...routine,
      title: title.trim(),
      description: description.trim() || undefined,
      icon,
      status,
      schedule: {
        ...routine.schedule,
        frequency,
        timeOfDay,
      },
      steps: steps.map((s, i) => ({ ...s, order: i })),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="routine-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <span className="modal-header-icon">{icon}</span>
            <h3>Edit Routine</h3>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="routine-edit-content">
          {/* Icon picker */}
          <div className="routine-custom-icon-picker">
            <label>Icon</label>
            <div className="icon-grid">
              {iconOptions.map((ic) => (
                <button
                  key={ic}
                  className={`icon-option ${icon === ic ? "selected" : ""}`}
                  onClick={() => setIcon(ic)}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional description..."
            />
          </div>

          <div className="routine-custom-schedule">
            <div className="form-field">
              <label>Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as typeof frequency)}
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="form-field">
              <label>Time of Day</label>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
              >
                <option value="morning">🌅 Morning</option>
                <option value="afternoon">☀️ Afternoon</option>
                <option value="evening">🌆 Evening</option>
                <option value="night">🌙 Night</option>
                <option value="anytime">⏰ Anytime</option>
              </select>
            </div>
            <div className="form-field">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Loop badges */}
          {loops.length > 0 && (
            <div className="routine-edit-loops">
              {loops.map((loopId) => {
                const loop = LOOP_DEFINITIONS[loopId];
                const color = LOOP_COLORS[loopId];
                return (
                  <span
                    key={loopId}
                    className="routine-loop-badge"
                    style={{ backgroundColor: color.bg, color: color.text }}
                  >
                    {loop.icon} {loopId}
                  </span>
                );
              })}
              <span className="routine-duration-badge">{duration}m total</span>
            </div>
          )}

          {/* Editable Steps list */}
          <div className="routine-edit-steps">
            <label>Steps ({steps.length})</label>

            {steps.length > 0 && (
              <div className="routine-edit-steps-list">
                {steps.map((step, index) => {
                  const color = LOOP_COLORS[step.loop];
                  const loop = LOOP_DEFINITIONS[step.loop];
                  return (
                    <div
                      key={step.id}
                      className="routine-edit-step"
                      style={{ borderLeftColor: color.border }}
                    >
                      <div className="routine-edit-step-reorder">
                        <button
                          className="reorder-btn"
                          onClick={() => handleMoveStep(step.id, "up")}
                          disabled={index === 0}
                        >
                          ↑
                        </button>
                        <button
                          className="reorder-btn"
                          onClick={() => handleMoveStep(step.id, "down")}
                          disabled={index === steps.length - 1}
                        >
                          ↓
                        </button>
                      </div>
                      <span className="routine-edit-step-num">{index + 1}</span>
                      <div className="routine-edit-step-content">
                        <span className="routine-edit-step-title">{step.title}</span>
                        <span className="routine-edit-step-meta" style={{ color: color.text }}>
                          {loop.icon} {step.loop}
                          {step.estimateMinutes && ` • ${step.estimateMinutes}m`}
                        </span>
                      </div>
                      <button
                        className={`routine-step-optional-btn ${step.optional ? "is-optional" : ""}`}
                        onClick={() => handleToggleOptional(step.id)}
                      >
                        {step.optional ? "Optional" : "Required"}
                      </button>
                      <button
                        className="routine-step-remove-btn"
                        onClick={() => handleRemoveStep(step.id)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Step Form */}
            <div className="routine-add-step">
              <input
                type="text"
                value={newStepTitle}
                onChange={(e) => setNewStepTitle(e.target.value)}
                placeholder="Add a step..."
                onKeyDown={(e) => e.key === "Enter" && handleAddStep()}
              />
              <select
                value={newStepLoop}
                onChange={(e) => setNewStepLoop(e.target.value as LoopId)}
              >
                {ALL_LOOPS.map((loop) => (
                  <option key={loop} value={loop}>
                    {LOOP_DEFINITIONS[loop].icon} {loop}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={newStepMinutes}
                onChange={(e) => setNewStepMinutes(parseInt(e.target.value) || 5)}
                min={1}
                max={120}
                className="routine-step-minutes"
              />
              <span className="routine-step-minutes-label">min</span>
              <button
                className="routine-add-step-btn"
                onClick={handleAddStep}
                disabled={!newStepTitle.trim()}
              >
                Add
              </button>
            </div>
          </div>

          <div className="routine-edit-stats">
            <div className="routine-edit-stat routine-edit-stat--streak">
              <span className="routine-edit-stat-value">
                <span className="streak-icon">🔥</span>
                {routine.streak.currentStreak}
              </span>
              <span className="routine-edit-stat-label">Current Streak</span>
            </div>
            <div className="routine-edit-stat routine-edit-stat--best">
              <span className="routine-edit-stat-value">
                <span className="streak-icon">🏆</span>
                {routine.streak.longestStreak}
              </span>
              <span className="routine-edit-stat-label">Best Streak</span>
            </div>
            <div className="routine-edit-stat">
              <span className="routine-edit-stat-value">{routine.streak.totalCompletions}</span>
              <span className="routine-edit-stat-label">Completions</span>
            </div>
            <div className="routine-edit-stat routine-edit-stat--rate">
              <span className="routine-edit-stat-value">{routine.streak.completionRate}%</span>
              <span className="routine-edit-stat-label">Success Rate</span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="modal-btn modal-btn--danger"
            onClick={() => {
              if (confirm("Delete this routine? This cannot be undone.")) {
                onDelete();
              }
            }}
          >
            Delete
          </button>
          <div className="modal-actions-right">
            <button className="modal-btn modal-btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="modal-btn modal-btn--primary"
              onClick={handleSave}
              disabled={!title.trim() || steps.length === 0}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
