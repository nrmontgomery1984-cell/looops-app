// DecisionCoachPortal - Standalone Decision Coach for sharing
// Accessible at /coach without authentication
// No data persistence - exports to CSV or clipboard instead

import { useState, useEffect, useRef } from "react";
import {
  DecisionSurvey as DecisionSurveyData,
  DecisionChoice,
  FeelingScore,
  JoustWinner,
  LoopId,
  ALL_LOOPS,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
  getFeelingLabel,
} from "../../types";
import {
  analyzeEmotionalState,
  analyzeJoust,
  analyzeStakes,
  analyzeConfidence,
  generateCoachingSummary,
  CoachingInsight,
  BiasAlert,
  JoustAnalysis,
  StakesAnalysis,
  ConfidenceAnalysis,
  CoachingSummary,
} from "../../lib/decisions/coaching";
import {
  generateMarkdownSummary,
  copyToClipboard,
  downloadCSV,
} from "../../lib/decisions/export";
import { LogoMark } from "../common";

// ============================================
// Types
// ============================================

type CoachStep =
  | "welcome"
  | "setup"
  | "emotional_check"
  | "emotional_coaching"
  | "joust_for"
  | "joust_against"
  | "joust_winner"
  | "joust_coaching"
  | "quality_check"
  | "substitutes"
  | "trigger"
  | "alternatives"
  | "stakes_reversibility"
  | "stakes_upside"
  | "stakes_downside"
  | "stakes_coaching"
  | "confidence"
  | "confidence_coaching"
  | "final_decision"
  | "coaching_summary"
  | "export";

interface Message {
  id: string;
  type: "coach" | "user" | "insight" | "bias_alert";
  content: string;
  timestamp: Date;
  metadata?: {
    tone?: CoachingInsight["tone"];
    biasType?: BiasAlert["biasType"];
    severity?: BiasAlert["severity"];
    followUpQuestion?: string;
    source?: string;
    actionSuggestion?: string;
  };
}

// ============================================
// Component
// ============================================

