// ActiveRoutineModal - Step-by-step routine execution modal
// Can be used from anywhere in the app to run a routine

import { useState } from "react";
import { Routine, LOOP_COLORS, LOOP_DEFINITIONS } from "../../types";

interface ActiveRoutineModalProps {
  routine: Routine;
  onClose: () => void;
  onComplete: () => void;
  onSkip: () => void;
}

export function ActiveRoutineModal({
  routine,
  onClose,
  onComplete,
  onSkip,
}: ActiveRoutineModalProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [skippedSteps, setSkippedSteps] = useState<Set<string>>(new Set());

  const requiredSteps = routine.steps.filter((s) => !s.optional);
  const allRequiredDone = requiredSteps.every(
    (s) => completedSteps.has(s.id) || skippedSteps.has(s.id)
  );

  const toggleStep = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
      // Remove from skipped if it was skipped
      const newSkipped = new Set(skippedSteps);
      newSkipped.delete(stepId);
      setSkippedSteps(newSkipped);
    }
    setCompletedSteps(newCompleted);
  };

  const skipStep = (stepId: string) => {
    const newSkipped = new Set(skippedSteps);
    newSkipped.add(stepId);
    setSkippedSteps(newSkipped);
    // Remove from completed if it was completed
    const newCompleted = new Set(completedSteps);
    newCompleted.delete(stepId);
    setCompletedSteps(newCompleted);
  };

  const progress = Math.round(
    ((completedSteps.size + skippedSteps.size) / routine.steps.length) * 100
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="routine-active-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <span className="modal-header-icon">{routine.icon || "📋"}</span>
            <h3>{routine.title}</h3>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Progress bar */}
        <div className="routine-progress">
          <div className="routine-progress-bar">
            <div
              className="routine-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="routine-progress-text">
            {completedSteps.size}/{routine.steps.length} completed
          </span>
        </div>

        {/* Steps checklist */}
        <div className="routine-steps-list">
          {routine.steps.map((step) => {
            const isCompleted = completedSteps.has(step.id);
            const isSkipped = skippedSteps.has(step.id);
            const color = LOOP_COLORS[step.loop];
            const loop = LOOP_DEFINITIONS[step.loop];

            return (
              <div
                key={step.id}
                className={`routine-step-item ${isCompleted ? "completed" : ""} ${isSkipped ? "skipped" : ""}`}
                style={{ borderLeftColor: color.border }}
              >
                <button
                  className={`routine-step-checkbox ${isCompleted ? "checked" : ""}`}
                  onClick={() => toggleStep(step.id)}
                >
                  {isCompleted && (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </button>

                <div className="routine-step-content">
                  <div className="routine-step-title">{step.title}</div>
                  <div className="routine-step-meta">
                    <span style={{ color: color.text }}>{loop.icon} {step.loop}</span>
                    {step.estimateMinutes && <span>{step.estimateMinutes}m</span>}
                    {step.optional && <span className="optional-tag">optional</span>}
                  </div>
                </div>

                {!isCompleted && !isSkipped && step.optional && (
                  <button
                    className="routine-step-skip"
                    onClick={() => skipStep(step.id)}
                  >
                    Skip
                  </button>
                )}

                {isSkipped && (
                  <span className="routine-step-skipped-badge">Skipped</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="modal-actions">
          <button className="modal-btn modal-btn--secondary" onClick={onSkip}>
            Skip Today
          </button>
          <button
            className="modal-btn modal-btn--primary"
            onClick={onComplete}
            disabled={!allRequiredDone}
          >
            {allRequiredDone ? "Complete Routine" : "Complete Required Steps"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActiveRoutineModal;
