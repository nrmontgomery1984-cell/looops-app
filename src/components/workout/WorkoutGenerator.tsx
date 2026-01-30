// Workout Generator - Smart workout suggestions based on constraints
import React, { useState, useMemo } from "react";
import {
  Exercise,
  GymProfile,
  MuscleGroup,
  PlannedWorkout,
  exerciseMatchesConstraints,
  WorkoutConstraints,
  getMuscleGroupLabel,
  getDifficultyLabel,
  getDifficultyColor,
} from "../../types/workout";

interface WorkoutGeneratorProps {
  exercises: Exercise[];
  gymProfile: GymProfile | null;
  onSelectExercise: (exercise: Exercise) => void;
  onClose: () => void;
}

type FocusArea = "upper" | "lower" | "full_body" | "push" | "pull" | "core";

const FOCUS_AREAS: { value: FocusArea; label: string; muscles: MuscleGroup[] }[] = [
  { value: "upper", label: "Upper Body", muscles: ["chest", "back", "shoulders", "biceps", "triceps"] },
  { value: "lower", label: "Lower Body", muscles: ["quads", "hamstrings", "glutes", "calves"] },
  { value: "full_body", label: "Full Body", muscles: [] },
  { value: "push", label: "Push", muscles: ["chest", "shoulders", "triceps"] },
  { value: "pull", label: "Pull", muscles: ["back", "biceps", "forearms"] },
  { value: "core", label: "Core", muscles: ["core"] },
];

