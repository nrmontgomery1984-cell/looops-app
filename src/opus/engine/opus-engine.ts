// Opus AI Assistant Layer - Main Engine
// Orchestrates conversations, context loading, and voice transformation

import { LoopId, ALL_LOOPS, LOOP_DEFINITIONS } from "../../types/core";
import {
  UserPrototype,
  ArchetypeId,
  VoiceProfile,
} from "../../types/identity";
import { LoopState } from "../../types/loops";
import { DayType } from "../../types/dayTypes";
import { Task } from "../../types/tasks";
import { Routine, RoutineCompletion } from "../../types/routines";
import { Goal } from "../../types/goals";
import { System, HabitCompletion } from "../../types/systems";

// Import existing engines
import {
  applyVoice,
  getMotivation,
  celebrateCompletion,
  getPersonalizedGreeting,
  getBreakdownStrategy,
  getRandomMotivation,
  BREAKDOWN_STRATEGIES,
} from "../../engines/voiceEngine";

// Import Opus types and config
import {
  OpusDomainId,
  OpusRequest,
  OpusResponse,
  OpusContextSnapshot,
  OpusMessage,
  OpusConversation,
  OpusSuggestedAction,
  OpusIntent,
  OpusVoiceModifier,
  OpusUserSettings,
} from "../types/opus-types";
import {
  OPUS_DOMAINS,
  getOpusConfig,
  detectRelevantDomain,
} from "../config/opus-domains";

// ============================================================================
// CONTEXT BUILDING
// ============================================================================

export type ContextSources = {
  loopStates?: Record<LoopId, LoopState>;
  tasks?: Task[];
  routines?: Routine[];
  routineCompletions?: RoutineCompletion[];
  goals?: Goal[];
  systems?: System[];
  habitCompletions?: HabitCompletion[];
  dayTypes?: DayType[];
  healthData?: {
    steps?: number;
    sleepHours?: number;
    sleepScore?: number;
    activeMinutes?: number;
  };
};

/**
 * Build a context snapshot from available data sources
 */
export function buildContextSnapshot(
  prototype: UserPrototype,
  sources: ContextSources,
  depth: "minimal" | "standard" | "comprehensive" = "standard"
): OpusContextSnapshot {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const snapshot: OpusContextSnapshot = {
    snapshotAt: now.toISOString(),
    dayTypes: sources.dayTypes || ["regular"],
    loopStates: {},
    archetypeBlend: prototype.archetypeBlend
      ? {
          primary: prototype.archetypeBlend.primary,
          secondary: prototype.archetypeBlend.secondary,
          tertiary: prototype.archetypeBlend.tertiary,
        }
      : undefined,
  };

  // Add loop states
  if (sources.loopStates) {
    for (const loopId of ALL_LOOPS) {
      const state = sources.loopStates[loopId];
      if (state) {
        snapshot.loopStates[loopId] = {
          state: state.currentState,
          currentLoad: state.currentLoad,
          maxTasks: state.maxTasks,
        };
      }
    }
  }

  // Minimal depth stops here
  if (depth === "minimal") {
    return snapshot;
  }

  // Add tasks summary
  if (sources.tasks) {
    const activeTasks = sources.tasks.filter(
      t => t.status !== "done" && t.status !== "dropped"
    );
    const dueTodayTasks = activeTasks.filter(t => t.dueDate === today);
    const overdueTasks = activeTasks.filter(
      t => t.dueDate && t.dueDate < today
    );

    const byLoop: Partial<Record<LoopId, number>> = {};
    for (const task of activeTasks) {
      byLoop[task.loop] = (byLoop[task.loop] || 0) + 1;
    }

    snapshot.tasksSummary = {
      total: activeTasks.length,
      byLoop,
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
    };
  }

  // Add routines summary
  if (sources.routines && sources.routineCompletions) {
    const todayCompletions = sources.routineCompletions.filter(
      c => c.completedAt.startsWith(today)
    );

    snapshot.todayRoutines = sources.routines
      .filter(r => r.status === "active")
      .slice(0, 5) // Limit for context size
      .map(r => {
        const completion = todayCompletions.find(c => c.routineId === r.id);
        return {
          id: r.id,
          title: r.title,
          completed: completion?.fullyCompleted || false,
          stepsTotal: r.steps.length,
          stepsCompleted: completion?.completedSteps.length || 0,
        };
      });
  }

  // Standard depth stops here
  if (depth === "standard") {
    return snapshot;
  }

  // Comprehensive: Add goals summary
  if (sources.goals) {
    const activeGoals = sources.goals.filter(g => g.status === "active");
    const byLoop: Partial<Record<LoopId, number>> = {};
    for (const goal of activeGoals) {
      byLoop[goal.loop] = (byLoop[goal.loop] || 0) + 1;
    }

    snapshot.goalsSummary = {
      total: activeGoals.length,
      byLoop,
      inProgress: activeGoals.filter(g => g.progress > 0 && g.progress < 100).length,
    };
  }

  // Comprehensive: Add recent completions
  if (sources.tasks || sources.routineCompletions || sources.habitCompletions) {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    snapshot.recentCompletions = {
      tasks: sources.tasks?.filter(
        t => t.completedAt && t.completedAt > yesterday
      ).length || 0,
      routines: sources.routineCompletions?.filter(
        c => c.completedAt > yesterday
      ).length || 0,
      habits: sources.habitCompletions?.filter(
        c => c.completedAt > yesterday
      ).length || 0,
    };
  }

  // Comprehensive: Add health data
  if (sources.healthData) {
    snapshot.healthData = sources.healthData;
  }

  return snapshot;
}

