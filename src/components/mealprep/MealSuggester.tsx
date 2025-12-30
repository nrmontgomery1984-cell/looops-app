// Meal Suggester - "What should I cook?" assistant
import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Recipe, KitchenProfile } from "../../types/mealPrep";

interface MealSuggesterProps {
  recipes: Recipe[];
  kitchenProfile: KitchenProfile | null;
  onSelectRecipe: (recipe: Recipe) => void;
  onClose: () => void;
}

type TimeConstraint = "quick" | "medium" | "leisurely" | "any";
type MoodFilter = "comfort" | "healthy" | "adventurous" | "easy" | "any";

interface SuggestionFilters {
  time: TimeConstraint;
  mood: MoodFilter;
  course: string;
  useLeftovers: boolean;
}

const TIME_OPTIONS: { value: TimeConstraint; label: string; maxMinutes: number | null }[] = [
  { value: "quick", label: "Quick (< 30 min)", maxMinutes: 30 },
  { value: "medium", label: "Medium (< 1 hour)", maxMinutes: 60 },
  { value: "leisurely", label: "Leisurely (1+ hours)", maxMinutes: null },
  { value: "any", label: "Any time", maxMinutes: null },
];

const MOOD_OPTIONS: { value: MoodFilter; label: string; icon: string }[] = [
  { value: "comfort", label: "Comfort Food", icon: "🍲" },
  { value: "healthy", label: "Something Healthy", icon: "🥗" },
  { value: "adventurous", label: "Try Something New", icon: "🌶️" },
  { value: "easy", label: "Keep It Simple", icon: "😌" },
  { value: "any", label: "Surprise Me!", icon: "🎲" },
];

