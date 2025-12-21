// Smart Loop Prediction Engine
// Predicts which loop a task belongs to based on keywords, patterns, and history

import { LoopId, Task, ALL_LOOPS, LOOP_DEFINITIONS } from "../types";

// Keyword patterns for each loop with weights
const LOOP_KEYWORDS: Record<LoopId, { keywords: string[]; weight: number }[]> = {
  Health: [
    { keywords: ["workout", "exercise", "gym", "run", "jog", "walk", "yoga", "stretch", "lift", "cardio", "hiit", "crossfit", "swimming", "cycling", "bike"], weight: 1.0 },
    { keywords: ["meal", "cook", "food", "eat", "diet", "nutrition", "recipe", "breakfast", "lunch", "dinner", "snack", "prep", "grocery", "groceries"], weight: 0.9 },
    { keywords: ["sleep", "rest", "nap", "bed", "wake", "alarm", "insomnia", "melatonin"], weight: 0.9 },
    { keywords: ["doctor", "dentist", "appointment", "checkup", "physical", "therapy", "medication", "medicine", "prescription", "pill", "vitamin", "supplement"], weight: 1.0 },
    { keywords: ["mental", "meditation", "mindfulness", "therapy", "counseling", "stress", "anxiety", "depression", "journal", "breathe", "breathing"], weight: 0.8 },
    { keywords: ["weight", "bmi", "calories", "protein", "carbs", "fat", "macro", "hydrate", "water", "steps"], weight: 0.7 },
  ],
  Wealth: [
    { keywords: ["budget", "finance", "money", "bank", "account", "savings", "invest", "investment", "stock", "portfolio", "retirement", "401k", "ira", "roth"], weight: 1.0 },
    { keywords: ["bill", "pay", "payment", "invoice", "rent", "mortgage", "loan", "debt", "credit", "debit"], weight: 0.9 },
    { keywords: ["income", "salary", "paycheck", "bonus", "raise", "revenue", "profit", "expense", "cost"], weight: 0.9 },
    { keywords: ["tax", "taxes", "irs", "deduction", "refund", "cpa", "accountant", "audit"], weight: 1.0 },
    { keywords: ["insurance", "policy", "premium", "claim", "coverage"], weight: 0.8 },
    { keywords: ["crypto", "bitcoin", "ethereum", "trading", "forex", "dividend", "compound"], weight: 0.8 },
  ],
  Family: [
    { keywords: ["family", "spouse", "wife", "husband", "partner", "kid", "kids", "child", "children", "son", "daughter", "baby", "toddler"], weight: 1.0 },
    { keywords: ["parent", "parents", "mom", "dad", "mother", "father", "grandma", "grandpa", "grandparent", "sibling", "brother", "sister"], weight: 0.9 },
    { keywords: ["date", "date night", "anniversary", "birthday", "wedding", "celebration", "holiday"], weight: 0.8 },
    { keywords: ["school", "homework", "pickup", "dropoff", "daycare", "babysitter", "nanny", "pediatrician"], weight: 0.8 },
    { keywords: ["dinner together", "family time", "quality time", "movie night", "game night", "vacation", "trip"], weight: 0.7 },
    { keywords: ["pet", "dog", "cat", "vet", "walk the dog", "feed", "groom"], weight: 0.6 },
  ],
  Work: [
    { keywords: ["meeting", "call", "standup", "scrum", "sprint", "retro", "retrospective", "1:1", "one on one", "sync", "review"], weight: 1.0 },
    { keywords: ["project", "task", "deadline", "milestone", "deliverable", "launch", "release", "deploy", "ship"], weight: 0.9 },
    { keywords: ["email", "emails", "slack", "message", "respond", "reply", "follow up", "followup"], weight: 0.8 },
    { keywords: ["presentation", "present", "demo", "pitch", "proposal", "report", "document", "documentation"], weight: 0.9 },
    { keywords: ["code", "coding", "debug", "fix", "bug", "feature", "pr", "pull request", "merge", "commit", "push"], weight: 1.0 },
    { keywords: ["client", "customer", "stakeholder", "vendor", "partner", "contractor", "consultant"], weight: 0.8 },
    { keywords: ["interview", "hire", "hiring", "candidate", "onboard", "train", "training", "workshop"], weight: 0.7 },
    { keywords: ["career", "promotion", "review", "performance", "goal", "okr", "kpi", "metric"], weight: 0.7 },
    { keywords: ["learn", "course", "certification", "skill", "tutorial", "webinar", "conference"], weight: 0.6 },
  ],
  Fun: [
    { keywords: ["hobby", "game", "gaming", "play", "video game", "board game", "puzzle", "chess"], weight: 1.0 },
    { keywords: ["movie", "film", "tv", "show", "series", "netflix", "stream", "watch", "theater"], weight: 0.9 },
    { keywords: ["book", "read", "reading", "novel", "audiobook", "kindle", "library"], weight: 0.8 },
    { keywords: ["music", "listen", "concert", "album", "playlist", "spotify", "guitar", "piano", "instrument"], weight: 0.8 },
    { keywords: ["friend", "friends", "hang", "hangout", "party", "social", "drinks", "dinner out", "bar", "club"], weight: 0.9 },
    { keywords: ["travel", "trip", "vacation", "adventure", "explore", "hike", "hiking", "camping", "beach"], weight: 0.8 },
    { keywords: ["art", "draw", "drawing", "paint", "painting", "craft", "create", "creative", "photography", "photo"], weight: 0.8 },
    { keywords: ["sport", "sports", "basketball", "football", "soccer", "tennis", "golf", "baseball"], weight: 0.7 },
    { keywords: ["relax", "chill", "unwind", "fun", "enjoy", "leisure"], weight: 0.6 },
  ],
  Maintenance: [
    { keywords: ["clean", "cleaning", "tidy", "organize", "declutter", "dust", "vacuum", "mop", "sweep", "laundry", "dishes"], weight: 1.0 },
    { keywords: ["repair", "fix", "broken", "maintenance", "maintain", "replace", "install", "assemble"], weight: 0.9 },
    { keywords: ["car", "vehicle", "oil change", "tire", "mechanic", "service", "gas", "fuel", "wash"], weight: 0.9 },
    { keywords: ["home", "house", "apartment", "yard", "lawn", "garden", "garage", "basement", "attic"], weight: 0.7 },
    { keywords: ["errands", "errand", "post office", "pharmacy", "dry cleaner", "return", "pickup", "drop off"], weight: 0.8 },
    { keywords: ["shop", "shopping", "buy", "purchase", "order", "amazon", "target", "walmart", "costco"], weight: 0.7 },
    { keywords: ["admin", "paperwork", "form", "file", "organize", "sort", "shred", "recycle", "trash"], weight: 0.7 },
    { keywords: ["renew", "renewal", "license", "registration", "passport", "id", "dmv"], weight: 0.8 },
  ],
  Meaning: [
    { keywords: ["meditate", "meditation", "mindfulness", "mindful", "pray", "prayer", "spiritual", "spirit"], weight: 1.0 },
    { keywords: ["reflect", "reflection", "journal", "journaling", "gratitude", "grateful", "thankful"], weight: 0.9 },
    { keywords: ["purpose", "meaning", "why", "mission", "vision", "values", "principles"], weight: 0.8 },
    { keywords: ["volunteer", "donate", "charity", "give", "giving", "help", "community", "service"], weight: 0.8 },
    { keywords: ["philosophy", "book", "wisdom", "stoic", "stoicism", "buddhism", "tao", "zen"], weight: 0.7 },
    { keywords: ["church", "temple", "mosque", "synagogue", "worship", "faith", "religion", "religious"], weight: 0.9 },
    { keywords: ["self", "growth", "improve", "improvement", "development", "awareness", "consciousness"], weight: 0.6 },
    { keywords: ["legacy", "impact", "contribution", "future", "generations", "mentor", "mentoring"], weight: 0.7 },
  ],
};