export function WorkoutGenerator({
  exercises,
  gymProfile,
  onSelectExercise,
  onClose,
}: WorkoutGeneratorProps) {
  const [duration, setDuration] = useState(gymProfile?.preferredDuration || 45);
  const [focusArea, setFocusArea] = useState<FocusArea>("full_body");
  const [mustBeQuiet, setMustBeQuiet] = useState(
    gymProfile?.limitations.includes("quiet_only") || false
  );
  const [generatedWorkout, setGeneratedWorkout] = useState<Exercise[] | null>(null);

  const availableEquipment = useMemo(() => {
    return gymProfile?.equipment
      .filter((eq) => eq.owned)
      .map((eq) => eq.id) || ["floor_space", "wall"];
  }, [gymProfile]);

  const handleGenerate = () => {
    const focusInfo = FOCUS_AREAS.find((f) => f.value === focusArea);
    const constraints: WorkoutConstraints = {
      duration,
      equipment: availableEquipment,
      focusAreas: focusInfo?.muscles.length ? focusInfo.muscles : undefined,
      mustBeQuiet,
      fitnessLevel: gymProfile?.fitnessLevel,
    };

    // Filter exercises that match constraints
    const matchingExercises = exercises.filter((e) =>
      exerciseMatchesConstraints(e, constraints)
    );

    if (matchingExercises.length === 0) {
      alert("No exercises match your criteria. Try adjusting your filters or adding more exercises.");
      return;
    }

    // Simple workout generation logic
    // Aim for ~8-10 exercises for a 45 min workout
    const targetExercises = Math.max(4, Math.floor(duration / 5));

    // Shuffle and pick exercises, trying to balance muscle groups
    const shuffled = [...matchingExercises].sort(() => Math.random() - 0.5);
    const selected: Exercise[] = [];
    const usedMuscles = new Set<MuscleGroup>();

    // First pass: pick exercises covering different muscle groups
    for (const exercise of shuffled) {
      if (selected.length >= targetExercises) break;

      const newMuscle = exercise.primaryMuscles.find((m) => !usedMuscles.has(m));
      if (newMuscle || selected.length < targetExercises / 2) {
        selected.push(exercise);
        exercise.primaryMuscles.forEach((m) => usedMuscles.add(m));
      }
    }

    // Fill remaining slots with any matching exercises
    for (const exercise of shuffled) {
      if (selected.length >= targetExercises) break;
      if (!selected.includes(exercise)) {
        selected.push(exercise);
      }
    }

    setGeneratedWorkout(selected);
  };

  const handleRegenerate = () => {
    setGeneratedWorkout(null);
    setTimeout(handleGenerate, 100);
  };

  const estimatedTime = useMemo(() => {
    if (!generatedWorkout) return 0;
    // Rough estimate: 3 sets × ~2 min per exercise + transitions
    return generatedWorkout.length * 5;
  }, [generatedWorkout]);

  return (
    <div className="workout-generator">
      <div className="workout-generator__header">
        <h2>Generate Workout</h2>
        <button className="workout-generator__close" onClick={onClose}>
          ×
        </button>
      </div>

      {!generatedWorkout ? (
        <div className="workout-generator__config">
          <div className="workout-generator__section">
            <label>Duration (minutes)</label>
            <div className="workout-generator__duration">
              {[20, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  className={`workout-generator__duration-btn ${
                    duration === mins ? "workout-generator__duration-btn--selected" : ""
                  }`}
                  onClick={() => setDuration(mins)}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          <div className="workout-generator__section">
            <label>Focus Area</label>
            <div className="workout-generator__focus-grid">
              {FOCUS_AREAS.map((area) => (
                <button
                  key={area.value}
                  className={`workout-generator__focus-btn ${
                    focusArea === area.value ? "workout-generator__focus-btn--selected" : ""
                  }`}
                  onClick={() => setFocusArea(area.value)}
                >
                  {area.label}
                </button>
              ))}
            </div>
          </div>

          <div className="workout-generator__section">
            <label className="workout-generator__checkbox">
              <input
                type="checkbox"
                checked={mustBeQuiet}
                onChange={(e) => setMustBeQuiet(e.target.checked)}
              />
              <span>Quiet only (no jumping/dropping)</span>
            </label>
          </div>

          <div className="workout-generator__info">
            <p>
              <strong>{exercises.length}</strong> exercises in your library
            </p>
            <p>
              <strong>{availableEquipment.length}</strong> equipment items available
            </p>
          </div>

          <button
            className="workout-generator__generate-btn"
            onClick={handleGenerate}
            disabled={exercises.length === 0}
          >
            Generate Workout
          </button>
        </div>
      ) : (
        <div className="workout-generator__result">
          <div className="workout-generator__result-header">
            <div className="workout-generator__result-meta">
              <span className="workout-generator__result-count">
                {generatedWorkout.length} exercises
              </span>
              <span className="workout-generator__result-time">
                ~{estimatedTime} min
              </span>
            </div>
            <button
              className="workout-generator__regenerate"
              onClick={handleRegenerate}
            >
              🔄 Regenerate
            </button>
          </div>

          <div className="workout-generator__exercise-list">
            {generatedWorkout.map((exercise, index) => (
              <div
                key={exercise.id}
                className="workout-generator__exercise"
                onClick={() => onSelectExercise(exercise)}
              >
                <div className="workout-generator__exercise-number">{index + 1}</div>
                <div className="workout-generator__exercise-content">
                  <h4 className="workout-generator__exercise-name">{exercise.name}</h4>
                  <div className="workout-generator__exercise-meta">
                    <span className="workout-generator__exercise-muscles">
                      {exercise.primaryMuscles.map(getMuscleGroupLabel).join(", ")}
                    </span>
                    <span
                      className="workout-generator__exercise-difficulty"
                      style={{
                        backgroundColor: `${getDifficultyColor(exercise.difficulty)}20`,
                        color: getDifficultyColor(exercise.difficulty),
                      }}
                    >
                      {getDifficultyLabel(exercise.difficulty)}
                    </span>
                  </div>
                  {(exercise.defaultSets || exercise.defaultReps) && (
                    <div className="workout-generator__exercise-prescription">
                      {exercise.defaultSets && `${exercise.defaultSets} sets`}
                      {exercise.defaultSets && exercise.defaultReps && " × "}
                      {exercise.defaultReps && `${exercise.defaultReps}`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="workout-generator__actions">
            <button
              className="workout-generator__back-btn"
              onClick={() => setGeneratedWorkout(null)}
            >
              ← Adjust Settings
            </button>
            <button className="workout-generator__start-btn" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