// ============================================================================
// SYSTEM PROMPT GENERATION
// ============================================================================

/**
 * Generate the system prompt for an Opus conversation
 */
export function generateSystemPrompt(
  domain: OpusDomainId,
  prototype: UserPrototype,
  context: OpusContextSnapshot,
  voiceModifier: OpusVoiceModifier
): string {
  const config = getOpusConfig(domain);
  const archetype = prototype.archetypeBlend.primary;
  const strategy = BREAKDOWN_STRATEGIES[archetype];

  const parts: string[] = [];

  // Core identity
  parts.push(`You are ${config.name}, an AI assistant within the Looops Personal Operating System.`);
  parts.push(config.description);
  parts.push("");

  // User's archetype and voice
  parts.push("## User Profile");
  parts.push(`- Primary archetype: ${archetype} (${strategy.approachName})`);
  parts.push(`- Secondary archetype: ${prototype.archetypeBlend.secondary}`);
  parts.push(`- Voice tone: ${prototype.voiceProfile.tone}`);
  parts.push(`- Motivation style: ${voiceModifier.motivationOverride || prototype.voiceProfile.motivationStyle}`);
  parts.push(`- Detail level: ${prototype.voiceProfile.detailLevel}`);
  parts.push(`- Formality: ${voiceModifier.formality}`);
  parts.push(`- Push level: ${voiceModifier.pushLevel}`);
  if (prototype.archetypeBlend.name) {
    parts.push(`- Archetype blend name: "${prototype.archetypeBlend.name}"`);
  }
  parts.push("");

  // Domain expertise
  parts.push("## Your Expertise");
  for (const expertise of config.expertise) {
    parts.push(`- ${expertise}`);
  }
  parts.push("");

  // Current context
  parts.push("## Current Context");
  parts.push(`- Day type(s): ${context.dayTypes.join(", ")}`);

  if (Object.keys(context.loopStates).length > 0) {
    parts.push("- Loop states:");
    for (const [loopId, state] of Object.entries(context.loopStates)) {
      parts.push(`  - ${loopId}: ${state.state} (${state.currentLoad}/${state.maxTasks} tasks)`);
    }
  }

  if (context.tasksSummary) {
    parts.push(`- Tasks: ${context.tasksSummary.total} active, ${context.tasksSummary.dueToday} due today, ${context.tasksSummary.overdue} overdue`);
  }

  if (context.todayRoutines && context.todayRoutines.length > 0) {
    const completed = context.todayRoutines.filter(r => r.completed).length;
    parts.push(`- Routines today: ${completed}/${context.todayRoutines.length} completed`);
  }

  if (context.healthData) {
    const health = context.healthData;
    const healthParts: string[] = [];
    if (health.steps) healthParts.push(`${health.steps} steps`);
    if (health.sleepHours) healthParts.push(`${health.sleepHours}h sleep`);
    if (health.sleepScore) healthParts.push(`sleep score: ${health.sleepScore}`);
    if (healthParts.length > 0) {
      parts.push(`- Health: ${healthParts.join(", ")}`);
    }
  }
  parts.push("");

  // Voice guidelines
  parts.push("## Voice Guidelines");
  parts.push(`Respond in a ${prototype.voiceProfile.tone} tone with ${voiceModifier.pushLevel} intensity.`);
  parts.push(`Use ${voiceModifier.formality} language.`);
  if (voiceModifier.useEmoji) {
    parts.push("Use emojis sparingly to add warmth.");
  } else {
    parts.push("Do not use emojis.");
  }
  parts.push("");

  // Archetype-specific phrasing
  parts.push("## Archetype-Specific Language");
  parts.push(`Use these action verbs: ${strategy.verbSet.primary.join(", ")}`);
  parts.push(`Motivation phrases: "${strategy.motivationPhrases[0]}"`);
  parts.push("");

  // Domain-specific additions
  if (config.systemPromptAdditions.length > 0) {
    parts.push("## Domain-Specific Guidelines");
    for (const addition of config.systemPromptAdditions) {
      parts.push(`- ${addition}`);
    }
    parts.push("");
  }

  // Domain inspirations
  if (voiceModifier.domainInspirations && voiceModifier.domainInspirations.length > 0) {
    parts.push("## Domain Wisdom");
    for (const inspiration of voiceModifier.domainInspirations) {
      parts.push(`- "${inspiration}"`);
    }
    parts.push("");
  }

  // Response format
  parts.push("## Response Format");
  parts.push("- Be concise and actionable");
  parts.push("- When suggesting tasks or actions, format them clearly");
  parts.push("- If you suggest creating tasks, routines, or goals, indicate this clearly");
  parts.push("- Match the user's archetype communication style");
  parts.push("- End with a clear next step or question when appropriate");

  return parts.join("\n");
}

