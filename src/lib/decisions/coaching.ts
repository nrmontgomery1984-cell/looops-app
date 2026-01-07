// Decision Coaching Engine
// Behavioral economics-informed adaptive coaching for better decisions
// Based on MFM Episode 781 framework and behavioral science research

import { Decision, FeelingScore, JoustWinner, LoopId, DecisionChoice } from "../../types";

// ============================================
// Coaching Message Types
// ============================================

export type CoachingTone = "supportive" | "challenging" | "warning" | "encouraging";

export interface CoachingInsight {
  id: string;
  message: string;
  tone: CoachingTone;
  followUpQuestion?: string;
  source?: string; // Reference to source framework/principle
  actionSuggestion?: string;
}

export interface BiasAlert {
  biasType: BiasType;
  severity: "low" | "medium" | "high";
  detected: boolean;
  explanation: string;
  debiasQuestion: string;
  relatedPrinciple?: string;
}

export type BiasType =
  | "confirmation_bias"
  | "sunk_cost_fallacy"
  | "fomo"
  | "emotional_decision"
  | "social_proof"
  | "status_quo_bias"
  | "optimism_bias"
  | "loss_aversion"
  | "recency_bias"
  | "anchoring"
  | "overconfidence"
  | "underconfidence"
  | "halo_effect"
  | "action_bias";

// ============================================
// Emotional State Analysis
// ============================================

/**
 * Analyze emotional state and provide coaching
 */
export function analyzeEmotionalState(
  feelingScore: FeelingScore,
  decisionTitle: string,
  loop: LoopId
): {
  isSafe: boolean;
  severity: "safe" | "caution" | "danger";
  insights: CoachingInsight[];
  recommendedAction: "proceed" | "pause" | "wait_48h";
} {
  const insights: CoachingInsight[] = [];

  if (feelingScore === 1) {
    // Extreme fear
    return {
      isSafe: false,
      severity: "danger",
      insights: [
        {
          id: "fear_extreme",
          message: "You're experiencing extreme fear. This is like grocery shopping when you're starving - every decision feels urgent and threatening.",
          tone: "warning",
          followUpQuestion: "What specifically are you afraid of losing if you wait 48 hours?",
          source: "MFM Framework - Fear-Greed Spectrum",
          actionSuggestion: "Write down your fears. Often they shrink when named.",
        },
        {
          id: "fear_perspective",
          message: "Fear distorts time perception. Urgent-feeling decisions are rarely as time-sensitive as they seem.",
          tone: "supportive",
          followUpQuestion: "Is there a real deadline, or does it just feel that way?",
        },
        getLoopSpecificFearInsight(loop),
      ],
      recommendedAction: "wait_48h",
    };
  }

  if (feelingScore === 5) {
    // Extreme greed/excitement
    return {
      isSafe: false,
      severity: "danger",
      insights: [
        {
          id: "greed_extreme",
          message: "You're running hot with excitement. This is when we buy things we don't need and agree to things we'll regret.",
          tone: "warning",
          followUpQuestion: "If this opportunity disappeared tomorrow, would you genuinely miss it - or feel relieved?",
          source: "MFM Framework - Fear-Greed Spectrum",
          actionSuggestion: "Sleep on it. Excitement that survives a night is more trustworthy.",
        },
        {
          id: "greed_reality_check",
          message: "When everything looks like upside, we stop looking for downside. What are you not seeing?",
          tone: "challenging",
          followUpQuestion: "What would make you feel foolish about this decision in 6 months?",
        },
        getLoopSpecificGreedInsight(loop),
      ],
      recommendedAction: "wait_48h",
    };
  }

  if (feelingScore === 2) {
    // Some fear
    return {
      isSafe: false,
      severity: "caution",
      insights: [
        {
          id: "fear_moderate",
          message: "You're feeling some fear - not enough to stop, but enough to pay attention.",
          tone: "supportive",
          followUpQuestion: "Is this fear trying to protect you from something real, or is it anxiety talking?",
        },
        {
          id: "fear_useful",
          message: "Fear can be useful data. It often points to what matters most.",
          tone: "encouraging",
          followUpQuestion: "What would have to be true for this fear to be completely unfounded?",
        },
      ],
      recommendedAction: "pause",
    };
  }

  if (feelingScore === 4) {
    // Some greed/excitement
    return {
      isSafe: false,
      severity: "caution",
      insights: [
        {
          id: "greed_moderate",
          message: "You're excited about this - which is good! But excitement can blind us to problems.",
          tone: "supportive",
          followUpQuestion: "What's the most likely way this could go wrong?",
        },
        {
          id: "greed_check",
          message: "Excited people make fast decisions. Fast isn't always bad, but check your reasoning.",
          tone: "challenging",
          followUpQuestion: "If your best skeptical friend were here, what would they ask?",
        },
      ],
      recommendedAction: "pause",
    };
  }

  // Neutral - safe zone
  return {
    isSafe: true,
    severity: "safe",
    insights: [
      {
        id: "neutral_good",
        message: "You're in a calm, balanced state. This is a good place to make decisions.",
        tone: "encouraging",
        followUpQuestion: "Since you're thinking clearly, what's your gut saying?",
      },
    ],
    recommendedAction: "proceed",
  };
}

