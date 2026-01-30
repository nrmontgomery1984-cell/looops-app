// Starter Content Engine
// Generates personalized starter tasks and system suggestions based on onboarding data

import { LoopId, LoopStateType, ALL_LOOPS, Priority } from "../types/core";
import { Task, createTask } from "../types/tasks";
import { SystemTemplate, SYSTEM_TEMPLATES } from "../types/systems";

// Challenge IDs from onboarding
export type ChallengeId =
  | "time"
  | "energy"
  | "focus"
  | "balance"
  | "direction"
  | "motivation"
  | "consistency"
  | "overwhelm";

// Life season IDs
export type LifeSeasonId = "single" | "partnered" | "divorced" | "parent" | "caregiver";

// Major transition IDs
export type TransitionId = "none" | "death" | "divorce" | "health" | "job" | "move" | "other";

// Input for starter content generation
export interface StarterContentInput {
  name: string;
  lifeSeason: LifeSeasonId;
  majorTransition: TransitionId;
  primaryChallenges: ChallengeId[];
  loopStates: Record<LoopId, LoopStateType>;
  archetypePrimary?: string;
}

// Output from starter content generation
export interface StarterContentOutput {
  tasks: Task[];
  suggestedSystems: SystemTemplate[];
  welcomeMessage: string;
}

