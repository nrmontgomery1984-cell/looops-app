// Systems Screen - View and manage all behavior change systems
// Shows systems with embedded components, goals integration, and system health
// Updated: Removed standalone Habits tab - components are now embedded in systems

import React, { useState, useMemo } from "react";
import {
  System,
  SystemComponent,
  ComponentCompletion,
  LoopId,
  LOOP_COLORS,
  LOOP_DEFINITIONS,
  ALL_LOOPS,
  SYSTEM_TEMPLATES,
  calculateSystemHealthFromComponents,
  getAllComponentsDueToday,
  Goal,
  // Legacy imports for backward compatibility during migration
  Habit,
  HabitCompletion,
  calculateSystemHealth,
} from "../../types";
import { SmartScheduleState, DayType } from "../../types/dayTypes";
import { getDayTypes } from "../../engines/smartSchedulerEngine";
import { SystemBuilder } from "./SystemBuilder";
import { SystemDetail } from "./SystemDetail";
import { ComponentTracker } from "./ComponentTracker";
import { suggestSystemTemplatesForGoal } from "../../engines/systemEngine";

// View structure: Goals (primary - shows goals with linked systems), Overview (today's tracking), All Systems
type SystemsView = "goals" | "overview" | "systems";

interface SystemsScreenProps {
  systems: System[];
  componentCompletions: ComponentCompletion[];
  smartSchedule?: SmartScheduleState;
  goals?: Goal[];

  // System actions
  onAddSystem: (system: System) => void;
  onUpdateSystem: (system: System) => void;
  onDeleteSystem: (systemId: string) => void;

  // Component actions (components are embedded in systems)
  onCompleteComponent: (systemId: string, componentId: string, date: string, notes?: string) => void;
  onUncompleteComponent: (systemId: string, componentId: string, date: string) => void;
  onUpdateComponent?: (systemId: string, component: SystemComponent) => void;
  onDeleteComponent?: (systemId: string, componentId: string) => void;

  // Goal actions
  onSelectGoal?: (goal: Goal) => void;
  onCreateSystemFromGoal?: (goal: Goal) => void;
  onOpenGoalsWizard?: () => void;
  onDeleteGoal?: (goalId: string) => void;

  // @deprecated - Legacy habit props for backward compatibility during migration
  habits?: Habit[];
  completions?: HabitCompletion[];
  onAddHabit?: (habit: Habit) => void;
  onUpdateHabit?: (habit: Habit) => void;
  onDeleteHabit?: (habitId: string) => void;
  onCompleteHabit?: (habitId: string, date: string, notes?: string) => void;
  onUncompleteHabit?: (habitId: string, date: string) => void;
}

