// DecisionSurvey - Multi-step decision survey flow
// Based on MFM Episode 781 decision framework

import React, { useState } from "react";
import { useApp } from "../../context";
import {
  Decision,
  DecisionSurvey as DecisionSurveyData,
  DecisionChoice,
  FeelingScore,
  JoustWinner,
  LoopId,
  ALL_LOOPS,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
  createDecision,
  getFeelingLabel,
  getFeelingAdvice,
  isSafeToDecide,
} from "../../types";

type SurveyStep =
  | "setup"
  | "emotional"
  | "joust"
  | "quality"
  | "substitutes"
  | "trigger"
  | "stakes"
  | "confidence"
  | "summary";

const STEPS: SurveyStep[] = [
  "setup",
  "emotional",
  "joust",
  "quality",
  "substitutes",
  "trigger",
  "stakes",
  "confidence",
  "summary",
];

const STEP_TITLES: Record<SurveyStep, string> = {
  setup: "What's the Decision?",
  emotional: "Emotional Check-In",
  joust: "The Joust",
  quality: "Reason Quality Check",
  substitutes: "Substitutes & Motivation",
  trigger: "Trigger & Alternatives",
  stakes: "Stakes Assessment",
  confidence: "Confidence & Decision",
  summary: "Summary",
};

interface DecisionSurveyProps {
  onComplete: () => void;
  onCancel: () => void;
  existingDecision?: Decision; // For editing drafts
}