// Starter task templates organized by loop and context
const STARTER_TASK_TEMPLATES: Record<LoopId, Array<{
  title: string;
  description?: string;
  contexts?: {
    challenges?: ChallengeId[];
    lifeSeason?: LifeSeasonId[];
    transitions?: TransitionId[];
    states?: LoopStateType[];
  };
  priority?: number;
  estimateMinutes?: number;
}>> = {
  Health: [
    {
      title: "Schedule annual physical checkup",
      description: "Book an appointment with your primary care doctor for a wellness check",
      priority: 2,
      estimateMinutes: 15,
    },
    {
      title: "Set up sleep schedule",
      description: "Decide on a consistent bedtime and wake time for the next week",
      contexts: { challenges: ["energy", "focus"] },
      priority: 2,
      estimateMinutes: 10,
    },
    {
      title: "Plan 3 healthy meals for this week",
      description: "Choose simple, nutritious recipes you can make in 30 minutes or less",
      priority: 3,
      estimateMinutes: 20,
    },
    {
      title: "Take a 10-minute walk today",
      description: "Get outside and move - no special equipment needed",
      contexts: { challenges: ["motivation", "energy"] },
      priority: 3,
      estimateMinutes: 10,
    },
    {
      title: "Drink 8 glasses of water today",
      description: "Track your water intake - hydration impacts energy and focus",
      contexts: { challenges: ["energy"] },
      priority: 4,
      estimateMinutes: 5,
    },
  ],
  Wealth: [
    {
      title: "Review last month's spending",
      description: "Check your bank statements and categorize where your money went",
      priority: 2,
      estimateMinutes: 30,
    },
    {
      title: "Set up automatic savings transfer",
      description: "Even $10/week adds up. Automate it so you don't have to think about it",
      priority: 2,
      estimateMinutes: 15,
    },
    {
      title: "Check retirement account balance",
      description: "Know where you stand and if your contributions are on track",
      contexts: { transitions: ["job"] },
      priority: 3,
      estimateMinutes: 15,
    },
    {
      title: "Create a simple monthly budget",
      description: "List your fixed expenses, variable expenses, and savings target",
      contexts: { challenges: ["direction", "overwhelm"] },
      priority: 2,
      estimateMinutes: 45,
    },
    {
      title: "Cancel one unused subscription",
      description: "Review recurring charges and eliminate what you don't use",
      priority: 4,
      estimateMinutes: 10,
    },
  ],
  Family: [
    {
      title: "Schedule quality time with loved ones",
      description: "Block out time in your calendar for meaningful connection",
      contexts: { challenges: ["balance", "time"] },
      priority: 2,
      estimateMinutes: 10,
    },
    {
      title: "Send a message to someone you haven't talked to in a while",
      description: "A simple check-in can strengthen relationships",
      priority: 3,
      estimateMinutes: 5,
    },
    {
      title: "Plan a family dinner or call",
      description: "Whether in person or virtual, set a date to connect",
      contexts: { transitions: ["move", "divorce"] },
      priority: 2,
      estimateMinutes: 15,
    },
    {
      title: "Ask your partner how they're really doing",
      description: "Take 15 minutes for a genuine conversation without distractions",
      contexts: { lifeSeason: ["partnered", "parent"] },
      priority: 3,
      estimateMinutes: 15,
    },
    {
      title: "Set up a regular check-in with aging parents",
      description: "Weekly calls or visits to stay connected and aware of their needs",
      contexts: { lifeSeason: ["caregiver"] },
      priority: 2,
      estimateMinutes: 10,
    },
  ],
  Work: [
    {
      title: "Define your top 3 priorities for this week",
      description: "What would make this week a success? Write them down.",
      contexts: { challenges: ["focus", "direction", "overwhelm"] },
      priority: 1,
      estimateMinutes: 15,
    },
    {
      title: "Clear your inbox to zero",
      description: "Process every email: delete, delegate, do, or defer",
      contexts: { challenges: ["overwhelm"] },
      priority: 3,
      estimateMinutes: 45,
    },
    {
      title: "Update your resume/CV",
      description: "Keep it current with recent accomplishments",
      contexts: { transitions: ["job"] },
      priority: 2,
      estimateMinutes: 60,
    },
    {
      title: "Block 90 minutes for deep work tomorrow",
      description: "Protect time for your most important work - no meetings, no interruptions",
      contexts: { challenges: ["focus", "time"] },
      priority: 2,
      estimateMinutes: 5,
    },
    {
      title: "Identify one task you can delegate or eliminate",
      description: "What are you doing that you shouldn't be?",
      contexts: { challenges: ["overwhelm", "balance"] },
      priority: 3,
      estimateMinutes: 15,
    },
  ],
  Fun: [
    {
      title: "Schedule one hour of pure fun this week",
      description: "What did you used to love doing? Make time for it.",
      contexts: { challenges: ["balance", "energy"] },
      priority: 3,
      estimateMinutes: 5,
    },
    {
      title: "Start that book you've been meaning to read",
      description: "Even 10 pages is progress. Put it on your nightstand.",
      priority: 3,
      estimateMinutes: 20,
    },
    {
      title: "Plan one social activity for this week",
      description: "Coffee with a friend, game night, anything that sounds enjoyable",
      contexts: { lifeSeason: ["single", "divorced"] },
      priority: 3,
      estimateMinutes: 10,
    },
    {
      title: "Try something new this weekend",
      description: "A new restaurant, activity, or place. Novelty feeds creativity.",
      priority: 4,
      estimateMinutes: 10,
    },
    {
      title: "Create a list of things that bring you joy",
      description: "Brainstorm 10 activities that make you feel alive",
      contexts: { challenges: ["direction", "motivation"] },
      priority: 3,
      estimateMinutes: 15,
    },
  ],
  Maintenance: [
    {
      title: "Spend 15 minutes tidying your main living space",
      description: "A clean environment reduces mental clutter",
      contexts: { challenges: ["overwhelm", "focus"] },
      priority: 3,
      estimateMinutes: 15,
    },
    {
      title: "Review and pay upcoming bills",
      description: "Avoid late fees and stress by staying ahead",
      priority: 2,
      estimateMinutes: 20,
    },
    {
      title: "Schedule car maintenance if overdue",
      description: "Oil change, tire rotation, or whatever's next on the list",
      priority: 3,
      estimateMinutes: 15,
    },
    {
      title: "Update emergency contacts",
      description: "Make sure your contacts are current in your phone and important documents",
      contexts: { transitions: ["divorce", "death", "move"] },
      priority: 3,
      estimateMinutes: 15,
    },
    {
      title: "Create a weekly reset routine",
      description: "Pick a day and time for planning, tidying, and preparing for the week ahead",
      contexts: { challenges: ["consistency", "overwhelm"] },
      priority: 2,
      estimateMinutes: 20,
    },
  ],
  Meaning: [
    {
      title: "Write down 3 things you're grateful for today",
      description: "Gratitude practice trains your brain to notice the good",
      priority: 3,
      estimateMinutes: 5,
    },
    {
      title: "Define your top 3 values",
      description: "What matters most to you? Let these guide your decisions.",
      contexts: { challenges: ["direction", "balance"] },
      priority: 2,
      estimateMinutes: 20,
    },
    {
      title: "Spend 5 minutes in quiet reflection",
      description: "No phone, no distractions. Just be with your thoughts.",
      contexts: { challenges: ["overwhelm", "focus"] },
      priority: 3,
      estimateMinutes: 5,
    },
    {
      title: "Write a letter to your future self (1 year from now)",
      description: "What do you hope to have accomplished? How do you want to feel?",
      contexts: { transitions: ["job", "move", "divorce"] },
      priority: 3,
      estimateMinutes: 20,
    },
    {
      title: "Identify one way you can help someone this week",
      description: "Small acts of service create meaning and connection",
      priority: 4,
      estimateMinutes: 10,
    },
  ],
};

// Map challenges to recommended system templates
const CHALLENGE_TO_SYSTEMS: Record<ChallengeId, string[]> = {
  time: ["tpl_deep_work", "tpl_weekly_reset"],
  energy: ["tpl_morning_routine", "tpl_better_sleep"],
  focus: ["tpl_deep_work", "tpl_meditation_habit"],
  balance: ["tpl_quality_time", "tpl_daily_reflection"],
  direction: ["tpl_purpose_alignment", "tpl_daily_reflection"],
  motivation: ["tpl_gratitude_practice", "tpl_learning_growth"],
  consistency: ["tpl_morning_routine", "tpl_weekly_reset"],
  overwhelm: ["tpl_weekly_reset", "tpl_meditation_habit"],
};

