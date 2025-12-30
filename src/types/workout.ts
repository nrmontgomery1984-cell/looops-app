// Workout Types - Gym Profile, Exercises, Workout Planning
import { LoopId } from "./core";

// ==================== Gym Profile ====================

export type FitnessLevel = "beginner" | "intermediate" | "advanced" | "athlete";

export type EquipmentCategory = "bodyweight" | "basic" | "kettlebell" | "barbell" | "machines" | "cardio" | "specialty";

export interface GymEquipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  owned: boolean;
  notes?: string;  // e.g., "16kg and 24kg"
}

export interface GymProfile {
  id: string;
  userId: string;
  fitnessLevel: FitnessLevel;
  equipment: GymEquipment[];
  goals: string[];           // e.g., "BJJ conditioning", "strength", "mobility"
  limitations: string[];     // e.g., "bad knee", "quiet workouts only"
  preferredDuration: number; // Default workout duration in minutes
  daysPerWeek: number;       // Target training days per week
  createdAt: string;
  updatedAt: string;
}

// Default equipment lists
export const DEFAULT_EQUIPMENT: Omit<GymEquipment, "owned">[] = [
  // Bodyweight (pre-checked by default)
  { id: "floor_space", name: "Floor space", category: "bodyweight" },
  { id: "wall", name: "Wall", category: "bodyweight" },

  // Basic
  { id: "pull_up_bar", name: "Pull-up bar", category: "basic" },
  { id: "dip_bars", name: "Dip bars / parallettes", category: "basic" },
  { id: "gymnastics_rings", name: "Gymnastics rings", category: "basic" },
  { id: "resistance_bands", name: "Resistance bands", category: "basic" },
  { id: "jump_rope", name: "Jump rope", category: "basic" },
  { id: "ab_wheel", name: "Ab wheel", category: "basic" },
  { id: "foam_roller", name: "Foam roller", category: "basic" },
  { id: "yoga_mat", name: "Yoga mat", category: "basic" },

  // Kettlebells
  { id: "kettlebell_light", name: "Kettlebell (light: 8-12kg)", category: "kettlebell" },
  { id: "kettlebell_medium", name: "Kettlebell (medium: 16-20kg)", category: "kettlebell" },
  { id: "kettlebell_heavy", name: "Kettlebell (heavy: 24-32kg)", category: "kettlebell" },

  // Barbells & Plates
  { id: "barbell", name: "Barbell (Olympic)", category: "barbell" },
  { id: "squat_rack", name: "Squat rack / Power cage", category: "barbell" },
  { id: "bench", name: "Flat bench", category: "barbell" },
  { id: "incline_bench", name: "Incline bench", category: "barbell" },
  { id: "weight_plates", name: "Weight plates", category: "barbell" },
  { id: "dumbbells", name: "Dumbbells (adjustable or set)", category: "barbell" },
  { id: "ez_curl_bar", name: "EZ curl bar", category: "barbell" },
  { id: "trap_bar", name: "Trap bar / Hex bar", category: "barbell" },

  // Machines
  { id: "cable_machine", name: "Cable machine", category: "machines" },
  { id: "lat_pulldown", name: "Lat pulldown machine", category: "machines" },
  { id: "leg_press", name: "Leg press", category: "machines" },
  { id: "leg_curl", name: "Leg curl machine", category: "machines" },
  { id: "leg_extension", name: "Leg extension machine", category: "machines" },
  { id: "smith_machine", name: "Smith machine", category: "machines" },

  // Cardio
  { id: "treadmill", name: "Treadmill", category: "cardio" },
  { id: "rower", name: "Rowing machine", category: "cardio" },
  { id: "bike", name: "Stationary bike", category: "cardio" },
  { id: "assault_bike", name: "Assault / Air bike", category: "cardio" },
  { id: "ski_erg", name: "Ski erg", category: "cardio" },

  // Specialty
  { id: "weighted_vest", name: "Weighted vest", category: "specialty" },
  { id: "sandbag", name: "Sandbag", category: "specialty" },
  { id: "battle_ropes", name: "Battle ropes", category: "specialty" },
  { id: "plyo_box", name: "Plyo box", category: "specialty" },
  { id: "landmine", name: "Landmine attachment", category: "specialty" },
  { id: "sled", name: "Sled / Prowler", category: "specialty" },
  { id: "heavy_bag", name: "Heavy bag (boxing)", category: "specialty" },
  { id: "grappling_dummy", name: "Grappling dummy", category: "specialty" },
];

export const GOAL_OPTIONS = [
  { id: "strength", label: "Build strength" },
  { id: "muscle", label: "Build muscle" },
  { id: "endurance", label: "Improve endurance" },
  { id: "conditioning", label: "Better conditioning" },
  { id: "bjj", label: "BJJ / Grappling performance" },
  { id: "mobility", label: "Improve mobility" },
  { id: "weight_loss", label: "Lose weight" },
  { id: "general_fitness", label: "General fitness" },
  { id: "injury_prevention", label: "Injury prevention" },
  { id: "sport_specific", label: "Sport-specific training" },
];

export const LIMITATION_OPTIONS = [
  { id: "quiet_only", label: "Must be quiet (no jumping/dropping)" },
  { id: "indoor_only", label: "Indoor only" },
  { id: "time_limited", label: "Limited time (30 min max)" },
  { id: "bad_back", label: "Back issues" },
  { id: "bad_knees", label: "Knee issues" },
  { id: "bad_shoulders", label: "Shoulder issues" },
  { id: "no_impact", label: "No high-impact exercises" },
];

export function createDefaultGymProfile(userId: string): GymProfile {
  const now = new Date().toISOString();
  return {
    id: `gym_${Date.now()}`,
    userId,
    fitnessLevel: "intermediate",
    equipment: DEFAULT_EQUIPMENT.map(eq => ({
      ...eq,
      owned: eq.category === "bodyweight",
    })),
    goals: [],
    limitations: [],
    preferredDuration: 45,
    daysPerWeek: 3,
    createdAt: now,
    updatedAt: now,
  };
}

