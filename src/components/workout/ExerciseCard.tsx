// Exercise Card - Display exercise in grid/list view
import React from "react";
import {
  Exercise,
  getDifficultyLabel,
  getDifficultyColor,
  getMuscleGroupLabel,
  getMovementPatternLabel,
} from "../../types/workout";

interface ExerciseCardProps {
  exercise: Exercise;
  onView: () => void;
  onToggleFavorite: () => void;
  compact?: boolean;
}

export function ExerciseCard({
  exercise,
  onView,
  onToggleFavorite,
  compact = false,
}: ExerciseCardProps) {
  const difficultyColor = getDifficultyColor(exercise.difficulty);

  if (compact) {
    // List view
    return (
      <div className="exercise-card exercise-card--compact" onClick={onView}>
        <div className="exercise-card__compact-image">
          {exercise.imageUrl ? (
            <img src={exercise.imageUrl} alt={exercise.name} />
          ) : (
            <div className="exercise-card__placeholder">💪</div>
          )}
        </div>
        <div className="exercise-card__compact-content">
          <h3 className="exercise-card__title">{exercise.name}</h3>
          <div className="exercise-card__meta">
            <span className="exercise-card__muscles">
              {exercise.primaryMuscles.map(getMuscleGroupLabel).join(", ")}
            </span>
            <span className="exercise-card__separator">•</span>
            <span className="exercise-card__movement">
              {getMovementPatternLabel(exercise.movementPattern)}
            </span>
          </div>
        </div>
        <div className="exercise-card__compact-right">
          <span
            className="exercise-card__difficulty"
            style={{ backgroundColor: `${difficultyColor}20`, color: difficultyColor }}
          >
            {getDifficultyLabel(exercise.difficulty)}
          </span>
          <button
            className={`exercise-card__favorite ${exercise.isFavorite ? "exercise-card__favorite--active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            {exercise.isFavorite ? "★" : "☆"}
          </button>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="exercise-card" onClick={onView}>
      <div className="exercise-card__image">
        {exercise.imageUrl ? (
          <img src={exercise.imageUrl} alt={exercise.name} />
        ) : (
          <div className="exercise-card__placeholder">
            <span className="exercise-card__placeholder-icon">💪</span>
          </div>
        )}
        <button
          className={`exercise-card__favorite ${exercise.isFavorite ? "exercise-card__favorite--active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          {exercise.isFavorite ? "★" : "☆"}
        </button>
        <span
          className="exercise-card__difficulty-badge"
          style={{ backgroundColor: difficultyColor }}
        >
          {getDifficultyLabel(exercise.difficulty)}
        </span>
      </div>

      <div className="exercise-card__content">
        <h3 className="exercise-card__title">{exercise.name}</h3>

        <div className="exercise-card__info">
          <div className="exercise-card__muscles">
            {exercise.primaryMuscles.slice(0, 3).map((muscle) => (
              <span key={muscle} className="exercise-card__muscle-tag">
                {getMuscleGroupLabel(muscle)}
              </span>
            ))}
          </div>
          <span className="exercise-card__movement-badge">
            {getMovementPatternLabel(exercise.movementPattern)}
          </span>
        </div>

        {exercise.requiredEquipment.length > 0 && (
          <div className="exercise-card__equipment">
            <span className="exercise-card__equipment-icon">🏋️</span>
            <span className="exercise-card__equipment-text">
              {exercise.requiredEquipment.slice(0, 2).join(", ")}
              {exercise.requiredEquipment.length > 2 && ` +${exercise.requiredEquipment.length - 2}`}
            </span>
          </div>
        )}

        <div className="exercise-card__footer">
          {exercise.defaultSets && exercise.defaultReps && (
            <span className="exercise-card__default">
              {exercise.defaultSets} × {exercise.defaultReps}
            </span>
          )}
          {exercise.timesPerformed > 0 && (
            <span className="exercise-card__performed">
              Done {exercise.timesPerformed}×
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
