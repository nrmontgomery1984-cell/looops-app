// WeekDayTypesEditor - Quick week view for editing day types
// Accessible from Today view or anywhere for quick updates

import { useState, useMemo } from "react";
import { useApp, useSmartSchedule } from "../../context/AppContext";
import {
  DayType,
  BUILT_IN_DAY_TYPES,
  DEFAULT_DAY_TYPE_CONFIGS,
} from "../../types/dayTypes";
import {
  formatDateKey,
  getDayTypes,
  getMarkedDateDayTypes,
} from "../../engines/smartSchedulerEngine";

interface WeekDayTypesEditorProps {
  onClose?: () => void;
  compact?: boolean; // For inline display vs modal
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getUpcomingWeekDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
}

export function WeekDayTypesEditor({ onClose, compact = false }: WeekDayTypesEditorProps) {
  const { dispatch } = useApp();
  const smartSchedule = useSmartSchedule();

  const [editingDate, setEditingDate] = useState<string | null>(null);

  const weekDates = useMemo(() => getUpcomingWeekDates(), []);
  const today = new Date();
  const todayStr = formatDateKey(today);

  // Get current day types for each date
  const weekDayTypes = useMemo(() => {
    const types: Record<string, DayType[]> = {};
    weekDates.forEach((date) => {
      const dateKey = formatDateKey(date);
      types[dateKey] = getDayTypes(date, smartSchedule);
    });
    return types;
  }, [weekDates, smartSchedule]);

  const handleToggleDayType = (dateStr: string, dayType: DayType) => {
    const existing = smartSchedule.markedDates.find(m => m.date === dateStr);
    const currentTypes = existing ? getMarkedDateDayTypes(existing) : [];

    if (currentTypes.includes(dayType)) {
      // Remove this day type
      const newTypes = currentTypes.filter(dt => dt !== dayType);
      if (newTypes.length === 0) {
        dispatch({ type: "UNMARK_DATE", payload: dateStr });
      } else {
        dispatch({
          type: "MARK_DATE",
          payload: { date: dateStr, dayTypes: newTypes },
        });
      }
    } else {
      // Add this day type
      dispatch({
        type: "MARK_DATE",
        payload: { date: dateStr, dayTypes: [...currentTypes, dayType] },
      });
    }
  };

  const handleQuickSet = (dateStr: string, dayType: DayType) => {
    // Quick set replaces all types with just this one
    dispatch({
      type: "MARK_DATE",
      payload: { date: dateStr, dayType },
    });
    setEditingDate(null);
  };

  const handleClear = (dateStr: string) => {
    dispatch({ type: "UNMARK_DATE", payload: dateStr });
    setEditingDate(null);
  };

  // Get display config for a day
  const getDayDisplay = (dateStr: string) => {
    const types = weekDayTypes[dateStr] || ["regular"];
    if (types.length === 1) {
      const config = DEFAULT_DAY_TYPE_CONFIGS[types[0]];
      return { icon: config?.icon || "📅", color: config?.color || "#6366F1", label: config?.label || "Regular" };
    }
    // Multiple types - show first icon with count
    const firstConfig = DEFAULT_DAY_TYPE_CONFIGS[types[0]];
    return {
      icon: firstConfig?.icon || "📅",
      color: firstConfig?.color || "#6366F1",
      label: `${types.length} types`,
      multiple: true,
    };
  };

  return (
    <div className={`week-day-types-editor ${compact ? "compact" : ""}`}>
      {!compact && (
        <div className="week-editor-header">
          <h3>This Week's Day Types</h3>
          <p className="week-editor-hint">Tap a day to change its type</p>
          {onClose && (
            <button className="week-editor-close" onClick={onClose}>×</button>
          )}
        </div>
      )}

      <div className="week-editor-days">
        {weekDates.map((date) => {
          const dateStr = formatDateKey(date);
          const isToday = dateStr === todayStr;
          const display = getDayDisplay(dateStr);
          const currentTypes = weekDayTypes[dateStr] || ["regular"];
          const isEditing = editingDate === dateStr;

          return (
            <div key={dateStr} className={`week-editor-day ${isToday ? "today" : ""}`}>
              <button
                className="week-editor-day-btn"
                onClick={() => setEditingDate(isEditing ? null : dateStr)}
                style={{ borderColor: display.color }}
              >
                <span className="week-editor-day-name">
                  {DAY_NAMES[date.getDay()]}
                </span>
                <span className="week-editor-day-num">{date.getDate()}</span>
                <span
                  className="week-editor-day-type"
                  style={{ backgroundColor: display.color }}
                >
                  {display.icon}
                </span>
                {display.multiple && (
                  <span className="week-editor-day-multi">+{currentTypes.length - 1}</span>
                )}
              </button>

              {/* Day type picker dropdown */}
              {isEditing && (
                <div className="week-editor-picker">
                  <div className="week-editor-picker-header">
                    <span>Set day type for {DAY_NAMES[date.getDay()]} {date.getDate()}</span>
                    <button
                      className="week-editor-picker-close"
                      onClick={() => setEditingDate(null)}
                    >×</button>
                  </div>

                  <div className="week-editor-picker-types">
                    {BUILT_IN_DAY_TYPES.map((dt) => {
                      const config = DEFAULT_DAY_TYPE_CONFIGS[dt];
                      const isActive = currentTypes.includes(dt);
                      return (
                        <button
                          key={dt}
                          className={`week-editor-type-btn ${isActive ? "active" : ""}`}
                          onClick={() => handleToggleDayType(dateStr, dt)}
                          style={isActive ? { backgroundColor: config.color, borderColor: config.color } : {}}
                        >
                          <span className="week-editor-type-icon">{config.icon}</span>
                          <span className="week-editor-type-label">{config.label}</span>
                          {isActive && <span className="week-editor-type-check">✓</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom day types */}
                  {(smartSchedule.customDayTypes || []).length > 0 && (
                    <div className="week-editor-picker-custom">
                      {(smartSchedule.customDayTypes || []).map((customDt) => {
                        const isActive = currentTypes.includes(customDt.dayType);
                        return (
                          <button
                            key={customDt.dayType}
                            className={`week-editor-type-btn ${isActive ? "active" : ""}`}
                            onClick={() => handleToggleDayType(dateStr, customDt.dayType)}
                            style={isActive ? { backgroundColor: customDt.color, borderColor: customDt.color } : {}}
                          >
                            <span className="week-editor-type-icon">{customDt.icon}</span>
                            <span className="week-editor-type-label">{customDt.label}</span>
                            {isActive && <span className="week-editor-type-check">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button
                    className="week-editor-clear-btn"
                    onClick={() => handleClear(dateStr)}
                  >
                    Clear (auto-detect)
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!compact && (
        <div className="week-editor-footer">
          <p className="week-editor-note">
            Multiple types can be selected per day. Clear to use auto-detection (weekend/regular).
          </p>
        </div>
      )}
    </div>
  );
}

// Floating button to open the editor as a modal
export function WeekDayTypesButton() {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <>
      <button
        className="week-types-fab"
        onClick={() => setShowEditor(true)}
        title="Edit week's day types"
      >
        📅
      </button>

      {showEditor && (
        <div className="modal-overlay" onClick={() => setShowEditor(false)}>
          <div className="week-types-modal" onClick={(e) => e.stopPropagation()}>
            <WeekDayTypesEditor onClose={() => setShowEditor(false)} />
          </div>
        </div>
      )}
    </>
  );
}

export default WeekDayTypesEditor;
