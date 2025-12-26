// Main Tasks screen with Inbox, Today, Upcoming views (Todoist-style)

import React, { useState, useMemo, useEffect } from "react";
import {
  Task,
  Project,
  Label,
  LoopId,
  TaskGroupOption,
  TaskSortOption,
  createTask,
  createProject,
  ALL_LOOPS,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
} from "../../types";
import { TaskList } from "./TaskList";
import { TaskDetailModal } from "./TaskDetailModal";
import { TaskInput } from "./TaskInput";

type TaskView = "inbox" | "today" | "upcoming" | "project" | "loop" | "label";

type TasksScreenProps = {
  tasks: Task[];
  projects: Project[];
  labels: Label[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onUncompleteTask: (taskId: string) => void;
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onAddLabel: (label: Label) => void;
};

export function TasksScreen({
  tasks,
  projects,
  labels,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onCompleteTask,
  onUncompleteTask,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddLabel,
}: TasksScreenProps) {
  const [currentView, setCurrentView] = useState<TaskView>("inbox");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedLoopId, setSelectedLoopId] = useState<LoopId | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [groupBy, setGroupBy] = useState<TaskGroupOption>("none");
  const [sortBy, setSortBy] = useState<TaskSortOption>("manual");
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectLoop, setNewProjectLoop] = useState<LoopId>("Work");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  // Get today's date string
  const today = new Date().toISOString().split("T")[0];

  // Filter tasks based on current view
  const filteredTasks = useMemo(() => {
    switch (currentView) {
      case "inbox":
        return tasks.filter((t) => t.status === "inbox" || (!t.projectId && t.status !== "done"));

      case "today":
        return tasks.filter((t) => t.dueDate === today && t.status !== "done");

      case "upcoming":
        return tasks.filter((t) => {
          if (!t.dueDate || t.status === "done") return false;
          return t.dueDate >= today;
        });

      case "project":
        if (!selectedProjectId) return [];
        return tasks.filter((t) => t.projectId === selectedProjectId);

      case "loop":
        if (!selectedLoopId) return [];
        return tasks.filter((t) => t.loop === selectedLoopId);

      case "label":
        if (!selectedLabelId) return [];
        return tasks.filter((t) => t.labels?.includes(selectedLabelId));

      default:
        return tasks;
    }
  }, [tasks, currentView, selectedProjectId, selectedLoopId, selectedLabelId, today]);

  // Count tasks for sidebar badges
  const inboxCount = tasks.filter((t) => t.status === "inbox" || (!t.projectId && t.status !== "done")).length;
  const todayCount = tasks.filter((t) => t.dueDate === today && t.status !== "done").length;

  // Get subtasks for a task
  const getSubtasks = (taskId: string) => tasks.filter((t) => t.parentId === taskId);

  // Get labels for a task
  const getTaskLabels = (task: Task) =>
    task.labels?.map((lid) => labels.find((l) => l.id === lid)).filter(Boolean) as Label[] || [];

  // Handle toggle complete
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

  // Handle add subtask
  const handleAddSubtask = (parentId: string, title?: string) => {
    const parent = tasks.find((t) => t.id === parentId);
    if (!parent) return;

    const subtask = createTask(title || "New subtask", parent.loop, {
      parentId,
      projectId: parent.projectId,
      status: "todo",
      priority: 4,
    });
    onAddTask(subtask);
  };

  // Handle create project
  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;

    const project = createProject(newProjectName.trim(), newProjectLoop);
    onAddProject(project);
    setNewProjectName("");
    setShowNewProjectModal(false);
    setSelectedProjectId(project.id);
    setCurrentView("project");
  };

  // Get view title
  const getViewTitle = () => {
    switch (currentView) {
      case "inbox":
        return "Inbox";
      case "today":
        return "Today";
      case "upcoming":
        return "Upcoming";
      case "project":
        const project = projects.find((p) => p.id === selectedProjectId);
        return project?.name || "Project";
      case "loop":
        return selectedLoopId ? `${LOOP_DEFINITIONS[selectedLoopId].icon} ${selectedLoopId}` : "Loop";
      case "label":
        const label = labels.find((l) => l.id === selectedLabelId);
        return label?.name || "Label";
      default:
        return "Tasks";
    }
  };

  // Get view description
  const getViewDescription = () => {
    switch (currentView) {
      case "inbox":
        return "Tasks without a project or in inbox status";
      case "today":
        return `Tasks due ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`;
      case "upcoming":
        return "All tasks with upcoming due dates";
      case "project":
        const project = projects.find((p) => p.id === selectedProjectId);
        return project?.description || `Tasks in ${project?.name}`;
      case "loop":
        return selectedLoopId ? LOOP_DEFINITIONS[selectedLoopId].description : "";
      default:
        return "";
    }
  };

  // Handle view change and close mobile sidebar
  const handleViewChange = (view: TaskView, projectId?: string, loopId?: LoopId, labelId?: string) => {
    setCurrentView(view);
    if (projectId) setSelectedProjectId(projectId);
    if (loopId) setSelectedLoopId(loopId);
    if (labelId) setSelectedLabelId(labelId);
    setMobileSidebarOpen(false); // Close mobile sidebar after selection
  };

  // Track mobile state reactively
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= 768
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile-specific inline styles to fix positioning - bypasses CSS conflicts
  // ALWAYS apply these styles on mobile to ensure correct positioning
  const mobileStyles: React.CSSProperties = isMobile ? {
    position: 'fixed',
    top: '56px',
    left: '0px',
    right: '0px',
    bottom: '0px',
    margin: '0px',
    padding: '0px',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--color-bg)',
    zIndex: 999,
    overflow: 'hidden',
    width: '100vw',
    height: 'calc(100vh - 56px)',
    // DEBUG: red border to see actual bounds
    border: '3px solid red',
  } : {};

  // Debug: log when mobile styles are applied
  console.log('[TasksScreen] isMobile:', isMobile, 'applying styles:', isMobile ? 'YES' : 'NO');

  // Mobile styles for tasks-main child - reset padding that desktop styles add
  const mobileMainStyles: React.CSSProperties = isMobile ? {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    margin: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
  } : {};

  return (
    <div className="tasks-screen" style={mobileStyles}>
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="tasks-sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`tasks-sidebar ${sidebarCollapsed ? "collapsed" : ""} ${mobileSidebarOpen ? "mobile-open" : ""}`}>
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
                className={`sidebar-item ${currentView === "inbox" ? "active" : ""}`}
                onClick={() => handleViewChange("inbox")}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="sidebar-icon">
                  <path d="M19 3H4.99c-1.11 0-1.98.89-1.98 2L3 19c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z" />
                </svg>
                <span>Inbox</span>
                {inboxCount > 0 && <span className="sidebar-badge">{inboxCount}</span>}
              </button>

              <button
                className={`sidebar-item ${currentView === "today" ? "active" : ""}`}
                onClick={() => handleViewChange("today")}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="sidebar-icon today-icon">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
                </svg>
                <span>Today</span>
                {todayCount > 0 && <span className="sidebar-badge">{todayCount}</span>}
              </button>

              <button
                className={`sidebar-item ${currentView === "upcoming" ? "active" : ""}`}
                onClick={() => handleViewChange("upcoming")}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="sidebar-icon">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z" />
                </svg>
                <span>Upcoming</span>
              </button>
            </div>

            {/* Loops */}
            <div className="sidebar-section">
              <div className="sidebar-section-header">
                <span>Loops</span>
              </div>
              {ALL_LOOPS.map((loopId) => {
                const loop = LOOP_DEFINITIONS[loopId];
                const loopTaskCount = tasks.filter((t) => t.loop === loopId && t.status !== "done").length;
                return (
                  <button
                    key={loopId}
                    className={`sidebar-item ${currentView === "loop" && selectedLoopId === loopId ? "active" : ""}`}
                    onClick={() => handleViewChange("loop", undefined, loopId)}
                  >
                    <span className="sidebar-icon loop-icon">{loop.icon}</span>
                    <span>{loopId}</span>
                    {loopTaskCount > 0 && <span className="sidebar-badge">{loopTaskCount}</span>}
                  </button>
                );
              })}
            </div>

            {/* Projects */}
            <div className="sidebar-section">
              <div className="sidebar-section-header">
                <span>Projects</span>
                <button
                  className="add-btn"
                  onClick={() => setShowNewProjectModal(true)}
                  title="Add project"
                >
                  +
                </button>
              </div>
              {projects
                .filter((p) => !p.archived)
                .map((project) => {
                  const projectTaskCount = tasks.filter(
                    (t) => t.projectId === project.id && t.status !== "done"
                  ).length;
                  return (
                    <button
                      key={project.id}
                      className={`sidebar-item ${currentView === "project" && selectedProjectId === project.id ? "active" : ""}`}
                      onClick={() => handleViewChange("project", project.id)}
                    >
                      <span
                        className="sidebar-icon project-dot"
                        style={{ backgroundColor: project.color }}
                      />
                      <span>{project.name}</span>
                      {projectTaskCount > 0 && (
                        <span className="sidebar-badge">{projectTaskCount}</span>
                      )}
                    </button>
                  );
                })}
              {projects.filter((p) => !p.archived).length === 0 && (
                <div className="sidebar-empty">No projects yet</div>
              )}
            </div>

            {/* Labels */}
            <div className="sidebar-section">
              <div className="sidebar-section-header">
                <span>Labels</span>
              </div>
              {labels.map((label) => {
                const labelTaskCount = tasks.filter(
                  (t) => t.labels?.includes(label.id) && t.status !== "done"
                ).length;
                return (
                  <button
                    key={label.id}
                    className={`sidebar-item ${currentView === "label" && selectedLabelId === label.id ? "active" : ""}`}
                    onClick={() => handleViewChange("label", undefined, undefined, label.id)}
                  >
                    <span
                      className="sidebar-icon label-dot"
                      style={{ backgroundColor: label.color }}
                    />
                    <span>{label.name}</span>
                    {labelTaskCount > 0 && <span className="sidebar-badge">{labelTaskCount}</span>}
                  </button>
                );
              })}
              {labels.length === 0 && (
                <div className="sidebar-empty">No labels yet</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main content */}
      <div className="tasks-main" style={mobileMainStyles}>
        {/* Header */}
        <div className="tasks-header">
          <div className="tasks-header-left">
            {/* Mobile menu button */}
            <button
              className="tasks-mobile-menu-btn"
              onClick={() => setMobileSidebarOpen(true)}
              title="Open menu"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
            </button>
            <div>
              <h2>{getViewTitle()}</h2>
              <p className="tasks-description">{getViewDescription()}</p>
            </div>
          </div>
          <div className="tasks-header-right">
            {/* Loop Filter (mobile-friendly) */}
            <div className="loop-filter-control">
              <select
                value={currentView === "loop" && selectedLoopId ? selectedLoopId : ""}
                onChange={(e) => {
                  if (e.target.value) {
                    handleViewChange("loop", undefined, e.target.value as LoopId);
                  } else {
                    handleViewChange("inbox");
                  }
                }}
                className="loop-filter-select"
              >
                <option value="">All Loops</option>
                {ALL_LOOPS.map((loopId) => (
                  <option key={loopId} value={loopId}>
                    {LOOP_DEFINITIONS[loopId].icon} {loopId}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                </svg>
                List
              </button>
              <button
                className={`view-toggle-btn ${viewMode === "kanban" ? "active" : ""}`}
                onClick={() => setViewMode("kanban")}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H5V5h7v12zm7 0h-5V5h5v12z" />
                </svg>
                Kanban
              </button>
            </div>

            {/* Sort by */}
            <div className="header-control">
              <label>Sort:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as TaskSortOption)}>
                <option value="manual">Manual</option>
                <option value="dueDate">Due date</option>
                <option value="priority">Priority</option>
                <option value="alphabetical">A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Task list or Kanban */}
        {viewMode === "list" ? (
        <TaskList
          tasks={filteredTasks}
          projects={projects}
          labels={labels}
          groupBy={groupBy}
          sortBy={sortBy}
          onToggleComplete={handleToggleComplete}
          onEditTask={setEditingTask}
          onDeleteTask={onDeleteTask}
          onAddTask={onAddTask}
          onAddSubtask={(parentId) => handleAddSubtask(parentId)}
          showAddInput={true}
          showGroupHeaders={groupBy !== "none"}
          emptyMessage={
            currentView === "inbox"
              ? "Your inbox is empty. Add a task to get started!"
              : currentView === "today"
              ? "No tasks due today. Enjoy your day!"
              : "No tasks here yet."
          }
        />
        ) : (
          /* Kanban View */
          <div className="kanban-view">
            <div className="kanban-column">
              <div className="kanban-column-header">
                <span className="kanban-column-title">To Do</span>
                <span className="kanban-column-count">
                  {filteredTasks.filter(t => t.status === "todo" || t.status === "inbox").length}
                </span>
              </div>
              <div className="kanban-column-tasks">
                {filteredTasks
                  .filter(t => t.status === "todo" || t.status === "inbox")
                  .map(task => (
                    <div
                      key={task.id}
                      className="kanban-task-card"
                      onClick={() => setEditingTask(task)}
                      style={{ borderLeftColor: LOOP_COLORS[task.loop].border }}
                    >
                      <div className="kanban-task-title">{task.title}</div>
                      <div className="kanban-task-meta">
                        <span className="kanban-task-loop">{LOOP_DEFINITIONS[task.loop].icon}</span>
                        {task.dueDate && (
                          <span className="kanban-task-due">
                            {new Date(task.dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="kanban-column">
              <div className="kanban-column-header kanban-column-header--doing">
                <span className="kanban-column-title">In Progress</span>
                <span className="kanban-column-count">
                  {filteredTasks.filter(t => t.status === "doing").length}
                </span>
              </div>
              <div className="kanban-column-tasks">
                {filteredTasks
                  .filter(t => t.status === "doing")
                  .map(task => (
                    <div
                      key={task.id}
                      className="kanban-task-card"
                      onClick={() => setEditingTask(task)}
                      style={{ borderLeftColor: LOOP_COLORS[task.loop].border }}
                    >
                      <div className="kanban-task-title">{task.title}</div>
                      <div className="kanban-task-meta">
                        <span className="kanban-task-loop">{LOOP_DEFINITIONS[task.loop].icon}</span>
                        {task.dueDate && (
                          <span className="kanban-task-due">
                            {new Date(task.dueDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="kanban-column">
              <div className="kanban-column-header kanban-column-header--done">
                <span className="kanban-column-title">Done</span>
                <span className="kanban-column-count">
                  {filteredTasks.filter(t => t.status === "done").length}
                </span>
              </div>
              <div className="kanban-column-tasks">
                {filteredTasks
                  .filter(t => t.status === "done")
                  .slice(0, 10) // Only show last 10 completed
                  .map(task => (
                    <div
                      key={task.id}
                      className="kanban-task-card kanban-task-card--done"
                      onClick={() => setEditingTask(task)}
                      style={{ borderLeftColor: LOOP_COLORS[task.loop].border }}
                    >
                      <div className="kanban-task-title">{task.title}</div>
                      <div className="kanban-task-meta">
                        <span className="kanban-task-loop">{LOOP_DEFINITIONS[task.loop].icon}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task detail modal */}
      {editingTask && (
        <TaskDetailModal
          task={editingTask}
          projects={projects}
          labels={getTaskLabels(editingTask)}
          allLabels={labels}
          subtasks={getSubtasks(editingTask.id)}
          onSave={onUpdateTask}
          onDelete={onDeleteTask}
          onClose={() => setEditingTask(null)}
          onAddSubtask={(parentId, title) => handleAddSubtask(parentId, title)}
          onToggleSubtask={handleToggleComplete}
        />
      )}

      {/* New project modal */}
      {showNewProjectModal && (
        <div className="modal-overlay" onClick={() => setShowNewProjectModal(false)}>
          <div className="new-project-modal" onClick={(e) => e.stopPropagation()}>
            <h3>New Project</h3>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Loop</label>
              <select value={newProjectLoop} onChange={(e) => setNewProjectLoop(e.target.value as LoopId)}>
                {ALL_LOOPS.map((loop) => (
                  <option key={loop} value={loop}>
                    {LOOP_DEFINITIONS[loop].icon} {loop}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowNewProjectModal(false)}>
                Cancel
              </button>
              <button
                className="create-btn"
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Modal */}
      {showQuickAddModal && (
        <div className="modal-overlay" onClick={() => setShowQuickAddModal(false)}>
          <div className="quick-add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quick-add-header">
              <h3>Quick Add Task</h3>
              <button
                className="quick-add-close"
                onClick={() => setShowQuickAddModal(false)}
              >
                ×
              </button>
            </div>
            <TaskInput
              onAddTask={(task) => {
                onAddTask(task);
                setShowQuickAddModal(false);
              }}
              projects={projects}
              labels={labels}
              taskHistory={tasks}
              autoFocus={true}
              showExpandedForm={true}
              onCancel={() => setShowQuickAddModal(false)}
            />
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        className="fab-quick-add"
        onClick={() => setShowQuickAddModal(true)}
        title="Quick Add Task (Q)"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      </button>
    </div>
  );
}
