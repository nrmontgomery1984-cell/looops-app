// Workout Screen - Main Container
import React, { useState, useMemo } from "react";
import { useApp, useWorkout } from "../../context";
import {
  Exercise,
  ExerciseDifficulty,
  MuscleGroup,
  MovementPattern,
  TrainingTipEntry,
  WorkoutPlan,
  getMuscleGroupLabel,
  getMovementPatternLabel,
} from "../../types/workout";
import { GymOnboardingFlow } from "./onboarding";
import { ExerciseCard } from "./ExerciseCard";
import { ExerciseDetail } from "./ExerciseDetail";
import { ExerciseForm } from "./ExerciseForm";
import { TrainingTipLibrary } from "./TrainingTipLibrary";
import { WorkoutPlanCalendar } from "./WorkoutPlanCalendar";
import { WorkoutGenerator } from "./WorkoutGenerator";

type ViewMode = "grid" | "list";
type SortBy = "recent" | "name" | "timesPerformed" | "difficulty";
type MainView = "exercises" | "tips" | "calendar" | "log";

interface FilterState {
  search: string;
  muscleGroup: MuscleGroup | null;
  movement: MovementPattern | null;
  difficulty: ExerciseDifficulty | null;
  favorites: boolean;
  equipment: string | null;
}

export function WorkoutScreen() {
  const { state, dispatch } = useApp();
  const workout = useWorkout();

  // Main navigation
  const [mainView, setMainView] = useState<MainView>("exercises");

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    muscleGroup: null,
    movement: null,
    difficulty: null,
    favorites: false,
    equipment: null,
  });

  // Get user ID for onboarding
  const userId = state.user.profile?.id || "anonymous";

  // Filter and sort exercises
  const filteredExercises = useMemo(() => {
    let exercises = [...workout.exercises];

    // Search
    if (filters.search) {
      const search = filters.search.toLowerCase();
      exercises = exercises.filter(
        (e) =>
          e.name.toLowerCase().includes(search) ||
          e.tags.some((t: string) => t.toLowerCase().includes(search)) ||
          e.primaryMuscles.some((m: MuscleGroup) => getMuscleGroupLabel(m).toLowerCase().includes(search))
      );
    }

    // Muscle group filter
    if (filters.muscleGroup) {
      exercises = exercises.filter(
        (e) =>
          e.primaryMuscles.includes(filters.muscleGroup!) ||
          e.secondaryMuscles.includes(filters.muscleGroup!)
      );
    }

    // Movement pattern filter
    if (filters.movement) {
      exercises = exercises.filter((e) => e.movementPattern === filters.movement);
    }

    // Difficulty filter
    if (filters.difficulty) {
      exercises = exercises.filter((e) => e.difficulty === filters.difficulty);
    }

    // Favorites filter
    if (filters.favorites) {
      exercises = exercises.filter((e) => e.isFavorite);
    }

    // Equipment filter
    if (filters.equipment) {
      exercises = exercises.filter((e) =>
        e.requiredEquipment.includes(filters.equipment!)
      );
    }

    // Sort
    switch (sortBy) {
      case "recent":
        exercises.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "name":
        exercises.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "timesPerformed":
        exercises.sort((a, b) => b.timesPerformed - a.timesPerformed);
        break;
      case "difficulty":
        const difficultyOrder: Record<ExerciseDifficulty, number> = { beginner: 0, intermediate: 1, advanced: 2, elite: 3 };
        exercises.sort(
          (a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
        );
        break;
    }

    return exercises;
  }, [workout.exercises, filters, sortBy]);

  // Get unique equipment from exercises
  const usedEquipment = useMemo(() => {
    const equipment = new Set<string>();
    workout.exercises.forEach((e: Exercise) => {
      e.requiredEquipment.forEach((eq: string) => equipment.add(eq));
    });
    return Array.from(equipment);
  }, [workout.exercises]);

  const handleToggleFavorite = (exerciseId: string) => {
    dispatch({ type: "TOGGLE_EXERCISE_FAVORITE", payload: exerciseId });
  };

  const handleDeleteExercise = (exerciseId: string) => {
    if (confirm("Are you sure you want to delete this exercise?")) {
      dispatch({ type: "DELETE_EXERCISE", payload: exerciseId });
      setSelectedExercise(null);
    }
  };

  // Training tip handlers
  const handleAddTip = (tip: TrainingTipEntry) => {
    dispatch({ type: "ADD_TRAINING_TIP", payload: tip });
  };

  const handleUpdateTip = (tip: TrainingTipEntry) => {
    dispatch({ type: "UPDATE_TRAINING_TIP", payload: tip });
  };

  const handleDeleteTip = (id: string) => {
    dispatch({ type: "DELETE_TRAINING_TIP", payload: id });
  };

  // Workout plan handlers
  const handleSaveWorkoutPlan = (plan: WorkoutPlan) => {
    dispatch({ type: "SET_WORKOUT_PLAN", payload: plan });
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setShowExerciseForm(true);
    setSelectedExercise(null);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      muscleGroup: null,
      movement: null,
      difficulty: null,
      favorites: false,
      equipment: null,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.muscleGroup ||
    filters.movement ||
    filters.difficulty ||
    filters.favorites ||
    filters.equipment;

  // If onboarding not complete, show onboarding flow
  if (!workout.onboardingComplete) {
    return (
      <div className="screen workout-screen">
        <GymOnboardingFlow userId={userId} onComplete={() => {}} />
      </div>
    );
  }

  // Exercise Detail View
  if (selectedExercise) {
    return (
      <div className="screen workout-screen">
        <ExerciseDetail
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
          onEdit={() => handleEditExercise(selectedExercise)}
          onDelete={(exerciseId) => {
            dispatch({ type: "DELETE_EXERCISE", payload: exerciseId });
            setSelectedExercise(null);
          }}
        />
      </div>
    );
  }

  // Exercise Form (Add/Edit)
  if (showExerciseForm) {
    return (
      <div className="screen workout-screen">
        <ExerciseForm
          exercise={editingExercise}
          gymProfile={workout.gymProfile}
          onSave={(exercise) => {
            if (editingExercise) {
              dispatch({ type: "UPDATE_EXERCISE", payload: exercise });
            } else {
              dispatch({ type: "ADD_EXERCISE", payload: exercise });
            }
            setShowExerciseForm(false);
            setEditingExercise(null);
          }}
          onCancel={() => {
            setShowExerciseForm(false);
            setEditingExercise(null);
          }}
        />
      </div>
    );
  }

  // Training Tips View
  if (mainView === "tips") {
    return (
      <div className="screen workout-screen">
        <TrainingTipLibrary
          tips={workout.trainingTips}
          exercises={workout.exercises}
          onAddTip={handleAddTip}
          onUpdateTip={handleUpdateTip}
          onDeleteTip={handleDeleteTip}
          onToggleFavorite={(id) =>
            dispatch({ type: "TOGGLE_TRAINING_TIP_FAVORITE", payload: id })
          }
          onSelectExercise={(exercise) => {
            setSelectedExercise(exercise);
            setMainView("exercises");
          }}
          onBack={() => setMainView("exercises")}
        />
      </div>
    );
  }

  // Workout Plan Calendar View
  if (mainView === "calendar") {
    return (
      <div className="screen workout-screen">
        <WorkoutPlanCalendar
          exercises={workout.exercises}
          workoutPlans={workout.workoutPlans}
          gymProfile={workout.gymProfile}
          onSavePlan={handleSaveWorkoutPlan}
          onSelectExercise={(exercise) => {
            setSelectedExercise(exercise);
          }}
          onBack={() => setMainView("exercises")}
        />
      </div>
    );
  }

  // Workout Log View
  if (mainView === "log") {
    return (
      <div className="screen workout-screen">
        <div className="workout__log-placeholder">
          <button className="workout__back" onClick={() => setMainView("exercises")}>
            ← Back
          </button>
          <div className="workout__empty">
            <div className="workout__empty-icon">📊</div>
            <h3>Workout Log</h3>
            <p>Track your completed workouts and progress here.</p>
            <p className="workout__empty-hint">Coming soon!</p>
          </div>
        </div>
      </div>
    );
  }

  // Helper to check active tab
  const isActiveTab = (tab: MainView) => mainView === tab;

  return (
    <div className="screen workout-screen">
      {/* Header */}
      <div className="workout__header">
        <div className="workout__header-content">
          <h2>Workout</h2>
          <p className="workout__subtitle">
            Your exercise library and training plans
          </p>
        </div>
        <div className="workout__header-actions">
          <button
            className="workout__add-btn"
            onClick={() => {
              setEditingExercise(null);
              setShowExerciseForm(true);
            }}
          >
            + Add Exercise
          </button>
        </div>
      </div>

      {/* Main View Tabs */}
      <div className="workout__tabs">
        <button
          className={`workout__tab ${isActiveTab("exercises") ? "workout__tab--active" : ""}`}
          onClick={() => setMainView("exercises")}
        >
          Exercises
          <span className="workout__tab-count">{workout.exercises.length}</span>
        </button>
        <button
          className={`workout__tab ${isActiveTab("tips") ? "workout__tab--active" : ""}`}
          onClick={() => setMainView("tips")}
        >
          Training Tips
          <span className="workout__tab-count">{workout.trainingTips.length}</span>
        </button>
        <button
          className={`workout__tab ${isActiveTab("calendar") ? "workout__tab--active" : ""}`}
          onClick={() => setMainView("calendar")}
        >
          Plan
          <span className="workout__tab-count">{workout.workoutPlans.length}</span>
        </button>
        <button
          className={`workout__tab ${isActiveTab("log") ? "workout__tab--active" : ""}`}
          onClick={() => setMainView("log")}
        >
          Log
          <span className="workout__tab-count">{workout.workoutLogs.length}</span>
        </button>
        <button
          className="workout__tab workout__tab--suggest"
          onClick={() => setShowGenerator(true)}
        >
          Generate Workout
        </button>
      </div>

      {/* Search & Filters */}
      <div className="workout__filters">
        <div className="workout__search">
          <span className="workout__search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search exercises, muscles, tags..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          {filters.search && (
            <button
              className="workout__search-clear"
              onClick={() => setFilters({ ...filters, search: "" })}
            >
              ×
            </button>
          )}
        </div>

        <div className="workout__filter-row">
          {/* Muscle Group Filter */}
          <select
            className="workout__filter-select"
            value={filters.muscleGroup || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                muscleGroup: (e.target.value || null) as MuscleGroup | null,
              })
            }
          >
            <option value="">All Muscles</option>
            <option value="chest">Chest</option>
            <option value="back">Back</option>
            <option value="shoulders">Shoulders</option>
            <option value="biceps">Biceps</option>
            <option value="triceps">Triceps</option>
            <option value="core">Core</option>
            <option value="quads">Quads</option>
            <option value="hamstrings">Hamstrings</option>
            <option value="glutes">Glutes</option>
            <option value="calves">Calves</option>
            <option value="grip">Grip</option>
            <option value="full_body">Full Body</option>
          </select>

          {/* Movement Pattern Filter */}
          <select
            className="workout__filter-select"
            value={filters.movement || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                movement: (e.target.value || null) as MovementPattern | null,
              })
            }
          >
            <option value="">All Movements</option>
            <option value="push">Push</option>
            <option value="pull">Pull</option>
            <option value="squat">Squat</option>
            <option value="hinge">Hinge</option>
            <option value="lunge">Lunge</option>
            <option value="carry">Carry</option>
            <option value="rotation">Rotation</option>
            <option value="isometric">Isometric</option>
            <option value="plyometric">Plyometric</option>
            <option value="cardio">Cardio</option>
          </select>

          {/* Difficulty Filter */}
          <select
            className="workout__filter-select"
            value={filters.difficulty || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                difficulty: (e.target.value || null) as ExerciseDifficulty | null,
              })
            }
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="elite">Elite</option>
          </select>

          {/* Favorites Toggle */}
          <button
            className={`workout__filter-toggle ${filters.favorites ? "workout__filter-toggle--active" : ""}`}
            onClick={() => setFilters({ ...filters, favorites: !filters.favorites })}
          >
            {filters.favorites ? "★" : "☆"} Favorites
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button className="workout__filter-clear" onClick={clearFilters}>
              Clear All
            </button>
          )}
        </div>

        {/* Sort & View Controls */}
        <div className="workout__controls">
          <div className="workout__sort">
            <span className="workout__sort-label">Sort by:</span>
            <select
              className="workout__sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
            >
              <option value="recent">Recently Added</option>
              <option value="name">Name A-Z</option>
              <option value="timesPerformed">Most Performed</option>
              <option value="difficulty">Difficulty</option>
            </select>
          </div>

          <div className="workout__view-toggle">
            <button
              className={`workout__view-btn ${viewMode === "grid" ? "workout__view-btn--active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              ⊞
            </button>
            <button
              className={`workout__view-btn ${viewMode === "list" ? "workout__view-btn--active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Exercise Grid/List */}
      {filteredExercises.length === 0 ? (
        <div className="workout__empty">
          {workout.exercises.length === 0 ? (
            <>
              <div className="workout__empty-icon">💪</div>
              <h3>No exercises yet</h3>
              <p>Start building your exercise library by adding your first exercise.</p>
              <button
                className="workout__empty-btn"
                onClick={() => {
                  setEditingExercise(null);
                  setShowExerciseForm(true);
                }}
              >
                Add Your First Exercise
              </button>
            </>
          ) : (
            <>
              <div className="workout__empty-icon">🔍</div>
              <h3>No exercises match your filters</h3>
              <p>Try adjusting your search or filters to find what you're looking for.</p>
              <button className="workout__empty-btn" onClick={clearFilters}>
                Clear Filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className={`workout__exercises workout__exercises--${viewMode}`}>
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onView={() => setSelectedExercise(exercise)}
              onToggleFavorite={() => handleToggleFavorite(exercise.id)}
              compact={viewMode === "list"}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {filteredExercises.length > 0 && (
        <div className="workout__count">
          Showing {filteredExercises.length} of {workout.exercises.length} exercises
        </div>
      )}

      {/* Workout Generator Modal */}
      {showGenerator && (
        <div className="workout__generator-overlay">
          <WorkoutGenerator
            exercises={workout.exercises}
            gymProfile={workout.gymProfile}
            onSelectExercise={(exercise) => {
              setSelectedExercise(exercise);
              setShowGenerator(false);
            }}
            onClose={() => setShowGenerator(false)}
          />
        </div>
      )}
    </div>
  );
}