// ==================== Exercise Types ====================

export type ExerciseDifficulty = "beginner" | "intermediate" | "advanced" | "elite";
export type MuscleGroup =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps" | "forearms"
  | "core" | "quads" | "hamstrings" | "glutes" | "calves"
  | "full_body" | "grip";
export type MovementPattern =
  | "push" | "pull" | "hinge" | "squat" | "lunge" | "carry"
  | "rotation" | "isometric" | "plyometric" | "cardio";
export type ExerciseCategory =
  | "strength" | "power" | "hypertrophy" | "endurance"
  | "mobility" | "stability" | "conditioning" | "sport_specific";

export interface ExerciseSource {
  type: "website" | "youtube" | "book" | "manual" | "coach";
  name: string;
}

export interface ExerciseProgression {
  easier: string[];   // Exercise IDs or names for easier variations
  harder: string[];   // Exercise IDs or names for harder variations
}

export interface Exercise {
  id: string;
  name: string;
  slug: string;
  description?: string;
  source?: ExerciseSource;
  sourceUrl?: string;

  // Classification
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  movementPattern: MovementPattern;
  category: ExerciseCategory;
  difficulty: ExerciseDifficulty;

  // Requirements
  requiredEquipment: string[];  // Equipment IDs
  optionalEquipment?: string[];
  spaceRequired?: "minimal" | "moderate" | "large";
  noiseLevel?: "silent" | "quiet" | "moderate" | "loud";

  // Execution
  defaultSets?: number;
  defaultReps?: string;         // "8-12" or "30s" for time
  defaultRest?: number;         // seconds
  tempo?: string;               // e.g., "3-1-2-0" (eccentric-pause-concentric-pause)

  // Coaching
  cues: string[];               // Key coaching points
  commonMistakes?: string[];
  variations?: string[];
  progressions?: ExerciseProgression;

  // Media
  imageUrl?: string;
  videoUrl?: string;

  // User data
  tags: string[];
  userNotes?: string;
  isFavorite: boolean;
  timesPerformed: number;
  lastPerformed?: string;
  personalRecord?: {
    weight?: number;
    reps?: number;
    time?: number;
    date: string;
  };

  createdAt: string;
  updatedAt: string;
}

// ==================== Training Tip Types ====================

export type TipCategory =
  | "technique"      // Form and execution
  | "programming"    // Sets, reps, progression
  | "recovery"       // Rest, nutrition, sleep
  | "mindset"        // Mental aspects
  | "safety"         // Injury prevention
  | "sport_specific" // BJJ, etc.
  | "science";       // Research-backed info

export type TrainingTipSubjectType = "exercise" | "muscle_group" | "movement" | "concept" | "equipment";

export interface TrainingTip {
  id: string;
  content: string;
  source: string;
  sourceUrl?: string;
  category: TipCategory;
  appliesToExercises?: string[];     // Exercise IDs
  appliesToEquipment?: string[];
  appliesToLevel?: FitnessLevel[];
  isHighlighted?: boolean;
  addedAt?: string;
}

export interface TrainingTipEntry {
  id: string;
  slug: string;
  subject: string;
  aliases?: string[];
  subjectType: TrainingTipSubjectType;
  summary?: string;
  tips: TrainingTip[];
  relatedExerciseIds: string[];
  relatedTipIds?: string[];
  lastUpdated: string;
  sourcesCited: string[];
  userNotes?: string;
  isFavorite?: boolean;
}