// Time-based patterns (certain activities are more likely at certain times)
const TIME_PATTERNS: Record<string, { loops: LoopId[]; weight: number }> = {
  morning: { loops: ["Health", "Meaning"], weight: 0.3 },
  evening: { loops: ["Family", "Fun"], weight: 0.3 },
  weekend: { loops: ["Family", "Fun", "Maintenance"], weight: 0.3 },
  monday: { loops: ["Work"], weight: 0.2 },
};

export type LoopPrediction = {
  loop: LoopId;
  confidence: number; // 0-1
  matchedKeywords: string[];
};

export type PredictionResult = {
  predictions: LoopPrediction[];
  topPrediction: LoopPrediction | null;
};

// Normalize text for matching
function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

// Calculate keyword match score for a loop
function calculateKeywordScore(
  text: string,
  loopId: LoopId
): { score: number; matchedKeywords: string[] } {
  const normalizedText = normalizeText(text);
  const keywordGroups = LOOP_KEYWORDS[loopId];

  let totalScore = 0;
  const matchedKeywords: string[] = [];

  for (const group of keywordGroups) {
    for (const keyword of group.keywords) {
      // Check for exact word match or phrase match
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "i");
      if (regex.test(normalizedText)) {
        totalScore += group.weight;
        matchedKeywords.push(keyword);
      }
    }
  }

  return { score: totalScore, matchedKeywords };
}