// ============================================================================
// VOICE TRANSFORMATION
// ============================================================================

/**
 * Apply Opus voice transformation to a response
 */
export function applyOpusVoice(
  text: string,
  prototype: UserPrototype,
  modifier: OpusVoiceModifier
): string {
  // Use the existing voice engine
  let result = applyVoice(text, prototype.voiceProfile, prototype.archetypeBlend.primary);

  // Apply push level adjustments
  if (modifier.pushLevel === "gentle") {
    result = result
      .replace(/\bDo this now\b/gi, "When you're ready")
      .replace(/\bYou must\b/gi, "Consider")
      .replace(/\bImmediately\b/gi, "Soon");
  } else if (modifier.pushLevel === "intense") {
    result = result
      .replace(/\bConsider\b/gi, "Do")
      .replace(/\bMaybe\b/gi, "")
      .replace(/\bWhen you can\b/gi, "Now");
  }

  return result;
}

/**
 * Get a personalized greeting for the Opus
 */
export function getOpusGreeting(
  domain: OpusDomainId,
  prototype: UserPrototype,
  userName: string
): string {
  if (domain === "Life") {
    return getPersonalizedGreeting(prototype, userName);
  }

  const config = getOpusConfig(domain);
  const timeOfDay = getTimeOfDayLabel();

  // Domain-specific greetings
  const greetings: Record<LoopId, string[]> = {
    Health: [
      `${config.icon} Ready to move, ${userName}?`,
      `${config.icon} ${timeOfDay}, ${userName}. How's your body feeling?`,
    ],
    Wealth: [
      `${config.icon} ${timeOfDay}, ${userName}. Let's talk numbers.`,
      `${config.icon} Ready to build wealth, ${userName}?`,
    ],
    Family: [
      `${config.icon} ${timeOfDay}, ${userName}. Family on your mind?`,
      `${config.icon} How can I help with the people who matter, ${userName}?`,
    ],
    Work: [
      `${config.icon} ${timeOfDay}, ${userName}. Let's get focused.`,
      `${config.icon} Ready to ship, ${userName}?`,
    ],
    Fun: [
      `${config.icon} ${timeOfDay}, ${userName}! What sounds fun?`,
      `${config.icon} Time to play, ${userName}?`,
    ],
    Maintenance: [
      `${config.icon} ${timeOfDay}, ${userName}. What needs handling?`,
      `${config.icon} Let's keep things running smooth, ${userName}.`,
    ],
    Meaning: [
      `${config.icon} ${timeOfDay}, ${userName}. Time for reflection?`,
      `${config.icon} What's on your mind, ${userName}?`,
    ],
  };

  const options = greetings[domain as LoopId] || [`${config.icon} ${timeOfDay}, ${userName}.`];
  return options[Math.floor(Math.random() * options.length)];
}

