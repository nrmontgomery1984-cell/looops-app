// Calendar View - Shows Google Calendar events and tasks side-by-side per day
import { useState, useEffect } from "react";
import { Task, LoopId, LoopStateType, LOOP_DEFINITIONS, LOOP_COLORS, parseLocalDate } from "../../types";

type CalendarViewProps = {
  tasks: Task[];
  loopStates: Record<LoopId, { currentState: LoopStateType }>;
  onSelectTask: (taskId: string) => void;
  onSelectDate: (date: string) => void;
  onAddTask: (date: string) => void;
};

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location?: string;
  calendarName: string;
  color?: string;
}

function getCalendarTokens(): { access_token: string } | null {
  try {
    const stored = localStorage.getItem('looops_google_calendar_tokens');
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getTaskUrgencyColor(task: Task): string {
  if (!task.dueDate) return "#737390";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = parseLocalDate(task.dueDate);
  if (!dueDate) return "#737390";
  const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff < 0) return "#F27059"; // Overdue - Coral
  if (daysDiff === 0) return "#F4B942"; // Today - Amber
  return "#73A58C"; // Future - Sage
}

function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 1: return "P1";
    case 2: return "P2";
    case 3: return "P3";
    case 4: return "P4";
    default: return "";
  }
}

export function CalendarView({
  tasks,
  loopStates,
  onSelectTask,
  onAddTask,
}: CalendarViewProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConnectionAndFetch();
  }, []);

  const checkConnectionAndFetch = async () => {
    const tokens = getCalendarTokens();
    if (!tokens?.access_token) {
      setIsConnected(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/calendar?action=week', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` },
      });
      const data = await res.json();

      if (data.needsReauth) {
        localStorage.removeItem('looops_google_calendar_tokens');
        setIsConnected(false);
        return;
      }

      if (data.source === 'google' && data.data) {
        setEvents(data.data);
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch {
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/oauth?provider=google_calendar&action=auth';
  };

  // Group events by date
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  events.forEach(event => {
    const dateKey = event.startTime.split('T')[0];
    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
    eventsByDate[dateKey].push(event);
  });

  // Group tasks by date
  const tasksByDate: Record<string, Task[]> = {};
  const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'dropped');
  activeTasks.forEach(task => {
    if (task.dueDate) {
      const dateKey = task.dueDate.split('T')[0];
      if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
      tasksByDate[dateKey].push(task);
    }
  });

  // Sort tasks within each day by priority
  Object.keys(tasksByDate).forEach(date => {
    tasksByDate[date].sort((a, b) => (a.priority || 4) - (b.priority || 4));
  });

  // Get next 7 days
  const today = new Date().toISOString().split('T')[0];
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }

  // Get overdue tasks (before today)
  const overdueTasks = activeTasks.filter(t => {
    if (!t.dueDate) return false;
    return t.dueDate.split('T')[0] < today;
  }).sort((a, b) => (a.priority || 4) - (b.priority || 4));

  // Render day content (events + tasks side by side)
  const renderDayContent = (day: string, isToday: boolean) => {
    const dayEvents = eventsByDate[day] || [];
    const dayTasks = tasksByDate[day] || [];
    const dateObj = new Date(day + 'T12:00:00');

    // Get loop state colors for visual indication
    const getLoopStateIndicator = (loopId: LoopId) => {
      const state = loopStates[loopId]?.currentState || 'MAINTAIN';
      if (state === 'BUILD') return '🔥';
      if (state === 'RECOVER') return '⚡';
      if (state === 'HIBERNATE') return '💤';
      return null;
    };

    return (
      <div key={day} className={`calendar-day-row ${isToday ? 'today' : ''}`}>
        <div className="calendar-day-label">
          <span className="calendar-day-name">
            {isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
          </span>
          <span className="calendar-day-date">
            {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="calendar-day-content">
          {/* Events Column */}
          <div className="calendar-events-column">
            <div className="calendar-column-header">
              <span className="calendar-column-icon">📅</span>
              <span>Events</span>
              {dayEvents.length > 0 && <span className="calendar-count">{dayEvents.length}</span>}
            </div>
            {dayEvents.length === 0 ? (
              <div className="calendar-empty-slot">No events</div>
            ) : (
              <div className="calendar-items">
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className="calendar-event-item"
                    style={{ borderLeftColor: event.color || '#4285f4' }}
                  >
                    <div className="calendar-event-time">
                      {event.allDay ? 'All day' : formatTime(event.startTime)}
                    </div>
                    <div className="calendar-event-title">{event.title}</div>
                    {event.location && (
                      <div className="calendar-event-location">📍 {event.location}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks Column */}
          <div className="calendar-tasks-column">
            <div className="calendar-column-header">
              <span className="calendar-column-icon">✓</span>
              <span>Tasks</span>
              {dayTasks.length > 0 && <span className="calendar-count">{dayTasks.length}</span>}
              <button
                className="calendar-add-btn"
                onClick={() => onAddTask(day)}
                title="Add task"
              >
                +
              </button>
            </div>
            {dayTasks.length === 0 ? (
              <div className="calendar-empty-slot">
                <button className="calendar-add-task-inline" onClick={() => onAddTask(day)}>
                  + Add task
                </button>
              </div>
            ) : (
              <div className="calendar-items">
                {dayTasks.map(task => {
                  const loop = LOOP_DEFINITIONS[task.loop];
                  const loopColor = LOOP_COLORS[task.loop];
                  const stateIndicator = getLoopStateIndicator(task.loop);

                  return (
                    <div
                      key={task.id}
                      className="calendar-task-item"
                      onClick={() => onSelectTask(task.id)}
                    >
                      <span
                        className="calendar-task-priority"
                        style={{
                          backgroundColor: task.priority === 1 ? '#F27059' :
                                          task.priority === 2 ? '#F4B942' :
                                          '#737390'
                        }}
                      >
                        {getPriorityLabel(task.priority || 4)}
                      </span>
                      <span className="calendar-task-title">{task.title}</span>
                      <span
                        className="calendar-task-loop"
                        style={{ background: loopColor.bg, color: loopColor.text, borderColor: loopColor.border }}
                      >
                        {loop.icon}
                        {stateIndicator && <span className="calendar-task-state">{stateIndicator}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Not connected - show prompt but still display tasks
  if (isConnected === false) {
    return (
      <div className="calendar-view calendar-view--no-cal">
        <div className="calendar-header">
          <h3>Week View</h3>
          <button className="calendar-connect-btn-small" onClick={handleConnect}>
            <span className="calendar-connect-icon-small">📅</span>
            Connect Google Calendar
          </button>
        </div>

        <div className="calendar-week-grid">
          {/* Overdue section */}
          {overdueTasks.length > 0 && (
            <div className="calendar-day-row overdue">
              <div className="calendar-day-label">
                <span className="calendar-day-name overdue-label">Overdue</span>
                <span className="calendar-day-date">{overdueTasks.length} tasks</span>
              </div>
              <div className="calendar-day-content">
                <div className="calendar-events-column calendar-events-column--disabled">
                  <div className="calendar-column-header">
                    <span className="calendar-column-icon">📅</span>
                    <span>Events</span>
                  </div>
                  <div className="calendar-empty-slot">Connect calendar</div>
                </div>
                <div className="calendar-tasks-column">
                  <div className="calendar-column-header">
                    <span className="calendar-column-icon">⚠️</span>
                    <span>Overdue</span>
                    <span className="calendar-count overdue">{overdueTasks.length}</span>
                  </div>
                  <div className="calendar-items">
                    {overdueTasks.slice(0, 5).map(task => {
                      const loop = LOOP_DEFINITIONS[task.loop];
                      const loopColor = LOOP_COLORS[task.loop];
                      return (
                        <div
                          key={task.id}
                          className="calendar-task-item overdue"
                          onClick={() => onSelectTask(task.id)}
                        >
                          <span className="calendar-task-priority" style={{ backgroundColor: '#F27059' }}>
                            {getPriorityLabel(task.priority || 4)}
                          </span>
                          <span className="calendar-task-title">{task.title}</span>
                          <span
                            className="calendar-task-loop"
                            style={{ background: loopColor.bg, color: loopColor.text }}
                          >
                            {loop.icon}
                          </span>
                        </div>
                      );
                    })}
                    {overdueTasks.length > 5 && (
                      <div className="calendar-more-tasks">+{overdueTasks.length - 5} more</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {days.map(day => {
            const isToday = day === today;
            const dayTasks = tasksByDate[day] || [];
            const dateObj = new Date(day + 'T12:00:00');

            return (
              <div key={day} className={`calendar-day-row ${isToday ? 'today' : ''}`}>
                <div className="calendar-day-label">
                  <span className="calendar-day-name">
                    {isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="calendar-day-date">
                    {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="calendar-day-content">
                  <div className="calendar-events-column calendar-events-column--disabled">
                    <div className="calendar-column-header">
                      <span className="calendar-column-icon">📅</span>
                      <span>Events</span>
                    </div>
                    <div className="calendar-empty-slot">Connect calendar</div>
                  </div>
                  <div className="calendar-tasks-column">
                    <div className="calendar-column-header">
                      <span className="calendar-column-icon">✓</span>
                      <span>Tasks</span>
                      {dayTasks.length > 0 && <span className="calendar-count">{dayTasks.length}</span>}
                      <button className="calendar-add-btn" onClick={() => onAddTask(day)}>+</button>
                    </div>
                    {dayTasks.length === 0 ? (
                      <div className="calendar-empty-slot">
                        <button className="calendar-add-task-inline" onClick={() => onAddTask(day)}>
                          + Add task
                        </button>
                      </div>
                    ) : (
                      <div className="calendar-items">
                        {dayTasks.map(task => {
                          const loop = LOOP_DEFINITIONS[task.loop];
                          const loopColor = LOOP_COLORS[task.loop];
                          return (
                            <div
                              key={task.id}
                              className="calendar-task-item"
                              onClick={() => onSelectTask(task.id)}
                            >
                              <span
                                className="calendar-task-priority"
                                style={{
                                  backgroundColor: task.priority === 1 ? '#F27059' :
                                                  task.priority === 2 ? '#F4B942' :
                                                  '#737390'
                                }}
                              >
                                {getPriorityLabel(task.priority || 4)}
                              </span>
                              <span className="calendar-task-title">{task.title}</span>
                              <span
                                className="calendar-task-loop"
                                style={{ background: loopColor.bg, color: loopColor.text }}
                              >
                                {loop.icon}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Loading
  if (isConnected === null || loading) {
    return (
      <div className="calendar-view">
        <div className="calendar-loading">
          <div className="spinner" />
          <span>Loading calendar...</span>
        </div>
      </div>
    );
  }

  // Connected - full view with events and tasks
  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <h3>Week View</h3>
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="calendar-open-btn"
        >
          Open Google Calendar ↗
        </a>
      </div>

      <div className="calendar-week-grid">
        {/* Overdue section */}
        {overdueTasks.length > 0 && (
          <div className="calendar-day-row overdue">
            <div className="calendar-day-label">
              <span className="calendar-day-name overdue-label">Overdue</span>
              <span className="calendar-day-date">{overdueTasks.length} tasks</span>
            </div>
            <div className="calendar-day-content">
              <div className="calendar-events-column">
                <div className="calendar-column-header">
                  <span className="calendar-column-icon">📅</span>
                  <span>Events</span>
                </div>
                <div className="calendar-empty-slot">—</div>
              </div>
              <div className="calendar-tasks-column">
                <div className="calendar-column-header">
                  <span className="calendar-column-icon">⚠️</span>
                  <span>Overdue</span>
                  <span className="calendar-count overdue">{overdueTasks.length}</span>
                </div>
                <div className="calendar-items">
                  {overdueTasks.slice(0, 5).map(task => {
                    const loop = LOOP_DEFINITIONS[task.loop];
                    const loopColor = LOOP_COLORS[task.loop];
                    const stateIndicator = loopStates[task.loop]?.currentState === 'BUILD' ? '🔥' : null;
                    return (
                      <div
                        key={task.id}
                        className="calendar-task-item overdue"
                        onClick={() => onSelectTask(task.id)}
                      >
                        <span className="calendar-task-priority" style={{ backgroundColor: '#F27059' }}>
                          {getPriorityLabel(task.priority || 4)}
                        </span>
                        <span className="calendar-task-title">{task.title}</span>
                        <span
                          className="calendar-task-loop"
                          style={{ background: loopColor.bg, color: loopColor.text }}
                        >
                          {loop.icon}
                          {stateIndicator}
                        </span>
                      </div>
                    );
                  })}
                  {overdueTasks.length > 5 && (
                    <div className="calendar-more-tasks">+{overdueTasks.length - 5} more overdue</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Each day */}
        {days.map(day => renderDayContent(day, day === today))}
      </div>
    </div>
  );
}

export default CalendarView;