export function DecisionSurvey({
  onComplete,
  onCancel,
  existingDecision,
}: DecisionSurveyProps) {
  const { dispatch } = useApp();
  const [step, setStep] = useState<SurveyStep>("setup");

  // Form state
  const [title, setTitle] = useState(existingDecision?.title || "");
  const [loop, setLoop] = useState<LoopId | null>(existingDecision?.loop || null);
  const [feelingScore, setFeelingScore] = useState<FeelingScore>(
    existingDecision?.survey.feelingScore || 3
  );
  const [oneReason, setOneReason] = useState(existingDecision?.survey.oneReason || "");
  const [reasonAgainst, setReasonAgainst] = useState(
    existingDecision?.survey.reasonAgainst || ""
  );
  const [joustWinner, setJoustWinner] = useState<JoustWinner>(
    existingDecision?.survey.joustWinner || "for"
  );
  const [isHonest, setIsHonest] = useState(existingDecision?.survey.isHonest || false);
  const [isConcise, setIsConcise] = useState(existingDecision?.survey.isConcise || false);
  const [isTiedToValues, setIsTiedToValues] = useState(
    existingDecision?.survey.isTiedToValues || false
  );
  const [validSubstitutes, setValidSubstitutes] = useState(
    existingDecision?.survey.validSubstitutes || ""
  );
  const [withoutSecondaryBenefits, setWithoutSecondaryBenefits] = useState(
    existingDecision?.survey.withoutSecondaryBenefits || false
  );
  const [trigger, setTrigger] = useState(existingDecision?.survey.trigger || "");
  const [alternativesConsidered, setAlternativesConsidered] = useState<string[]>(
    existingDecision?.survey.alternativesConsidered || []
  );
  const [newAlternative, setNewAlternative] = useState("");
  const [isReversible, setIsReversible] = useState(
    existingDecision?.survey.isReversible ?? true
  );
  const [upsideIfRight, setUpsideIfRight] = useState(
    existingDecision?.survey.upsideIfRight || ""
  );
  const [downsideIfWrong, setDownsideIfWrong] = useState(
    existingDecision?.survey.downsideIfWrong || ""
  );
  const [confidenceLevel, setConfidenceLevel] = useState(
    existingDecision?.confidenceLevel || 5
  );
  const [finalChoice, setFinalChoice] = useState<DecisionChoice>(
    existingDecision?.finalChoice || "defer"
  );

  // Navigation
  const currentStepIndex = STEPS.indexOf(step);
  const progressPercent = ((currentStepIndex + 1) / STEPS.length) * 100;

  const nextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setStep(STEPS[currentStepIndex + 1]);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setStep(STEPS[currentStepIndex - 1]);
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case "setup":
        return title.trim().length > 0 && loop !== null;
      case "emotional":
        return true; // Can always proceed, even at extremes
      case "joust":
        return oneReason.trim().length > 0 && reasonAgainst.trim().length > 0;
      case "quality":
        return true; // Advisory step
      case "substitutes":
        return true; // Optional
      case "trigger":
        return trigger.trim().length > 0;
      case "stakes":
        return upsideIfRight.trim().length > 0 && downsideIfWrong.trim().length > 0;
      case "confidence":
        return finalChoice !== null;
      case "summary":
        return true;
      default:
        return false;
    }
  };

  const handleSave = () => {
    if (!loop) return;

    const survey: DecisionSurveyData = {
      feelingScore,
      oneReason,
      reasonAgainst,
      joustWinner,
      isHonest,
      isConcise,
      isTiedToValues,
      validSubstitutes: validSubstitutes.trim() || null,
      withoutSecondaryBenefits,
      trigger,
      alternativesConsidered,
      isReversible,
      upsideIfRight,
      downsideIfWrong,
    };

    const decision = createDecision({
      title,
      loop,
      status: "decided",
      survey,
      confidenceLevel,
      finalChoice,
    });

    dispatch({ type: "ADD_DECISION", payload: decision });
    onComplete();
  };

  const handleSaveDraft = () => {
    if (!loop || !title.trim()) return;

    const survey: DecisionSurveyData = {
      feelingScore,
      oneReason,
      reasonAgainst,
      joustWinner,
      isHonest,
      isConcise,
      isTiedToValues,
      validSubstitutes: validSubstitutes.trim() || null,
      withoutSecondaryBenefits,
      trigger,
      alternativesConsidered,
      isReversible,
      upsideIfRight,
      downsideIfWrong,
    };

    const decision = createDecision({
      title,
      loop,
      status: "pending",
      survey,
      confidenceLevel,
      finalChoice,
    });

    dispatch({ type: "ADD_DECISION", payload: decision });
    onCancel();
  };

  const addAlternative = () => {
    if (newAlternative.trim()) {
      setAlternativesConsidered([...alternativesConsidered, newAlternative.trim()]);
      setNewAlternative("");
    }
  };

  const removeAlternative = (index: number) => {
    setAlternativesConsidered(alternativesConsidered.filter((_, i) => i !== index));
  };

  // Feeling emojis and colors
  const feelingEmojis: Record<FeelingScore, string> = {
    1: "😰",
    2: "😟",
    3: "😐",
    4: "🤑",
    5: "🤩",
  };

  const feelingColors: Record<FeelingScore, string> = {
    1: "#F27059", // Coral - danger
    2: "#F4B942", // Amber - warning
    3: "#73A58C", // Sage - safe
    4: "#F4B942", // Amber - warning
    5: "#F27059", // Coral - danger
  };

  // Render step content
  const renderStep = () => {
    switch (step) {
      case "setup":
        return (
          <div className="survey-step">
            <h2>{STEP_TITLES.setup}</h2>
            <p className="survey-subtitle">
              Describe your decision in one tweet-length sentence.
            </p>

            <div className="survey-field">
              <label>The decision</label>
              <div className="survey-input-wrapper">
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 280))}
                  placeholder="Should I accept the job offer at Company X?"
                  rows={3}
                  className="survey-textarea"
                />
                <span className="survey-char-count">{title.length}/280</span>
              </div>
            </div>

            <div className="survey-field">
              <label>Which life area does this affect?</label>
              <div className="survey-loop-grid">
                {ALL_LOOPS.map((loopId) => {
                  const def = LOOP_DEFINITIONS[loopId];
                  const colors = LOOP_COLORS[loopId];
                  const isSelected = loop === loopId;

                  return (
                    <button
                      key={loopId}
                      className={`survey-loop-btn ${isSelected ? "survey-loop-btn--selected" : ""}`}
                      onClick={() => setLoop(loopId)}
                      style={{
                        borderColor: isSelected ? colors.border : undefined,
                        backgroundColor: isSelected ? colors.bg : undefined,
                      }}
                    >
                      <span className="survey-loop-icon">{def.icon}</span>
                      <span className="survey-loop-name">{loopId}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {loop && (
              <div
                className="survey-context-hint"
                style={{
                  borderColor: LOOP_COLORS[loop].border,
                  backgroundColor: LOOP_COLORS[loop].bg,
                }}
              >
                <span className="hint-icon">{LOOP_DEFINITIONS[loop].icon}</span>
                <span className="hint-text">
                  {LOOP_DEFINITIONS[loop].description}
                </span>
              </div>
            )}
          </div>
        );

      case "emotional":
        return (
          <div className="survey-step">
            <h2>{STEP_TITLES.emotional}</h2>
            <p className="survey-subtitle">
              Before we analyze, let's check in. What are you feeling right now?
            </p>

            <div className="survey-feeling-scale">
              {([1, 2, 3, 4, 5] as FeelingScore[]).map((score) => (
                <button
                  key={score}
                  className={`survey-feeling-btn ${
                    feelingScore === score ? "survey-feeling-btn--selected" : ""
                  }`}
                  onClick={() => setFeelingScore(score)}
                  style={{
                    borderColor:
                      feelingScore === score ? feelingColors[score] : undefined,
                    backgroundColor:
                      feelingScore === score
                        ? `${feelingColors[score]}20`
                        : undefined,
                  }}
                >
                  <span className="feeling-emoji">{feelingEmojis[score]}</span>
                  <span className="feeling-label">{getFeelingLabel(score)}</span>
                </button>
              ))}
            </div>

            <div
              className="survey-feeling-advice"
              style={{
                borderColor: feelingColors[feelingScore],
                backgroundColor: `${feelingColors[feelingScore]}15`,
              }}
            >
              <p>{getFeelingAdvice(feelingScore)}</p>
            </div>

            {!isSafeToDecide(feelingScore) && (
              <div className="survey-warning">
                <p>
                  You're at an emotional extreme. Like grocery shopping hungry -
                  consider waiting until you're closer to neutral.
                </p>
                <div className="survey-warning-actions">
                  <button
                    className="survey-btn survey-btn--secondary"
                    onClick={handleSaveDraft}
                  >
                    Save as Draft
                  </button>
                  <button
                    className="survey-btn survey-btn--ghost"
                    onClick={nextStep}
                  >
                    Continue Anyway
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case "joust":
        return (
          <div className="survey-step">
            <h2>{STEP_TITLES.joust}</h2>
            <p className="survey-subtitle">
              Let's have your reasons fight it out.
            </p>

            <div className="survey-field">
              <label>What is the ONE decisive reason to do this?</label>
              <p className="survey-helper">
                Not a list. Not "because X and Y and Z." One reason strong enough
                on its own.
              </p>
              <textarea
                value={oneReason}
                onChange={(e) => setOneReason(e.target.value)}
                placeholder="The ONE reason I should do this is..."
                rows={3}
                className="survey-textarea"
              />
            </div>

            <div className="survey-field">
              <label>What is the strongest reason AGAINST?</label>
              <p className="survey-helper">
                Be honest. What's the best argument for not doing this?
              </p>
              <textarea
                value={reasonAgainst}
                onChange={(e) => setReasonAgainst(e.target.value)}
                placeholder="The strongest reason against is..."
                rows={3}
                className="survey-textarea"
              />
            </div>

            {oneReason.trim() && reasonAgainst.trim() && (
              <div className="survey-field">
                <label>If these two reasons arm-wrestled, which wins?</label>
                <div className="survey-joust-buttons">
                  <button
                    className={`survey-joust-btn ${
                      joustWinner === "for" ? "survey-joust-btn--selected" : ""
                    }`}
                    onClick={() => setJoustWinner("for")}
                    style={{
                      borderColor: joustWinner === "for" ? "#73A58C" : undefined,
                      backgroundColor:
                        joustWinner === "for" ? "rgba(115, 165, 140, 0.15)" : undefined,
                    }}
                  >
                    <span className="joust-icon">👍</span>
                    <span className="joust-label">FOR</span>
                    <span className="joust-reason">
                      {oneReason.slice(0, 60)}
                      {oneReason.length > 60 ? "..." : ""}
                    </span>
                  </button>
                  <span className="joust-vs">VS</span>
                  <button
                    className={`survey-joust-btn ${
                      joustWinner === "against" ? "survey-joust-btn--selected" : ""
                    }`}
                    onClick={() => setJoustWinner("against")}
                    style={{
                      borderColor:
                        joustWinner === "against" ? "#F27059" : undefined,
                      backgroundColor:
                        joustWinner === "against"
                          ? "rgba(242, 112, 89, 0.15)"
                          : undefined,
                    }}
                  >
                    <span className="joust-icon">👎</span>
                    <span className="joust-label">AGAINST</span>
                    <span className="joust-reason">
                      {reasonAgainst.slice(0, 60)}
                      {reasonAgainst.length > 60 ? "..." : ""}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case "quality":
        return (
          <div className="survey-step">
            <h2>{STEP_TITLES.quality}</h2>
            <p className="survey-subtitle">Let's pressure-test your reasoning.</p>

            <div className="survey-quality-checks">
              <div
                className={`survey-quality-item ${isHonest ? "survey-quality-item--checked" : ""}`}
                onClick={() => setIsHonest(!isHonest)}
              >
                <div className="quality-checkbox">
                  {isHonest && <span className="quality-check">✓</span>}
                </div>
                <div className="quality-content">
                  <h4>Is it honest?</h4>
                  <p>Not what you think you should say, but what you actually believe.</p>
                </div>
              </div>

              <div
                className={`survey-quality-item ${isConcise ? "survey-quality-item--checked" : ""}`}
                onClick={() => setIsConcise(!isConcise)}
              >
                <div className="quality-checkbox">
                  {isConcise && <span className="quality-check">✓</span>}
                </div>
                <div className="quality-content">
                  <h4>Is it concise?</h4>
                  <p>Not spaghetti reasoning with multiple tangled justifications.</p>
                </div>
              </div>

              <div
                className={`survey-quality-item ${isTiedToValues ? "survey-quality-item--checked" : ""}`}
                onClick={() => setIsTiedToValues(!isTiedToValues)}
              >
                <div className="quality-checkbox">
                  {isTiedToValues && <span className="quality-check">✓</span>}
                </div>
                <div className="quality-content">
                  <h4>Is it tied to your values?</h4>
                  <p>Does it connect to what you actually care about right now?</p>
                </div>
              </div>
            </div>

            {(!isHonest || !isConcise || !isTiedToValues) && (
              <div className="survey-quality-warning">
                <p>
                  Consider refining your reason before continuing. A weak reason
                  leads to regret.
                </p>
                <button
                  className="survey-btn survey-btn--ghost"
                  onClick={() => setStep("joust")}
                >
                  ← Go Back and Refine
                </button>
              </div>
            )}
          </div>
        );

      case "substitutes":
        return (
          <div className="survey-step">
            <h2>{STEP_TITLES.substitutes}</h2>
            <p className="survey-subtitle">
              Are there other paths to the same goal?
            </p>

            <div className="survey-field">
              <label>
                Are there valid substitutes that achieve the same goal with lower
                cost?
              </label>
              <p className="survey-helper">
                Think of alternative paths, smaller experiments, or different
                approaches.
              </p>
              <textarea
                value={validSubstitutes}
                onChange={(e) => setValidSubstitutes(e.target.value)}
                placeholder="Optional: Other ways I could achieve this..."
                rows={3}
                className="survey-textarea"
              />
            </div>

            <div className="survey-field">
              <label>
                If you removed all the secondary benefits, would you still do it?
              </label>
              <p className="survey-helper">
                Secondary benefits are nice-to-haves. If you wouldn't do it for
                the ONE reason alone, that's a signal.
              </p>
              <div className="survey-toggle-group">
                <button
                  className={`survey-toggle-btn ${
                    withoutSecondaryBenefits
                      ? "survey-toggle-btn--selected"
                      : ""
                  }`}
                  onClick={() => setWithoutSecondaryBenefits(true)}
                  style={{
                    borderColor: withoutSecondaryBenefits ? "#73A58C" : undefined,
                    backgroundColor: withoutSecondaryBenefits
                      ? "rgba(115, 165, 140, 0.15)"
                      : undefined,
                  }}
                >
                  Yes, I'd still do it
                </button>
                <button
                  className={`survey-toggle-btn ${
                    !withoutSecondaryBenefits
                      ? "survey-toggle-btn--selected"
                      : ""
                  }`}
                  onClick={() => setWithoutSecondaryBenefits(false)}
                  style={{
                    borderColor: !withoutSecondaryBenefits ? "#F4B942" : undefined,
                    backgroundColor: !withoutSecondaryBenefits
                      ? "rgba(244, 185, 66, 0.15)"
                      : undefined,
                  }}
                >
                  No, I need the extras
                </button>
              </div>

              {!withoutSecondaryBenefits && (
                <div className="survey-inline-warning">
                  <p>
                    This suggests your core reason might not be strong enough.
                    Consider whether you're rationalizing.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case "trigger":
        return (
          <div className="survey-step">
            <h2>{STEP_TITLES.trigger}</h2>
            <p className="survey-subtitle">
              Understanding what prompted this decision.
            </p>

            <div className="survey-field">
              <label>What triggered this decision?</label>
              <p className="survey-helper">
                Be honest. FOMO? Someone else did it? External pressure? Genuine
                need? A deadline?
              </p>
              <textarea
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="What made me think about this now..."
                rows={3}
                className="survey-textarea"
              />
            </div>

            <div className="survey-field">
              <label>What alternatives did you consider?</label>
              <p className="survey-helper">
                First idea ≠ best idea. List at least one alternative.
              </p>

              <div className="survey-alternatives-list">
                {alternativesConsidered.map((alt, index) => (
                  <div key={index} className="survey-alternative-item">
                    <span>{alt}</span>
                    <button
                      className="survey-remove-btn"
                      onClick={() => removeAlternative(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="survey-add-alternative">
                <input
                  type="text"
                  value={newAlternative}
                  onChange={(e) => setNewAlternative(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAlternative();
                    }
                  }}
                  placeholder="Add an alternative..."
                  className="survey-input"
                />
                <button
                  className="survey-add-btn"
                  onClick={addAlternative}
                  disabled={!newAlternative.trim()}
                >
                  + Add
                </button>
              </div>

              {alternativesConsidered.length === 0 && (
                <div className="survey-inline-warning">
                  <p>Consider at least one alternative before proceeding.</p>
                </div>
              )}
            </div>
          </div>
        );

      case "stakes":
        return (
          <div className="survey-step">
            <h2>{STEP_TITLES.stakes}</h2>
            <p className="survey-subtitle">Assess the reversibility and asymmetry.</p>

            <div className="survey-field">
              <label>Is this decision reversible?</label>
              <div className="survey-toggle-group">
                <button
                  className={`survey-toggle-btn ${
                    isReversible ? "survey-toggle-btn--selected" : ""
                  }`}
                  onClick={() => setIsReversible(true)}
                  style={{
                    borderColor: isReversible ? "#73A58C" : undefined,
                    backgroundColor: isReversible
                      ? "rgba(115, 165, 140, 0.15)"
                      : undefined,
                  }}
                >
                  Yes, reversible
                </button>
                <button
                  className={`survey-toggle-btn ${
                    !isReversible ? "survey-toggle-btn--selected" : ""
                  }`}
                  onClick={() => setIsReversible(false)}
                  style={{
                    borderColor: !isReversible ? "#F27059" : undefined,
                    backgroundColor: !isReversible
                      ? "rgba(242, 112, 89, 0.15)"
                      : undefined,
                  }}
                >
                  No, irreversible
                </button>
              </div>

              <div
                className="survey-reversibility-note"
                style={{
                  borderColor: isReversible ? "#73A58C" : "#F27059",
                  backgroundColor: isReversible
                    ? "rgba(115, 165, 140, 0.1)"
                    : "rgba(242, 112, 89, 0.1)",
                }}
              >
                {isReversible
                  ? "Good - you can course-correct. Less deliberation needed."
                  : "High stakes. Worth the extra thought."}
              </div>
            </div>

            <div className="survey-field">
              <label>What's the upside if you're right?</label>
              <textarea
                value={upsideIfRight}
                onChange={(e) => setUpsideIfRight(e.target.value)}
                placeholder="If this works out, the best case is..."
                rows={2}
                className="survey-textarea"
              />
            </div>

            <div className="survey-field">
              <label>What's the downside if you're wrong?</label>
              <textarea
                value={downsideIfWrong}
                onChange={(e) => setDownsideIfWrong(e.target.value)}
                placeholder="If this doesn't work, the worst case is..."
                rows={2}
                className="survey-textarea"
              />
            </div>

            {upsideIfRight && downsideIfWrong && (
              <div className="survey-asymmetry-summary">
                <h4>Asymmetry Analysis</h4>
                <div className="asymmetry-comparison">
                  <div className="asymmetry-side asymmetry-upside">
                    <span className="asymmetry-label">Upside</span>
                    <span className="asymmetry-value">{upsideIfRight}</span>
                  </div>
                  <div className="asymmetry-vs">vs</div>
                  <div className="asymmetry-side asymmetry-downside">
                    <span className="asymmetry-label">Downside</span>
                    <span className="asymmetry-value">{downsideIfWrong}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "confidence":
        return (
          <div className="survey-step">
            <h2>{STEP_TITLES.confidence}</h2>
            <p className="survey-subtitle">Time to decide.</p>

            <div className="survey-field">
              <label>How confident are you in this decision?</label>
              <div className="survey-confidence-slider">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={confidenceLevel}
                  onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                  className="confidence-slider"
                />
                <div className="confidence-labels">
                  <span>1 - Coin flip</span>
                  <span>5 - Reasonably confident</span>
                  <span>10 - Certain</span>
                </div>
                <div className="confidence-value">{confidenceLevel}/10</div>
              </div>
            </div>

            <div className="survey-field">
              <label>Your decision:</label>
              <div className="survey-decision-buttons">
                <button
                  className={`survey-decision-btn ${
                    finalChoice === "proceed"
                      ? "survey-decision-btn--selected"
                      : ""
                  }`}
                  onClick={() => setFinalChoice("proceed")}
                  style={{
                    borderColor: finalChoice === "proceed" ? "#73A58C" : undefined,
                    backgroundColor:
                      finalChoice === "proceed"
                        ? "rgba(115, 165, 140, 0.2)"
                        : undefined,
                  }}
                >
                  <span className="decision-icon">✓</span>
                  <span className="decision-label">Proceed</span>
                  <span className="decision-desc">Go forward with this decision</span>
                </button>

                <button
                  className={`survey-decision-btn ${
                    finalChoice === "decline"
                      ? "survey-decision-btn--selected"
                      : ""
                  }`}
                  onClick={() => setFinalChoice("decline")}
                  style={{
                    borderColor: finalChoice === "decline" ? "#F27059" : undefined,
                    backgroundColor:
                      finalChoice === "decline"
                        ? "rgba(242, 112, 89, 0.2)"
                        : undefined,
                  }}
                >
                  <span className="decision-icon">✗</span>
                  <span className="decision-label">Decline</span>
                  <span className="decision-desc">Don't proceed with this</span>
                </button>

                <button
                  className={`survey-decision-btn ${
                    finalChoice === "defer"
                      ? "survey-decision-btn--selected"
                      : ""
                  }`}
                  onClick={() => setFinalChoice("defer")}
                  style={{
                    borderColor: finalChoice === "defer" ? "#F4B942" : undefined,
                    backgroundColor:
                      finalChoice === "defer"
                        ? "rgba(244, 185, 66, 0.2)"
                        : undefined,
                  }}
                >
                  <span className="decision-icon">⏸</span>
                  <span className="decision-label">Defer</span>
                  <span className="decision-desc">Need more time or info</span>
                </button>
              </div>
            </div>
          </div>
        );

      case "summary":
        return (
          <div className="survey-step">
            <h2>{STEP_TITLES.summary}</h2>
            <p className="survey-subtitle">Review your decision before saving.</p>

            <div className="survey-summary-card">
              <div className="summary-header">
                <span
                  className="summary-loop-badge"
                  style={{
                    backgroundColor: loop ? LOOP_COLORS[loop].bg : undefined,
                    borderColor: loop ? LOOP_COLORS[loop].border : undefined,
                  }}
                >
                  {loop && LOOP_DEFINITIONS[loop].icon} {loop}
                </span>
                <span
                  className={`summary-choice-badge summary-choice-badge--${finalChoice}`}
                >
                  {finalChoice === "proceed" && "✓ Proceeding"}
                  {finalChoice === "decline" && "✗ Declining"}
                  {finalChoice === "defer" && "⏸ Deferring"}
                </span>
              </div>

              <h3 className="summary-title">{title}</h3>

              <div className="summary-section">
                <label>Emotional State</label>
                <p>
                  {feelingEmojis[feelingScore]} {getFeelingLabel(feelingScore)}
                </p>
              </div>

              <div className="summary-section">
                <label>The Joust Winner: {joustWinner === "for" ? "FOR" : "AGAINST"}</label>
                <p className="summary-reason">
                  {joustWinner === "for" ? oneReason : reasonAgainst}
                </p>
              </div>

              <div className="summary-section">
                <label>Quality Check</label>
                <div className="summary-checks">
                  <span className={isHonest ? "check-pass" : "check-fail"}>
                    {isHonest ? "✓" : "✗"} Honest
                  </span>
                  <span className={isConcise ? "check-pass" : "check-fail"}>
                    {isConcise ? "✓" : "✗"} Concise
                  </span>
                  <span className={isTiedToValues ? "check-pass" : "check-fail"}>
                    {isTiedToValues ? "✓" : "✗"} Values-tied
                  </span>
                </div>
              </div>

              <div className="summary-section">
                <label>Reversibility</label>
                <p>{isReversible ? "Reversible" : "Irreversible"}</p>
              </div>

              <div className="summary-section">
                <label>Confidence</label>
                <p>{confidenceLevel}/10</p>
              </div>

              <div className="summary-section">
                <label>Upside</label>
                <p>{upsideIfRight}</p>
              </div>

              <div className="summary-section">
                <label>Downside</label>
                <p>{downsideIfWrong}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="decision-survey">
      {/* Header */}
      <div className="survey-header">
        <div className="survey-progress">
          <div
            className="survey-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="survey-header-row">
          <span className="survey-step-indicator">
            Step {currentStepIndex + 1} of {STEPS.length}
          </span>
          <button className="survey-close-btn" onClick={onCancel}>
            ×
          </button>
        </div>
      </div>

      {/* Context Banner */}
      {title && loop && step !== "setup" && (
        <div
          className="survey-context-banner"
          style={{
            borderColor: LOOP_COLORS[loop].border,
            backgroundColor: LOOP_COLORS[loop].bg,
          }}
        >
          <span className="context-icon">{LOOP_DEFINITIONS[loop].icon}</span>
          <span className="context-title">{title}</span>
        </div>
      )}

      {/* Content */}
      <div className="survey-content">{renderStep()}</div>

      {/* Footer */}
      <div className="survey-footer">
        {currentStepIndex > 0 && (
          <button className="survey-btn survey-btn--secondary" onClick={prevStep}>
            ← Back
          </button>
        )}
        <div className="survey-footer-spacer" />
        {step === "summary" ? (
          <button className="survey-btn survey-btn--primary" onClick={handleSave}>
            Save Decision
          </button>
        ) : step === "emotional" && !isSafeToDecide(feelingScore) ? (
          // Special handling for emotional warning step
          null
        ) : (
          <button
            className="survey-btn survey-btn--primary"
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
