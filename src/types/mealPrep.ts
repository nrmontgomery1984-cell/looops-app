// Meal Prep Types - Kitchen Profile, Recipes, Meal Planning
import { LoopId } from "./core";

// ==================== Kitchen Profile ====================

export type ExperienceLevel = "beginner" | "comfortable" | "experienced" | "advanced";

export type EquipmentCategory = "essential" | "common" | "specialized" | "custom";

export interface KitchenEquipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  owned: boolean;
}

export interface KitchenProfile {
  id: string;
  userId: string;
  experienceLevel: ExperienceLevel;
  equipment: KitchenEquipment[];
  dietaryRestrictions: string[];
  allergies: string[];
  preferMetric: boolean;
  defaultServings: number;
  createdAt: string;
  updatedAt: string;
}

// Default equipment lists
export const DEFAULT_EQUIPMENT: Omit<KitchenEquipment, "owned">[] = [
  // Essential (pre-checked by default)
  { id: "stovetop", name: "Stovetop", category: "essential" },
  { id: "oven", name: "Oven", category: "essential" },
  { id: "basic_pots_pans", name: "Basic pots and pans", category: "essential" },
  { id: "chef_knife", name: "Chef's knife", category: "essential" },
  { id: "cutting_board", name: "Cutting board", category: "essential" },

  // Common
  { id: "stand_mixer", name: "Stand mixer", category: "common" },
  { id: "food_processor", name: "Food processor", category: "common" },
  { id: "blender", name: "Blender (standard)", category: "common" },
  { id: "immersion_blender", name: "Immersion blender", category: "common" },
  { id: "cast_iron_skillet", name: "Cast iron skillet", category: "common" },
  { id: "dutch_oven", name: "Dutch oven", category: "common" },
  { id: "instant_pot", name: "Instant Pot / Pressure cooker", category: "common" },
  { id: "slow_cooker", name: "Slow cooker", category: "common" },
  { id: "rice_cooker", name: "Rice cooker", category: "common" },

  // Specialized
  { id: "sous_vide", name: "Sous vide circulator", category: "specialized" },
  { id: "thermometer_instant", name: "Thermometer (instant-read)", category: "specialized" },
  { id: "thermometer_probe", name: "Thermometer (leave-in/probe)", category: "specialized" },
  { id: "kitchen_scale", name: "Kitchen scale", category: "specialized" },
  { id: "mandoline", name: "Mandoline", category: "specialized" },
  { id: "microplane", name: "Microplane", category: "specialized" },
  { id: "kitchen_torch", name: "Torch (kitchen)", category: "specialized" },
  { id: "smoking_gun", name: "Smoking gun", category: "specialized" },
  { id: "dehydrator", name: "Dehydrator", category: "specialized" },
  { id: "ice_cream_maker", name: "Ice cream maker", category: "specialized" },
  { id: "pasta_machine", name: "Pasta machine", category: "specialized" },
  { id: "vitamix", name: "Vitamix / High-powered blender", category: "specialized" },
];

export const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten_free", label: "Gluten-free" },
  { id: "dairy_free", label: "Dairy-free" },
  { id: "low_carb", label: "Low-carb / Keto" },
  { id: "nut_allergy", label: "Nut allergy", isAllergy: true },
  { id: "shellfish_allergy", label: "Shellfish allergy", isAllergy: true },
];

export function createDefaultKitchenProfile(userId: string): KitchenProfile {
  const now = new Date().toISOString();
  return {
    id: `kitchen_${Date.now()}`,
    userId,
    experienceLevel: "comfortable",
    equipment: DEFAULT_EQUIPMENT.map(eq => ({
      ...eq,
      owned: eq.category === "essential",
    })),
    dietaryRestrictions: [],
    allergies: [],
    preferMetric: false,
    defaultServings: 4,
    createdAt: now,
    updatedAt: now,
  };
}

// ==================== Recipe Types ====================

