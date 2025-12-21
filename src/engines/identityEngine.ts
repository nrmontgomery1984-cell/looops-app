// Identity Engine - Archetype calculation and task framing

import {
  UserTraits,
  UserPrototype,
  ArchetypeBlend,
  VoiceProfile,
  ArchetypeId,
  Task,
  TaskFraming,
} from "../types";
import {
  calculateArchetypeBlend,
  getVoiceProfile,
  ARCHETYPE_DEFINITIONS,
} from "../data/archetypes";
import { getInspirationsByIds } from "../data/inspirations";

// Generate a complete user prototype
export function generatePrototype(
  userId: string,
  traits: UserTraits,
  selectedValueIds: string[],
  selectedInspirationIds: string[],
  futureSelf?: string
): UserPrototype {
  // Get inspiration trait profiles
  const inspirations = getInspirationsByIds(selectedInspirationIds);
  const inspirationTraits = inspirations
    .map((i) => i.traits)
    .filter((t): t is UserTraits => Object.keys(t).length > 10);

  // Calculate archetype blend
  const archetypeBlend = calculateArchetypeBlend(
    traits,
    selectedValueIds,
    inspirationTraits
  );

  // Generate voice profile from primary archetype
  const voiceProfile = generateVoiceProfile(archetypeBlend);

  return {
    id: `prototype_${Date.now()}`,
    userId,
    traits,
    values: {
      selectedIds: selectedValueIds,
      selectedAt: new Date().toISOString(),
    },
    inspirations: {
      selectedIds: selectedInspirationIds,
      selectedAt: new Date().toISOString(),
    },
    archetypeBlend,
    voiceProfile,
    futureSelf,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Generate voice profile from archetype blend
export function generateVoiceProfile(blend: ArchetypeBlend): VoiceProfile {
  const primary = getVoiceProfile(blend.primary);
  const secondary = getVoiceProfile(blend.secondary);

  // Merge voice profiles with primary dominance
  const examplePhrases = [
    ...primary.examplePhrases.slice(0, 2),
    ...secondary.examplePhrases.slice(0, 1),
  ];

  return {
    tone: primary.tone,
    motivationStyle: primary.motivationStyle,
    detailLevel: primary.detailLevel,
    timeOrientation: primary.timeOrientation,
    examplePhrases,
  };
}

// Frame a task based on archetype
export function frameTask(task: Task, archetypeId: ArchetypeId): TaskFraming {
  const archetype = ARCHETYPE_DEFINITIONS.find((a) => a.id === archetypeId);
  if (!archetype) {
    return {
      archetypeId,
      framedTitle: task.title,
      framedDescription: task.description,
    };
  }

  const voice = archetype.voiceProfile;

  // Generate framed title based on voice tone
  let framedTitle = task.title;
  let motivationalNote = "";

  switch (voice.tone) {
    case "direct":
      framedTitle = task.title.replace(/^(Schedule|Plan|Review)/, "Execute:");
      motivationalNote = voice.examplePhrases[0] || "Get it done.";
      break;

    case "warm":
      framedTitle = `Take time to: ${task.title.toLowerCase()}`;
      motivationalNote = "You've got this. One step at a time.";
      break;

    case "philosophical":
      framedTitle = task.title;
      motivationalNote = "This too is part of the journey.";
      break;

    case "energetic":
      framedTitle = `${task.title}!`;
      motivationalNote = "Let's make it happen!";
      break;

    case "analytical":
      framedTitle = `Task: ${task.title}`;
      motivationalNote = "Systematic progress leads to results.";
      break;
  }

  // Add motivation style flavor
  switch (voice.motivationStyle) {
    case "challenge":
      motivationalNote = `Challenge: ${motivationalNote}`;
      break;
    case "discipline":
      motivationalNote = `Discipline moment: ${motivationalNote}`;
      break;
    case "logic":
      motivationalNote = `Rationale: ${motivationalNote}`;
      break;
    case "inspiration":
      motivationalNote = `Inspiration: ${motivationalNote}`;
      break;
    case "support":
      motivationalNote = `Remember: ${motivationalNote}`;
      break;
  }

  return {
    archetypeId,
    framedTitle,
    framedDescription: task.description,
    motivationalNote,
  };
}

// Frame multiple tasks
export function frameTasks(tasks: Task[], archetypeId: ArchetypeId): Task[] {
  return tasks.map((task) => ({
    ...task,
    framing: frameTask(task, archetypeId),
  }));
}

// Get archetype-specific greeting
export function getArchetypeGreeting(
  archetypeId: ArchetypeId,
  userName: string,
  timeOfDay: "morning" | "afternoon" | "evening"
): string {
  const archetype = ARCHETYPE_DEFINITIONS.find((a) => a.id === archetypeId);
  if (!archetype) return `Good ${timeOfDay}, ${userName}`;

  const greetings: Record<ArchetypeId, Record<string, string>> = {
    Machine: {
      morning: `${userName}. New day. New opportunities to execute.`,
      afternoon: `${userName}. Halfway through. Stay on target.`,
      evening: `${userName}. Final push. Finish strong.`,
    },
    Warrior: {
      morning: `Rise, ${userName}. The battle begins.`,
      afternoon: `${userName}. The fight continues.`,
      evening: `${userName}. One more round.`,
    },
    Artist: {
      morning: `Good morning, ${userName}. What will you create today?`,
      afternoon: `${userName}, the afternoon light awaits your work.`,
      evening: `${userName}, let the evening inspire reflection.`,
    },
    Scientist: {
      morning: `${userName}. Day ${new Date().getDate()}. Begin observations.`,
      afternoon: `${userName}. Midday analysis point.`,
      evening: `${userName}. Time to review today's data.`,
    },
    Stoic: {
      morning: `${userName}. Another day to practice virtue.`,
      afternoon: `${userName}. The present moment is all we have.`,
      evening: `${userName}. Reflect on what was within your control.`,
    },
    Visionary: {
      morning: `${userName}! A new day to build the future.`,
      afternoon: `${userName}, the vision is taking shape.`,
      evening: `${userName}, dream bigger tomorrow.`,
    },
  };

  return greetings[archetypeId][timeOfDay];
}

// Get motivational message based on completion rate
export function getMotivationalMessage(
  archetypeId: ArchetypeId,
  completionRate: number
): string {
  const archetype = ARCHETYPE_DEFINITIONS.find((a) => a.id === archetypeId);
  if (!archetype) return "";

  if (completionRate >= 0.8) {
    // Great day
    switch (archetypeId) {
      case "Machine":
        return "Systems performing optimally.";
      case "Warrior":
        return "Victory is yours today.";
      case "Artist":
        return "Beautiful work today.";
      case "Scientist":
        return "Excellent data points collected.";
      case "Stoic":
        return "Virtue practiced consistently.";
      case "Visionary":
        return "The future is closer.";
    }
  } else if (completionRate >= 0.5) {
    // Okay day
    switch (archetypeId) {
      case "Machine":
        return "Progress made. Optimize tomorrow.";
      case "Warrior":
        return "A partial victory. Regroup.";
      case "Artist":
        return "Not every day is a masterpiece.";
      case "Scientist":
        return "Data suggests room for improvement.";
      case "Stoic":
        return "Some things were beyond control.";
      case "Visionary":
        return "Small steps still move forward.";
    }
  } else {
    // Tough day
    switch (archetypeId) {
      case "Machine":
        return "System recalibration needed.";
      case "Warrior":
        return "Fall seven times, stand up eight.";
      case "Artist":
        return "Rest is part of creation.";
      case "Scientist":
        return "Failed experiments teach the most.";
      case "Stoic":
        return "Tomorrow offers new choices.";
      case "Visionary":
        return "Even setbacks serve the vision.";
    }
  }

  return "";
}
