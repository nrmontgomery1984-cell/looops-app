// Individual task item component (Todoist-style)

import React, { useState } from "react";
import {
  Task,
  Project,
  Label,
  LOOP_COLORS,
  LOOP_DEFINITIONS,
  Priority,
  getRecurrenceLabel,
} from "../../types";

type TaskItemProps = {
  task: Task;
  project?: Project;
  labels?: Label[];
  subtasks?: Task[];
  onToggleComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddSubtask?: (parentId: string) => void;
  showProject?: boolean;
  showLoop?: boolean;
  indent?: number;
};

export function TaskItem({
  task,
  project,
  labels = [],
  subtasks = [],
  onToggleComplete,
  onEdit,
  onDelete,
  onAddSubtask,
  showProject = true,
  showLoop = true,
  indent = 0,
}: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(true);

  const isCompleted = task.status === "done";
  const loopColors = LOOP_COLORS[task.loop];
  const loopDef = LOOP_DEFINITIONS[task.loop];

  const priorityColors: Record<Priority, string> = {
    1: "#F27059",  // Coral
    2: "#F4B942",  // Amber
    3: "#73A58C",  // Sage
    4: "#737390",  // Navy Gray
    0: "#a3a3b8",  // Gray
  };

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return null;

    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayDiff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff < 0) {
      return { text: "Overdue", className: "due-overdue" };
    } else if (dayDiff === 0) {
      return { text: "Today", className: "due-today" };
    } else if (dayDiff === 1) {
      return { text: "Tomorrow", className: "due-tomorrow" };
    } else if (dayDiff < 7) {
      return { text: date.toLocaleDateString("en-US", { weekday: "short" }), className: "due-week" };
    } else {
      return { text: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), className: "due-later" };
    }
  };

  const dueInfo = formatDueDate(task.dueDate);
  const completedSubtasks = subtasks.filter((t) => t.status === "done").length;

  return (
    <div className="task-item-wrapper" style={{ marginLeft: indent * 24 }}>
      <div
        className={`task-item ${isCompleted ? "completed" : ""} priority-${task.priority}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Checkbox */}
        <button
          className="task-checkbox"
          onClick={() => onToggleComplete(task.id)}
          style={{ borderColor: priorityColors[task.priority] }}
        >
          {isCompleted && (
            <svg viewBox="0 0 24 24" fill="currentColor" className="check-icon">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          )}
        </button>

        {/* Main content */}
        <div className="task-content" onClick={() => onEdit(task)}>
          <div className="task-title-row">
            <span className={`task-title ${isCompleted ? "completed" : ""}`}>
              {task.title}
            </span>

            {/* Subtask count */}
            {subtasks.length > 0 && (
              <button
                className="subtask-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSubtasks(!showSubtasks);
                }}
              >
                {completedSubtasks}/{subtasks.length}
                <span className={`toggle-arrow ${showSubtasks ? "open" : ""}`}>
                  ▶
                </span>
              </button>
            )}
          </div>

          {/* Description preview */}
          {task.description && (
            <p className="task-description-preview">{task.description}</p>
          )}

          {/* Metadata row */}
          <div className="task-meta">
            {/* Due date & time */}
            {dueInfo && (
              <span className={`task-due ${dueInfo.className}`}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="meta-icon">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                </svg>
                {dueInfo.text}
                {task.dueTime && <span className="task-due-time"> @ {task.dueTime}</span>}
              </span>
            )}

            {/* Loop badge */}
            {showLoop && (
              <span
                className="task-loop-badge"
                style={{ backgroundColor: loopColors.bg, color: loopColors.text }}
              >
                {loopDef.icon}
              </span>
            )}

            {/* Project */}
            {showProject && project && (
              <span
                className="task-project-badge"
                style={{ color: project.color }}
              >
                # {project.name}
              </span>
            )}

            {/* Labels */}
            {labels.length > 0 && (
              <div className="task-labels">
                {labels.map((label) => (
                  <span
                    key={label.id}
                    className="task-label-badge"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}

            {/* Recurrence indicator */}
            {task.recurrence && (
              <span className="task-recurrence" title={getRecurrenceLabel(task.recurrence)}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="meta-icon">
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
                </svg>
                {getRecurrenceLabel(task.recurrence)}
              </span>
            )}

            {/* Time estimate */}
            {task.estimateMinutes && (
              <span className="task-estimate">
                <svg viewBox="0 0 24 24" fill="currentColor" className="meta-icon">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
                {task.estimateMinutes}m
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {isHovered && (
          <div className="task-actions">
            {onAddSubtask && (
              <button
                className="task-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSubtask(task.id);
                }}
                title="Add subtask"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
              </button>
            )}
            <button
              className="task-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              title="Edit"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
            </button>
            <button
              className="task-action-btn task-action-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              title="Delete"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Subtasks */}
      {showSubtasks && subtasks.length > 0 && (
        <div className="task-subtasks">
          {subtasks.map((subtask) => (
            <TaskItem
              key={subtask.id}
              task={subtask}
              project={project}
              labels={[]}
              subtasks={[]}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              showProject={false}
              showLoop={false}
              indent={1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
