// Quick add task input with natural language parsing (Todoist-style)

import React, { useState, useRef, useEffect, KeyboardEvent, useMemo } from "react";
import {
  Task,
  LoopId,
  Priority,
  Project,
  Label,
  RecurrencePattern,
  RECURRENCE_PRESETS,
  parseTaskInput,
  createTask,
  ALL_LOOPS,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
} from "../../types";
import { predictLoop } from "../../engines";

type TaskInputProps = {
  onAddTask: (task: Task) => void;
  projects: Project[];
  labels: Label[];
  taskHistory?: Task[]; // For smarter predictions
  defaultLoop?: LoopId;
  defaultProjectId?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  showExpandedForm?: boolean;
};

export function TaskInput({
  onAddTask,
  projects,
  labels,
  taskHistory = [],
  defaultLoop = "Work",
  defaultProjectId,
  placeholder = "Add task... (try: 'Review budget #Wealth p1 tomorrow')",
  autoFocus = false,
  onCancel,
  showExpandedForm = false,
}: TaskInputProps) {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(showExpandedForm);
  const [selectedLoop, setSelectedLoop] = useState<LoopId>(defaultLoop);
  const [selectedProject, setSelectedProject] = useState<string | undefined>(defaultProjectId);
  const [selectedPriority, setSelectedPriority] = useState<Priority>(4);
  const [dueDate, setDueDate] = useState<string>("");
  const [description, setDescription] = useState("");
  const [userOverrodeLoop, setUserOverrodeLoop] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrencePattern | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Parse input as user types for preview
  const parsed = parseTaskInput(input);

  // Smart loop prediction based on task text
  const loopPrediction = useMemo(() => {
    // Don't predict if user explicitly set a loop with #LoopName
    if (parsed.loop || userOverrodeLoop || !input.trim()) {
      return null;
    }
    return predictLoop(input, taskHistory);
  }, [input, parsed.loop, userOverrodeLoop, taskHistory]);

  // Auto-update selected loop based on prediction
  useEffect(() => {
    if (loopPrediction?.topPrediction && !userOverrodeLoop && !parsed.loop) {
      setSelectedLoop(loopPrediction.topPrediction.loop);
    }
  }, [loopPrediction, userOverrodeLoop, parsed.loop]);

  const handleSubmit = () => {
    if (!input.trim()) return;

    const task = createTask(parsed.title || input.trim(), parsed.loop || selectedLoop, {
      description: description || parsed.description,
      priority: parsed.priority || selectedPriority,
      dueDate: parsed.dueDate || dueDate || undefined,
      projectId: selectedProject,
      labels: parsed.labels,
      status: "todo",
      source: recurrence ? "recurring" : "manual",
      recurrence: recurrence || undefined,
    });

    onAddTask(task);
    resetForm();
  };

  const resetForm = () => {
    setInput("");
    setDescription("");
    setDueDate("");
    setSelectedPriority(4);
    setUserOverrodeLoop(false);
    setSelectedLoop(defaultLoop);
    setRecurrence(null);
    if (!defaultProjectId) {
      setSelectedProject(undefined);
    }
    if (!showExpandedForm) {
      setIsExpanded(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      if (onCancel) {
        onCancel();
      } else {
        resetForm();
      }
    }
  };

  const priorityColors: Record<Priority, string> = {
    1: "#F27059",  // Coral
    2: "#F4B942",  // Amber
    3: "#73A58C",  // Sage
    4: "#737390",  // Navy Gray
    0: "#a3a3b8",  // Gray
  };

  const priorityLabels: Record<Priority, string> = {
    1: "P1",
    2: "P2",
    3: "P3",
    4: "P4",
    0: "Someday",
  };

  return (
    <div className="task-input-container">
      <div className="task-input-main">
        <button
          className="task-input-expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? "−" : "+"}
        </button>

        <input
          ref={inputRef}
          type="text"
          className="task-input-field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />

        <button
          className="task-input-submit-btn"
          onClick={handleSubmit}
          disabled={!input.trim()}
        >
          Add
        </button>
      </div>

      {/* Quick hints when typing */}
      {input && (parsed.loop || parsed.priority || parsed.dueDate || loopPrediction?.topPrediction) && (
        <div className="task-input-hints">
          {/* Show parsed loop if explicitly set with #LoopName */}
          {parsed.loop && (
            <span
              className="hint-tag"
              style={{ backgroundColor: LOOP_COLORS[parsed.loop].bg, color: LOOP_COLORS[parsed.loop].text }}
            >
              {LOOP_DEFINITIONS[parsed.loop].icon} {parsed.loop}
            </span>
          )}
          {/* Show AI-predicted loop if no explicit loop */}
          {!parsed.loop && loopPrediction?.topPrediction && (
            <span
              className="hint-tag hint-predicted"
              style={{
                backgroundColor: LOOP_COLORS[loopPrediction.topPrediction.loop].bg,
                color: LOOP_COLORS[loopPrediction.topPrediction.loop].text,
                border: `1px dashed ${LOOP_COLORS[loopPrediction.topPrediction.loop].border}`
              }}
              title={`Predicted: ${loopPrediction.topPrediction.matchedKeywords.join(", ")}`}
            >
              {LOOP_DEFINITIONS[loopPrediction.topPrediction.loop].icon} {loopPrediction.topPrediction.loop}
              <span className="hint-confidence">
                {Math.round(loopPrediction.topPrediction.confidence * 100)}%
              </span>
            </span>
          )}
          {parsed.priority && (
            <span
              className="hint-tag"
              style={{ backgroundColor: priorityColors[parsed.priority], color: "white" }}
            >
              {priorityLabels[parsed.priority]}
            </span>
          )}
          {parsed.dueDate && (
            <span className="hint-tag hint-date">
              {parsed.dueDate}
            </span>
          )}
          {parsed.labels?.map((label) => (
            <span key={label} className="hint-tag hint-label">
              @{label}
            </span>
          ))}
        </div>
      )}

      {/* Expanded form */}
      {isExpanded && (
        <div className="task-input-expanded">
          <textarea
            className="task-input-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
          />

          <div className="task-input-options">
            {/* Loop selector */}
            <div className="task-input-option">
              <label>
                Loop
                {loopPrediction?.topPrediction && !userOverrodeLoop && (
                  <span className="loop-auto-badge">auto</span>
                )}
              </label>
              <select
                value={selectedLoop}
                onChange={(e) => {
                  setSelectedLoop(e.target.value as LoopId);
                  setUserOverrodeLoop(true);
                }}
                className="task-input-select"
              >
                {ALL_LOOPS.map((loop) => (
                  <option key={loop} value={loop}>
                    {LOOP_DEFINITIONS[loop].icon} {loop}
                  </option>
                ))}
              </select>
            </div>

            {/* Project selector */}
            <div className="task-input-option">
              <label>Project</label>
              <select
                value={selectedProject || ""}
                onChange={(e) => setSelectedProject(e.target.value || undefined)}
                className="task-input-select"
              >
                <option value="">No project</option>
                {projects
                  .filter((p) => !p.archived)
                  .map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Priority selector */}
            <div className="task-input-option">
              <label>Priority</label>
              <div className="priority-buttons">
                {([1, 2, 3, 4] as Priority[]).map((p) => (
                  <button
                    key={p}
                    className={`priority-btn ${selectedPriority === p ? "active" : ""}`}
                    style={{
                      borderColor: priorityColors[p],
                      backgroundColor: selectedPriority === p ? priorityColors[p] : "transparent",
                      color: selectedPriority === p ? "white" : priorityColors[p],
                    }}
                    onClick={() => setSelectedPriority(p)}
                  >
                    P{p}
                  </button>
                ))}
              </div>
            </div>

            {/* Due date */}
            <div className="task-input-option">
              <label>Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="task-input-date"
              />
            </div>

            {/* Recurrence */}
            <div className="task-input-option">
              <label>
                Repeat
                {recurrence && (
                  <button
                    className="recurrence-clear-btn"
                    onClick={() => setRecurrence(null)}
                    title="Clear recurrence"
                  >
                    ×
                  </button>
                )}
              </label>
              <select
                value={recurrence ? RECURRENCE_PRESETS.find(
                  (p) => p.pattern.frequency === recurrence.frequency &&
                         p.pattern.interval === recurrence.interval
                )?.id || "custom" : ""}
                onChange={(e) => {
                  if (!e.target.value) {
                    setRecurrence(null);
                  } else {
                    const preset = RECURRENCE_PRESETS.find((p) => p.id === e.target.value);
                    if (preset) {
                      setRecurrence(preset.pattern);
                    }
                  }
                }}
                className="task-input-select"
              >
                <option value="">No repeat</option>
                {RECURRENCE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="task-input-actions">
            <button className="task-input-cancel-btn" onClick={onCancel || resetForm}>
              Cancel
            </button>
            <button
              className="task-input-add-btn"
              onClick={handleSubmit}
              disabled={!input.trim()}
            >
              Add Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
