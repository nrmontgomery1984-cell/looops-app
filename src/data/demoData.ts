// Demo data for guest/demo mode
import { Task, Habit, BabysitterSession, Caregiver, Goal, Note, Routine } from "../types";

const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0];

export const DEMO_TASKS: Task[] = [
  { id: "demo_h1", title: "Morning yoga session", loop: "Health", subLoop: "Exercise", priority: 2, status: "done", order: 0, dueDate: today, createdAt: new Date().toISOString(), estimateMinutes: 30, requiredState: "MAINTAIN" },
  { id: "demo_h2", title: "Prep healthy lunches for the week", loop: "Health", subLoop: "Nutrition", priority: 1, status: "doing", order: 1, dueDate: today, createdAt: new Date().toISOString(), estimateMinutes: 60, requiredState: "BUILD" },
  { id: "demo_h3", title: "Schedule annual checkup", loop: "Health", subLoop: "Medical", priority: 2, status: "todo", order: 2, dueDate: today, createdAt: new Date().toISOString(), estimateMinutes: 15, requiredState: "MAINTAIN" },
  { id: "demo_w1", title: "Review investment portfolio", loop: "Wealth", subLoop: "Investing", priority: 1, status: "todo", order: 3, dueDate: today, createdAt: new Date().toISOString(), estimateMinutes: 45, requiredState: "BUILD" },
  { id: "demo_w2", title: "Pay credit card bill", loop: "Wealth", subLoop: "Budgeting", priority: 1, status: "done", order: 4, dueDate: yesterday, createdAt: new Date().toISOString(), estimateMinutes: 10, requiredState: "MAINTAIN" },
  { id: "demo_f1", title: "Plan weekend family activity", loop: "Family", subLoop: "Quality Time", priority: 2, status: "todo", order: 5, dueDate: today, createdAt: new Date().toISOString(), estimateMinutes: 20, requiredState: "MAINTAIN" },
  { id: "demo_f2", title: "Call mom", loop: "Family", subLoop: "Extended Family", priority: 2, status: "todo", order: 6, dueDate: today, createdAt: new Date().toISOString(), estimateMinutes: 30, requiredState: "MAINTAIN" },
  { id: "demo_work1", title: "Finish quarterly report", loop: "Work", subLoop: "Projects", priority: 1, status: "doing", order: 7, dueDate: today, createdAt: new Date().toISOString(), estimateMinutes: 120, requiredState: "BUILD" },
  { id: "demo_work2", title: "1:1 with manager", loop: "Work", subLoop: "Career", priority: 2, status: "todo", order: 8, dueDate: today, createdAt: new Date().toISOString(), estimateMinutes: 30, requiredState: "MAINTAIN" },
  { id: "demo_fun1", title: "Read 30 pages", loop: "Fun", subLoop: "Hobbies", priority: 3, status: "todo", order: 9, dueDate: today, createdAt: new Date().toISOString(), estimateMinutes: 30, requiredState: "RECOVER" },
  { id: "demo_fun2", title: "Practice guitar", loop: "Fun", subLoop: "Hobbies", priority: 3, status: "todo", order: 10, dueDate: today, createdAt: new Date().toISOString(), estimateMinutes: 20, requiredState: "RECOVER" },
  { id: "demo_m1", title: "Laundry", loop: "Maintenance", subLoop: "Cleaning", priority: 2, status: "done", order: 11, dueDate: yesterday, createdAt: new Date().toISOString(), estimateMinutes: 60, requiredState: "MAINTAIN" },
  { id: "demo_m2", title: "Grocery shopping", loop: "Maintenance", subLoop: "Errands", priority: 2, status: "todo", order: 12, dueDate: today, createdAt: new Date().toISOString(), estimateMinutes: 45, requiredState: "MAINTAIN" },
  { id: "demo_mean1", title: "Morning meditation", loop: "Meaning", subLoop: "Mindfulness", priority: 2, status: "done", order: 13, dueDate: today, createdAt: new Date().toISOString(), estimateMinutes: 15, requiredState: "MAINTAIN" },
  { id: "demo_mean2", title: "Gratitude journaling", loop: "Meaning", subLoop: "Reflection", priority: 3, status: "todo", order: 14, dueDate: today, createdAt: new Date().toISOString(), estimateMinutes: 10, requiredState: "MAINTAIN" },
];

