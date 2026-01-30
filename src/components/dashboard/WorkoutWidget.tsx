// Workout Widget - Display workout info and quick generate in Health loop
// Provides quick access to workout generation without full screen

import React, { useState, useMemo } from "react";
import { useApp, useWorkout, useGymProfile } from "../../context";
import {
  Exercise,
  WorkoutLog,
  MuscleGroup,
  getMuscleGroupLabel,
  FitnessLevel,
} from "../../types/workout";
import { GymOnboardingFlow } from "../workout/onboarding";

interface WorkoutWidgetProps {
  compact?: boolean;
  showQuickGenerate?: boolean;
}

type WorkoutFocus = "full_body" | "upper" | "lower" | "push" | "pull" | "core";

const FOCUS_OPTIONS: { id: WorkoutFocus; label: string; icon: string; muscles: MuscleGroup[] }[] = [
  { id: "full_body", label: "Full Body", icon: "💪", muscles: ["chest", "back", "shoulders", "quads", "hamstrings", "glutes", "core"] },
  { id: "upper", label: "Upper Body", icon: "🦾", muscles: ["chest", "back", "shoulders", "biceps", "triceps"] },
  { id: "lower", label: "Lower Body", icon: "🦵", muscles: ["quads", "hamstrings", "glutes", "calves"] },
  { id: "push", label: "Push", icon: "➡️", muscles: ["chest", "shoulders", "triceps"] },
  { id: "pull", label: "Pull", icon: "⬅️", muscles: ["back", "biceps", "forearms"] },
  { id: "core", label: "Core", icon: "🎯", muscles: ["core"] },
];

// Day labels for program
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Program templates based on days per week and goals
interface ProgramDay {
  dayIndex: number;
  name: string;
  focus: WorkoutFocus | "rest" | "active_recovery";
  description: string;
}

function generateProgram(
  daysPerWeek: number,
  goals: string[],
  fitnessLevel: FitnessLevel
): ProgramDay[] {
  const program: ProgramDay[] = [];

  // Determine split type based on days
  const hasBJJ = goals.includes("bjj");
  const hasStrength = goals.includes("strength") || goals.includes("muscle");
  const hasConditioning = goals.includes("conditioning") || goals.includes("endurance");

  if (daysPerWeek <= 2) {
    // 2 days: Full body workouts
    program.push({
      dayIndex: 0,
      name: "Full Body A",
      focus: "full_body",
      description: "Compound movements for all major muscle groups",
    });
    if (daysPerWeek === 2) {
      program.push({
        dayIndex: 3,
        name: "Full Body B",
        focus: "full_body",
        description: "Different exercises targeting the same muscle groups",
      });
    }
  } else if (daysPerWeek === 3) {
    if (hasBJJ) {
      // BJJ-focused: strength, conditioning, mobility
      program.push({
        dayIndex: 0,
        name: "Strength",
        focus: "full_body",
        description: "Compound lifts for grappling power",
      });
      program.push({
        dayIndex: 2,
        name: "Conditioning",
        focus: "full_body",
        description: "HIIT and grip work for mat endurance",
      });
      program.push({
        dayIndex: 4,
        name: "Upper + Core",
        focus: "upper",
        description: "Pulling strength and core stability",
      });
    } else {
      // Classic 3-day full body
      program.push({
        dayIndex: 0,
        name: "Full Body A",
        focus: "full_body",
        description: "Squat-focused day with upper body",
      });
      program.push({
        dayIndex: 2,
        name: "Full Body B",
        focus: "full_body",
        description: "Hinge-focused day with upper body",
      });
      program.push({
        dayIndex: 4,
        name: "Full Body C",
        focus: "full_body",
        description: "Accessory and conditioning focus",
      });
    }
  } else if (daysPerWeek === 4) {
    // Upper/Lower split
    program.push({
      dayIndex: 0,
      name: "Upper A",
      focus: "upper",
      description: "Horizontal push/pull emphasis",
    });
    program.push({
      dayIndex: 1,
      name: "Lower A",
      focus: "lower",
      description: "Squat pattern emphasis",
    });
    program.push({
      dayIndex: 3,
      name: "Upper B",
      focus: "upper",
      description: "Vertical push/pull emphasis",
    });
    program.push({
      dayIndex: 4,
      name: "Lower B",
      focus: "lower",
      description: "Hinge pattern emphasis",
    });
  } else if (daysPerWeek === 5) {
    // Push/Pull/Legs + Upper/Lower
    program.push({
      dayIndex: 0,
      name: "Push",
      focus: "push",
      description: "Chest, shoulders, triceps",
    });
    program.push({
      dayIndex: 1,
      name: "Pull",
      focus: "pull",
      description: "Back, biceps, rear delts",
    });
    program.push({
      dayIndex: 2,
      name: "Legs",
      focus: "lower",
      description: "Quads, hamstrings, glutes",
    });
    program.push({
      dayIndex: 4,
      name: "Upper",
      focus: "upper",
      description: "Full upper body volume",
    });
    program.push({
      dayIndex: 5,
      name: "Lower + Core",
      focus: "lower",
      description: "Legs and core focus",
    });
  } else {
    // 6 days: Push/Pull/Legs x2
    program.push({
      dayIndex: 0,
      name: "Push A",
      focus: "push",
      description: "Heavy chest, shoulders, triceps",
    });
    program.push({
      dayIndex: 1,
      name: "Pull A",
      focus: "pull",
      description: "Heavy back, biceps",
    });
    program.push({
      dayIndex: 2,
      name: "Legs A",
      focus: "lower",
      description: "Heavy squat focus",
    });
    program.push({
      dayIndex: 3,
      name: "Push B",
      focus: "push",
      description: "Volume chest, shoulders, triceps",
    });
    program.push({
      dayIndex: 4,
      name: "Pull B",
      focus: "pull",
      description: "Volume back, biceps",
    });
    program.push({
      dayIndex: 5,
      name: "Legs B",
      focus: "lower",
      description: "Volume hinge focus",
    });
  }

  // Add rest days
  const usedDays = new Set(program.map(p => p.dayIndex));
  for (let i = 0; i < 7; i++) {
    if (!usedDays.has(i)) {
      program.push({
        dayIndex: i,
        name: i === 6 ? "Rest" : "Active Recovery",
        focus: i === 6 ? "rest" : "active_recovery",
        description: i === 6 ? "Complete rest or light stretching" : "Light mobility, walking, or easy cardio",
      });
    }
  }

  return program.sort((a, b) => a.dayIndex - b.dayIndex);
}

