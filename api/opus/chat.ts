// Vercel Serverless Function - Opus Chat API
// Handles chat interactions with Opus AI assistant

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// ============================================================================
// TYPES (inline to avoid import issues in serverless)
// ============================================================================

type LoopId = "Health" | "Wealth" | "Family" | "Work" | "Fun" | "Maintenance" | "Meaning";
type OpusDomainId = "Life" | LoopId;
type LoopStateType = "BUILD" | "MAINTAIN" | "RECOVER" | "HIBERNATE";

const ALL_OPUS_DOMAINS: OpusDomainId[] = [
  "Life", "Health", "Wealth", "Family", "Work", "Fun", "Maintenance", "Meaning"
];

interface OpusIntent {
  primary: string;
  confidence: number;
  entities: {
    loops?: LoopId[];
    dates?: string[];
  };
  suggestedDomain?: OpusDomainId;
}

interface OpusSuggestedAction {
  type: string;
  label: string;
  description?: string;
  payload: Record<string, unknown>;
  requiresConfirmation: boolean;
  confidence: "high" | "medium" | "low";
}

interface OpusContextSnapshot {
  snapshotAt: string;
  dayTypes: string[];
  loopStates: Partial<Record<LoopId, {
    state: LoopStateType;
    currentLoad: number;
    maxTasks: number;
  }>>;
  tasksSummary?: {
    total: number;
    overdue: number;
    dueToday: number;
  };
  todayRoutines?: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  healthData?: {
    steps?: number;
    sleepHours?: number;
    sleepScore?: number;
  };
  archetypeBlend?: {
    primary: string;
    secondary: string;
  };
}

interface ChatRequest {
  userId: string;
  domain: OpusDomainId;
  message: string;
  conversationId?: string;
}

interface ChatResponse {
  conversationId: string;
  response: string;
  intent: OpusIntent;
  suggestedActions: OpusSuggestedAction[];
}

// ============================================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================================

function initFirebaseAdmin() {
  if (getApps().length > 0) {
    return getFirestore();
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin credentials not configured");
  }

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return getFirestore();
}

// ============================================================================
// DOMAIN CONFIGURATIONS
// ============================================================================

const DOMAIN_CONFIGS: Record<OpusDomainId, {
  name: string;
  expertise: string[];
  pushLevel: "gentle" | "moderate" | "intense";
}> = {
  Life: {
    name: "Life Opus",
    expertise: ["Cross-domain prioritization", "Life direction", "Trade-offs"],
    pushLevel: "moderate",
  },
  Health: {
    name: "Health Opus",
    expertise: ["Exercise", "Sleep", "Nutrition", "Recovery"],
    pushLevel: "intense",
  },
  Wealth: {
    name: "Wealth Opus",
    expertise: ["Budgeting", "Saving", "Investing", "Financial habits"],
    pushLevel: "moderate",
  },
  Family: {
    name: "Family Opus",
    expertise: ["Quality time", "Parenting", "Relationships"],
    pushLevel: "gentle",
  },
  Work: {
    name: "Work Opus",
    expertise: ["Deep work", "Projects", "Career", "Productivity"],
    pushLevel: "moderate",
  },
  Fun: {
    name: "Fun Opus",
    expertise: ["Hobbies", "Social", "Entertainment", "Adventure"],
    pushLevel: "gentle",
  },
  Maintenance: {
    name: "Maintenance Opus",
    expertise: ["Cleaning", "Home care", "Organization", "Logistics"],
    pushLevel: "moderate",
  },
  Meaning: {
    name: "Meaning Opus",
    expertise: ["Purpose", "Reflection", "Values", "Spirituality"],
    pushLevel: "gentle",
  },
};

// ============================================================================
// SYSTEM PROMPT GENERATION
// ============================================================================

