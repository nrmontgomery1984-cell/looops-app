// Opus AI Assistant Layer - Firebase Firestore Data Layer
// Persists conversations, messages, briefings, reflections, and task timing

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { DayType } from "../../types/dayTypes";
import {
  OpusDomainId,
  OpusIntent,
  OpusSuggestedAction,
} from "../types/opus-types";

// ============================================================================
// COLLECTION NAMES
// ============================================================================

const COLLECTIONS = {
  CONVERSATIONS: "opus_conversations",
  MESSAGES: "opus_messages",
  BRIEFINGS: "opus_briefings",
  REFLECTIONS: "opus_reflections",
  TASK_TIMING: "task_timing",
} as const;

// ============================================================================
// TYPES - Firestore Document Schemas
// ============================================================================

/**
 * Opus conversation session
 */
export type OpusConversationDoc = {
  id: string;
  userId: string;
  domain: OpusDomainId;
  initiationType: "user" | "system-briefing" | "weekly-reflection";
  dayTypes: DayType[];
  startedAt: Timestamp;
  endedAt: Timestamp | null;
  messageCount: number;
  title?: string;
};

/**
 * Individual message in a conversation
 */
export type OpusMessageDoc = {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  intent?: OpusIntent;
  suggestedActions?: OpusSuggestedAction[];
  createdAt: Timestamp;
};

/**
 * Daily briefing record
 */
export type OpusBriefingDoc = {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  conversationId: string;
  dayTypes: DayType[];
  summary: string;
  focusAreas: string[];
  tasksHighlighted: number;
  routinesHighlighted: number;
  createdAt: Timestamp;
};

/**
 * Weekly reflection record
 */
export type OpusReflectionDoc = {
  id: string;
  userId: string;
  weekStartDate: string; // YYYY-MM-DD (Monday)
  weekEndDate: string; // YYYY-MM-DD (Sunday)
  conversationId: string;
  insights: string[];
  accomplishments: string[];
  improvements: string[];
  loopScores?: Partial<Record<string, number>>;
  createdAt: Timestamp;
};

/**
 * Task timing record for duration tracking
 */
export type TaskTimingDoc = {
  id: string;
  userId: string;
  taskId: string;
  startedAt: Timestamp;
  endedAt: Timestamp;
  durationSeconds: number;
  dayTypes: DayType[];
  energyLevel: number | null;
};

/**
 * Task timing statistics
 */
export type TaskTimingStats = {
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  count: number;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Remove undefined values from object (Firestore doesn't accept undefined)
 */
function cleanForFirestore<T extends object>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Timestamp)) {
        cleaned[key] = cleanForFirestore(value as object);
      } else if (Array.isArray(value)) {
        cleaned[key] = value.map((item) =>
          item !== null && typeof item === "object" && !(item instanceof Timestamp)
            ? cleanForFirestore(item)
            : item
        );
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned as T;
}

/**
 * Generate a unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Convert Firestore doc to typed object
 */
function docToTyped<T>(doc: DocumentData, id: string): T {
  return { ...doc, id } as T;
}

/**
 * Check if Firebase is available
 */
function checkDb(): boolean {
  if (!db) {
    console.warn("[Opus Firestore] Database not available");
    return false;
  }
  return true;
}

// ============================================================================
// CONVERSATIONS CRUD
// ============================================================================

/**
 * Persist a new conversation to Firestore
 */
export async function persistConversation(
  data: Omit<OpusConversationDoc, "id" | "startedAt" | "endedAt" | "messageCount">
): Promise<OpusConversationDoc | null> {
  if (!checkDb()) return null;

  try {
    const id = generateId("conv");
    const conversationDoc: OpusConversationDoc = {
      ...data,
      id,
      startedAt: Timestamp.now(),
      endedAt: null,
      messageCount: 0,
    };

    const docRef = doc(db, COLLECTIONS.CONVERSATIONS, id);
    await setDoc(docRef, cleanForFirestore(conversationDoc));

    console.log("[Opus Firestore] Created conversation:", id);
    return conversationDoc;
  } catch (error) {
    console.error("[Opus Firestore] Failed to create conversation:", error);
    return null;
  }
}

/**
 * Get a conversation by ID
 */
export async function getConversation(
  conversationId: string
): Promise<OpusConversationDoc | null> {
  if (!checkDb()) return null;

  try {
    const docRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docToTyped<OpusConversationDoc>(docSnap.data(), conversationId);
    }
    return null;
  } catch (error) {
    console.error("[Opus Firestore] Failed to get conversation:", error);
    return null;
  }
}

/**
 * Get recent conversations for a user
 */