function getLoopSpecificFearInsight(loop: LoopId): CoachingInsight {
  const loopInsights: Record<LoopId, CoachingInsight> = {
    Health: {
      id: "loop_health_fear",
      message: "Health decisions made from fear often swing between avoidance and overcorrection.",
      tone: "supportive",
      followUpQuestion: "Are you trying to escape something, or move toward something?",
    },
    Wealth: {
      id: "loop_wealth_fear",
      message: "Money decisions from fear often lead to selling at bottoms and holding cash too long.",
      tone: "challenging",
      followUpQuestion: "Would you give this same advice to a friend in your situation?",
    },
    Family: {
      id: "loop_family_fear",
      message: "Family decisions driven by fear can damage relationships we're trying to protect.",
      tone: "supportive",
      followUpQuestion: "What would you do if you knew this relationship could handle disagreement?",
    },
    Work: {
      id: "loop_work_fear",
      message: "Career fear often keeps us stuck in situations that are already hurting us.",
      tone: "challenging",
      followUpQuestion: "What's the cost of NOT deciding?",
    },
    Fun: {
      id: "loop_fun_fear",
      message: "Fear around fun often means we've forgotten why play matters.",
      tone: "supportive",
      followUpQuestion: "What would you do if you knew you couldn't fail at enjoying yourself?",
    },
    Maintenance: {
      id: "loop_maintenance_fear",
      message: "Maintenance anxiety often comes from perfectionism in disguise.",
      tone: "supportive",
      followUpQuestion: "What's the minimum viable version of this decision?",
    },
    Meaning: {
      id: "loop_meaning_fear",
      message: "Existential fear is normal. It often shows up when we're growing.",
      tone: "encouraging",
      followUpQuestion: "What would your wisest self say about this?",
    },
  };
  return loopInsights[loop];
}

function getLoopSpecificGreedInsight(loop: LoopId): CoachingInsight {
  const loopInsights: Record<LoopId, CoachingInsight> = {
    Health: {
      id: "loop_health_greed",
      message: "Health enthusiasm can lead to unsustainable plans that crash in weeks.",
      tone: "challenging",
      followUpQuestion: "Will you still want to do this in 3 months?",
    },
    Wealth: {
      id: "loop_wealth_greed",
      message: "Money excitement is when we buy at tops and overcommit to winning streaks.",
      tone: "warning",
      followUpQuestion: "What if you only invested half of what you're planning?",
    },
    Family: {
      id: "loop_family_greed",
      message: "Relationship excitement can lead to commitments we're not ready for.",
      tone: "supportive",
      followUpQuestion: "What does this look like after the honeymoon phase?",
    },
    Work: {
      id: "loop_work_greed",
      message: "Career excitement often glosses over red flags in new opportunities.",
      tone: "challenging",
      followUpQuestion: "Why is this opportunity available to you specifically?",
    },
    Fun: {
      id: "loop_fun_greed",
      message: "Excitement about fun purchases fades faster than the credit card bill.",
      tone: "challenging",
      followUpQuestion: "Would you still want this if no one ever knew you had it?",
    },
    Maintenance: {
      id: "loop_maintenance_greed",
      message: "Organizing enthusiasm can become a new form of procrastination.",
      tone: "supportive",
      followUpQuestion: "Is this genuinely needed, or does it just feel productive?",
    },
    Meaning: {
      id: "loop_meaning_greed",
      message: "Spiritual enthusiasm can lead to abandoningpractices before they take root.",
      tone: "supportive",
      followUpQuestion: "What would sustainable commitment look like here?",
    },
  };
  return loopInsights[loop];
}

// ============================================
// Joust Analysis - Reason Quality Detection
// ============================================

export interface JoustAnalysis {
  forStrength: "weak" | "moderate" | "strong";
  againstStrength: "weak" | "moderate" | "strong";
  asymmetry: "balanced" | "for_dominant" | "against_dominant" | "both_weak";
  biasIndicators: BiasAlert[];
  insights: CoachingInsight[];
  suggestedQuestions: string[];
}

/**
 * Analyze the quality and balance of FOR vs AGAINST reasons
 */
