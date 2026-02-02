// Vercel Serverless Function - Opus Chat Streaming API
// Handles streaming chat interactions with Opus AI assistant using Server-Sent Events

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// ============================================================================
// TYPES
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
  healthData?: {
    steps?: number;
    sleepHours?: number;
    sleepScore?: number;
    activeMinutes?: number;
    restingHeartRate?: number;
    caloriesBurned?: number;
  };
  archetypeBlend?: {
    primary: string;
    secondary: string;
  };
}

// Routine cue types for briefings
type RoutineCueType = "morning" | "end_of_workday" | "end_of_day";

interface RoutineContext {
  cueType: RoutineCueType;
  p1Tasks: Array<{
    title: string;
    loop: string;
    dueDate?: string;
    isOverdue: boolean;
  }>;
  todayTasks: Array<{
    title: string;
    loop: string;
    priority: number;
  }>;
  calendarEvents?: Array<{
    title: string;
    time: string;
  }>;
}

interface StreamRequest {
  userId: string;
  domain: OpusDomainId;
  message: string;
  conversationId?: string;
  healthData?: {
    steps?: number;
    sleepHours?: number;
    sleepScore?: number;
    activeMinutes?: number;
    restingHeartRate?: number;
    caloriesBurned?: number;
  };
  routineContext?: RoutineContext;
}

// SSE Event types
type SSEEventType = "token" | "done" | "error";

interface SSETokenEvent {
  type: "token";
  content: string;
}

interface SSEDoneEvent {
  type: "done";
  content: string;
  conversationId: string;
  intent: OpusIntent;
  suggestedActions: OpusSuggestedAction[];
}

interface SSEErrorEvent {
  type: "error";
  content: string;
  code?: string;
}

type SSEEvent = SSETokenEvent | SSEDoneEvent | SSEErrorEvent;

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
// ROUTINE BRIEFING PROMPT GENERATION
// ============================================================================

function generateRoutineBriefingPrompt(routineContext: RoutineContext): string {
  const parts: string[] = [];
  const { cueType, p1Tasks, todayTasks, calendarEvents } = routineContext;

  if (cueType === "morning") {
    parts.push("## ROUTINE BRIEFING: Good Morning");
    parts.push("The user is starting their day. Provide a concise morning briefing that includes:");
    parts.push("1. A brief personalized greeting");
    parts.push("2. Sleep/readiness summary (if health data available)");
    parts.push("3. P1 (urgent) tasks that need attention");
    parts.push("4. Tasks due today");
    parts.push("5. Any calendar events (if available)");
    parts.push("");
    parts.push("Keep it energizing and action-oriented. Format as a quick briefing, not a long essay.");
  } else if (cueType === "end_of_workday") {
    parts.push("## ROUTINE BRIEFING: End of Workday");
    parts.push("The user is wrapping up their workday. Provide a transition briefing:");
    parts.push("1. Acknowledge the work done");
    parts.push("2. Highlight any remaining P1 tasks that can wait until tomorrow");
    parts.push("3. Suggest transition to personal time");
    parts.push("");
    parts.push("Help them mentally transition from work mode. Keep it brief and supportive.");
  } else if (cueType === "end_of_day") {
    parts.push("## ROUTINE BRIEFING: End of Day");
    parts.push("The user is winding down for the night. Provide a calming end-of-day briefing:");
    parts.push("1. Brief acknowledgment of the day");
    parts.push("2. Preview of tomorrow's P1 tasks (so they can rest knowing what's ahead)");
    parts.push("3. A calming sign-off");
    parts.push("");
    parts.push("Keep it peaceful and reassuring. Don't overwhelm with tasks.");
  }

  // Add task context
  parts.push("");
  parts.push("## Tasks Context");

  if (p1Tasks.length > 0) {
    parts.push(`P1 (Urgent) Tasks (${p1Tasks.length}):`);
    p1Tasks.forEach((task, i) => {
      const overdue = task.isOverdue ? " [OVERDUE]" : "";
      const due = task.dueDate ? ` (due: ${task.dueDate})` : "";
      parts.push(`  ${i + 1}. ${task.title} [${task.loop}]${due}${overdue}`);
    });
  } else {
    parts.push("P1 Tasks: None - great job staying on top of urgent items!");
  }

  if (todayTasks.length > 0) {
    parts.push(`Tasks Due Today (${todayTasks.length}):`);
    todayTasks.forEach((task, i) => {
      const priority = task.priority === 1 ? "P1" : task.priority === 2 ? "P2" : task.priority === 3 ? "P3" : "P4";
      parts.push(`  ${i + 1}. ${task.title} [${task.loop}] - ${priority}`);
    });
  } else {
    parts.push("Tasks Due Today: None scheduled");
  }

  if (calendarEvents && calendarEvents.length > 0) {
    parts.push(`Calendar Events:`);
    calendarEvents.forEach((event, i) => {
      parts.push(`  ${i + 1}. ${event.time} - ${event.title}`);
    });
  }

  return parts.join("\n");
}

