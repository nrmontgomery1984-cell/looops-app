// Meal Plan Calendar - Weekly meal planning view
import { useState, useMemo } from "react";
import {
  Recipe,
  MealPlan,
  MealPlanDay,
  PlannedMeal,
} from "../../types/mealPrep";

interface MealPlanCalendarProps {
  recipes: Recipe[];
  mealPlans: MealPlan[];
  onSavePlan: (plan: MealPlan) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onBack: () => void;
}

type MealSlot = "breakfast" | "lunch" | "dinner";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MEAL_SLOTS: { key: MealSlot; label: string; icon: string }[] = [
  { key: "breakfast", label: "Breakfast", icon: "🌅" },
  { key: "lunch", label: "Lunch", icon: "☀️" },
  { key: "dinner", label: "Dinner", icon: "🌙" },
];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekOf(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function MealPlanCalendar({
  recipes,
  mealPlans,
  onSavePlan,
  onSelectRecipe,
  onBack,
}: MealPlanCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [showRecipePicker, setShowRecipePicker] = useState<{
    date: string;
    slot: MealSlot;
  } | null>(null);
  const [recipeSearch, setRecipeSearch] = useState("");

  const weekOf = formatWeekOf(currentWeekStart);
  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);

  // Find or create current week's plan
  const currentPlan = useMemo(() => {
    const existing = mealPlans.find((p) => p.weekOf === weekOf);
    if (existing) return existing;

    // Create empty plan
    return {
      id: `plan_${weekOf}`,
      weekOf,
      days: weekDates.map((date) => ({
        date: date.toISOString().split("T")[0],
        dayOfWeek: DAYS_OF_WEEK[date.getDay()],
        meals: {},
      })),
      shoppingList: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as MealPlan;
  }, [mealPlans, weekOf, weekDates]);

  // Filter recipes for picker
  const filteredRecipes = useMemo(() => {
    if (!recipeSearch) return recipes;
    const q = recipeSearch.toLowerCase();
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [recipes, recipeSearch]);

  const navigateWeek = (direction: -1 | 1) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + direction * 7);
    setCurrentWeekStart(newStart);
  };

  const goToThisWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const getMealForSlot = (date: string, slot: MealSlot): PlannedMeal | undefined => {
    const day = currentPlan.days.find((d) => d.date === date);
    return day?.meals[slot];
  };

  const getRecipeForMeal = (meal: PlannedMeal | undefined): Recipe | undefined => {
    if (!meal?.recipeId) return undefined;
    return recipes.find((r) => r.id === meal.recipeId);
  };

  const handleSelectRecipeForSlot = (recipe: Recipe) => {
    if (!showRecipePicker) return;

    const { date, slot } = showRecipePicker;
    const updatedDays = currentPlan.days.map((day) => {
      if (day.date !== date) return day;
      return {
        ...day,
        meals: {
          ...day.meals,
          [slot]: {
            recipeId: recipe.id,
            servings: recipe.servings,
          } as PlannedMeal,
        },
      };
    });

    const updatedPlan: MealPlan = {
      ...currentPlan,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    };

    onSavePlan(updatedPlan);
    setShowRecipePicker(null);
    setRecipeSearch("");
  };

  const handleSetCustomMeal = (customMeal: string) => {
    if (!showRecipePicker || !customMeal.trim()) return;

    const { date, slot } = showRecipePicker;
    const updatedDays = currentPlan.days.map((day) => {
      if (day.date !== date) return day;
      return {
        ...day,
        meals: {
          ...day.meals,
          [slot]: {
            customMeal: customMeal.trim(),
            servings: 2,
          } as PlannedMeal,
        },
      };
    });

    const updatedPlan: MealPlan = {
      ...currentPlan,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    };

    onSavePlan(updatedPlan);
    setShowRecipePicker(null);
    setRecipeSearch("");
  };

  const handleRemoveMeal = (date: string, slot: MealSlot) => {
    const updatedDays = currentPlan.days.map((day) => {
      if (day.date !== date) return day;
      const { [slot]: _, ...restMeals } = day.meals;
      return {
        ...day,
        meals: restMeals,
      };
    });

    const updatedPlan: MealPlan = {
      ...currentPlan,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    };

    onSavePlan(updatedPlan);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isThisWeek = useMemo(() => {
    const thisWeekStart = getWeekStart(new Date());
    return currentWeekStart.getTime() === thisWeekStart.getTime();
  }, [currentWeekStart]);

  // Count planned meals
  const plannedMealsCount = currentPlan.days.reduce((count, day) => {
    return count + Object.keys(day.meals).length;
  }, 0);

  return (
    <div className="meal-calendar">
      {/* Header */}
      <div className="meal-calendar__header">
        <button className="meal-calendar__back" onClick={onBack}>
          ← Back
        </button>
        <div className="meal-calendar__title-section">
          <h1>Meal Plan</h1>
          <p className="meal-calendar__subtitle">
            {plannedMealsCount} meals planned this week
          </p>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="meal-calendar__nav">
        <button
          className="meal-calendar__nav-btn"
          onClick={() => navigateWeek(-1)}
        >
          ← Previous
        </button>
        <div className="meal-calendar__week-label">
          <span className="meal-calendar__month">
            {currentWeekStart.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <span className="meal-calendar__dates">
            {currentWeekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {" - "}
            {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
        <button
          className="meal-calendar__nav-btn"
          onClick={() => navigateWeek(1)}
        >
          Next →
        </button>
        {!isThisWeek && (
          <button
            className="meal-calendar__today-btn"
            onClick={goToThisWeek}
          >
            Today
          </button>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="meal-calendar__grid">
        {/* Header Row */}
        <div className="meal-calendar__grid-header">
          <div className="meal-calendar__slot-label"></div>
          {weekDates.map((date, i) => (
            <div
              key={i}
              className={`meal-calendar__day-header ${isToday(date) ? "meal-calendar__day-header--today" : ""}`}
            >
              <span className="meal-calendar__day-name">{DAYS_OF_WEEK[i].substring(0, 3)}</span>
              <span className="meal-calendar__day-date">{date.getDate()}</span>
            </div>
          ))}
        </div>

        {/* Meal Rows */}
        {MEAL_SLOTS.map((slot) => (
          <div key={slot.key} className="meal-calendar__row">
            <div className="meal-calendar__slot-label">
              <span className="meal-calendar__slot-icon">{slot.icon}</span>
              <span className="meal-calendar__slot-name">{slot.label}</span>
            </div>
            {weekDates.map((date) => {
              const dateStr = date.toISOString().split("T")[0];
              const meal = getMealForSlot(dateStr, slot.key);
              const recipe = getRecipeForMeal(meal);

              return (
                <div
                  key={dateStr}
                  className={`meal-calendar__cell ${isToday(date) ? "meal-calendar__cell--today" : ""}`}
                >
                  {meal ? (
                    <div className="meal-calendar__meal">
                      {recipe ? (
                        <button
                          className="meal-calendar__meal-content"
                          onClick={() => onSelectRecipe(recipe)}
                        >
                          {recipe.imageUrl && (
                            <img
                              src={recipe.imageUrl}
                              alt=""
                              className="meal-calendar__meal-image"
                            />
                          )}
                          <span className="meal-calendar__meal-title">
                            {recipe.title}
                          </span>
                        </button>
                      ) : (
                        <div className="meal-calendar__meal-content meal-calendar__meal-content--custom">
                          <span className="meal-calendar__meal-title">
                            {meal.customMeal}
                          </span>
                        </div>
                      )}
                      <button
                        className="meal-calendar__meal-remove"
                        onClick={() => handleRemoveMeal(dateStr, slot.key)}
                        title="Remove meal"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      className="meal-calendar__add-meal"
                      onClick={() => setShowRecipePicker({ date: dateStr, slot: slot.key })}
                    >
                      <span className="meal-calendar__add-icon">+</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Recipe Picker Modal */}
      {showRecipePicker && (
        <div className="meal-calendar__picker-overlay" onClick={() => setShowRecipePicker(null)}>
          <div className="meal-calendar__picker" onClick={(e) => e.stopPropagation()}>
            <div className="meal-calendar__picker-header">
              <h3>
                Add {MEAL_SLOTS.find((s) => s.key === showRecipePicker.slot)?.label} for{" "}
                {new Date(showRecipePicker.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </h3>
              <button
                className="meal-calendar__picker-close"
                onClick={() => setShowRecipePicker(null)}
              >
                ×
              </button>
            </div>

            <div className="meal-calendar__picker-search">
              <input
                type="text"
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                placeholder="Search recipes or type custom meal..."
              />
            </div>

            {/* Custom meal option */}
            {recipeSearch && !filteredRecipes.some((r) =>
              r.title.toLowerCase() === recipeSearch.toLowerCase()
            ) && (
              <button
                className="meal-calendar__picker-custom"
                onClick={() => handleSetCustomMeal(recipeSearch)}
              >
                <span className="meal-calendar__picker-custom-icon">✍️</span>
                <span>Add "{recipeSearch}" as custom meal</span>
              </button>
            )}

            <div className="meal-calendar__picker-recipes">
              {filteredRecipes.length === 0 ? (
                <div className="meal-calendar__picker-empty">
                  <p>No recipes found</p>
                  <p className="meal-calendar__picker-empty-hint">
                    Type a name to add a custom meal
                  </p>
                </div>
              ) : (
                filteredRecipes.slice(0, 20).map((recipe) => (
                  <button
                    key={recipe.id}
                    className="meal-calendar__picker-recipe"
                    onClick={() => handleSelectRecipeForSlot(recipe)}
                  >
                    {recipe.imageUrl && (
                      <img
                        src={recipe.imageUrl}
                        alt=""
                        className="meal-calendar__picker-recipe-image"
                      />
                    )}
                    <div className="meal-calendar__picker-recipe-info">
                      <span className="meal-calendar__picker-recipe-title">
                        {recipe.title}
                      </span>
                      <span className="meal-calendar__picker-recipe-meta">
                        {recipe.totalTime} min · {recipe.difficulty}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
