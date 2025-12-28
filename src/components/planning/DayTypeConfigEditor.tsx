// DayTypeConfigEditor - Configure settings for each day type
import { useState } from "react";
import { useApp, useSmartSchedule, useRoutines } from "../../context/AppContext";
import {
  DayType,
  DayTypeConfig,
  BUILT_IN_DAY_TYPES,
  DEFAULT_DAY_TYPE_CONFIGS,
  createCustomDayType,
  isCustomDayType,
} from "../../types/dayTypes";
import { ALL_LOOPS, LOOP_DEFINITIONS, LoopId } from "../../types/core";

const PRESET_COLORS = [
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#6366F1", // Indigo
  "#14B8A6", // Teal
];

const PRESET_ICONS = [
  "🏠", "🎮", "📚", "🎨", "🏃", "🧘", "🎵", "🎬",
  "👨‍👩‍👧", "🎯", "💼", "🌟", "🔧", "🚗", "🏥", "📝",
];

type DayTypeConfigEditorProps = {
  onClose?: () => void;
};

export function DayTypeConfigEditor({ onClose }: DayTypeConfigEditorProps) {
  const { dispatch } = useApp();
  const smartSchedule = useSmartSchedule();
  const { items: routines } = useRoutines();

  const [selectedDayType, setSelectedDayType] = useState<DayType>("custody");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newDayTypeName, setNewDayTypeName] = useState("");
  const [newDayTypeIcon, setNewDayTypeIcon] = useState("🎯");
  const [newDayTypeColor, setNewDayTypeColor] = useState(PRESET_COLORS[0]);

  // Get all day types (built-in + custom)
  const allDayTypes: DayType[] = [
    ...BUILT_IN_DAY_TYPES,
    ...(smartSchedule.customDayTypes || []).map(dt => dt.dayType),
  ];

  const config = smartSchedule.dayTypeConfigs[selectedDayType] || DEFAULT_DAY_TYPE_CONFIGS[selectedDayType];

  const updateConfig = (updates: Partial<DayTypeConfig>) => {
    dispatch({
      type: "UPDATE_DAY_TYPE_CONFIG",
      payload: {
        ...config,
        ...updates,
      },
    });
  };

  const updateCapacityMultiplier = (loopId: LoopId, value: number) => {
    updateConfig({
      loopCapacityMultipliers: {
        ...config.loopCapacityMultipliers,
        [loopId]: value,
      },
    });
  };

  const toggleRoutineDisabled = (routineId: string) => {
    const disabledRoutines = config.disabledRoutines || [];
    const isDisabled = disabledRoutines.includes(routineId);

    updateConfig({
      disabledRoutines: isDisabled
        ? disabledRoutines.filter(id => id !== routineId)
        : [...disabledRoutines, routineId],
    });
  };

  const getCapacityMultiplier = (loopId: LoopId): number => {
    return config.loopCapacityMultipliers?.[loopId] ?? 1.0;
  };

  const getCapacityLabel = (value: number): string => {
    if (value === 0) return "Off";
    if (value < 0.5) return "Minimal";
    if (value < 0.8) return "Reduced";
    if (value <= 1.2) return "Normal";
    if (value <= 1.5) return "Boosted";
    return "Maximum";
  };

  const getCapacityColor = (value: number): string => {
    if (value === 0) return "#737390";
    if (value < 0.8) return "#F4B942";
    if (value <= 1.2) return "#73A58C";
    return "#5a7fb8";
  };

  const handleCreateDayType = () => {
    if (!newDayTypeName.trim()) return;

    const newConfig = createCustomDayType(
      newDayTypeName.trim(),
      newDayTypeIcon,
      newDayTypeColor
    );

    dispatch({ type: "ADD_CUSTOM_DAY_TYPE", payload: newConfig });
    setSelectedDayType(newConfig.dayType);
    setShowCreateModal(false);
    setNewDayTypeName("");
    setNewDayTypeIcon("🎯");
    setNewDayTypeColor(PRESET_COLORS[0]);
  };

  const handleDeleteDayType = (dayTypeId: string) => {
    if (!isCustomDayType(dayTypeId)) return;

    const confirmed = window.confirm(
      "Delete this custom day type? All dates marked with this type will be unmarked."
    );
    if (!confirmed) return;

    dispatch({ type: "DELETE_CUSTOM_DAY_TYPE", payload: dayTypeId });

    // Select first built-in type if we deleted the selected one
    if (selectedDayType === dayTypeId) {
      setSelectedDayType("regular");
    }
  };

  const openEditModal = () => {
    if (!isCustomDayType(selectedDayType) || !config) return;
    setNewDayTypeName(config.label);
    setNewDayTypeIcon(config.icon || "🎯");
    setNewDayTypeColor(config.color);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!newDayTypeName.trim() || !isCustomDayType(selectedDayType)) return;

    const updatedConfig: DayTypeConfig = {
      ...config,
      label: newDayTypeName.trim(),
      icon: newDayTypeIcon,
      color: newDayTypeColor,
    };

    dispatch({ type: "UPDATE_CUSTOM_DAY_TYPE", payload: updatedConfig });
    setShowEditModal(false);
  };

  const getConfigForDayType = (dayType: DayType): DayTypeConfig => {
    return smartSchedule.dayTypeConfigs[dayType] || DEFAULT_DAY_TYPE_CONFIGS[dayType as keyof typeof DEFAULT_DAY_TYPE_CONFIGS];
  };

  return (
    <div className="daytype-config-editor">
      <div className="daytype-config-header">
        <h3>Configure Day Types</h3>
        {onClose && (
          <button className="daytype-close-btn" onClick={onClose}>
            &times;
          </button>
        )}
      </div>

      {/* Day Type Tabs */}
      <div className="daytype-tabs">
        {allDayTypes.map(dayType => {
          const dtConfig = getConfigForDayType(dayType);
          if (!dtConfig) return null;
          return (
            <button
              key={dayType}
              className={`daytype-tab ${selectedDayType === dayType ? "active" : ""} ${isCustomDayType(dayType) ? "custom" : ""}`}
              style={{
                "--tab-color": dtConfig.color,
              } as React.CSSProperties}
              onClick={() => setSelectedDayType(dayType)}
            >
              <span className="daytype-tab-icon">{dtConfig.icon}</span>
              <span className="daytype-tab-label">{dtConfig.label}</span>
            </button>
          );
        })}
        <button
          className="daytype-tab daytype-tab--add"
          onClick={() => setShowCreateModal(true)}
          title="Create custom day type"
        >
          <span className="daytype-tab-icon">+</span>
          <span className="daytype-tab-label">Add</span>
        </button>
      </div>

      {/* Selected Day Type Config */}
      <div className="daytype-config-content">
        <div className="daytype-info-card">
          <div
            className="daytype-info-badge"
            style={{ background: config.color }}
          >
            <span className="daytype-info-icon">{config.icon}</span>
          </div>
          <div className="daytype-info-details">
            <h4>{config.label}</h4>
            <p className="daytype-info-hint">
              {selectedDayType === "regular" && "Normal workdays - weekdays that aren't marked as something else"}
              {selectedDayType === "weekend" && "Saturdays and Sundays - automatically detected"}
              {selectedDayType === "custody" && "Days when your daughter is with you"}
              {selectedDayType === "non_custody" && "Solo days during custody weeks"}
              {selectedDayType === "holiday" && "Special days off work"}
              {selectedDayType === "travel" && "Days when you're traveling"}
              {isCustomDayType(selectedDayType) && "Custom day type - mark dates in the calendar"}
            </p>
          </div>
          {isCustomDayType(selectedDayType) && (
            <div className="daytype-info-actions">
              <button
                className="daytype-edit-btn"
                onClick={openEditModal}
                title="Edit this custom day type"
              >
                ✏️
              </button>
              <button
                className="daytype-delete-btn"
                onClick={() => handleDeleteDayType(selectedDayType)}
                title="Delete this custom day type"
              >
                🗑️
              </button>
            </div>
          )}
        </div>

        {/* Loop Capacity Multipliers */}
        <div className="daytype-section">
          <h4>Loop Capacity Adjustments</h4>
          <p className="daytype-section-hint">
            Adjust how much capacity each loop has on {config.label.toLowerCase()} days
          </p>

          <div className="daytype-capacity-grid">
            {ALL_LOOPS.filter(id => id !== "Meaning").map(loopId => {
              const loop = LOOP_DEFINITIONS[loopId];
              const value = getCapacityMultiplier(loopId);
              const label = getCapacityLabel(value);
              const color = getCapacityColor(value);

              return (
                <div key={loopId} className="daytype-capacity-item">
                  <div className="daytype-capacity-header">
                    <span className="daytype-capacity-icon">{loop.icon}</span>
                    <span className="daytype-capacity-name">{loop.name}</span>
                    <span
                      className="daytype-capacity-label"
                      style={{ color }}
                    >
                      {label}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={value}
                    onChange={(e) => updateCapacityMultiplier(loopId, parseFloat(e.target.value))}
                    className="daytype-capacity-slider"
                    style={{
                      "--slider-color": color,
                    } as React.CSSProperties}
                  />
                  <div className="daytype-capacity-scale">
                    <span>Off</span>
                    <span>Normal</span>
                    <span>Max</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Routine Toggles */}
        {routines.length > 0 && (
          <div className="daytype-section">
            <h4>Routine Adjustments</h4>
            <p className="daytype-section-hint">
              Disable routines that shouldn't run on {config.label.toLowerCase()} days
            </p>

            <div className="daytype-routines-list">
              {routines.filter(r => r.status === "active").map(routine => {
                const isDisabled = (config.disabledRoutines || []).includes(routine.id);
                return (
                  <label key={routine.id} className="daytype-routine-item">
                    <input
                      type="checkbox"
                      checked={!isDisabled}
                      onChange={() => toggleRoutineDisabled(routine.id)}
                    />
                    <span className="daytype-routine-checkbox">
                      {!isDisabled ? "✓" : ""}
                    </span>
                    <span className="daytype-routine-icon">{routine.icon || "📋"}</span>
                    <span className="daytype-routine-name">{routine.title}</span>
                    <span className="daytype-routine-schedule">
                      {routine.schedule.timeOfDay}
                    </span>
                  </label>
                );
              })}
              {routines.filter(r => r.status === "active").length === 0 && (
                <p className="daytype-routines-empty">
                  No active routines to configure. Create routines in the Routines tab.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Custom Day Type Modal */}
      {showCreateModal && (
        <div className="daytype-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="daytype-modal" onClick={e => e.stopPropagation()}>
            <h4>Create Custom Day Type</h4>
            <p className="daytype-modal-hint">
              Create a new day type to mark special kinds of days
            </p>

            <div className="daytype-create-form">
              <div className="daytype-create-field">
                <label>Name</label>
                <input
                  type="text"
                  value={newDayTypeName}
                  onChange={e => setNewDayTypeName(e.target.value)}
                  placeholder="e.g., Focus Day, Recovery Day"
                  maxLength={20}
                  autoFocus
                />
              </div>

              <div className="daytype-create-field">
                <label>Icon</label>
                <div className="daytype-icon-grid">
                  {PRESET_ICONS.map(icon => (
                    <button
                      key={icon}
                      className={`daytype-icon-btn ${newDayTypeIcon === icon ? "selected" : ""}`}
                      onClick={() => setNewDayTypeIcon(icon)}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="daytype-create-field">
                <label>Color</label>
                <div className="daytype-color-grid">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      className={`daytype-color-btn ${newDayTypeColor === color ? "selected" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewDayTypeColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="daytype-create-preview">
                <span className="daytype-create-preview-label">Preview:</span>
                <span
                  className="daytype-create-preview-badge"
                  style={{ backgroundColor: newDayTypeColor }}
                >
                  {newDayTypeIcon} {newDayTypeName || "Day Type"}
                </span>
              </div>
            </div>

            <div className="daytype-modal-actions">
              <button
                className="daytype-modal-cancel"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="daytype-modal-create"
                onClick={handleCreateDayType}
                disabled={!newDayTypeName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Custom Day Type Modal */}
      {showEditModal && (
        <div className="daytype-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="daytype-modal" onClick={e => e.stopPropagation()}>
            <h4>Edit Day Type</h4>
            <p className="daytype-modal-hint">
              Update the name, icon, or color
            </p>

            <div className="daytype-create-form">
              <div className="daytype-create-field">
                <label>Name</label>
                <input
                  type="text"
                  value={newDayTypeName}
                  onChange={e => setNewDayTypeName(e.target.value)}
                  placeholder="e.g., Focus Day, Recovery Day"
                  maxLength={20}
                  autoFocus
                />
              </div>

              <div className="daytype-create-field">
                <label>Icon</label>
                <div className="daytype-icon-grid">
                  {PRESET_ICONS.map(icon => (
                    <button
                      key={icon}
                      className={`daytype-icon-btn ${newDayTypeIcon === icon ? "selected" : ""}`}
                      onClick={() => setNewDayTypeIcon(icon)}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="daytype-create-field">
                <label>Color</label>
                <div className="daytype-color-grid">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      className={`daytype-color-btn ${newDayTypeColor === color ? "selected" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewDayTypeColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="daytype-create-preview">
                <span className="daytype-create-preview-label">Preview:</span>
                <span
                  className="daytype-create-preview-badge"
                  style={{ backgroundColor: newDayTypeColor }}
                >
                  {newDayTypeIcon} {newDayTypeName || "Day Type"}
                </span>
              </div>
            </div>

            <div className="daytype-modal-actions">
              <button
                className="daytype-modal-cancel"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="daytype-modal-create"
                onClick={handleSaveEdit}
                disabled={!newDayTypeName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DayTypeConfigEditor;