// Helper functions for training tips
export function generateTrainingTipSlug(subject: string): string {
  return subject
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createTrainingTipEntry(data: Partial<TrainingTipEntry>): TrainingTipEntry {
  const subject = data.subject || "Untitled Training Tip";
  return {
    id: data.id || `tip_${Date.now()}`,
    slug: data.slug || generateTrainingTipSlug(subject),
    subject,
    aliases: data.aliases || [],
    subjectType: data.subjectType || "concept",
    summary: data.summary,
    tips: data.tips || [],
    relatedExerciseIds: data.relatedExerciseIds || [],
    relatedTipIds: data.relatedTipIds || [],
    lastUpdated: new Date().toISOString(),
    sourcesCited: data.sourcesCited || [],
    userNotes: data.userNotes,
    isFavorite: data.isFavorite || false,
  };
}

// ==================== Workout Plan Types ====================

export interface PlannedExercise {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string;              // "8-12" or "30s" or "AMRAP"
  weight?: number;           // in lbs or kg based on user preference
  rest: number;              // seconds
  notes?: string;
  completed?: boolean;
  actualSets?: number;
  actualReps?: string;
  actualWeight?: number;
}

export interface WorkoutBlock {
  id: string;
  name: string;              // "Warm-up", "Main Work", "Finisher", etc.
  type: "warmup" | "strength" | "power" | "conditioning" | "accessory" | "cooldown";
  exercises: PlannedExercise[];
  restBetweenExercises?: number;
  notes?: string;
}

export interface PlannedWorkout {
  id: string;
  name: string;
  type: "lower" | "upper" | "full_body" | "push" | "pull" | "conditioning" | "mobility" | "sport_specific";
  targetDuration: number;     // minutes
  blocks: WorkoutBlock[];
  notes?: string;
  tags: string[];
}

export interface WorkoutPlanDay {
  date: string;
  dayOfWeek: string;
  workout?: PlannedWorkout;
  isRestDay?: boolean;
  contextFlags?: string[];    // "BJJ week", "Recovery day", etc.
}

export interface WorkoutPlan {
  id: string;
  name: string;
  weekOf: string;
  days: WorkoutPlanDay[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Workout Log Types ====================

export interface CompletedSet {
  setNumber: number;
  reps: number;
  weight?: number;
  rpe?: number;              // Rate of Perceived Exertion (1-10)
  notes?: string;
}

export interface CompletedExercise {
  exerciseId: string;
  exerciseName: string;
  sets: CompletedSet[];
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  date: string;
  plannedWorkoutId?: string;
  workoutName: string;
  workoutType: PlannedWorkout["type"];
  duration: number;           // actual minutes
  exercises: CompletedExercise[];
  overallNotes?: string;
  energyLevel?: 1 | 2 | 3 | 4 | 5;
  satisfactionRating?: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
}

// ==================== Workout State ====================

export interface WorkoutState {
  gymProfile: GymProfile | null;
  exercises: Exercise[];
  trainingTips: TrainingTipEntry[];
  workoutPlans: WorkoutPlan[];
  workoutLogs: WorkoutLog[];
  onboardingComplete: boolean;
}

export function getDefaultWorkoutState(): WorkoutState {
  return {
    gymProfile: null,
    exercises: [],
    trainingTips: [],
    workoutPlans: [],
    workoutLogs: [],
    onboardingComplete: false,
  };
}

// ==================== Helper Functions ====================

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createExercise(data: Partial<Exercise>): Exercise {
  const now = new Date().toISOString();
  return {
    id: data.id || `exercise_${Date.now()}`,
    name: data.name || "Untitled Exercise",
    slug: data.slug || generateSlug(data.name || "untitled"),
    description: data.description,
    source: data.source,
    sourceUrl: data.sourceUrl,
    primaryMuscles: data.primaryMuscles || [],
    secondaryMuscles: data.secondaryMuscles || [],
    movementPattern: data.movementPattern || "push",
    category: data.category || "strength",
    difficulty: data.difficulty || "intermediate",
    requiredEquipment: data.requiredEquipment || [],
    optionalEquipment: data.optionalEquipment,
    spaceRequired: data.spaceRequired,
    noiseLevel: data.noiseLevel,
    defaultSets: data.defaultSets || 3,
    defaultReps: data.defaultReps || "8-12",
    defaultRest: data.defaultRest || 90,
    tempo: data.tempo,
    cues: data.cues || [],
    commonMistakes: data.commonMistakes,
    variations: data.variations,
    progressions: data.progressions,
    imageUrl: data.imageUrl,
    videoUrl: data.videoUrl,
    tags: data.tags || [],
    userNotes: data.userNotes,
    isFavorite: data.isFavorite || false,
    timesPerformed: data.timesPerformed || 0,
    lastPerformed: data.lastPerformed,
    personalRecord: data.personalRecord,
    createdAt: data.createdAt || now,
    updatedAt: now,
  };
}

export function getDifficultyLabel(difficulty: ExerciseDifficulty): string {
  switch (difficulty) {
    case "beginner": return "Beginner";
    case "intermediate": return "Intermediate";
    case "advanced": return "Advanced";
    case "elite": return "Elite";
  }
}

export function getDifficultyColor(difficulty: ExerciseDifficulty): string {
  switch (difficulty) {
    case "beginner": return "#73A58C";      // Sage green
    case "intermediate": return "#F4B942";  // Amber
    case "advanced": return "#F27059";      // Coral
    case "elite": return "#b87fa8";         // Purple
  }
}

export function getMuscleGroupLabel(muscle: MuscleGroup): string {
  const labels: Record<MuscleGroup, string> = {
    chest: "Chest",
    back: "Back",
    shoulders: "Shoulders",
    biceps: "Biceps",
    triceps: "Triceps",
    forearms: "Forearms",
    core: "Core",
    quads: "Quads",
    hamstrings: "Hamstrings",
    glutes: "Glutes",
    calves: "Calves",
    full_body: "Full Body",
    grip: "Grip",
  };
  return labels[muscle];
}

export function getMovementPatternLabel(pattern: MovementPattern): string {
  const labels: Record<MovementPattern, string> = {
    push: "Push",
    pull: "Pull",
    hinge: "Hinge",
    squat: "Squat",
    lunge: "Lunge",
    carry: "Carry",
    rotation: "Rotation",
    isometric: "Isometric",
    plyometric: "Plyometric",
    cardio: "Cardio",
  };
  return labels[pattern];
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} min`;
}

export function getFitnessLevelLabel(level: FitnessLevel): string {
  switch (level) {
    case "beginner": return "Beginner";
    case "intermediate": return "Intermediate";
    case "advanced": return "Advanced";
    case "athlete": return "Athlete";
  }
}

export function getFitnessLevelDescription(level: FitnessLevel): string {
  switch (level) {
    case "beginner":
      return "New to structured training, learning proper form";
    case "intermediate":
      return "Consistent training for 1-2 years, solid foundation";
    case "advanced":
      return "Years of experience, comfortable with complex movements";
    case "athlete":
      return "Competitive athlete or professional-level conditioning";
  }
}

// ==================== Workout Generator Helpers ====================

export interface WorkoutConstraints {
  duration: number;           // max minutes
  equipment: string[];        // available equipment IDs
  focusAreas?: MuscleGroup[];
  excludeExercises?: string[];
  mustBeQuiet?: boolean;
  workoutType?: PlannedWorkout["type"];
  fitnessLevel?: FitnessLevel;
}

// Check if an exercise matches the given constraints
export function exerciseMatchesConstraints(
  exercise: Exercise,
  constraints: WorkoutConstraints
): boolean {
  // Check equipment requirements
  const hasRequiredEquipment = exercise.requiredEquipment.every(
    eq => constraints.equipment.includes(eq) || eq === "floor_space" || eq === "wall"
  );
  if (!hasRequiredEquipment) return false;

  // Check noise level
  if (constraints.mustBeQuiet && exercise.noiseLevel &&
      (exercise.noiseLevel === "moderate" || exercise.noiseLevel === "loud")) {
    return false;
  }

  // Check exclusions
  if (constraints.excludeExercises?.includes(exercise.id)) {
    return false;
  }

  // Check focus areas (if specified)
  if (constraints.focusAreas && constraints.focusAreas.length > 0) {
    const exerciseMuscles = [...exercise.primaryMuscles, ...exercise.secondaryMuscles];
    const matchesFocus = constraints.focusAreas.some(area => exerciseMuscles.includes(area));
    if (!matchesFocus) return false;
  }

  return true;
}

// ==================== Default Exercise Library ====================

export function getDefaultExercises(): Exercise[] {
  const now = new Date().toISOString();

  const exercises: Partial<Exercise>[] = [
    // === CHEST / PUSH ===
    {
      id: "push_up",
      name: "Push-Up",
      slug: "push-up",
      description: "Classic bodyweight push exercise for chest, shoulders, and triceps",
      primaryMuscles: ["chest"],
      secondaryMuscles: ["shoulders", "triceps", "core"],
      movementPattern: "push",
      category: "strength",
      difficulty: "beginner",
      requiredEquipment: ["floor_space"],
      spaceRequired: "minimal",
      noiseLevel: "silent",
      defaultSets: 3,
      defaultReps: "10-15",
      defaultRest: 60,
      cues: ["Hands shoulder-width apart", "Body in straight line", "Lower chest to floor", "Full arm extension at top"],
      tags: ["bodyweight", "push", "beginner-friendly"],
    },
    {
      id: "diamond_push_up",
      name: "Diamond Push-Up",
      slug: "diamond-push-up",
      description: "Narrow grip push-up emphasizing triceps",
      primaryMuscles: ["triceps"],
      secondaryMuscles: ["chest", "shoulders"],
      movementPattern: "push",
      category: "strength",
      difficulty: "intermediate",
      requiredEquipment: ["floor_space"],
      spaceRequired: "minimal",
      noiseLevel: "silent",
      defaultSets: 3,
      defaultReps: "8-12",
      defaultRest: 60,
      cues: ["Form diamond with hands", "Elbows close to body", "Lower chest to hands"],
      tags: ["bodyweight", "triceps", "push"],
    },
    {
      id: "dips",
      name: "Dips",
      slug: "dips",
      description: "Compound pushing exercise for chest and triceps",
      primaryMuscles: ["chest", "triceps"],
      secondaryMuscles: ["shoulders"],
      movementPattern: "push",
      category: "strength",
      difficulty: "intermediate",
      requiredEquipment: ["dip_bars"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "8-12",
      defaultRest: 90,
      cues: ["Lean slightly forward for chest focus", "Control the descent", "Full lockout at top"],
      tags: ["compound", "push", "upper-body"],
    },
    {
      id: "bench_press",
      name: "Barbell Bench Press",
      slug: "bench-press",
      description: "Fundamental chest pressing movement with barbell",
      primaryMuscles: ["chest"],
      secondaryMuscles: ["shoulders", "triceps"],
      movementPattern: "push",
      category: "strength",
      difficulty: "intermediate",
      requiredEquipment: ["barbell", "bench", "squat_rack"],
      noiseLevel: "moderate",
      defaultSets: 4,
      defaultReps: "5-8",
      defaultRest: 120,
      cues: ["Arch back, retract shoulders", "Bar touches mid-chest", "Drive feet into floor", "Full lockout"],
      tags: ["barbell", "compound", "strength"],
    },
    {
      id: "dumbbell_press",
      name: "Dumbbell Bench Press",
      slug: "dumbbell-bench-press",
      description: "Dumbbell pressing for chest with greater range of motion",
      primaryMuscles: ["chest"],
      secondaryMuscles: ["shoulders", "triceps"],
      movementPattern: "push",
      category: "strength",
      difficulty: "intermediate",
      requiredEquipment: ["dumbbells", "bench"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "8-12",
      defaultRest: 90,
      cues: ["Control the dumbbells", "Lower with elbows at 45 degrees", "Press up and slightly in"],
      tags: ["dumbbell", "compound", "hypertrophy"],
    },
    {
      id: "overhead_press",
      name: "Overhead Press",
      slug: "overhead-press",
      description: "Standing barbell press for shoulder strength",
      primaryMuscles: ["shoulders"],
      secondaryMuscles: ["triceps", "core"],
      movementPattern: "push",
      category: "strength",
      difficulty: "intermediate",
      requiredEquipment: ["barbell", "squat_rack"],
      noiseLevel: "moderate",
      defaultSets: 4,
      defaultReps: "5-8",
      defaultRest: 120,
      cues: ["Squeeze glutes and brace core", "Bar travels straight up", "Head through at lockout"],
      tags: ["barbell", "compound", "strength"],
    },

    // === BACK / PULL ===
    {
      id: "pull_up",
      name: "Pull-Up",
      slug: "pull-up",
      description: "Fundamental pulling exercise for back and biceps",
      primaryMuscles: ["back"],
      secondaryMuscles: ["biceps", "forearms"],
      movementPattern: "pull",
      category: "strength",
      difficulty: "intermediate",
      requiredEquipment: ["pull_up_bar"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "5-10",
      defaultRest: 90,
      cues: ["Full dead hang at bottom", "Pull elbows down and back", "Chin over bar", "Control descent"],
      tags: ["bodyweight", "compound", "upper-body"],
    },
    {
      id: "chin_up",
      name: "Chin-Up",
      slug: "chin-up",
      description: "Supinated grip pull emphasizing biceps",
      primaryMuscles: ["back", "biceps"],
      secondaryMuscles: ["forearms"],
      movementPattern: "pull",
      category: "strength",
      difficulty: "intermediate",
      requiredEquipment: ["pull_up_bar"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "6-10",
      defaultRest: 90,
      cues: ["Palms facing you", "Pull chest to bar", "Full extension at bottom"],
      tags: ["bodyweight", "compound", "biceps"],
    },
    {
      id: "inverted_row",
      name: "Inverted Row",
      slug: "inverted-row",
      description: "Horizontal pulling for back, easier than pull-ups",
      primaryMuscles: ["back"],
      secondaryMuscles: ["biceps", "core"],
      movementPattern: "pull",
      category: "strength",
      difficulty: "beginner",
      requiredEquipment: ["gymnastics_rings"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "10-15",
      defaultRest: 60,
      cues: ["Body in straight line", "Pull chest to rings", "Squeeze shoulder blades"],
      tags: ["bodyweight", "beginner-friendly", "rows"],
    },
    {
      id: "barbell_row",
      name: "Barbell Row",
      slug: "barbell-row",
      description: "Bent-over rowing movement for back thickness",
      primaryMuscles: ["back"],
      secondaryMuscles: ["biceps", "forearms", "core"],
      movementPattern: "pull",
      category: "strength",
      difficulty: "intermediate",
      requiredEquipment: ["barbell"],
      noiseLevel: "moderate",
      defaultSets: 4,
      defaultReps: "6-10",
      defaultRest: 90,
      cues: ["Hinge at hips", "Keep back flat", "Pull to belly button", "Squeeze at top"],
      tags: ["barbell", "compound", "back-thickness"],
    },
    {
      id: "dumbbell_row",
      name: "Single-Arm Dumbbell Row",
      slug: "dumbbell-row",
      description: "Unilateral rowing for back with dumbbell",
      primaryMuscles: ["back"],
      secondaryMuscles: ["biceps", "forearms"],
      movementPattern: "pull",
      category: "strength",
      difficulty: "beginner",
      requiredEquipment: ["dumbbells", "bench"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "10-12",
      defaultRest: 60,
      cues: ["Support on bench", "Pull elbow to hip", "Full stretch at bottom"],
      tags: ["dumbbell", "unilateral", "rows"],
    },
    {
      id: "face_pull",
      name: "Face Pull",
      slug: "face-pull",
      description: "Rear delt and upper back exercise for shoulder health",
      primaryMuscles: ["shoulders"],
      secondaryMuscles: ["back"],
      movementPattern: "pull",
      category: "strength",
      difficulty: "beginner",
      requiredEquipment: ["cable_machine"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "15-20",
      defaultRest: 45,
      cues: ["Pull to face level", "Externally rotate at end", "Squeeze shoulder blades"],
      tags: ["cable", "rear-delts", "prehab"],
    },

    // === LEGS / SQUAT ===
    {
      id: "squat",
      name: "Barbell Back Squat",
      slug: "back-squat",
      description: "Foundational lower body strength exercise",
      primaryMuscles: ["quads", "glutes"],
      secondaryMuscles: ["hamstrings", "core"],
      movementPattern: "squat",
      category: "strength",
      difficulty: "intermediate",
      requiredEquipment: ["barbell", "squat_rack"],
      noiseLevel: "moderate",
      defaultSets: 4,
      defaultReps: "5-8",
      defaultRest: 180,
      cues: ["Brace core, chest up", "Break at hips and knees", "Depth to parallel or below", "Drive through heels"],
      tags: ["barbell", "compound", "legs"],
    },
    {
      id: "goblet_squat",
      name: "Goblet Squat",
      slug: "goblet-squat",
      description: "Front-loaded squat with kettlebell or dumbbell",
      primaryMuscles: ["quads", "glutes"],
      secondaryMuscles: ["core"],
      movementPattern: "squat",
      category: "strength",
      difficulty: "beginner",
      requiredEquipment: ["kettlebell_medium"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "10-15",
      defaultRest: 60,
      cues: ["Hold weight at chest", "Elbows inside knees at bottom", "Stay upright"],
      tags: ["kettlebell", "beginner-friendly", "legs"],
    },
    {
      id: "bodyweight_squat",
      name: "Bodyweight Squat",
      slug: "bodyweight-squat",
      description: "Basic squat pattern without load",
      primaryMuscles: ["quads", "glutes"],
      secondaryMuscles: ["hamstrings", "core"],
      movementPattern: "squat",
      category: "strength",
      difficulty: "beginner",
      requiredEquipment: ["floor_space"],
      spaceRequired: "minimal",
      noiseLevel: "silent",
      defaultSets: 3,
      defaultReps: "15-20",
      defaultRest: 45,
      cues: ["Arms forward for balance", "Weight in heels", "Full depth"],
      tags: ["bodyweight", "beginner-friendly", "legs"],
    },
    {
      id: "leg_press",
      name: "Leg Press",
      slug: "leg-press",
      description: "Machine-based quad-dominant leg exercise",
      primaryMuscles: ["quads"],
      secondaryMuscles: ["glutes", "hamstrings"],
      movementPattern: "squat",
      category: "strength",
      difficulty: "beginner",
      requiredEquipment: ["leg_press"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "10-15",
      defaultRest: 90,
      cues: ["Feet shoulder width on platform", "Don't lock out knees", "Full range of motion"],
      tags: ["machine", "quads", "beginner-friendly"],
    },

    // === LEGS / HINGE ===
    {
      id: "deadlift",
      name: "Conventional Deadlift",
      slug: "deadlift",
      description: "Full body pulling movement from the floor",
      primaryMuscles: ["back", "hamstrings", "glutes"],
      secondaryMuscles: ["quads", "forearms", "core"],
      movementPattern: "hinge",
      category: "strength",
      difficulty: "intermediate",
      requiredEquipment: ["barbell"],
      noiseLevel: "loud",
      defaultSets: 4,
      defaultReps: "3-6",
      defaultRest: 180,
      cues: ["Bar over mid-foot", "Chest up, back flat", "Push floor away", "Lockout with hips"],
      tags: ["barbell", "compound", "strength"],
    },
    {
      id: "romanian_deadlift",
      name: "Romanian Deadlift",
      slug: "romanian-deadlift",
      description: "Hip hinge for hamstrings with constant tension",
      primaryMuscles: ["hamstrings", "glutes"],
      secondaryMuscles: ["back", "core"],
      movementPattern: "hinge",
      category: "strength",
      difficulty: "intermediate",
      requiredEquipment: ["barbell"],
      noiseLevel: "moderate",
      defaultSets: 3,
      defaultReps: "8-12",
      defaultRest: 90,
      cues: ["Soft knee bend", "Hinge at hips", "Feel hamstring stretch", "Squeeze glutes at top"],
      tags: ["barbell", "hamstrings", "hinge"],
    },
    {
      id: "kettlebell_swing",
      name: "Kettlebell Swing",
      slug: "kettlebell-swing",
      description: "Explosive hip hinge for power and conditioning",
      primaryMuscles: ["glutes", "hamstrings"],
      secondaryMuscles: ["core", "back", "shoulders"],
      movementPattern: "hinge",
      category: "power",
      difficulty: "intermediate",
      requiredEquipment: ["kettlebell_medium"],
      noiseLevel: "quiet",
      defaultSets: 4,
      defaultReps: "15-20",
      defaultRest: 60,
      cues: ["Hike the bell back", "Snap hips forward", "Arms are just hooks", "Float at the top"],
      tags: ["kettlebell", "power", "conditioning"],
    },
    {
      id: "hip_thrust",
      name: "Hip Thrust",
      slug: "hip-thrust",
      description: "Glute isolation with bench support",
      primaryMuscles: ["glutes"],
      secondaryMuscles: ["hamstrings"],
      movementPattern: "hinge",
      category: "strength",
      difficulty: "beginner",
      requiredEquipment: ["bench", "barbell"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "10-15",
      defaultRest: 90,
      cues: ["Upper back on bench", "Drive through heels", "Squeeze glutes at top", "Chin tucked"],
      tags: ["barbell", "glutes", "hypertrophy"],
    },
    {
      id: "good_morning",
      name: "Good Morning",
      slug: "good-morning",
      description: "Barbell hip hinge for posterior chain",
      primaryMuscles: ["hamstrings", "back"],
      secondaryMuscles: ["glutes"],
      movementPattern: "hinge",
      category: "strength",
      difficulty: "intermediate",
      requiredEquipment: ["barbell", "squat_rack"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "8-12",
      defaultRest: 90,
      cues: ["Bar on upper back", "Soft knee bend", "Hinge until torso parallel", "Keep back flat"],
      tags: ["barbell", "hinge", "posterior-chain"],
    },

    // === LEGS / LUNGE ===
    {
      id: "walking_lunge",
      name: "Walking Lunge",
      slug: "walking-lunge",
      description: "Dynamic lunging for legs and balance",
      primaryMuscles: ["quads", "glutes"],
      secondaryMuscles: ["hamstrings", "core"],
      movementPattern: "lunge",
      category: "strength",
      difficulty: "beginner",
      requiredEquipment: ["floor_space"],
      spaceRequired: "large",
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "10 each leg",
      defaultRest: 60,
      cues: ["Step forward", "Back knee toward floor", "Push through front heel", "Stay upright"],
      tags: ["bodyweight", "unilateral", "legs"],
    },
    {
      id: "reverse_lunge",
      name: "Reverse Lunge",
      slug: "reverse-lunge",
      description: "Step-back lunge for quads and glutes",
      primaryMuscles: ["quads", "glutes"],
      secondaryMuscles: ["hamstrings"],
      movementPattern: "lunge",
      category: "strength",
      difficulty: "beginner",
      requiredEquipment: ["floor_space"],
      spaceRequired: "minimal",
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "10-12 each leg",
      defaultRest: 60,
      cues: ["Step back, not out", "Front knee tracks over toes", "Upright torso"],
      tags: ["bodyweight", "unilateral", "beginner-friendly"],
    },
    {
      id: "bulgarian_split_squat",
      name: "Bulgarian Split Squat",
      slug: "bulgarian-split-squat",
      description: "Rear-foot elevated single leg squat",
      primaryMuscles: ["quads", "glutes"],
      secondaryMuscles: ["hamstrings", "core"],
      movementPattern: "lunge",
      category: "strength",
      difficulty: "intermediate",
      requiredEquipment: ["bench"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "8-10 each leg",
      defaultRest: 90,
      cues: ["Rear foot on bench", "Drop straight down", "Front shin vertical", "Drive through front heel"],
      tags: ["unilateral", "legs", "balance"],
    },
    {
      id: "step_up",
      name: "Step-Up",
      slug: "step-up",
      description: "Single leg step onto elevated surface",
      primaryMuscles: ["quads", "glutes"],
      secondaryMuscles: ["hamstrings"],
      movementPattern: "lunge",
      category: "strength",
      difficulty: "beginner",
      requiredEquipment: ["plyo_box"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "10-12 each leg",
      defaultRest: 60,
      cues: ["Full foot on box", "Drive through working leg", "Control the descent"],
      tags: ["unilateral", "functional", "legs"],
    },

    // === CORE ===
    {
      id: "plank",
      name: "Plank",
      slug: "plank",
      description: "Isometric core hold",
      primaryMuscles: ["core"],
      secondaryMuscles: ["shoulders"],
      movementPattern: "isometric",
      category: "stability",
      difficulty: "beginner",
      requiredEquipment: ["floor_space"],
      spaceRequired: "minimal",
      noiseLevel: "silent",
      defaultSets: 3,
      defaultReps: "30-60s",
      defaultRest: 45,
      cues: ["Elbows under shoulders", "Body in straight line", "Squeeze glutes", "Don't let hips sag"],
      tags: ["bodyweight", "core", "beginner-friendly"],
    },
    {
      id: "side_plank",
      name: "Side Plank",
      slug: "side-plank",
      description: "Lateral core stability exercise",
      primaryMuscles: ["core"],
      secondaryMuscles: ["shoulders"],
      movementPattern: "isometric",
      category: "stability",
      difficulty: "beginner",
      requiredEquipment: ["floor_space"],
      spaceRequired: "minimal",
      noiseLevel: "silent",
      defaultSets: 3,
      defaultReps: "20-30s each side",
      defaultRest: 30,
      cues: ["Elbow under shoulder", "Hips stacked", "Body in straight line"],
      tags: ["bodyweight", "core", "obliques"],
    },
    {
      id: "dead_bug",
      name: "Dead Bug",
      slug: "dead-bug",
      description: "Anti-extension core exercise",
      primaryMuscles: ["core"],
      secondaryMuscles: [],
      movementPattern: "isometric",
      category: "stability",
      difficulty: "beginner",
      requiredEquipment: ["floor_space"],
      spaceRequired: "minimal",
      noiseLevel: "silent",
      defaultSets: 3,
      defaultReps: "10 each side",
      defaultRest: 45,
      cues: ["Low back pressed into floor", "Move opposite arm and leg", "Exhale as you extend"],
      tags: ["bodyweight", "core", "prehab"],
    },
    {
      id: "hanging_leg_raise",
      name: "Hanging Leg Raise",
      slug: "hanging-leg-raise",
      description: "Advanced core exercise from bar",
      primaryMuscles: ["core"],
      secondaryMuscles: ["grip", "shoulders"],
      movementPattern: "pull",
      category: "strength",
      difficulty: "intermediate",
      requiredEquipment: ["pull_up_bar"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "8-12",
      defaultRest: 60,
      cues: ["Minimize swinging", "Curl pelvis up", "Control the descent"],
      tags: ["bodyweight", "core", "advanced"],
    },
    {
      id: "ab_wheel_rollout",
      name: "Ab Wheel Rollout",
      slug: "ab-wheel-rollout",
      description: "Anti-extension rollout with wheel",
      primaryMuscles: ["core"],
      secondaryMuscles: ["shoulders", "back"],
      movementPattern: "isometric",
      category: "strength",
      difficulty: "intermediate",
      requiredEquipment: ["ab_wheel"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "8-12",
      defaultRest: 60,
      cues: ["Start from knees", "Brace core throughout", "Roll out as far as controlled"],
      tags: ["equipment", "core", "anti-extension"],
    },
    {
      id: "pallof_press",
      name: "Pallof Press",
      slug: "pallof-press",
      description: "Anti-rotation core exercise with cable",
      primaryMuscles: ["core"],
      secondaryMuscles: [],
      movementPattern: "isometric",
      category: "stability",
      difficulty: "beginner",
      requiredEquipment: ["cable_machine"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "10-12 each side",
      defaultRest: 45,
      cues: ["Stand sideways to cable", "Press and hold away from body", "Resist rotation"],
      tags: ["cable", "core", "anti-rotation"],
    },

    // === ARMS ===
    {
      id: "bicep_curl",
      name: "Bicep Curl",
      slug: "bicep-curl",
      description: "Basic dumbbell curl for biceps",
      primaryMuscles: ["biceps"],
      secondaryMuscles: ["forearms"],
      movementPattern: "pull",
      category: "hypertrophy",
      difficulty: "beginner",
      requiredEquipment: ["dumbbells"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "10-15",
      defaultRest: 45,
      cues: ["Keep elbows stationary", "Full range of motion", "Control the negative"],
      tags: ["dumbbell", "isolation", "arms"],
    },
    {
      id: "tricep_pushdown",
      name: "Tricep Pushdown",
      slug: "tricep-pushdown",
      description: "Cable exercise for triceps",
      primaryMuscles: ["triceps"],
      secondaryMuscles: [],
      movementPattern: "push",
      category: "hypertrophy",
      difficulty: "beginner",
      requiredEquipment: ["cable_machine"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "12-15",
      defaultRest: 45,
      cues: ["Elbows pinned to sides", "Full lockout at bottom", "Control the return"],
      tags: ["cable", "isolation", "arms"],
    },
    {
      id: "hammer_curl",
      name: "Hammer Curl",
      slug: "hammer-curl",
      description: "Neutral grip curl for biceps and forearms",
      primaryMuscles: ["biceps", "forearms"],
      secondaryMuscles: [],
      movementPattern: "pull",
      category: "hypertrophy",
      difficulty: "beginner",
      requiredEquipment: ["dumbbells"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "10-12",
      defaultRest: 45,
      cues: ["Palms face each other", "Keep elbows stable", "Full range of motion"],
      tags: ["dumbbell", "isolation", "forearms"],
    },
    {
      id: "skull_crusher",
      name: "Skull Crusher",
      slug: "skull-crusher",
      description: "Lying tricep extension with EZ bar or dumbbells",
      primaryMuscles: ["triceps"],
      secondaryMuscles: [],
      movementPattern: "push",
      category: "hypertrophy",
      difficulty: "intermediate",
      requiredEquipment: ["ez_curl_bar", "bench"],
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "10-12",
      defaultRest: 60,
      cues: ["Lower to forehead", "Keep elbows pointed up", "Extend fully"],
      tags: ["barbell", "isolation", "triceps"],
    },

    // === CONDITIONING ===
    {
      id: "burpee",
      name: "Burpee",
      slug: "burpee",
      description: "Full body conditioning exercise",
      primaryMuscles: ["full_body"],
      secondaryMuscles: ["chest", "shoulders", "quads", "core"],
      movementPattern: "plyometric",
      category: "conditioning",
      difficulty: "intermediate",
      requiredEquipment: ["floor_space"],
      spaceRequired: "minimal",
      noiseLevel: "moderate",
      defaultSets: 3,
      defaultReps: "10-15",
      defaultRest: 60,
      cues: ["Drop to push-up position", "Chest to floor", "Jump feet in", "Jump and clap overhead"],
      tags: ["bodyweight", "conditioning", "full-body"],
    },
    {
      id: "mountain_climber",
      name: "Mountain Climber",
      slug: "mountain-climber",
      description: "Core and cardio exercise in plank position",
      primaryMuscles: ["core"],
      secondaryMuscles: ["shoulders", "quads"],
      movementPattern: "cardio",
      category: "conditioning",
      difficulty: "beginner",
      requiredEquipment: ["floor_space"],
      spaceRequired: "minimal",
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "30s",
      defaultRest: 30,
      cues: ["Plank position", "Drive knees to chest", "Keep hips low", "Move quickly"],
      tags: ["bodyweight", "core", "cardio"],
    },
    {
      id: "box_jump",
      name: "Box Jump",
      slug: "box-jump",
      description: "Plyometric jump onto elevated surface",
      primaryMuscles: ["quads", "glutes"],
      secondaryMuscles: ["calves", "hamstrings"],
      movementPattern: "plyometric",
      category: "power",
      difficulty: "intermediate",
      requiredEquipment: ["plyo_box"],
      noiseLevel: "loud",
      defaultSets: 4,
      defaultReps: "5-8",
      defaultRest: 90,
      cues: ["Load hips back", "Swing arms", "Land softly", "Step down"],
      tags: ["plyometric", "power", "athletic"],
    },
    {
      id: "jump_rope",
      name: "Jump Rope",
      slug: "jump-rope",
      description: "Classic cardio and coordination exercise",
      primaryMuscles: ["calves"],
      secondaryMuscles: ["shoulders", "core"],
      movementPattern: "cardio",
      category: "conditioning",
      difficulty: "beginner",
      requiredEquipment: ["jump_rope"],
      spaceRequired: "moderate",
      noiseLevel: "quiet",
      defaultSets: 3,
      defaultReps: "1-2 min",
      defaultRest: 30,
      cues: ["Stay on balls of feet", "Small jumps", "Wrists turn the rope"],
      tags: ["cardio", "conditioning", "coordination"],
    },
    {
      id: "battle_rope_waves",
      name: "Battle Rope Waves",
      slug: "battle-rope-waves",
      description: "High intensity arm and core conditioning",
      primaryMuscles: ["shoulders"],
      secondaryMuscles: ["core", "back"],
      movementPattern: "cardio",
      category: "conditioning",
      difficulty: "intermediate",
      requiredEquipment: ["battle_ropes"],
      noiseLevel: "moderate",
      defaultSets: 4,
      defaultReps: "30s",
      defaultRest: 30,
      cues: ["Athletic stance", "Alternate arms", "Create waves to anchor"],
      tags: ["conditioning", "arms", "hiit"],
    },
    {
      id: "rowing_machine",
      name: "Rowing",
      slug: "rowing",
      description: "Full body cardio on rowing machine",
      primaryMuscles: ["back", "quads"],
      secondaryMuscles: ["hamstrings", "core", "biceps"],
      movementPattern: "cardio",
      category: "conditioning",
      difficulty: "beginner",
      requiredEquipment: ["rower"],
      noiseLevel: "quiet",
      defaultSets: 1,
      defaultReps: "10-20 min",
      defaultRest: 0,
      cues: ["Legs-back-arms on drive", "Arms-back-legs on recovery", "Keep consistent stroke rate"],
      tags: ["cardio", "full-body", "low-impact"],
    },

    // === MOBILITY ===
    {
      id: "world_greatest_stretch",
      name: "World's Greatest Stretch",
      slug: "worlds-greatest-stretch",
      description: "Dynamic mobility for hips, thoracic spine, and hamstrings",
      primaryMuscles: ["full_body"],
      secondaryMuscles: [],
      movementPattern: "rotation",
      category: "mobility",
      difficulty: "beginner",
      requiredEquipment: ["floor_space"],
      spaceRequired: "moderate",
      noiseLevel: "silent",
      defaultSets: 2,
      defaultReps: "5 each side",
      defaultRest: 0,
      cues: ["Lunge forward", "Elbow to ankle", "Rotate and reach up", "Straighten front leg"],
      tags: ["mobility", "warmup", "hip-opening"],
    },
    {
      id: "cat_cow",
      name: "Cat-Cow",
      slug: "cat-cow",
      description: "Spinal mobility and warm-up",
      primaryMuscles: ["core"],
      secondaryMuscles: ["back"],
      movementPattern: "isometric",
      category: "mobility",
      difficulty: "beginner",
      requiredEquipment: ["floor_space", "yoga_mat"],
      spaceRequired: "minimal",
      noiseLevel: "silent",
      defaultSets: 2,
      defaultReps: "10",
      defaultRest: 0,
      cues: ["All fours position", "Arch back, look up (cow)", "Round back, tuck chin (cat)"],
      tags: ["mobility", "warmup", "spine"],
    },
    {
      id: "hip_90_90",
      name: "90/90 Hip Stretch",
      slug: "90-90-hip-stretch",
      description: "Deep hip internal and external rotation stretch",
      primaryMuscles: ["glutes"],
      secondaryMuscles: ["hamstrings"],
      movementPattern: "isometric",
      category: "mobility",
      difficulty: "beginner",
      requiredEquipment: ["floor_space"],
      spaceRequired: "minimal",
      noiseLevel: "silent",
      defaultSets: 2,
      defaultReps: "60s each side",
      defaultRest: 0,
      cues: ["Both legs at 90 degrees", "Upright torso", "Feel stretch in glutes"],
      tags: ["mobility", "hips", "bjj-specific"],
    },
    {
      id: "foam_roll_thoracic",
      name: "Thoracic Foam Roll",
      slug: "thoracic-foam-roll",
      description: "Upper back foam rolling for mobility",
      primaryMuscles: ["back"],
      secondaryMuscles: [],
      movementPattern: "isometric",
      category: "mobility",
      difficulty: "beginner",
      requiredEquipment: ["foam_roller"],
      spaceRequired: "minimal",
      noiseLevel: "silent",
      defaultSets: 1,
      defaultReps: "2-3 min",
      defaultRest: 0,
      cues: ["Roll upper back only", "Support head with hands", "Extend over roller"],
      tags: ["mobility", "recovery", "thoracic"],
    },
  ];

  return exercises.map(ex => createExercise({
    ...ex,
    createdAt: now,
    updatedAt: now,
  }));
}
