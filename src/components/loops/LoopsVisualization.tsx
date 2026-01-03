// Loops visualization - Circular layout with 6 loops arranged in a ring + Meaning encircling all

import { useState } from "react";
import {
  LoopId,
  LoopStateType,
  Task,
  LOOP_DEFINITIONS,
  parseLocalDate,
} from "../../types";
import { getStateDisplayName, getStateColor } from "../../engines/stateEngine";

// The 6 core loops arranged in a circle
const INNER_LOOPS: LoopId[] = ["Health", "Wealth", "Family", "Work", "Fun", "Maintenance"];
// Meaning is the 7th loop that encompasses all others (displayed as outer ring)
const OUTER_LOOP: LoopId = "Meaning";

// Task dot colors based on urgency (for individual task dots)
const TASK_URGENCY_COLORS = {
  overdue: "#ef4444",    // Red
  soon: "#eab308",       // Yellow
  ok: "#22c55e",         // Green
  none: "#737390",       // Gray (no due date)
};

type LoopsVisualizationProps = {
  loopStates: Record<LoopId, { currentState: LoopStateType }>;
  tasks: Task[];
  selectedLoop: LoopId | null;
  onSelectLoop: (loopId: LoopId | null) => void;
  onSelectTask?: (taskId: string) => void;
};