export function MealSuggester({
  recipes,
  kitchenProfile,
  onSelectRecipe,
  onClose,
}: MealSuggesterProps) {
  const [step, setStep] = useState<"questions" | "results">("questions");
  const [filters, setFilters] = useState<SuggestionFilters>({
    time: "any",
    mood: "any",
    course: "dinner",
    useLeftovers: false,
  });

  // Score and filter recipes based on preferences
  const suggestedRecipes = useMemo(() => {
    let scored = recipes.map((recipe) => {
      let score = 50; // Base score

      // Time constraint scoring
      const timeOption = TIME_OPTIONS.find((t) => t.value === filters.time);
      if (timeOption?.maxMinutes) {
        if (recipe.totalTime <= timeOption.maxMinutes) {
          score += 20;
        } else {
          score -= 30; // Penalize if over time limit
        }
      }

      // Mood-based scoring
      switch (filters.mood) {
        case "comfort":
          if (recipe.tags.some((t) =>
            ["comfort", "hearty", "cozy", "classic", "soup", "stew", "pasta"].includes(t.toLowerCase())
          )) {
            score += 25;
          }
          break;
        case "healthy":
          if (recipe.tags.some((t) =>
            ["healthy", "light", "salad", "vegetable", "lean", "low-carb"].includes(t.toLowerCase())
          )) {
            score += 25;
          }
          break;
        case "adventurous":
          // Favor recipes made less often or never
          if (recipe.timesMade === 0) score += 30;
          else if (recipe.timesMade < 3) score += 15;
          // Favor advanced recipes
          if (recipe.difficulty === "advanced" || recipe.difficulty === "project") {
            score += 15;
          }
          break;
        case "easy":
          if (recipe.difficulty === "easy") score += 30;
          else if (recipe.difficulty === "medium") score += 10;
          break;
      }

      // Course matching
      if (recipe.course.includes(filters.course as any)) {
        score += 15;
      }

      // Favorites get a boost
      if (recipe.isFavorite) score += 10;

      // Recently made recipes get penalized slightly to encourage variety
      if (recipe.lastMade) {
        const daysSinceLastMade = Math.floor(
          (Date.now() - new Date(recipe.lastMade).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceLastMade < 7) score -= 15;
        else if (daysSinceLastMade < 14) score -= 5;
      }

      // Skill level matching
      if (kitchenProfile) {
        const skillMap = {
          beginner: ["easy"],
          comfortable: ["easy", "medium"],
          experienced: ["easy", "medium", "advanced"],
          advanced: ["easy", "medium", "advanced", "project"],
        };
        const allowedDifficulties = skillMap[kitchenProfile.experienceLevel] || ["easy", "medium"];
        if (!allowedDifficulties.includes(recipe.difficulty)) {
          score -= 20;
        }
      }

      // High-rated recipes get a boost
      if (recipe.rating && recipe.rating >= 4) {
        score += (recipe.rating - 3) * 10;
      }

      return { recipe, score };
    });

    // Filter out low-scoring recipes and sort by score
    return scored
      .filter((r) => r.score > 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((r) => r.recipe);
  }, [recipes, filters, kitchenProfile]);

  const handleGetSuggestions = () => {
    setStep("results");
  };

  const handleStartOver = () => {
    setFilters({
      time: "any",
      mood: "any",
      course: "dinner",
      useLeftovers: false,
    });
    setStep("questions");
  };

  // Determine if light mode
  const isLightMode = document.documentElement.getAttribute("data-theme") === "light";

  // Questions Step
  if (step === "questions") {
    return createPortal(
      <div
        className="meal-suggester__overlay"
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isLightMode ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999999,
        }}
      >
        <div
          className="meal-suggester"
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
            className="meal-suggester__header"
            style={{
              background: isLightMode ? "#f9fafb" : undefined,
              borderBottom: isLightMode ? "1px solid #e5e7eb" : undefined,
            }}
          >
            <h2 style={{ color: isLightMode ? "#111827" : undefined }}>What should I cook?</h2>
            <button
              type="button"
              className="meal-suggester__close"
              onClick={onClose}
              style={{ color: isLightMode ? "#6b7280" : undefined }}
            >
              ×
            </button>
          </div>

          <div
            className="meal-suggester__content"
            style={{ background: isLightMode ? "#ffffff" : undefined }}
          >
            <p className="meal-suggester__intro">
              Answer a few quick questions and I'll suggest the perfect recipe for you!
            </p>

            {/* Time Question */}
            <div className="meal-suggester__question">
              <h3>How much time do you have?</h3>
              <div className="meal-suggester__options">
                {TIME_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={`meal-suggester__option ${filters.time === option.value ? "meal-suggester__option--selected" : ""}`}
                    onClick={() => setFilters({ ...filters, time: option.value })}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood Question */}
            <div className="meal-suggester__question">
              <h3>What are you in the mood for?</h3>
              <div className="meal-suggester__options meal-suggester__options--mood">
                {MOOD_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={`meal-suggester__option meal-suggester__option--mood ${filters.mood === option.value ? "meal-suggester__option--selected" : ""}`}
                    onClick={() => setFilters({ ...filters, mood: option.value })}
                  >
                    <span className="meal-suggester__option-icon">{option.icon}</span>
                    <span className="meal-suggester__option-label">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Course Question */}
            <div className="meal-suggester__question">
              <h3>What meal are you making?</h3>
              <div className="meal-suggester__options">
                {["breakfast", "lunch", "dinner", "snack"].map((course) => (
                  <button
                    type="button"
                    key={course}
                    className={`meal-suggester__option ${filters.course === course ? "meal-suggester__option--selected" : ""}`}
                    onClick={() => setFilters({ ...filters, course })}
                  >
                    {course.charAt(0).toUpperCase() + course.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="meal-suggester__submit"
              onClick={handleGetSuggestions}
            >
              Get Suggestions
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Results Step
  return createPortal(
    <div
      className="meal-suggester__overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isLightMode ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
      }}
    >
      <div
        className="meal-suggester"
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
          className="meal-suggester__header"
          style={{
            background: isLightMode ? "#f9fafb" : undefined,
            borderBottom: isLightMode ? "1px solid #e5e7eb" : undefined,
          }}
        >
          <h2 style={{ color: isLightMode ? "#111827" : undefined }}>Here's what I suggest!</h2>
          <button
            type="button"
            className="meal-suggester__close"
            onClick={onClose}
            style={{ color: isLightMode ? "#6b7280" : undefined }}
          >
            ×
          </button>
        </div>

        <div
          className="meal-suggester__content"
          style={{ background: isLightMode ? "#ffffff" : undefined }}
        >
          {suggestedRecipes.length === 0 ? (
            <div className="meal-suggester__no-results">
              <span className="meal-suggester__no-results-icon">?</span>
              <h3>No matches found</h3>
              <p>
                Try adjusting your preferences or add more recipes to your collection!
              </p>
              <button
                type="button"
                className="meal-suggester__retry-btn"
                onClick={handleStartOver}
              >
                Try Different Options
              </button>
            </div>
          ) : (
            <>
              <div className="meal-suggester__results">
                {suggestedRecipes.map((recipe, index) => (
                  <button
                    type="button"
                    key={recipe.id}
                    className={`meal-suggester__result ${index === 0 ? "meal-suggester__result--top" : ""}`}
                    onClick={() => onSelectRecipe(recipe)}
                    style={{
                      background: isLightMode
                        ? index === 0 ? "rgba(139, 92, 246, 0.1)" : "#f3f4f6"
                        : undefined,
                      border: isLightMode
                        ? index === 0 ? "1px solid #8b5cf6" : "1px solid #d1d5db"
                        : undefined,
                    }}
                  >
                    {index === 0 && (
                      <span className="meal-suggester__result-badge">Top Pick</span>
                    )}
                    {recipe.imageUrl && (
                      <img
                        src={recipe.imageUrl}
                        alt=""
                        className="meal-suggester__result-image"
                      />
                    )}
                    <div className="meal-suggester__result-info">
                      <h4
                        className="meal-suggester__result-title"
                        style={{ color: isLightMode ? "#111827" : undefined }}
                      >
                        {recipe.title}
                      </h4>
                      <div
                        className="meal-suggester__result-meta"
                        style={{ color: isLightMode ? "#6b7280" : undefined }}
                      >
                        <span>{recipe.totalTime} min</span>
                        <span>.</span>
                        <span>{recipe.difficulty}</span>
                        {recipe.rating && (
                          <>
                            <span>.</span>
                            <span>{"*".repeat(Math.round(recipe.rating))}</span>
                          </>
                        )}
                      </div>
                      {recipe.timesMade === 0 && (
                        <span className="meal-suggester__result-new">
                          Never made before!
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="meal-suggester__actions">
                <button
                  type="button"
                  className="meal-suggester__retry-btn"
                  onClick={handleStartOver}
                >
                  Try Different Options
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