export async function getRecentConversations(
  userId: string,
  domain?: OpusDomainId,
  maxResults: number = 20
): Promise<OpusConversationDoc[]> {
  if (!checkDb()) return [];

  try {
    const constraints: QueryConstraint[] = [
      where("userId", "==", userId),
      orderBy("startedAt", "desc"),
      limit(maxResults),
    ];

    if (domain) {
      constraints.splice(1, 0, where("domain", "==", domain));
    }

    const q = query(collection(db, COLLECTIONS.CONVERSATIONS), ...constraints);
    const querySnapshot = await getDocs(q);

    const conversations: OpusConversationDoc[] = [];
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      conversations.push(docToTyped<OpusConversationDoc>(docSnap.data(), docSnap.id));
    });

    return conversations;
  } catch (error) {
    console.error("[Opus Firestore] Failed to get recent conversations:", error);
    return [];
  }
}

/**
 * Update conversation (e.g., end it, update message count)
 */
export async function updateConversation(
  conversationId: string,
  updates: Partial<Pick<OpusConversationDoc, "endedAt" | "messageCount" | "title">>
): Promise<boolean> {
  if (!checkDb()) return false;

  try {
    const docRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId);
    await updateDoc(docRef, cleanForFirestore(updates));
    return true;
  } catch (error) {
    console.error("[Opus Firestore] Failed to update conversation:", error);
    return false;
  }
}

/**
 * End a conversation
 */
export async function endConversation(conversationId: string): Promise<boolean> {
  return updateConversation(conversationId, { endedAt: Timestamp.now() });
}

// ============================================================================
// MESSAGES CRUD
// ============================================================================

/**
 * Add a message to a conversation
 */
export async function addMessage(
  data: Omit<OpusMessageDoc, "id" | "createdAt">
): Promise<OpusMessageDoc | null> {
  if (!checkDb()) return null;

  try {
    const id = generateId("msg");
    const messageDoc: OpusMessageDoc = {
      ...data,
      id,
      createdAt: Timestamp.now(),
    };

    const docRef = doc(db, COLLECTIONS.MESSAGES, id);
    await setDoc(docRef, cleanForFirestore(messageDoc));

    // Update conversation message count
    const conversation = await getConversation(data.conversationId);
    if (conversation) {
      await updateConversation(data.conversationId, {
        messageCount: conversation.messageCount + 1,
      });
    }

    console.log("[Opus Firestore] Added message:", id);
    return messageDoc;
  } catch (error) {
    console.error("[Opus Firestore] Failed to add message:", error);
    return null;
  }
}

/**
 * Get all messages for a conversation
 */
export async function getMessages(
  conversationId: string
): Promise<OpusMessageDoc[]> {
  if (!checkDb()) return [];

  try {
    const q = query(
      collection(db, COLLECTIONS.MESSAGES),
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "asc")
    );
    const querySnapshot = await getDocs(q);

    const messages: OpusMessageDoc[] = [];
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      messages.push(docToTyped<OpusMessageDoc>(docSnap.data(), docSnap.id));
    });

    return messages;
  } catch (error) {
    console.error("[Opus Firestore] Failed to get messages:", error);
    return [];
  }
}

// ============================================================================
// BRIEFINGS CRUD
// ============================================================================

/**
 * Save a daily briefing
 */
export async function saveBriefing(
  data: Omit<OpusBriefingDoc, "id" | "createdAt">
): Promise<OpusBriefingDoc | null> {
  if (!checkDb()) return null;

  try {
    const id = generateId("brief");
    const briefingDoc: OpusBriefingDoc = {
      ...data,
      id,
      createdAt: Timestamp.now(),
    };

    const docRef = doc(db, COLLECTIONS.BRIEFINGS, id);
    await setDoc(docRef, cleanForFirestore(briefingDoc));

    console.log("[Opus Firestore] Saved briefing:", id);
    return briefingDoc;
  } catch (error) {
    console.error("[Opus Firestore] Failed to save briefing:", error);
    return null;
  }
}

/**
 * Get today's briefing for a user
 */
export async function getTodaysBriefing(
  userId: string
): Promise<OpusBriefingDoc | null> {
  if (!checkDb()) return null;

  try {
    const today = new Date().toISOString().split("T")[0];

    const q = query(
      collection(db, COLLECTIONS.BRIEFINGS),
      where("userId", "==", userId),
      where("date", "==", today),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return docToTyped<OpusBriefingDoc>(docSnap.data(), docSnap.id);
    }
    return null;
  } catch (error) {
    console.error("[Opus Firestore] Failed to get today's briefing:", error);
    return null;
  }
}

/**
 * Get recent briefings for a user
 */
export async function getRecentBriefings(
  userId: string,
  maxResults: number = 7
): Promise<OpusBriefingDoc[]> {
  if (!checkDb()) return [];

  try {
    const q = query(
      collection(db, COLLECTIONS.BRIEFINGS),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(maxResults)
    );
    const querySnapshot = await getDocs(q);

    const briefings: OpusBriefingDoc[] = [];
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      briefings.push(docToTyped<OpusBriefingDoc>(docSnap.data(), docSnap.id));
    });

    return briefings;
  } catch (error) {
    console.error("[Opus Firestore] Failed to get recent briefings:", error);
    return [];
  }
}