export function analyzeJoust(
  oneReason: string,
  reasonAgainst: string,
  joustWinner: JoustWinner,
  feelingScore: FeelingScore
): JoustAnalysis {
  const insights: CoachingInsight[] = [];
  const biasIndicators: BiasAlert[] = [];
  const suggestedQuestions: string[] = [];

  // Check for emotional language patterns
  const emotionalForPatterns = detectEmotionalLanguage(oneReason);
  const emotionalAgainstPatterns = detectEmotionalLanguage(reasonAgainst);

  // Check for vague language
  const forVagueness = detectVagueness(oneReason);
  const againstVagueness = detectVagueness(reasonAgainst);

  // Assess reason strength
  const forStrength = assessReasonStrength(oneReason, emotionalForPatterns, forVagueness);
  const againstStrength = assessReasonStrength(reasonAgainst, emotionalAgainstPatterns, againstVagueness);

  // Detect asymmetry between emotion types in reasons
  if (emotionalForPatterns.isEmotional && !emotionalAgainstPatterns.isEmotional) {
    biasIndicators.push({
      biasType: "confirmation_bias",
      severity: "medium",
      detected: true,
      explanation: "Your reason FOR is emotionally charged, but your reason AGAINST is logical. This asymmetry often indicates you've already made up your mind.",
      debiasQuestion: "Can you think of an emotional reason NOT to do this?",
      relatedPrinciple: "Motivated Reasoning",
    });
    insights.push({
      id: "joust_asymmetry_emotional_for",
      message: "Interesting pattern: your 'for' reason sounds like it comes from the heart, while your 'against' reason sounds like it comes from the head.",
      tone: "challenging",
      followUpQuestion: "What if your heart is rationalizing something your head knows is risky?",
    });
  }

  if (!emotionalForPatterns.isEmotional && emotionalAgainstPatterns.isEmotional) {
    insights.push({
      id: "joust_asymmetry_emotional_against",
      message: "Your concerns are emotional while your reasons are logical. Sometimes fear is wisdom in disguise.",
      tone: "supportive",
      followUpQuestion: "Is that emotional concern pointing to something real you should investigate?",
    });
  }

  // Detect vague reasoning
  if (forVagueness.isVague) {
    biasIndicators.push({
      biasType: "overconfidence",
      severity: "low",
      detected: true,
      explanation: `Your reason uses vague language like "${forVagueness.vagueWords.join('", "')}". Vague reasons often hide unclear thinking.`,
      debiasQuestion: "Can you make this reason more specific? What exactly would happen?",
    });
  }

  // Check for FOMO patterns
  const fomoPatterns = detectFOMO(oneReason);
  if (fomoPatterns.detected) {
    biasIndicators.push({
      biasType: "fomo",
      severity: feelingScore >= 4 ? "high" : "medium",
      detected: true,
      explanation: `Your reasoning contains FOMO indicators: "${fomoPatterns.patterns.join('", "')}".`,
      debiasQuestion: "If this opportunity comes around again in 6 months, would that be okay?",
      relatedPrinciple: "Scarcity Bias",
    });
    insights.push({
      id: "joust_fomo",
      message: "I'm detecting some 'fear of missing out' in your reasoning. FOMO is usually a better indicator of marketing than opportunity.",
      tone: "challenging",
      followUpQuestion: "What would you advise a friend who gave you this same reason?",
      source: "Scarcity Heuristic - Cialdini",
    });
  }

  // Check for social proof dependency
  const socialProofPatterns = detectSocialProof(oneReason);
  if (socialProofPatterns.detected) {
    biasIndicators.push({
      biasType: "social_proof",
      severity: "medium",
      detected: true,
      explanation: `Your reason references what others are doing: "${socialProofPatterns.patterns.join('", "')}".`,
      debiasQuestion: "If no one else were doing this, would it still make sense for YOU?",
      relatedPrinciple: "Social Proof - Cialdini",
    });
  }

  // Check for sunk cost language
  const sunkCostPatterns = detectSunkCost(oneReason);
  if (sunkCostPatterns.detected) {
    biasIndicators.push({
      biasType: "sunk_cost_fallacy",
      severity: "high",
      detected: true,
      explanation: "You're referencing past investment as a reason to continue. Past costs are gone - they shouldn't affect future decisions.",
      debiasQuestion: "If you were starting fresh today with no history, would you make this same choice?",
      relatedPrinciple: "Sunk Cost Fallacy - Kahneman",
    });
    insights.push({
      id: "joust_sunk_cost",
      message: "You mentioned past investment as a reason to continue. This is the sunk cost trap - the money/time/effort is already gone regardless of what you decide next.",
      tone: "warning",
      followUpQuestion: "Pretend you're your own replacement with no history. What would they do?",
      source: "Behavioral Economics - Sunk Cost Fallacy",
    });
  }

  // Determine asymmetry
  let asymmetry: JoustAnalysis["asymmetry"] = "balanced";
  if (forStrength === "weak" && againstStrength === "weak") {
    asymmetry = "both_weak";
    insights.push({
      id: "joust_both_weak",
      message: "Both your reasons feel underdeveloped. This might not be a decision you need to make right now.",
      tone: "challenging",
      followUpQuestion: "What would help you feel more certain either way?",
    });
    suggestedQuestions.push("What information would make this decision obvious?");
  } else if (forStrength === "strong" && againstStrength === "weak") {
    asymmetry = "for_dominant";
  } else if (forStrength === "weak" && againstStrength === "strong") {
    asymmetry = "against_dominant";
  }

  // Winner consistency check
  if (joustWinner === "for" && againstStrength === "strong" && forStrength === "weak") {
    insights.push({
      id: "joust_winner_inconsistent",
      message: "You picked FOR as the winner, but your AGAINST reason seems stronger. Are you sure you're not just going with what you want to be true?",
      tone: "challenging",
      followUpQuestion: "If you had to argue the AGAINST position to a jury, could you win?",
    });
    biasIndicators.push({
      biasType: "confirmation_bias",
      severity: "high",
      detected: true,
      explanation: "You're choosing the weaker argument as the winner, which suggests motivated reasoning.",
      debiasQuestion: "Why does the stronger argument not deserve to win?",
    });
  }

  return {
    forStrength,
    againstStrength,
    asymmetry,
    biasIndicators,
    insights,
    suggestedQuestions,
  };
}

