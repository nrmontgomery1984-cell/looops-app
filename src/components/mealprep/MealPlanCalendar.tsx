// Meal Plan Calendar - Weekly meal planning view with multiple recipes per meal
import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Recipe,
  MealPlan,
  MealPlanDay,
  PlannedMeal,
  PlannedMealItem,
  Course,
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

// Recipe pairing rules based on course types
// Course = "breakfast" | "lunch" | "dinner" | "snack" | "dessert" | "component"
const PAIRING_RULES: Record<Course, Course[]> = {
  breakfast: ["component"],           // Breakfast pairs with components (sides)
  lunch: ["component", "snack"],      // Lunch pairs with components and snacks
  dinner: ["component", "dessert"],   // Dinner pairs with components and dessert
  snack: [],                          // Snacks don't typically need pairings
  dessert: [],                        // Desserts don't need pairings
  component: ["dinner", "lunch"],     // Components (sides) go with main meals
};

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

function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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
  const [showMealDetail, setShowMealDetail] = useState<{
    date: string;
    slot: MealSlot;
  } | null>(null);

  const weekOf = formatWeekOf(currentWeekStart);
  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);

  // Detect light mode
  const isLightMode = document.documentElement.getAttribute("data-theme") === "light";

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

  // Get all items for a meal slot (supports both old single-recipe and new multi-item format)
  const getMealItems = (meal: PlannedMeal | undefined): PlannedMealItem[] => {
    if (!meal) return [];

    // New format with items array
    if (meal.items && meal.items.length > 0) {
      return meal.items;
    }

    // Legacy format - convert to items array
    if (meal.recipeId || meal.customMeal) {
      return [{
        id: generateItemId(),
        recipeId: meal.recipeId,
        customMeal: meal.customMeal,
        servings: meal.servings,
        prepDay: meal.prepDay,
        notes: meal.notes,
      }];
    }

    return [];
  };

  // Get current meal items for the picker slot
  const currentSlotItems = useMemo(() => {
    if (!showRecipePicker) return [];
    const day = currentPlan.days.find((d) => d.date === showRecipePicker.date);
    const meal = day?.meals[showRecipePicker.slot];
    return getMealItems(meal);
  }, [showRecipePicker, currentPlan]);

  // Get recipe IDs already in this meal slot (to avoid duplicates)
  const currentSlotRecipeIds = useMemo(() => {
    return new Set(currentSlotItems.map(item => item.recipeId).filter(Boolean));
  }, [currentSlotItems]);

  // Get suggested pairings based on what's already selected
  const suggestedPairings = useMemo(() => {
    if (currentSlotItems.length === 0) return [];

    // Get courses of current items (course is an array)
    const currentCourses = new Set<Course>();
    currentSlotItems.forEach(item => {
      if (item.recipeId) {
        const recipe = recipes.find(r => r.id === item.recipeId);
        if (recipe?.course && recipe.course.length > 0) {
          recipe.course.forEach(c => currentCourses.add(c));
        }
      }
    });

    // Find complementary courses
    const suggestedCourses = new Set<Course>();
    currentCourses.forEach(course => {
      const pairs = PAIRING_RULES[course] || [];
      pairs.forEach(c => suggestedCourses.add(c));
    });

    // Filter recipes that match suggested courses and aren't already selected
    return recipes.filter(r =>
      r.course &&
      r.course.length > 0 &&
      r.course.some(c => suggestedCourses.has(c)) &&
      !currentSlotRecipeIds.has(r.id)
    );
  }, [currentSlotItems, recipes, currentSlotRecipeIds]);

  // Filter recipes for picker
  const filteredRecipes = useMemo(() => {
    let filtered = recipes.filter(r => !currentSlotRecipeIds.has(r.id));

    if (recipeSearch) {
      const q = recipeSearch.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [recipes, recipeSearch, currentSlotRecipeIds]);

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

  const getRecipeForItem = (item: PlannedMealItem): Recipe | undefined => {
    if (!item.recipeId) return undefined;
    return recipes.find((r) => r.id === item.recipeId);
  };

  const handleAddRecipeToSlot = (recipe: Recipe) => {
    if (!showRecipePicker) return;

    const { date, slot } = showRecipePicker;
    const updatedDays = currentPlan.days.map((day) => {
      if (day.date !== date) return day;

      const existingMeal = day.meals[slot];
      const existingItems = getMealItems(existingMeal);

      const newItem: PlannedMealItem = {
        id: generateItemId(),
        recipeId: recipe.id,
        servings: recipe.servings,
      };

      return {
        ...day,
        meals: {
          ...day.meals,
          [slot]: {
            servings: recipe.servings,
            items: [...existingItems, newItem],
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
    setRecipeSearch("");
    // Don't close picker - allow adding more items
  };

  const handleAddCustomMeal = (customMeal: string) => {
    if (!showRecipePicker || !customMeal.trim()) return;

    const { date, slot } = showRecipePicker;
    const updatedDays = currentPlan.days.map((day) => {
      if (day.date !== date) return day;

      const existingMeal = day.meals[slot];
      const existingItems = getMealItems(existingMeal);

      const newItem: PlannedMealItem = {
        id: generateItemId(),
        customMeal: customMeal.trim(),
        servings: 2,
      };

      return {
        ...day,
        meals: {
          ...day.meals,
          [slot]: {
            servings: 2,
            items: [...existingItems, newItem],
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
    setRecipeSearch("");
  };

  const handleRemoveItem = (date: string, slot: MealSlot, itemId: string) => {
    const updatedDays = currentPlan.days.map((day) => {
      if (day.date !== date) return day;

      const existingMeal = day.meals[slot];
      const existingItems = getMealItems(existingMeal);
      const newItems = existingItems.filter(item => item.id !== itemId);

      if (newItems.length === 0) {
        // Remove the entire meal slot if no items left
        const { [slot]: _, ...restMeals } = day.meals;
        return { ...day, meals: restMeals };
      }

      return {
        ...day,
        meals: {
          ...day.meals,
          [slot]: {
            servings: newItems[0].servings,
            items: newItems,
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
  };

  const handleClearMealSlot = (date: string, slot: MealSlot) => {
    const updatedDays = currentPlan.days.map((day) => {
      if (day.date !== date) return day;
      const { [slot]: _, ...restMeals } = day.meals;
      return { ...day, meals: restMeals };
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

  // Count planned meals (count items, not just slots)
  const plannedMealsCount = currentPlan.days.reduce((count, day) => {
    let dayCount = 0;
    // Count breakfast, lunch, dinner (not snacks which is an array)
    const mainSlots: MealSlot[] = ["breakfast", "lunch", "dinner"];
    mainSlots.forEach(slot => {
      const meal = day.meals[slot];
      if (meal) {
        const items = getMealItems(meal);
        dayCount += items.length || 1;
      }
    });
    // Count snacks separately
    if (day.meals.snacks) {
      dayCount += day.meals.snacks.length;
    }
    return count + dayCount;
  }, 0);

  const closePicker = () => {
    setShowRecipePicker(null);
    setRecipeSearch("");
  };

  const closeMealDetail = () => {
    setShowMealDetail(null);
  };

  // Get items for meal detail modal
  const mealDetailItems = useMemo(() => {
    if (!showMealDetail) return [];
    const day = currentPlan.days.find((d) => d.date === showMealDetail.date);
    const meal = day?.meals[showMealDetail.slot];
    return getMealItems(meal);
  }, [showMealDetail, currentPlan]);

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
            {plannedMealsCount} item{plannedMealsCount !== 1 ? "s" : ""} planned this week
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
              const items = getMealItems(meal);

              return (
                <div
                  key={dateStr}
                  className={`meal-calendar__cell ${isToday(date) ? "meal-calendar__cell--today" : ""}`}
                >
                  {items.length > 0 ? (
                    <div className="meal-calendar__meal meal-calendar__meal--multi">
                      {/* Clickable area to open meal detail popup */}
                      <button
                        type="button"
                        className="meal-calendar__meal-click-area"
                        onClick={() => setShowMealDetail({ date: dateStr, slot: slot.key })}
                        title="View all items in this meal"
                      >
                        {/* Show first item preview */}
                        {items.slice(0, 1).map((item) => {
                          const recipe = getRecipeForItem(item);
                          return (
                            <div key={item.id} className="meal-calendar__meal-preview">
                              {recipe ? (
                                <>
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
                                </>
                              ) : (
                                <span className="meal-calendar__meal-title">
                                  {item.customMeal}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {/* Show count if more than one item */}
                        {items.length > 1 && (
                          <span className="meal-calendar__meal-count">
                            +{items.length - 1} more
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        className="meal-calendar__add-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRecipePicker({ date: dateStr, slot: slot.key });
                        }}
                        title="Add another item"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
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
      {showRecipePicker && createPortal(
        <div
          className="meal-calendar__picker-overlay"
          onClick={closePicker}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isLightMode ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999999,
          }}
        >
          <div
            className="meal-calendar__picker"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isLightMode ? "#ffffff" : "#1a1a2e",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: isLightMode
                ? "0 25px 60px rgba(0, 0, 0, 0.25)"
                : "0 20px 60px rgba(0, 0, 0, 0.5)",
              border: isLightMode ? "1px solid #d1d5db" : "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              className="meal-calendar__picker-header"
              style={{
                padding: "1rem 1.25rem",
                borderBottom: isLightMode ? "1px solid #e5e7eb" : "1px solid rgba(255,255,255,0.1)",
                background: isLightMode ? "#f9fafb" : undefined,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{
                margin: 0,
                fontSize: "1.1rem",
                color: isLightMode ? "#111827" : "#ffffff",
              }}>
                {currentSlotItems.length > 0 ? "Add to " : "Add "}
                {MEAL_SLOTS.find((s) => s.key === showRecipePicker.slot)?.label}
                {" for "}
                {new Date(showRecipePicker.date + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </h3>
              <button
                className="meal-calendar__picker-close"
                onClick={closePicker}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: isLightMode ? "#6b7280" : "rgba(255,255,255,0.6)",
                  padding: "0.25rem",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Current items in this slot */}
            {currentSlotItems.length > 0 && (
              <div
                style={{
                  padding: "0.75rem 1.25rem",
                  borderBottom: isLightMode ? "1px solid #e5e7eb" : "1px solid rgba(255,255,255,0.1)",
                  background: isLightMode ? "#f3f4f6" : "rgba(255,255,255,0.05)",
                }}
              >
                <p style={{
                  margin: "0 0 0.5rem 0",
                  fontSize: "0.8rem",
                  color: isLightMode ? "#6b7280" : "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  Currently planned:
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {currentSlotItems.map((item) => {
                    const recipe = getRecipeForItem(item);
                    return (
                      <span
                        key={item.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.35rem 0.6rem",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          background: isLightMode ? "#e0e7ff" : "rgba(139, 92, 246, 0.3)",
                          color: isLightMode ? "#4338ca" : "#c4b5fd",
                        }}
                      >
                        {recipe?.title || item.customMeal}
                        <button
                          onClick={() => handleRemoveItem(showRecipePicker.date, showRecipePicker.slot, item.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "inherit",
                            opacity: 0.7,
                            padding: 0,
                            fontSize: "1rem",
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div
              className="meal-calendar__picker-search"
              style={{ padding: "1rem 1.25rem 0.75rem" }}
            >
              <input
                type="text"
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                placeholder="Search recipes or type custom meal..."
                autoFocus
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: isLightMode ? "1px solid #d1d5db" : "1px solid rgba(255,255,255,0.2)",
                  background: isLightMode ? "#ffffff" : "rgba(255,255,255,0.1)",
                  color: isLightMode ? "#111827" : "#ffffff",
                  fontSize: "1rem",
                  outline: "none",
                }}
              />
            </div>

            {/* Custom meal option */}
            {recipeSearch && !filteredRecipes.some((r) =>
              r.title.toLowerCase() === recipeSearch.toLowerCase()
            ) && (
              <button
                className="meal-calendar__picker-custom"
                onClick={() => handleAddCustomMeal(recipeSearch)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  margin: "0 1.25rem 0.75rem",
                  padding: "0.75rem 1rem",
                  border: isLightMode ? "2px dashed #d1d5db" : "2px dashed rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  background: isLightMode ? "#f9fafb" : "rgba(255,255,255,0.05)",
                  cursor: "pointer",
                  color: isLightMode ? "#6b7280" : "rgba(255,255,255,0.7)",
                  fontSize: "0.9rem",
                  textAlign: "left",
                }}
              >
                <span>✍️</span>
                <span>Add "{recipeSearch}" as custom item</span>
              </button>
            )}

            {/* Suggested Pairings */}
            {!recipeSearch && suggestedPairings.length > 0 && (
              <div style={{ padding: "0 1.25rem 0.75rem" }}>
                <p style={{
                  margin: "0 0 0.5rem 0",
                  fontSize: "0.8rem",
                  color: isLightMode ? "#6b7280" : "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  Goes well with your selection:
                </p>
                <div style={{
                  display: "flex",
                  gap: "0.5rem",
                  overflowX: "auto",
                  paddingBottom: "0.5rem",
                }}>
                  {suggestedPairings.slice(0, 5).map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => handleAddRecipeToSlot(recipe)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.25rem",
                        padding: "0.5rem",
                        borderRadius: "8px",
                        border: isLightMode ? "1px solid #d1d5db" : "1px solid rgba(255,255,255,0.15)",
                        background: isLightMode ? "#fef3c7" : "rgba(251, 191, 36, 0.15)",
                        cursor: "pointer",
                        minWidth: "80px",
                        color: isLightMode ? "#92400e" : "#fbbf24",
                        fontSize: "0.75rem",
                        textAlign: "center",
                      }}
                    >
                      {recipe.imageUrl ? (
                        <img
                          src={recipe.imageUrl}
                          alt=""
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "6px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "6px",
                          background: isLightMode ? "#fde68a" : "rgba(251, 191, 36, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.25rem",
                        }}>
                          🍽️
                        </div>
                      )}
                      <span style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        width: "100%",
                      }}>
                        {recipe.title}
                      </span>
                      <span style={{
                        fontSize: "0.65rem",
                        opacity: 0.7,
                        textTransform: "capitalize",
                      }}>
                        {recipe.course}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div
              className="meal-calendar__picker-recipes"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0 1.25rem 1.25rem",
              }}
            >
              {filteredRecipes.length === 0 ? (
                <div
                  className="meal-calendar__picker-empty"
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: isLightMode ? "#6b7280" : "rgba(255,255,255,0.5)",
                  }}
                >
                  <p style={{ margin: "0 0 0.5rem 0" }}>No recipes found</p>
                  <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.7 }}>
                    Type a name to add a custom item
                  </p>
                </div>
              ) : (
                <>
                  <p style={{
                    margin: "0 0 0.5rem 0",
                    fontSize: "0.8rem",
                    color: isLightMode ? "#6b7280" : "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                    {recipeSearch ? "Search results:" : "All recipes:"}
                  </p>
                  {filteredRecipes.slice(0, 20).map((recipe) => (
                    <button
                      key={recipe.id}
                      className="meal-calendar__picker-recipe"
                      onClick={() => handleAddRecipeToSlot(recipe)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        width: "100%",
                        padding: "0.65rem",
                        marginBottom: "0.5rem",
                        border: isLightMode ? "1px solid #e5e7eb" : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        background: isLightMode ? "#ffffff" : "rgba(255,255,255,0.05)",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      {recipe.imageUrl ? (
                        <img
                          src={recipe.imageUrl}
                          alt=""
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "6px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "6px",
                          background: isLightMode ? "#f3f4f6" : "rgba(255,255,255,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.25rem",
                        }}>
                          🍳
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            display: "block",
                            fontWeight: 500,
                            color: isLightMode ? "#111827" : "#ffffff",
                            marginBottom: "0.15rem",
                          }}
                        >
                          {recipe.title}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "0.8rem",
                            color: isLightMode ? "#6b7280" : "rgba(255,255,255,0.5)",
                          }}
                        >
                          <span>{recipe.totalTime} min</span>
                          <span>·</span>
                          <span>{recipe.difficulty}</span>
                          {recipe.course && (
                            <>
                              <span>·</span>
                              <span style={{ textTransform: "capitalize" }}>{recipe.course}</span>
                            </>
                          )}
                        </span>
                      </div>
                      <span style={{
                        fontSize: "1.25rem",
                        color: isLightMode ? "#10b981" : "#34d399",
                      }}>
                        +
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Done button */}
            {currentSlotItems.length > 0 && (
              <div style={{
                padding: "1rem 1.25rem",
                borderTop: isLightMode ? "1px solid #e5e7eb" : "1px solid rgba(255,255,255,0.1)",
                background: isLightMode ? "#f9fafb" : "rgba(0,0,0,0.2)",
              }}>
                <button
                  onClick={closePicker}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "none",
                    background: isLightMode ? "#8b5cf6" : "#7c3aed",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "1rem",
                    cursor: "pointer",
                  }}
                >
                  Done ({currentSlotItems.length} item{currentSlotItems.length !== 1 ? "s" : ""})
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Meal Detail Modal */}
      {showMealDetail && createPortal(
        <div
          className="meal-calendar__detail-overlay"
          onClick={closeMealDetail}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isLightMode ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999999,
          }}
        >
          <div
            className="meal-calendar__detail-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isLightMode ? "#ffffff" : "#1a1a2e",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "550px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: isLightMode
                ? "0 25px 60px rgba(0, 0, 0, 0.25)"
                : "0 20px 60px rgba(0, 0, 0, 0.5)",
              border: isLightMode ? "1px solid #d1d5db" : "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "1.25rem",
                borderBottom: isLightMode ? "1px solid #e5e7eb" : "1px solid rgba(255,255,255,0.1)",
                background: isLightMode ? "#f9fafb" : undefined,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.25rem",
                }}>
                  <span style={{ fontSize: "1.25rem" }}>
                    {MEAL_SLOTS.find(s => s.key === showMealDetail.slot)?.icon}
                  </span>
                  <h3 style={{
                    margin: 0,
                    fontSize: "1.25rem",
                    color: isLightMode ? "#111827" : "#ffffff",
                  }}>
                    {MEAL_SLOTS.find(s => s.key === showMealDetail.slot)?.label}
                  </h3>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: "0.9rem",
                  color: isLightMode ? "#6b7280" : "rgba(255,255,255,0.6)",
                }}>
                  {new Date(showMealDetail.date + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={closeMealDetail}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: isLightMode ? "#6b7280" : "rgba(255,255,255,0.6)",
                  padding: "0.25rem",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Items List */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1rem 1.25rem",
              }}
            >
              {mealDetailItems.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "2rem",
                  color: isLightMode ? "#6b7280" : "rgba(255,255,255,0.5)",
                }}>
                  <p style={{ margin: 0, fontSize: "1.1rem" }}>No items planned</p>
                  <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", opacity: 0.7 }}>
                    Add recipes or custom items to this meal
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {mealDetailItems.map((item, index) => {
                    const recipe = getRecipeForItem(item);
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          gap: "1rem",
                          padding: "1rem",
                          borderRadius: "12px",
                          background: isLightMode ? "#f9fafb" : "rgba(255,255,255,0.05)",
                          border: isLightMode ? "1px solid #e5e7eb" : "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {/* Image or placeholder */}
                        {recipe?.imageUrl ? (
                          <img
                            src={recipe.imageUrl}
                            alt=""
                            style={{
                              width: "80px",
                              height: "80px",
                              borderRadius: "8px",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "8px",
                            background: isLightMode ? "#e5e7eb" : "rgba(255,255,255,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "2rem",
                            flexShrink: 0,
                          }}>
                            {recipe ? "🍳" : "✍️"}
                          </div>
                        )}

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{
                            margin: "0 0 0.25rem 0",
                            fontSize: "1.1rem",
                            fontWeight: 600,
                            color: isLightMode ? "#111827" : "#ffffff",
                          }}>
                            {recipe?.title || item.customMeal}
                          </h4>

                          {recipe && (
                            <div style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "0.5rem",
                              marginTop: "0.35rem",
                            }}>
                              {recipe.totalTime && (
                                <span style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.25rem",
                                  padding: "0.2rem 0.5rem",
                                  borderRadius: "4px",
                                  fontSize: "0.75rem",
                                  background: isLightMode ? "#dbeafe" : "rgba(59, 130, 246, 0.2)",
                                  color: isLightMode ? "#1d4ed8" : "#93c5fd",
                                }}>
                                  ⏱️ {recipe.totalTime} min
                                </span>
                              )}
                              {recipe.difficulty && (
                                <span style={{
                                  padding: "0.2rem 0.5rem",
                                  borderRadius: "4px",
                                  fontSize: "0.75rem",
                                  background: isLightMode ? "#fef3c7" : "rgba(251, 191, 36, 0.2)",
                                  color: isLightMode ? "#92400e" : "#fbbf24",
                                  textTransform: "capitalize",
                                }}>
                                  {recipe.difficulty}
                                </span>
                              )}
                              {recipe.course && recipe.course.length > 0 && (
                                <span style={{
                                  padding: "0.2rem 0.5rem",
                                  borderRadius: "4px",
                                  fontSize: "0.75rem",
                                  background: isLightMode ? "#e0e7ff" : "rgba(139, 92, 246, 0.2)",
                                  color: isLightMode ? "#4338ca" : "#c4b5fd",
                                  textTransform: "capitalize",
                                }}>
                                  {recipe.course.join(", ")}
                                </span>
                              )}
                              <span style={{
                                padding: "0.2rem 0.5rem",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                background: isLightMode ? "#d1fae5" : "rgba(16, 185, 129, 0.2)",
                                color: isLightMode ? "#065f46" : "#6ee7b7",
                              }}>
                                {item.servings || recipe.servings} servings
                              </span>
                            </div>
                          )}

                          {!recipe && (
                            <span style={{
                              display: "inline-block",
                              marginTop: "0.35rem",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              background: isLightMode ? "#f3f4f6" : "rgba(255,255,255,0.1)",
                              color: isLightMode ? "#6b7280" : "rgba(255,255,255,0.6)",
                            }}>
                              Custom item
                            </span>
                          )}

                          {/* Action buttons */}
                          <div style={{
                            display: "flex",
                            gap: "0.5rem",
                            marginTop: "0.75rem",
                          }}>
                            {recipe && (
                              <button
                                onClick={() => {
                                  closeMealDetail();
                                  onSelectRecipe(recipe);
                                }}
                                style={{
                                  padding: "0.4rem 0.75rem",
                                  borderRadius: "6px",
                                  border: isLightMode ? "1px solid #d1d5db" : "1px solid rgba(255,255,255,0.2)",
                                  background: isLightMode ? "#ffffff" : "rgba(255,255,255,0.1)",
                                  color: isLightMode ? "#374151" : "#ffffff",
                                  fontSize: "0.8rem",
                                  cursor: "pointer",
                                }}
                              >
                                View Recipe
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveItem(showMealDetail.date, showMealDetail.slot, item.id)}
                              style={{
                                padding: "0.4rem 0.75rem",
                                borderRadius: "6px",
                                border: "none",
                                background: isLightMode ? "#fee2e2" : "rgba(239, 68, 68, 0.2)",
                                color: isLightMode ? "#dc2626" : "#fca5a5",
                                fontSize: "0.8rem",
                                cursor: "pointer",
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: "1rem 1.25rem",
              borderTop: isLightMode ? "1px solid #e5e7eb" : "1px solid rgba(255,255,255,0.1)",
              background: isLightMode ? "#f9fafb" : "rgba(0,0,0,0.2)",
              display: "flex",
              gap: "0.75rem",
            }}>
              <button
                onClick={() => {
                  closeMealDetail();
                  setShowRecipePicker({ date: showMealDetail.date, slot: showMealDetail.slot });
                }}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: isLightMode ? "1px solid #d1d5db" : "1px solid rgba(255,255,255,0.2)",
                  background: isLightMode ? "#ffffff" : "rgba(255,255,255,0.1)",
                  color: isLightMode ? "#374151" : "#ffffff",
                  fontWeight: 500,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                + Add Item
              </button>
              <button
                onClick={closeMealDetail}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "none",
                  background: isLightMode ? "#8b5cf6" : "#7c3aed",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
