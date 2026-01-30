// Archetype definitions and calculation logic

import {
  ArchetypeDefinition,
  ArchetypeId,
  ArchetypeBlend,
  UserTraits,
  VoiceProfile,
  TraitKey,
} from "../types";

// 6 Archetype Definitions
export const ARCHETYPE_DEFINITIONS: ArchetypeDefinition[] = [
  {
    id: "Machine",
    name: "The Machine",
    description: "Systematic, efficient, relentless execution. You build systems and processes that compound over time.",
    coreTraits: ["spontaneous_structured", "reactive_proactive", "patient_urgent"],
    traitThresholds: {
      spontaneous_structured: { min: 70 },
      reactive_proactive: { min: 70 },
      patient_urgent: { min: 60 },
    },
    associatedValues: ["discipline", "excellence", "order", "mastery"],
    voiceProfile: {
      tone: "direct",
      motivationStyle: "discipline",
      detailLevel: "sparse",
      timeOrientation: "immediate",
      examplePhrases: [
        "Execute. No excuses.",
        "The system works. Trust the process.",
        "One task at a time. Complete it.",
      ],
    },
  },
  {
    id: "Warrior",
    name: "The Warrior",
    description: "Confrontational, courageous, driven by challenge. You thrive in adversity and competition.",
    coreTraits: ["harmonious_confrontational", "humble_confident", "risk_averse_seeking"],
    traitThresholds: {
      harmonious_confrontational: { min: 65 },
      humble_confident: { min: 70 },
      risk_averse_seeking: { min: 60 },
    },
    associatedValues: ["courage", "discipline", "integrity", "excellence"],
    voiceProfile: {
      tone: "direct",
      motivationStyle: "challenge",
      detailLevel: "sparse",
      timeOrientation: "immediate",
      examplePhrases: [
        "This is your moment. Attack.",
        "Pain is temporary. Victory is forever.",
        "No retreat. No surrender.",
      ],
    },
  },
  {
    id: "Artist",
    name: "The Artist",
    description: "Creative, intuitive, emotionally intelligent. You see beauty and meaning where others see mundane.",
    coreTraits: ["intuitive_analytical", "conservative_experimental", "process_outcome"],
    traitThresholds: {
      intuitive_analytical: { max: 40 },
      conservative_experimental: { min: 65 },
      process_outcome: { max: 40 },
    },
    associatedValues: ["creativity", "craftsmanship", "presence", "simplicity"],
    voiceProfile: {
      tone: "warm",
      motivationStyle: "inspiration",
      detailLevel: "moderate",
      timeOrientation: "balanced",
      examplePhrases: [
        "Let the work flow through you.",
        "Find the beauty in the process.",
        "Create something that matters to you.",
      ],
    },
  },
  {
    id: "Scientist",
    name: "The Scientist",
    description: "Analytical, systematic, truth-seeking. You understand through data and experimentation.",
    coreTraits: ["intuitive_analytical", "pragmatic_idealistic", "specialist_generalist"],
    traitThresholds: {
      intuitive_analytical: { min: 70 },
      pragmatic_idealistic: { max: 45 },
    },
    associatedValues: ["wisdom", "growth", "quality", "integrity"],
    voiceProfile: {
      tone: "analytical",
      motivationStyle: "logic",
      detailLevel: "detailed",
      timeOrientation: "long-term",
      examplePhrases: [
        "Let's examine the data.",
        "What does the evidence suggest?",
        "Test, measure, iterate.",
      ],
    },
  },
  {
    id: "Stoic",
    name: "The Stoic",
    description: "Calm, accepting, focused on what you control. You find peace through perspective.",
    coreTraits: ["reactive_proactive", "patient_urgent", "harmonious_confrontational"],
    traitThresholds: {
      patient_urgent: { max: 40 },
      harmonious_confrontational: { max: 45 },
    },
    associatedValues: ["peace", "wisdom", "discipline", "gratitude"],
    voiceProfile: {
      tone: "philosophical",
      motivationStyle: "support",
      detailLevel: "moderate",
      timeOrientation: "long-term",
      examplePhrases: [
        "Focus on what you can control.",
        "This too shall pass.",
        "Accept, adapt, advance.",
      ],
    },
  },
  {
    id: "Visionary",
    name: "The Visionary",
    description: "Bold, future-focused, inspiring. You see possibilities where others see obstacles.",
    coreTraits: ["pragmatic_idealistic", "risk_averse_seeking", "conservative_experimental"],
    traitThresholds: {
      pragmatic_idealistic: { min: 65 },
      risk_averse_seeking: { min: 70 },
      conservative_experimental: { min: 70 },
    },
    associatedValues: ["innovation", "impact", "ambition", "legacy"],
    voiceProfile: {
      tone: "energetic",
      motivationStyle: "inspiration",
      detailLevel: "moderate",
      timeOrientation: "long-term",
      examplePhrases: [
        "Think bigger. Go further.",
        "This is just the beginning.",
        "Build the future you want to see.",
      ],
    },
  },
];

// Calculate archetype scores from traits
export function calculateArchetypeScores(traits: UserTraits): Record<ArchetypeId, number> {
  const scores: Record<ArchetypeId, number> = {
    Machine: 0,
    Warrior: 0,
    Artist: 0,
    Scientist: 0,
    Stoic: 0,
    Visionary: 0,
  };

  for (const archetype of ARCHETYPE_DEFINITIONS) {
    let score = 50; // Base score

    // Check each core trait
    for (const traitKey of archetype.coreTraits) {
      const traitValue = traits[traitKey];
      const threshold = archetype.traitThresholds[traitKey];

      if (threshold) {
        if (threshold.min !== undefined) {
          // Higher is better for this archetype
          if (traitValue >= threshold.min) {
            score += (traitValue - threshold.min) * 0.5;
          } else {
            score -= (threshold.min - traitValue) * 0.3;
          }
        }
        if (threshold.max !== undefined) {
          // Lower is better for this archetype
          if (traitValue <= threshold.max) {
            score += (threshold.max - traitValue) * 0.5;
          } else {
            score -= (traitValue - threshold.max) * 0.3;
          }
        }
      }
    }

    // Normalize score to 0-100
    scores[archetype.id] = Math.max(0, Math.min(100, score));
  }

  return scores;
}