function generateSystemPrompt(
  domain: OpusDomainId,
  context: OpusContextSnapshot,
  archetype?: string
): string {
  const config = DOMAIN_CONFIGS[domain];
  const parts: string[] = [];

  parts.push(`You are ${config.name}, an AI assistant within the Looops Personal Operating System.`);
  parts.push("");

  // User archetype
  if (archetype) {
    parts.push(`## User Profile`);
    parts.push(`- Primary archetype: ${archetype}`);
    parts.push(`- Communication style: Match their archetype preferences`);
    parts.push("");
  }

  // Domain expertise
  parts.push("## Your Expertise");
  config.expertise.forEach(e => parts.push(`- ${e}`));
  parts.push("");

  // Current context
  parts.push("## Current Context");
  parts.push(`- Day type(s): ${context.dayTypes.join(", ") || "regular"}`);

  if (Object.keys(context.loopStates).length > 0) {
    parts.push("- Loop states:");
    Object.entries(context.loopStates).forEach(([loop, state]) => {
      parts.push(`  - ${loop}: ${state.state} (${state.currentLoad}/${state.maxTasks} tasks)`);
    });
  }

  if (context.tasksSummary) {
    parts.push(`- Tasks: ${context.tasksSummary.dueToday} due today, ${context.tasksSummary.overdue} overdue`);
  }

  if (context.healthData) {
    const h = context.healthData;
    const healthParts: string[] = [];
    if (h.steps) healthParts.push(`${h.steps} steps`);
    if (h.sleepHours) healthParts.push(`${h.sleepHours}h sleep`);
    if (healthParts.length > 0) {
      parts.push(`- Health: ${healthParts.join(", ")}`);
    }
  }
  parts.push("");

  // Voice guidelines
  parts.push("## Response Guidelines");
  parts.push(`- Push level: ${config.pushLevel}`);
  parts.push("- Be concise and actionable");
  parts.push("- Match the user's communication style");
  parts.push("- Suggest specific next steps when appropriate");
  parts.push("- Do not use emojis unless the user does");

  return parts.join("\n");
}

// ============================================================================
// INTENT DETECTION
// ============================================================================

function detectIntent(message: string): OpusIntent {
  const lowerMessage = message.toLowerCase();

  // Action patterns
  const actionPatterns: Array<{ pattern: RegExp; action: string }> = [
    { pattern: /\b(create|add|new)\s+(task|todo)/i, action: "create_task" },
    { pattern: /\b(create|add|build)\s+routine/i, action: "create_routine" },
    { pattern: /\b(break\s*down|decompose)/i, action: "suggest_breakdown" },
    { pattern: /\b(motivat|inspir|encourage)/i, action: "provide_motivation" },
    { pattern: /\b(review|check)\s+(progress|status)/i, action: "review_progress" },
  ];

  for (const { pattern, action } of actionPatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        primary: action,
        confidence: 0.8,
        entities: extractEntities(message),
      };
    }
  }

  // Question
  if (/\?$/.test(message.trim()) || /^(what|how|why|when|should|can)\b/i.test(lowerMessage)) {
    return {
      primary: "question",
      confidence: 0.7,
      entities: extractEntities(message),
    };
  }

  return {
    primary: "conversation",
    confidence: 0.5,
    entities: extractEntities(message),
  };
}

function extractEntities(message: string): OpusIntent["entities"] {
  const entities: OpusIntent["entities"] = {};
  const ALL_LOOPS: LoopId[] = ["Health", "Wealth", "Family", "Work", "Fun", "Maintenance", "Meaning"];

  const loopsFound: LoopId[] = [];
  for (const loopId of ALL_LOOPS) {
    if (message.toLowerCase().includes(loopId.toLowerCase())) {
      loopsFound.push(loopId);
    }
  }
  if (loopsFound.length > 0) {
    entities.loops = loopsFound;
  }

  // Date patterns
  const datePatterns = [/\b(today|tomorrow|yesterday)\b/i, /\b(this|next)\s+week\b/i];
  const datesFound: string[] = [];
  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) datesFound.push(match[0]);
  }
  if (datesFound.length > 0) {
    entities.dates = datesFound;
  }

  return entities;
}

// ============================================================================
// SUGGESTED ACTIONS
// ============================================================================

function generateSuggestedActions(
  intent: OpusIntent,
  responseContent: string
): OpusSuggestedAction[] {
  const actions: OpusSuggestedAction[] = [];

  if (intent.primary === "create_task") {
    actions.push({
      type: "create_task",
      label: "Create task",
      description: "Add this as a new task",
      payload: {},
      requiresConfirmation: true,
      confidence: "high",
    });
  }

  if (intent.primary === "suggest_breakdown") {
    actions.push({
      type: "suggest_breakdown",
      label: "Break down into steps",
      payload: {},
      requiresConfirmation: false,
      confidence: "medium",
    });
  }

  return actions.slice(0, 3);
}

// ============================================================================
// CLAUDE API CALL
// ============================================================================

