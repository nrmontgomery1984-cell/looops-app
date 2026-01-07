// Loop Dashboard - Customizable widget-based dashboard for each loop
// Each loop has its own dashboard with widgets the user can configure

import React, { useState, useRef, useCallback } from "react";
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
  ComponentCompletion,
  Note,
  Goal,
  getWidgetGridClass,
  Caregiver,
  BabysitterSession,
  BabysitterAccess,
  HouseholdInfo,
  ScheduleEntry,
  Person,
  SpecialDate,
} from "../../types";
import { ComponentWidget } from "../systems/ComponentTracker";
// @deprecated - keeping HabitsWidget import for backward compatibility during migration
import { HabitsWidget } from "../systems/HabitsTracker";
import { BabysitterWidget } from "./BabysitterWidget";
import { SpecialDatesWidget } from "./SpecialDatesWidget";
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
import { LoopAIWidget } from "./LoopAIWidget";
import { WastedMoneyWidget } from "./WastedMoneyWidget";
import { WorkoutWidget } from "./WorkoutWidget";
import { FinanceScreen } from "../finance/FinanceScreen";
import { MealPrepScreen } from "../mealprep/MealPrepScreen";
import { ZeroWasteWidget } from "./ZeroWasteWidget";
import { FoodWasteTrackerWidget } from "./FoodWasteTrackerWidget";