export const DEMO_HABITS: Habit[] = [
  { id: "demo_hab1", title: "Morning meditation", loop: "Meaning", frequency: "daily", streak: 12, longestStreak: 14, totalCompletions: 45, type: "build", cue: { type: "time", value: "6:00 AM" }, response: "Sit for 10 minutes with guided meditation", status: "active", createdAt: twoDaysAgo, updatedAt: twoDaysAgo },
  { id: "demo_hab2", title: "Exercise", loop: "Health", frequency: "daily", streak: 8, longestStreak: 12, totalCompletions: 38, type: "build", cue: { type: "time", value: "7:00 AM" }, response: "30 minutes of movement", status: "active", createdAt: twoDaysAgo, updatedAt: twoDaysAgo },
  { id: "demo_hab3", title: "Read 20 pages", loop: "Fun", frequency: "daily", streak: 5, longestStreak: 10, totalCompletions: 25, type: "build", cue: { type: "time", value: "9:00 PM" }, response: "Read before bed", status: "active", createdAt: twoDaysAgo, updatedAt: twoDaysAgo },
  { id: "demo_hab4", title: "Review finances", loop: "Wealth", frequency: "weekly", streak: 4, longestStreak: 6, totalCompletions: 12, type: "build", cue: { type: "time", value: "Sunday 10:00 AM" }, response: "Check accounts and budget", status: "active", createdAt: twoDaysAgo, updatedAt: twoDaysAgo },
  { id: "demo_hab5", title: "Family dinner", loop: "Family", frequency: "daily", streak: 3, longestStreak: 8, totalCompletions: 20, type: "build", cue: { type: "time", value: "6:30 PM" }, response: "Eat together at the table", status: "active", createdAt: twoDaysAgo, updatedAt: twoDaysAgo },
  { id: "demo_hab6", title: "Inbox zero", loop: "Work", frequency: "daily", streak: 6, longestStreak: 10, totalCompletions: 30, type: "build", cue: { type: "time", value: "5:00 PM" }, response: "Process all emails before end of day", status: "active", createdAt: twoDaysAgo, updatedAt: twoDaysAgo },
];

export const DEMO_HABIT_COMPLETIONS: Record<string, string[]> = {
  "demo_hab1": [today, yesterday, twoDaysAgo],
  "demo_hab2": [today, yesterday],
  "demo_hab3": [yesterday, twoDaysAgo],
  "demo_hab4": [yesterday],
  "demo_hab5": [today, yesterday, twoDaysAgo],
  "demo_hab6": [today, yesterday],
};

export const DEMO_CAREGIVERS: Caregiver[] = [
  { id: "demo_cg1", name: "Sarah", hourlyRate: 18, active: true, createdAt: twoDaysAgo, updatedAt: twoDaysAgo },
  { id: "demo_cg2", name: "Mike", hourlyRate: 15, active: true, createdAt: twoDaysAgo, updatedAt: twoDaysAgo },
];

export const DEMO_BABYSITTER_SESSIONS: BabysitterSession[] = [
  { id: "demo_bs1", caregiverId: "demo_cg1", caregiverName: "Sarah", date: yesterday, hours: 4, rateAtTime: 18, amount: 72, paymentStatus: "unpaid", createdAt: yesterday },
  { id: "demo_bs2", caregiverId: "demo_cg2", caregiverName: "Mike", date: twoDaysAgo, hours: 3, rateAtTime: 15, amount: 45, paymentStatus: "paid", createdAt: twoDaysAgo },
  { id: "demo_bs3", caregiverId: "demo_cg1", caregiverName: "Sarah", date: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0], hours: 5, rateAtTime: 18, amount: 90, paymentStatus: "unpaid", createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
];

