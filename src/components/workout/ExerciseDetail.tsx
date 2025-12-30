// Exercise Detail - Full view of an exercise
import React, { useState } from "react";
import {
  Exercise,
  getDifficultyLabel,
  getDifficultyColor,
  getMuscleGroupLabel,
  getMovementPatternLabel,
} from "../../types/workout";

interface ExerciseDetailProps {
  exercise: Exercise;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (exerciseId: string) => void;
}

export function ExerciseDetail({
  exercise,
  onClose,
  onEdit,
  onDelete,
}: ExerciseDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const difficultyColor = getDifficultyColor(exercise.difficulty);

  return (
    <div className="exercise-detail">
      {/* Header */}
      <div className="exercise-detail__header">
        <button className="exercise-detail__back" onClick={onClose}>
          ← Back
        </button>
        <div className="exercise-detail__actions">
          <button className="exercise-detail__edit" onClick={onEdit}>
            Edit
          </button>
          <button
            className="exercise-detail__delete"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="exercise-detail__content">
        {/* Image */}
        {exercise.imageUrl && (
          <div className="exercise-detail__image">
            <img src={exercise.imageUrl} alt={exercise.name} />
          </div>
        )}

        {/* Title & Meta */}
        <div className="exercise-detail__title-section">
          <h1 className="exercise-detail__title">{exercise.name}</h1>
          <div className="exercise-detail__meta">
            <span
              className="exercise-detail__difficulty"
              style={{ backgroundColor: `${difficultyColor}20`, color: difficultyColor }}
            >
              {getDifficultyLabel(exercise.difficulty)}
            </span>
            <span className="exercise-detail__movement">
              {getMovementPatternLabel(exercise.movementPattern)}
            </span>
            <span className="exercise-detail__category">{exercise.category}</span>
          </div>
        </div>

        {/* Description */}
        {exercise.description && (
          <div className="exercise-detail__section">
            <h3>Description</h3>
            <p>{exercise.description}</p>
          </div>
        )}

        {/* Muscles */}
        <div className="exercise-detail__section">
          <h3>Target Muscles</h3>
          <div className="exercise-detail__muscles">
            <div className="exercise-detail__muscle-group">
              <span className="exercise-detail__muscle-label">Primary:</span>
              <div className="exercise-detail__muscle-tags">
                {exercise.primaryMuscles.map((muscle) => (
                  <span key={muscle} className="exercise-detail__muscle-tag exercise-detail__muscle-tag--primary">
                    {getMuscleGroupLabel(muscle)}
                  </span>
                ))}
              </div>
            </div>
            {exercise.secondaryMuscles.length > 0 && (
              <div className="exercise-detail__muscle-group">
                <span className="exercise-detail__muscle-label">Secondary:</span>
                <div className="exercise-detail__muscle-tags">
                  {exercise.secondaryMuscles.map((muscle) => (
                    <span key={muscle} className="exercise-detail__muscle-tag">
                      {getMuscleGroupLabel(muscle)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Equipment */}
        {exercise.requiredEquipment.length > 0 && (
          <div className="exercise-detail__section">
            <h3>Equipment Required</h3>
            <div className="exercise-detail__equipment">
              {exercise.requiredEquipment.map((eq) => (
                <span key={eq} className="exercise-detail__equipment-item">
                  {eq}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Default Programming */}
        {(exercise.defaultSets || exercise.defaultReps || exercise.defaultRest) && (
          <div className="exercise-detail__section">
            <h3>Default Programming</h3>
            <div className="exercise-detail__programming">
              {exercise.defaultSets && (
                <div className="exercise-detail__program-item">
                  <span className="exercise-detail__program-value">{exercise.defaultSets}</span>
                  <span className="exercise-detail__program-label">Sets</span>
                </div>
              )}
              {exercise.defaultReps && (
                <div className="exercise-detail__program-item">
                  <span className="exercise-detail__program-value">{exercise.defaultReps}</span>
                  <span className="exercise-detail__program-label">Reps</span>
                </div>
              )}
              {exercise.defaultRest && (
                <div className="exercise-detail__program-item">
                  <span className="exercise-detail__program-value">{exercise.defaultRest}s</span>
                  <span className="exercise-detail__program-label">Rest</span>
                </div>
              )}
              {exercise.tempo && (
                <div className="exercise-detail__program-item">
                  <span className="exercise-detail__program-value">{exercise.tempo}</span>
                  <span className="exercise-detail__program-label">Tempo</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Coaching Cues */}
        {exercise.cues.length > 0 && (
          <div className="exercise-detail__section">
            <h3>Coaching Cues</h3>
            <ul className="exercise-detail__cues">
              {exercise.cues.map((cue, index) => (
                <li key={index} className="exercise-detail__cue">
                  {cue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Common Mistakes */}
        {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
          <div className="exercise-detail__section">
            <h3>Common Mistakes</h3>
            <ul className="exercise-detail__mistakes">
              {exercise.commonMistakes.map((mistake, index) => (
                <li key={index} className="exercise-detail__mistake">
                  ⚠️ {mistake}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Variations */}
        {exercise.variations && exercise.variations.length > 0 && (
          <div className="exercise-detail__section">
            <h3>Variations</h3>
            <div className="exercise-detail__variations">
              {exercise.variations.map((variation, index) => (
                <span key={index} className="exercise-detail__variation">
                  {variation}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Progressions */}
        {exercise.progressions && (
          <div className="exercise-detail__section">
            <h3>Progressions</h3>
            <div className="exercise-detail__progressions">
              {exercise.progressions.easier.length > 0 && (
                <div className="exercise-detail__progression-group">
                  <span className="exercise-detail__progression-label">Easier:</span>
                  <div className="exercise-detail__progression-items">
                    {exercise.progressions.easier.map((p, i) => (
                      <span key={i} className="exercise-detail__progression-item">{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {exercise.progressions.harder.length > 0 && (
                <div className="exercise-detail__progression-group">
                  <span className="exercise-detail__progression-label">Harder:</span>
                  <div className="exercise-detail__progression-items">
                    {exercise.progressions.harder.map((p, i) => (
                      <span key={i} className="exercise-detail__progression-item">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Personal Record */}
        {exercise.personalRecord && (
          <div className="exercise-detail__section">
            <h3>Personal Record</h3>
            <div className="exercise-detail__pr">
              {exercise.personalRecord.weight && (
                <span className="exercise-detail__pr-item">
                  {exercise.personalRecord.weight} lbs
                </span>
              )}
              {exercise.personalRecord.reps && (
                <span className="exercise-detail__pr-item">
                  {exercise.personalRecord.reps} reps
                </span>
              )}
              {exercise.personalRecord.time && (
                <span className="exercise-detail__pr-item">
                  {exercise.personalRecord.time}s
                </span>
              )}
              <span className="exercise-detail__pr-date">
                Set on {new Date(exercise.personalRecord.date).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* User Notes */}
        {exercise.userNotes && (
          <div className="exercise-detail__section">
            <h3>My Notes</h3>
            <p className="exercise-detail__notes">{exercise.userNotes}</p>
          </div>
        )}

        {/* Stats */}
        <div className="exercise-detail__stats">
          {exercise.timesPerformed > 0 && (
            <div className="exercise-detail__stat">
              <span className="exercise-detail__stat-value">{exercise.timesPerformed}</span>
              <span className="exercise-detail__stat-label">Times Performed</span>
            </div>
          )}
          {exercise.lastPerformed && (
            <div className="exercise-detail__stat">
              <span className="exercise-detail__stat-value">
                {new Date(exercise.lastPerformed).toLocaleDateString()}
              </span>
              <span className="exercise-detail__stat-label">Last Performed</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {exercise.tags.length > 0 && (
          <div className="exercise-detail__tags">
            {exercise.tags.map((tag) => (
              <span key={tag} className="exercise-detail__tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="exercise-detail__delete-modal">
          <div className="exercise-detail__delete-content">
            <h3>Delete Exercise?</h3>
            <p>Are you sure you want to delete "{exercise.name}"?</p>
            <div className="exercise-detail__delete-actions">
              <button
                className="exercise-detail__delete-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="exercise-detail__delete-confirm"
                onClick={() => onDelete(exercise.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
