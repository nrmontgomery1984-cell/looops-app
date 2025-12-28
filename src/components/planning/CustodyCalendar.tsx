// CustodyCalendar - Calendar for marking dates with day types
import { useState, useMemo } from "react";
import { useApp, useSmartSchedule } from "../../context/AppContext";
import {
  DayType,
  DayTypeConfig,
  MarkedDate,
  BUILT_IN_DAY_TYPES,
  DEFAULT_DAY_TYPE_CONFIGS,
} from "../../types/dayTypes";
import {
  formatDateKey,
  getDayType,
  generateCustodyPattern,
} from "../../engines/smartSchedulerEngine";

type CustodyCalendarProps = {
  onClose?: () => void;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CustodyCalendar({ onClose }: CustodyCalendarProps) {
  const { dispatch } = useApp();
  const smartSchedule = useSmartSchedule();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDayType, setSelectedDayType] = useState<DayType>("custody");
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Get config for any day type (built-in or custom)
  const getConfigForDayType = (dayType: DayType): DayTypeConfig | undefined => {
    // Check built-in configs first
    if (dayType in DEFAULT_DAY_TYPE_CONFIGS) {
      return smartSchedule.dayTypeConfigs[dayType] || DEFAULT_DAY_TYPE_CONFIGS[dayType as keyof typeof DEFAULT_DAY_TYPE_CONFIGS];
    }
    // Check custom day types
    return (smartSchedule.customDayTypes || []).find(dt => dt.dayType === dayType);
  };

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: { date: Date | null; isCurrentMonth: boolean }[] = [];

    // Padding for days before the first of the month
    for (let i = 0; i < startPadding; i++) {
      const prevMonthDay = new Date(currentYear, currentMonth, -startPadding + i + 1);
      days.push({ date: prevMonthDay, isCurrentMonth: false });
    }

    // Days of the current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(currentYear, currentMonth, i), isCurrentMonth: true });
    }

    // Padding for days after the last of the month (to complete the grid)
    const endPadding = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= endPadding; i++) {
      const nextMonthDay = new Date(currentYear, currentMonth + 1, i);
      days.push({ date: nextMonthDay, isCurrentMonth: false });
    }

    return days;
  }, [currentMonth, currentYear]);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const handleDateClick = (date: Date) => {
    const dateStr = formatDateKey(date);
    const existing = smartSchedule.markedDates.find(m => m.date === dateStr);

    if (existing && existing.dayType === selectedDayType) {
      // Same type clicked - unmark
      dispatch({ type: "UNMARK_DATE", payload: dateStr });
    } else {
      // Mark with selected type
      dispatch({
        type: "MARK_DATE",
        payload: { date: dateStr, dayType: selectedDayType },
      });
    }
  };

  const handleBulkPattern = (pattern: "every_other_weekend" | "weekly" | "biweekly") => {
    const dates = generateCustodyPattern(
      new Date(),
      pattern,
      selectedDayType,
      6 // 6 months ahead
    );
    dispatch({ type: "BULK_MARK_DATES", payload: dates });
    setShowBulkModal(false);
  };

  const clearAllDates = () => {
    // Clear all marked dates of the selected type
    const remainingDates = smartSchedule.markedDates.filter(
      m => m.dayType !== selectedDayType
    );
    // This is a bit of a hack - we'll dispatch multiple unmarks
    smartSchedule.markedDates
      .filter(m => m.dayType === selectedDayType)
      .forEach(m => dispatch({ type: "UNMARK_DATE", payload: m.date }));
  };

  const getDayTypeForDate = (date: Date): DayType => {
    return getDayType(date, smartSchedule);
  };

  const isMarked = (date: Date): MarkedDate | undefined => {
    const dateStr = formatDateKey(date);
    return smartSchedule.markedDates.find(m => m.date === dateStr);
  };

  const isToday = (date: Date): boolean => {
    return formatDateKey(date) === formatDateKey(today);
  };

  return (
    <div className="custody-calendar">
      <div className="custody-calendar-header">
        <h3>Mark Your Calendar</h3>
        {onClose && (
          <button className="custody-close-btn" onClick={onClose}>
            &times;
          </button>
        )}
      </div>

      {/* Day Type Selector */}
      <div className="custody-type-selector">
        <label className="custody-type-label">Select day type to mark:</label>
        <div className="custody-type-chips">
          {/* Built-in day types (excluding regular and weekend) */}
          {BUILT_IN_DAY_TYPES.filter(t => t !== "regular" && t !== "weekend").map(dayType => {
            const config = DEFAULT_DAY_TYPE_CONFIGS[dayType];
            return (
              <button
                key={dayType}
                className={`custody-type-chip ${selectedDayType === dayType ? "selected" : ""}`}
                style={{
                  "--chip-color": config.color,
                } as React.CSSProperties}
                onClick={() => setSelectedDayType(dayType)}
              >
                <span className="custody-type-icon">{config.icon}</span>
                <span className="custody-type-name">{config.label}</span>
              </button>
            );
          })}
          {/* Custom day types */}
          {(smartSchedule.customDayTypes || []).map(customDt => (
            <button
              key={customDt.dayType}
              className={`custody-type-chip ${selectedDayType === customDt.dayType ? "selected" : ""}`}
              style={{
                "--chip-color": customDt.color,
              } as React.CSSProperties}
              onClick={() => setSelectedDayType(customDt.dayType)}
            >
              <span className="custody-type-icon">{customDt.icon}</span>
              <span className="custody-type-name">{customDt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="custody-bulk-actions">
        <button
          className="custody-bulk-btn"
          onClick={() => setShowBulkModal(true)}
        >
          Quick Patterns
        </button>
        <button
          className="custody-bulk-btn secondary"
          onClick={clearAllDates}
        >
          Clear {getConfigForDayType(selectedDayType)?.label || "Selected"}
        </button>
      </div>

      {/* Month Navigation */}
      <div className="custody-month-nav">
        <button className="custody-nav-btn" onClick={goToPreviousMonth}>
          &larr;
        </button>
        <div className="custody-month-display">
          <span className="custody-month-name">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <button className="custody-today-btn" onClick={goToToday}>
            Today
          </button>
        </div>
        <button className="custody-nav-btn" onClick={goToNextMonth}>
          &rarr;
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="custody-calendar-grid">
        {/* Day headers */}
        {DAY_NAMES.map(day => (
          <div key={day} className="custody-day-header">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map(({ date, isCurrentMonth }, idx) => {
          if (!date) return <div key={idx} className="custody-day empty" />;

          const marked = isMarked(date);
          const dayType = getDayTypeForDate(date);
          const config = DEFAULT_DAY_TYPE_CONFIGS[dayType];
          const isTodayDate = isToday(date);

          return (
            <button
              key={idx}
              className={`custody-day ${!isCurrentMonth ? "other-month" : ""} ${
                isTodayDate ? "today" : ""
              } ${marked ? "marked" : ""}`}
              style={{
                "--day-color": marked ? config.color : undefined,
              } as React.CSSProperties}
              onClick={() => handleDateClick(date)}
            >
              <span className="custody-day-number">{date.getDate()}</span>
              {marked && (
                <span className="custody-day-icon">{config.icon}</span>
              )}
              {!marked && dayType === "weekend" && (
                <span className="custody-day-dot" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="custody-legend">
        <span className="custody-legend-title">Legend:</span>
        {/* Built-in day types */}
        {BUILT_IN_DAY_TYPES.map(dayType => {
          const config = DEFAULT_DAY_TYPE_CONFIGS[dayType];
          const count = smartSchedule.markedDates.filter(m => m.dayType === dayType).length;
          if (dayType === "regular" || dayType === "weekend") {
            return (
              <span key={dayType} className="custody-legend-item">
                <span
                  className="custody-legend-dot"
                  style={{ background: config.color }}
                />
                <span>{config.label}</span>
              </span>
            );
          }
          return (
            <span key={dayType} className="custody-legend-item">
              <span
                className="custody-legend-dot"
                style={{ background: config.color }}
              />
              <span>{config.label} ({count})</span>
            </span>
          );
        })}
        {/* Custom day types */}
        {(smartSchedule.customDayTypes || []).map(customDt => {
          const count = smartSchedule.markedDates.filter(m => m.dayType === customDt.dayType).length;
          return (
            <span key={customDt.dayType} className="custody-legend-item">
              <span
                className="custody-legend-dot"
                style={{ background: customDt.color }}
              />
              <span>{customDt.label} ({count})</span>
            </span>
          );
        })}
      </div>

      {/* Bulk Pattern Modal */}
      {showBulkModal && (
        <div className="custody-modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="custody-modal" onClick={e => e.stopPropagation()}>
            <h4>Quick Patterns for {getConfigForDayType(selectedDayType)?.label || "Selected"}</h4>
            <p className="custody-modal-hint">
              Automatically mark dates for the next 6 months
            </p>
            <div className="custody-pattern-options">
              <button
                className="custody-pattern-btn"
                onClick={() => handleBulkPattern("every_other_weekend")}
              >
                <span className="custody-pattern-icon">📅</span>
                <span className="custody-pattern-name">Every Other Weekend</span>
                <span className="custody-pattern-desc">Sat & Sun, alternating weeks</span>
              </button>
              <button
                className="custody-pattern-btn"
                onClick={() => handleBulkPattern("weekly")}
              >
                <span className="custody-pattern-icon">🔄</span>
                <span className="custody-pattern-name">Weekly</span>
                <span className="custody-pattern-desc">Same day every week</span>
              </button>
              <button
                className="custody-pattern-btn"
                onClick={() => handleBulkPattern("biweekly")}
              >
                <span className="custody-pattern-icon">📆</span>
                <span className="custody-pattern-name">Bi-Weekly</span>
                <span className="custody-pattern-desc">Every two weeks</span>
              </button>
            </div>
            <button
              className="custody-modal-cancel"
              onClick={() => setShowBulkModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustodyCalendar;