export function SystemsScreen({
  systems,
  componentCompletions,
  smartSchedule,
  goals = [],
  onAddSystem,
  onUpdateSystem,
  onDeleteSystem,
  onCompleteComponent,
  onUncompleteComponent,
  onUpdateComponent,
  onDeleteComponent,
  onSelectGoal,
  onCreateSystemFromGoal,
  onOpenGoalsWizard,
  onDeleteGoal,
  // Legacy props (deprecated)
  habits = [],
  completions = [],
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit,
  onCompleteHabit,
  onUncompleteHabit,
}: SystemsScreenProps) {
  const [view, setView] = useState<SystemsView>("goals");
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedLoop, setSelectedLoop] = useState<LoopId | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
  const [linkedGoalForBuilder, setLinkedGoalForBuilder] = useState<Goal | null>(null);
  const [deletingSystemId, setDeletingSystemId] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  // Get today's day types
  const todayDayTypes = useMemo(() => {
    if (!smartSchedule?.enabled) return ["regular"] as DayType[];
    return getDayTypes(new Date(), smartSchedule);
  }, [smartSchedule]);

  // Get all components due today from active systems
  const todayComponents = useMemo(() => {
    const activeSystems = (systems || []).filter(s => s.status === "active");
    return getAllComponentsDueToday(activeSystems, todayDayTypes);
  }, [systems, todayDayTypes]);

  const completedComponentsToday = todayComponents.filter(({ component }) =>
    (componentCompletions || []).some(c => c.componentId === component.id && c.date === today)
  ).length;

  // Calculate overall stats
  const activeSystemsCount = (systems || []).filter(s => s.status === "active").length;
  const totalStreaks = (systems || []).reduce((sum, s) =>
    sum + (s.components || []).reduce((cSum, c) => cSum + c.streak, 0), 0
  );

  // Deduplicate goals by ID (in case of data issues) - MUST be before any early returns
  const uniqueGoals = useMemo(() => {
    const seen = new Set<string>();
    return (goals || []).filter(g => {
      if (seen.has(g.id)) return false;
      seen.add(g.id);
      return true;
    });
  }, [goals]);

  // System now includes embedded components, no separate habits needed
  const handleCreateSystem = (system: System, _newHabits?: Habit[]) => {
    onAddSystem(system);
    // Legacy: if newHabits are passed and onAddHabit exists, add them
    if (_newHabits && onAddHabit) {
      _newHabits.forEach(h => onAddHabit(h));
    }
    setShowBuilder(false);
  };

  const handleOpenBuilder = (goal?: Goal) => {
    if (goal) {
      setLinkedGoalForBuilder(goal);
      setSelectedLoop(goal.loop);
    }
    setShowBuilder(true);
  };

  const handleCloseBuilder = () => {
    setShowBuilder(false);
    setLinkedGoalForBuilder(null);
  };

  // System builder requires a goal - only show if we have one selected
  if (showBuilder && linkedGoalForBuilder) {
    return (
      <SystemBuilder
        onComplete={(system, newHabits) => {
          handleCreateSystem(system, newHabits);
          handleCloseBuilder();
        }}
        onCancel={handleCloseBuilder}
        linkedGoal={linkedGoalForBuilder}
      />
    );
  }

  // System detail view when a system is selected
  if (selectedSystem) {
    return (
      <SystemDetail
        system={selectedSystem}
        completions={componentCompletions}
        smartSchedule={smartSchedule}
        onUpdate={(updated) => {
          onUpdateSystem(updated);
          setSelectedSystem(updated);
        }}
        onDelete={(systemId) => {
          onDeleteSystem(systemId);
          setSelectedSystem(null);
        }}
        onCompleteComponent={onCompleteComponent}
        onUncompleteComponent={onUncompleteComponent}
        onClose={() => setSelectedSystem(null)}
      />
    );
  }

  // Get systems linked to a specific goal
  const getSystemsForGoal = (goalId: string) => {
    return (systems || []).filter(s => s.linkedGoalId === goalId);
  };

  // Get goals without systems (need attention)
  const goalsWithoutSystems = uniqueGoals.filter(g =>
    g.status === "active" && !(systems || []).some(s => s.linkedGoalId === g.id)
  );

  return (
    <div className="systems-screen">
      <div className="systems-header">
        <div className="systems-header-content">
          <h1>Goals & Systems</h1>
          <p className="systems-subtitle">
            Set goals, build systems to achieve them
          </p>
        </div>
        <div className="systems-header-actions">
          {onOpenGoalsWizard && (
            <button
              className="systems-add-btn"
              onClick={onOpenGoalsWizard}
            >
              + New Goal
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="systems-stats">
        <div className="systems-stat">
          <span className="systems-stat-value">{completedComponentsToday}/{todayComponents.length}</span>
          <span className="systems-stat-label">Components Today</span>
          <div className="systems-stat-bar">
            <div
              className="systems-stat-fill"
              style={{
                width: todayComponents.length > 0
                  ? `${(completedComponentsToday / todayComponents.length) * 100}%`
                  : "0%"
              }}
            />
          </div>
        </div>
        <div className="systems-stat">
          <span className="systems-stat-value">{activeSystemsCount}</span>
          <span className="systems-stat-label">Active Systems</span>
        </div>
        <div className="systems-stat">
          <span className="systems-stat-value">🔥 {totalStreaks}</span>
          <span className="systems-stat-label">Total Streaks</span>
        </div>
      </div>

      {/* View Tabs - Goals (primary), Overview, All Systems */}
      <div className="systems-tabs">
        <button
          className={`systems-tab ${view === "goals" ? "active" : ""}`}
          onClick={() => setView("goals")}
        >
          Goals
          {goalsWithoutSystems.length > 0 && (
            <span className="systems-tab-badge">{goalsWithoutSystems.length}</span>
          )}
        </button>
        <button
          className={`systems-tab ${view === "overview" ? "active" : ""}`}
          onClick={() => setView("overview")}
        >
          Today
        </button>
        <button
          className={`systems-tab ${view === "systems" ? "active" : ""}`}
          onClick={() => setView("systems")}
        >
          All Systems
        </button>
      </div>

      {/* Content */}
      <div className="systems-content">
        {view === "goals" && (
          <div className="systems-goals-view">
            {/* Goals needing systems - call to action */}
            {goalsWithoutSystems.length > 0 && (
              <section className="systems-section systems-section--attention">
                <h2>Goals Need Systems</h2>
                <p className="systems-section-desc">
                  These goals don't have supporting systems yet. Create systems to make progress inevitable.
                </p>
                <div className="goals-needing-systems">
                  {goalsWithoutSystems.map(goal => {
                    const color = LOOP_COLORS[goal.loop];
                    const def = LOOP_DEFINITIONS[goal.loop];
                    return (
                      <div
                        key={goal.id}
                        className="goal-needs-system-card"
                        style={{ borderColor: color.border }}
                      >
                        <div className="goal-needs-system-header">
                          <span
                            className="goal-loop-badge"
                            style={{ backgroundColor: color.border }}
                          >
                            {def.icon} {goal.loop}
                          </span>
                          <span className="goal-progress">{goal.progress}%</span>
                        </div>
                        <h3 className="goal-title">{goal.title}</h3>
                        {goal.description && (
                          <p className="goal-description">{goal.description}</p>
                        )}
                        <button
                          className="goal-create-system-btn"
                          onClick={() => handleOpenBuilder(goal)}
                          style={{ backgroundColor: color.border }}
                        >
                          + Create System
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* All goals with their systems */}
            <section className="systems-section">
              <div className="systems-section-header">
                <h2>Your Goals</h2>
                {onOpenGoalsWizard && (
                  <button
                    className="systems-section-action"
                    onClick={onOpenGoalsWizard}
                  >
                    + Add Goals
                  </button>
                )}
              </div>

              {uniqueGoals.length === 0 ? (
                <div className="systems-empty">
                  <span className="systems-empty-icon">🎯</span>
                  <h3>No goals yet</h3>
                  <p>Set your goals first, then create systems to achieve them</p>
                  {onOpenGoalsWizard && (
                    <button
                      className="systems-empty-btn"
                      onClick={onOpenGoalsWizard}
                    >
                      + Create Goals
                    </button>
                  )}
                </div>
              ) : (
                <div className="goals-with-systems-list">
                  {uniqueGoals.filter(g => g.status === "active").map(goal => {
                    const color = LOOP_COLORS[goal.loop];
                    const def = LOOP_DEFINITIONS[goal.loop];
                    const linkedSystems = getSystemsForGoal(goal.id);
                    const isExpanded = expandedGoalId === goal.id;

                    return (
                      <div
                        key={goal.id}
                        className={`goal-with-systems ${isExpanded ? "expanded" : ""}`}
                        style={{ "--goal-color": color.border } as React.CSSProperties}
                      >
                        <div
                          className="goal-with-systems-header"
                          onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                        >
                          <div className="goal-with-systems-info">
                            <span
                              className="goal-loop-badge"
                              style={{ backgroundColor: color.border }}
                            >
                              {def.icon}
                            </span>
                            <div className="goal-with-systems-text">
                              <h3>{goal.title}</h3>
                              <div className="goal-meta">
                                <span className="goal-timeframe">{goal.timeframe}</span>
                                <span className="goal-systems-count">
                                  {linkedSystems.length} system{linkedSystems.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="goal-with-systems-right">
                            <div className="goal-progress-ring">
                              <span>{goal.progress}%</span>
                            </div>
                            <span className={`goal-expand-icon ${isExpanded ? "open" : ""}`}>
                              {isExpanded ? "▼" : "▶"}
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="goal-systems-expanded">
                            {goal.description && (
                              <p className="goal-full-description">{goal.description}</p>
                            )}

                            {linkedSystems.length === 0 ? (
                              <div className="goal-no-systems">
                                <p>No systems supporting this goal yet</p>
                                <button
                                  className="goal-add-system-btn"
                                  onClick={() => handleOpenBuilder(goal)}
                                >
                                  + Create System
                                </button>
                              </div>
                            ) : (
                              <div className="goal-systems-list">
                                <h4>Supporting Systems</h4>
                                {linkedSystems.map(system => {
                                  const components = system.components || [];
                                  const health = components.length > 0
                                    ? calculateSystemHealthFromComponents(system, (componentCompletions || []).filter(c => c.systemId === system.id))
                                    : 0;

                                  return (
                                    <div
                                      key={system.id}
                                      className="goal-system-item"
                                      onClick={() => setSelectedSystem(system)}
                                    >
                                      <div className="goal-system-info">
                                        <span className="goal-system-title">{system.title}</span>
                                        <span className="goal-system-components">
                                          {components.length} components
                                        </span>
                                      </div>
                                      <div className="goal-system-health">
                                        <div className="goal-system-health-bar">
                                          <div
                                            className="goal-system-health-fill"
                                            style={{ width: `${health}%` }}
                                          />
                                        </div>
                                        <span>{health}%</span>
                                      </div>
                                    </div>
                                  );
                                })}
                                <button
                                  className="goal-add-system-btn goal-add-system-btn--small"
                                  onClick={() => handleOpenBuilder(goal)}
                                >
                                  + Add Another System
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {view === "overview" && (
          <div className="systems-overview">
            {/* Today's Components Section */}
            <section className="systems-section">
              <h2>Today's Components</h2>
              <ComponentTracker
                systems={systems}
                completions={componentCompletions}
                smartSchedule={smartSchedule}
                onComplete={onCompleteComponent}
                onUncomplete={onUncompleteComponent}
                onUpdateComponent={onUpdateComponent}
                onDeleteComponent={onDeleteComponent}
                groupBySystem={true}
              />
            </section>

            {/* Active Systems Section */}
            <section className="systems-section">
              <h2>Active Systems</h2>
              {(systems || []).filter(s => s.status === "active").length === 0 ? (
                <div className="systems-empty">
                  <span className="systems-empty-icon">🎯</span>
                  <h3>No active systems</h3>
                  <p>Create your first behavior system to start building lasting habits</p>
                  <button
                    className="systems-empty-btn"
                    onClick={() => setShowBuilder(true)}
                  >
                    + Create System
                  </button>
                </div>
              ) : (
                <div className="systems-grid">
                  {(systems || []).filter(s => s.status === "active").map(system => {
                    const systemComponents = system.components || [];
                    // Use new health calculation if components exist, fallback to legacy
                    const health = systemComponents.length > 0
                      ? calculateSystemHealthFromComponents(system, (componentCompletions || []).filter(c => c.systemId === system.id))
                      : calculateSystemHealth(system, (habits || []).filter(h => h.systemId === system.id), completions);

                    return (
                      <div
                        key={system.id}
                        className="system-card"
                        onClick={() => setSelectedSystem(system)}
                        style={{
                          "--loop-color": LOOP_COLORS[system.loop]
                        } as React.CSSProperties}
                      >
                        <div className="system-card-header">
                          <span className="system-card-loop">
                            {LOOP_DEFINITIONS[system.loop].icon} {system.loop}
                          </span>
                          <span className="system-card-health">{health}%</span>
                        </div>
                        <h3 className="system-card-title">{system.title}</h3>
                        <p className="system-card-goal">{system.goalStatement}</p>
                        <div className="system-card-stats">
                          <span>{systemComponents.length} components</span>
                          <span>Started {new Date(system.startedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="system-card-health-bar">
                          <div
                            className="system-card-health-fill"
                            style={{ width: `${health}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Quick Start Templates */}
            {systems.length < 3 && (
              <section className="systems-section">
                <h2>Quick Start Templates</h2>
                <div className="templates-scroll">
                  {SYSTEM_TEMPLATES.slice(0, 4).map(template => (
                    <button
                      key={template.id}
                      className="template-quick-card"
                      onClick={() => {
                        setSelectedLoop(template.loop);
                        setShowBuilder(true);
                      }}
                      style={{
                        "--loop-color": LOOP_COLORS[template.loop]
                      } as React.CSSProperties}
                    >
                      <span className="template-quick-loop">
                        {LOOP_DEFINITIONS[template.loop].icon}
                      </span>
                      <span className="template-quick-title">{template.title}</span>
                      <span className="template-quick-duration">{template.estimatedDuration}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {view === "systems" && (
          <div className="systems-all-view">
            <div className="loop-filter-bar">
              <button
                className={`loop-filter-btn ${selectedLoop === null ? "active" : ""}`}
                onClick={() => setSelectedLoop(null)}
              >
                All Loops
              </button>
              {ALL_LOOPS.map(loop => (
                <button
                  key={loop}
                  className={`loop-filter-btn ${selectedLoop === loop ? "active" : ""}`}
                  onClick={() => setSelectedLoop(loop)}
                  style={{ "--loop-color": LOOP_COLORS[loop] } as React.CSSProperties}
                >
                  {LOOP_DEFINITIONS[loop].icon} {loop}
                </button>
              ))}
            </div>

            <div className="systems-list">
              {(systems || [])
                .filter(s => !selectedLoop || s.loop === selectedLoop)
                .map(system => {
                  const systemComponents = system.components || [];
                  // Use new health calculation if components exist, fallback to legacy
                  const health = systemComponents.length > 0
                    ? calculateSystemHealthFromComponents(system, (componentCompletions || []).filter(c => c.systemId === system.id))
                    : calculateSystemHealth(system, (habits || []).filter(h => h.systemId === system.id), completions);

                  return (
                    <div
                      key={system.id}
                      className="system-list-item"
                      onClick={() => setSelectedSystem(system)}
                      style={{
                        "--loop-color": LOOP_COLORS[system.loop],
                        cursor: "pointer",
                      } as React.CSSProperties}
                    >
                      <div className="system-list-main">
                        <div className="system-list-header">
                          <span className="system-list-loop">
                            {LOOP_DEFINITIONS[system.loop].icon} {system.loop}
                          </span>
                          <span className={`system-list-status status--${system.status}`}>
                            {system.status}
                          </span>
                        </div>
                        <h3 className="system-list-title">{system.title}</h3>
                        <p className="system-list-identity">{system.identity.statement}</p>
                        {/* Show linked goal if any */}
                        {system.linkedGoalId && (goals || []).find(g => g.id === system.linkedGoalId) && (
                          <p className="system-list-goal">
                            Goal: {(goals || []).find(g => g.id === system.linkedGoalId)?.title}
                          </p>
                        )}
                      </div>
                      <div className="system-list-stats">
                        <div className="system-list-health">
                          <span className="health-value">{health}%</span>
                          <span className="health-label">Health</span>
                        </div>
                        <div className="system-list-components">
                          <span className="components-value">{systemComponents.length}</span>
                          <span className="components-label">Components</span>
                        </div>
                      </div>
                      <div className="system-list-actions">
                        {deletingSystemId === system.id ? (
                          <div className="system-delete-confirm">
                            <span>Delete?</span>
                            <button
                              className="btn-confirm-yes"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSystem(system.id);
                                setDeletingSystemId(null);
                              }}
                            >
                              Yes
                            </button>
                            <button
                              className="btn-confirm-no"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingSystemId(null);
                              }}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            className="system-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingSystemId(system.id);
                            }}
                            title="Delete system"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

              {(systems || []).filter(s => !selectedLoop || s.loop === selectedLoop).length === 0 && (
                <div className="systems-empty">
                  <p>No systems {selectedLoop ? `for ${selectedLoop}` : ""}</p>
                  <button
                    className="systems-empty-btn"
                    onClick={() => setShowBuilder(true)}
                  >
                    + Create System
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SystemsScreen;