// ============================================================================
// SYSTEM PROMPT GENERATION
// ============================================================================

function generateSystemPrompt(
  domain: OpusDomainId,
  context: OpusContextSnapshot,
  archetype?: string,
  routineContext?: RoutineContext
): string {
  const config = DOMAIN_CONFIGS[domain];
  const parts: string[] = [];

  parts.push(`You are ${config.name}, an AI assistant within the Looops Personal Operating System.`);
  parts.push("");

  if (archetype) {
    parts.push(`## User Profile`);
    parts.push(`- Primary archetype: ${archetype}`);
    parts.push(`- Communication style: Match their archetype preferences`);
    parts.push("");
  }

  parts.push("## Your Expertise");
  config.expertise.forEach(e => parts.push(`- ${e}`));
  parts.push("");

  parts.push("## Current Context");
  parts.push(`- Day type(s): ${context.dayTypes.join(", ") || "regular"}`);

  if (Object.keys(context.loopStates).length > 0) {
    parts.push("- Loop states:");
    Object.entries(context.loopStates).forEach(([loop, state]) => {
      parts.push(`  - ${loop}: ${state.state} (${state.currentLoad}/${state.maxTasks} tasks)`);
    });
  }

  if (context.healthData) {
    const h = context.healthData as any;
    parts.push("- Health data (from Fitbit):");
    if (h.steps !== undefined) parts.push(`  - Steps today: ${h.steps}`);
    if (h.sleepHours !== undefined) parts.push(`  - Sleep: ${h.sleepHours}h`);
    if (h.sleepScore !== undefined) parts.push(`  - Sleep score: ${h.sleepScore}/100`);
    if (h.activeMinutes !== undefined) parts.push(`  - Active minutes: ${h.activeMinutes}`);
    if (h.restingHeartRate !== undefined) parts.push(`  - Resting heart rate: ${h.restingHeartRate} bpm`);
    if (h.caloriesBurned !== undefined) parts.push(`  - Calories burned: ${h.caloriesBurned}`);
  }
  parts.push("");

  parts.push("## Response Guidelines");
  parts.push(`- Push level: ${config.pushLevel}`);

  // Adjust guidelines based on routine cue
  if (routineContext) {
    parts.push("- This is a ROUTINE BRIEFING request - provide a structured briefing");
    parts.push("- Be concise but include all relevant information from the task context");
    parts.push("- Use a warm, butler-like tone (think Alfred or Jarvis)");
  } else {
    parts.push("- CRITICAL: Keep initial responses to ONE SENTENCE or less whenever possible");
    parts.push("- Only elaborate with details if the user asks for more information");
  }
  parts.push("- Be direct and actionable - no preamble or filler");
  parts.push("- Match the user's communication style");
  parts.push("- Do not use emojis unless the user does");

  // Add routine briefing context if present
  if (routineContext) {
    parts.push("");
    parts.push(generateRoutineBriefingPrompt(routineContext));
  }

  return parts.join("\n");
}

// ============================================================================
// INTENT DETECTION
// ============================================================================