// ============================================================================
// REFLECTIONS CRUD
// ============================================================================

/**
 * Save a weekly reflection
 */
export async function saveReflection(
  data: Omit<OpusReflectionDoc, "id" | "createdAt">
): Promise<OpusReflectionDoc | null> {
  if (!checkDb()) return null;

  try {
    const id = generateId("refl");
    const reflectionDoc: OpusReflectionDoc = {
      ...data,
      id,
      createdAt: Timestamp.now(),
    };

    const docRef = doc(db, COLLECTIONS.REFLECTIONS, id);
    await setDoc(docRef, cleanForFirestore(reflectionDoc));

    console.log("[Opus Firestore] Saved reflection:", id);
    return reflectionDoc;
  } catch (error) {
    console.error("[Opus Firestore] Failed to save reflection:", error);
    return null;
  }
}

/**
 * Get recent reflections for a user
 */
export async function getRecentReflections(
  userId: string,
  maxResults: number = 4
): Promise<OpusReflectionDoc[]> {
  if (!checkDb()) return [];

  try {
    const q = query(
      collection(db, COLLECTIONS.REFLECTIONS),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(maxResults)
    );
    const querySnapshot = await getDocs(q);

    const reflections: OpusReflectionDoc[] = [];
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      reflections.push(docToTyped<OpusReflectionDoc>(docSnap.data(), docSnap.id));
    });

    return reflections;
  } catch (error) {
    console.error("[Opus Firestore] Failed to get recent reflections:", error);
    return [];
  }
}

/**
 * Get reflection for a specific week
 */
export async function getWeekReflection(
  userId: string,
  weekStartDate: string
): Promise<OpusReflectionDoc | null> {
  if (!checkDb()) return null;

  try {
    const q = query(
      collection(db, COLLECTIONS.REFLECTIONS),
      where("userId", "==", userId),
      where("weekStartDate", "==", weekStartDate),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return docToTyped<OpusReflectionDoc>(docSnap.data(), docSnap.id);
    }
    return null;
  } catch (error) {
    console.error("[Opus Firestore] Failed to get week reflection:", error);
    return null;
  }
}

// ============================================================================
// TASK TIMING CRUD
// ============================================================================

/**
 * Save a task timing record
 */
export async function saveTaskTiming(
  data: Omit<TaskTimingDoc, "id">
): Promise<TaskTimingDoc | null> {
  if (!checkDb()) return null;

  try {
    const id = generateId("timing");
    const timingDoc: TaskTimingDoc = {
      ...data,
      id,
    };

    const docRef = doc(db, COLLECTIONS.TASK_TIMING, id);
    await setDoc(docRef, cleanForFirestore(timingDoc));

    console.log("[Opus Firestore] Saved task timing:", id);
    return timingDoc;
  } catch (error) {
    console.error("[Opus Firestore] Failed to save task timing:", error);
    return null;
  }
}

/**
 * Get timing records for a specific task
 */
export async function getTaskTimings(
  taskId: string
): Promise<TaskTimingDoc[]> {
  if (!checkDb()) return [];

  try {
    const q = query(
      collection(db, COLLECTIONS.TASK_TIMING),
      where("taskId", "==", taskId),
      orderBy("startedAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const timings: TaskTimingDoc[] = [];
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      timings.push(docToTyped<TaskTimingDoc>(docSnap.data(), docSnap.id));
    });

    return timings;
  } catch (error) {
    console.error("[Opus Firestore] Failed to get task timings:", error);
    return [];
  }
}

/**
 * Get timing statistics for a task
 */
export async function getTaskTimingStats(
  taskId: string
): Promise<TaskTimingStats | null> {
  const timings = await getTaskTimings(taskId);

  if (timings.length === 0) {
    return null;
  }

  const durations = timings.map((t) => t.durationSeconds);
  const sum = durations.reduce((a, b) => a + b, 0);

  return {
    avgDuration: Math.round(sum / durations.length),
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    count: durations.length,
  };
}

/**
 * Get all task timings for a user
 */
export async function getUserTaskTimings(
  userId: string,
  maxResults: number = 100
): Promise<TaskTimingDoc[]> {
  if (!checkDb()) return [];

  try {
    const q = query(
      collection(db, COLLECTIONS.TASK_TIMING),
      where("userId", "==", userId),
      orderBy("startedAt", "desc"),
      limit(maxResults)
    );
    const querySnapshot = await getDocs(q);

    const timings: TaskTimingDoc[] = [];
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      timings.push(docToTyped<TaskTimingDoc>(docSnap.data(), docSnap.id));
    });

    return timings;
  } catch (error) {
    console.error("[Opus Firestore] Failed to get user task timings:", error);
    return [];
  }
}