interface LoopDashboardProps {
  loop: LoopId;
  dashboard: LoopDashboardType;
  // Data for widgets
  tasks: Task[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  systems: System[];
  componentCompletions: ComponentCompletion[];
  notes: Note[];
  goals: Goal[];
  // Babysitter data (Family loop)
  caregivers: Caregiver[];
  babysitterSessions: BabysitterSession[];
  // Special Dates data (Family loop)
  specialDatesPeople: Person[];
  specialDates: SpecialDate[];
  // Actions
  onCompleteTask: (taskId: string) => void;
  onSelectTask: (taskId: string) => void;
  // @deprecated - use onCompleteComponent instead
  onCompleteHabit: (habitId: string, date: string) => void;
  // @deprecated - use onUncompleteComponent instead
  onUncompleteHabit: (habitId: string, date: string) => void;
  // Component actions (new)
  onCompleteComponent: (systemId: string, componentId: string, date: string) => void;
  onUncompleteComponent: (systemId: string, componentId: string, date: string) => void;
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
  // Babysitter Portal PIN actions
  babysitterPins?: BabysitterAccess[];
  onAddBabysitterPin?: (pin: BabysitterAccess) => void;
  onDeleteBabysitterPin?: (caregiverId: string) => void;
  // Household Info (for babysitter portal)
  householdInfo?: HouseholdInfo;
  onUpdateHouseholdInfo?: (info: HouseholdInfo) => void;
  // Schedule (for babysitter portal)
  babysitterSchedule?: ScheduleEntry[];
  onAddScheduleEntry?: (entry: ScheduleEntry) => void;
  onUpdateScheduleEntry?: (entry: ScheduleEntry) => void;
  onDeleteScheduleEntry?: (entryId: string) => void;
  // Special Dates actions
  onAddPerson: (person: Person) => void;
  onUpdatePerson: (person: Person) => void;
  onDeletePerson: (personId: string) => void;
  onAddSpecialDate: (date: SpecialDate) => void;
  onUpdateSpecialDate: (date: SpecialDate) => void;
  onDeleteSpecialDate: (dateId: string) => void;
  onBack?: () => void;
}

// Grid configuration constants
const GRID_COLS = 4;
const GRID_ROW_HEIGHT = 120; // pixels per grid row

// Helper to get grid size from legacy WidgetSize
function getDefaultGridSize(size: WidgetSize): { colSpan: number; rowSpan: number } {
  switch (size) {
    case "small":
      return { colSpan: 1, rowSpan: 2 };
    case "medium":
      return { colSpan: 2, rowSpan: 2 };
    case "large":
      return { colSpan: 3, rowSpan: 3 };
    case "full":
      return { colSpan: 4, rowSpan: 3 };
    default:
      return { colSpan: 2, rowSpan: 2 };
  }
}

// Get effective grid size for a widget
function getWidgetGridSize(widget: WidgetConfig): { colSpan: number; rowSpan: number } {
  if (widget.gridSize) {
    return widget.gridSize;
  }
  return getDefaultGridSize(widget.size);
}

export function LoopDashboard({
  loop,
  dashboard,
  tasks,
  habits,
  habitCompletions,
  systems,
  componentCompletions,
  notes,
  goals,
  caregivers,
  babysitterSessions,
  specialDatesPeople,
  specialDates,
  onCompleteTask,
  onSelectTask,
  onCompleteHabit,
  onUncompleteHabit,
  onCompleteComponent,
  onUncompleteComponent,
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
  babysitterPins,
  onAddBabysitterPin,
  onDeleteBabysitterPin,
  householdInfo,
  onUpdateHouseholdInfo,
  babysitterSchedule,
  onAddScheduleEntry,
  onUpdateScheduleEntry,
  onDeleteScheduleEntry,
  onAddPerson,
  onUpdatePerson,
  onDeletePerson,
  onAddSpecialDate,
  onUpdateSpecialDate,
  onDeleteSpecialDate,
  onBack,
}: LoopDashboardProps) {
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [resizingWidget, setResizingWidget] = useState<string | null>(null);
  const [resizeDirection, setResizeDirection] = useState<"e" | "s" | "se" | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const widgetRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Scroll to a specific widget
  const scrollToWidget = useCallback((widgetId: string) => {
    const widgetEl = widgetRefs.current.get(widgetId);
    if (widgetEl) {
      widgetEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const loopColor = LOOP_COLORS[loop];
  const loopDef = LOOP_DEFINITIONS[loop];

  // State for recurring tasks filter
  const [showRecurring, setShowRecurring] = useState(false);

  // Filter data for this loop (with defensive checks for undefined arrays)
  const loopTasks = (tasks || []).filter(t => {
    if (t.loop !== loop || t.status === "done") return false;
    // If recurring filter is off, hide recurring tasks unless due today/tomorrow
    if (!showRecurring && t.recurrence && t.dueDate) {
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
      return t.dueDate === today || t.dueDate === tomorrowStr;
    }
    return true;
  });
  const loopHabits = (habits || []).filter(h => h.loop === loop && h.status === "active");
  const loopSystems = (systems || []).filter(s => s.loop === loop && s.status === "active");
  const loopNotes = (notes || []).filter(n => n.loop === loop);
  const loopGoals = (goals || []).filter(g => g.loop === loop);

  // Calculate system health
  const getSystemHealth = () => {
    if (loopSystems.length === 0) return null;
    const avgHealth = loopSystems.reduce((sum, s) => sum + (s.healthScore || 0), 0) / loopSystems.length;
    return Math.round(avgHealth);
  };

  const systemHealth = getSystemHealth();

  // Handle widget resize
  const handleResizeStart = useCallback((
    e: React.MouseEvent,
    widgetId: string,
    direction: "e" | "s" | "se"
  ) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    setResizingWidget(widgetId);
    setResizeDirection(direction);

    const widget = (dashboard.widgets || []).find(w => w.id === widgetId);
    if (!widget || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const cellWidth = gridRect.width / GRID_COLS;
    const startX = e.clientX;
    const startY = e.clientY;
    const startGridSize = getWidgetGridSize(widget);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newColSpan = startGridSize.colSpan;
      let newRowSpan = startGridSize.rowSpan;

      if (direction === "e" || direction === "se") {
        const colDelta = Math.round(deltaX / cellWidth);
        newColSpan = Math.max(1, Math.min(GRID_COLS, startGridSize.colSpan + colDelta));
      }

      if (direction === "s" || direction === "se") {
        const rowDelta = Math.round(deltaY / GRID_ROW_HEIGHT);
        newRowSpan = Math.max(1, Math.min(4, startGridSize.rowSpan + rowDelta));
      }

      // Update widget
      onUpdateDashboard({
        ...dashboard,
        widgets: (dashboard.widgets || []).map(w =>
          w.id === widgetId
            ? { ...w, gridSize: { colSpan: newColSpan, rowSpan: newRowSpan } }
            : w
        ),
        updatedAt: new Date().toISOString(),
      });
    };

    const handleMouseUp = () => {
      setResizingWidget(null);
      setResizeDirection(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [editMode, dashboard, onUpdateDashboard]);

  // Handle widget drag for reordering
  const handleDragStart = useCallback((e: React.DragEvent, widgetId: string) => {
    if (!editMode) {
      e.preventDefault();
      return;
    }
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", widgetId);
  }, [editMode]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!editMode || !draggedWidget) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, [editMode, draggedWidget]);

  const handleDrop = useCallback((e: React.DragEvent, targetWidgetId: string) => {
    if (!editMode || !draggedWidget || draggedWidget === targetWidgetId) return;
    e.preventDefault();

    const widgets = [...(dashboard.widgets || [])];
    const dragIndex = widgets.findIndex(w => w.id === draggedWidget);
    const dropIndex = widgets.findIndex(w => w.id === targetWidgetId);

    if (dragIndex !== -1 && dropIndex !== -1) {
      // Remove dragged widget and insert at new position
      const [draggedItem] = widgets.splice(dragIndex, 1);
      widgets.splice(dropIndex, 0, draggedItem);

      onUpdateDashboard({
        ...dashboard,
        widgets,
        updatedAt: new Date().toISOString(),
      });
    }

    setDraggedWidget(null);
  }, [editMode, draggedWidget, dashboard, onUpdateDashboard]);

  const handleDragEnd = useCallback(() => {
    setDraggedWidget(null);
  }, []);

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
        // Use ComponentWidget for systems with embedded components
        // Falls back to legacy HabitsWidget if no systems with components
        const systemsWithComponents = loopSystems.filter(s => (s.components || []).length > 0);
        if (systemsWithComponents.length > 0) {
          return (
            <ComponentWidget
              systems={systemsWithComponents}
              completions={componentCompletions}
              onComplete={onCompleteComponent}
              onUncomplete={onUncompleteComponent}
              loop={loop}
            />
          );
        }
        // Legacy fallback for standalone habits
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
            componentCompletions={componentCompletions}
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
            pins={babysitterPins}
            householdInfo={householdInfo}
            schedule={babysitterSchedule}
            onAddSession={onAddBabysitterSession}
            onUpdateSession={onUpdateBabysitterSession}
            onDeleteSession={onDeleteBabysitterSession}
            onAddCaregiver={onAddCaregiver}
            onUpdateCaregiver={onUpdateCaregiver}
            onDeactivateCaregiver={onDeactivateCaregiver}
            onAddPin={onAddBabysitterPin}
            onDeletePin={onDeleteBabysitterPin}
            onUpdateHouseholdInfo={onUpdateHouseholdInfo}
            onAddScheduleEntry={onAddScheduleEntry}
            onUpdateScheduleEntry={onUpdateScheduleEntry}
            onDeleteScheduleEntry={onDeleteScheduleEntry}
          />
        );

      case "special_dates":
        return (
          <SpecialDatesWidget
            people={specialDatesPeople}
            dates={specialDates}
            onAddPerson={onAddPerson}
            onUpdatePerson={onUpdatePerson}
            onDeletePerson={onDeletePerson}
            onAddDate={onAddSpecialDate}
            onUpdateDate={onUpdateSpecialDate}
            onDeleteDate={onDeleteSpecialDate}
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

      case "loop_ai":
        return (
          <LoopAIWidget
            loopId={loop}
            tasks={loopTasks}
            goals={loopGoals}
            compact={config.settings.compact as boolean}
          />
        );

      case "wasted_money":
        return <WastedMoneyWidget />;

      case "workout":
        return (
          <WorkoutWidget
            compact={config.settings.compact as boolean}
            showQuickGenerate={config.settings.showQuickGenerate as boolean}
          />
        );

      case "finance_manager":
        return <FinanceScreen embedded />;

      case "meal_prep":
        return <MealPrepScreen embedded />;

      case "zero_waste":
        return <ZeroWasteWidget />;

      case "food_waste":
        return <FoodWasteTrackerWidget />;

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
          <label className="recurring-toggle" title="Show all recurring tasks (not just those due soon)">
            <input
              type="checkbox"
              checked={showRecurring}
              onChange={(e) => setShowRecurring(e.target.checked)}
            />
            <span className="recurring-toggle-label">Show recurring</span>
          </label>
          <button
            className={`dashboard-action-btn ${editMode ? "active" : ""}`}
            onClick={() => setEditMode(!editMode)}
            title={editMode ? "Exit edit mode" : "Edit dashboard layout"}
          >
            {editMode ? "✓ Done" : "✏️ Edit"}
          </button>
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

      {/* Widget Navigation Bar */}
      {(dashboard.widgets || []).length > 0 && (
        <div className="widget-nav-bar">
          {(dashboard.widgets || []).map(widget => {
            const def = WIDGET_DEFINITIONS[widget.type];
            return (
              <button
                key={widget.id}
                className="widget-nav-item"
                onClick={() => scrollToWidget(widget.id)}
                title={widget.title || def.name}
              >
                <span className="widget-nav-icon">{def.icon}</span>
                <span className="widget-nav-name">{widget.title || def.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <div
        ref={gridRef}
        className={`loop-dashboard-widgets ${editMode ? "edit-mode" : ""}`}
      >
        {(dashboard.widgets || []).map(widget => {
          const def = WIDGET_DEFINITIONS[widget.type];
          const availableSizes = def.availableSizes;
          const gridSize = getWidgetGridSize(widget);
          const isDragging = draggedWidget === widget.id;
          const isResizing = resizingWidget === widget.id;

          const changeSize = (newSize: WidgetSize) => {
            onUpdateDashboard({
              ...dashboard,
              widgets: (dashboard.widgets || []).map(w =>
                w.id === widget.id
                  ? { ...w, size: newSize, gridSize: getDefaultGridSize(newSize) }
                  : w
              ),
              updatedAt: new Date().toISOString(),
            });
          };

          const isPinned = widget.pinned || false;

          const togglePin = () => {
            onUpdateDashboard({
              ...dashboard,
              widgets: (dashboard.widgets || []).map(w =>
                w.id === widget.id
                  ? { ...w, pinned: !w.pinned }
                  : w
              ),
              updatedAt: new Date().toISOString(),
            });
          };

          return (
            <div
              key={widget.id}
              ref={(el) => {
                if (el) widgetRefs.current.set(widget.id, el);
                else widgetRefs.current.delete(widget.id);
              }}
              className={`widget-container ${getWidgetGridClass(widget.size)} ${editMode ? "editable" : ""} ${isDragging ? "dragging" : ""} ${isResizing ? "resizing" : ""} ${isPinned ? "pinned" : ""}`}
              style={editMode ? {
                gridColumn: `span ${gridSize.colSpan}`,
                gridRow: `span ${gridSize.rowSpan}`,
              } : undefined}
              draggable={editMode && !isPinned}
              onDragStart={(e) => handleDragStart(e, widget.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, widget.id)}
              onDragEnd={handleDragEnd}
            >
              <div className="widget-header">
                {editMode && !isPinned && (
                  <span className="widget-drag-handle" title="Drag to reorder">
                    ⋮⋮
                  </span>
                )}
                {editMode && isPinned && (
                  <span className="widget-pinned-indicator" title="Pinned - click to unpin">
                    📌
                  </span>
                )}
                <span className="widget-icon">{def.icon}</span>
                <span className="widget-title">
                  {widget.title || def.name}
                </span>
                <div className="widget-controls">
                  {editMode && (
                    <button
                      className={`widget-pin-btn ${isPinned ? "pinned" : ""}`}
                      onClick={togglePin}
                      title={isPinned ? "Unpin widget" : "Pin widget in place"}
                    >
                      {isPinned ? "📌" : "📍"}
                    </button>
                  )}
                  {!editMode && availableSizes.length > 1 && (
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
                  {editMode && (
                    <span className="widget-size-indicator">
                      {gridSize.colSpan}×{gridSize.rowSpan}
                    </span>
                  )}
                  <button
                    className="widget-remove-btn"
                    onClick={() => {
                      onUpdateDashboard({
                        ...dashboard,
                        widgets: (dashboard.widgets || []).filter(w => w.id !== widget.id),
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

              {/* Resize handles - only visible in edit mode, not for pinned widgets */}
              {editMode && !isPinned && (
                <>
                  <div
                    className="resize-handle resize-handle-e"
                    onMouseDown={(e) => handleResizeStart(e, widget.id, "e")}
                    title="Drag to resize width"
                  />
                  <div
                    className="resize-handle resize-handle-s"
                    onMouseDown={(e) => handleResizeStart(e, widget.id, "s")}
                    title="Drag to resize height"
                  />
                  <div
                    className="resize-handle resize-handle-se"
                    onMouseDown={(e) => handleResizeStart(e, widget.id, "se")}
                    title="Drag to resize"
                  />
                </>
              )}
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
              widgets: [...(dashboard.widgets || []), newWidget],
              updatedAt: new Date().toISOString(),
            });
            setShowWidgetPicker(false);
          }}
          onClose={() => setShowWidgetPicker(false)}
          existingTypes={(dashboard.widgets || []).map(w => w.type)}
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
  const [search, setSearch] = useState("");

  const availableWidgets = Object.values(WIDGET_DEFINITIONS).filter(
    def => !existingTypes.includes(def.type)
  );

  const filteredWidgets = availableWidgets.filter(def =>
    search === "" ||
    def.name.toLowerCase().includes(search.toLowerCase()) ||
    def.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="widget-picker-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Widget</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="widget-picker-search">
          <input
            type="text"
            placeholder="Search widgets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="widget-picker-grid">
          {filteredWidgets.map(def => (
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
        {filteredWidgets.length === 0 && availableWidgets.length > 0 && (
          <div className="widget-picker-empty">
            No widgets match "{search}"
          </div>
        )}
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
  componentCompletions = [],
  onCreateSystem,
}: {
  systems: System[];
  habits: Habit[];
  completions: HabitCompletion[];
  componentCompletions?: ComponentCompletion[];
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
            {(system.components || []).length || (system.habitIds || []).length} components
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
