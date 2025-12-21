// Calendar View - Monthly calendar with tasks

import React, { useState, useMemo } from "react";
import { Task, LoopId, LOOP_DEFINITIONS, LOOP_COLORS, LoopStateType } from "../../types";

type CalendarViewProps = {
  tasks: Task[];
  loopStates: Record<LoopId, { currentState: LoopStateType }>;
  onSelectTask: (taskId: string) => void;
  onSelectDate: (date: string) => void;
  onAddTask: (date: string) => void;
};

// Get urgency color for a task based on due date
function getTaskUrgencyColor(task: Task, referenceDate: Date): string {
  if (!task.dueDate) return "#737390"; // Navy Gray

  const dueDate = new Date(task.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  referenceDate.setHours(0, 0, 0, 0);
  const daysDiff = Math.floor((dueDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) return "#F27059"; // Coral - overdue
  if (daysDiff <= 3) return "#F4B942"; // Amber - soon
  return "#73A58C"; // Sage - ok
}

export function CalendarView({
  tasks,
  loopStates,
  onSelectTask,
  onSelectDate,
  onAddTask,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Get calendar data for the current month
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);

    // Start from Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End on Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      currentWeek.push(new Date(current));
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      current.setDate(current.getDate() + 1);
    }

    return { weeks, month, year };
  }, [currentMonth]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (task.dueDate && task.status !== "done" && task.status !== "dropped") {
        const dateKey = task.dueDate.split("T")[0];
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(task);
      }
    });
    return map;
  }, [tasks]);

  // Navigate months
  const goToPrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
    onSelectDate(today);
  };

  // Handle date selection
  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    setSelectedDate(dateStr);
    onSelectDate(dateStr);
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is in current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === calendarData.month;
  };

  // Get tasks for selected date
  const selectedDateTasks = selectedDate ? tasksByDate[selectedDate] || [] : [];

  const today = new Date();

  return (
    <div className="calendar-view">
      <div className="calendar-container">
        {/* Calendar Header */}
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={goToPrevMonth}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
          <div className="calendar-title">
            <h3>
              {currentMonth.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <button className="calendar-today-btn" onClick={goToToday}>
              Today
            </button>
          </div>
          <button className="calendar-nav-btn" onClick={goToNextMonth}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
            </svg>
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="calendar-weekdays">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {calendarData.weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="calendar-week">
              {week.map((date, dayIndex) => {
                const dateStr = date.toISOString().split("T")[0];
                const dayTasks = tasksByDate[dateStr] || [];
                const isSelected = selectedDate === dateStr;
                const inCurrentMonth = isCurrentMonth(date);
                const isTodayDate = isToday(date);

                return (
                  <div
                    key={dayIndex}
                    className={`calendar-day ${!inCurrentMonth ? "other-month" : ""} ${
                      isTodayDate ? "today" : ""
                    } ${isSelected ? "selected" : ""}`}
                    onClick={() => handleDateClick(date)}
                  >
                    <span className="calendar-day-number">{date.getDate()}</span>
                    {dayTasks.length > 0 && (
                      <div className="calendar-day-tasks">
                        {dayTasks.slice(0, 3).map((task, idx) => (
                          <div
                            key={task.id}
                            className="calendar-task-dot"
                            style={{
                              backgroundColor: getTaskUrgencyColor(task, today),
                            }}
                            title={task.title}
                          />
                        ))}
                        {dayTasks.length > 3 && (
                          <span className="calendar-task-more">+{dayTasks.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Date Panel */}
      <div className="calendar-detail-panel">
        {selectedDate ? (
          <>
            <div className="calendar-detail-header">
              <h4>
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h4>
              <button
                className="calendar-add-btn"
                onClick={() => onAddTask(selectedDate)}
                title="Add task"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                Add Task
              </button>
            </div>

            {selectedDateTasks.length === 0 ? (
              <div className="calendar-detail-empty">
                <p>No tasks scheduled for this day</p>
                <button
                  className="calendar-add-task-btn"
                  onClick={() => onAddTask(selectedDate)}
                >
                  Add a task
                </button>
              </div>
            ) : (
              <div className="calendar-detail-tasks">
                {selectedDateTasks.map((task) => {
                  const loop = LOOP_DEFINITIONS[task.loop];
                  const loopColor = LOOP_COLORS[task.loop];
                  const urgencyColor = getTaskUrgencyColor(task, today);

                  return (
                    <div
                      key={task.id}
                      className="calendar-task-item"
                      onClick={() => onSelectTask(task.id)}
                    >
                      <div
                        className="calendar-task-urgency"
                        style={{ backgroundColor: urgencyColor }}
                      />
                      <div className="calendar-task-content">
                        <span className="calendar-task-title">{task.title}</span>
                        <div className="calendar-task-meta">
                          <span
                            className="calendar-task-loop"
                            style={{
                              backgroundColor: loopColor.bg,
                              color: loopColor.text,
                            }}
                          >
                            {loop.icon} {loop.name}
                          </span>
                          {task.estimateMinutes && (
                            <span className="calendar-task-duration">
                              {task.estimateMinutes}min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="calendar-detail-empty">
            <p>Select a date to see tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarView;