/**
 * Get task timings by day type
 */
export async function getTaskTimingsByDayType(
  userId: string,
  dayType: DayType
): Promise<TaskTimingDoc[]> {
  if (!checkDb()) return [];

  try {
    const q = query(
      collection(db, COLLECTIONS.TASK_TIMING),
      where("userId", "==", userId),
      where("dayTypes", "array-contains", dayType),
      orderBy("startedAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const timings: TaskTimingDoc[] = [];
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      timings.push(docToTyped<TaskTimingDoc>(docSnap.data(), docSnap.id));
    });

    return timings;
  } catch (error) {
    console.error("[Opus Firestore] Failed to get timings by day type:", error);
    return [];
  }
}

// ============================================================================
// AGGREGATE STATISTICS
// ============================================================================

/**
 * Get conversation statistics for a user
 */
export async function getConversationStats(userId: string): Promise<{
  totalConversations: number;
  totalMessages: number;
  byDomain: Partial<Record<OpusDomainId, number>>;
  byInitiationType: Record<string, number>;
}> {
  const conversations = await getRecentConversations(userId, undefined, 1000);

  const stats = {
    totalConversations: conversations.length,
    totalMessages: conversations.reduce((sum, c) => sum + c.messageCount, 0),
    byDomain: {} as Partial<Record<OpusDomainId, number>>,
    byInitiationType: {} as Record<string, number>,
  };

  for (const conv of conversations) {
    stats.byDomain[conv.domain] = (stats.byDomain[conv.domain] || 0) + 1;
    stats.byInitiationType[conv.initiationType] =
      (stats.byInitiationType[conv.initiationType] || 0) + 1;
  }

  return stats;
}

/**
 * Get timing statistics aggregated by task
 */
export async function getAggregateTimingStats(
  userId: string
): Promise<Map<string, TaskTimingStats>> {
  const timings = await getUserTaskTimings(userId, 500);

  // Group by taskId
  const byTask = new Map<string, TaskTimingDoc[]>();
  for (const timing of timings) {
    const existing = byTask.get(timing.taskId) || [];
    existing.push(timing);
    byTask.set(timing.taskId, existing);
  }

  // Calculate stats for each task
  const stats = new Map<string, TaskTimingStats>();
  for (const [taskId, taskTimings] of byTask) {
    const durations = taskTimings.map((t) => t.durationSeconds);
    const sum = durations.reduce((a, b) => a + b, 0);

    stats.set(taskId, {
      avgDuration: Math.round(sum / durations.length),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      count: durations.length,
    });
  }

  return stats;
}

// ============================================================================
// HELPER: Start/Stop Task Timer
// ============================================================================

// In-memory timer storage (for active timers)
const activeTimers = new Map<
  string,
  { userId: string; taskId: string; startedAt: Date; dayTypes: DayType[] }
>();

/**
 * Start timing a task
 */
export function startTaskTimer(
  userId: string,
  taskId: string,
  dayTypes: DayType[]
): string {
  const timerId = generateId("timer");
  activeTimers.set(timerId, {
    userId,
    taskId,
    startedAt: new Date(),
    dayTypes,
  });
  console.log("[Opus Firestore] Started timer:", timerId, "for task:", taskId);
  return timerId;
}

/**
 * Stop timing a task and save the record
 */
export async function stopTaskTimer(
  timerId: string,
  energyLevel: number | null = null
): Promise<TaskTimingDoc | null> {
  const timer = activeTimers.get(timerId);
  if (!timer) {
    console.warn("[Opus Firestore] Timer not found:", timerId);
    return null;
  }

  const endedAt = new Date();
  const durationSeconds = Math.round(
    (endedAt.getTime() - timer.startedAt.getTime()) / 1000
  );

  activeTimers.delete(timerId);

  return saveTaskTiming({
    userId: timer.userId,
    taskId: timer.taskId,
    startedAt: Timestamp.fromDate(timer.startedAt),
    endedAt: Timestamp.fromDate(endedAt),
    durationSeconds,
    dayTypes: timer.dayTypes,
    energyLevel,
  });
}

/**
 * Get active timer for a task (if any)
 */
export function getActiveTimer(
  taskId: string
): { timerId: string; startedAt: Date } | null {
  for (const [timerId, timer] of activeTimers) {
    if (timer.taskId === taskId) {
      return { timerId, startedAt: timer.startedAt };
    }
  }
  return null;
}

/**
 * Cancel an active timer without saving
 */
export function cancelTaskTimer(timerId: string): boolean {
  const deleted = activeTimers.delete(timerId);
  if (deleted) {
    console.log("[Opus Firestore] Cancelled timer:", timerId);
  }
  return deleted;
}