export function LoopsVisualization({
  loopStates,
  tasks,
  selectedLoop,
  onSelectLoop,
  onSelectTask,
}: LoopsVisualizationProps) {
  const [hoveredLoop, setHoveredLoop] = useState<LoopId | null>(null);

  // Get parent tasks for a specific loop (excluding done, subtasks, Someday tasks, and future recurring)
  // Each parent task = one dot in the loop visualization
  const getTasksForLoop = (loopId: LoopId): Task[] => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    return tasks.filter((t) => {
      if (t.loop !== loopId) return false;
      if (t.status === "done") return false;
      if (t.priority === 0) return false; // Exclude Someday tasks
      if (t.parentId) return false; // Only parent tasks, not subtasks

      // Hide recurring tasks unless due today or tomorrow
      if (t.recurrence && t.dueDate) {
        return t.dueDate <= tomorrowStr;
      }
      return true;
    });
  };

  // Generate positions for task circles inside the main circle
  const getTaskCirclePositions = (count: number, centerX: number, centerY: number, mainRadius: number) => {
    const positions: { x: number; y: number; r: number }[] = [];
    if (count === 0) return positions;

    // Calculate appropriate radius for inner circles based on count
    const innerRadius = mainRadius * 0.6;
    const circleRadius = Math.min(8, Math.max(4, 20 / Math.sqrt(count)));

    if (count === 1) {
      positions.push({ x: centerX, y: centerY + 8, r: circleRadius });
    } else if (count <= 6) {
      // Single ring
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (i / count) * 2 * Math.PI;
        positions.push({
          x: centerX + Math.cos(angle) * innerRadius * 0.5,
          y: centerY + Math.sin(angle) * innerRadius * 0.5 + 6,
          r: circleRadius,
        });
      }
    } else if (count <= 12) {
      // Two rings
      const innerCount = Math.min(6, Math.floor(count / 2));
      const outerCount = count - innerCount;

      // Inner ring
      for (let i = 0; i < innerCount; i++) {
        const angle = -Math.PI / 2 + (i / innerCount) * 2 * Math.PI;
        positions.push({
          x: centerX + Math.cos(angle) * innerRadius * 0.3,
          y: centerY + Math.sin(angle) * innerRadius * 0.3 + 6,
          r: circleRadius * 0.8,
        });
      }
      // Outer ring
      for (let i = 0; i < outerCount; i++) {
        const angle = -Math.PI / 2 + (i / outerCount) * 2 * Math.PI;
        positions.push({
          x: centerX + Math.cos(angle) * innerRadius * 0.65,
          y: centerY + Math.sin(angle) * innerRadius * 0.65 + 6,
          r: circleRadius * 0.8,
        });
      }
    } else {
      // Show up to 12, with overflow indicator
      for (let i = 0; i < 12; i++) {
        const ring = i < 5 ? 0 : 1;
        const ringCount = ring === 0 ? 5 : 7;
        const ringIndex = ring === 0 ? i : i - 5;
        const angle = -Math.PI / 2 + (ringIndex / ringCount) * 2 * Math.PI;
        const radius = ring === 0 ? innerRadius * 0.3 : innerRadius * 0.6;
        positions.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius + 6,
          r: 4,
        });
      }
    }

    return positions;
  };

  // Calculate circular positions for 6 loops
  // Start from top (-90deg) and go clockwise
  const getLoopPosition = (index: number, total: number) => {
    const angle = -Math.PI / 2 + (index / total) * 2 * Math.PI;
    // Return percentage positions for CSS
    // Using 30% radius to leave room for outer Meaning ring
    const x = 50 + Math.cos(angle) * 30;
    const y = 50 + Math.sin(angle) * 30;
    return { x, y };
  };

  // Get Meaning loop state and color (based on state, not urgency)
  const meaningLoop = LOOP_DEFINITIONS[OUTER_LOOP];
  const meaningState = loopStates[OUTER_LOOP]?.currentState || "MAINTAIN";
  const meaningTasks = getTasksForLoop(OUTER_LOOP);
  const meaningColor = getStateColor(meaningState); // Use state-based color (red/yellow/green)
  const isMeaningSelected = selectedLoop === OUTER_LOOP;
  const isMeaningHovered = hoveredLoop === OUTER_LOOP;

  return (
    <div className="loops-viz-container">
      <div className="loops-circular">
        {/* Outer Meaning ring - encompasses all loops */}
        <div
          className={`loop-outer-meaning ${isMeaningSelected ? "selected" : ""} ${isMeaningHovered ? "hovered" : ""}`}
          onClick={() => onSelectLoop(isMeaningSelected ? null : OUTER_LOOP)}
          onMouseEnter={() => setHoveredLoop(OUTER_LOOP)}
          onMouseLeave={() => setHoveredLoop(null)}
        >
          <svg viewBox="0 0 400 400" className="meaning-outer-svg">
            <defs>
              <filter id="glow-meaning" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Outer ring */}
            <circle
              cx="200"
              cy="200"
              r="195"
              fill="none"
              stroke={meaningColor}
              strokeWidth={isMeaningSelected ? 4 : 2}
              opacity={isMeaningSelected || isMeaningHovered ? 0.8 : 0.5}
              filter={isMeaningSelected || isMeaningHovered ? "url(#glow-meaning)" : undefined}
            />
            {/* Inner ring */}
            <circle
              cx="200"
              cy="200"
              r="185"
              fill="none"
              stroke={meaningColor}
              strokeWidth={1}
              strokeDasharray="8 4"
              opacity="0.3"
            />
            {/* Meaning label at top */}
            <text
              x="200"
              y="24"
              textAnchor="middle"
              fontSize="14"
              fill={meaningColor}
              opacity={isMeaningSelected || isMeaningHovered ? 1 : 0.7}
              fontWeight="500"
            >
              {meaningLoop.icon} {meaningLoop.name}
            </text>
            {/* State label at bottom */}
            <text
              x="200"
              y="386"
              textAnchor="middle"
              fontSize="12"
              fill={meaningColor}
              opacity={isMeaningSelected || isMeaningHovered ? 0.9 : 0.5}
            >
              {getStateDisplayName(meaningState)}
            </text>
          </svg>
        </div>

        {/* Inner 6 loops */}
        {INNER_LOOPS.map((loopId, index) => {
          const loop = LOOP_DEFINITIONS[loopId];
          const state = loopStates[loopId]?.currentState || "MAINTAIN";
          const loopTasks = getTasksForLoop(loopId);
          const stateColor = getStateColor(state); // Use state-based color (red/yellow/green)
          const isSelected = selectedLoop === loopId;
          const isHovered = hoveredLoop === loopId;
          const taskPositions = getTaskCirclePositions(loopTasks.length, 60, 60, 50);
          const position = getLoopPosition(index, INNER_LOOPS.length);

          return (
            <div
              key={loopId}
              className={`loop-circle-item ${isSelected ? "selected" : ""} ${isHovered ? "hovered" : ""}`}
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
              }}
              onClick={() => onSelectLoop(isSelected ? null : loopId)}
              onMouseEnter={() => setHoveredLoop(loopId)}
              onMouseLeave={() => setHoveredLoop(null)}
            >
              <svg viewBox="0 0 120 120" className="loop-svg">
                {/* Glow effect behind circle */}
                <defs>
                  <filter id={`glow-${loopId}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Main circle - state-colored outline (red/yellow/green) */}
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  className="loop-outer-circle"
                  stroke={stateColor}
                  strokeWidth={isSelected ? 4 : 2}
                  style={{ stroke: stateColor }}
                  filter={isSelected || isHovered ? `url(#glow-${loopId})` : undefined}
                />

                {/* Inner subtle ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke={stateColor}
                  strokeWidth={1}
                  opacity="0.2"
                />

                {/* Halftone logo in center */}
                <text
                  x="60"
                  y="52"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="32"
                  opacity="0.3"
                  fill={stateColor}
                  className="loop-icon"
                >
                  {loop.icon}
                </text>

                {/* Task circles inside - each parent task is one dot, colored by urgency */}
                {taskPositions.map((pos, idx) => (
                  <circle
                    key={idx}
                    cx={pos.x}
                    cy={pos.y}
                    r={pos.r}
                    fill={getTaskUrgencyColor(loopTasks[idx])}
                    opacity="0.9"
                    className="task-circle"
                  />
                ))}

                {/* Overflow indicator */}
                {loopTasks.length > 12 && (
                  <text
                    x="60"
                    y="95"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#737390"
                    fontWeight="500"
                  >
                    +{loopTasks.length - 12} more
                  </text>
                )}
              </svg>

              {/* Label */}
              <div className="loop-label">
                <span className="loop-name">{loop.name}</span>
                <span className="loop-state" style={{ color: getStateColor(state) }}>
                  {getStateDisplayName(state)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected loop detail */}
      {selectedLoop && (
        <>
          <div className="loop-detail-backdrop" onClick={() => onSelectLoop(null)} />
          <LoopDetailPanel
            loopId={selectedLoop}
            loopStates={loopStates}
            tasks={tasks}
            onClose={() => onSelectLoop(null)}
            onSelectTask={onSelectTask}
          />
        </>
      )}
    </div>
  );
}

// Detail panel component
function LoopDetailPanel({
  loopId,
  loopStates,
  tasks,
  onClose,
  onSelectTask,
}: {
  loopId: LoopId;
  loopStates: Record<LoopId, { currentState: LoopStateType }>;
  tasks: Task[];
  onClose: () => void;
  onSelectTask?: (taskId: string) => void;
}) {
  const loop = LOOP_DEFINITIONS[loopId];
  const state = loopStates[loopId]?.currentState || "MAINTAIN";
  const stateColor = getStateColor(state); // Use state-based color
  // Show all tasks (including subtasks) in detail panel for full visibility, exclude Someday tasks
  const loopTasks = tasks.filter((t) => t.loop === loopId && t.status !== "done" && t.priority !== 0);
  // Count only parent tasks for the count display
  const parentTaskCount = loopTasks.filter(t => !t.parentId).length;

  return (
    <div className="loop-detail">
      <div className="loop-detail-header" style={{ borderLeftColor: stateColor }}>
        <div className="loop-detail-info">
          <span className="loop-detail-icon">{loop.icon}</span>
          <div>
            <h3>{loop.name}</h3>
            <span className="loop-detail-state" style={{ color: stateColor }}>
              {getStateDisplayName(state)} · {parentTaskCount} tasks
            </span>
          </div>
        </div>
        <button className="loop-detail-close" onClick={onClose}>×</button>
      </div>

      <div className="loop-detail-tasks">
        {loopTasks.length === 0 ? (
          <p className="loop-detail-empty">No active tasks</p>
        ) : (
          <ul>
            {loopTasks.map((task) => (
              <li
                key={task.id}
                className={`loop-detail-task ${task.parentId ? 'subtask' : ''}`}
                onClick={() => onSelectTask?.(task.id)}
              >
                <span className="task-dot" style={{ backgroundColor: getTaskUrgencyColor(task) }} />
                <span className="task-title">{task.parentId ? `↳ ${task.title}` : task.title}</span>
                {task.dueDate && (
                  <span className="task-due">{formatDue(task.dueDate)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Get urgency color for a single task (used for task dots in detail panel)
function getTaskUrgencyColor(task: Task): string {
  if (!task.dueDate) return TASK_URGENCY_COLORS.none;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = parseLocalDate(task.dueDate);
  if (!dueDate) return TASK_URGENCY_COLORS.none;
  const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) return TASK_URGENCY_COLORS.overdue;
  if (daysDiff <= 3) return TASK_URGENCY_COLORS.soon;
  return TASK_URGENCY_COLORS.ok;
}

function formatDue(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  if (!date) return dateStr;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default LoopsVisualization;