export type RecipeSourceType = "website" | "youtube" | "cookbook" | "manual";
export type RecipeDifficulty = "easy" | "medium" | "advanced" | "project";
export type TechniqueLevel = "basic" | "intermediate" | "advanced";
export type Course = "breakfast" | "lunch" | "dinner" | "snack" | "dessert" | "component";

export type IngredientCategory =
  | "protein"
  | "vegetable"
  | "fruit"
  | "dairy"
  | "grain"
  | "spice"
  | "oil_fat"
  | "condiment"
  | "liquid"
  | "other";

export interface RecipeSource {
  type: RecipeSourceType;
  name: string;
  approved: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  preparation?: string;
  optional: boolean;
  substituteFor?: string;
  normalizedName: string;
  category: IngredientCategory;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  duration?: number;
  isActive: boolean;
  technique?: string;
  tip?: string;
}

export interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
  perServing: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  source: RecipeSource;
  sourceUrl?: string;
  author?: string;
  cookbook?: string;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  tags: string[];
  cuisine?: string;
  course: Course[];
  difficulty: RecipeDifficulty;
  techniqueLevel: TechniqueLevel;
  requiredEquipment: string[];
  ingredients: Ingredient[];
  steps: RecipeStep[];
  chefNotes?: string;
  userNotes?: string;
  nutrition?: NutritionInfo;
  servings: number;
  scalable: boolean;
  rating?: number;
  timesMade: number;
  lastMade?: string;
  isFavorite: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Approved sources configuration
export const APPROVED_SOURCES: RecipeSource[] = [
  { type: "website", name: "Serious Eats", approved: true },
  { type: "website", name: "Bon Appétit", approved: true },
  { type: "website", name: "Chris Young Cooks", approved: true },
  { type: "youtube", name: "Babish Culinary Universe", approved: true },
  { type: "youtube", name: "Fallow", approved: true },
  { type: "youtube", name: "Chris Young Cooks", approved: true },
  { type: "cookbook", name: "Thomas Keller", approved: true },
  { type: "cookbook", name: "Samin Nosrat", approved: true },
];

export const APPROVED_DOMAINS = [
  "seriouseats.com",
  "bonappetit.com",
  "chrisyoungcooks.com",
  "bingingwithbabish.com",
];

export function isApprovedUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace("www.", "");
    return APPROVED_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

export function getSourceFromUrl(url: string): RecipeSource | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace("www.", "");

    if (hostname.includes("seriouseats.com")) {
      return { type: "website", name: "Serious Eats", approved: true };
    }
    if (hostname.includes("bonappetit.com")) {
      return { type: "website", name: "Bon Appétit", approved: true };
    }
    if (hostname.includes("chrisyoungcooks.com")) {
      return { type: "website", name: "Chris Young Cooks", approved: true };
    }
    if (hostname.includes("bingingwithbabish.com")) {
      return { type: "website", name: "Babish Culinary Universe", approved: true };
    }
    return null;
  } catch {
    return null;
  }
}

// ==================== Meal Plan Types ====================

export interface PlannedMeal {
  recipeId?: string;
  customMeal?: string;
  servings: number;
  prepDay?: string;
  notes?: string;
}

export interface MealPlanDay {
  date: string;
  dayOfWeek: string;
  meals: {
    breakfast?: PlannedMeal;
    lunch?: PlannedMeal;
    dinner?: PlannedMeal;
    snacks?: PlannedMeal[];
  };
  contextFlags?: string[];
}

export interface ShoppingListItem {
  id: string;
  ingredient: string;
  totalQuantity: number;
  unit: string;
  recipes: string[];
  category: IngredientCategory;
  acquired: boolean;
}

export interface MealPlan {
  id: string;
  weekOf: string;
  days: MealPlanDay[];
  shoppingList: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}

// ==================== Technique Library Types ====================

export type TechniqueSubjectType = "ingredient" | "technique" | "dish" | "equipment";
export type TipCategory = "why" | "how" | "common_mistake" | "variation" | "science" | "shortcut";

