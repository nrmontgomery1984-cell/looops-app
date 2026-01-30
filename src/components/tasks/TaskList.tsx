// Task list component with grouping and sorting options

import React, { useMemo, useState } from "react";
import {
  Task,
  Project,
  Label,
  LoopId,
  Priority,
  TaskGroupOption,
  TaskSortOption,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
  parseLocalDate,
} from "../../types";
import { TaskItem } from "./TaskItem";
import { TaskInput } from "./TaskInput";

type TaskListProps = {
  tasks: Task[];
  projects: Project[];
  labels: Label[];
  groupBy?: TaskGroupOption;
  sortBy?: TaskSortOption;
  onToggleComplete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (task: Task) => void;
  onAddSubtask?: (parentId: string) => void;
  showAddInput?: boolean;
  emptyMessage?: string;
  showGroupHeaders?: boolean;
};

type TaskGroup = {
  id: string;
  title: string;
  icon?: string;
  color?: string;
  tasks: Task[];
  collapsed?: boolean;
};

export function TaskList({
  tasks,
  projects,
  labels,
  groupBy = "none",
  sortBy = "manual",
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onAddTask,
  onAddSubtask,
  showAddInput = true,
  emptyMessage = "No tasks yet",
  showGroupHeaders = true,
}: TaskListProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  // Filter out subtasks (they're rendered within their parent)
  const topLevelTasks = useMemo(() => {
    return tasks.filter((t) => !t.parentId);
  }, [tasks]);

  // Get subtasks for a task
  const getSubtasks = (taskId: string) => {
    return tasks.filter((t) => t.parentId === taskId);
  };

  // Sort tasks
  const sortTasks = (taskList: Task[]): Task[] => {
    const sorted = [...taskList];

    switch (sortBy) {
      case "dueDate":
        sorted.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          const dateA = parseLocalDate(a.dueDate);
          const dateB = parseLocalDate(b.dueDate);
          if (!dateA || !dateB) return 0;
          return dateA.getTime() - dateB.getTime();
        });
        break;

      case "priority":
        sorted.sort((a, b) => {
          // 0 (someday) goes last
          if (a.priority === 0 && b.priority !== 0) return 1;
          if (b.priority === 0 && a.priority !== 0) return -1;
          return a.priority - b.priority;
        });
        break;

      case "alphabetical":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;

      case "createdAt":
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;

      case "loop":
        sorted.sort((a, b) => a.loop.localeCompare(b.loop));
        break;

      case "manual":
      default:
        sorted.sort((a, b) => (a.order || 0) - (b.order || 0));
        break;
    }

    return sorted;
  };

  // Group tasks
  const groupedTasks = useMemo((): TaskGroup[] => {
    // Filter completed if needed
    const filteredTasks = showCompletedTasks
      ? topLevelTasks
      : topLevelTasks.filter((t) => t.status !== "done");

    const sortedTasks = sortTasks(filteredTasks);

    if (groupBy === "none") {
      return [{ id: "all", title: "", tasks: sortedTasks }];
    }

    const groups: Record<string, TaskGroup> = {};

    sortedTasks.forEach((task) => {
      let groupId: string;
      let groupTitle: string;
      let groupIcon: string | undefined;
      let groupColor: string | undefined;

      switch (groupBy) {
        case "loop":
          groupId = task.loop;
          groupTitle = task.loop;
          groupIcon = LOOP_DEFINITIONS[task.loop].icon;
          groupColor = LOOP_COLORS[task.loop].text;
          break;

        case "project":
          groupId = task.projectId || "no-project";
          if (task.projectId) {
            const project = projects.find((p) => p.id === task.projectId);
            groupTitle = project?.name || "Unknown Project";
            groupColor = project?.color;
          } else {
            groupTitle = "No Project";
          }
          break;

        case "priority":
          groupId = `priority-${task.priority}`;
          const priorityLabels: Record<Priority, string> = {
            1: "Priority 1 (Urgent)",
            2: "Priority 2 (High)",
            3: "Priority 3 (Medium)",
            4: "Priority 4 (Low)",
            0: "Someday",
          };
          groupTitle = priorityLabels[task.priority];
          break;

        case "dueDate":
          if (!task.dueDate) {
            groupId = "no-date";
            groupTitle = "No Date";
          } else {
            const date = parseLocalDate(task.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (!date) {
              groupId = "no-date";
              groupTitle = "No Date";
            } else {
              const dayDiff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

              if (dayDiff < 0) {
                groupId = "overdue";
                groupTitle = "Overdue";
              } else if (dayDiff === 0) {
                groupId = "today";
                groupTitle = "Today";
              } else if (dayDiff === 1) {
                groupId = "tomorrow";
                groupTitle = "Tomorrow";
              } else if (dayDiff < 7) {
                groupId = "this-week";
                groupTitle = "This Week";
              } else {
                groupId = "later";
                groupTitle = "Later";
              }
            }
          }
          break;

        case "label":
          // Use first label or no-label
          const firstLabel = task.labels?.[0];
          if (firstLabel) {
            const label = labels.find((l) => l.id === firstLabel);
            groupId = firstLabel;
            groupTitle = label?.name || "Unknown Label";
            groupColor = label?.color;
          } else {
            groupId = "no-label";
            groupTitle = "No Label";
          }
          break;

        default:
          groupId = "all";
          groupTitle = "";
      }

      if (!groups[groupId]) {
        groups[groupId] = {
          id: groupId,
          title: groupTitle,
          icon: groupIcon,
          color: groupColor,
          tasks: [],
        };
      }
      groups[groupId].tasks.push(task);
    });

    // Sort groups by a logical order
    const groupOrder: Record<string, number> = {
      overdue: 0,
      today: 1,
      tomorrow: 2,
      "this-week": 3,
      later: 4,
      "no-date": 5,
      "priority-1": 0,
      "priority-2": 1,
      "priority-3": 2,
      "priority-4": 3,
      "priority-0": 4,
    };

    return Object.values(groups).sort((a, b) => {
      const orderA = groupOrder[a.id] ?? 99;
      const orderB = groupOrder[b.id] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.title.localeCompare(b.title);
    });
  }, [topLevelTasks, groupBy, sortBy, showCompletedTasks, projects, labels]);

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Count completed tasks
  const completedCount = topLevelTasks.filter((t) => t.status === "done").length;
  const totalCount = topLevelTasks.length;

  // Get project and labels for a task
  const getTaskProject = (task: Task) =>
    task.projectId ? projects.find((p) => p.id === task.projectId) : undefined;

  const getTaskLabels = (task: Task) =>
    task.labels?.map((lid) => labels.find((l) => l.id === lid)).filter(Boolean) as Label[] || [];

  return (
    <div className="task-list-container">
      {/* Add task input */}
      {showAddInput && (
        <div className="task-list-input">
          <TaskInput
            onAddTask={onAddTask}
            projects={projects}
            labels={labels}
            taskHistory={tasks}
          />
        </div>
      )}

      {/* Task count and completed toggle */}
      {totalCount > 0 && (
        <div className="task-list-header">
          <span className="task-count">
            {totalCount - completedCount} tasks
            {completedCount > 0 && ` (${completedCount} completed)`}
          </span>
          {completedCount > 0 && (
            <button
              className="show-completed-btn"
              onClick={() => setShowCompletedTasks(!showCompletedTasks)}
            >
              {showCompletedTasks ? "Hide completed" : "Show completed"}
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {topLevelTasks.length === 0 && (
        <div className="task-list-empty">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM17.99 9l-1.41-1.42-6.59 6.59-2.58-2.57-1.42 1.41 4 3.99z" />
            </svg>
          </div>
          <p>{emptyMessage}</p>
        </div>
      )}

      {/* Task groups */}
      {groupedTasks.map((group) => {
        if (group.tasks.length === 0) return null;
        const isCollapsed = collapsedGroups.has(group.id);

        return (
          <div key={group.id} className="task-group">
            {/* Group header */}
            {showGroupHeaders && group.title && (
              <div
                className="task-group-header"
                onClick={() => toggleGroupCollapse(group.id)}
              >
                <span className={`group-collapse-icon ${isCollapsed ? "collapsed" : ""}`}>
                  ▼
                </span>
                {group.icon && <span className="group-icon">{group.icon}</span>}
                <span className="group-title" style={{ color: group.color }}>
                  {group.title}
                </span>
                <span className="group-count">{group.tasks.length}</span>
              </div>
            )}

            {/* Group tasks */}
            {!isCollapsed && (
              <div className="task-group-items">
                {group.tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    project={getTaskProject(task)}
                    labels={getTaskLabels(task)}
                    subtasks={getSubtasks(task.id)}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onAddSubtask={onAddSubtask}
                    showProject={groupBy !== "project"}
                    showLoop={groupBy !== "loop"}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
