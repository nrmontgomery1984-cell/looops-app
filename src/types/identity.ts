// Identity types for the Prototype Engine

// Archetype identifiers
export type ArchetypeId =
  | "Machine"
  | "Warrior"
  | "Artist"
  | "Scientist"
  | "Stoic"
  | "Visionary";

// 15 Trait dimension keys
export type TraitKey =
  | "introvert_extrovert"
  | "intuitive_analytical"
  | "spontaneous_structured"
  | "risk_averse_seeking"
  | "specialist_generalist"
  | "independent_collaborative"
  | "patient_urgent"
  | "pragmatic_idealistic"
  | "minimalist_maximalist"
  | "private_public"
  | "harmonious_confrontational"
  | "process_outcome"
  | "conservative_experimental"
  | "humble_confident"
  | "reactive_proactive";

// Trait dimension definition
export type TraitDimension = {
  id: TraitKey;
  leftPole: string;
  rightPole: string;
  leftDescription: string;
  rightDescription: string;
  category: "energy" | "decision" | "work" | "social" | "approach";
};

// User's trait values (0-100 for each dimension)
export type UserTraits = Record<TraitKey, number>;

// Default trait values (all at 50 - balanced)
export const DEFAULT_TRAITS: UserTraits = {
  introvert_extrovert: 50,
  intuitive_analytical: 50,
  spontaneous_structured: 50,
  risk_averse_seeking: 50,
  specialist_generalist: 50,
  independent_collaborative: 50,
  patient_urgent: 50,
  pragmatic_idealistic: 50,
  minimalist_maximalist: 50,
  private_public: 50,
  harmonious_confrontational: 50,
  process_outcome: 50,
  conservative_experimental: 50,
  humble_confident: 50,
  reactive_proactive: 50,
};

// Value category
export type ValueCategory =
  | "achievement"
  | "character"
  | "relationships"
  | "freedom"
  | "craft"
  | "stability"
  | "wealth"
  | "meaning";

// Core value definition
export type CoreValue = {
  id: string;
  name: string;
  description: string;
  category: ValueCategory;
};

// User's selected values (5 from 40)
export type UserValues = {
  selectedIds: string[];
  selectedAt: string;
};

// Inspiration category
export type InspirationCategory =
  | "athlete"
  | "entrepreneur"
  | "creator"
  | "thinker"
  | "leader";

// Inspiration (profiled figure)
export type Inspiration = {
  id: string;
  name: string;
  category: InspirationCategory;
  tagline: string;
  traits: Partial<UserTraits>;
  values: string[];
  quotes: string[];
  imageUrl?: string;
};

// User's selected inspirations (5-10)
export type UserInspirations = {
  selectedIds: string[];
  selectedAt: string;
};

// Voice profile configuration
export type VoiceTone = "direct" | "warm" | "philosophical" | "energetic" | "analytical";
export type MotivationStyle = "challenge" | "support" | "logic" | "inspiration" | "discipline";

export type VoiceProfile = {
  tone: VoiceTone;
  motivationStyle: MotivationStyle;
  detailLevel: "sparse" | "moderate" | "detailed";
  timeOrientation: "immediate" | "balanced" | "long-term";
  examplePhrases: string[];
};

// Archetype blend (weighted combination)
export type ArchetypeBlend = {
  primary: ArchetypeId;
  secondary: ArchetypeId;
  tertiary?: ArchetypeId;
  scores: Record<ArchetypeId, number>;
  name: string; // Generated name like "The Relentless Builder"
};

// Complete User Prototype
export type UserPrototype = {
  id: string;
  userId: string;

  // Identity components
  traits: UserTraits;
  values: UserValues;
  inspirations: UserInspirations;

  // Computed outputs
  archetypeBlend: ArchetypeBlend;
  voiceProfile: VoiceProfile;

  // Future self vision
  futureSelf?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
};

// Archetype definition (for calculation)
export type ArchetypeDefinition = {
  id: ArchetypeId;
  name: string;
  description: string;
  coreTraits: TraitKey[];
  traitThresholds: Partial<Record<TraitKey, { min?: number; max?: number }>>;
  associatedValues: string[];
  voiceProfile: VoiceProfile;
};

// Archetype scores (legacy format for compatibility)
export type ArchetypeScores = Record<ArchetypeId, number>;
