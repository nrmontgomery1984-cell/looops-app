// Looops - Personal Operating System
// Main Application Component

import React, { useMemo, useState, useEffect } from "react";
import {
  AppProvider,
  useApp,
  useUser,
  useLoops,
  useTasks,
  useProjects,
  useLabels,
  useRoutines,
  useUI,
  useSystems,
  useHabits,
  FirebaseSyncProvider,
  useSyncStatus,
} from "./context";
import {
  TabId,
  Task,
  LoopId,
  ALL_LOOPS,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
  WidgetConfig,
  WidgetType,
  WIDGET_DEFINITIONS,
  getWidgetGridClass,
} from "./types";
import { Sidebar } from "./components/layout";
import { LoopsVisualization } from "./components/loops";
import { TodaysStack, CalendarView, QuickAddModal } from "./components/today";
import { OnboardingFlow, OnboardingData } from "./components/onboarding";
import { StateSelector } from "./components/common";
import { AnnualGoalsWizard, GoalsDashboard, GoalBreakdownWizard } from "./components/goals";
import { getNextTimeframe } from "./types/goals";
import { TasksScreen } from "./components/tasks";
import { RoutinesScreen } from "./components/routines";
import { SystemsScreen } from "./components/systems";
import { LoopDashboard } from "./components/dashboard";
import { WeatherWidget } from "./components/dashboard/WeatherWidget";
import { GoodTimesWidget } from "./components/dashboard/GoodTimesWidget";
import { SpotifyWidget } from "./components/dashboard/SpotifyWidget";
import { MediaWidget } from "./components/dashboard/MediaWidget";
import { CalendarWidget as GoogleCalendarWidget } from "./components/dashboard/CalendarWidget";
import { HistoryScreen } from "./components/history";
import { WeeklyPlanning } from "./components/planning";
import { LoginScreen } from "./components/auth";
import { useFirebaseAuth } from "./hooks/useFirebaseAuth";
import { generatePrototype, getArchetypeGreeting, frameTasks } from "./engines";
import { Goal, LoopStateType } from "./types";
import { getStateDisplayName, getStateColor } from "./engines/stateEngine";
import {
  DEMO_TASKS,
  DEMO_HABITS,
  DEMO_HABIT_COMPLETIONS,
  DEMO_CAREGIVERS,
  DEMO_BABYSITTER_SESSIONS,
  DEMO_GOALS,
  DEMO_NOTES,
  DEMO_USER_PROFILE,
  DEMO_PROTOTYPE,
} from "./data/demoData";

// Mock data for initial tasks (will be replaced by real data)
const INITIAL_TASKS: Task[] = [
  { id: "h1", title: "Morning mobility routine", loop: "Health", subLoop: "Exercise", priority: 2, status: "todo", order: 0, dueDate: new Date().toISOString().split("T")[0], createdAt: new Date().toISOString(), estimateMinutes: 15, requiredState: "MAINTAIN" },
  { id: "h2", title: "Meal prep for the week", loop: "Health", subLoop: "Nutrition", priority: 1, status: "todo", order: 1, dueDate: new Date().toISOString().split("T")[0], createdAt: new Date().toISOString(), estimateMinutes: 90, requiredState: "BUILD" },
  { id: "w1", title: "Review monthly budget", loop: "Wealth", subLoop: "Budgeting", priority: 1, status: "todo", order: 2, dueDate: new Date().toISOString().split("T")[0], createdAt: new Date().toISOString(), estimateMinutes: 45, requiredState: "MAINTAIN" },
  { id: "f1", title: "Family dinner - no phones", loop: "Family", subLoop: "Quality Time", priority: 2, status: "todo", order: 3, dueDate: new Date().toISOString().split("T")[0], createdAt: new Date().toISOString(), estimateMinutes: 60, requiredState: "MAINTAIN" },
  { id: "work1", title: "Complete Q4 presentation", loop: "Work", subLoop: "Projects", priority: 1, status: "doing", order: 4, dueDate: new Date().toISOString().split("T")[0], createdAt: new Date().toISOString(), estimateMinutes: 120, requiredState: "BUILD" },
  { id: "fun1", title: "Read for 30 minutes", loop: "Fun", subLoop: "Hobbies", priority: 3, status: "todo", order: 5, dueDate: new Date().toISOString().split("T")[0], createdAt: new Date().toISOString(), estimateMinutes: 30, requiredState: "RECOVER" },
  { id: "m1", title: "Quick kitchen cleanup", loop: "Maintenance", subLoop: "Cleaning", priority: 3, status: "todo", order: 6, dueDate: new Date().toISOString().split("T")[0], createdAt: new Date().toISOString(), estimateMinutes: 15, requiredState: "MAINTAIN" },
  { id: "mean1", title: "Morning journaling", loop: "Meaning", subLoop: "Reflection", priority: 2, status: "todo", order: 7, dueDate: new Date().toISOString().split("T")[0], createdAt: new Date().toISOString(), estimateMinutes: 15, requiredState: "MAINTAIN" },
];