function getTimeOfDayLabel(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ============================================================================
// INTENT DETECTION
// ============================================================================

/**
 * Detect user intent from message
 */
export function detectIntent(
  message: string,
  context: OpusContextSnapshot
): OpusIntent {
  const lowerMessage = message.toLowerCase();

  // Action intents
  const actionPatterns: Array<{ pattern: RegExp; action: OpusIntent["primary"] }> = [
    { pattern: /\b(create|add|new)\s+(task|todo)/i, action: "create_task" },
    { pattern: /\b(create|add|new|build)\s+routine/i, action: "create_routine" },
    { pattern: /\b(create|add|new|set)\s+goal/i, action: "create_goal" },
    { pattern: /\b(break\s*down|decompose|split)/i, action: "suggest_breakdown" },
    { pattern: /\b(suggest|recommend)\s+routine/i, action: "suggest_routine" },
    { pattern: /\b(schedule|block|plan)\s+(time|session)/i, action: "schedule_block" },
    { pattern: /\b(mark|set|make)\s+(complete|done|finished)/i, action: "mark_complete" },
    { pattern: /\b(motivat|inspir|encourage)/i, action: "provide_motivation" },
    { pattern: /\b(review|assess|check)\s+(progress|status)/i, action: "review_progress" },
    { pattern: /\b(explain|how\s+does|what\s+is)\s+(loop|system|routine)/i, action: "explain_system" },
    { pattern: /\b(go\s+to|open|show\s+me|navigate)/i, action: "navigate_to" },
  ];

  for (const { pattern, action } of actionPatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        primary: action,
        confidence: 0.8,
        entities: extractEntities(message),
        suggestedDomain: detectRelevantDomain(message),
      };
    }
  }

  // Question patterns
  if (/\?$/.test(message.trim()) || /^(what|how|why|when|where|who|can|should|is|are|do|does)\b/i.test(lowerMessage)) {
    return {
      primary: "question",
      confidence: 0.7,
      entities: extractEntities(message),
      suggestedDomain: detectRelevantDomain(message),
    };
  }

  // Feedback patterns
  if (/\b(thanks|thank you|great|good job|perfect|love it|hate|don't like)\b/i.test(lowerMessage)) {
    return {
      primary: "feedback",
      confidence: 0.6,
      entities: {},
    };
  }

  // Default to conversation
  return {
    primary: "conversation",
    confidence: 0.5,
    entities: extractEntities(message),
    suggestedDomain: detectRelevantDomain(message),
  };
}

/**
 * Extract entities (loops, dates, etc.) from message
 */
function extractEntities(message: string): OpusIntent["entities"] {
  const entities: OpusIntent["entities"] = {};

  // Extract loops mentioned
  const loopsFound: LoopId[] = [];
  for (const loopId of ALL_LOOPS) {
    if (message.toLowerCase().includes(loopId.toLowerCase())) {
      loopsFound.push(loopId);
    }
  }
  if (loopsFound.length > 0) {
    entities.loops = loopsFound;
  }

  // Extract dates (simple patterns)
  const datePatterns = [
    /\b(today|tomorrow|yesterday)\b/i,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b(this|next)\s+(week|month)\b/i,
    /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/,
  ];

  const datesFound: string[] = [];
  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      datesFound.push(match[0]);
    }
  }
  if (datesFound.length > 0) {
    entities.dates = datesFound;
  }

  return entities;
}

// ============================================================================
// SUGGESTED ACTIONS
// ============================================================================

/**
 * Generate suggested actions based on intent and context
 */
