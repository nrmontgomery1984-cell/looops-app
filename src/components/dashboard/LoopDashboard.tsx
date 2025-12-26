// Loop Dashboard - Customizable widget-based dashboard for each loop
// Each loop has its own dashboard with widgets the user can configure

import React, { useState } from "react";
import {
  LoopId,
  LoopDashboard as LoopDashboardType,
  WidgetConfig,
  WidgetType,
  WidgetSize,
  WIDGET_DEFINITIONS,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
  Task,
  Habit,
  HabitCompletion,
  System,
  Note,
  Goal,
  getWidgetGridClass,
  Caregiver,
  BabysitterSession,
} from "../../types";
import { HabitsWidget } from "../systems/HabitsTracker";
import { BabysitterWidget } from "./BabysitterWidget";
import { HealthWidget } from "./HealthWidget";
import { CalendarWidget as GoogleCalendarWidget } from "./CalendarWidget";
import { SpotifyWidget } from "./SpotifyWidget";
import { WealthWidget } from "./WealthWidget";
import { BudgetWidget } from "./BudgetWidget";
import { MediaWidget } from "./MediaWidget";
import { SleepReadinessWidget } from "./SleepReadinessWidget";
import { ActivityWidget } from "./ActivityWidget";
import { NutritionWidget } from "./NutritionWidget";
import { HooomzWidget } from "./HooomzWidget";
import { HooomzLifeWidget } from "./HooomzLifeWidget";
import { MeditationWidget } from "./MeditationWidget";
import { WeatherWidget } from "./WeatherWidget";
import { GoodTimesWidget } from "./GoodTimesWidget";
import { StepsWidget } from "./StepsWidget";