function detectIntent(message: string): OpusIntent {
  const lowerMessage = message.toLowerCase();

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
// SSE HELPERS
// ============================================================================

function sendSSE(res: VercelResponse, event: SSEEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

// ============================================================================
// CLAUDE STREAMING API
// ============================================================================

async function* streamClaudeAPI(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string
): AsyncGenerator<string> {
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
      stream: true,
      system: systemPrompt,
      messages: [...messages, { role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body reader available");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE events from Claude
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const event = JSON.parse(data);
          if (event.type === "content_block_delta" && event.delta?.text) {
            yield event.delta.text;
          }
        } catch {
          // Ignore parse errors for incomplete chunks
        }
      }
    }
  }
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

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const body = req.body as StreamRequest;

    // Validate request
    if (!body.userId || !body.message) {
      sendSSE(res, {
        type: "error",
        content: "Missing required fields: userId and message are required",
        code: "VALIDATION_ERROR",
      });
      return res.end();
    }

    if (!body.domain || !ALL_OPUS_DOMAINS.includes(body.domain)) {
      sendSSE(res, {
        type: "error",
        content: `Invalid domain. Must be one of: ${ALL_OPUS_DOMAINS.join(", ")}`,
        code: "INVALID_DOMAIN",
      });
      return res.end();
    }

    // Initialize Firebase Admin
    let db;
    try {
      db = initFirebaseAdmin();
    } catch (error) {
      console.error("Firebase init error:", error);
      db = null;
    }

    // Load user prototype
    let userPrototype: any = null;
    let loopStates: any = {};

    if (db) {
      try {
        console.log("[Opus API] Looking up user:", body.userId);
        const userDoc = await db.collection("users").doc(body.userId).get();
        console.log("[Opus API] Document exists:", userDoc.exists);
        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log("[Opus API] Document keys:", Object.keys(userData || {}));
          console.log("[Opus API] Has user.prototype:", !!userData?.user?.prototype);
          console.log("[Opus API] Has root prototype:", !!userData?.prototype);
          // App stores at user.prototype, not root prototype
          userPrototype = userData?.user?.prototype || userData?.prototype || null;
          // App stores at loops.states, not loopStates
          loopStates = userData?.loops?.states || userData?.loopStates || {};
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    } else {
      console.log("[Opus API] No database connection");
    }

    if (!userPrototype) {
      console.log("[Opus API] No prototype found for user:", body.userId);
      // Get more debug info
      let debugInfo = `User: ${body.userId?.substring(0, 8)}... DB: ${db ? 'connected' : 'not connected'}`;
      if (db) {
        try {
          const userDoc = await db.collection("users").doc(body.userId).get();
          if (userDoc.exists) {
            const data = userDoc.data();
            const keys = Object.keys(data || {});
            debugInfo += ` | Doc exists, keys: [${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}]`;
            debugInfo += ` | user?: ${!!data?.user} | user.prototype?: ${!!data?.user?.prototype}`;
          } else {
            debugInfo += ' | Doc does NOT exist';
          }
        } catch (e) {
          debugInfo += ` | Debug error: ${e}`;
        }
      }
      sendSSE(res, {
        type: "error",
        content: `No user data found. ${debugInfo}`,
        code: "ONBOARDING_REQUIRED",
      });
      return res.end();
    }

    // Build context
    const context: OpusContextSnapshot = {
      snapshotAt: new Date().toISOString(),
      dayTypes: ["regular"],
      loopStates: {},
      archetypeBlend: userPrototype.archetypeBlend
        ? {
            primary: userPrototype.archetypeBlend.primary,
            secondary: userPrototype.archetypeBlend.secondary,
          }
        : undefined,
      // Include health data from request if provided
      healthData: body.healthData ? {
        steps: body.healthData.steps,
        sleepHours: body.healthData.sleepHours,
        sleepScore: body.healthData.sleepScore,
        activeMinutes: body.healthData.activeMinutes,
        restingHeartRate: body.healthData.restingHeartRate,
        caloriesBurned: body.healthData.caloriesBurned,
      } : undefined,
    };

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

    // Load conversation history
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

    // Generate system prompt (include routine context if this is a briefing request)
    const systemPrompt = generateSystemPrompt(
      body.domain,
      context,
      userPrototype.archetypeBlend?.primary,
      body.routineContext
    );

    // Detect intent early
    const intent = detectIntent(body.message);

    // Stream response from Claude
    const chunks: string[] = [];

    try {
      for await (const chunk of streamClaudeAPI(systemPrompt, conversationHistory, body.message)) {
        chunks.push(chunk);
        sendSSE(res, { type: "token", content: chunk });
      }
    } catch (error) {
      console.error("Claude streaming error:", error);
      sendSSE(res, {
        type: "error",
        content: "I'm having trouble thinking. Try again?",
        code: "AI_ERROR",
      });
      return res.end();
    }

    // Build full response
    const fullContent = chunks.join("");
    const suggestedActions = generateSuggestedActions(intent, fullContent);

    // Create conversation ID if new
    if (!conversationId) {
      conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    // Persist to Firebase
    if (db) {
      try {
        const now = Timestamp.now();

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

        const userMsgId = `msg_${Date.now()}_user`;
        await db.collection("opus_messages").doc(userMsgId).set({
          id: userMsgId,
          conversationId,
          role: "user",
          content: body.message,
          createdAt: now,
        });

        const assistantMsgId = `msg_${Date.now()}_assistant`;
        await db.collection("opus_messages").doc(assistantMsgId).set({
          id: assistantMsgId,
          conversationId,
          role: "assistant",
          content: fullContent,
          intent,
          suggestedActions,
          createdAt: now,
        });
      } catch (error) {
        console.error("Error persisting conversation:", error);
      }
    }

    // Send done event with full response
    sendSSE(res, {
      type: "done",
      content: fullContent,
      conversationId,
      intent,
      suggestedActions,
    });

    return res.end();
  } catch (error) {
    console.error("Opus stream error:", error);
    sendSSE(res, {
      type: "error",
      content: "An unexpected error occurred",
      code: "INTERNAL_ERROR",
    });
    return res.end();
  }
}