export function generateSuggestedActions(
  intent: OpusIntent,
  context: OpusContextSnapshot,
  responseContent: string
): OpusSuggestedAction[] {
  const actions: OpusSuggestedAction[] = [];

  // Based on detected intent
  if (intent.primary === "create_task") {
    actions.push({
      type: "create_task",
      label: "Create task",
      description: "Add this as a new task",
      payload: { suggestedTitle: extractTaskTitle(responseContent) },
      requiresConfirmation: true,
      confidence: "high",
    });
  }

  if (intent.primary === "suggest_breakdown") {
    actions.push({
      type: "suggest_breakdown",
      label: "Break down into steps",
      description: "Get a detailed breakdown of steps",
      payload: {},
      requiresConfirmation: false,
      confidence: "medium",
    });
  }

  // Context-aware suggestions
  if (context.tasksSummary && context.tasksSummary.overdue > 0) {
    actions.push({
      type: "review_progress",
      label: `Review ${context.tasksSummary.overdue} overdue tasks`,
      payload: { filter: "overdue" },
      requiresConfirmation: false,
      confidence: "medium",
    });
  }

  return actions.slice(0, 3); // Max 3 suggestions
}

function extractTaskTitle(content: string): string {
  // Try to extract a task-like phrase from the response
  const taskMatch = content.match(/(?:task|todo|action):\s*(.+?)(?:\.|$)/i);
  if (taskMatch) {
    return taskMatch[1].trim();
  }
  return "";
}

// ============================================================================
// CONVERSATION MANAGEMENT
// ============================================================================

/**
 * Create a new Opus conversation
 */
export function createConversation(
  userId: string,
  domain: OpusDomainId,
  context: OpusContextSnapshot
): OpusConversation {
  const id = `opus_conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    userId,
    primaryDomain: domain,
    messages: [],
    status: "active",
    loadedContext: context,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Add a message to a conversation
 */
export function addMessageToConversation(
  conversation: OpusConversation,
  role: "user" | "assistant",
  content: string,
  domain?: OpusDomainId
): OpusConversation {
  const message: OpusMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    role,
    content,
    timestamp: new Date().toISOString(),
    opusDomain: role === "assistant" ? domain : undefined,
  };

  return {
    ...conversation,
    messages: [...conversation.messages, message],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get conversation history for API call (limited by settings)
 */
export function getConversationHistoryForAPI(
  conversation: OpusConversation,
  maxMessages: number
): Array<{ role: "user" | "assistant"; content: string }> {
  return conversation.messages
    .slice(-maxMessages)
    .map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
}

// ============================================================================
// MAIN PROCESSING FUNCTION
// ============================================================================

/**
 * Process an Opus request and prepare for API call
 * This returns everything needed to make the actual API call
 */
export function prepareOpusRequest(request: OpusRequest): {
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  domain: OpusDomainId;
  voiceModifier: OpusVoiceModifier;
  intent: OpusIntent;
} {
  // Detect domain if auto
  const domain = request.domain === "auto"
    ? detectRelevantDomain(request.message)
    : request.domain;

  // Get domain config
  const config = getOpusConfig(domain);

  // Merge voice modifiers
  const voiceModifier: OpusVoiceModifier = {
    ...config.defaultVoiceModifier,
    ...request.voiceModifierOverride,
  };

  // Generate system prompt
  const systemPrompt = generateSystemPrompt(
    domain,
    request.userPrototype,
    request.context,
    voiceModifier
  );

  // Build messages array
  const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  // Add conversation history
  if (request.conversationHistory) {
    for (const msg of request.conversationHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  }

  // Add current message
  messages.push({ role: "user", content: request.message });

  // Detect intent
  const intent = detectIntent(request.message, request.context);

  return {
    systemPrompt,
    messages,
    domain,
    voiceModifier,
    intent,
  };
}

/**
 * Process API response and build OpusResponse
 */
export function processOpusResponse(
  rawResponse: string,
  domain: OpusDomainId,
  prototype: UserPrototype,
  voiceModifier: OpusVoiceModifier,
  intent: OpusIntent,
  context: OpusContextSnapshot,
  metadata: { tokensUsed: number; responseTimeMs: number; modelUsed: string }
): OpusResponse {
  // Apply voice transformation
  const message = applyOpusVoice(rawResponse, prototype, voiceModifier);

  // Generate suggested actions
  const suggestedActions = generateSuggestedActions(intent, context, message);

  return {
    message,
    domain,
    voiceApplied: prototype.voiceProfile,
    suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
    intent,
    shouldRefreshContext: intent.primary === "create_task" ||
      intent.primary === "create_routine" ||
      intent.primary === "mark_complete",
    metadata,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  applyVoice,
  getMotivation,
  celebrateCompletion,
  getRandomMotivation,
} from "../../engines/voiceEngine";
