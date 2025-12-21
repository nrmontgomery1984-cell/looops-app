// Core types for Looops Personal Operating System

// 7 Life Loops (domains)
export type LoopId =
  | "Health"
  | "Wealth"
  | "Family"
  | "Work"
  | "Fun"
  | "Maintenance"
  | "Meaning";

// 4 States per Loop
export type LoopStateType = "BUILD" | "MAINTAIN" | "RECOVER" | "HIBERNATE";

// Looops Brand Colors
// Coral: #F27059 (To Do / Stop)
// Amber: #F4B942 (In Progress / Wait)
// Sage: #73A58C (Done / Go)
// Navy: #1a1a2e (Text/Backgrounds)

// State colors for UI - Traffic Light System
export const STATE_COLORS: Record<LoopStateType, string> = {
  BUILD: "#73A58C",      // Sage - active growth/expansion (Go)
  MAINTAIN: "#5a7fb8",   // Blue - steady state/hold the line
  RECOVER: "#F4B942",    // Amber - restoration/healing (Wait)
  HIBERNATE: "#737390",  // Navy Gray - dormant/paused
};

// Loop colors (Looops Brand Palette)
export const LOOP_COLORS: Record<LoopId, { bg: string; border: string; text: string }> = {
  Health: { bg: "rgba(115, 165, 140, 0.12)", border: "#73A58C", text: "#5a8a72" },    // Sage
  Wealth: { bg: "rgba(244, 185, 66, 0.12)", border: "#F4B942", text: "#c99a35" },     // Amber
  Family: { bg: "rgba(242, 112, 89, 0.12)", border: "#F27059", text: "#d05a45" },     // Coral
  Work: { bg: "rgba(90, 127, 184, 0.12)", border: "#5a7fb8", text: "#4a6a9a" },       // Muted Blue
  Fun: { bg: "rgba(184, 127, 168, 0.12)", border: "#b87fa8", text: "#9a6a8a" },       // Muted Purple
  Maintenance: { bg: "rgba(115, 115, 144, 0.12)", border: "#737390", text: "#5e5e78" }, // Navy Gray
  Meaning: { bg: "rgba(168, 127, 184, 0.12)", border: "#a87fb8", text: "#8a6a9a" },   // Light Purple
};

// Loop definitions with metadata
export const LOOP_DEFINITIONS: Record<LoopId, {
  name: string;
  description: string;
  icon: string;
  subLoops: string[];
}> = {
  Health: {
    name: "Health",
    description: "Biological substrate - Sleep, Move, Eat, Recovery",
    icon: "💪",
    subLoops: ["Exercise", "Nutrition", "Sleep", "Medical", "Mental"],
  },
  Wealth: {
    name: "Wealth",
    description: "Economic survival and growth - Income, Savings, Investments",
    icon: "💰",
    subLoops: ["Income", "Budgeting", "Investing", "Saving", "Bills", "Planning"],
  },
  Family: {
    name: "Family",
    description: "Kinship, parenting, duty - Relationships that define you",
    icon: "👨‍👩‍👧‍👦",
    subLoops: ["Partner", "Parenting", "Extended Family", "Quality Time", "Events"],
  },
  Work: {
    name: "Work",
    description: "Career, business, contribution - How you create value",
    icon: "💼",
    subLoops: ["Projects", "Meetings", "Development", "Learning", "Admin", "Career"],
  },
  Fun: {
    name: "Fun",
    description: "Play, novelty, restoration - What recharges you",
    icon: "🎮",
    subLoops: ["Hobbies", "Social", "Entertainment", "Adventure", "Creative"],
  },
  Maintenance: {
    name: "Maintenance",
    description: "Environment, logistics, admin - Keeping life running",
    icon: "🔧",
    subLoops: ["Cleaning", "Repairs", "Shopping", "Vehicle", "Organization", "Home Care"],
  },
  Meaning: {
    name: "Meaning",
    description: "Spirituality, philosophy, identity - Why you do any of it",
    icon: "🧘",
    subLoops: ["Reflection", "Learning", "Purpose", "Practice", "Gratitude"],
  },
};

// Task priority levels
export type Priority = 1 | 2 | 3 | 4 | 0;
// 1=P1 must, date; 2=P2 must, range; 3=P3 should, date; 4=P4 should, range; 0=Someday

// Task status workflow
export type TaskStatus =
  | "inbox"
  | "todo"
  | "doing"
  | "waiting"
  | "done"
  | "dropped";

// Challenge duration types
export type Duration = "micro" | "small" | "medium" | "large";

// Life seasons
export type Season = "Rebuilding" | "Growth" | "Peak" | "Maintenance";

// Tab navigation
export type TabId = "today" | "tasks" | "routines" | "systems" | "loops" | "planning" | "history" | "me";

// All loops as array for iteration
export const ALL_LOOPS: LoopId[] = [
  "Health",
  "Wealth",
  "Family",
  "Work",
  "Fun",
  "Maintenance",
  "Meaning",
];
