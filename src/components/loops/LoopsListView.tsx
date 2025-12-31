// Loops List View - Tasks grouped by loop with collapsible sections
// Part of the Loops page, showing tasks in a list format with loop dashboards

import React, { useState, useMemo } from "react";
import {
  Task,
  Project,
  Label,
  LoopId,
  ALL_LOOPS,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
  STATE_COLORS,
  Habit,
  System,
  LoopState,
} from "../../types";
import { TaskList } from "../tasks/TaskList";

type LoopsListViewProps = {
  tasks: Task[];
  loops: {
    states: Record<LoopId, LoopState>;
  };
  habits: Habit[];
  systems: System[];
  projects: Project[];
  labels: Label[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onUncompleteTask: (taskId: string) => void;
  onOpenLoopDashboard: (loopId: LoopId) => void;
  onOpenTaskDetail: (taskId: string) => void;
};

function getStateDisplayName(state: string): string {
  switch (state) {
    case "BUILD": return "Building";
    case "MAINTAIN": return "Maintaining";
    case "RECOVER": return "Recovering";
    case "HIBERNATE": return "Hibernating";
    default: return state;
  }
}

export function LoopsListView({
  tasks,
  loops,
  habits,
  systems,
  projects,
  labels,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onCompleteTask,
  onUncompleteTask,
  onOpenLoopDashboard,
  onOpenTaskDetail,
}: LoopsListViewProps) {
  // Track which loops are expanded (all expanded by default)
  const [expandedLoops, setExpandedLoops] = useState<Set<LoopId>>(
    new Set(ALL_LOOPS)
  );

  const toggleLoop = (loopId: LoopId) => {
    setExpandedLoops((prev) => {
      const next = new Set(prev);
      if (next.has(loopId)) {
        next.delete(loopId);
      } else {
        next.add(loopId);
      }
      return next;
    });
  };

  // Get tasks for each loop (exclude completed, Someday, and subtasks)
  const getLoopTasks = (loopId: LoopId): Task[] => {
    return tasks.filter(
      (t) =>
        t.loop === loopId &&
        t.status !== "done" &&
        t.status !== "dropped" &&
        t.priority !== 0 &&
        !t.parentId
    );
  };

  // Get stats for each loop
  const getLoopStats = (loopId: LoopId) => {
    const loopTasks = tasks.filter((t) => t.loop === loopId && t.status !== "done");
    const loopHabits = habits.filter((h) => h.loop === loopId && h.status === "active");
    const loopSystems = systems.filter((s) => s.loop === loopId && s.status === "active");

    // Count overdue tasks
    const today = new Date().toISOString().split("T")[0];
    const overdueTasks = loopTasks.filter((t) => t.dueDate && t.dueDate < today);

    // Count tasks due today
    const dueTodayTasks = loopTasks.filter((t) => t.dueDate === today);

    return {
      taskCount: loopTasks.filter((t) => t.priority !== 0).length,
      habitCount: loopHabits.length,
      systemCount: loopSystems.length,
      overdueCount: overdueTasks.length,
      dueTodayCount: dueTodayTasks.length,
    };
  };

  // Handle task toggle complete
  const handleToggleComplete = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      if (task.status === "done") {
        onUncompleteTask(taskId);
      } else {
        onCompleteTask(taskId);
      }
    }
  };

  return (
    <div className="loops-list-view">
      {ALL_LOOPS.map((loopId) => {
        const loop = LOOP_DEFINITIONS[loopId];
        const loopColor = LOOP_COLORS[loopId];
        const loopState = loops.states[loopId];
        const currentState = loopState?.currentState || "MAINTAIN";
        const loopTasks = getLoopTasks(loopId);
        const stats = getLoopStats(loopId);
        const isExpanded = expandedLoops.has(loopId);

        return (
          <div
            key={loopId}
            className={`loops-list-section ${isExpanded ? "expanded" : "collapsed"}`}
            style={{
              "--loop-color": loopColor.border,
              "--loop-bg": loopColor.bg,
            } as React.CSSProperties}
          >
            {/* Loop Header */}
            <button
              className="loops-list-header"
              onClick={() => toggleLoop(loopId)}
            >
              <div className="loops-list-header__left">
                <span
                  className={`loops-list-chevron ${isExpanded ? "expanded" : ""}`}
                >
                  ›
                </span>
                <span className="loops-list-icon">{loop.icon}</span>
                <span className="loops-list-name">{loop.name}</span>
                <span
                  className="loops-list-state"
                  style={{ backgroundColor: STATE_COLORS[currentState] }}
                >
                  {getStateDisplayName(currentState)}
                </span>
              </div>
              <div className="loops-list-header__right">
                {stats.overdueCount > 0 && (
                  <span className="loops-list-badge overdue">
                    {stats.overdueCount} overdue
                  </span>
                )}
                {stats.dueTodayCount > 0 && (
                  <span className="loops-list-badge today">
                    {stats.dueTodayCount} today
                  </span>
                )}
                <span className="loops-list-count">
                  {stats.taskCount} task{stats.taskCount !== 1 ? "s" : ""}
                </span>
              </div>
            </button>

            {/* Loop Content */}
            {isExpanded && (
              <div className="loops-list-content">
                {/* Tasks */}
                {loopTasks.length > 0 ? (
                  <TaskList
                    tasks={loopTasks}
                    projects={projects}
                    labels={labels}
                    groupBy="none"
                    sortBy="priority"
                    onToggleComplete={handleToggleComplete}
                    onEditTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                    onAddTask={onAddTask}
                    showAddInput={false}
                    showGroupHeaders={false}
                  />
                ) : (
                  <p className="loops-list-empty">No active tasks in {loop.name}</p>
                )}

                {/* Loop Dashboard Summary */}
                <div className="loops-list-dashboard">
                  <div className="loops-list-stats">
                    {stats.habitCount > 0 && (
                      <span className="loops-list-stat">
                        {stats.habitCount} active habit{stats.habitCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {stats.systemCount > 0 && (
                      <span className="loops-list-stat">
                        {stats.systemCount} system{stats.systemCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <button
                    className="loops-list-dashboard-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLoopDashboard(loopId);
                    }}
                  >
                    Open {loop.name} Dashboard →
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