// Generate welcome message based on context
function generateWelcomeMessage(input: StarterContentInput): string {
  const { name, majorTransition, primaryChallenges } = input;

  let message = `Welcome to Looops, ${name}! `;

  if (majorTransition !== "none") {
    message += "We see you're going through a significant transition. ";
    message += "Looops is here to help you stay grounded and move forward intentionally. ";
  } else {
    message += "Your Personal Operating System is ready. ";
  }

  if (primaryChallenges.includes("overwhelm")) {
    message += "Start small - focus on just one or two tasks today. You don't have to do everything at once.";
  } else if (primaryChallenges.includes("direction")) {
    message += "We've set you up with some starter tasks to help you gain clarity and momentum.";
  } else if (primaryChallenges.includes("consistency")) {
    message += "Building consistency takes time. Focus on showing up, even in small ways.";
  } else {
    message += "We've created some starter tasks to help you get going. Make them your own.";
  }

  return message;
}

// Check if a task matches the user's context
function taskMatchesContext(
  task: typeof STARTER_TASK_TEMPLATES["Health"][0],
  input: StarterContentInput
): boolean {
  const { contexts } = task;
  if (!contexts) return true; // No context restrictions = always include

  let matches = true;

  // Check challenges
  if (contexts.challenges && contexts.challenges.length > 0) {
    matches = matches && contexts.challenges.some(c => input.primaryChallenges.includes(c));
  }

  // Check life season
  if (contexts.lifeSeason && contexts.lifeSeason.length > 0) {
    matches = matches && contexts.lifeSeason.includes(input.lifeSeason);
  }

  // Check transitions
  if (contexts.transitions && contexts.transitions.length > 0) {
    matches = matches && contexts.transitions.includes(input.majorTransition);
  }

  // Check loop states
  if (contexts.states && contexts.states.length > 0) {
    // This would need the loop ID, but for simplicity we skip for now
  }

  return matches;
}

// Generate starter tasks based on input
function generateStarterTasks(input: StarterContentInput): Task[] {
  const tasks: Task[] = [];
  const today = new Date().toISOString().split("T")[0];

  // For each loop, select 1-2 relevant tasks based on state
  for (const loopId of ALL_LOOPS) {
    const loopState = input.loopStates[loopId];
    const loopTemplates = STARTER_TASK_TEMPLATES[loopId];

    // Filter templates by context match
    const relevantTemplates = loopTemplates.filter(t => taskMatchesContext(t, input));

    // Determine how many tasks based on loop state
    let taskCount: number;
    switch (loopState) {
      case "BUILD":
        taskCount = 2; // Active focus = more tasks
        break;
      case "MAINTAIN":
        taskCount = 1; // Steady state = maintenance tasks
        break;
      case "RECOVER":
        taskCount = 1; // Recovery = light load
        break;
      case "HIBERNATE":
        taskCount = 0; // Hibernating = no new tasks
        break;
      default:
        taskCount = 1;
    }

    // Select top tasks (prioritize context matches, then general)
    const selectedTemplates = relevantTemplates.slice(0, taskCount);

    // If we didn't get enough from context-matched, fill from general
    if (selectedTemplates.length < taskCount) {
      const generalTemplates = loopTemplates
        .filter(t => !t.contexts)
        .slice(0, taskCount - selectedTemplates.length);
      selectedTemplates.push(...generalTemplates);
    }

    // Create actual tasks from templates
    for (const template of selectedTemplates) {
      const task = createTask(template.title, loopId, {
        description: template.description,
        priority: (template.priority || 3) as Priority,
        status: "todo",
        dueDate: today,
        estimateMinutes: template.estimateMinutes,
        source: "generated",
        requiredState: loopState,
      });
      tasks.push(task);
    }
  }

  return tasks;
}

// Get suggested systems based on challenges
function getSuggestedSystems(input: StarterContentInput): SystemTemplate[] {
  const systemIds = new Set<string>();

  // Add systems for each challenge
  for (const challenge of input.primaryChallenges) {
    const suggestions = CHALLENGE_TO_SYSTEMS[challenge] || [];
    for (const id of suggestions) {
      systemIds.add(id);
    }
  }

  // Get the actual system templates
  const systems = SYSTEM_TEMPLATES.filter(s => systemIds.has(s.id));

  // Return top 3 most relevant
  return systems.slice(0, 3);
}

// Main export: Generate all starter content
export function generateStarterContent(input: StarterContentInput): StarterContentOutput {
  return {
    tasks: generateStarterTasks(input),
    suggestedSystems: getSuggestedSystems(input),
    welcomeMessage: generateWelcomeMessage(input),
  };
}

// Export for use in onboarding completion
export default generateStarterContent;