// Main App Content (uses context)
function AppContent() {
  const { state, dispatch } = useApp();
  const user = useUser();
  const loops = useLoops();
  const tasks = useTasks();
  const projects = useProjects();
  const labels = useLabels();
  const routines = useRoutines();
  const ui = useUI();
  const systems = useSystems();
  const habits = useHabits();
  const {
    user: firebaseUser,
    authMode,
    isLoading: authLoading,
    error: authError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    enterDemoMode,
    logout,
    resetPassword,
    clearError,
  } = useFirebaseAuth();

  // Check for skip param immediately
  const skipOnboarding = new URLSearchParams(window.location.search).get('skip') === '1';
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [demoDataLoaded, setDemoDataLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<"visual" | "kanban">("visual");
  const [showGoalsWizard, setShowGoalsWizard] = useState(false);
  const [planningView, setPlanningView] = useState<"states" | "goals" | "weekly">("goals");
  const [todayViewMode, setTodayViewMode] = useState<"stack" | "calendar">("stack");
  const [todayFilter, setTodayFilter] = useState<LoopId | "all">("all");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showBreakdownWizard, setShowBreakdownWizard] = useState(false);
  const [selectedLoopDashboard, setSelectedLoopDashboard] = useState<LoopId | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem("looops-theme");
    return (saved as "dark" | "light") || "dark";
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTodayWidgetPicker, setShowTodayWidgetPicker] = useState(false);
  const [todayWidgets, setTodayWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem("looops-today-widgets");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    // Default widgets for Today page
    return [
      { id: "today_weather", type: "weather" as WidgetType, size: "medium" as const, position: { row: 0, col: 0 }, settings: {} },
    ];
  });

  // Save today widgets to localStorage
  useEffect(() => {
    localStorage.setItem("looops-today-widgets", JSON.stringify(todayWidgets));
  }, [todayWidgets]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("looops-theme", theme);
  }, [theme]);

  // Toggle theme
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Initialize tasks if empty (only for authenticated mode)
  useEffect(() => {
    if (authMode === "authenticated" && tasks.items.length === 0) {
      dispatch({ type: "SET_TASKS", payload: INITIAL_TASKS });
    }
  }, [authMode]);

  // Load demo data when in demo mode
  useEffect(() => {
    if (authMode === "demo" && !demoDataLoaded) {
      // Set demo user profile and prototype
      dispatch({ type: "SET_USER_PROFILE", payload: DEMO_USER_PROFILE });
      dispatch({ type: "SET_PROTOTYPE", payload: DEMO_PROTOTYPE as any });
      dispatch({ type: "COMPLETE_ONBOARDING" });

      // Load demo tasks
      dispatch({ type: "SET_TASKS", payload: DEMO_TASKS });

      // Load demo habits
      DEMO_HABITS.forEach((habit) => {
        dispatch({ type: "ADD_HABIT", payload: habit });
      });

      // Load demo habit completions
      Object.entries(DEMO_HABIT_COMPLETIONS).forEach(([habitId, dates]) => {
        dates.forEach((date) => {
          dispatch({ type: "COMPLETE_HABIT", payload: { habitId, date } });
        });
      });

      // Load demo caregivers and sessions
      DEMO_CAREGIVERS.forEach((caregiver) => {
        dispatch({ type: "ADD_CAREGIVER", payload: caregiver });
      });
      DEMO_BABYSITTER_SESSIONS.forEach((session) => {
        dispatch({ type: "ADD_BABYSITTER_SESSION", payload: session });
      });

      // Load demo goals
      DEMO_GOALS.forEach((goal) => {
        dispatch({ type: "ADD_GOAL", payload: goal });
      });

      // Load demo notes
      DEMO_NOTES.forEach((note) => {
        dispatch({ type: "ADD_NOTE", payload: note });
      });

      setDemoDataLoaded(true);
    }
  }, [authMode, demoDataLoaded]);

  // Check for dev bypass via URL parameter (?bypass=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("bypass") === "1" && !user.onboardingComplete) {
      // Create a default profile for dev/mobile testing
      const defaultProfile = {
        id: `user_${Date.now()}`,
        name: "Dev User",
        lifeSeason: "Building Career",
        primaryChallenge: "Testing",
        createdAt: new Date().toISOString(),
      };
      // Create a default prototype so Goals wizard works
      const defaultPrototype = generatePrototype(
        defaultProfile.id,
        {
          introvert_extrovert: 50,
          intuitive_analytical: 50,
          spontaneous_structured: 50,
          risk_averse_seeking: 50,
          specialist_generalist: 50,
          independent_collaborative: 50,
          patient_urgent: 50,
          pragmatic_idealistic: 50,
          minimalist_maximalist: 50,
          private_public: 50,
          harmonious_confrontational: 50,
          process_outcome: 50,
          conservative_experimental: 50,
          humble_confident: 50,
          reactive_proactive: 50,
        },
        ["growth", "balance"],
        [],
        "A balanced and productive person"
      );
      dispatch({ type: "SET_USER_PROFILE", payload: defaultProfile });
      dispatch({ type: "SET_PROTOTYPE", payload: defaultPrototype });
      dispatch({ type: "COMPLETE_ONBOARDING" });
      // Remove bypass param from URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Check for reset-dashboards param (?reset-dashboards=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset-dashboards") === "1") {
      // Clear dashboards from localStorage to get fresh defaults
      try {
        const saved = localStorage.getItem("looops_app_state");
        if (saved) {
          const state = JSON.parse(saved);
          delete state.dashboards;
          localStorage.setItem("looops_app_state", JSON.stringify(state));
        }
      } catch (e) {
        console.error("Failed to reset dashboards:", e);
      }
      // Reload without the param
      window.location.href = window.location.pathname;
    }
  }, []);

  // Show onboarding if not complete (skip if ?skip=1 in URL)
  // Only trigger after user is authenticated
  useEffect(() => {
    if (skipOnboarding) return;
    if (!authMode) return; // Don't show onboarding until authenticated
    if (!user.onboardingComplete && !showOnboarding) {
      setShowOnboarding(true);
    }
  }, [user.onboardingComplete, skipOnboarding, authMode]);

  // Get time of day for greeting
  const timeOfDay = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  }, []);

  // Get greeting based on archetype
  const greeting = useMemo(() => {
    const name = user.profile?.name || "there";
    if (user.prototype?.archetypeBlend.primary) {
      return getArchetypeGreeting(user.prototype.archetypeBlend.primary, name, timeOfDay);
    }
    return `Good ${timeOfDay}, ${name}`;
  }, [user.profile, user.prototype, timeOfDay]);

  // Get today's tasks with archetype framing
  const todaysTasks = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    let filtered = tasks.items.filter(
      (t) => t.status !== "done" && t.status !== "dropped" && (t.dueDate === today || (t.dueDate && t.dueDate < today))
    );

    // Apply archetype framing if prototype exists
    if (user.prototype?.archetypeBlend.primary) {
      filtered = frameTasks(filtered, user.prototype.archetypeBlend.primary);
    }

    // Sort by priority and take top 5
    return filtered
      .sort((a, b) => (a.priority || 4) - (b.priority || 4))
      .slice(0, 5);
  }, [tasks.items, user.prototype]);

  // Handle onboarding completion
  const handleOnboardingComplete = (data: OnboardingData) => {
    // Create user profile
    const profile = {
      id: `user_${Date.now()}`,
      name: data.name,
      lifeSeason: data.lifeSeason,
      primaryChallenge: data.primaryChallenge,
      createdAt: new Date().toISOString(),
    };

    // Generate prototype
    const prototype = generatePrototype(
      profile.id,
      data.traits,
      data.selectedValueIds,
      data.selectedInspirationIds,
      data.futureSelf
    );

    // Update state
    dispatch({ type: "SET_USER_PROFILE", payload: profile });
    dispatch({ type: "SET_PROTOTYPE", payload: prototype });
    dispatch({ type: "SET_ALL_LOOP_STATES", payload: data.initialLoopStates });
    dispatch({ type: "COMPLETE_ONBOARDING" });
    setShowOnboarding(false);
  };

  // Handle tab change
  const handleTabChange = (tab: TabId) => {
    dispatch({ type: "SET_ACTIVE_TAB", payload: tab });
  };

  // Handle loop selection
  const handleSelectLoop = (loopId: LoopId | null) => {
    dispatch({ type: "SELECT_LOOP", payload: loopId });
  };

  // Handle task completion
  const handleCompleteTask = (taskId: string) => {
    dispatch({ type: "COMPLETE_TASK", payload: taskId });
  };

  // Handle task skip
  const handleSkipTask = (taskId: string) => {
    // Move to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const task = tasks.items.find((t) => t.id === taskId);
    if (task) {
      dispatch({
        type: "UPDATE_TASK",
        payload: { ...task, dueDate: tomorrow.toISOString().split("T")[0] },
      });
    }
  };

  // Handle loop state change
  const handleLoopStateChange = (loopId: LoopId, state: any) => {
    dispatch({ type: "SET_LOOP_STATE", payload: { loopId, state } });
  };

  // Render widget for Today page
  const renderTodayWidget = (config: WidgetConfig) => {
    switch (config.type) {
      case "weather":
        return <WeatherWidget />;
      case "good_times":
        return <GoodTimesWidget />;
      case "spotify":
        return <SpotifyWidget />;
      case "media":
        return <MediaWidget />;
      case "google_calendar":
        return <GoogleCalendarWidget loop="Work" daysAhead={7} />;
      default:
        const def = WIDGET_DEFINITIONS[config.type];
        return (
          <div className="widget-placeholder">
            <span className="widget-placeholder-icon">{def?.icon || "?"}</span>
            <span className="widget-placeholder-name">{def?.name || config.type}</span>
            <span className="widget-placeholder-hint">Coming soon</span>
          </div>
        );
    }
  };

  // Add widget to Today page
  const handleAddTodayWidget = (type: WidgetType) => {
    const def = WIDGET_DEFINITIONS[type];
    const newWidget: WidgetConfig = {
      id: `today_${type}_${Date.now()}`,
      type,
      size: def.defaultSize,
      position: { row: 0, col: 0 },
      settings: { ...def.defaultSettings },
    };
    setTodayWidgets([...todayWidgets, newWidget]);
    setShowTodayWidgetPicker(false);
  };

  // Remove widget from Today page
  const handleRemoveTodayWidget = (widgetId: string) => {
    setTodayWidgets(todayWidgets.filter(w => w.id !== widgetId));
  };

  // Render current screen
  const renderScreen = () => {
    switch (ui.activeTab) {
      case "today":
        // Filter tasks for today view
        const filteredTodayTasks = todayFilter === "all"
          ? todaysTasks
          : todaysTasks.filter((t) => t.loop === todayFilter);

        // Handle quick add task
        const handleQuickAddTask = (date: string) => {
          setQuickAddDate(date);
          setShowQuickAdd(true);
        };

        // Handle quick add submit
        const handleQuickAddSubmit = (title: string, loopId: LoopId) => {
          if (title.trim()) {
            const newTask: Task = {
              id: `task_${Date.now()}`,
              title: title.trim(),
              loop: loopId,
              priority: 3,
              status: "todo",
              order: tasks.items.length,
              dueDate: quickAddDate || new Date().toISOString().split("T")[0],
              createdAt: new Date().toISOString(),
            };
            dispatch({ type: "ADD_TASK", payload: newTask });
          }
          setShowQuickAdd(false);
          setQuickAddDate(null);
        };

        return (
          <div className="screen today-screen">
            <div className="today-header">
              <div className="today-header-main">
                <h2>{greeting}</h2>
                <p className="today-date">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="today-header-controls">
                {/* View Toggle */}
                <div className="view-toggle">
                  <button
                    className={`view-toggle-btn ${todayViewMode === "stack" ? "active" : ""}`}
                    onClick={() => setTodayViewMode("stack")}
                    title="Stack View"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
                    </svg>
                  </button>
                  <button
                    className={`view-toggle-btn ${todayViewMode === "calendar" ? "active" : ""}`}
                    onClick={() => setTodayViewMode("calendar")}
                    title="Calendar View"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
                    </svg>
                  </button>
                </div>
                {/* Filter Dropdown */}
                <div className="today-filter">
                  <select
                    value={todayFilter}
                    onChange={(e) => setTodayFilter(e.target.value as LoopId | "all")}
                    className="filter-select"
                  >
                    <option value="all">All Loops</option>
                    {ALL_LOOPS.map((loopId) => (
                      <option key={loopId} value={loopId}>
                        {LOOP_DEFINITIONS[loopId].icon} {loopId}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Quick Add Button */}
                <button
                  className="quick-add-btn"
                  onClick={() => handleQuickAddTask(new Date().toISOString().split("T")[0])}
                  title="Add Task"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </button>
              </div>
            </div>

            {todayViewMode === "stack" ? (
              <div className="today-content">
                <div className="today-main">
                  <TodaysStack
                    tasks={filteredTodayTasks}
                    habits={habits.items}
                    habitCompletions={habits.completions}
                    loopStates={loops.states}
                    onCompleteTask={handleCompleteTask}
                    onSkipTask={handleSkipTask}
                    onSelectTask={(id) => dispatch({ type: "OPEN_MODAL", payload: { modal: "taskDetail", value: id } })}
                    onCompleteHabit={(habitId, date) => dispatch({ type: "COMPLETE_HABIT", payload: { habitId, date } })}
                    onUncompleteHabit={(habitId, date) => dispatch({ type: "UNCOMPLETE_HABIT", payload: { habitId, date } })}
                  />
                </div>

                <div className="today-sidebar">
                  <div className="loop-states-summary">
                    <h3>Loop States</h3>
                    <div className="loop-states-list">
                      {ALL_LOOPS.map((loopId) => {
                        const loop = LOOP_DEFINITIONS[loopId];
                        const loopState = loops.states[loopId];
                        const state = loopState?.currentState || "MAINTAIN";

                        return (
                          <div
                            key={loopId}
                            className={`loop-state-item ${todayFilter === loopId ? "active" : ""}`}
                            onClick={() => setTodayFilter(todayFilter === loopId ? "all" : loopId)}
                          >
                            <span className="loop-state-icon">{loop.icon}</span>
                            <span className="loop-state-name">{loop.name}</span>
                            <span
                              className="loop-state-badge"
                              style={{ backgroundColor: getStateColor(state) }}
                            >
                              {getStateDisplayName(state)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {user.prototype && (
                    <div className="archetype-summary">
                      <h3>Your Archetype</h3>
                      <p className="archetype-name-display">
                        {user.prototype.archetypeBlend.name}
                      </p>
                      <p className="archetype-blend-display">
                        {user.prototype.archetypeBlend.primary} +{" "}
                        {user.prototype.archetypeBlend.secondary}
                      </p>
                    </div>
                  )}

                  {/* Today Widgets */}
                  <div className="today-widgets">
                    <div className="today-widgets-header">
                      <h3>Widgets</h3>
                      <button
                        className="add-widget-btn"
                        onClick={() => setShowTodayWidgetPicker(true)}
                        title="Add Widget"
                      >
                        +
                      </button>
                    </div>
                    <div className="today-widgets-list">
                      {todayWidgets.map((widget) => {
                        const def = WIDGET_DEFINITIONS[widget.type];
                        return (
                          <div key={widget.id} className={`today-widget-container ${getWidgetGridClass(widget.size)}`}>
                            <div className="today-widget-header">
                              <span className="today-widget-icon">{def.icon}</span>
                              <span className="today-widget-title">{def.name}</span>
                              <button
                                className="today-widget-remove"
                                onClick={() => handleRemoveTodayWidget(widget.id)}
                                title="Remove"
                              >
                                ×
                              </button>
                            </div>
                            <div className="today-widget-content">
                              {renderTodayWidget(widget)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <CalendarView
                tasks={todayFilter === "all" ? tasks.items : tasks.items.filter((t) => t.loop === todayFilter)}
                loopStates={loops.states}
                onSelectTask={(id) => dispatch({ type: "OPEN_MODAL", payload: { modal: "taskDetail", value: id } })}
                onSelectDate={(date) => {
                  setQuickAddDate(date);
                  setShowQuickAdd(true);
                }}
                onAddTask={handleQuickAddTask}
              />
            )}

            {/* Quick Add Modal */}
            {showQuickAdd && (
              <QuickAddModal
                date={quickAddDate || new Date().toISOString().split("T")[0]}
                onSubmit={handleQuickAddSubmit}
                onClose={() => {
                  setShowQuickAdd(false);
                  setQuickAddDate(null);
                }}
              />
            )}

            {/* Today Widget Picker Modal */}
            {showTodayWidgetPicker && (
              <div className="modal-overlay" onClick={() => setShowTodayWidgetPicker(false)}>
                <div className="widget-picker-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Add Widget</h3>
                    <button className="modal-close" onClick={() => setShowTodayWidgetPicker(false)}>×</button>
                  </div>
                  <div className="widget-picker-grid">
                    {Object.values(WIDGET_DEFINITIONS)
                      .filter((def) => !todayWidgets.some((w) => w.type === def.type))
                      .map((def) => (
                        <button
                          key={def.type}
                          className="widget-picker-item"
                          onClick={() => handleAddTodayWidget(def.type)}
                        >
                          <span className="widget-picker-icon">{def.icon}</span>
                          <span className="widget-picker-name">{def.name}</span>
                          <span className="widget-picker-desc">{def.description}</span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "tasks":
        return (
          <TasksScreen
            tasks={tasks.items}
            projects={projects}
            labels={labels}
            onAddTask={(task) => dispatch({ type: "ADD_TASK", payload: task })}
            onUpdateTask={(task) => dispatch({ type: "UPDATE_TASK", payload: task })}
            onDeleteTask={(taskId) => dispatch({ type: "DELETE_TASK", payload: taskId })}
            onCompleteTask={(taskId) => dispatch({ type: "COMPLETE_TASK", payload: taskId })}
            onUncompleteTask={(taskId) => dispatch({ type: "UNCOMPLETE_TASK", payload: taskId })}
            onAddProject={(project) => dispatch({ type: "ADD_PROJECT", payload: project })}
            onUpdateProject={(project) => dispatch({ type: "UPDATE_PROJECT", payload: project })}
            onDeleteProject={(projectId) => dispatch({ type: "DELETE_PROJECT", payload: projectId })}
            onAddLabel={(label) => dispatch({ type: "ADD_LABEL", payload: label })}
          />
        );

      case "routines":
        return (
          <RoutinesScreen
            routines={routines.items}
            onAddRoutine={(routine) => dispatch({ type: "ADD_ROUTINE", payload: routine })}
            onUpdateRoutine={(routine) => dispatch({ type: "UPDATE_ROUTINE", payload: routine })}
            onDeleteRoutine={(routineId) => dispatch({ type: "DELETE_ROUTINE", payload: routineId })}
            onCompleteRoutine={(routineId) => {
              const routine = routines.items.find(r => r.id === routineId);
              const completion = {
                id: `comp_${Date.now()}`,
                routineId,
                completedAt: new Date().toISOString(),
                completedSteps: routine?.steps.map(s => s.id) || [],
                skippedSteps: [],
                fullyCompleted: true,
              };
              dispatch({ type: "ADD_ROUTINE_COMPLETION", payload: completion });
            }}
            onSkipRoutine={(routineId) => {
              const routine = routines.items.find(r => r.id === routineId);
              const completion = {
                id: `comp_${Date.now()}`,
                routineId,
                completedAt: new Date().toISOString(),
                completedSteps: [],
                skippedSteps: routine?.steps.map(s => s.id) || [],
                fullyCompleted: false,
              };
              dispatch({ type: "ADD_ROUTINE_COMPLETION", payload: completion });
            }}
          />
        );

      case "systems":
        return (
          <SystemsScreen
            systems={systems.items}
            habits={habits.items}
            completions={habits.completions}
            onAddSystem={(system) => dispatch({ type: "ADD_SYSTEM", payload: system })}
            onUpdateSystem={(system) => dispatch({ type: "UPDATE_SYSTEM", payload: system })}
            onDeleteSystem={(systemId) => dispatch({ type: "DELETE_SYSTEM", payload: systemId })}
            onAddHabit={(habit) => dispatch({ type: "ADD_HABIT", payload: habit })}
            onUpdateHabit={(habit) => dispatch({ type: "UPDATE_HABIT", payload: habit })}
            onDeleteHabit={(habitId) => dispatch({ type: "DELETE_HABIT", payload: habitId })}
            onCompleteHabit={(habitId, date, notes) =>
              dispatch({ type: "COMPLETE_HABIT", payload: { habitId, date, notes } })
            }
            onUncompleteHabit={(habitId, date) =>
              dispatch({ type: "UNCOMPLETE_HABIT", payload: { habitId, date } })
            }
          />
        );

      case "loops":
        // If a Loop dashboard is selected, show it
        if (selectedLoopDashboard) {
          const loopDashboard = state.dashboards[selectedLoopDashboard] || {
            loopId: selectedLoopDashboard,
            widgets: [],
            updatedAt: new Date().toISOString(),
          };
          return (
            <LoopDashboard
              loop={selectedLoopDashboard}
              dashboard={loopDashboard}
              tasks={tasks.items}
              habits={habits.items}
              habitCompletions={habits.completions}
              systems={systems.items}
              notes={state.notes || []}
              goals={[
                ...state.goals.annual,
                ...state.goals.quarterly,
                ...state.goals.monthly,
                ...state.goals.weekly,
                ...state.goals.daily,
              ]}
              caregivers={state.babysitter.caregivers}
              babysitterSessions={state.babysitter.sessions}
              onCompleteTask={(taskId) => dispatch({ type: "COMPLETE_TASK", payload: taskId })}
              onCompleteHabit={(habitId, date) => dispatch({ type: "COMPLETE_HABIT", payload: { habitId, date } })}
              onUncompleteHabit={(habitId, date) => dispatch({ type: "UNCOMPLETE_HABIT", payload: { habitId, date } })}
              onUpdateDashboard={(dashboard) => dispatch({ type: "UPDATE_DASHBOARD", payload: dashboard })}
              onOpenSystemBuilder={() => {}}
              onAddNote={(note) => dispatch({ type: "ADD_NOTE", payload: note })}
              onUpdateNote={(note) => dispatch({ type: "UPDATE_NOTE", payload: note })}
              onAddBabysitterSession={(session) => dispatch({ type: "ADD_BABYSITTER_SESSION", payload: session })}
              onUpdateBabysitterSession={(session) => dispatch({ type: "UPDATE_BABYSITTER_SESSION", payload: session })}
              onDeleteBabysitterSession={(sessionId) => dispatch({ type: "DELETE_BABYSITTER_SESSION", payload: sessionId })}
              onAddCaregiver={(caregiver) => dispatch({ type: "ADD_CAREGIVER", payload: caregiver })}
              onUpdateCaregiver={(caregiver) => dispatch({ type: "UPDATE_CAREGIVER", payload: caregiver })}
              onDeactivateCaregiver={(caregiverId) => dispatch({ type: "DEACTIVATE_CAREGIVER", payload: caregiverId })}
              onBack={() => setSelectedLoopDashboard(null)}
            />
          );
        }

        return (
          <div className="screen loops-screen">
            <div className="screen-header">
              <h2>Your Loops</h2>
              <div className="view-toggle">
                <button
                  className={`view-toggle-btn ${viewMode === "visual" ? "active" : ""}`}
                  onClick={() => setViewMode("visual")}
                >
                  Visual
                </button>
                <button
                  className={`view-toggle-btn ${viewMode === "kanban" ? "active" : ""}`}
                  onClick={() => setViewMode("kanban")}
                >
                  Kanban
                </button>
              </div>
            </div>

            {viewMode === "visual" ? (
              <>
                <LoopsVisualization
                  loopStates={loops.states}
                  tasks={tasks.items}
                  selectedLoop={ui.selectedLoop}
                  onSelectLoop={handleSelectLoop}
                  onSelectTask={(id) => dispatch({ type: "OPEN_MODAL", payload: { modal: "taskDetail", value: id } })}
                />

                {/* Loop Cards Grid */}
                <div className="loop-cards-grid">
                  {ALL_LOOPS.map((loopId) => {
                    const loop = LOOP_DEFINITIONS[loopId];
                    const loopColor = LOOP_COLORS[loopId];
                    const loopState = loops.states[loopId];
                    const currentState = loopState?.currentState || "MAINTAIN";
                    const loopTasks = tasks.items.filter(
                      (t) => t.loop === loopId && t.status !== "done"
                    );
                    const loopHabits = habits.items.filter(
                      (h) => h.loop === loopId && h.status === "active"
                    );
                    const loopSystems = systems.items.filter(
                      (s) => s.loop === loopId && s.status === "active"
                    );

                    return (
                      <button
                        key={loopId}
                        className="loop-nav-card"
                        onClick={() => setSelectedLoopDashboard(loopId)}
                        style={{
                          "--loop-color": loopColor.border,
                          "--loop-bg": loopColor.bg,
                        } as React.CSSProperties}
                      >
                        <div className="loop-nav-card__icon">{loop.icon}</div>
                        <div className="loop-nav-card__content">
                          <h3 className="loop-nav-card__name">{loop.name}</h3>
                          <span
                            className="loop-nav-card__state"
                            style={{ backgroundColor: getStateColor(currentState) }}
                          >
                            {getStateDisplayName(currentState)}
                          </span>
                        </div>
                        <div className="loop-nav-card__stats">
                          <span className="loop-nav-card__stat">
                            {loopTasks.length} tasks
                          </span>
                          <span className="loop-nav-card__stat">
                            {loopHabits.length} habits
                          </span>
                          {loopSystems.length > 0 && (
                            <span className="loop-nav-card__stat">
                              {loopSystems.length} systems
                            </span>
                          )}
                        </div>
                        <div className="loop-nav-card__arrow">→</div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="loops-kanban">
                {ALL_LOOPS.map((loopId) => {
                  const loop = LOOP_DEFINITIONS[loopId];
                  const loopColor = LOOP_COLORS[loopId];
                  const loopState = loops.states[loopId];
                  const currentState = loopState?.currentState || "MAINTAIN";
                  const loopTasks = tasks.items.filter(
                    (t) => t.loop === loopId && t.status !== "done"
                  );

                  return (
                    <div key={loopId} className="loop-card">
                      <div
                        className="loop-card__header"
                        style={{ borderLeftColor: getStateColor(currentState) }}
                      >
                        <h3>
                          {loop.icon} {loop.name}
                        </h3>
                        <span
                          className="loop-card__state"
                          style={{ backgroundColor: getStateColor(currentState) }}
                        >
                          {getStateDisplayName(currentState)}
                        </span>
                      </div>

                      <div className="loop-card__state-selector">
                        <StateSelector
                          currentState={currentState}
                          onStateChange={(newState) =>
                            handleLoopStateChange(loopId, newState)
                          }
                        />
                      </div>

                      <div className="loop-card__tasks">
                        {loopTasks.length === 0 ? (
                          <p className="loop-card__empty">No active tasks</p>
                        ) : (
                          loopTasks.slice(0, 5).map((task) => (
                            <div
                              key={task.id}
                              className="loop-task-row"
                              onClick={() =>
                                dispatch({
                                  type: "OPEN_MODAL",
                                  payload: { modal: "taskDetail", value: task.id },
                                })
                              }
                            >
                              <span
                                className="loop-task-priority"
                                style={{
                                  backgroundColor:
                                    task.priority === 1
                                      ? "#F27059"  // Coral
                                      : task.priority === 2
                                      ? "#F4B942"  // Amber
                                      : "#737390", // Navy gray
                                }}
                              />
                              <span className="loop-task-title">{task.title}</span>
                              {task.subLoop && (
                                <span className="loop-task-subloop">
                                  {task.subLoop}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <button
                        className="loop-card__view-btn"
                        onClick={() => setSelectedLoopDashboard(loopId)}
                      >
                        View Dashboard →
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "planning":
        // Extract loop states as Record<LoopId, LoopStateType>
        const currentLoopStates: Record<LoopId, LoopStateType> = {} as Record<LoopId, LoopStateType>;
        ALL_LOOPS.forEach((loopId) => {
          currentLoopStates[loopId] = loops.states[loopId]?.currentState || "MAINTAIN";
        });

        return (
          <div className="screen planning-screen">
            <div className="planning-header">
              <h2>Planning</h2>
              <div className="planning-view-toggle">
                <button
                  className={`planning-view-btn ${planningView === "weekly" ? "active" : ""}`}
                  onClick={() => setPlanningView("weekly")}
                >
                  Weekly Planning
                </button>
                <button
                  className={`planning-view-btn ${planningView === "goals" ? "active" : ""}`}
                  onClick={() => setPlanningView("goals")}
                >
                  Goals
                </button>
                <button
                  className={`planning-view-btn ${planningView === "states" ? "active" : ""}`}
                  onClick={() => setPlanningView("states")}
                >
                  Loop States
                </button>
              </div>
            </div>

            {planningView === "weekly" ? (
              <WeeklyPlanning
                loopStates={loops.states}
                tasks={tasks.items}
                goals={Object.values(state.goals).flat()}
                onLoopStateChange={handleLoopStateChange}
                onTaskUpdate={(task) => dispatch({ type: "UPDATE_TASK", payload: task })}
                onComplete={() => setPlanningView("goals")}
              />
            ) : planningView === "goals" ? (
              <GoalsDashboard
                goals={state.goals}
                onGoalClick={(goal) => setSelectedGoal(goal)}
                onAddGoal={() => setShowGoalsWizard(true)}
                onUpdateGoal={(goal) => {
                  dispatch({ type: "UPDATE_GOAL", payload: goal });
                }}
              />
            ) : (
              <>
                <p className="screen-description">
                  Set your loop states for the week ahead. This is your Sunday ritual.
                </p>

                <div className="weekly-planning">
                  {ALL_LOOPS.map((loopId) => {
                    const loop = LOOP_DEFINITIONS[loopId];
                    const loopState = loops.states[loopId];
                    const loopStateValue = loopState?.currentState || "MAINTAIN";

                    return (
                      <div key={loopId} className="planning-loop-row">
                        <div className="planning-loop-info">
                          <span className="planning-loop-icon">{loop.icon}</span>
                          <div>
                            <strong>{loop.name}</strong>
                            <span>{loop.description}</span>
                          </div>
                        </div>
                        <StateSelector
                          currentState={loopStateValue}
                          onStateChange={(newState) =>
                            handleLoopStateChange(loopId, newState)
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Goals Wizard Modal */}
            {showGoalsWizard && user.prototype && (
              <div className="modal-overlay">
                <AnnualGoalsWizard
                  prototype={user.prototype}
                  loopStates={currentLoopStates}
                  existingGoals={state.goals}
                  onComplete={(goals) => {
                    // Add all goals to state
                    goals.forEach((goal) => {
                      dispatch({ type: "ADD_GOAL", payload: goal });
                    });
                    setShowGoalsWizard(false);
                  }}
                  onCancel={() => setShowGoalsWizard(false)}
                />
              </div>
            )}

            {/* Goal Detail Modal */}
            {selectedGoal && (
              <div className="modal-overlay" onClick={() => setSelectedGoal(null)}>
                <div className="goal-detail-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="goal-detail-header">
                    <div className="goal-detail-title-row">
                      <span
                        className="goal-detail-loop-badge"
                        style={{ backgroundColor: LOOP_COLORS[selectedGoal.loop].border }}
                      >
                        {LOOP_DEFINITIONS[selectedGoal.loop].icon}
                      </span>
                      <h2>{selectedGoal.title}</h2>
                    </div>
                    <button
                      className="goal-detail-close"
                      onClick={() => setSelectedGoal(null)}
                    >
                      ×
                    </button>
                  </div>

                  <div className="goal-detail-content">
                    <div className="goal-detail-meta">
                      <span className="goal-detail-timeframe">{selectedGoal.timeframe}</span>
                      <span className="goal-detail-loop">{selectedGoal.loop}</span>
                      <span className={`goal-detail-status goal-detail-status--${selectedGoal.status}`}>
                        {selectedGoal.status}
                      </span>
                    </div>

                    {selectedGoal.description && (
                      <p className="goal-detail-description">{selectedGoal.description}</p>
                    )}

                    <div className="goal-detail-progress-section">
                      <h3>Progress</h3>
                      <div className="goal-detail-progress-bar">
                        <div
                          className="goal-detail-progress-fill"
                          style={{
                            width: `${selectedGoal.progress}%`,
                            backgroundColor: LOOP_COLORS[selectedGoal.loop].border,
                          }}
                        />
                      </div>
                      <div className="goal-detail-progress-controls">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={selectedGoal.progress}
                          onChange={(e) => {
                            const newProgress = Number(e.target.value);
                            const updatedGoal = { ...selectedGoal, progress: newProgress, updatedAt: new Date().toISOString() };
                            dispatch({ type: "UPDATE_GOAL", payload: updatedGoal });
                            setSelectedGoal(updatedGoal);
                          }}
                          className="goal-detail-slider"
                        />
                        <span className="goal-detail-progress-value">{selectedGoal.progress}%</span>
                      </div>
                    </div>

                    {selectedGoal.metrics && selectedGoal.metrics.length > 0 && (
                      <div className="goal-detail-metrics">
                        <h3>Metrics</h3>
                        <div className="goal-detail-metrics-list">
                          {selectedGoal.metrics.map((metric) => (
                            <div key={metric.id} className="goal-detail-metric">
                              <span className="goal-detail-metric-name">{metric.name}</span>
                              <div className="goal-detail-metric-progress">
                                <div
                                  className="goal-detail-metric-fill"
                                  style={{ width: `${(metric.current / metric.target) * 100}%` }}
                                />
                              </div>
                              <span className="goal-detail-metric-value">
                                {metric.current} / {metric.target} {metric.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="goal-detail-dates">
                      <div className="goal-detail-date">
                        <span className="goal-detail-date-label">Target Date</span>
                        <span className="goal-detail-date-value">
                          {new Date(selectedGoal.targetDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="goal-detail-date">
                        <span className="goal-detail-date-label">Created</span>
                        <span className="goal-detail-date-value">
                          {new Date(selectedGoal.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Primary actions - Break Down and Add as Task */}
                    <div className="goal-detail-primary-actions">
                      {getNextTimeframe(selectedGoal.timeframe) && (
                        <button
                          className="goal-detail-btn goal-detail-btn--breakdown"
                          onClick={() => setShowBreakdownWizard(true)}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                          Break Down into {getNextTimeframe(selectedGoal.timeframe)?.charAt(0).toUpperCase()}{getNextTimeframe(selectedGoal.timeframe)?.slice(1)} Goals
                        </button>
                      )}
                      <button
                        className="goal-detail-btn goal-detail-btn--add-task"
                        onClick={() => {
                          // Create a task from this goal
                          const newTask: Task = {
                            id: `task_${Date.now()}`,
                            title: selectedGoal.title,
                            description: selectedGoal.description || `Goal: ${selectedGoal.title}`,
                            loop: selectedGoal.loop,
                            priority: 2,
                            status: "todo",
                            order: tasks.items.length,
                            dueDate: selectedGoal.targetDate.split("T")[0],
                            createdAt: new Date().toISOString(),
                            goalId: selectedGoal.id,
                          };
                          dispatch({ type: "ADD_TASK", payload: newTask });
                          setSelectedGoal(null);
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM12 10h-2v3H7v2h3v3h2v-3h3v-2h-3z" />
                        </svg>
                        Add to Loop as Task
                      </button>
                    </div>

                    <div className="goal-detail-actions">
                      {selectedGoal.status === "active" && (
                        <>
                          <button
                            className="goal-detail-btn goal-detail-btn--complete"
                            onClick={() => {
                              const updatedGoal = { ...selectedGoal, status: "completed" as const, progress: 100, updatedAt: new Date().toISOString() };
                              dispatch({ type: "UPDATE_GOAL", payload: updatedGoal });
                              setSelectedGoal(null);
                            }}
                          >
                            Mark Complete
                          </button>
                          <button
                            className="goal-detail-btn goal-detail-btn--pause"
                            onClick={() => {
                              const updatedGoal = { ...selectedGoal, status: "paused" as const, updatedAt: new Date().toISOString() };
                              dispatch({ type: "UPDATE_GOAL", payload: updatedGoal });
                              setSelectedGoal(updatedGoal);
                            }}
                          >
                            Pause
                          </button>
                        </>
                      )}
                      {selectedGoal.status === "paused" && (
                        <button
                          className="goal-detail-btn goal-detail-btn--resume"
                          onClick={() => {
                            const updatedGoal = { ...selectedGoal, status: "active" as const, updatedAt: new Date().toISOString() };
                            dispatch({ type: "UPDATE_GOAL", payload: updatedGoal });
                            setSelectedGoal(updatedGoal);
                          }}
                        >
                          Resume
                        </button>
                      )}
                      {selectedGoal.status === "completed" && (
                        <button
                          className="goal-detail-btn goal-detail-btn--reopen"
                          onClick={() => {
                            const updatedGoal = { ...selectedGoal, status: "active" as const, updatedAt: new Date().toISOString() };
                            dispatch({ type: "UPDATE_GOAL", payload: updatedGoal });
                            setSelectedGoal(updatedGoal);
                          }}
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Goal Breakdown Wizard */}
            {showBreakdownWizard && selectedGoal && (
              <div className="modal-overlay" onClick={() => setShowBreakdownWizard(false)}>
                <div onClick={(e) => e.stopPropagation()}>
                  <GoalBreakdownWizard
                    parentGoal={selectedGoal}
                    onCreateGoals={(newGoals, newTasks) => {
                      // Update parent goal with child IDs
                      const updatedParent = {
                        ...selectedGoal,
                        childGoalIds: [...selectedGoal.childGoalIds, ...newGoals.map(g => g.id)],
                        updatedAt: new Date().toISOString(),
                      };
                      dispatch({ type: "UPDATE_GOAL", payload: updatedParent });

                      // Add all new goals
                      newGoals.forEach((goal) => {
                        dispatch({ type: "ADD_GOAL", payload: goal });
                      });

                      // Add all new tasks
                      newTasks.forEach((task) => {
                        dispatch({ type: "ADD_TASK", payload: task });
                      });

                      setShowBreakdownWizard(false);
                      setSelectedGoal(null);
                    }}
                    onClose={() => setShowBreakdownWizard(false)}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case "history":
        return <HistoryScreen tasks={tasks.items} />;

      case "me":
        return (
          <div className="screen profile-screen">
            <h2>Your Profile</h2>

            {/* Firebase Account Info */}
            {firebaseUser && (
              <div className="profile-section">
                <h3>Account</h3>
                <div className="profile-grid">
                  <div className="profile-field">
                    <span className="profile-label">Email</span>
                    <span className="profile-value">{firebaseUser.email}</span>
                  </div>
                  {firebaseUser.displayName && (
                    <div className="profile-field">
                      <span className="profile-label">Display Name</span>
                      <span className="profile-value">{firebaseUser.displayName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {user.profile && (
              <div className="profile-section">
                <h3>Basic Info</h3>
                <div className="profile-grid">
                  <div className="profile-field">
                    <span className="profile-label">Name</span>
                    <span className="profile-value">{user.profile.name}</span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Life Season</span>
                    <span className="profile-value">
                      {user.profile.lifeSeason}
                    </span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">Primary Challenge</span>
                    <span className="profile-value">
                      {user.profile.primaryChallenge}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {user.prototype && (
              <>
                <div className="profile-section">
                  <h3>Your Archetype</h3>
                  <div className="archetype-display">
                    <h2 className="archetype-name-large">
                      {user.prototype.archetypeBlend.name}
                    </h2>
                    <div className="archetype-blend-bars">
                      {Object.entries(user.prototype.archetypeBlend.scores)
                        .sort(([, a], [, b]) => b - a)
                        .map(([archetype, score]) => (
                          <div key={archetype} className="archetype-item">
                            <span className="archetype-name">{archetype}</span>
                            <div className="archetype-bar">
                              <div
                                className="archetype-bar__fill"
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <span className="archetype-score">
                              {Math.round(score)}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="profile-section">
                  <h3>Your Voice Profile</h3>
                  <div className="voice-profile-display">
                    <p>
                      <strong>Tone:</strong> {user.prototype.voiceProfile.tone}
                    </p>
                    <p>
                      <strong>Motivation Style:</strong>{" "}
                      {user.prototype.voiceProfile.motivationStyle}
                    </p>
                    <div className="voice-examples">
                      <strong>Example phrases:</strong>
                      <ul>
                        {user.prototype.voiceProfile.examplePhrases.map(
                          (phrase, i) => (
                            <li key={i}>"{phrase}"</li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="profile-section">
              <h3>Appearance</h3>
              <div className="appearance-settings">
                <div className="setting-row">
                  <div className="setting-info">
                    <span className="setting-label">Theme</span>
                    <span className="setting-description">Choose your preferred color scheme</span>
                  </div>
                  <div className="theme-toggle-group">
                    <button
                      className={`theme-option ${theme === "dark" ? "active" : ""}`}
                      onClick={() => setTheme("dark")}
                    >
                      <span className="theme-option-icon">🌙</span>
                      <span className="theme-option-label">Dark</span>
                    </button>
                    <button
                      className={`theme-option ${theme === "light" ? "active" : ""}`}
                      onClick={() => setTheme("light")}
                    >
                      <span className="theme-option-icon">☀️</span>
                      <span className="theme-option-label">Light</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <button
                className="button"
                onClick={() => setShowOnboarding(true)}
              >
                Retake Prototype Assessment
              </button>
              <button
                className="button button--danger"
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure? This will reset all your data."
                    )
                  ) {
                    dispatch({ type: "RESET_ONBOARDING" });
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
              >
                Reset All Data
              </button>
              <button
                className="button button--secondary"
                onClick={() => {
                  logout();
                  window.location.reload();
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show loading screen while checking auth state
  if (authLoading) {
    return (
      <div className="login-screen">
        <div className="login-container">
          <div className="login-header">
            <div className="login-logo">
              <svg viewBox="0 0 100 100" width="80" height="80">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="45" fill="none" stroke="url(#logoGradient)" strokeWidth="4" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="url(#logoGradient)" strokeWidth="3" opacity="0.7" />
                <circle cx="50" cy="50" r="15" fill="url(#logoGradient)" />
              </svg>
            </div>
            <h1 className="login-title">Looops</h1>
            <p className="login-subtitle">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!authMode) {
    return (
      <LoginScreen
        onDemoMode={enterDemoMode}
        onSignInWithEmail={signInWithEmail}
        onSignUpWithEmail={signUpWithEmail}
        onSignInWithGoogle={signInWithGoogle}
        onResetPassword={resetPassword}
        error={authError}
        isLoading={authLoading}
        onClearError={clearError}
      />
    );
  }

  return (
    <div className="app-container">
      <Sidebar
        activeTab={ui.activeTab}
        onTabChange={handleTabChange}
        theme={theme}
        onToggleTheme={toggleTheme}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <main className="app-main">{renderScreen()}</main>

      {showOnboarding && !skipOnboarding && (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onClose={() => {
            if (user.onboardingComplete) {
              setShowOnboarding(false);
            }
          }}
          onSkip={authMode === "demo" ? () => {
            // Create a default profile for demo mode skip
            const defaultProfile = {
              id: `user_${Date.now()}`,
              name: "Demo User",
              lifeSeason: "Exploring",
              primaryChallenge: "Getting Started",
              createdAt: new Date().toISOString(),
            };
            const defaultPrototype = generatePrototype(
              defaultProfile.id,
              {
                introvert_extrovert: 50,
                intuitive_analytical: 50,
                spontaneous_structured: 50,
                risk_averse_seeking: 50,
                specialist_generalist: 50,
                independent_collaborative: 50,
                patient_urgent: 50,
                pragmatic_idealistic: 50,
                minimalist_maximalist: 50,
                private_public: 50,
                harmonious_confrontational: 50,
                process_outcome: 50,
                conservative_experimental: 50,
                humble_confident: 50,
                reactive_proactive: 50,
              },
              ["growth", "balance"],
              [],
              "A balanced and productive person"
            );
            dispatch({ type: "SET_USER_PROFILE", payload: defaultProfile });
            dispatch({ type: "SET_PROTOTYPE", payload: defaultPrototype });
            dispatch({ type: "COMPLETE_ONBOARDING" });
            setShowOnboarding(false);
          } : undefined}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* Demo mode indicator */}
      {authMode === "demo" && (
        <div className="demo-banner">
          <span>Demo Mode - Data is not saved</span>
          <button onClick={logout} className="demo-banner-logout">Exit Demo</button>
        </div>
      )}
    </div>
  );
}

// Sync status indicator component
function SyncStatusIndicator() {
  const { isOnline, isSyncing, lastSynced, error } = useSyncStatus();

  if (!isOnline) return null;

  return (
    <div className="sync-status">
      {isSyncing ? (
        <span className="sync-status-syncing">
          <svg className="sync-icon spinning" viewBox="0 0 24 24" width="14" height="14">
            <path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
          </svg>
          Syncing...
        </span>
      ) : error ? (
        <span className="sync-status-error" title={error}>
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          Sync error
        </span>
      ) : lastSynced ? (
        <span className="sync-status-synced" title={`Last synced: ${new Date(lastSynced).toLocaleTimeString()}`}>
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Synced
        </span>
      ) : null}
    </div>
  );
}

// Root App Component (wraps with providers)
function App() {
  return (
    <AppProvider>
      <FirebaseSyncProvider>
        <AppContent />
        <SyncStatusIndicator />
      </FirebaseSyncProvider>
    </AppProvider>
  );
}

export default App;
// build 1765982688