// Calculate history-based score from past tasks
function calculateHistoryScore(
  text: string,
  loopId: LoopId,
  taskHistory: Task[]
): number {
  if (taskHistory.length === 0) return 0;

  const normalizedText = normalizeText(text);
  const words = normalizedText.split(/\s+/).filter((w) => w.length > 2);

  // Find similar tasks in history
  let similarTasksInLoop = 0;
  let totalSimilarTasks = 0;

  for (const task of taskHistory) {
    const taskWords = normalizeText(task.title).split(/\s+/).filter((w) => w.length > 2);
    const commonWords = words.filter((w) => taskWords.includes(w));

    if (commonWords.length > 0) {
      totalSimilarTasks++;
      if (task.loop === loopId) {
        similarTasksInLoop++;
      }
    }
  }

  if (totalSimilarTasks === 0) return 0;

  // Return the proportion of similar tasks that belong to this loop
  return (similarTasksInLoop / totalSimilarTasks) * 0.5; // Cap at 0.5
}

// Get time-based score
function getTimeScore(loopId: LoopId): number {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  let score = 0;

  // Morning (5am - 11am)
  if (hour >= 5 && hour < 11) {
    if (TIME_PATTERNS.morning.loops.includes(loopId)) {
      score += TIME_PATTERNS.morning.weight;
    }
  }

  // Evening (6pm - 10pm)
  if (hour >= 18 && hour < 22) {
    if (TIME_PATTERNS.evening.loops.includes(loopId)) {
      score += TIME_PATTERNS.evening.weight;
    }
  }

  // Weekend (Saturday or Sunday)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    if (TIME_PATTERNS.weekend.loops.includes(loopId)) {
      score += TIME_PATTERNS.weekend.weight;
    }
  }

  // Monday
  if (dayOfWeek === 1) {
    if (TIME_PATTERNS.monday.loops.includes(loopId)) {
      score += TIME_PATTERNS.monday.weight;
    }
  }

  return score;
}

// Main prediction function
export function predictLoop(
  taskText: string,
  taskHistory: Task[] = [],
  _currentLoop?: LoopId
): PredictionResult {
  if (!taskText.trim()) {
    return { predictions: [], topPrediction: null };
  }

  const predictions: LoopPrediction[] = [];

  for (const loopId of ALL_LOOPS) {
    const { score: keywordScore, matchedKeywords } = calculateKeywordScore(
      taskText,
      loopId
    );
    const historyScore = calculateHistoryScore(taskText, loopId, taskHistory);
    const timeScore = getTimeScore(loopId);

    // Combine scores with weights
    const totalScore = keywordScore * 0.7 + historyScore * 0.2 + timeScore * 0.1;

    if (totalScore > 0) {
      predictions.push({
        loop: loopId,
        confidence: Math.min(totalScore, 1), // Cap at 1
        matchedKeywords,
      });
    }
  }

  // Sort by confidence descending
  predictions.sort((a, b) => b.confidence - a.confidence);

  // Get top prediction (only if confidence is above threshold)
  const topPrediction = predictions.length > 0 && predictions[0].confidence >= 0.3
    ? predictions[0]
    : null;

  return {
    predictions: predictions.slice(0, 3), // Return top 3
    topPrediction,
  };
}

// Get loop suggestion with explanation
export function getLoopSuggestion(
  taskText: string,
  taskHistory: Task[] = []
): { loop: LoopId; confidence: number; reason: string } | null {
  const result = predictLoop(taskText, taskHistory);

  if (!result.topPrediction) {
    return null;
  }

  const { loop, confidence, matchedKeywords } = result.topPrediction;
  const loopDef = LOOP_DEFINITIONS[loop];

  let reason = "";
  if (matchedKeywords.length > 0) {
    reason = `Detected: ${matchedKeywords.slice(0, 3).join(", ")}`;
  } else {
    reason = loopDef.description;
  }

  return {
    loop,
    confidence,
    reason,
  };
}

// Quick categorize - returns the most likely loop or default
export function quickCategorize(
  taskText: string,
  defaultLoop: LoopId = "Work",
  taskHistory: Task[] = []
): LoopId {
  const result = predictLoop(taskText, taskHistory);
  return result.topPrediction?.loop || defaultLoop;
}