export interface TechniqueTip {
  id: string;
  content: string;
  source: string;
  sourceUrl?: string;
  category: TipCategory;
  appliesToEquipment?: string[];
  appliesToSkillLevel?: ExperienceLevel[];
}

export interface TechniqueEntry {
  id: string;
  subject: string;
  subjectType: TechniqueSubjectType;
  tips: TechniqueTip[];
  relatedRecipeIds: string[];
  lastUpdated: string;
  sourcesCited: string[];
}

// ==================== Meal Prep State ====================

export interface MealPrepState {
  kitchenProfile: KitchenProfile | null;
  recipes: Recipe[];
  mealPlans: MealPlan[];
  techniqueLibrary: TechniqueEntry[];
  onboardingComplete: boolean;
}

export function getDefaultMealPrepState(): MealPrepState {
  // Import seed data lazily to avoid circular dependencies
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { SEED_RECIPES, SEED_TECHNIQUES } = require("../data/mealPrepSeedData");

  return {
    kitchenProfile: null,
    recipes: SEED_RECIPES,
    mealPlans: [],
    techniqueLibrary: SEED_TECHNIQUES,
    onboardingComplete: false,
  };
}

// ==================== Helper Functions ====================

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createRecipe(data: Partial<Recipe>): Recipe {
  const now = new Date().toISOString();
  return {
    id: `recipe_${Date.now()}`,
    title: data.title || "Untitled Recipe",
    slug: data.slug || generateSlug(data.title || "untitled"),
    source: data.source || { type: "manual", name: "Manual Entry", approved: true },
    sourceUrl: data.sourceUrl,
    author: data.author,
    cookbook: data.cookbook,
    prepTime: data.prepTime || 0,
    cookTime: data.cookTime || 0,
    totalTime: data.totalTime || (data.prepTime || 0) + (data.cookTime || 0),
    tags: data.tags || [],
    cuisine: data.cuisine,
    course: data.course || ["dinner"],
    difficulty: data.difficulty || "medium",
    techniqueLevel: data.techniqueLevel || "intermediate",
    requiredEquipment: data.requiredEquipment || [],
    ingredients: data.ingredients || [],
    steps: data.steps || [],
    chefNotes: data.chefNotes,
    userNotes: data.userNotes,
    nutrition: data.nutrition,
    servings: data.servings || 4,
    scalable: data.scalable ?? true,
    rating: data.rating,
    timesMade: data.timesMade || 0,
    lastMade: data.lastMade,
    isFavorite: data.isFavorite || false,
    imageUrl: data.imageUrl,
    createdAt: data.createdAt || now,
    updatedAt: now,
  };
}

export function getDifficultyLabel(difficulty: RecipeDifficulty): string {
  switch (difficulty) {
    case "easy": return "Easy";
    case "medium": return "Medium";
    case "advanced": return "Advanced";
    case "project": return "Project";
  }
}

export function getDifficultyColor(difficulty: RecipeDifficulty): string {
  switch (difficulty) {
    case "easy": return "#73A58C";      // Sage green
    case "medium": return "#F4B942";    // Amber
    case "advanced": return "#F27059";  // Coral
    case "project": return "#b87fa8";   // Purple
  }
}

export function formatTime(minutes: number): string {
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

export function getExperienceLevelLabel(level: ExperienceLevel): string {
  switch (level) {
    case "beginner": return "Beginner";
    case "comfortable": return "Comfortable";
    case "experienced": return "Experienced";
    case "advanced": return "Advanced";
  }
}

export function getExperienceLevelDescription(level: ExperienceLevel): string {
  switch (level) {
    case "beginner":
      return "I can follow a recipe but I'm still learning basics";
    case "comfortable":
      return "I cook regularly and can improvise a bit";
    case "experienced":
      return "I'm confident with most techniques and enjoy a challenge";
    case "advanced":
      return "I seek out complex techniques and restaurant-level dishes";
  }
}
