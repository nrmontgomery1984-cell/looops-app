// Project types for Todoist-like task management
// Projects are containers for tasks, always aligned to a Loop

import { LoopId, LoopStateType, Priority } from "./core";

// Project view types
export type ProjectView = "list" | "board";

// Project section (for organizing tasks within a project)
export type ProjectSection = {
  id: string;
  projectId: string;
  name: string;
  order: number;
  collapsed: boolean;
};

// Project type
export type Project = {
  id: string;
  name: string;
  description?: string;

  // Loop alignment (required - every project belongs to a loop)
  loop: LoopId;
  subLoop?: string;

  // Visual
  color: string;
  icon?: string;

  // Organization
  parentId?: string; // For sub-projects
  order: number;
  sections: ProjectSection[];

  // State
  archived: boolean;
  favorite: boolean;

  // Metadata
  createdAt: string;
  updatedAt: string;

  // Optional goal linkage
  goalId?: string;
};

// Label type (tags that can span across loops)
export type Label = {
  id: string;
  name: string;
  color: string;
  order: number;
};

// Filter type (saved searches)
export type SavedFilter = {
  id: string;
  name: string;
  query: string;
  color: string;
  order: number;
};

// Task comment
export type TaskComment = {
  id: string;
  taskId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
};

// Task reminder
export type TaskReminder = {
  id: string;
  taskId: string;
  type: "time" | "location";
  datetime?: string;
  location?: string;
};

// Subtask (simplified task for nesting)
export type Subtask = {
  id: string;
  parentId: string;
  title: string;
  completed: boolean;
  order: number;
};

// Quick add parsed result
export type ParsedTaskInput = {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: Priority;
  loop?: LoopId;
  projectId?: string;
  labels?: string[];
};

// Task sort options
export type TaskSortOption =
  | "manual"
  | "dueDate"
  | "priority"
  | "alphabetical"
  | "createdAt"
  | "loop";

// Task group options
export type TaskGroupOption =
  | "none"
  | "project"
  | "loop"
  | "dueDate"
  | "priority"
  | "label";

// Task filter state
export type TaskFilterState = {
  search: string;
  loops: LoopId[];
  projects: string[];
  labels: string[];
  priorities: Priority[];
  statuses: string[];
  states: LoopStateType[];
  dueDateRange?: {
    start?: string;
    end?: string;
  };
  showCompleted: boolean;
};

// Default filter state
export const DEFAULT_FILTER_STATE: TaskFilterState = {
  search: "",
  loops: [],
  projects: [],
  labels: [],
  priorities: [],
  statuses: [],
  states: [],
  showCompleted: false,
};

// Project colors (Looops brand-aligned)
export const PROJECT_COLORS = [
  { id: "coral", hex: "#F27059" },       // Looops Coral
  { id: "coral-light", hex: "#ff8a6b" },
  { id: "amber", hex: "#F4B942" },       // Looops Amber
  { id: "amber-light", hex: "#ffc85c" },
  { id: "sage", hex: "#73A58C" },        // Looops Sage
  { id: "sage-dark", hex: "#5a8a72" },
  { id: "navy", hex: "#1a1a2e" },        // Looops Navy
  { id: "navy-gray", hex: "#737390" },
  { id: "purple", hex: "#b87fa8" },      // Complement purple
  { id: "blue-muted", hex: "#5a7fb8" },  // Complement blue
  { id: "rose", hex: "#c47a8a" },
  { id: "terracotta", hex: "#c4826a" },
  { id: "olive", hex: "#8a9a6a" },
  { id: "slate", hex: "#525270" },
  { id: "stone", hex: "#a3a3b8" },
];

// Parse natural language input for task creation
export function parseTaskInput(input: string): ParsedTaskInput {
  const result: ParsedTaskInput = {
    title: input,
  };

  let remaining = input;

  // Parse priority (p1, p2, p3, p4, !!, !, etc.)
  const priorityMatch = remaining.match(/\s+[pP]([1-4])\s*$|\s+(!!!?)\s*$/);
  if (priorityMatch) {
    if (priorityMatch[1]) {
      result.priority = parseInt(priorityMatch[1]) as Priority;
    } else if (priorityMatch[2]) {
      result.priority = priorityMatch[2] === "!!" ? 1 : 2;
    }
    remaining = remaining.replace(priorityMatch[0], "").trim();
  }

  // Parse due date keywords
  const todayMatch = remaining.match(/\s+today\s*$/i);
  const tomorrowMatch = remaining.match(/\s+tomorrow\s*$/i);
  const nextWeekMatch = remaining.match(/\s+next\s+week\s*$/i);

  if (todayMatch) {
    result.dueDate = new Date().toISOString().split("T")[0];
    remaining = remaining.replace(todayMatch[0], "").trim();
  } else if (tomorrowMatch) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    result.dueDate = tomorrow.toISOString().split("T")[0];
    remaining = remaining.replace(tomorrowMatch[0], "").trim();
  } else if (nextWeekMatch) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    result.dueDate = nextWeek.toISOString().split("T")[0];
    remaining = remaining.replace(nextWeekMatch[0], "").trim();
  }

  // Parse labels (@label)
  const labelMatches = remaining.match(/@(\w+)/g);
  if (labelMatches) {
    result.labels = labelMatches.map(l => l.substring(1));
    remaining = remaining.replace(/@\w+/g, "").trim();
  }

  // Parse loop (#Health, #Work, etc.)
  const loopMatch = remaining.match(/#(Health|Wealth|Family|Work|Fun|Maintenance|Meaning)/i);
  if (loopMatch) {
    result.loop = loopMatch[1] as LoopId;
    remaining = remaining.replace(loopMatch[0], "").trim();
  }

  // Clean up title
  result.title = remaining.replace(/\s+/g, " ").trim();

  return result;
}

// Create a new project with defaults
export function createProject(
  name: string,
  loop: LoopId,
  options?: Partial<Omit<Project, "id" | "name" | "loop" | "createdAt" | "updatedAt">>
): Project {
  const now = new Date().toISOString();
  return {
    id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    loop,
    color: PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)].hex,
    order: 0,
    sections: [],
    archived: false,
    favorite: false,
    createdAt: now,
    updatedAt: now,
    ...options,
  };
}

// Create a new section
export function createSection(projectId: string, name: string, order: number = 0): ProjectSection {
  return {
    id: `sect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    projectId,
    name,
    order,
    collapsed: false,
  };
}
