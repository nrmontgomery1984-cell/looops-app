// QuickDecisionFlow - Fast 4-question decision capture
// For quick decisions that don't need the full coaching experience

import React, { useState } from "react";
import { useApp } from "../../context";
import {
  QuickDecision,
  FeelingScore,
  DecisionChoice,
  LoopId,
  ALL_LOOPS,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
  createQuickDecision,
  getFeelingLabel,
  isSafeToDecide,
  getFeelingAdvice,
} from "../../types";

interface QuickDecisionFlowProps {
  onComplete: () => void;
  onCancel: () => void;
  onPromoteToFull?: () => void;
  parentTaskId?: string;
}

export function QuickDecisionFlow({
  onComplete,
  onCancel,
  onPromoteToFull,
  parentTaskId,
}: QuickDecisionFlowProps) {
  const { dispatch } = useApp();

  // Form state - just the essential 4 questions
  const [title, setTitle] = useState("");
  const [loop, setLoop] = useState<LoopId | null>(null);
  const [feelingScore, setFeelingScore] = useState<FeelingScore>(3);
  const [oneReason, setOneReason] = useState("");
  const [isReversible, setIsReversible] = useState(true);
  const [asymmetry, setAsymmetry] = useState("");
  const [finalChoice, setFinalChoice] = useState<DecisionChoice>("defer");

  // Current step
  const [step, setStep] = useState<"setup" | "feeling" | "reason" | "stakes" | "decide">("setup");

  const feelingEmojis: Record<FeelingScore, string> = {
    1: "😰",
    2: "😟",
    3: "😐",
    4: "🤑",
    5: "🤩",
  };

  const feelingColors: Record<FeelingScore, string> = {
    1: "#F27059",
    2: "#F4B942",
    3: "#73A58C",
    4: "#F4B942",
    5: "#F27059",
  };

  const handleSave = () => {
    if (!loop) return;

    const quickDecision = createQuickDecision({
      title,
      loop,
      feelingScore,
      oneReason,
      isReversible,
      asymmetry,
      finalChoice,
      parentTaskId,
    });

    dispatch({ type: "ADD_QUICK_DECISION", payload: quickDecision });
    onComplete();
  };

  const canProceed = (): boolean => {
    switch (step) {
      case "setup":
        return title.trim().length > 0 && loop !== null;
      case "feeling":
        return true;
      case "reason":
        return oneReason.trim().length > 0;
      case "stakes":
        return asymmetry.trim().length > 0;
      case "decide":
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    switch (step) {
      case "setup":
        setStep("feeling");
        break;
      case "feeling":
        setStep("reason");
        break;
      case "reason":
        setStep("stakes");
        break;
      case "stakes":
        setStep("decide");
        break;
    }
  };

  const prevStep = () => {
    switch (step) {
      case "feeling":
        setStep("setup");
        break;
      case "reason":
        setStep("feeling");
        break;
      case "stakes":
        setStep("reason");
        break;
      case "decide":
        setStep("stakes");
        break;
    }
  };

  const stepIndex = ["setup", "feeling", "reason", "stakes", "decide"].indexOf(step);
  const progress = ((stepIndex + 1) / 5) * 100;

  return (
    <div className="quick-decision">
      {/* Header */}
      <div className="quick-decision-header">
        <div className="quick-progress">
          <div className="quick-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="quick-header-row">
          <h3>Quick Decision</h3>
          <button className="quick-close-btn" onClick={onCancel}>×</button>
        </div>
      </div>

      {/* Content */}
      <div className="quick-decision-content">
        {step === "setup" && (
          <div className="quick-step">
            <h4>What's the decision?</h4>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 280))}
              placeholder="Quick description..."
              rows={2}
              className="quick-textarea"
              autoFocus
            />

            {title.length > 5 && (
              <>
                <h4>Which loop?</h4>
                <div className="quick-loop-grid">
                  {ALL_LOOPS.map((loopId) => {
                    const def = LOOP_DEFINITIONS[loopId];
                    const colors = LOOP_COLORS[loopId];
                    const isSelected = loop === loopId;

                    return (
                      <button
                        key={loopId}
                        className={`quick-loop-btn ${isSelected ? "quick-loop-btn--selected" : ""}`}
                        onClick={() => setLoop(loopId)}
                        style={{
                          borderColor: isSelected ? colors.border : undefined,
                          backgroundColor: isSelected ? colors.bg : undefined,
                        }}
                      >
                        <span>{def.icon}</span>
                        <span>{loopId}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {step === "feeling" && (
          <div className="quick-step">
            <h4>How are you feeling about this?</h4>

            <div className="quick-feeling-scale">
              {([1, 2, 3, 4, 5] as FeelingScore[]).map((score) => (
                <button
                  key={score}
                  className={`quick-feeling-btn ${feelingScore === score ? "quick-feeling-btn--selected" : ""}`}
                  onClick={() => setFeelingScore(score)}
                  style={{
                    borderColor: feelingScore === score ? feelingColors[score] : undefined,
                    backgroundColor: feelingScore === score ? `${feelingColors[score]}20` : undefined,
                  }}
                >
                  <span className="feeling-emoji">{feelingEmojis[score]}</span>
                  <span className="feeling-label">{getFeelingLabel(score)}</span>
                </button>
              ))}
            </div>

            {!isSafeToDecide(feelingScore) && (
              <div
                className="quick-feeling-warning"
                style={{
                  borderColor: feelingColors[feelingScore],
                  backgroundColor: `${feelingColors[feelingScore]}15`,
                }}
              >
                <p>{getFeelingAdvice(feelingScore)}</p>
                {onPromoteToFull && (
                  <button className="quick-promote-btn" onClick={onPromoteToFull}>
                    Use Full Decision Coach Instead
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {step === "reason" && (
          <div className="quick-step">
            <h4>What's the ONE reason to do this?</h4>
            <p className="quick-hint">Not a list. One decisive reason.</p>
            <textarea
              value={oneReason}
              onChange={(e) => setOneReason(e.target.value)}
              placeholder="The main reason is..."
              rows={3}
              className="quick-textarea"
              autoFocus
            />
          </div>
        )}

        {step === "stakes" && (
          <div className="quick-step">
            <h4>Can you undo this?</h4>
            <div className="quick-reversibility">
              <button
                className={`quick-rev-btn ${isReversible ? "quick-rev-btn--selected" : ""}`}
                onClick={() => setIsReversible(true)}
              >
                Yes, reversible
              </button>
              <button
                className={`quick-rev-btn ${!isReversible ? "quick-rev-btn--selected" : ""}`}
                onClick={() => setIsReversible(false)}
              >
                No, one-way
              </button>
            </div>

            <h4>Quick asymmetry check</h4>
            <p className="quick-hint">Upside vs downside in one line</p>
            <textarea
              value={asymmetry}
              onChange={(e) => setAsymmetry(e.target.value)}
              placeholder="Upside: ... Downside: ..."
              rows={2}
              className="quick-textarea"
            />

            {!isReversible && onPromoteToFull && (
              <div className="quick-irreversible-warning">
                <p>This is irreversible. Consider using the full Decision Coach.</p>
                <button className="quick-promote-btn" onClick={onPromoteToFull}>
                  Use Full Decision Coach
                </button>
              </div>
            )}
          </div>
        )}

        {step === "decide" && (
          <div className="quick-step">
            <h4>Your decision</h4>

            <div className="quick-decision-summary">
              <div
                className="summary-badge"
                style={{
                  backgroundColor: loop ? LOOP_COLORS[loop].bg : undefined,
                  borderColor: loop ? LOOP_COLORS[loop].border : undefined,
                }}
              >
                {loop && LOOP_DEFINITIONS[loop].icon} {loop}
              </div>
              <p className="summary-title">{title}</p>
              <p className="summary-reason">"{oneReason}"</p>
              <p className="summary-stakes">
                {isReversible ? "Reversible" : "Irreversible"} • {asymmetry}
              </p>
            </div>

            <div className="quick-choice-buttons">
              <button
                className={`quick-choice-btn quick-choice-btn--proceed ${finalChoice === "proceed" ? "quick-choice-btn--selected" : ""}`}
                onClick={() => setFinalChoice("proceed")}
              >
                ✓ Proceed
              </button>
              <button
                className={`quick-choice-btn quick-choice-btn--decline ${finalChoice === "decline" ? "quick-choice-btn--selected" : ""}`}
                onClick={() => setFinalChoice("decline")}
              >
                ✗ Decline
              </button>
              <button
                className={`quick-choice-btn quick-choice-btn--defer ${finalChoice === "defer" ? "quick-choice-btn--selected" : ""}`}
                onClick={() => setFinalChoice("defer")}
              >
                ⏸ Defer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="quick-decision-footer">
        {stepIndex > 0 && (
          <button className="quick-btn quick-btn--secondary" onClick={prevStep}>
            ← Back
          </button>
        )}
        <div className="quick-footer-spacer" />
        {step === "decide" ? (
          <button className="quick-btn quick-btn--primary" onClick={handleSave}>
            Save Decision
          </button>
        ) : (
          <button
            className="quick-btn quick-btn--primary"
            onClick={nextStep}
            disabled={!canProceed()}
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
