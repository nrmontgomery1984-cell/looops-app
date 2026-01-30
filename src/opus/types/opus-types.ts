// Opus AI Assistant Layer - Core Types
// Integrates with existing identity, voice, and scoring systems

import {
  LoopId,
  LoopStateType,
} from "../../types/core";
import {
  ArchetypeId,
  VoiceTone,
  MotivationStyle,
  UserPrototype,
  VoiceProfile,
} from "../../types/identity";
import { DayType } from "../../types/dayTypes";
import { LoopState } from "../../types/loops";
import { Routine } from "../../types/routines";
import { Task } from "../../types/tasks";
import { Goal } from "../../types/goals";

// ============================================================================
// OPUS DOMAIN IDENTIFIERS
// ============================================================================

/** The 7 Opus domains - Life is the master orchestrator */
export type OpusDomainId = "Life" | LoopId;

/** All Opus domain IDs for iteration */
export const ALL_OPUS_DOMAINS: OpusDomainId[] = [
  "Life",
  "Health",
  "Wealth",
  "Family",
  "Work",
  "Fun",
  "Maintenance",
  "Meaning",
];

// ============================================================================
// OPUS VOICE MODIFIERS
// ============================================================================

/**
 * Domain-specific voice modifiers that adjust the user's base archetype
 * These allow each Opus to have a slightly different personality while
 * maintaining consistency with the user's core identity
 */
export type OpusVoiceModifier = {
  /** Shift tone toward a different style (blended with user's) */
  toneShift?: Partial<Record<VoiceTone, number>>; // -1 to 1, weights

  /** Adjust push level for this domain */
  pushLevel: "gentle" | "moderate" | "intense";

  /** Domain-specific motivation style override (optional) */
  motivationOverride?: MotivationStyle;

  /** Domain-specific inspiration quotes/references */
  domainInspirations?: string[];

  /** Emoji style for this domain */
  useEmoji: boolean;

  /** Formality level */
  formality: "casual" | "balanced" | "professional";
};

// ============================================================================
// OPUS CONFIGURATION
// ============================================================================

/**
 * Configuration for a single Opus domain
 */
export type OpusDomainConfig = {
  id: OpusDomainId;
  name: string;
  description: string;
  icon: string;
  color: string;

  /** Areas of expertise for this Opus */
  expertise: string[];

  /** Example prompts users might ask this Opus */
  samplePrompts: string[];

  /** Default voice modifier for this domain */
  defaultVoiceModifier: OpusVoiceModifier;

  /** Related loops this Opus can assist with (Life Opus has all) */
  relatedLoops: LoopId[];

  /** System prompt additions specific to this domain */
  systemPromptAdditions: string[];
};

// ============================================================================
// CONVERSATION & MESSAGES
// ============================================================================

/** Role in a conversation */
export type OpusMessageRole = "user" | "assistant" | "system";

/** A single message in an Opus conversation */
export type OpusMessage = {
  id: string;
  role: OpusMessageRole;
  content: string;
  timestamp: string;

  /** Which Opus handled this message (for assistant messages) */
  opusDomain?: OpusDomainId;

  /** Metadata for tracking/analytics */
  metadata?: {
    tokensUsed?: number;
    responseTimeMs?: number;
    voiceApplied?: boolean;
    archetypeUsed?: ArchetypeId;
  };
};

/** A conversation thread with an Opus */
export type OpusConversation = {
  id: string;
  userId: string;

  /** Primary Opus domain for this conversation */
  primaryDomain: OpusDomainId;

  /** Conversation title (auto-generated or user-set) */
  title?: string;

  /** All messages in chronological order */
  messages: OpusMessage[];

  /** Conversation state */
  status: "active" | "archived";

  /** Context that was loaded for this conversation */
  loadedContext?: OpusContextSnapshot;

  createdAt: string;
  updatedAt: string;
};

// ============================================================================
// CONTEXT AWARENESS
// ============================================================================

/**
 * Snapshot of user context provided to Opus for awareness
 * This is injected into the system prompt for relevant conversations
 */
export type OpusContextSnapshot = {
  /** When this snapshot was taken */
  snapshotAt: string;

  /** Current day type(s) */
  dayTypes: DayType[];

  /** Current loop states */
  loopStates: Partial<Record<LoopId, {
    state: LoopStateType;
    currentLoad: number;
    maxTasks: number;
  }>>;

  /** Today's routines */
  todayRoutines?: {
    id: string;
    title: string;
    completed: boolean;
    stepsTotal: number;
    stepsCompleted: number;
  }[];

  /** Active tasks summary */
  tasksSummary?: {
    total: number;
    byLoop: Partial<Record<LoopId, number>>;
    overdue: number;
    dueToday: number;
  };

  /** Active goals summary */
  goalsSummary?: {
    total: number;
    byLoop: Partial<Record<LoopId, number>>;
    inProgress: number;
  };

  /** Recent completions (last 24h) */
  recentCompletions?: {
    tasks: number;
    routines: number;
    habits: number;
  };

  /** Health data if available */
  healthData?: {
    steps?: number;
    sleepHours?: number;
    sleepScore?: number;
    activeMinutes?: number;
  };

  /** User's archetype blend for voice matching */
  archetypeBlend?: {
    primary: ArchetypeId;
    secondary: ArchetypeId;
    tertiary?: ArchetypeId;
  };
};