export function WorkoutWidget({ compact = false, showQuickGenerate = true }: WorkoutWidgetProps) {
  const { state, dispatch } = useApp();
  const workout = useWorkout();
  const gymProfile = useGymProfile();

  const [selectedFocus, setSelectedFocus] = useState<WorkoutFocus | null>(null);
  const [generatedWorkout, setGeneratedWorkout] = useState<Exercise[] | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [view, setView] = useState<"main" | "generate" | "exercises" | "program">("main");

  const userId = state.user.profile?.id || "anonymous";

  // Generate program based on profile
  const weeklyProgram = useMemo(() => {
    if (!gymProfile) return null;
    return generateProgram(
      gymProfile.daysPerWeek,
      gymProfile.goals,
      gymProfile.fitnessLevel
    );
  }, [gymProfile]);

  // If onboarding not complete, show setup prompt
  if (!workout.onboardingComplete) {
    if (showOnboarding) {
      return (
        <div className="workout-widget workout-widget--onboarding">
          <GymOnboardingFlow
            userId={userId}
            onComplete={() => setShowOnboarding(false)}
            onCancel={() => setShowOnboarding(false)}
          />
        </div>
      );
    }

    return (
      <div className="workout-widget workout-widget--setup">
        <div className="workout-widget__setup-icon">🏋️</div>
        <h4>Set Up Your Workout Profile</h4>
        <p>Configure your equipment and preferences to get personalized workouts</p>
        <button
          className="workout-widget__setup-btn"
          onClick={() => setShowOnboarding(true)}
        >
          Get Started
        </button>
      </div>
    );
  }

  // Quick generate workout based on focus
  const generateQuickWorkout = (focus: WorkoutFocus) => {
    const focusOption = FOCUS_OPTIONS.find(f => f.id === focus);
    if (!focusOption) return;

    // Filter exercises that match the focus muscles and available equipment
    const ownedEquipment = gymProfile?.equipment
      .filter(eq => eq.owned)
      .map(eq => eq.id) || [];

    const matchingExercises = workout.exercises.filter(exercise => {
      // Must target at least one of the focus muscles
      const targetsMuscle = exercise.primaryMuscles.some(m =>
        focusOption.muscles.includes(m)
      );
      if (!targetsMuscle) return false;

      // Must have required equipment
      if (exercise.requiredEquipment.length > 0) {
        const hasEquipment = exercise.requiredEquipment.every(eq =>
          ownedEquipment.includes(eq) || eq === "floor_space" || eq === "wall"
        );
        if (!hasEquipment) return false;
      }

      return true;
    });

    // Select 4-6 exercises, prioritizing variety in movement patterns
    const selected: Exercise[] = [];
    const usedPatterns = new Set<string>();

    // Shuffle exercises for variety
    const shuffled = [...matchingExercises].sort(() => Math.random() - 0.5);

    for (const exercise of shuffled) {
      if (selected.length >= 6) break;

      // Try to get variety in movement patterns
      if (!usedPatterns.has(exercise.movementPattern) || selected.length < 4) {
        selected.push(exercise);
        usedPatterns.add(exercise.movementPattern);
      }
    }

    setGeneratedWorkout(selected);
    setSelectedFocus(focus);
  };

  const startWorkout = () => {
    if (!generatedWorkout || generatedWorkout.length === 0) return;

    // For now, just show the workout is "started"
    // In a full implementation, this would create a WorkoutLog
    // and track the user through the workout
    alert(`Starting ${selectedFocus} workout with ${generatedWorkout.length} exercises!`);

    // Reset view
    setGeneratedWorkout(null);
    setSelectedFocus(null);
    setView("main");
  };

  // Main view
  if (view === "main") {
    const recentExercises = workout.exercises
      .filter(e => e.timesPerformed > 0)
      .sort((a, b) => new Date(b.lastPerformed || 0).getTime() - new Date(a.lastPerformed || 0).getTime())
      .slice(0, 3);

    const todaysLogs = workout.workoutLogs.filter(
      (log: WorkoutLog) => log.date === new Date().toISOString().split("T")[0]
    );

    // Get today's workout from program
    const today = new Date().getDay();
    const adjustedToday = today === 0 ? 6 : today - 1; // Convert Sunday=0 to Monday=0
    const todaysProgram = weeklyProgram?.find(p => p.dayIndex === adjustedToday);

    return (
      <div className={`workout-widget ${compact ? "workout-widget--compact" : ""}`}>
        {/* Quick Stats */}
        <div className="workout-widget__stats">
          <div className="workout-widget__stat">
            <span className="workout-widget__stat-value">{workout.exercises.length}</span>
            <span className="workout-widget__stat-label">Exercises</span>
          </div>
          <div className="workout-widget__stat">
            <span className="workout-widget__stat-value">{workout.workoutLogs.length}</span>
            <span className="workout-widget__stat-label">Workouts</span>
          </div>
          <div className="workout-widget__stat">
            <span className="workout-widget__stat-value">{gymProfile?.daysPerWeek || 0}</span>
            <span className="workout-widget__stat-label">Days/Week</span>
          </div>
        </div>

        {/* Today's Workout from Program */}
        {todaysProgram && !compact && (
          <div className="workout-widget__today">
            <div className="workout-widget__today-header">
              <h4>Today's Focus</h4>
              <span className="workout-widget__today-day">{DAY_LABELS[adjustedToday]}</span>
            </div>
            <div className="workout-widget__today-card">
              <span className="workout-widget__today-name">{todaysProgram.name}</span>
              <span className="workout-widget__today-desc">{todaysProgram.description}</span>
              {todaysProgram.focus !== "rest" && todaysProgram.focus !== "active_recovery" && (
                <button
                  className="workout-widget__today-btn"
                  onClick={() => {
                    generateQuickWorkout(todaysProgram.focus as WorkoutFocus);
                    setView("generate");
                  }}
                >
                  Generate Workout
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Generate */}
        {showQuickGenerate && (
          <div className="workout-widget__generate">
            <h4>Quick Workout</h4>
            <div className="workout-widget__focus-grid">
              {FOCUS_OPTIONS.slice(0, compact ? 3 : 6).map(focus => (
                <button
                  key={focus.id}
                  className="workout-widget__focus-btn"
                  onClick={() => {
                    generateQuickWorkout(focus.id);
                    setView("generate");
                  }}
                >
                  <span className="workout-widget__focus-icon">{focus.icon}</span>
                  <span className="workout-widget__focus-label">{focus.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="workout-widget__main-actions">
          <button
            className="workout-widget__browse-btn"
            onClick={() => setView("program")}
          >
            View Weekly Program
          </button>
          <button
            className="workout-widget__browse-btn workout-widget__browse-btn--secondary"
            onClick={() => setView("exercises")}
          >
            Browse Exercises
          </button>
        </div>
      </div>
    );
  }

  // Program view - show weekly schedule
  if (view === "program") {
    return (
      <div className="workout-widget workout-widget--program">
        <div className="workout-widget__header">
          <button className="workout-widget__back" onClick={() => setView("main")}>
            ← Back
          </button>
          <h4>Weekly Program</h4>
        </div>

        {gymProfile && (
          <div className="workout-widget__program-info">
            <span className="workout-widget__program-badge">
              {gymProfile.daysPerWeek} days/week
            </span>
            <span className="workout-widget__program-badge">
              {gymProfile.preferredDuration} min sessions
            </span>
          </div>
        )}

        <div className="workout-widget__program-list">
          {weeklyProgram?.map((day) => (
            <div
              key={day.dayIndex}
              className={`workout-widget__program-day ${
                day.focus === "rest" || day.focus === "active_recovery"
                  ? "workout-widget__program-day--rest"
                  : ""
              }`}
            >
              <div className="workout-widget__program-day-header">
                <span className="workout-widget__program-day-label">
                  {DAY_LABELS[day.dayIndex]}
                </span>
                <span className="workout-widget__program-day-name">
                  {day.name}
                </span>
              </div>
              <span className="workout-widget__program-day-desc">
                {day.description}
              </span>
              {day.focus !== "rest" && day.focus !== "active_recovery" && (
                <button
                  className="workout-widget__program-day-btn"
                  onClick={() => {
                    generateQuickWorkout(day.focus as WorkoutFocus);
                    setView("generate");
                  }}
                >
                  Generate
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="workout-widget__program-tips">
          <h5>Program Tips</h5>
          <ul>
            <li>Train the hardest sessions when you're freshest</li>
            <li>Leave 48 hours between training the same muscle group</li>
            <li>Prioritize sleep and nutrition for recovery</li>
            {gymProfile?.goals.includes("bjj") && (
              <li>Schedule lifting around BJJ - avoid heavy legs before rolling</li>
            )}
          </ul>
        </div>
      </div>
    );
  }

  // Generate view - show generated workout
  if (view === "generate" && generatedWorkout) {
    const focusOption = FOCUS_OPTIONS.find(f => f.id === selectedFocus);

    return (
      <div className="workout-widget workout-widget--generate">
        <div className="workout-widget__header">
          <button className="workout-widget__back" onClick={() => setView("main")}>
            ← Back
          </button>
          <h4>{focusOption?.icon} {focusOption?.label} Workout</h4>
        </div>

        {generatedWorkout.length > 0 ? (
          <>
            <div className="workout-widget__workout-meta">
              <span>~{gymProfile?.preferredDuration || 45} min</span>
              <span>{generatedWorkout.length} exercises</span>
            </div>

            <div className="workout-widget__exercise-list">
              {generatedWorkout.map((exercise, idx) => (
                <div key={exercise.id} className="workout-widget__exercise-item">
                  <span className="workout-widget__exercise-num">{idx + 1}</span>
                  <div className="workout-widget__exercise-info">
                    <span className="workout-widget__exercise-name">{exercise.name}</span>
                    <span className="workout-widget__exercise-detail">
                      {exercise.defaultSets} × {exercise.defaultReps}
                      {exercise.defaultRest && exercise.defaultRest > 0 && (
                        <span className="workout-widget__exercise-rest"> • {exercise.defaultRest}s rest</span>
                      )}
                    </span>
                    <span className="workout-widget__exercise-muscles">
                      {exercise.primaryMuscles.slice(0, 2).map(m => getMuscleGroupLabel(m)).join(", ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="workout-widget__actions">
              <button
                className="workout-widget__action-btn workout-widget__action-btn--secondary"
                onClick={() => generateQuickWorkout(selectedFocus!)}
              >
                Shuffle
              </button>
              <button
                className="workout-widget__action-btn workout-widget__action-btn--primary"
                onClick={startWorkout}
              >
                Start Workout
              </button>
            </div>
          </>
        ) : (
          <div className="workout-widget__empty">
            <p>No exercises found for this focus.</p>
            <p>Try selecting different equipment in your profile!</p>
          </div>
        )}
      </div>
    );
  }

  // Exercises view - browse exercises
  if (view === "exercises") {
    return (
      <div className="workout-widget workout-widget--exercises">
        <div className="workout-widget__header">
          <button className="workout-widget__back" onClick={() => setView("main")}>
            ← Back
          </button>
          <h4>Exercise Library ({workout.exercises.length})</h4>
        </div>

        <div className="workout-widget__exercise-grid">
          {workout.exercises.slice(0, 12).map(exercise => (
            <div key={exercise.id} className="workout-widget__exercise-card">
              <span className="workout-widget__exercise-name">{exercise.name}</span>
              <span className="workout-widget__exercise-muscles">
                {exercise.primaryMuscles.slice(0, 2).map(m => getMuscleGroupLabel(m)).join(", ")}
              </span>
              {exercise.isFavorite && <span className="workout-widget__favorite">★</span>}
            </div>
          ))}
        </div>

        {workout.exercises.length > 12 && (
          <p className="workout-widget__more">
            +{workout.exercises.length - 12} more exercises
          </p>
        )}
      </div>
    );
  }

  return null;
}
