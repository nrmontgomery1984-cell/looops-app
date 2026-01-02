// System Detail - View and edit a system with its components
// Shows components with completion toggles, metrics, and full editing capability

import React, { useState, useMemo } from "react";
import {
  System,
  SystemComponent,
  ComponentCompletion,
  LoopId,
  LOOP_COLORS,
  LOOP_DEFINITIONS,
  HabitCue,
  HabitFrequency,
  HabitTimeOfDay,
  calculateSystemHealthFromComponents,
  calculateComponentStreak,
  getEffectiveComponentTimeOfDay,
  getEffectiveComponentCue,
} from "../../types";
import { SmartScheduleState, DayType } from "../../types/dayTypes";
import { getDayTypes } from "../../engines/smartSchedulerEngine";
import { useRoutines } from "../../context";

interface SystemDetailProps {
  system: System;
  completions: ComponentCompletion[];
  smartSchedule?: SmartScheduleState;
  onUpdate: (system: System) => void;
  onDelete: (systemId: string) => void;
  onCompleteComponent: (systemId: string, componentId: string, date: string, notes?: string) => void;
  onUncompleteComponent: (systemId: string, componentId: string, date: string) => void;
  onClose: () => void;
}

type DetailView = "overview" | "components" | "settings";

export function SystemDetail({
  system,
  completions,
  smartSchedule,
  onUpdate,
  onDelete,
  onCompleteComponent,
  onUncompleteComponent,
  onClose,
}: SystemDetailProps) {
  const [view, setView] = useState<DetailView>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: system.title,
    goalStatement: system.goalStatement,
    identityStatement: system.identity.statement,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingComponent, setEditingComponent] = useState<SystemComponent | null>(null);
  const [showAddComponent, setShowAddComponent] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const color = LOOP_COLORS[system.loop];
  const def = LOOP_DEFINITIONS[system.loop];

  // Get today's day types
  const todayDayTypes = useMemo(() => {
    if (!smartSchedule?.enabled) return ["regular"] as DayType[];
    return getDayTypes(new Date(), smartSchedule);
  }, [smartSchedule]);

  const components = system.components || [];
  const systemCompletions = completions.filter(c => c.systemId === system.id);
  const health = components.length > 0
    ? calculateSystemHealthFromComponents(system, systemCompletions)
    : 0;

  // Check if component is completed today
  const isCompletedToday = (componentId: string) => {
    return systemCompletions.some(c => c.componentId === componentId && c.date === today);
  };

  // Get last 7 days for mini calendar
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });
  }, []);

  // Handle saving edits
  const handleSaveEdits = () => {
    const updatedSystem: System = {
      ...system,
      title: editForm.title,
      goalStatement: editForm.goalStatement,
      identity: {
        ...system.identity,
        statement: editForm.identityStatement,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updatedSystem);
    setIsEditing(false);
  };

  // Handle toggle component completion
  const handleToggleComponent = (componentId: string) => {
    if (isCompletedToday(componentId)) {
      onUncompleteComponent(system.id, componentId, today);
    } else {
      onCompleteComponent(system.id, componentId, today);
    }
  };

  // Handle component status change
  const handleToggleComponentStatus = (component: SystemComponent) => {
    const newStatus: "active" | "paused" = component.status === "active" ? "paused" : "active";
    const updatedComponent: SystemComponent = { ...component, status: newStatus, updatedAt: new Date().toISOString() };
    const updatedComponents = components.map(c => c.id === component.id ? updatedComponent : c);
    onUpdate({ ...system, components: updatedComponents, updatedAt: new Date().toISOString() });
  };

  // Handle delete component
  const handleDeleteComponent = (componentId: string) => {
    const updatedComponents = components.filter(c => c.id !== componentId);
    onUpdate({ ...system, components: updatedComponents, updatedAt: new Date().toISOString() });
  };

  // Handle save component edit
  const handleSaveComponent = (component: SystemComponent) => {
    const updatedComponents = components.map(c => c.id === component.id ? component : c);
    onUpdate({ ...system, components: updatedComponents, updatedAt: new Date().toISOString() });
    setEditingComponent(null);
  };

  // Handle add new component
  const handleAddComponent = (component: Omit<SystemComponent, "id" | "streak" | "longestStreak" | "totalCompletions" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newComponent: SystemComponent = {
      ...component,
      id: `comp_${Date.now()}`,
      streak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      createdAt: now,
      updatedAt: now,
    };
    const updatedComponents = [...components, newComponent];
    onUpdate({ ...system, components: updatedComponents, updatedAt: now });
    setShowAddComponent(false);
  };

  // Handle system status change
  const handleToggleSystemStatus = () => {
    const newStatus = system.status === "active" ? "paused" : "active";
    onUpdate({ ...system, status: newStatus, updatedAt: new Date().toISOString() });
  };

  // Handle delete system
  const handleDeleteSystem = () => {
    onDelete(system.id);
    onClose();
  };

  // Render component editor modal
  const renderComponentEditor = () => {
    if (!editingComponent && !showAddComponent) return null;

    const isNew = showAddComponent;
    const comp = editingComponent || {
      title: "",
      description: "",
      type: "daily" as const,
      cue: { type: "time" as const, value: "" },
      response: "",
      reward: "",
      frequency: "daily" as HabitFrequency,
      timeOfDay: "morning" as HabitTimeOfDay,
      status: "active" as const,
    };

    return (
      <div className="system-detail-modal-overlay" onClick={() => { setEditingComponent(null); setShowAddComponent(false); }}>
        <div className="system-detail-modal" onClick={e => e.stopPropagation()}>
          <h3>{isNew ? "Add Component" : "Edit Component"}</h3>
          <ComponentEditor
            component={comp}
            onSave={(updated) => {
              if (isNew) {
                handleAddComponent(updated);
              } else {
                handleSaveComponent({ ...editingComponent!, ...updated });
              }
            }}
            onCancel={() => { setEditingComponent(null); setShowAddComponent(false); }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="system-detail" style={{ "--loop-color": color.border } as React.CSSProperties}>
      {/* Header */}
      <div className="system-detail-header">
        <button className="system-detail-back" onClick={onClose}>
          ← Back
        </button>
        <div className="system-detail-header-info">
          <span className="system-detail-loop" style={{ backgroundColor: color.border }}>
            {def.icon} {system.loop}
          </span>
          <span className={`system-detail-status status--${system.status}`}>
            {system.status}
          </span>
        </div>
      </div>

      {/* Title & Goal */}
      <div className="system-detail-title-section">
        {isEditing ? (
          <div className="system-detail-edit-form">
            <input
              type="text"
              value={editForm.title}
              onChange={e => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="System title"
              className="system-detail-input"
            />
            <input
              type="text"
              value={editForm.goalStatement}
              onChange={e => setEditForm({ ...editForm, goalStatement: e.target.value })}
              placeholder="Goal statement"
              className="system-detail-input"
            />
            <textarea
              value={editForm.identityStatement}
              onChange={e => setEditForm({ ...editForm, identityStatement: e.target.value })}
              placeholder="Identity statement"
              className="system-detail-textarea"
              rows={2}
            />
            <div className="system-detail-edit-actions">
              <button className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveEdits}>Save</button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="system-detail-title">{system.title}</h1>
            <p className="system-detail-goal">{system.goalStatement}</p>
            <p className="system-detail-identity">"{system.identity.statement}"</p>
            <button className="system-detail-edit-btn" onClick={() => setIsEditing(true)}>
              Edit
            </button>
          </>
        )}
      </div>

      {/* Health Bar */}
      <div className="system-detail-health">
        <div className="system-detail-health-bar">
          <div
            className="system-detail-health-fill"
            style={{ width: `${health}%`, backgroundColor: color.border }}
          />
        </div>
        <span className="system-detail-health-text">{health}% Health</span>
      </div>

      {/* View Tabs */}
      <div className="system-detail-tabs">
        <button
          className={`system-detail-tab ${view === "overview" ? "active" : ""}`}
          onClick={() => setView("overview")}
        >
          Overview
        </button>
        <button
          className={`system-detail-tab ${view === "components" ? "active" : ""}`}
          onClick={() => setView("components")}
        >
          Components ({components.length})
        </button>
        <button
          className={`system-detail-tab ${view === "settings" ? "active" : ""}`}
          onClick={() => setView("settings")}
        >
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="system-detail-content">
        {view === "overview" && (
          <div className="system-detail-overview">
            {/* Today's Components */}
            <section className="system-detail-section">
              <h2>Today's Components</h2>
              {components.filter(c => c.status === "active").length === 0 ? (
                <p className="system-detail-empty">No active components</p>
              ) : (
                <div className="system-detail-component-list">
                  {components.filter(c => c.status === "active").map(component => {
                    const completed = isCompletedToday(component.id);
                    const streak = calculateComponentStreak(component.id, systemCompletions, component.frequency);
                    const primaryDayType = todayDayTypes[0] || "regular";
                    const cue = getEffectiveComponentCue(component, primaryDayType);

                    return (
                      <div
                        key={component.id}
                        className={`system-detail-component ${completed ? "completed" : ""}`}
                      >
                        <button
                          className={`component-check ${completed ? "checked" : ""}`}
                          onClick={() => handleToggleComponent(component.id)}
                          style={{ borderColor: color.border, backgroundColor: completed ? color.border : "transparent" }}
                        >
                          {completed && "✓"}
                        </button>
                        <div className="component-info">
                          <span className="component-title">{component.title}</span>
                          <span className="component-cue">{cue.value}</span>
                        </div>
                        <div className="component-streak">
                          {streak > 0 && <span className="streak-badge">🔥 {streak}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 7-Day History */}
            <section className="system-detail-section">
              <h2>Last 7 Days</h2>
              <div className="system-detail-calendar">
                {last7Days.map(date => {
                  const dayCompletions = systemCompletions.filter(c => c.date === date);
                  const activeComponents = components.filter(c => c.status === "active");
                  const completionRate = activeComponents.length > 0
                    ? Math.round((dayCompletions.length / activeComponents.length) * 100)
                    : 0;
                  const dayLabel = new Date(date).toLocaleDateString("en-US", { weekday: "short" });
                  const isToday = date === today;

                  return (
                    <div
                      key={date}
                      className={`calendar-day ${isToday ? "today" : ""}`}
                    >
                      <span className="calendar-day-label">{dayLabel}</span>
                      <div
                        className="calendar-day-indicator"
                        style={{
                          backgroundColor: completionRate > 0 ? color.border : "var(--bg-tertiary)",
                          opacity: completionRate > 0 ? completionRate / 100 : 0.3,
                        }}
                      >
                        {completionRate > 0 && `${completionRate}%`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Metrics */}
            {system.metrics && system.metrics.length > 0 && (
              <section className="system-detail-section">
                <h2>Metrics</h2>
                <div className="system-detail-metrics">
                  {system.metrics.map(metric => (
                    <div key={metric.id} className="metric-item">
                      <span className="metric-name">{metric.name}</span>
                      <span className="metric-value">
                        {metric.currentValue ?? "—"} {metric.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Environment Tweaks */}
            {system.environmentTweaks && system.environmentTweaks.length > 0 && (
              <section className="system-detail-section">
                <h2>Environment Design</h2>
                <div className="system-detail-tweaks">
                  {system.environmentTweaks.map(tweak => (
                    <div
                      key={tweak.id}
                      className={`tweak-item ${tweak.completed ? "completed" : ""}`}
                    >
                      <span className={`tweak-type tweak-type--${tweak.type}`}>
                        {tweak.type === "add" ? "+" : tweak.type === "remove" ? "−" : "~"}
                      </span>
                      <span className="tweak-desc">{tweak.description}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {view === "components" && (
          <div className="system-detail-components">
            <div className="system-detail-section-header">
              <h2>All Components</h2>
              <button
                className="btn-add"
                onClick={() => setShowAddComponent(true)}
              >
                + Add Component
              </button>
            </div>

            {components.length === 0 ? (
              <div className="system-detail-empty">
                <p>No components yet</p>
                <button
                  className="btn-primary"
                  onClick={() => setShowAddComponent(true)}
                >
                  Add Your First Component
                </button>
              </div>
            ) : (
              <div className="system-detail-component-full-list">
                {components.map(component => {
                  const completed = isCompletedToday(component.id);
                  const streak = calculateComponentStreak(component.id, systemCompletions, component.frequency);
                  const primaryDayType = todayDayTypes[0] || "regular";
                  const cue = getEffectiveComponentCue(component, primaryDayType);

                  return (
                    <div
                      key={component.id}
                      className={`component-full-item ${component.status !== "active" ? "inactive" : ""}`}
                    >
                      <div className="component-full-main">
                        <button
                          className={`component-check ${completed ? "checked" : ""}`}
                          onClick={() => handleToggleComponent(component.id)}
                          style={{
                            borderColor: color.border,
                            backgroundColor: completed ? color.border : "transparent",
                            opacity: component.status !== "active" ? 0.5 : 1,
                          }}
                          disabled={component.status !== "active"}
                        >
                          {completed && "✓"}
                        </button>
                        <div className="component-full-info">
                          <span className="component-full-title">{component.title}</span>
                          <span className="component-full-meta">
                            {component.frequency} • {cue.type}: {cue.value}
                          </span>
                          {component.description && (
                            <span className="component-full-desc">{component.description}</span>
                          )}
                        </div>
                      </div>
                      <div className="component-full-actions">
                        {streak > 0 && <span className="streak-badge">🔥 {streak}</span>}
                        <span className={`status-badge status--${component.status}`}>
                          {component.status}
                        </span>
                        <button
                          className="btn-icon"
                          onClick={() => handleToggleComponentStatus(component)}
                          title={component.status === "active" ? "Pause" : "Resume"}
                        >
                          {component.status === "active" ? "⏸" : "▶"}
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => setEditingComponent(component)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleDeleteComponent(component.id)}
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === "settings" && (
          <div className="system-detail-settings">
            <section className="system-detail-section">
              <h2>System Status</h2>
              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-label">Status</span>
                  <span className="setting-value">{system.status}</span>
                </div>
                <button
                  className={`btn-toggle ${system.status === "active" ? "active" : ""}`}
                  onClick={handleToggleSystemStatus}
                >
                  {system.status === "active" ? "Pause System" : "Resume System"}
                </button>
              </div>
            </section>

            <section className="system-detail-section">
              <h2>System Info</h2>
              <div className="setting-row">
                <span className="setting-label">Created</span>
                <span className="setting-value">{new Date(system.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="setting-row">
                <span className="setting-label">Started</span>
                <span className="setting-value">{new Date(system.startedAt).toLocaleDateString()}</span>
              </div>
              {system.targetDate && (
                <div className="setting-row">
                  <span className="setting-label">Target Date</span>
                  <span className="setting-value">{new Date(system.targetDate).toLocaleDateString()}</span>
                </div>
              )}
            </section>

            {/* Obstacle Playbook */}
            {system.obstaclePlaybook && system.obstaclePlaybook.length > 0 && (
              <section className="system-detail-section">
                <h2>Obstacle Playbook</h2>
                <div className="obstacle-list">
                  {system.obstaclePlaybook.map((item, idx) => (
                    <div key={idx} className="obstacle-item">
                      <div className="obstacle-problem">
                        <span className="obstacle-label">If:</span> {item.obstacle}
                      </div>
                      <div className="obstacle-solution">
                        <span className="obstacle-label">Then:</span> {item.solution}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="system-detail-section system-detail-danger">
              <h2>Danger Zone</h2>
              {!showDeleteConfirm ? (
                <button
                  className="btn-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete System
                </button>
              ) : (
                <div className="delete-confirm">
                  <p>Are you sure? This will delete the system and all its components.</p>
                  <div className="delete-confirm-actions">
                    <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                      Cancel
                    </button>
                    <button className="btn-danger" onClick={handleDeleteSystem}>
                      Yes, Delete
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Component Editor Modal */}
      {renderComponentEditor()}
    </div>
  );
}

// Component Editor sub-component
interface ComponentEditorProps {
  component: Partial<SystemComponent>;
  onSave: (component: Omit<SystemComponent, "id" | "streak" | "longestStreak" | "totalCompletions" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

function ComponentEditor({ component, onSave, onCancel }: ComponentEditorProps) {
  const routines = useRoutines();
  const activeRoutines = (routines?.items || []).filter(r => r.status === "active");

  const [form, setForm] = useState({
    title: component.title || "",
    description: component.description || "",
    type: component.type || "daily",
    cueType: component.cue?.type || "time",
    cueValue: component.cue?.value || "",
    response: component.response || "",
    reward: component.reward || "",
    frequency: component.frequency || "daily",
    timeOfDay: component.timeOfDay || "morning",
    status: component.status || "active",
    linkedRoutineId: component.linkedRoutineId || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.cueValue.trim() || !form.response.trim()) {
      return;
    }

    onSave({
      title: form.title,
      description: form.description || undefined,
      type: form.type as "daily" | "weekly" | "custom",
      cue: { type: form.cueType as HabitCue["type"], value: form.cueValue },
      response: form.response,
      reward: form.reward || undefined,
      frequency: form.frequency as HabitFrequency,
      timeOfDay: form.timeOfDay as HabitTimeOfDay,
      status: form.status as "active" | "paused" | "archived",
      linkedRoutineId: form.linkedRoutineId || undefined,
    });
  };

  return (
    <form className="component-editor-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="What behavior are you building?"
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Optional details"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Frequency</label>
          <select
            value={form.frequency}
            onChange={e => setForm({ ...form, frequency: e.target.value as HabitFrequency })}
          >
            <option value="daily">Daily</option>
            <option value="weekdays">Weekdays</option>
            <option value="weekends">Weekends</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div className="form-group">
          <label>Time of Day</label>
          <select
            value={form.timeOfDay}
            onChange={e => setForm({ ...form, timeOfDay: e.target.value as HabitTimeOfDay })}
          >
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="anytime">Anytime</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Cue Type</label>
          <select
            value={form.cueType}
            onChange={e => setForm({ ...form, cueType: e.target.value as HabitCue["type"] })}
          >
            <option value="time">Time</option>
            <option value="location">Location</option>
            <option value="preceding_action">After Action</option>
            <option value="emotional_state">Emotional State</option>
          </select>
        </div>
        <div className="form-group">
          <label>Cue Value *</label>
          <input
            type="text"
            value={form.cueValue}
            onChange={e => setForm({ ...form, cueValue: e.target.value })}
            placeholder={form.cueType === "time" ? "8:00 AM" : "When..."}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Response (2-minute version) *</label>
        <input
          type="text"
          value={form.response}
          onChange={e => setForm({ ...form, response: e.target.value })}
          placeholder="The actual behavior"
          required
        />
      </div>

      <div className="form-group">
        <label>Reward</label>
        <input
          type="text"
          value={form.reward}
          onChange={e => setForm({ ...form, reward: e.target.value })}
          placeholder="What makes this satisfying?"
        />
      </div>

      {activeRoutines.length > 0 && (
        <div className="form-group">
          <label>Include in Routine</label>
          <select
            value={form.linkedRoutineId}
            onChange={e => setForm({ ...form, linkedRoutineId: e.target.value })}
          >
            <option value="">None - track separately</option>
            {activeRoutines.map(routine => (
              <option key={routine.id} value={routine.id}>
                {routine.icon || "📋"} {routine.title}
              </option>
            ))}
          </select>
          {form.linkedRoutineId && (
            <p className="form-field-note" style={{ marginTop: 4, fontSize: 12, color: "var(--color-text-secondary)" }}>
              This component will appear as a step when you run this routine
            </p>
          )}
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Save Component
        </button>
      </div>
    </form>
  );
}

export default SystemDetail;