async function callClaudeAPI(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string
): Promise<{ content: string; tokensUsed: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      temperature: 0.7,
      system: systemPrompt,
      messages: [...messages, { role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || "";
  const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

  return { content, tokensUsed };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body as ChatRequest;

    // Validate request
    if (!body.userId || !body.message) {
      return res.status(400).json({
        error: "Missing required fields: userId and message are required",
      });
    }

    if (!body.domain || !ALL_OPUS_DOMAINS.includes(body.domain)) {
      return res.status(400).json({
        error: `Invalid domain. Must be one of: ${ALL_OPUS_DOMAINS.join(", ")}`,
      });
    }

    // Initialize Firebase Admin
    let db;
    try {
      db = initFirebaseAdmin();
    } catch (error) {
      console.error("Firebase init error:", error);
      // Continue without Firebase - use defaults
      db = null;
    }

    // Load user prototype from Firebase
    let userPrototype: any = null;
    let loopStates: any = {};

    if (db) {
      try {
        const userDoc = await db.collection("users").doc(body.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          userPrototype = userData?.prototype || null;
          loopStates = userData?.loopStates || {};
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    }

    if (!userPrototype) {
      // Return 404 to prompt onboarding
      return res.status(404).json({
        error: "User prototype not found",
        message: "Please complete onboarding to use Opus.",
        code: "ONBOARDING_REQUIRED",
      });
    }

    // Build context snapshot
    const context: OpusContextSnapshot = {
      snapshotAt: new Date().toISOString(),
      dayTypes: ["regular"], // TODO: Load from smart scheduler
      loopStates: {},
      archetypeBlend: userPrototype.archetypeBlend
        ? {
            primary: userPrototype.archetypeBlend.primary,
            secondary: userPrototype.archetypeBlend.secondary,
          }
        : undefined,
    };

    // Add loop states to context
    if (loopStates && typeof loopStates === "object") {
      for (const [loopId, state] of Object.entries(loopStates)) {
        if (state && typeof state === "object") {
          const s = state as any;
          context.loopStates[loopId as LoopId] = {
            state: s.currentState || "MAINTAIN",
            currentLoad: s.currentLoad || 0,
            maxTasks: s.maxTasks || 5,
          };
        }
      }
    }

    // Load conversation history if continuing
    let conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
    let conversationId = body.conversationId;

    if (conversationId && db) {
      try {
        const messagesSnap = await db
          .collection("opus_messages")
          .where("conversationId", "==", conversationId)
          .orderBy("createdAt", "asc")
          .limit(10)
          .get();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messagesSnap.forEach((doc: any) => {
          const data = doc.data();
          conversationHistory.push({
            role: data.role,
            content: data.content,
          });
        });
      } catch (error) {
        console.error("Error loading conversation history:", error);
      }
    }

    // Generate system prompt
    const systemPrompt = generateSystemPrompt(
      body.domain,
      context,
      userPrototype.archetypeBlend?.primary
    );

    // Call Claude API
    let aiResponse: { content: string; tokensUsed: number };
    try {
      aiResponse = await callClaudeAPI(systemPrompt, conversationHistory, body.message);
    } catch (error) {
      console.error("Claude API error:", error);
      return res.status(500).json({
        error: "I'm having trouble thinking. Try again?",
        code: "AI_ERROR",
      });
    }

    // Detect intent
    const intent = detectIntent(body.message);

    // Generate suggested actions
    const suggestedActions = generateSuggestedActions(intent, aiResponse.content);

    // Create new conversation if needed
    if (!conversationId) {
      conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    // Persist conversation and messages
    if (db) {
      try {
        const now = Timestamp.now();

        // Create or update conversation
        await db.collection("opus_conversations").doc(conversationId).set(
          {
            id: conversationId,
            userId: body.userId,
            domain: body.domain,
            initiationType: "user",
            dayTypes: context.dayTypes,
            startedAt: now,
            updatedAt: now,
            messageCount: conversationHistory.length + 2,
          },
          { merge: true }
        );

        // Save user message
        const userMsgId = `msg_${Date.now()}_user`;
        await db.collection("opus_messages").doc(userMsgId).set({
          id: userMsgId,
          conversationId,
          role: "user",
          content: body.message,
          createdAt: now,
        });

        // Save assistant message
        const assistantMsgId = `msg_${Date.now()}_assistant`;
        await db.collection("opus_messages").doc(assistantMsgId).set({
          id: assistantMsgId,
          conversationId,
          role: "assistant",
          content: aiResponse.content,
          intent,
          suggestedActions,
          createdAt: now,
        });
      } catch (error) {
        console.error("Error persisting conversation:", error);
        // Don't fail the request if persistence fails
      }
    }

    // Return response
    const response: ChatResponse = {
      conversationId,
      response: aiResponse.content,
      intent,
      suggestedActions,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Opus chat error:", error);
    return res.status(500).json({
      error: "An unexpected error occurred",
      code: "INTERNAL_ERROR",
    });
  }
}