function detectEmotionalLanguage(text: string): { isEmotional: boolean; emotionalWords: string[] } {
  const emotionalPatterns = [
    /\b(love|hate|fear|excited|anxious|worried|thrilled|terrified|passionate|desperate)\b/gi,
    /\b(feel|feeling|felt)\b/gi,
    /\b(heart|gut|soul|dream)\b/gi,
    /\b(amazing|awful|incredible|terrible|fantastic|horrible)\b/gi,
    /!/g,
  ];

  const emotionalWords: string[] = [];
  for (const pattern of emotionalPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      emotionalWords.push(...matches);
    }
  }

  return {
    isEmotional: emotionalWords.length >= 2,
    emotionalWords,
  };
}

function detectVagueness(text: string): { isVague: boolean; vagueWords: string[] } {
  const vaguePatterns = [
    /\b(kind of|sort of|maybe|might|could|possibly|somewhat|fairly|pretty|quite)\b/gi,
    /\b(stuff|things|something|somehow|whatever)\b/gi,
    /\b(good|bad|nice|better|worse)\b/gi,
    /\b(etc|and so on|and stuff)\b/gi,
  ];

  const vagueWords: string[] = [];
  for (const pattern of vaguePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      vagueWords.push(...matches);
    }
  }

  return {
    isVague: vagueWords.length >= 2,
    vagueWords,
  };
}

function detectFOMO(text: string): { detected: boolean; patterns: string[] } {
  const fomoPatterns = [
    /\b(last chance|only opportunity|now or never|limited|exclusive|running out|won't wait)\b/gi,
    /\b(everyone|everybody|they all|all my friends)\b/gi,
    /\b(miss out|left behind|too late|passing me by)\b/gi,
    /\b(once in a lifetime|rare|unique opportunity)\b/gi,
    /\b(before it's gone|while I can|while it lasts)\b/gi,
  ];

  const patterns: string[] = [];
  for (const pattern of fomoPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      patterns.push(...matches);
    }
  }

  return {
    detected: patterns.length > 0,
    patterns,
  };
}

function detectSocialProof(text: string): { detected: boolean; patterns: string[] } {
  const socialProofPatterns = [
    /\b(everyone is|everyone's|everybody is|everybody's)\b/gi,
    /\b(my friend|my colleague|my boss|my mentor|my parents)\b/gi,
    /\b(they said|they think|they recommended)\b/gi,
    /\b(popular|trending|successful people|rich people)\b/gi,
    /\b(studies show|research says|experts say)\b/gi,
  ];

  const patterns: string[] = [];
  for (const pattern of socialProofPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      patterns.push(...matches);
    }
  }

  return {
    detected: patterns.length > 0,
    patterns,
  };
}