export function DecisionCoachPortal() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Step management
  const [step, setStep] = useState<CoachStep>("welcome");
  const [isTyping, setIsTyping] = useState(false);

  // Conversation history
  const [messages, setMessages] = useState<Message[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [loop, setLoop] = useState<LoopId | null>(null);
  const [feelingScore, setFeelingScore] = useState<FeelingScore>(3);
  const [oneReason, setOneReason] = useState("");
  const [reasonAgainst, setReasonAgainst] = useState("");
  const [joustWinner, setJoustWinner] = useState<JoustWinner>("for");
  const [isHonest, setIsHonest] = useState(false);
  const [isConcise, setIsConcise] = useState(false);
  const [isTiedToValues, setIsTiedToValues] = useState(false);
  const [validSubstitutes, setValidSubstitutes] = useState("");
  const [withoutSecondaryBenefits, setWithoutSecondaryBenefits] = useState(false);
  const [trigger, setTrigger] = useState("");
  const [alternativesConsidered, setAlternativesConsidered] = useState<string[]>([]);
  const [newAlternative, setNewAlternative] = useState("");
  const [isReversible, setIsReversible] = useState(true);
  const [upsideIfRight, setUpsideIfRight] = useState("");
  const [downsideIfWrong, setDownsideIfWrong] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState(5);
  const [finalChoice, setFinalChoice] = useState<DecisionChoice>("defer");

  // Analysis results
  const [emotionalAnalysis, setEmotionalAnalysis] = useState<ReturnType<typeof analyzeEmotionalState> | null>(null);
  const [joustAnalysis, setJoustAnalysis] = useState<JoustAnalysis | null>(null);
  const [stakesAnalysis, setStakesAnalysis] = useState<StakesAnalysis | null>(null);
  const [confidenceAnalysis, setConfidenceAnalysis] = useState<ConfidenceAnalysis | null>(null);
  const [coachingSummary, setCoachingSummary] = useState<CoachingSummary | null>(null);

  // Export state
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add a coach message with typing animation
  const addCoachMessage = (content: string, metadata?: Message["metadata"]) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          type: "coach",
          content,
          timestamp: new Date(),
          metadata,
        },
      ]);
      setIsTyping(false);
    }, 300 + Math.random() * 400);
  };

  const addInsight = (insight: CoachingInsight) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `insight_${Date.now()}`,
        type: "insight",
        content: insight.message,
        timestamp: new Date(),
        metadata: {
          tone: insight.tone,
          followUpQuestion: insight.followUpQuestion,
          source: insight.source,
          actionSuggestion: insight.actionSuggestion,
        },
      },
    ]);
  };

  const addBiasAlert = (alert: BiasAlert) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `bias_${Date.now()}`,
        type: "bias_alert",
        content: alert.explanation,
        timestamp: new Date(),
        metadata: {
          biasType: alert.biasType,
          severity: alert.severity,
          followUpQuestion: alert.debiasQuestion,
          source: alert.relatedPrinciple,
        },
      },
    ]);
  };

  const addUserResponse = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user_${Date.now()}`,
        type: "user",
        content,
        timestamp: new Date(),
      },
    ]);
  };

  // Initialize welcome message
  useEffect(() => {
    if (step === "welcome" && messages.length === 0) {
      addCoachMessage(
        "Welcome to Decision Coach. Let's think through this decision together. I'll ask questions to help you see clearly - and call out any cognitive traps along the way."
      );
      setTimeout(() => {
        setStep("setup");
      }, 1500);
    }
  }, [step, messages.length]);

  // Handle step transitions with coaching
  const handleStepTransition = (nextStep: CoachStep) => {
    switch (nextStep) {
      case "emotional_coaching":
        if (loop) {
          const analysis = analyzeEmotionalState(feelingScore, title, loop);
          setEmotionalAnalysis(analysis);

          analysis.insights.forEach((insight, i) => {
            setTimeout(() => addInsight(insight), i * 800);
          });

          if (analysis.isSafe) {
            setTimeout(() => {
              addCoachMessage("You're in a good headspace. Let's continue.");
              setStep("joust_for");
            }, analysis.insights.length * 800 + 500);
          }
        }
        break;

      case "joust_coaching":
        if (oneReason && reasonAgainst) {
          const analysis = analyzeJoust(oneReason, reasonAgainst, joustWinner, feelingScore);
          setJoustAnalysis(analysis);

          analysis.biasIndicators.filter(b => b.detected).forEach((alert, i) => {
            setTimeout(() => addBiasAlert(alert), i * 1000);
          });

          const alertCount = analysis.biasIndicators.filter(b => b.detected).length;
          analysis.insights.forEach((insight, i) => {
            setTimeout(() => addInsight(insight), (alertCount + i) * 800 + 500);
          });
        }
        break;

      case "stakes_coaching":
        if (loop) {
          const analysis = analyzeStakes(isReversible, upsideIfRight, downsideIfWrong, feelingScore, loop);
          setStakesAnalysis(analysis);

          analysis.insights.forEach((insight, i) => {
            setTimeout(() => addInsight(insight), i * 800);
          });
        }
        break;

      case "confidence_coaching":
        const confAnalysis = analyzeConfidence(
          confidenceLevel,
          joustWinner,
          { isHonest, isConcise, isTiedToValues },
          isReversible,
          feelingScore,
          [] // No past decisions in standalone mode
        );
        setConfidenceAnalysis(confAnalysis);

        confAnalysis.biasIndicators.filter(b => b.detected).forEach((alert, i) => {
          setTimeout(() => addBiasAlert(alert), i * 1000);
        });

        const confAlertCount = confAnalysis.biasIndicators.filter(b => b.detected).length;
        confAnalysis.insights.forEach((insight, i) => {
          setTimeout(() => addInsight(insight), (confAlertCount + i) * 800 + 500);
        });
        break;

      case "coaching_summary":
        if (emotionalAnalysis && joustAnalysis && stakesAnalysis && confidenceAnalysis) {
          const summary = generateCoachingSummary(
            emotionalAnalysis,
            joustAnalysis,
            stakesAnalysis,
            confidenceAnalysis,
            { similarDecisions: [], insights: [], accuracyWithSimilar: null, commonPatterns: [] },
            finalChoice
          );
          setCoachingSummary(summary);

          setTimeout(() => {
            addInsight(summary.finalInsight);
          }, 500);
        }
        break;
    }

    setStep(nextStep);
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
    1: "#F27059",
    2: "#F4B942",
    3: "#73A58C",
    4: "#F4B942",
    5: "#F27059",
  };

  // Export handlers
  const handleCopyToClipboard = async () => {
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

    const markdown = generateMarkdownSummary({
      title,
      loop,
      survey,
      confidenceLevel,
      finalChoice,
      coachingSummary,
    });

    const success = await copyToClipboard(markdown);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadCSV = () => {
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

    downloadCSV({
      title,
      loop,
      survey,
      confidenceLevel,
      finalChoice,
      coachingSummary,
    });

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleStartOver = () => {
    setStep("welcome");
    setMessages([]);
    setTitle("");
    setLoop(null);
    setFeelingScore(3);
    setOneReason("");
    setReasonAgainst("");
    setJoustWinner("for");
    setIsHonest(false);
    setIsConcise(false);
    setIsTiedToValues(false);
    setValidSubstitutes("");
    setWithoutSecondaryBenefits(false);
    setTrigger("");
    setAlternativesConsidered([]);
    setIsReversible(true);
    setUpsideIfRight("");
    setDownsideIfWrong("");
    setConfidenceLevel(5);
    setFinalChoice("defer");
    setEmotionalAnalysis(null);
    setJoustAnalysis(null);
    setStakesAnalysis(null);
    setConfidenceAnalysis(null);
    setCoachingSummary(null);
    setCopied(false);
    setDownloaded(false);
  };

  // Add alternative
  const addAlternative = () => {
    if (newAlternative.trim()) {
      setAlternativesConsidered([...alternativesConsidered, newAlternative.trim()]);
      setNewAlternative("");
    }
  };

  const removeAlternative = (index: number) => {
    setAlternativesConsidered(alternativesConsidered.filter((_, i) => i !== index));
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case "welcome":
        return null;

      case "setup":
        return (
          <div className="coach-step coach-step--setup">
            <div className="coach-prompt">
              <h3>What decision are you wrestling with?</h3>
              <p className="coach-hint">Describe it in one sentence - like a tweet.</p>
            </div>

            <div className="coach-input-group">
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 280))}
                placeholder="Should I accept the job offer at Company X?"
                rows={3}
                className="coach-textarea"
                autoFocus
              />
              <span className="coach-char-count">{title.length}/280</span>
            </div>

            {title.length > 10 && (
              <>
                <div className="coach-prompt">
                  <h3>Which area of life is this about?</h3>
                </div>

                <div className="coach-loop-grid">
                  {ALL_LOOPS.map((loopId) => {
                    const def = LOOP_DEFINITIONS[loopId];
                    const colors = LOOP_COLORS[loopId];
                    const isSelected = loop === loopId;

                    return (
                      <button
                        key={loopId}
                        className={`coach-loop-btn ${isSelected ? "coach-loop-btn--selected" : ""}`}
                        onClick={() => setLoop(loopId)}
                        style={{
                          borderColor: isSelected ? colors.border : undefined,
                          backgroundColor: isSelected ? colors.bg : undefined,
                        }}
                      >
                        <span className="coach-loop-icon">{def.icon}</span>
                        <span className="coach-loop-name">{loopId}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {title.length > 10 && loop && (
              <div className="coach-actions">
                <button
                  className="coach-btn coach-btn--primary"
                  onClick={() => {
                    addUserResponse(`"${title}" - ${loop}`);
                    setTimeout(() => {
                      addCoachMessage("Got it. Before we dig into the logic, let's check in on where you're at emotionally.");
                      setTimeout(() => setStep("emotional_check"), 800);
                    }, 300);
                  }}
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        );

      case "emotional_check":
        return (
          <div className="coach-step coach-step--emotional">
            <div className="coach-prompt">
              <h3>What are you feeling right now about this decision?</h3>
              <p className="coach-hint">Be honest - this affects everything that follows.</p>
            </div>

            <div className="coach-feeling-scale">
              {([1, 2, 3, 4, 5] as FeelingScore[]).map((score) => (
                <button
                  key={score}
                  className={`coach-feeling-btn ${feelingScore === score ? "coach-feeling-btn--selected" : ""}`}
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

            <div className="coach-feeling-spectrum">
              <span className="spectrum-label spectrum-label--fear">Fear</span>
              <div className="spectrum-bar">
                <div
                  className="spectrum-marker"
                  style={{ left: `${(feelingScore - 1) * 25}%` }}
                />
              </div>
              <span className="spectrum-label spectrum-label--greed">Excitement</span>
            </div>

            <div className="coach-actions">
              <button
                className="coach-btn coach-btn--primary"
                onClick={() => {
                  addUserResponse(`Feeling: ${getFeelingLabel(feelingScore)} ${feelingEmojis[feelingScore]}`);
                  setTimeout(() => handleStepTransition("emotional_coaching"), 300);
                }}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case "emotional_coaching":
        return (
          <div className="coach-step coach-step--coaching">
            {emotionalAnalysis && !emotionalAnalysis.isSafe && (
              <div className="coach-emotional-warning">
                <div
                  className="warning-banner"
                  style={{
                    borderColor: feelingColors[feelingScore],
                    backgroundColor: `${feelingColors[feelingScore]}15`,
                  }}
                >
                  <span className="warning-icon">
                    {emotionalAnalysis.severity === "danger" ? "🚨" : "⚠️"}
                  </span>
                  <div className="warning-content">
                    <h4>
                      {emotionalAnalysis.severity === "danger"
                        ? "Emotional Danger Zone"
                        : "Emotional Caution Zone"}
                    </h4>
                    <p>
                      {emotionalAnalysis.recommendedAction === "wait_48h"
                        ? "Consider waiting 48 hours before finalizing this decision."
                        : "Take a moment to acknowledge your emotional state."}
                    </p>
                  </div>
                </div>

                <div className="coach-actions">
                  <button
                    className="coach-btn coach-btn--primary"
                    onClick={() => {
                      addUserResponse("Continuing despite emotional state");
                      setTimeout(() => {
                        addCoachMessage("Understood. Let's proceed carefully. Tell me - what's the ONE decisive reason to do this?");
                        setTimeout(() => setStep("joust_for"), 800);
                      }, 300);
                    }}
                  >
                    Continue Anyway
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case "joust_for":
        return (
          <div className="coach-step coach-step--joust">
            <div className="coach-prompt">
              <h3>What is the ONE decisive reason to do this?</h3>
              <p className="coach-hint">
                Not a list. Not "because X and Y and Z." One reason strong enough on its own.
              </p>
            </div>

            <div className="coach-input-group">
              <textarea
                value={oneReason}
                onChange={(e) => setOneReason(e.target.value)}
                placeholder="The ONE reason I should do this is..."
                rows={4}
                className="coach-textarea"
                autoFocus
              />
            </div>

            {oneReason.length > 20 && (
              <div className="coach-actions">
                <button
                  className="coach-btn coach-btn--primary"
                  onClick={() => {
                    addUserResponse(`FOR: "${oneReason}"`);
                    setTimeout(() => {
                      addCoachMessage("Now I need you to steelman the other side. What's the strongest argument AGAINST?");
                      setTimeout(() => setStep("joust_against"), 800);
                    }, 300);
                  }}
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        );

      case "joust_against":
        return (
          <div className="coach-step coach-step--joust">
            <div className="coach-prompt">
              <h3>What is the strongest reason AGAINST?</h3>
              <p className="coach-hint">
                Be honest. What's the best argument for not doing this?
              </p>
            </div>

            <div className="coach-input-group">
              <textarea
                value={reasonAgainst}
                onChange={(e) => setReasonAgainst(e.target.value)}
                placeholder="The strongest reason against is..."
                rows={4}
                className="coach-textarea"
                autoFocus
              />
            </div>

            {reasonAgainst.length > 20 && (
              <div className="coach-actions">
                <button
                  className="coach-btn coach-btn--primary"
                  onClick={() => {
                    addUserResponse(`AGAINST: "${reasonAgainst}"`);
                    setTimeout(() => {
                      addCoachMessage("Now the joust. If these two reasons arm-wrestled, which one wins?");
                      setTimeout(() => setStep("joust_winner"), 800);
                    }, 300);
                  }}
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        );

      case "joust_winner":
        return (
          <div className="coach-step coach-step--joust-winner">
            <div className="coach-prompt">
              <h3>The Joust</h3>
              <p className="coach-hint">Which reason wins the arm-wrestle?</p>
            </div>

            <div className="coach-joust-arena">
              <button
                className={`coach-joust-btn coach-joust-btn--for ${joustWinner === "for" ? "coach-joust-btn--selected" : ""}`}
                onClick={() => setJoustWinner("for")}
              >
                <span className="joust-label">FOR</span>
                <span className="joust-reason">{oneReason}</span>
              </button>

              <div className="joust-vs">VS</div>

              <button
                className={`coach-joust-btn coach-joust-btn--against ${joustWinner === "against" ? "coach-joust-btn--selected" : ""}`}
                onClick={() => setJoustWinner("against")}
              >
                <span className="joust-label">AGAINST</span>
                <span className="joust-reason">{reasonAgainst}</span>
              </button>
            </div>

            <div className="coach-actions">
              <button
                className="coach-btn coach-btn--primary"
                onClick={() => {
                  addUserResponse(`Winner: ${joustWinner === "for" ? "FOR" : "AGAINST"}`);
                  setTimeout(() => handleStepTransition("joust_coaching"), 300);
                }}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case "joust_coaching":
        return (
          <div className="coach-step coach-step--coaching">
            <div className="coach-prompt">
              <h3>Analyzing your reasoning...</h3>
            </div>

            {joustAnalysis && (
              <div className="coach-analysis-summary">
                <div className="analysis-item">
                  <span className="analysis-label">FOR Strength:</span>
                  <span className={`analysis-value analysis-value--${joustAnalysis.forStrength}`}>
                    {joustAnalysis.forStrength}
                  </span>
                </div>
                <div className="analysis-item">
                  <span className="analysis-label">AGAINST Strength:</span>
                  <span className={`analysis-value analysis-value--${joustAnalysis.againstStrength}`}>
                    {joustAnalysis.againstStrength}
                  </span>
                </div>
                {joustAnalysis.biasIndicators.filter(b => b.detected).length > 0 && (
                  <div className="analysis-item analysis-item--alert">
                    <span className="analysis-label">Bias Alerts:</span>
                    <span className="analysis-value">
                      {joustAnalysis.biasIndicators.filter(b => b.detected).length} detected
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="coach-actions">
              <button
                className="coach-btn coach-btn--primary"
                onClick={() => {
                  addCoachMessage("Now let's pressure-test your reasoning. Answer honestly.");
                  setTimeout(() => setStep("quality_check"), 800);
                }}
              >
                Continue to Quality Check
              </button>
            </div>
          </div>
        );

      case "quality_check":
        return (
          <div className="coach-step coach-step--quality">
            <div className="coach-prompt">
              <h3>Quality Check</h3>
              <p className="coach-hint">Rate your winning reason honestly.</p>
            </div>

            <div className="coach-quality-checks">
              <div
                className={`coach-quality-item ${isHonest ? "coach-quality-item--checked" : ""}`}
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
                className={`coach-quality-item ${isConcise ? "coach-quality-item--checked" : ""}`}
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
                className={`coach-quality-item ${isTiedToValues ? "coach-quality-item--checked" : ""}`}
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
              <div className="coach-inline-warning">
                <p>Unchecked items are red flags. Consider refining your reasoning.</p>
              </div>
            )}

            <div className="coach-actions">
              <button
                className="coach-btn coach-btn--secondary"
                onClick={() => setStep("joust_for")}
              >
                Refine Reasoning
              </button>
              <button
                className="coach-btn coach-btn--primary"
                onClick={() => {
                  const checked = [isHonest, isConcise, isTiedToValues].filter(Boolean).length;
                  addUserResponse(`Quality check: ${checked}/3 passed`);
                  setTimeout(() => {
                    addCoachMessage("Let's explore alternatives. Are there other paths to the same goal?");
                    setTimeout(() => setStep("substitutes"), 800);
                  }, 300);
                }}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case "substitutes":
        return (
          <div className="coach-step coach-step--substitutes">
            <div className="coach-prompt">
              <h3>Are there valid substitutes?</h3>
              <p className="coach-hint">Other ways to achieve the same goal with lower cost or risk?</p>
            </div>

            <div className="coach-input-group">
              <textarea
                value={validSubstitutes}
                onChange={(e) => setValidSubstitutes(e.target.value)}
                placeholder="Alternative approaches I could take..."
                rows={3}
                className="coach-textarea"
              />
            </div>

            <div className="coach-prompt coach-prompt--follow-up">
              <h3>Secondary Benefits Test</h3>
              <p className="coach-hint">
                If you removed all the nice-to-haves, would you still do it for the ONE reason alone?
              </p>
            </div>

            <div className="coach-toggle-group">
              <button
                className={`coach-toggle-btn ${withoutSecondaryBenefits ? "coach-toggle-btn--selected" : ""}`}
                onClick={() => setWithoutSecondaryBenefits(true)}
                style={{
                  borderColor: withoutSecondaryBenefits ? "#73A58C" : undefined,
                  backgroundColor: withoutSecondaryBenefits ? "rgba(115, 165, 140, 0.15)" : undefined,
                }}
              >
                Yes, I'd still do it
              </button>
              <button
                className={`coach-toggle-btn ${!withoutSecondaryBenefits ? "coach-toggle-btn--selected" : ""}`}
                onClick={() => setWithoutSecondaryBenefits(false)}
                style={{
                  borderColor: !withoutSecondaryBenefits ? "#F4B942" : undefined,
                  backgroundColor: !withoutSecondaryBenefits ? "rgba(244, 185, 66, 0.15)" : undefined,
                }}
              >
                No, I need the extras
              </button>
            </div>

            {!withoutSecondaryBenefits && (
              <div className="coach-inline-warning">
                <p>This suggests your core reason might not be strong enough. You might be rationalizing.</p>
              </div>
            )}

            <div className="coach-actions">
              <button
                className="coach-btn coach-btn--primary"
                onClick={() => {
                  addUserResponse(
                    `Substitutes: ${validSubstitutes || "None identified"}. Would do without extras: ${withoutSecondaryBenefits ? "Yes" : "No"}`
                  );
                  setTimeout(() => {
                    addCoachMessage("What triggered this decision? Understanding the catalyst helps spot biases.");
                    setTimeout(() => setStep("trigger"), 800);
                  }, 300);
                }}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case "trigger":
        return (
          <div className="coach-step coach-step--trigger">
            <div className="coach-prompt">
              <h3>What triggered this decision?</h3>
              <p className="coach-hint">
                Be honest. FOMO? Someone else did it? External pressure? Genuine need? A deadline?
              </p>
            </div>

            <div className="coach-input-group">
              <textarea
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="What made me think about this now..."
                rows={3}
                className="coach-textarea"
                autoFocus
              />
            </div>

            {trigger.length > 10 && (
              <div className="coach-actions">
                <button
                  className="coach-btn coach-btn--primary"
                  onClick={() => {
                    addUserResponse(`Trigger: "${trigger}"`);
                    setTimeout(() => {
                      addCoachMessage("First idea is rarely the best idea. What alternatives did you consider?");
                      setTimeout(() => setStep("alternatives"), 800);
                    }, 300);
                  }}
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        );

      case "alternatives":
        return (
          <div className="coach-step coach-step--alternatives">
            <div className="coach-prompt">
              <h3>What alternatives did you consider?</h3>
              <p className="coach-hint">List at least one alternative approach.</p>
            </div>

            <div className="coach-alternatives-list">
              {alternativesConsidered.map((alt, index) => (
                <div key={index} className="coach-alternative-item">
                  <span>{alt}</span>
                  <button
                    className="coach-remove-btn"
                    onClick={() => removeAlternative(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="coach-add-alternative">
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
                className="coach-input"
              />
              <button
                className="coach-add-btn"
                onClick={addAlternative}
                disabled={!newAlternative.trim()}
              >
                + Add
              </button>
            </div>

            {alternativesConsidered.length === 0 && (
              <div className="coach-inline-warning">
                <p>Not considering alternatives is a red flag. Force yourself to think of at least one.</p>
              </div>
            )}

            <div className="coach-actions">
              <button
                className="coach-btn coach-btn--primary"
                onClick={() => {
                  addUserResponse(`Alternatives: ${alternativesConsidered.join(", ") || "None listed"}`);
                  setTimeout(() => {
                    addCoachMessage("Now let's assess the stakes. Can you undo this if it goes wrong?");
                    setTimeout(() => setStep("stakes_reversibility"), 800);
                  }, 300);
                }}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case "stakes_reversibility":
        return (
          <div className="coach-step coach-step--stakes">
            <div className="coach-prompt">
              <h3>Is this decision reversible?</h3>
              <p className="coach-hint">Can you course-correct if it doesn't work out?</p>
            </div>

            <div className="coach-reversibility-options">
              <button
                className={`coach-reversibility-btn ${isReversible ? "coach-reversibility-btn--selected" : ""}`}
                onClick={() => setIsReversible(true)}
              >
                <span className="reversibility-icon">🚪🚪</span>
                <span className="reversibility-label">Two-Way Door</span>
                <span className="reversibility-desc">Can be undone or adjusted</span>
              </button>

              <button
                className={`coach-reversibility-btn ${!isReversible ? "coach-reversibility-btn--selected" : ""}`}
                onClick={() => setIsReversible(false)}
              >
                <span className="reversibility-icon">🚪</span>
                <span className="reversibility-label">One-Way Door</span>
                <span className="reversibility-desc">Cannot be undone</span>
              </button>
            </div>

            <div
              className="coach-reversibility-note"
              style={{
                borderColor: isReversible ? "#73A58C" : "#F27059",
                backgroundColor: isReversible ? "rgba(115, 165, 140, 0.1)" : "rgba(242, 112, 89, 0.1)",
              }}
            >
              {isReversible
                ? "Two-way doors can be decided faster - you can always walk back through."
                : "One-way doors deserve extra deliberation. Once you're through, you can't come back."}
            </div>

            <div className="coach-actions">
              <button
                className="coach-btn coach-btn--primary"
                onClick={() => {
                  addUserResponse(`Reversibility: ${isReversible ? "Reversible" : "Irreversible"}`);
                  setTimeout(() => {
                    addCoachMessage("What's waiting on the other side? Best case first.");
                    setTimeout(() => setStep("stakes_upside"), 800);
                  }, 300);
                }}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case "stakes_upside":
        return (
          <div className="coach-step coach-step--stakes">
            <div className="coach-prompt">
              <h3>What's the upside if you're right?</h3>
              <p className="coach-hint">Paint the best-case picture.</p>
            </div>

            <div className="coach-input-group">
              <textarea
                value={upsideIfRight}
                onChange={(e) => setUpsideIfRight(e.target.value)}
                placeholder="If this works out, the best case is..."
                rows={3}
                className="coach-textarea"
                autoFocus
              />
            </div>

            {upsideIfRight.length > 10 && (
              <div className="coach-actions">
                <button
                  className="coach-btn coach-btn--primary"
                  onClick={() => {
                    addUserResponse(`Upside: "${upsideIfRight}"`);
                    setTimeout(() => {
                      addCoachMessage("Now the uncomfortable part. What's the downside if you're wrong?");
                      setTimeout(() => setStep("stakes_downside"), 800);
                    }, 300);
                  }}
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        );

      case "stakes_downside":
        return (
          <div className="coach-step coach-step--stakes">
            <div className="coach-prompt">
              <h3>What's the downside if you're wrong?</h3>
              <p className="coach-hint">Be honest about the worst case.</p>
            </div>

            <div className="coach-input-group">
              <textarea
                value={downsideIfWrong}
                onChange={(e) => setDownsideIfWrong(e.target.value)}
                placeholder="If this doesn't work, the worst case is..."
                rows={3}
                className="coach-textarea"
                autoFocus
              />
            </div>

            {downsideIfWrong.length > 10 && (
              <div className="coach-actions">
                <button
                  className="coach-btn coach-btn--primary"
                  onClick={() => {
                    addUserResponse(`Downside: "${downsideIfWrong}"`);
                    setTimeout(() => handleStepTransition("stakes_coaching"), 300);
                  }}
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        );

      case "stakes_coaching":
        return (
          <div className="coach-step coach-step--coaching">
            <div className="coach-prompt">
              <h3>Stakes Assessment</h3>
            </div>

            {stakesAnalysis && (
              <div className="coach-stakes-summary">
                <div className="stakes-asymmetry">
                  <div className="asymmetry-side asymmetry-side--upside">
                    <span className="asymmetry-label">Upside</span>
                    <span className="asymmetry-value">{upsideIfRight}</span>
                  </div>
                  <div className="asymmetry-vs">vs</div>
                  <div className="asymmetry-side asymmetry-side--downside">
                    <span className="asymmetry-label">Downside</span>
                    <span className="asymmetry-value">{downsideIfWrong}</span>
                  </div>
                </div>

                <div className="stakes-metrics">
                  <div className={`stakes-metric stakes-metric--${stakesAnalysis.riskLevel}`}>
                    <span className="metric-label">Risk Level</span>
                    <span className="metric-value">{stakesAnalysis.riskLevel}</span>
                  </div>
                  <div className={`stakes-metric stakes-metric--${stakesAnalysis.asymmetryType}`}>
                    <span className="metric-label">Asymmetry</span>
                    <span className="metric-value">{stakesAnalysis.asymmetryType}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="coach-actions">
              <button
                className="coach-btn coach-btn--primary"
                onClick={() => {
                  addCoachMessage("Almost done. How confident are you in this decision?");
                  setTimeout(() => setStep("confidence"), 800);
                }}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case "confidence":
        return (
          <div className="coach-step coach-step--confidence">
            <div className="coach-prompt">
              <h3>How confident are you in this decision?</h3>
            </div>

            <div className="coach-confidence-slider">
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
              <div className="confidence-value-display">
                <span className="confidence-number">{confidenceLevel}</span>
                <span className="confidence-label">/10</span>
              </div>
            </div>

            <div className="coach-actions">
              <button
                className="coach-btn coach-btn--primary"
                onClick={() => {
                  addUserResponse(`Confidence: ${confidenceLevel}/10`);
                  setTimeout(() => handleStepTransition("confidence_coaching"), 300);
                }}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case "confidence_coaching":
        return (
          <div className="coach-step coach-step--coaching">
            <div className="coach-prompt">
              <h3>Confidence Calibration</h3>
            </div>

            {confidenceAnalysis && !confidenceAnalysis.isCalibrated && (
              <div className="coach-calibration-warning">
                <p>Your stated confidence of {confidenceLevel}/10 may be miscalibrated.</p>
                <p>Adjusted estimate: <strong>{confidenceAnalysis.adjustedConfidence}/10</strong></p>
              </div>
            )}

            <div className="coach-actions">
              <button
                className="coach-btn coach-btn--primary"
                onClick={() => {
                  addCoachMessage("Time to decide. What's your call?");
                  setTimeout(() => setStep("final_decision"), 800);
                }}
              >
                Make Decision
              </button>
            </div>
          </div>
        );

      case "final_decision":
        return (
          <div className="coach-step coach-step--decision">
            <div className="coach-prompt">
              <h3>Your Decision</h3>
            </div>

            <div className="coach-decision-buttons">
              <button
                className={`coach-decision-btn coach-decision-btn--proceed ${finalChoice === "proceed" ? "coach-decision-btn--selected" : ""}`}
                onClick={() => setFinalChoice("proceed")}
              >
                <span className="decision-icon">✓</span>
                <span className="decision-label">Proceed</span>
                <span className="decision-desc">Go forward with this</span>
              </button>

              <button
                className={`coach-decision-btn coach-decision-btn--decline ${finalChoice === "decline" ? "coach-decision-btn--selected" : ""}`}
                onClick={() => setFinalChoice("decline")}
              >
                <span className="decision-icon">✗</span>
                <span className="decision-label">Decline</span>
                <span className="decision-desc">Don't proceed</span>
              </button>

              <button
                className={`coach-decision-btn coach-decision-btn--defer ${finalChoice === "defer" ? "coach-decision-btn--selected" : ""}`}
                onClick={() => setFinalChoice("defer")}
              >
                <span className="decision-icon">⏸</span>
                <span className="decision-label">Defer</span>
                <span className="decision-desc">Need more time/info</span>
              </button>
            </div>

            <div className="coach-actions">
              <button
                className="coach-btn coach-btn--primary"
                onClick={() => {
                  addUserResponse(`Decision: ${finalChoice.toUpperCase()}`);
                  setTimeout(() => handleStepTransition("coaching_summary"), 300);
                }}
              >
                See Summary
              </button>
            </div>
          </div>
        );

      case "coaching_summary":
        return (
          <div className="coach-step coach-step--summary">
            <div className="coach-prompt">
              <h3>Decision Summary</h3>
            </div>

            {coachingSummary && (
              <div className="coach-final-summary">
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
                  <span className={`summary-risk-badge summary-risk-badge--${coachingSummary.overallRisk}`}>
                    {coachingSummary.overallRisk} risk
                  </span>
                </div>

                <h4 className="summary-title">{title}</h4>

                <div className={`summary-choice summary-choice--${finalChoice}`}>
                  {finalChoice === "proceed" && "✓ Proceeding"}
                  {finalChoice === "decline" && "✗ Declining"}
                  {finalChoice === "defer" && "⏸ Deferring"}
                </div>

                {coachingSummary.topConcerns.length > 0 && (
                  <div className="summary-concerns">
                    <h5>Concerns Noted:</h5>
                    <ul>
                      {coachingSummary.topConcerns.map((concern, i) => (
                        <li key={i}>{concern}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {coachingSummary.strengthsNoted.length > 0 && (
                  <div className="summary-strengths">
                    <h5>Strengths:</h5>
                    <ul>
                      {coachingSummary.strengthsNoted.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={`summary-recommendation summary-recommendation--${coachingSummary.recommendedAction}`}>
                  <h5>Recommendation:</h5>
                  <p>
                    {coachingSummary.recommendedAction === "proceed_confidently" && "Proceed with confidence."}
                    {coachingSummary.recommendedAction === "proceed_cautiously" && "Proceed, but stay alert."}
                    {coachingSummary.recommendedAction === "pause_and_reflect" && "Pause and address the concerns."}
                    {coachingSummary.recommendedAction === "wait_48h" && "Wait 48 hours before finalizing."}
                    {coachingSummary.recommendedAction === "gather_more_info" && "Gather more information first."}
                  </p>
                </div>
              </div>
            )}

            <div className="coach-actions coach-actions--final">
              <button
                className="coach-btn coach-btn--primary"
                onClick={() => setStep("export")}
              >
                Export Summary
              </button>
            </div>
          </div>
        );

      case "export":
        return (
          <div className="coach-step coach-step--export">
            <div className="coach-prompt">
              <h3>Export Your Decision</h3>
              <p className="coach-hint">Save your decision summary for future reference.</p>
            </div>

            <div className="portal-export-options">
              <button
                className={`portal-export-btn ${copied ? "portal-export-btn--success" : ""}`}
                onClick={handleCopyToClipboard}
              >
                <span className="export-icon">{copied ? "✓" : "📋"}</span>
                <span className="export-label">{copied ? "Copied!" : "Copy to Clipboard"}</span>
                <span className="export-desc">Paste anywhere as formatted text</span>
              </button>

              <button
                className={`portal-export-btn ${downloaded ? "portal-export-btn--success" : ""}`}
                onClick={handleDownloadCSV}
              >
                <span className="export-icon">{downloaded ? "✓" : "📥"}</span>
                <span className="export-label">{downloaded ? "Downloaded!" : "Download CSV"}</span>
                <span className="export-desc">Open in Google Sheets or Excel</span>
              </button>
            </div>

            <div className="portal-share-info">
              <p>Share this tool with others:</p>
              <div className="portal-share-url">
                <code>looops-app.vercel.app/coach</code>
              </div>
            </div>

            <div className="coach-actions coach-actions--final">
              <button
                className="coach-btn coach-btn--secondary"
                onClick={handleStartOver}
              >
                Start New Decision
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render message based on type
  const renderMessage = (msg: Message) => {
    switch (msg.type) {
      case "coach":
        return (
          <div className="coach-message coach-message--coach">
            <div className="message-avatar">🧠</div>
            <div className="message-content">{msg.content}</div>
          </div>
        );

      case "user":
        return (
          <div className="coach-message coach-message--user">
            <div className="message-content">{msg.content}</div>
          </div>
        );

      case "insight":
        return (
          <div className={`coach-message coach-message--insight coach-message--${msg.metadata?.tone}`}>
            <div className="message-icon">
              {msg.metadata?.tone === "warning" && "⚠️"}
              {msg.metadata?.tone === "challenging" && "🤔"}
              {msg.metadata?.tone === "supportive" && "💭"}
              {msg.metadata?.tone === "encouraging" && "💡"}
            </div>
            <div className="message-body">
              <div className="message-content">{msg.content}</div>
              {msg.metadata?.followUpQuestion && (
                <div className="message-follow-up">{msg.metadata.followUpQuestion}</div>
              )}
              {msg.metadata?.source && (
                <div className="message-source">{msg.metadata.source}</div>
              )}
            </div>
          </div>
        );

      case "bias_alert":
        return (
          <div className={`coach-message coach-message--bias coach-message--severity-${msg.metadata?.severity}`}>
            <div className="message-icon">🚨</div>
            <div className="message-body">
              <div className="message-header">
                <span className="bias-type">
                  {msg.metadata?.biasType?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className={`bias-severity bias-severity--${msg.metadata?.severity}`}>
                  {msg.metadata?.severity}
                </span>
              </div>
              <div className="message-content">{msg.content}</div>
              {msg.metadata?.followUpQuestion && (
                <div className="message-debias">{msg.metadata.followUpQuestion}</div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="decision-coach-portal">
      {/* Header */}
      <div className="portal-header">
        <div className="portal-brand">
          <LogoMark size="sm" />
          <h1>Decision Coach</h1>
        </div>
        <p className="portal-tagline">Think through decisions with behavioral economics</p>
      </div>

      {/* Main content */}
      <div className="portal-main">
        {/* Messages */}
        <div className="coach-messages">
          {messages.map((msg) => (
            <div key={msg.id}>{renderMessage(msg)}</div>
          ))}
          {isTyping && (
            <div className="coach-message coach-message--coach coach-message--typing">
              <div className="message-avatar">🧠</div>
              <div className="message-content">
                <span className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Current step input */}
        <div className="coach-input-area">
          {renderStepContent()}
        </div>
      </div>

      {/* Footer */}
      <div className="portal-footer">
        <p>Powered by <a href="https://looops-app.vercel.app" target="_blank" rel="noopener noreferrer">Looops</a></p>
      </div>
    </div>
  );
}
