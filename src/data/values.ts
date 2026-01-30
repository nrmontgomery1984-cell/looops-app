// 40 Core Values for the Prototype Engine

import { CoreValue, ValueCategory } from "../types";

export const CORE_VALUES: CoreValue[] = [
  // Achievement Cluster
  { id: "excellence", name: "Excellence", description: "Pursuing mastery and the highest quality in all endeavors", category: "achievement" },
  { id: "ambition", name: "Ambition", description: "Drive to achieve significant goals and reach full potential", category: "achievement" },
  { id: "growth", name: "Growth", description: "Continuous learning, improvement, and personal development", category: "achievement" },
  { id: "impact", name: "Impact", description: "Creating meaningful change and leaving a lasting mark", category: "achievement" },
  { id: "success", name: "Success", description: "Achieving defined goals and measurable outcomes", category: "achievement" },

  // Character Cluster
  { id: "integrity", name: "Integrity", description: "Alignment between values, words, and actions", category: "character" },
  { id: "honesty", name: "Honesty", description: "Truthfulness in all communications and dealings", category: "character" },
  { id: "discipline", name: "Discipline", description: "Self-control and consistent execution despite resistance", category: "character" },
  { id: "courage", name: "Courage", description: "Willingness to face fear and take difficult action", category: "character" },
  { id: "humility", name: "Humility", description: "Accurate self-assessment and openness to being wrong", category: "character" },

  // Relationships Cluster
  { id: "family", name: "Family", description: "Deep commitment to family bonds and responsibilities", category: "relationships" },
  { id: "loyalty", name: "Loyalty", description: "Faithfulness to people, principles, and commitments", category: "relationships" },
  { id: "connection", name: "Connection", description: "Building and maintaining meaningful relationships", category: "relationships" },
  { id: "service", name: "Service", description: "Contributing to others' wellbeing and success", category: "relationships" },
  { id: "community", name: "Community", description: "Belonging to and contributing to something larger", category: "relationships" },

  // Freedom Cluster
  { id: "independence", name: "Independence", description: "Self-reliance and freedom from dependence on others", category: "freedom" },
  { id: "autonomy", name: "Autonomy", description: "Control over one's own choices and direction", category: "freedom" },
  { id: "adventure", name: "Adventure", description: "Seeking new experiences, risks, and challenges", category: "freedom" },
  { id: "flexibility", name: "Flexibility", description: "Ability to adapt and change course as needed", category: "freedom" },
  { id: "simplicity", name: "Simplicity", description: "Reducing complexity and focusing on essentials", category: "freedom" },

  // Craft Cluster
  { id: "craftsmanship", name: "Craftsmanship", description: "Pride in skilled work and attention to detail", category: "craft" },
  { id: "creativity", name: "Creativity", description: "Original thinking and novel approaches", category: "craft" },
  { id: "innovation", name: "Innovation", description: "Creating new solutions and pushing boundaries", category: "craft" },
  { id: "quality", name: "Quality", description: "Prioritizing excellence over speed or quantity", category: "craft" },
  { id: "mastery", name: "Mastery", description: "Deep expertise and continuous skill development", category: "craft" },

  // Stability Cluster
  { id: "security", name: "Security", description: "Safety, stability, and protection from harm", category: "stability" },
  { id: "health", name: "Health", description: "Physical and mental wellbeing as foundation", category: "stability" },
  { id: "balance", name: "Balance", description: "Harmony across life domains, avoiding extremes", category: "stability" },
  { id: "peace", name: "Peace", description: "Inner calm and freedom from conflict", category: "stability" },
  { id: "order", name: "Order", description: "Structure, organization, and predictability", category: "stability" },

  // Wealth Cluster
  { id: "prosperity", name: "Prosperity", description: "Financial abundance and material comfort", category: "wealth" },
  { id: "generosity", name: "Generosity", description: "Giving freely of resources, time, and knowledge", category: "wealth" },
  { id: "resourcefulness", name: "Resourcefulness", description: "Making the most of what's available", category: "wealth" },
  { id: "legacy", name: "Legacy", description: "Building something that outlasts you", category: "wealth" },
  { id: "stewardship", name: "Stewardship", description: "Responsible management of resources and opportunities", category: "wealth" },

  // Meaning Cluster
  { id: "wisdom", name: "Wisdom", description: "Deep understanding and good judgment", category: "meaning" },
  { id: "purpose", name: "Purpose", description: "Clear sense of why you exist and what you're for", category: "meaning" },
  { id: "faith", name: "Faith", description: "Trust in something greater than yourself", category: "meaning" },
  { id: "gratitude", name: "Gratitude", description: "Appreciation for what you have and receive", category: "meaning" },
  { id: "presence", name: "Presence", description: "Full engagement with the current moment", category: "meaning" },
];

// Get values by category
export function getValuesByCategory(category: ValueCategory): CoreValue[] {
  return CORE_VALUES.filter((v) => v.category === category);
}

// Get value by ID
export function getValueById(id: string): CoreValue | undefined {
  return CORE_VALUES.find((v) => v.id === id);
}

// Get multiple values by IDs
export function getValuesByIds(ids: string[]): CoreValue[] {
  return CORE_VALUES.filter((v) => ids.includes(v.id));
}

// All value categories
export const VALUE_CATEGORIES: { id: ValueCategory; name: string }[] = [
  { id: "achievement", name: "Achievement" },
  { id: "character", name: "Character" },
  { id: "relationships", name: "Relationships" },
  { id: "freedom", name: "Freedom" },
  { id: "craft", name: "Craft" },
  { id: "stability", name: "Stability" },
  { id: "wealth", name: "Wealth" },
  { id: "meaning", name: "Meaning" },
];