// ============================================================================
// OPUS ACTIONS & INTENTS
// ============================================================================

/**
 * Actions that Opus can suggest or execute
 */
export type OpusActionType =
  | "create_task"
  | "create_routine"
  | "create_goal"
  | "modify_loop_state"
  | "suggest_breakdown"
  | "suggest_routine"
  | "schedule_block"
  | "mark_complete"
  | "provide_motivation"
  | "review_progress"
  | "explain_system"
  | "navigate_to";

/**
 * A suggested action from Opus
 */
export type OpusSuggestedAction = {
  type: OpusActionType;
  label: string;
  description?: string;

  /** Data needed to execute this action */
  payload: Record<string, unknown>;

  /** Whether this requires user confirmation */
  requiresConfirmation: boolean;

  /** Priority/confidence level */
  confidence: "high" | "medium" | "low";
};

/**
 * Intent detection result from user message
 */
export type OpusIntent = {
  /** Primary intent detected */
  primary: OpusActionType | "conversation" | "question" | "feedback";

  /** Confidence score 0-1 */
  confidence: number;

  /** Detected entities (loops, dates, etc.) */
  entities: {
    loops?: LoopId[];
    dates?: string[];
    tasks?: string[];
    goals?: string[];
    routines?: string[];
  };

  /** Suggested domain to route to */
  suggestedDomain?: OpusDomainId;
};

// ============================================================================
// OPUS REQUEST/RESPONSE
// ============================================================================

/**
 * Request to the Opus engine
 */
export type OpusRequest = {
  /** User's message */
  message: string;

  /** Which Opus domain to use (or "auto" for routing) */
  domain: OpusDomainId | "auto";

  /** User's prototype for personalization */
  userPrototype: UserPrototype;

  /** Current context snapshot */
  context: OpusContextSnapshot;

  /** Conversation history (last N messages) */
  conversationHistory?: OpusMessage[];

  /** Optional: specific voice modifier override */
  voiceModifierOverride?: Partial<OpusVoiceModifier>;
};

/**
 * Response from the Opus engine
 */
export type OpusResponse = {
  /** The response message */
  message: string;

  /** Which Opus domain handled this */
  domain: OpusDomainId;

  /** Voice profile that was applied */
  voiceApplied: VoiceProfile;

  /** Suggested actions (if any) */
  suggestedActions?: OpusSuggestedAction[];

  /** Detected intent */
  intent?: OpusIntent;

  /** Whether to update context after this response */
  shouldRefreshContext?: boolean;

  /** Metadata */
  metadata: {
    tokensUsed: number;
    responseTimeMs: number;
    modelUsed: string;
  };
};

// ============================================================================
// OPUS SETTINGS (USER PREFERENCES)
// ============================================================================

/**
 * User preferences for Opus behavior
 */
export type OpusUserSettings = {
  /** Enable/disable Opus globally */
  enabled: boolean;

  /** Per-domain voice modifier overrides */
  domainOverrides: Partial<Record<OpusDomainId, Partial<OpusVoiceModifier>>>;

  /** How much context to load */
  contextDepth: "minimal" | "standard" | "comprehensive";

  /** Proactive suggestions enabled */
  proactiveSuggestions: boolean;

  /** Show Opus in quick actions */
  showInQuickActions: boolean;

  /** Preferred model (if multiple available) */
  preferredModel?: string;

  /** Maximum conversation history to include */
  maxHistoryMessages: number;
};

/**
 * Default Opus user settings
 */
export const DEFAULT_OPUS_SETTINGS: OpusUserSettings = {
  enabled: true,
  domainOverrides: {},
  contextDepth: "standard",
  proactiveSuggestions: true,
  showInQuickActions: true,
  maxHistoryMessages: 10,
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Quick action for Opus (shown in UI)
 */
export type OpusQuickAction = {
  id: string;
  label: string;
  icon: string;
  domain: OpusDomainId;
  prompt: string;
};

/**
 * Opus state in app context
 */
export type OpusState = {
  /** Current active conversation (if any) */
  activeConversation?: OpusConversation;

  /** All conversations */
  conversations: OpusConversation[];

  /** User settings */
  settings: OpusUserSettings;

  /** Loading state */
  isLoading: boolean;

  /** Last error */
  lastError?: string;
};

/**
 * Create default Opus state
 */
export function createDefaultOpusState(): OpusState {
  return {
    conversations: [],
    settings: DEFAULT_OPUS_SETTINGS,
    isLoading: false,
  };
}
