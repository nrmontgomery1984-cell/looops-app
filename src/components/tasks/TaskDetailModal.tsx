// Task detail/edit modal (Todoist-style)

import { useState } from "react";
import {
  Task,
  Project,
  Label,
  LoopId,
  Priority,
  LoopStateType,
  ALL_LOOPS,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
  RecurrencePattern,
  RECURRENCE_PRESETS,
  getRecurrenceLabel,
} from "../../types";

type TaskDetailModalProps = {
  task: Task;
  projects: Project[];
  labels: Label[];
  allLabels: Label[];
  subtasks: Task[];
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onClose: () => void;
  onAddSubtask: (parentId: string, title: string) => void;
  onToggleSubtask: (taskId: string) => void;
};

export function TaskDetailModal({
  task,
  projects,
  labels,
  allLabels,
  subtasks,
  onSave,
  onDelete,
  onClose,
  onAddSubtask,
  onToggleSubtask,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [loop, setLoop] = useState<LoopId>(task.loop);
  const [subLoop, setSubLoop] = useState(task.subLoop || "");
  const [projectId, setProjectId] = useState(task.projectId || "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [startDate, setStartDate] = useState(task.startDate || "");
  const [estimateMinutes, setEstimateMinutes] = useState(task.estimateMinutes?.toString() || "");
  const [requiredState, setRequiredState] = useState<LoopStateType | "">(task.requiredState || "");
  const [selectedLabels, setSelectedLabels] = useState<string[]>(task.labels || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Recurrence state
  const [recurrencePreset, setRecurrencePreset] = useState<string>(() => {
    if (!task.recurrence) return "";
    // Try to match existing recurrence to a preset
    const match = RECURRENCE_PRESETS.find(p => {
      const r = task.recurrence!;
      if (p.pattern.frequency !== r.frequency) return false;
      if (p.pattern.interval !== r.interval) return false;
      if (p.pattern.daysOfWeek && r.daysOfWeek) {
        return JSON.stringify(p.pattern.daysOfWeek.sort()) === JSON.stringify(r.daysOfWeek.sort());
      }
      return !p.pattern.daysOfWeek && !r.daysOfWeek;
    });
    return match ? match.id : "custom";
  });
  const [customDays, setCustomDays] = useState<number[]>(task.recurrence?.daysOfWeek || []);
  const [showCustomDays, setShowCustomDays] = useState(recurrencePreset === "custom" && (task.recurrence?.daysOfWeek?.length || 0) > 0);

  // Build recurrence pattern from state
  const getRecurrencePattern = (): RecurrencePattern | undefined => {
    if (!recurrencePreset) return undefined;

    if (recurrencePreset === "custom") {
      if (customDays.length > 0) {
        return {
          frequency: "weekly",
          interval: 1,
          daysOfWeek: customDays,
        };
      }
      return undefined;
    }

    const preset = RECURRENCE_PRESETS.find(p => p.id === recurrencePreset);
    return preset?.pattern;
  };

  const handleSave = () => {
    const updatedTask: Task = {
      ...task,
      title,
      description: description || undefined,
      loop,
      subLoop: subLoop || undefined,
      projectId: projectId || undefined,
      priority,
      dueDate: dueDate || undefined,
      startDate: startDate || undefined,
      estimateMinutes: estimateMinutes ? parseInt(estimateMinutes) : undefined,
      requiredState: requiredState || undefined,
      labels: selectedLabels.length > 0 ? selectedLabels : undefined,
      recurrence: getRecurrencePattern(),
      updatedAt: new Date().toISOString(),
    };
    onSave(updatedTask);
    onClose();
  };

  const handleDelete = () => {
    onDelete(task.id);
    onClose();
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      onAddSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle("");
    }
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  const loopDef = LOOP_DEFINITIONS[loop];
  const loopColors = LOOP_COLORS[loop];

  const priorityOptions: { value: Priority; label: string; color: string }[] = [
    { value: 1, label: "Priority 1", color: "#F27059" },  // Coral
    { value: 2, label: "Priority 2", color: "#F4B942" },  // Amber
    { value: 3, label: "Priority 3", color: "#73A58C" },  // Sage
    { value: 4, label: "Priority 4", color: "#737390" },  // Navy Gray
    { value: 0, label: "Someday", color: "#a3a3b8" },  // Gray
  ];

  const stateOptions: { value: LoopStateType | ""; label: string }[] = [
    { value: "", label: "Any state" },
    { value: "BUILD", label: "BUILD (high capacity)" },
    { value: "MAINTAIN", label: "MAINTAIN (normal)" },
    { value: "RECOVER", label: "RECOVER (low capacity)" },
    { value: "HIBERNATE", label: "HIBERNATE (minimal)" },
  ];

  const completedSubtasks = subtasks.filter((t) => t.status === "done").length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="task-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="task-detail-header">
          <div className="task-detail-loop-badge" style={{ backgroundColor: loopColors.bg, color: loopColors.text }}>
            {loopDef.icon} {loop}
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
            </svg>
          </button>
        </div>

        {/* Main content */}
        <div className="task-detail-content">
          {/* Title */}
          <input
            type="text"
            className="task-detail-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
          />

          {/* Description */}
          <textarea
            className="task-detail-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description..."
            rows={3}
          />

          {/* Subtasks */}
          <div className="task-detail-subtasks">
            <div className="subtasks-header">
              <h4>Subtasks</h4>
              {subtasks.length > 0 && (
                <span className="subtasks-count">
                  {completedSubtasks}/{subtasks.length}
                </span>
              )}
            </div>

            {subtasks.length > 0 && (
              <div className="subtasks-list">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="subtask-item">
                    <button
                      className={`subtask-checkbox ${subtask.status === "done" ? "checked" : ""}`}
                      onClick={() => onToggleSubtask(subtask.id)}
                    >
                      {subtask.status === "done" && (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      )}
                    </button>
                    <span className={`subtask-title ${subtask.status === "done" ? "completed" : ""}`}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="add-subtask">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                placeholder="Add subtask..."
              />
              <button onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()}>
                Add
              </button>
            </div>
          </div>

          {/* Properties */}
          <div className="task-detail-properties">
            {/* Loop */}
            <div className="property-row">
              <label>
                <svg viewBox="0 0 24 24" fill="currentColor" className="property-icon">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
                Loop
              </label>
              <select value={loop} onChange={(e) => setLoop(e.target.value as LoopId)}>
                {ALL_LOOPS.map((l) => (
                  <option key={l} value={l}>
                    {LOOP_DEFINITIONS[l].icon} {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-loop */}
            <div className="property-row">
              <label>
                <svg viewBox="0 0 24 24" fill="currentColor" className="property-icon">
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                </svg>
                Sub-loop
              </label>
              <select value={subLoop} onChange={(e) => setSubLoop(e.target.value)}>
                <option value="">None</option>
                {loopDef.subLoops.map((sl) => (
                  <option key={sl} value={sl}>
                    {sl}
                  </option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div className="property-row">
              <label>
                <svg viewBox="0 0 24 24" fill="currentColor" className="property-icon">
                  <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
                </svg>
                Project
              </label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">No project</option>
                {projects
                  .filter((p) => !p.archived)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Priority */}
            <div className="property-row">
              <label>
                <svg viewBox="0 0 24 24" fill="currentColor" className="property-icon">
                  <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
                </svg>
                Priority
              </label>
              <div className="priority-select">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={`priority-option ${priority === opt.value ? "active" : ""}`}
                    style={{
                      borderColor: opt.color,
                      backgroundColor: priority === opt.value ? opt.color : "transparent",
                      color: priority === opt.value ? "white" : opt.color,
                    }}
                    onClick={() => setPriority(opt.value)}
                  >
                    {opt.value === 0 ? "S" : `P${opt.value}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Due date */}
            <div className="property-row">
              <label>
                <svg viewBox="0 0 24 24" fill="currentColor" className="property-icon">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                </svg>
                Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* Start date */}
            <div className="property-row">
              <label>
                <svg viewBox="0 0 24 24" fill="currentColor" className="property-icon">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* Recurrence */}
            <div className="property-row">
              <label>
                <svg viewBox="0 0 24 24" fill="currentColor" className="property-icon">
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
                </svg>
                Repeat
              </label>
              <select
                value={recurrencePreset}
                onChange={(e) => {
                  setRecurrencePreset(e.target.value);
                  if (e.target.value === "custom") {
                    setShowCustomDays(true);
                  } else {
                    setShowCustomDays(false);
                    setCustomDays([]);
                  }
                }}
              >
                <option value="">Does not repeat</option>
                {RECURRENCE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
                <option value="custom">Custom days...</option>
              </select>
            </div>

            {/* Custom days picker */}
            {showCustomDays && (
              <div className="property-row property-row-days">
                <label>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="property-icon">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                  </svg>
                  Days
                </label>
                <div className="days-picker">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                    <button
                      key={day}
                      type="button"
                      className={`day-btn ${customDays.includes(idx) ? "active" : ""}`}
                      onClick={() => {
                        setCustomDays(prev =>
                          prev.includes(idx)
                            ? prev.filter(d => d !== idx)
                            : [...prev, idx].sort((a, b) => a - b)
                        );
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Show current recurrence if set */}
            {task.recurrence && (
              <div className="property-row recurrence-info">
                <span className="recurrence-badge">
                  🔄 {getRecurrenceLabel(task.recurrence)}
                </span>
              </div>
            )}

            {/* Time estimate */}
            <div className="property-row">
              <label>
                <svg viewBox="0 0 24 24" fill="currentColor" className="property-icon">
                  <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                </svg>
                Estimate
              </label>
              <div className="estimate-input">
                <input
                  type="number"
                  value={estimateMinutes}
                  onChange={(e) => setEstimateMinutes(e.target.value)}
                  placeholder="0"
                  min="0"
                />
                <span>minutes</span>
              </div>
            </div>

            {/* Required state */}
            <div className="property-row">
              <label>
                <svg viewBox="0 0 24 24" fill="currentColor" className="property-icon">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Required state
              </label>
              <select
                value={requiredState}
                onChange={(e) => setRequiredState(e.target.value as LoopStateType | "")}
              >
                {stateOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Labels */}
            <div className="property-row property-row-labels">
              <label>
                <svg viewBox="0 0 24 24" fill="currentColor" className="property-icon">
                  <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z" />
                </svg>
                Labels
              </label>
              <div className="labels-picker">
                {allLabels.map((label) => (
                  <button
                    key={label.id}
                    className={`label-chip ${selectedLabels.includes(label.id) ? "selected" : ""}`}
                    style={{
                      backgroundColor: selectedLabels.includes(label.id) ? label.color : "transparent",
                      borderColor: label.color,
                      color: selectedLabels.includes(label.id) ? "white" : label.color,
                    }}
                    onClick={() => toggleLabel(label.id)}
                  >
                    {label.name}
                  </button>
                ))}
                {allLabels.length === 0 && (
                  <span className="no-labels">No labels created yet</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="task-detail-footer">
          <div className="footer-left">
            {!showDeleteConfirm ? (
              <button
                className="delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
                Delete
              </button>
            ) : (
              <div className="delete-confirm">
                <span>Delete task?</span>
                <button className="confirm-yes" onClick={handleDelete}>
                  Yes
                </button>
                <button className="confirm-no" onClick={() => setShowDeleteConfirm(false)}>
                  No
                </button>
              </div>
            )}
          </div>
          <div className="footer-right">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="save-btn" onClick={handleSave} disabled={!title.trim()}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