const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

export const DEMO_GOALS: Goal[] = [
  {
    id: "demo_goal1",
    title: "Run a half marathon",
    description: "Train and complete a half marathon by end of year",
    loop: "Health",
    timeframe: "annual",
    status: "active",
    progress: 35,
    childGoalIds: [],
    startDate: yearStart,
    targetDate: new Date(new Date().getFullYear(), 11, 31).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo_goal2",
    title: "Save $10,000",
    description: "Build emergency fund",
    loop: "Wealth",
    timeframe: "annual",
    status: "active",
    progress: 60,
    childGoalIds: [],
    startDate: yearStart,
    targetDate: new Date(new Date().getFullYear(), 11, 31).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo_goal3",
    title: "Weekly date nights",
    description: "Prioritize relationship with consistent date nights",
    loop: "Family",
    timeframe: "quarterly",
    status: "active",
    progress: 75,
    childGoalIds: [],
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    targetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_NOTES: Note[] = [
  {
    id: "demo_note1",
    title: "Running Notes",
    content: "Remember to stretch before and after runs. Current pace: 9:30/mile",
    loop: "Health",
    pinned: false,
    tags: ["training", "running"],
    createdAt: yesterday,
    updatedAt: yesterday,
  },
  {
    id: "demo_note2",
    title: "Budget Breakdown",
    content: "Budget categories: Housing 30%, Food 15%, Transportation 10%, Savings 20%",
    loop: "Wealth",
    pinned: true,
    tags: ["budget", "finance"],
    createdAt: twoDaysAgo,
    updatedAt: twoDaysAgo,
  },
];

export const DEMO_ROUTINES: Routine[] = [
  {
    id: "demo_routine1",
    title: "Morning Routine",
    description: "Start the day right with mindfulness and movement",
    icon: "🌅",
    steps: [
      { id: "mr1", title: "Morning meditation", loop: "Meaning", estimateMinutes: 10, order: 0 },
      { id: "mr2", title: "Stretch and warm up", loop: "Health", estimateMinutes: 5, order: 1 },
      { id: "mr3", title: "Exercise", loop: "Health", estimateMinutes: 30, order: 2 },
      { id: "mr4", title: "Shower and get ready", loop: "Maintenance", estimateMinutes: 15, order: 3 },
      { id: "mr5", title: "Healthy breakfast", loop: "Health", estimateMinutes: 15, order: 4 },
      { id: "mr6", title: "Review today's priorities", loop: "Work", estimateMinutes: 5, order: 5 },
    ],
    schedule: { frequency: "daily", timeOfDay: "morning", specificTime: "06:30" },
    status: "active",
    streak: { currentStreak: 8, longestStreak: 14, totalCompletions: 42, completionRate: 85, lastCompletedDate: yesterday },
    createdAt: twoDaysAgo,
    updatedAt: twoDaysAgo,
  },
  {
    id: "demo_routine2",
    title: "Evening Wind Down",
    description: "Prepare for restful sleep",
    icon: "🌙",
    steps: [
      { id: "ew1", title: "Tidy up living space", loop: "Maintenance", estimateMinutes: 10, order: 0 },
      { id: "ew2", title: "Prepare tomorrow's clothes", loop: "Maintenance", estimateMinutes: 5, order: 1 },
      { id: "ew3", title: "Gratitude journaling", loop: "Meaning", estimateMinutes: 5, order: 2 },
      { id: "ew4", title: "Read before bed", loop: "Fun", estimateMinutes: 20, order: 3 },
      { id: "ew5", title: "Skincare routine", loop: "Health", estimateMinutes: 5, order: 4 },
    ],
    schedule: { frequency: "daily", timeOfDay: "night", specificTime: "21:00" },
    status: "active",
    streak: { currentStreak: 5, longestStreak: 10, totalCompletions: 28, completionRate: 70, lastCompletedDate: yesterday },
    createdAt: twoDaysAgo,
    updatedAt: twoDaysAgo,
  },
  {
    id: "demo_routine3",
    title: "Weekly Review",
    description: "Reflect on the week and plan ahead",
    icon: "📊",
    steps: [
      { id: "wr1", title: "Review completed tasks", loop: "Work", estimateMinutes: 10, order: 0 },
      { id: "wr2", title: "Check budget and spending", loop: "Wealth", estimateMinutes: 15, order: 1 },
      { id: "wr3", title: "Review fitness progress", loop: "Health", estimateMinutes: 5, order: 2 },
      { id: "wr4", title: "Plan family time", loop: "Family", estimateMinutes: 10, order: 3 },
      { id: "wr5", title: "Set next week's priorities", loop: "Work", estimateMinutes: 15, order: 4 },
      { id: "wr6", title: "Journal reflections", loop: "Meaning", estimateMinutes: 10, order: 5 },
    ],
    schedule: { frequency: "weekly", daysOfWeek: [0], timeOfDay: "morning", specificTime: "09:00" },
    status: "active",
    streak: { currentStreak: 3, longestStreak: 6, totalCompletions: 12, completionRate: 80, lastCompletedDate: new Date(Date.now() - 86400000 * 7).toISOString().split("T")[0] },
    createdAt: twoDaysAgo,
    updatedAt: twoDaysAgo,
  },
  {
    id: "demo_routine4",
    title: "Work Focus Block",
    description: "Deep work session for important tasks",
    icon: "💼",
    steps: [
      { id: "wf1", title: "Close distracting apps", loop: "Work", estimateMinutes: 2, order: 0 },
      { id: "wf2", title: "Set timer for 50 minutes", loop: "Work", estimateMinutes: 1, order: 1 },
      { id: "wf3", title: "Deep work on priority task", loop: "Work", estimateMinutes: 50, order: 2 },
      { id: "wf4", title: "5-minute break", loop: "Health", estimateMinutes: 5, order: 3, optional: true },
      { id: "wf5", title: "Quick stretch", loop: "Health", estimateMinutes: 2, order: 4, optional: true },
    ],
    schedule: { frequency: "weekdays", timeOfDay: "morning", specificTime: "09:00" },
    dayTypes: ["regular"],
    status: "active",
    streak: { currentStreak: 4, longestStreak: 8, totalCompletions: 20, completionRate: 75 },
    createdAt: twoDaysAgo,
    updatedAt: twoDaysAgo,
  },
];

export const DEMO_USER_PROFILE = {
  id: "demo_user",
  name: "Demo User",
  lifeSeason: "Building Career",
  primaryChallenge: "Work-Life Balance",
  createdAt: new Date().toISOString(),
};

export const DEMO_PROTOTYPE = {
  id: "demo_prototype",
  userId: "demo_user",
  archetypeName: "The Balanced Achiever",
  archetypeDescription: "You strive for excellence while maintaining harmony across all life areas. Your strength lies in systematic thinking and consistent progress.",
  sliders: {
    introvert_extrovert: 55,
    intuitive_analytical: 60,
    spontaneous_structured: 70,
    risk_averse_seeking: 45,
    specialist_generalist: 50,
    independent_collaborative: 55,
    patient_urgent: 50,
    pragmatic_idealistic: 55,
    minimalist_maximalist: 40,
    private_public: 45,
    harmonious_confrontational: 60,
    process_outcome: 55,
    conservative_experimental: 50,
    humble_confident: 55,
    reactive_proactive: 65,
  },
  coreValues: ["growth", "balance", "family"],
  strengthAreas: ["Health", "Work"],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
