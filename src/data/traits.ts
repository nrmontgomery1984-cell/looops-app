// 15 Personality Trait Dimensions for the Prototype Engine

import { TraitDimension, TraitKey } from "../types";

export const TRAIT_DEFINITIONS: TraitDimension[] = [
  {
    id: "introvert_extrovert",
    leftPole: "Introvert",
    rightPole: "Extrovert",
    leftDescription: "Energy from solitude, deep focus, internal processing",
    rightDescription: "Energy from social interaction, external processing",
    category: "energy",
  },
  {
    id: "intuitive_analytical",
    leftPole: "Intuitive",
    rightPole: "Analytical",
    leftDescription: "Trust gut feelings, pattern recognition, holistic thinking",
    rightDescription: "Data-driven decisions, systematic analysis, logical reasoning",
    category: "decision",
  },
  {
    id: "spontaneous_structured",
    leftPole: "Spontaneous",
    rightPole: "Structured",
    leftDescription: "Flexible, adaptable, go with the flow",
    rightDescription: "Planned, scheduled, systematic approach",
    category: "work",
  },
  {
    id: "risk_averse_seeking",
    leftPole: "Risk-Averse",
    rightPole: "Risk-Seeking",
    leftDescription: "Prefer security, minimize uncertainty, careful evaluation",
    rightDescription: "Embrace uncertainty, seek high stakes, bold moves",
    category: "approach",
  },
  {
    id: "specialist_generalist",
    leftPole: "Specialist",
    rightPole: "Generalist",
    leftDescription: "Deep expertise in focused areas, mastery of few",
    rightDescription: "Broad knowledge across domains, jack of all trades",
    category: "work",
  },
  {
    id: "independent_collaborative",
    leftPole: "Independent",
    rightPole: "Collaborative",
    leftDescription: "Self-reliant, autonomous, work best alone",
    rightDescription: "Team-oriented, synergistic, thrive with others",
    category: "social",
  },
  {
    id: "patient_urgent",
    leftPole: "Patient",
    rightPole: "Urgent",
    leftDescription: "Long-term focus, delayed gratification, steady progress",
    rightDescription: "Immediate action, fast results, now-oriented",
    category: "approach",
  },
  {
    id: "pragmatic_idealistic",
    leftPole: "Pragmatic",
    rightPole: "Idealistic",
    leftDescription: "Focus on what works, practical solutions, realistic",
    rightDescription: "Focus on what's right, principled, vision-driven",
    category: "decision",
  },
  {
    id: "minimalist_maximalist",
    leftPole: "Minimalist",
    rightPole: "Maximalist",
    leftDescription: "Less is more, essentialism, reduce complexity",
    rightDescription: "More is more, abundance, embrace complexity",
    category: "approach",
  },
  {
    id: "private_public",
    leftPole: "Private",
    rightPole: "Public",
    leftDescription: "Guard privacy, selective sharing, behind scenes",
    rightDescription: "Open sharing, visible, comfortable in spotlight",
    category: "social",
  },
  {
    id: "harmonious_confrontational",
    leftPole: "Harmonious",
    rightPole: "Confrontational",
    leftDescription: "Avoid conflict, seek consensus, diplomatic",
    rightDescription: "Direct confrontation, address issues head-on",
    category: "social",
  },
  {
    id: "process_outcome",
    leftPole: "Process-Oriented",
    rightPole: "Outcome-Oriented",
    leftDescription: "Value the journey, focus on how, enjoy the work",
    rightDescription: "Value the result, focus on what, ends-driven",
    category: "work",
  },
  {
    id: "conservative_experimental",
    leftPole: "Conservative",
    rightPole: "Experimental",
    leftDescription: "Proven methods, tradition, stability",
    rightDescription: "Novel approaches, innovation, change-seeking",
    category: "approach",
  },
  {
    id: "humble_confident",
    leftPole: "Humble",
    rightPole: "Confident",
    leftDescription: "Self-effacing, understated, open to being wrong",
    rightDescription: "Self-assured, bold assertions, strong presence",
    category: "social",
  },
  {
    id: "reactive_proactive",
    leftPole: "Reactive",
    rightPole: "Proactive",
    leftDescription: "Respond to environment, adapt, flexible response",
    rightDescription: "Shape environment, initiate, create conditions",
    category: "approach",
  },
];

// Get trait by ID
export function getTraitById(id: TraitKey): TraitDimension | undefined {
  return TRAIT_DEFINITIONS.find((t) => t.id === id);
}

// Get traits by category
export function getTraitsByCategory(
  category: TraitDimension["category"]
): TraitDimension[] {
  return TRAIT_DEFINITIONS.filter((t) => t.category === category);
}

// Interpret trait value (0-100) as description
export function interpretTraitValue(
  trait: TraitDimension,
  value: number
): { leaning: "left" | "center" | "right"; intensity: "strong" | "moderate" | "slight" | "balanced" } {
  if (value < 20) return { leaning: "left", intensity: "strong" };
  if (value < 35) return { leaning: "left", intensity: "moderate" };
  if (value < 45) return { leaning: "left", intensity: "slight" };
  if (value <= 55) return { leaning: "center", intensity: "balanced" };
  if (value < 65) return { leaning: "right", intensity: "slight" };
  if (value < 80) return { leaning: "right", intensity: "moderate" };
  return { leaning: "right", intensity: "strong" };
}