// Adjust scores based on selected values
export function adjustScoresForValues(
  scores: Record<ArchetypeId, number>,
  selectedValueIds: string[]
): Record<ArchetypeId, number> {
  const adjusted = { ...scores };

  for (const archetype of ARCHETYPE_DEFINITIONS) {
    let bonus = 0;
    for (const valueId of selectedValueIds) {
      if (archetype.associatedValues.includes(valueId)) {
        bonus += 5;
      }
    }
    adjusted[archetype.id] = Math.min(100, adjusted[archetype.id] + bonus);
  }

  return adjusted;
}

// Blend with inspirations
export function blendWithInspirations(
  scores: Record<ArchetypeId, number>,
  inspirationTraits: UserTraits[]
): Record<ArchetypeId, number> {
  if (inspirationTraits.length === 0) return scores;

  // Calculate average inspiration traits
  const avgTraits: UserTraits = { ...inspirationTraits[0] };
  const traitKeys = Object.keys(avgTraits) as TraitKey[];

  for (const key of traitKeys) {
    let sum = 0;
    for (const traits of inspirationTraits) {
      sum += traits[key] || 50;
    }
    avgTraits[key] = sum / inspirationTraits.length;
  }

  // Calculate inspiration-based scores
  const inspirationScores = calculateArchetypeScores(avgTraits);

  // Blend: 70% user scores, 30% inspiration scores
  const blended: Record<ArchetypeId, number> = {} as Record<ArchetypeId, number>;
  for (const id of Object.keys(scores) as ArchetypeId[]) {
    blended[id] = scores[id] * 0.7 + inspirationScores[id] * 0.3;
  }

  return blended;
}

// Generate archetype name based on blend
export function generateArchetypeName(
  primary: ArchetypeId,
  secondary: ArchetypeId,
  scores: Record<ArchetypeId, number>
): string {
  const names: Record<string, string> = {
    "Machine_Warrior": "The Relentless Builder",
    "Machine_Scientist": "The Systematic Mind",
    "Machine_Stoic": "The Disciplined Monk",
    "Machine_Visionary": "The Strategic Executor",
    "Machine_Artist": "The Precise Craftsman",
    "Warrior_Machine": "The Iron Will",
    "Warrior_Visionary": "The Bold Pioneer",
    "Warrior_Stoic": "The Stoic Warrior",
    "Warrior_Scientist": "The Tactical Mind",
    "Warrior_Artist": "The Creative Fighter",
    "Artist_Creator": "The Creative Soul",
    "Artist_Stoic": "The Peaceful Creator",
    "Artist_Visionary": "The Imaginative Pioneer",
    "Artist_Scientist": "The Analytical Creator",
    "Artist_Machine": "The Methodical Artist",
    "Scientist_Machine": "The Analytical Engine",
    "Scientist_Stoic": "The Wise Observer",
    "Scientist_Visionary": "The Innovative Mind",
    "Scientist_Warrior": "The Strategic Analyst",
    "Scientist_Artist": "The Curious Explorer",
    "Stoic_Warrior": "The Calm Commander",
    "Stoic_Scientist": "The Patient Scholar",
    "Stoic_Machine": "The Steady Hand",
    "Stoic_Artist": "The Serene Creator",
    "Stoic_Visionary": "The Wise Dreamer",
    "Visionary_Warrior": "The Bold Dreamer",
    "Visionary_Machine": "The Ambitious Builder",
    "Visionary_Artist": "The Creative Visionary",
    "Visionary_Scientist": "The Innovative Thinker",
    "Visionary_Stoic": "The Patient Revolutionary",
  };

  const key = `${primary}_${secondary}`;
  return names[key] || `The ${primary}`;
}

// Main calculation function
export function calculateArchetypeBlend(
  traits: UserTraits,
  selectedValueIds: string[],
  inspirationTraits: UserTraits[]
): ArchetypeBlend {
  // Step 1: Calculate base scores from traits
  let scores = calculateArchetypeScores(traits);

  // Step 2: Adjust for values
  scores = adjustScoresForValues(scores, selectedValueIds);

  // Step 3: Blend with inspirations
  scores = blendWithInspirations(scores, inspirationTraits);

  // Step 4: Rank and select top 3
  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id as ArchetypeId);

  const primary = sorted[0];
  const secondary = sorted[1];
  const tertiary = sorted[2];

  // Step 5: Generate name
  const name = generateArchetypeName(primary, secondary, scores);

  return {
    primary,
    secondary,
    tertiary,
    scores,
    name,
  };
}

// Get voice profile for archetype
export function getVoiceProfile(archetypeId: ArchetypeId): VoiceProfile {
  const archetype = ARCHETYPE_DEFINITIONS.find((a) => a.id === archetypeId);
  return archetype?.voiceProfile || ARCHETYPE_DEFINITIONS[0].voiceProfile;
}

// Get archetype definition
export function getArchetypeDefinition(archetypeId: ArchetypeId): ArchetypeDefinition | undefined {
  return ARCHETYPE_DEFINITIONS.find((a) => a.id === archetypeId);
}