function detectSunkCost(text: string): { detected: boolean; patterns: string[] } {
  const sunkCostPatterns = [
    /\b(already invested|already spent|already put in)\b/gi,
    /\b(can't give up now|come this far|too far to stop)\b/gi,
    /\b(wasted|waste of|throw away)\b/gi,
    /\b(years of|months of|time I've)\b/gi,
    /\b(effort|energy|resources) (I've|I have|we've|we have) (put|invested|spent)/gi,
  ];

  const patterns: string[] = [];
  for (const pattern of sunkCostPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      patterns.push(...matches);
    }
  }

  return {
    detected: patterns.length > 0,
    patterns,
  };
}

function assessReasonStrength(
  text: string,
  emotionalPatterns: { isEmotional: boolean },
  vagueness: { isVague: boolean }
): "weak" | "moderate" | "strong" {
  // Length check (too short is weak)
  if (text.length < 20) return "weak";

  // High vagueness reduces strength
  if (vagueness.isVague) return "weak";

  // Pure emotion without specifics is moderate at best
  if (emotionalPatterns.isEmotional && text.length < 100) return "moderate";

  // Good length with specifics
  if (text.length > 50 && !vagueness.isVague) return "strong";

  return "moderate";
}

// ============================================
// Stakes & Reversibility Analysis
// ============================================

export interface StakesAnalysis {
  riskLevel: "low" | "medium" | "high" | "extreme";
  asymmetryType: "favorable" | "balanced" | "unfavorable" | "unclear";
  insights: CoachingInsight[];
  recommendedCaution: number; // 1-10, how careful to be
}

export function analyzeStakes(
  isReversible: boolean,
  upsideIfRight: string,
  downsideIfWrong: string,
  feelingScore: FeelingScore,
  loop: LoopId
): StakesAnalysis {
  const insights: CoachingInsight[] = [];

  // Base risk level on reversibility
  let riskLevel: StakesAnalysis["riskLevel"] = isReversible ? "low" : "high";

  // Analyze upside/downside text for magnitude
  const upsideMagnitude = detectMagnitude(upsideIfRight);
  const downsideMagnitude = detectMagnitude(downsideIfWrong);

  // Determine asymmetry
  let asymmetryType: StakesAnalysis["asymmetryType"] = "balanced";
  if (upsideMagnitude > downsideMagnitude + 1) {
    asymmetryType = "favorable";
    insights.push({
      id: "stakes_favorable",
      message: "The upside appears to significantly outweigh the downside. This is the kind of asymmetry that makes decisions easier.",
      tone: "encouraging",
      followUpQuestion: "Are you being realistic about both the upside AND the downside?",
    });
  } else if (downsideMagnitude > upsideMagnitude + 1) {
    asymmetryType = "unfavorable";
    insights.push({
      id: "stakes_unfavorable",
      message: "The downside seems to outweigh the upside. This doesn't mean 'don't do it' - but it means be careful.",
      tone: "warning",
      followUpQuestion: "Is there a way to reduce the downside while preserving the upside?",
    });
  }

  // If vague on either side, flag it
  if (upsideIfRight.length < 20 || downsideIfWrong.length < 20) {
    asymmetryType = "unclear";
    insights.push({
      id: "stakes_unclear",
      message: "Your upside/downside descriptions are quite short. Clear thinking requires clear articulation.",
      tone: "challenging",
      followUpQuestion: "Can you be more specific about what 'good' and 'bad' actually look like?",
    });
  }

  // Irreversible decisions get extra scrutiny
  if (!isReversible) {
    riskLevel = downsideMagnitude >= 3 ? "extreme" : "high";
    insights.push({
      id: "stakes_irreversible",
      message: "This is a one-way door. Once you walk through, you can't come back. These decisions deserve extra time.",
      tone: "warning",
      source: "Bezos - One-Way Door Framework",
      actionSuggestion: "Consider: what would it take to make this more reversible?",
    });

    // Emotional state + irreversible = danger zone
    if (feelingScore !== 3) {
      insights.push({
        id: "stakes_irreversible_emotional",
        message: "You're about to make an irreversible decision while not emotionally neutral. This combination is historically dangerous.",
        tone: "warning",
        followUpQuestion: "What would you lose by waiting 48 hours?",
      });
    }
  } else {
    insights.push({
      id: "stakes_reversible",
      message: "This is a two-way door - you can course-correct if needed. These decisions can be made faster.",
      tone: "encouraging",
      source: "Bezos - Two-Way Door Framework",
    });
  }

  // Loop-specific stakes guidance
  const loopRiskModifier = getLoopRiskModifier(loop);
  insights.push(loopRiskModifier);

  // Calculate recommended caution level
  let recommendedCaution = 5;
  if (!isReversible) recommendedCaution += 2;
  if (downsideMagnitude >= 3) recommendedCaution += 1;
  if (feelingScore === 1 || feelingScore === 5) recommendedCaution += 2;
  if (asymmetryType === "unfavorable") recommendedCaution += 1;
  if (asymmetryType === "favorable") recommendedCaution -= 1;
  recommendedCaution = Math.max(1, Math.min(10, recommendedCaution));

  return {
    riskLevel,
    asymmetryType,
    insights,
    recommendedCaution,
  };
}

function detectMagnitude(text: string): number {
  // 1 = minor, 2 = moderate, 3 = significant, 4 = major, 5 = life-changing
  let score = 2; // baseline moderate

  const minorPatterns = /\b(small|minor|little|slight|bit)\b/gi;
  const majorPatterns = /\b(huge|massive|life-changing|career-defining|everything|catastrophic|devastating|transformative)\b/gi;
  const financialPatterns = /\b(\$\d{5,}|thousands|hundreds of thousands|millions|life savings|retirement)\b/gi;
  const relationshipPatterns = /\b(marriage|divorce|kids|family|friendship|trust)\b/gi;
  const healthPatterns = /\b(death|health|surgery|chronic|permanent|disability)\b/gi;

  if (minorPatterns.test(text)) score -= 1;
  if (majorPatterns.test(text)) score += 2;
  if (financialPatterns.test(text)) score += 1;
  if (relationshipPatterns.test(text)) score += 1;
  if (healthPatterns.test(text)) score += 2;

  return Math.max(1, Math.min(5, score));
}

function getLoopRiskModifier(loop: LoopId): CoachingInsight {
  const modifiers: Record<LoopId, CoachingInsight> = {
    Health: {
      id: "loop_health_stakes",
      message: "Health decisions compound. Small choices today become big outcomes tomorrow. Err on the side of caution.",
      tone: "supportive",
    },
    Wealth: {
      id: "loop_wealth_stakes",
      message: "Financial decisions have math. If you can't do the math on the downside, you don't understand the risk.",
      tone: "challenging",
      followUpQuestion: "Can you put a specific dollar amount on the worst case?",
    },
    Family: {
      id: "loop_family_stakes",
      message: "Relationship decisions are often less reversible than they seem. Words said and actions taken leave marks.",
      tone: "supportive",
    },
    Work: {
      id: "loop_work_stakes",
      message: "Career moves compound. But so does staying still. Consider both the cost of action AND the cost of inaction.",
      tone: "challenging",
    },
    Fun: {
      id: "loop_fun_stakes",
      message: "Most fun decisions are reversible. If you're agonizing over something that should be fun, that's data.",
      tone: "encouraging",
    },
    Maintenance: {
      id: "loop_maintenance_stakes",
      message: "Maintenance decisions often feel urgent but rarely are. Check if this is genuine priority or just anxiety.",
      tone: "supportive",
    },
    Meaning: {
      id: "loop_meaning_stakes",
      message: "Meaning decisions can take time to unfold. Be patient with yourself but don't use that as an excuse to avoid commitment.",
      tone: "supportive",
    },
  };
  return modifiers[loop];
}

// ============================================
// Pattern Matching Against Past Decisions
// ============================================

export interface PatternMatch {
  similarDecisions: Decision[];
  insights: CoachingInsight[];
  accuracyWithSimilar: number | null;
  commonPatterns: string[];
}

export function findPatterns(
  currentDecision: {
    title: string;
    loop: LoopId;
    feelingScore: FeelingScore;
    isReversible: boolean;
  },
  pastDecisions: Decision[]
): PatternMatch {
  const insights: CoachingInsight[] = [];
  const commonPatterns: string[] = [];

  // Find decisions in same loop
  const loopDecisions = pastDecisions.filter(d => d.loop === currentDecision.loop);

  // Find decisions with similar emotional state
  const emotionallySimiiar = pastDecisions.filter(
    d => d.survey.feelingScore === currentDecision.feelingScore
  );

  // Find decisions with same reversibility
  const reversibilitySimilar = pastDecisions.filter(
    d => d.survey.isReversible === currentDecision.isReversible
  );

  // Calculate accuracy in similar situations
  const reviewedDecisions = pastDecisions.filter(d => d.status === "reviewed" && d.outcome?.wasCorrect !== null);
  const similarReviewed = reviewedDecisions.filter(
    d => d.loop === currentDecision.loop || d.survey.feelingScore === currentDecision.feelingScore
  );

  let accuracyWithSimilar: number | null = null;
  if (similarReviewed.length >= 3) {
    const correct = similarReviewed.filter(d => d.outcome?.wasCorrect === true).length;
    accuracyWithSimilar = correct / similarReviewed.length;

    if (accuracyWithSimilar < 0.5) {
      insights.push({
        id: "pattern_low_accuracy",
        message: `Looking at your past ${currentDecision.loop} decisions or decisions made in similar emotional states, your accuracy has been ${Math.round(accuracyWithSimilar * 100)}%. That's below average - consider extra scrutiny.`,
        tone: "warning",
        followUpQuestion: "What's been causing the misses? Is there a pattern?",
      });
      commonPatterns.push("below_average_accuracy");
    } else if (accuracyWithSimilar > 0.7) {
      insights.push({
        id: "pattern_high_accuracy",
        message: `Your track record in similar situations is strong (${Math.round(accuracyWithSimilar * 100)}% accuracy). Trust your process, but don't get overconfident.`,
        tone: "encouraging",
      });
      commonPatterns.push("high_accuracy_track_record");
    }
  }

  // Check for emotional pattern
  const emotionalDecisions = pastDecisions.filter(
    d => d.survey.feelingScore === 1 || d.survey.feelingScore === 5
  );
  const emotionalReviewed = emotionalDecisions.filter(
    d => d.status === "reviewed" && d.outcome?.wasCorrect !== null
  );
  if (emotionalReviewed.length >= 2 && (currentDecision.feelingScore === 1 || currentDecision.feelingScore === 5)) {
    const emotionalCorrect = emotionalReviewed.filter(d => d.outcome?.wasCorrect === true).length;
    const emotionalAccuracy = emotionalCorrect / emotionalReviewed.length;

    if (emotionalAccuracy < 0.4) {
      insights.push({
        id: "pattern_emotional_bad",
        message: `Historically, when you've made decisions at emotional extremes (like now), ${Math.round((1 - emotionalAccuracy) * 100)}% turned out poorly. This is a strong signal to wait.`,
        tone: "warning",
        followUpQuestion: "What would you tell your past self who made those emotional decisions?",
      });
      commonPatterns.push("poor_emotional_decisions");
    }
  }

  // Check for loop-specific patterns
  const loopReviewed = loopDecisions.filter(
    d => d.status === "reviewed" && d.outcome?.wasCorrect !== null
  );
  if (loopReviewed.length >= 3) {
    const loopProceed = loopReviewed.filter(d => d.finalChoice === "proceed");
    const loopDecline = loopReviewed.filter(d => d.finalChoice === "decline");

    const proceedAccuracy = loopProceed.length > 0
      ? loopProceed.filter(d => d.outcome?.wasCorrect === true).length / loopProceed.length
      : null;
    const declineAccuracy = loopDecline.length > 0
      ? loopDecline.filter(d => d.outcome?.wasCorrect === true).length / loopDecline.length
      : null;

    if (proceedAccuracy !== null && declineAccuracy !== null && Math.abs(proceedAccuracy - declineAccuracy) > 0.3) {
      if (proceedAccuracy > declineAccuracy) {
        insights.push({
          id: "pattern_loop_proceed",
          message: `In ${currentDecision.loop} decisions, your 'proceed' choices have been more accurate than your 'decline' choices. You might have a tendency to be overly cautious here.`,
          tone: "challenging",
        });
        commonPatterns.push("tends_to_over_decline");
      } else {
        insights.push({
          id: "pattern_loop_decline",
          message: `In ${currentDecision.loop} decisions, your 'decline' choices have been more accurate than your 'proceed' choices. You might be too eager to act here.`,
          tone: "challenging",
        });
        commonPatterns.push("tends_to_over_proceed");
      }
    }
  }

  // Find similar title keywords
  const currentWords = new Set(currentDecision.title.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const similarDecisions = pastDecisions
    .filter(d => {
      const pastWords = new Set(d.title.toLowerCase().split(/\s+/).filter(w => w.length > 3));
      const overlap = [...currentWords].filter(w => pastWords.has(w)).length;
      return overlap >= 2 || d.loop === currentDecision.loop;
    })
    .slice(0, 5);

  if (similarDecisions.length > 0) {
    insights.push({
      id: "pattern_similar_found",
      message: `Found ${similarDecisions.length} similar past decision${similarDecisions.length > 1 ? 's' : ''}. Learning from history helps avoid repeated mistakes.`,
      tone: "supportive",
    });
  }

  return {
    similarDecisions,
    insights,
    accuracyWithSimilar,
    commonPatterns,
  };
}

// ============================================
// Confidence Calibration
// ============================================

export interface ConfidenceAnalysis {
  isCalibrated: boolean;
  adjustedConfidence: number;
  insights: CoachingInsight[];
  biasIndicators: BiasAlert[];
}

export function analyzeConfidence(
  statedConfidence: number,
  joustWinner: JoustWinner,
  qualityChecks: { isHonest: boolean; isConcise: boolean; isTiedToValues: boolean },
  isReversible: boolean,
  feelingScore: FeelingScore,
  pastDecisions: Decision[]
): ConfidenceAnalysis {
  const insights: CoachingInsight[] = [];
  const biasIndicators: BiasAlert[] = [];
  let adjustedConfidence = statedConfidence;

  // Check quality checks vs confidence alignment
  const qualityScore = [qualityChecks.isHonest, qualityChecks.isConcise, qualityChecks.isTiedToValues]
    .filter(Boolean).length;

  if (statedConfidence >= 8 && qualityScore < 2) {
    biasIndicators.push({
      biasType: "overconfidence",
      severity: "high",
      detected: true,
      explanation: "High confidence but your reason didn't pass quality checks. This is a classic overconfidence pattern.",
      debiasQuestion: "What would need to be true for you to be wrong about this?",
    });
    insights.push({
      id: "confidence_overcondient",
      message: `You're ${statedConfidence}/10 confident, but only ${qualityScore}/3 quality checks passed. That's a red flag.`,
      tone: "warning",
      followUpQuestion: "What evidence would convince you to lower your confidence?",
    });
    adjustedConfidence = Math.max(5, statedConfidence - 2);
  }

  if (statedConfidence >= 9 && !isReversible) {
    insights.push({
      id: "confidence_high_irreversible",
      message: "Very high confidence on an irreversible decision. Even if you're right 90% of the time, that 10% with no exit matters.",
      tone: "challenging",
      followUpQuestion: "What's your contingency plan if you're in the 10%?",
    });
  }

  if (statedConfidence <= 4 && joustWinner === "for") {
    insights.push({
      id: "confidence_low_proceeding",
      message: "You said FOR wins the joust, but your confidence is low. That's not a 'proceed' - that's a 'need more information'.",
      tone: "challenging",
      followUpQuestion: "What would raise your confidence to 7+?",
    });
  }

  // Check emotional state impact on confidence
  if (feelingScore === 5 && statedConfidence >= 8) {
    biasIndicators.push({
      biasType: "overconfidence",
      severity: "medium",
      detected: true,
      explanation: "High excitement tends to inflate confidence. Excitement is not evidence.",
      debiasQuestion: "Will you still feel this confident when the excitement fades?",
    });
    adjustedConfidence = Math.max(5, statedConfidence - 1);
  }

  if (feelingScore === 1 && statedConfidence <= 3) {
    biasIndicators.push({
      biasType: "underconfidence",
      severity: "medium",
      detected: true,
      explanation: "Fear tends to deflate confidence. Your capabilities haven't changed just because you're scared.",
      debiasQuestion: "What would you advise a calm version of yourself?",
    });
  }

  // Historical calibration check
  const reviewedWithConfidence = pastDecisions.filter(
    d => d.status === "reviewed" && d.outcome?.wasCorrect !== null && d.confidenceLevel >= 7
  );
  if (reviewedWithConfidence.length >= 5) {
    const highConfidenceAccuracy = reviewedWithConfidence.filter(d => d.outcome?.wasCorrect === true).length / reviewedWithConfidence.length;

    if (highConfidenceAccuracy < 0.6) {
      insights.push({
        id: "confidence_historically_miscalibrated",
        message: `When you've been highly confident in the past (7+), you've only been right ${Math.round(highConfidenceAccuracy * 100)}% of the time. Your confidence calibration might need adjustment.`,
        tone: "warning",
        source: "Calibration Research - Tetlock",
      });
      adjustedConfidence = Math.max(4, statedConfidence - 2);
    }
  }

  return {
    isCalibrated: adjustedConfidence === statedConfidence,
    adjustedConfidence,
    insights,
    biasIndicators,
  };
}

// ============================================
// Final Decision Coach Summary
// ============================================

export interface CoachingSummary {
  overallRisk: "low" | "medium" | "high" | "extreme";
  shouldProceed: boolean | null; // null = needs more info
  topConcerns: string[];
  strengthsNoted: string[];
  recommendedAction: "proceed_confidently" | "proceed_cautiously" | "pause_and_reflect" | "wait_48h" | "gather_more_info";
  finalInsight: CoachingInsight;
}

export function generateCoachingSummary(
  emotionalAnalysis: ReturnType<typeof analyzeEmotionalState>,
  joustAnalysis: JoustAnalysis,
  stakesAnalysis: StakesAnalysis,
  confidenceAnalysis: ConfidenceAnalysis,
  patternMatch: PatternMatch,
  finalChoice: DecisionChoice
): CoachingSummary {
  const topConcerns: string[] = [];
  const strengthsNoted: string[] = [];

  // Aggregate concerns
  if (!emotionalAnalysis.isSafe) {
    topConcerns.push("Emotional state is not neutral");
  }
  if (joustAnalysis.biasIndicators.some(b => b.severity === "high")) {
    topConcerns.push("High-severity bias detected in reasoning");
  }
  if (stakesAnalysis.riskLevel === "extreme" || stakesAnalysis.riskLevel === "high") {
    topConcerns.push("High stakes decision");
  }
  if (!confidenceAnalysis.isCalibrated) {
    topConcerns.push("Confidence appears miscalibrated");
  }
  if (patternMatch.commonPatterns.includes("poor_emotional_decisions")) {
    topConcerns.push("History of poor emotional decisions");
  }

  // Aggregate strengths
  if (emotionalAnalysis.isSafe) {
    strengthsNoted.push("Emotionally balanced");
  }
  if (joustAnalysis.forStrength === "strong" || joustAnalysis.againstStrength === "strong") {
    strengthsNoted.push("Strong reasoning present");
  }
  if (stakesAnalysis.asymmetryType === "favorable") {
    strengthsNoted.push("Favorable risk/reward asymmetry");
  }
  if (patternMatch.accuracyWithSimilar !== null && patternMatch.accuracyWithSimilar > 0.7) {
    strengthsNoted.push("Good track record in similar decisions");
  }

  // Determine overall risk
  let overallRisk: CoachingSummary["overallRisk"] = "low";
  if (topConcerns.length >= 3) {
    overallRisk = "extreme";
  } else if (topConcerns.length >= 2) {
    overallRisk = "high";
  } else if (topConcerns.length >= 1) {
    overallRisk = "medium";
  }

  // Determine recommended action
  let recommendedAction: CoachingSummary["recommendedAction"];
  let shouldProceed: boolean | null = null;

  if (overallRisk === "extreme") {
    recommendedAction = "wait_48h";
  } else if (overallRisk === "high") {
    recommendedAction = "pause_and_reflect";
  } else if (topConcerns.length === 0 && strengthsNoted.length >= 2) {
    recommendedAction = "proceed_confidently";
    shouldProceed = finalChoice === "proceed";
  } else if (joustAnalysis.asymmetry === "both_weak") {
    recommendedAction = "gather_more_info";
  } else {
    recommendedAction = "proceed_cautiously";
    shouldProceed = finalChoice === "proceed";
  }

  // Generate final insight
  let finalInsight: CoachingInsight;

  if (recommendedAction === "wait_48h") {
    finalInsight = {
      id: "final_wait",
      message: "I'd strongly recommend sleeping on this. The combination of emotional state, bias signals, and stakes suggests this isn't the moment to commit. What's lost by waiting 48 hours?",
      tone: "warning",
    };
  } else if (recommendedAction === "proceed_confidently") {
    finalInsight = {
      id: "final_proceed",
      message: "Your reasoning is solid, you're emotionally grounded, and the risk/reward looks favorable. Trust your process here.",
      tone: "encouraging",
    };
  } else if (recommendedAction === "gather_more_info") {
    finalInsight = {
      id: "final_gather",
      message: "Both your FOR and AGAINST reasons feel underdeveloped. This isn't a decision moment - it's a research moment. What would make the right choice obvious?",
      tone: "supportive",
    };
  } else if (recommendedAction === "pause_and_reflect") {
    finalInsight = {
      id: "final_pause",
      message: "There are some flags here worth examining before committing. Not stop signs, but yield signs. Take another look at the concerns raised.",
      tone: "challenging",
    };
  } else {
    finalInsight = {
      id: "final_cautious",
      message: "You can proceed, but stay alert. Set a review date to check if this decision is playing out as expected.",
      tone: "supportive",
    };
  }

  return {
    overallRisk,
    shouldProceed,
    topConcerns,
    strengthsNoted,
    recommendedAction,
    finalInsight,
  };
}