interface LoopDashboardProps {
  loop: LoopId;
  dashboard: LoopDashboardType;
  // Data for widgets
  tasks: Task[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  systems: System[];
  notes: Note[];
  goals: Goal[];
  // Babysitter data (Family loop)
  caregivers: Caregiver[];
  babysitterSessions: BabysitterSession[];
  // Actions
  onCompleteTask: (taskId: string) => void;
  onSelectTask: (taskId: string) => void;
  onCompleteHabit: (habitId: string, date: string) => void;
  onUncompleteHabit: (habitId: string, date: string) => void;
  onUpdateDashboard: (dashboard: LoopDashboardType) => void;
  onOpenSystemBuilder: () => void;
  onAddNote: (note: Note) => void;
  onUpdateNote: (note: Note) => void;
  // Babysitter actions
  onAddBabysitterSession: (session: BabysitterSession) => void;
  onUpdateBabysitterSession: (session: BabysitterSession) => void;
  onDeleteBabysitterSession: (sessionId: string) => void;
  onAddCaregiver: (caregiver: Caregiver) => void;
  onUpdateCaregiver: (caregiver: Caregiver) => void;
  onDeactivateCaregiver: (caregiverId: string) => void;
  onBack?: () => void;
}

export function LoopDashboard({
  loop,
  dashboard,
  tasks,
  habits,
  habitCompletions,
  systems,
  notes,
  goals,
  caregivers,
  babysitterSessions,
  onCompleteTask,
  onSelectTask,
  onCompleteHabit,
  onUncompleteHabit,
  onUpdateDashboard,
  onOpenSystemBuilder,
  onAddNote,
  onUpdateNote,
  onAddBabysitterSession,
  onUpdateBabysitterSession,
  onDeleteBabysitterSession,
  onAddCaregiver,
  onUpdateCaregiver,
  onDeactivateCaregiver,
  onBack,
}: LoopDashboardProps) {
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  const loopColor = LOOP_COLORS[loop];
  const loopDef = LOOP_DEFINITIONS[loop];

  // Filter data for this loop
  const loopTasks = tasks.filter(t => t.loop === loop && t.status !== "done");
  const loopHabits = habits.filter(h => h.loop === loop && h.status === "active");
  const loopSystems = systems.filter(s => s.loop === loop && s.status === "active");
  const loopNotes = notes.filter(n => n.loop === loop);
  const loopGoals = goals.filter(g => g.loop === loop);

  // Calculate system health
  const getSystemHealth = () => {
    if (loopSystems.length === 0) return null;
    const avgHealth = loopSystems.reduce((sum, s) => sum + (s.healthScore || 0), 0) / loopSystems.length;
    return Math.round(avgHealth);
  };

  const systemHealth = getSystemHealth();

  // Render individual widget
  const renderWidget = (config: WidgetConfig) => {
    const def = WIDGET_DEFINITIONS[config.type];

    switch (config.type) {
      case "tasks":
        return (
          <TasksWidget
            tasks={loopTasks}
            onComplete={onCompleteTask}
            onSelect={onSelectTask}
            limit={config.settings.limit as number || 5}
          />
        );

      case "habits":
        return (
          <HabitsWidget
            habits={loopHabits}
            completions={habitCompletions}
            onComplete={onCompleteHabit}
            onUncomplete={onUncompleteHabit}
            loop={loop}
          />
        );

      case "system_health":
        return (
          <SystemHealthWidget
            systems={loopSystems}
            habits={loopHabits}
            completions={habitCompletions}
            onCreateSystem={onOpenSystemBuilder}
          />
        );

      case "goals":
        return (
          <GoalsWidget goals={loopGoals} />
        );

      case "notes":
        return (
          <NotesWidget
            notes={loopNotes}
            loop={loop}
            onAdd={onAddNote}
            onUpdate={onUpdateNote}
          />
        );

      case "timer":
        return (
          <TimerWidget
            defaultMinutes={config.settings.defaultMinutes as number || 25}
            breakMinutes={config.settings.breakMinutes as number || 5}
          />
        );

      case "calendar":
        return (
          <CalendarWidget
            tasks={loopTasks}
            daysAhead={config.settings.daysAhead as number || 7}
          />
        );

      case "quick_links":
        return (
          <QuickLinksWidget loop={loop} />
        );

      case "babysitter":
        return (
          <BabysitterWidget
            caregivers={caregivers}
            sessions={babysitterSessions}
            onAddSession={onAddBabysitterSession}
            onUpdateSession={onUpdateBabysitterSession}
            onDeleteSession={onDeleteBabysitterSession}
            onAddCaregiver={onAddCaregiver}
            onUpdateCaregiver={onUpdateCaregiver}
            onDeactivateCaregiver={onDeactivateCaregiver}
          />
        );

      case "health_data":
        return <HealthWidget />;

      case "google_calendar":
        return (
          <GoogleCalendarWidget
            loop={loop}
            daysAhead={config.settings.daysAhead as number || 7}
          />
        );

      case "spotify":
        return <SpotifyWidget />;

      case "wealth":
        return <WealthWidget />;

      case "budget":
        return <BudgetWidget />;

      case "media":
        return <MediaWidget />;

      case "sleep_readiness":
        return <SleepReadinessWidget />;

      case "activity":
        return <ActivityWidget />;

      case "nutrition":
        return <NutritionWidget />;

      case "hooomz":
        return <HooomzWidget />;

      case "hooomz_life":
        return <HooomzLifeWidget />;

      case "meditation":
        return <MeditationWidget />;

      case "weather":
        return <WeatherWidget />;

      case "good_times":
        return <GoodTimesWidget />;

      case "steps":
        return <StepsWidget />;

      default:
        return (
          <div className="widget-placeholder">
            <span className="widget-placeholder-icon">{def.icon}</span>
            <span className="widget-placeholder-name">{def.name}</span>
            <span className="widget-placeholder-hint">Coming soon</span>
          </div>
        );
    }
  };

  return (
    <div className="loop-dashboard" style={{ "--loop-color": loopColor } as React.CSSProperties}>
      <div className="loop-dashboard-header">
        <div className="loop-dashboard-title">
          {onBack && (
            <button className="back-btn" onClick={onBack} title="Back to Loops">
              ←
            </button>
          )}
          <span className="loop-icon">{loopDef.icon}</span>
          <h1>{loop}</h1>
        </div>
        <div className="loop-dashboard-actions">
          <button
            className="dashboard-action-btn"
            onClick={() => setShowWidgetPicker(true)}
          >
            + Add Widget
          </button>
        </div>
      </div>

      <div className="loop-dashboard-stats">
        <div className="stat-card">
          <span className="stat-value">{loopTasks.length}</span>
          <span className="stat-label">Active Tasks</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{loopHabits.length}</span>
          <span className="stat-label">Habits</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{loopSystems.length}</span>
          <span className="stat-label">Systems</span>
        </div>
        {systemHealth !== null && (
          <div className="stat-card stat-card--health">
            <span className="stat-value">{systemHealth}%</span>
            <span className="stat-label">System Health</span>
          </div>
        )}
      </div>

      <div className="loop-dashboard-widgets">
        {dashboard.widgets.map(widget => {
          const def = WIDGET_DEFINITIONS[widget.type];
          const availableSizes = def.availableSizes;

          const changeSize = (newSize: WidgetSize) => {
            onUpdateDashboard({
              ...dashboard,
              widgets: dashboard.widgets.map(w =>
                w.id === widget.id ? { ...w, size: newSize } : w
              ),
              updatedAt: new Date().toISOString(),
            });
          };

          return (
            <div
              key={widget.id}
              className={`widget-container ${getWidgetGridClass(widget.size)}`}
            >
              <div className="widget-header">
                <span className="widget-icon">{def.icon}</span>
                <span className="widget-title">
                  {widget.title || def.name}
                </span>
                <div className="widget-controls">
                  {availableSizes.length > 1 && (
                    <div className="widget-size-controls">
                      {availableSizes.map(size => (
                        <button
                          key={size}
                          className={`widget-size-btn ${widget.size === size ? "active" : ""}`}
                          onClick={() => changeSize(size)}
                          title={size.charAt(0).toUpperCase() + size.slice(1)}
                        >
                          {size === "small" ? "S" : size === "medium" ? "M" : size === "large" ? "L" : "F"}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    className="widget-remove-btn"
                    onClick={() => {
                      onUpdateDashboard({
                        ...dashboard,
                        widgets: dashboard.widgets.filter(w => w.id !== widget.id),
                        updatedAt: new Date().toISOString(),
                      });
                    }}
                    title="Remove widget"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="widget-content">
                {renderWidget(widget)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Widget Picker Modal */}
      {showWidgetPicker && (
        <WidgetPicker
          onSelect={(type) => {
            const def = WIDGET_DEFINITIONS[type];
            const newWidget: WidgetConfig = {
              id: `widget_${Date.now()}`,
              type,
              size: def.defaultSize,
              position: { row: 0, col: 0 },
              settings: { ...def.defaultSettings },
            };
            onUpdateDashboard({
              ...dashboard,
              widgets: [...dashboard.widgets, newWidget],
              updatedAt: new Date().toISOString(),
            });
            setShowWidgetPicker(false);
          }}
          onClose={() => setShowWidgetPicker(false)}
          existingTypes={dashboard.widgets.map(w => w.type)}
        />
      )}
    </div>
  );
}

// Widget Picker Modal
function WidgetPicker({
  onSelect,
  onClose,
  existingTypes,
}: {
  onSelect: (type: WidgetType) => void;
  onClose: () => void;
  existingTypes: WidgetType[];
}) {
  const availableWidgets = Object.values(WIDGET_DEFINITIONS).filter(
    def => !existingTypes.includes(def.type)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="widget-picker-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Widget</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="widget-picker-grid">
          {availableWidgets.map(def => (
            <button
              key={def.type}
              className="widget-picker-item"
              onClick={() => onSelect(def.type)}
            >
              <span className="widget-picker-icon">{def.icon}</span>
              <span className="widget-picker-name">{def.name}</span>
              <span className="widget-picker-desc">{def.description}</span>
            </button>
          ))}
        </div>
        {availableWidgets.length === 0 && (
          <div className="widget-picker-empty">
            All widgets have been added to this dashboard.
          </div>
        )}
      </div>
    </div>
  );
}

// Individual Widget Components

function TasksWidget({
  tasks,
  onComplete,
  onSelect,
  limit,
}: {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  onSelect: (taskId: string) => void;
  limit: number;
}) {
  const displayTasks = tasks.slice(0, limit);

  return (
    <div className="tasks-widget">
      {displayTasks.map(task => (
        <div key={task.id} className="tasks-widget-item" onClick={() => onSelect(task.id)}>
          <button
            className="tasks-widget-check"
            onClick={(e) => {
              e.stopPropagation();
              onComplete(task.id);
            }}
          >
            ○
          </button>
          <span className="tasks-widget-title">{task.title}</span>
        </div>
      ))}
      {tasks.length === 0 && (
        <div className="tasks-widget-empty">No tasks</div>
      )}
      {tasks.length > limit && (
        <div className="tasks-widget-more">+{tasks.length - limit} more</div>
      )}
    </div>
  );
}

function SystemHealthWidget({
  systems,
  habits,
  completions,
  onCreateSystem,
}: {
  systems: System[];
  habits: Habit[];
  completions: HabitCompletion[];
  onCreateSystem: () => void;
}) {
  if (systems.length === 0) {
    return (
      <div className="system-health-widget system-health-widget--empty">
        <p>No behavior systems yet</p>
        <button className="create-system-btn" onClick={onCreateSystem}>
          + Create System
        </button>
      </div>
    );
  }

  return (
    <div className="system-health-widget">
      {systems.map(system => (
        <div key={system.id} className="system-health-item">
          <div className="system-health-header">
            <span className="system-health-title">{system.title}</span>
            <span className="system-health-score">
              {system.healthScore || 0}%
            </span>
          </div>
          <div className="system-health-bar">
            <div
              className="system-health-fill"
              style={{ width: `${system.healthScore || 0}%` }}
            />
          </div>
          <div className="system-health-habits">
            {system.habitIds.length} habits
          </div>
        </div>
      ))}
    </div>
  );
}

function GoalsWidget({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) {
    return (
      <div className="goals-widget goals-widget--empty">
        <p>No goals set for this loop</p>
      </div>
    );
  }

  return (
    <div className="goals-widget">
      {goals.slice(0, 3).map(goal => (
        <div key={goal.id} className="goals-widget-item">
          <span className="goals-widget-title">{goal.title}</span>
          <div className="goals-widget-progress">
            <div
              className="goals-widget-progress-fill"
              style={{ width: `${goal.progress || 0}%` }}
            />
          </div>
          <span className="goals-widget-percent">{goal.progress || 0}%</span>
        </div>
      ))}
    </div>
  );
}

function NotesWidget({
  notes,
  loop,
  onAdd,
  onUpdate,
}: {
  notes: Note[];
  loop: LoopId;
  onAdd: (note: Note) => void;
  onUpdate: (note: Note) => void;
}) {
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: `note_${Date.now()}`,
      title: newNote.split("\n")[0].slice(0, 50),
      content: newNote,
      loop,
      pinned: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onAdd(note);
    setNewNote("");
  };

  return (
    <div className="notes-widget">
      <div className="notes-widget-input">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Quick note..."
          rows={2}
        />
        <button
          className="notes-widget-add"
          onClick={handleAddNote}
          disabled={!newNote.trim()}
        >
          +
        </button>
      </div>
      <div className="notes-widget-list">
        {notes.slice(0, 5).map(note => (
          <div key={note.id} className="notes-widget-item">
            <span className="notes-widget-content">
              {note.content.slice(0, 100)}
              {note.content.length > 100 && "..."}
            </span>
          </div>
        ))}
      </div>
      {notes.length === 0 && (
        <div className="notes-widget-empty">No notes yet</div>
      )}
    </div>
  );
}

// Timer Widget - Pomodoro focus timer
function TimerWidget({
  defaultMinutes,
  breakMinutes,
}: {
  defaultMinutes: number;
  breakMinutes: number;
}) {
  const [timeLeft, setTimeLeft] = useState(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished - switch modes
      if (isBreak) {
        setTimeLeft(defaultMinutes * 60);
        setIsBreak(false);
      } else {
        setTimeLeft(breakMinutes * 60);
        setIsBreak(true);
      }
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak, defaultMinutes, breakMinutes]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(isBreak ? breakMinutes * 60 : defaultMinutes * 60);
  };

  const progress = isBreak
    ? ((breakMinutes * 60 - timeLeft) / (breakMinutes * 60)) * 100
    : ((defaultMinutes * 60 - timeLeft) / (defaultMinutes * 60)) * 100;

  return (
    <div className="timer-widget">
      <div className="timer-display">
        <div className="timer-progress-ring">
          <svg viewBox="0 0 100 100">
            <circle
              className="timer-bg-circle"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="6"
            />
            <circle
              className="timer-progress-circle"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="6"
              strokeDasharray={`${progress * 2.83} 283`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="timer-time">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
        </div>
      </div>
      <div className="timer-label">{isBreak ? "Break" : "Focus"}</div>
      <div className="timer-controls">
        <button
          className={`timer-btn ${isRunning ? "pause" : "start"}`}
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? "⏸" : "▶"}
        </button>
        <button className="timer-btn reset" onClick={reset}>
          ↺
        </button>
      </div>
    </div>
  );
}

// Calendar Widget - Actual month view calendar
function CalendarWidget({
  tasks,
}: {
  tasks: Task[];
  daysAhead?: number; // kept for backwards compatibility but not used
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get calendar data for current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  // Group tasks by date
  const tasksByDate: Record<string, Task[]> = {};
  tasks.forEach((task) => {
    if (task.dueDate) {
      if (!tasksByDate[task.dueDate]) {
        tasksByDate[task.dueDate] = [];
      }
      tasksByDate[task.dueDate].push(task);
    }
  });

  // Build calendar grid (6 rows x 7 days)
  const calendarDays: Array<{ day: number | null; dateStr: string; isToday: boolean; isCurrentMonth: boolean }> = [];

  // Previous month's trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const date = new Date(year, month - 1, day);
    calendarDays.push({
      day,
      dateStr: date.toISOString().split("T")[0],
      isToday: false,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split("T")[0];
    const todayStr = today.toISOString().split("T")[0];
    calendarDays.push({
      day,
      dateStr,
      isToday: dateStr === todayStr,
      isCurrentMonth: true,
    });
  }

  // Next month's leading days to fill grid
  const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    calendarDays.push({
      day,
      dateStr: date.toISOString().split("T")[0],
      isToday: false,
      isCurrentMonth: false,
    });
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="calendar-widget calendar-widget--month">
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={prevMonth}>‹</button>
        <span className="calendar-month-title" onClick={goToToday}>{monthName}</span>
        <button className="calendar-nav-btn" onClick={nextMonth}>›</button>
      </div>

      <div className="calendar-weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {calendarDays.map((dayInfo, idx) => {
          const dayTasks = tasksByDate[dayInfo.dateStr] || [];
          return (
            <div
              key={idx}
              className={`calendar-cell ${dayInfo.isToday ? "today" : ""} ${dayInfo.isCurrentMonth ? "" : "other-month"}`}
            >
              <span className="calendar-day-number">{dayInfo.day}</span>
              {dayTasks.length > 0 && (
                <div className="calendar-task-dots">
                  {dayTasks.slice(0, 3).map((_, i) => (
                    <span key={i} className="calendar-task-dot" />
                  ))}
                  {dayTasks.length > 3 && <span className="calendar-task-more">+</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Quick Links Widget - Bookmarks and resources
function QuickLinksWidget({ loop }: { loop: LoopId }) {
  const [links, setLinks] = useState<Array<{ id: string; title: string; url: string }>>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  // Load links from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem(`quicklinks_${loop}`);
    if (stored) {
      try {
        setLinks(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse quick links");
      }
    }
  }, [loop]);

  // Save links to localStorage
  const saveLinks = (newLinks: typeof links) => {
    localStorage.setItem(`quicklinks_${loop}`, JSON.stringify(newLinks));
    setLinks(newLinks);
  };

  const addLink = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    const newLink = {
      id: `link_${Date.now()}`,
      title: newTitle,
      url: newUrl.startsWith("http") ? newUrl : `https://${newUrl}`,
    };
    saveLinks([...links, newLink]);
    setNewTitle("");
    setNewUrl("");
    setShowAdd(false);
  };

  const removeLink = (id: string) => {
    saveLinks(links.filter((l) => l.id !== id));
  };

  return (
    <div className="quicklinks-widget">
      <div className="quicklinks-list">
        {links.map((link) => (
          <div key={link.id} className="quicklink-item">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="quicklink-link"
            >
              <span className="quicklink-icon">🔗</span>
              <span className="quicklink-title">{link.title}</span>
            </a>
            <button
              className="quicklink-remove"
              onClick={() => removeLink(link.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {showAdd ? (
        <div className="quicklink-add-form">
          <input
            type="text"
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="quicklink-input"
          />
          <input
            type="text"
            placeholder="URL"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="quicklink-input"
          />
          <div className="quicklink-add-actions">
            <button className="quicklink-save" onClick={addLink}>
              Add
            </button>
            <button className="quicklink-cancel" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className="quicklink-add-btn" onClick={() => setShowAdd(true)}>
          + Add Link
        </button>
      )}

      {links.length === 0 && !showAdd && (
        <div className="quicklinks-empty">No links yet</div>
      )}
    </div>
  );
}

export default LoopDashboard;
