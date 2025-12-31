// Meal Prep Screen - Main Container
import React, { useState, useMemo } from "react";
import { useApp, useMealPrep } from "../../context";
import {
  Recipe,
  RecipeDifficulty,
  Course,
  APPROVED_SOURCES,
  TechniqueEntry,
  TechniqueTip,
  MealPlan,
  generateTechniqueSlug,
} from "../../types/mealPrep";
import { KitchenOnboardingFlow } from "./onboarding";
import { RecipeCard } from "./RecipeCard";
import { RecipeDetail } from "./RecipeDetail";
import { ImportRecipeModal, ExtractedTechnique } from "./ImportRecipeModal";
import { RecipeForm } from "./RecipeForm";
import { TechniqueLibrary } from "./TechniqueLibrary";
import { MealPlanCalendar } from "./MealPlanCalendar";
import { ShoppingList } from "./ShoppingList";
import { MealSuggester } from "./MealSuggester";
import { WasteEntry } from "../../types/mealPrep";

type ViewMode = "grid" | "list";
type SortBy = "recent" | "rating" | "timesMade" | "totalTime" | "title";
type MainView = "recipes" | "techniques" | "calendar" | "shopping";

interface FilterState {
  search: string;
  source: string | null;
  difficulty: RecipeDifficulty | null;
  course: Course | null;
  favorites: boolean;
  maxTime: number | null;
}

interface MealPrepScreenProps {
  embedded?: boolean;
}

export function MealPrepScreen({ embedded = false }: MealPrepScreenProps) {
  const { state, dispatch } = useApp();
  const mealPrep = useMealPrep();

  // Main navigation
  const [mainView, setMainView] = useState<MainView>("recipes");

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showSuggester, setShowSuggester] = useState(false);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    source: null,
    difficulty: null,
    course: null,
    favorites: false,
    maxTime: null,
  });

  // Get user ID for onboarding
  const userId = state.user.profile?.id || "anonymous";

  // Filter and sort recipes - MUST be called before any conditional returns (React hooks rules)
  const filteredRecipes = useMemo(() => {
    let recipes = [...mealPrep.recipes];

    // Search
    if (filters.search) {
      const search = filters.search.toLowerCase();
      recipes = recipes.filter(
        (r) =>
          r.title.toLowerCase().includes(search) ||
          r.tags.some((t) => t.toLowerCase().includes(search)) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(search))
      );
    }

    // Source filter
    if (filters.source) {
      recipes = recipes.filter((r) => r.source.name === filters.source);
    }

    // Difficulty filter
    if (filters.difficulty) {
      recipes = recipes.filter((r) => r.difficulty === filters.difficulty);
    }

    // Course filter
    if (filters.course) {
      recipes = recipes.filter((r) => r.course.includes(filters.course!));
    }

    // Favorites filter
    if (filters.favorites) {
      recipes = recipes.filter((r) => r.isFavorite);
    }

    // Max time filter
    if (filters.maxTime) {
      recipes = recipes.filter((r) => r.totalTime <= filters.maxTime!);
    }

    // Sort
    switch (sortBy) {
      case "recent":
        recipes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "rating":
        recipes.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "timesMade":
        recipes.sort((a, b) => b.timesMade - a.timesMade);
        break;
      case "totalTime":
        recipes.sort((a, b) => a.totalTime - b.totalTime);
        break;
      case "title":
        recipes.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return recipes;
  }, [mealPrep.recipes, filters, sortBy]);

  // Get unique sources from recipes
  const usedSources = useMemo(() => {
    const sources = new Set(mealPrep.recipes.map((r) => r.source.name));
    return Array.from(sources);
  }, [mealPrep.recipes]);

  const handleToggleFavorite = (recipeId: string) => {
    dispatch({ type: "TOGGLE_RECIPE_FAVORITE", payload: recipeId });
  };

  const handleDeleteRecipe = (recipeId: string) => {
    if (confirm("Are you sure you want to delete this recipe?")) {
      dispatch({ type: "DELETE_RECIPE", payload: recipeId });
      setSelectedRecipe(null);
    }
  };

  // Technique handlers
  const handleAddTechnique = (technique: TechniqueEntry) => {
    dispatch({ type: "ADD_TECHNIQUE_ENTRY", payload: technique });
  };

  const handleUpdateTechnique = (technique: TechniqueEntry) => {
    dispatch({ type: "UPDATE_TECHNIQUE_ENTRY", payload: technique });
  };

  const handleDeleteTechnique = (id: string) => {
    dispatch({ type: "DELETE_TECHNIQUE_ENTRY", payload: id });
  };

  // Meal plan handlers
  const handleSaveMealPlan = (plan: MealPlan) => {
    dispatch({ type: "SET_MEAL_PLAN", payload: plan });
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowRecipeForm(true);
    setSelectedRecipe(null);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      source: null,
      difficulty: null,
      course: null,
      favorites: false,
      maxTime: null,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.source ||
    filters.difficulty ||
    filters.course ||
    filters.favorites ||
    filters.maxTime;

  // If onboarding not complete, show onboarding flow
  // This check must come AFTER all hooks are called (React rules of hooks)
  if (!mealPrep.onboardingComplete) {
    return (
      <div className="screen meal-prep-screen">
        <KitchenOnboardingFlow
          userId={userId}
          onComplete={() => {}}
        />
      </div>
    );
  }

  // Recipe Detail View
  if (selectedRecipe) {
    return (
      <div className="screen meal-prep-screen">
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onEdit={() => handleEditRecipe(selectedRecipe)}
          onDelete={(recipeId) => {
            dispatch({ type: "DELETE_RECIPE", payload: recipeId });
            setSelectedRecipe(null);
          }}
        />
      </div>
    );
  }

  // Recipe Form (Add/Edit)
  if (showRecipeForm) {
    return (
      <div className="screen meal-prep-screen">
        <RecipeForm
          recipe={editingRecipe}
          onSave={(recipe) => {
            if (editingRecipe) {
              dispatch({ type: "UPDATE_RECIPE", payload: recipe });
            } else {
              dispatch({ type: "ADD_RECIPE", payload: recipe });
            }
            setShowRecipeForm(false);
            setEditingRecipe(null);
          }}
          onCancel={() => {
            setShowRecipeForm(false);
            setEditingRecipe(null);
          }}
        />
      </div>
    );
  }

  // Technique Library View
  if (mainView === "techniques") {
    return (
      <div className="screen meal-prep-screen">
        <TechniqueLibrary
          techniques={mealPrep.techniqueLibrary}
          recipes={mealPrep.recipes}
          onAddTechnique={handleAddTechnique}
          onUpdateTechnique={handleUpdateTechnique}
          onDeleteTechnique={handleDeleteTechnique}
          onToggleFavorite={(id) => dispatch({ type: "TOGGLE_TECHNIQUE_FAVORITE", payload: id })}
          onUpdateNotes={(techniqueId, notes) => dispatch({ type: "UPDATE_TECHNIQUE_NOTES", payload: { techniqueId, notes } })}
          onToggleTipHighlight={(techniqueId, tipId) => dispatch({ type: "TOGGLE_TIP_HIGHLIGHT", payload: { techniqueId, tipId } })}
          onSelectRecipe={(recipe) => {
            setSelectedRecipe(recipe);
            setMainView("recipes");
          }}
          onBack={() => setMainView("recipes")}
        />
      </div>
    );
  }

  // Meal Plan Calendar View
  if (mainView === "calendar") {
    return (
      <div className="screen meal-prep-screen">
        <MealPlanCalendar
          recipes={mealPrep.recipes}
          mealPlans={mealPrep.mealPlans}
          onSavePlan={handleSaveMealPlan}
          onSelectRecipe={(recipe) => {
            setSelectedRecipe(recipe);
          }}
          onBack={() => setMainView("recipes")}
        />
      </div>
    );
  }

  // Shopping List View
  if (mainView === "shopping") {
    return (
      <div className="screen meal-prep-screen">
        <ShoppingList
          recipes={mealPrep.recipes}
          mealPlans={mealPrep.mealPlans}
          onUpdateList={handleSaveMealPlan}
          onBack={() => setMainView("recipes")}
        />
      </div>
    );
  }

  // Helper to check active tab
  const isActiveTab = (tab: MainView) => mainView === tab;

  return (
    <div className={`${embedded ? "" : "screen "}meal-prep-screen${embedded ? " meal-prep-screen--embedded" : ""}`}>
      {/* Header */}
      {!embedded && (
        <div className="meal-prep__header">
          <div className="meal-prep__header-content">
            <h2>Meal Prep</h2>
            <p className="meal-prep__subtitle">
              Your curated recipe collection from trusted sources
            </p>
          </div>
          <div className="meal-prep__header-actions">
            <button
              className="meal-prep__add-btn meal-prep__add-btn--secondary"
              onClick={() => {
                setEditingRecipe(null);
                setShowRecipeForm(true);
              }}
            >
              + Add Manually
            </button>
            <button
              className="meal-prep__add-btn"
              onClick={() => setShowImportModal(true)}
            >
              + Import from URL
            </button>
          </div>
        </div>
      )}
      {embedded && (
        <div className="meal-prep__embedded-header">
          <button
            className="meal-prep__add-btn meal-prep__add-btn--secondary"
            onClick={() => {
              setEditingRecipe(null);
              setShowRecipeForm(true);
            }}
          >
            + Add
          </button>
          <button
            className="meal-prep__add-btn"
            onClick={() => setShowImportModal(true)}
          >
            + Import
          </button>
        </div>
      )}

      {/* Main View Tabs */}
      <div className="meal-prep__tabs">
        <button
          className={`meal-prep__tab ${isActiveTab("recipes") ? "meal-prep__tab--active" : ""}`}
          onClick={() => setMainView("recipes")}
        >
          Recipes
          <span className="meal-prep__tab-count">{mealPrep.recipes.length}</span>
        </button>
        <button
          className={`meal-prep__tab ${isActiveTab("techniques") ? "meal-prep__tab--active" : ""}`}
          onClick={() => setMainView("techniques")}
        >
          Techniques
          <span className="meal-prep__tab-count">{mealPrep.techniqueLibrary.length}</span>
        </button>
        <button
          className={`meal-prep__tab ${isActiveTab("calendar") ? "meal-prep__tab--active" : ""}`}
          onClick={() => setMainView("calendar")}
        >
          Meal Plan
          <span className="meal-prep__tab-count">{mealPrep.mealPlans.length}</span>
        </button>
        <button
          className={`meal-prep__tab ${isActiveTab("shopping") ? "meal-prep__tab--active" : ""}`}
          onClick={() => setMainView("shopping")}
        >
          Shopping
        </button>
        <button
          className="meal-prep__tab meal-prep__tab--suggest"
          onClick={() => setShowSuggester(true)}
        >
          What to cook?
        </button>
      </div>

      {/* Search - shown in embedded mode */}
      <div className="meal-prep__filters">
        <div className="meal-prep__search">
          <span className="meal-prep__search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search recipes, ingredients, tags..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          {filters.search && (
            <button
              className="meal-prep__search-clear"
              onClick={() => setFilters({ ...filters, search: "" })}
            >
              ×
            </button>
          )}
        </div>

        {/* Only show advanced filters when searching or not embedded */}
        {(!embedded || filters.search) && (
          <>
            <div className="meal-prep__filter-row">
              {/* Source Filter */}
              <select
                className="meal-prep__filter-select"
                value={filters.source || ""}
                onChange={(e) => setFilters({ ...filters, source: e.target.value || null })}
              >
                <option value="">All Sources</option>
                {usedSources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                className="meal-prep__filter-select"
                value={filters.difficulty || ""}
                onChange={(e) =>
                  setFilters({ ...filters, difficulty: (e.target.value || null) as RecipeDifficulty | null })
                }
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="advanced">Advanced</option>
                <option value="project">Project</option>
              </select>

              {/* Course Filter */}
              <select
                className="meal-prep__filter-select"
                value={filters.course || ""}
                onChange={(e) => setFilters({ ...filters, course: (e.target.value || null) as Course | null })}
              >
                <option value="">All Courses</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
                <option value="dessert">Dessert</option>
                <option value="component">Component</option>
              </select>

              {/* Time Filter */}
              <select
                className="meal-prep__filter-select"
                value={filters.maxTime || ""}
                onChange={(e) =>
                  setFilters({ ...filters, maxTime: e.target.value ? parseInt(e.target.value) : null })
                }
              >
                <option value="">Any Time</option>
                <option value="30">Under 30 min</option>
                <option value="60">Under 1 hour</option>
                <option value="120">Under 2 hours</option>
              </select>

              {/* Favorites Toggle */}
              <button
                className={`meal-prep__filter-toggle ${filters.favorites ? "meal-prep__filter-toggle--active" : ""}`}
                onClick={() => setFilters({ ...filters, favorites: !filters.favorites })}
              >
                {filters.favorites ? "★" : "☆"} Favorites
              </button>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button className="meal-prep__filter-clear" onClick={clearFilters}>
                  Clear All
                </button>
              )}
            </div>

            {/* Sort & View Controls */}
            <div className="meal-prep__controls">
              <div className="meal-prep__sort">
                <span className="meal-prep__sort-label">Sort by:</span>
                <select
                  className="meal-prep__sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                >
                  <option value="recent">Recently Added</option>
                  <option value="rating">Rating</option>
                  <option value="timesMade">Most Made</option>
                  <option value="totalTime">Quickest First</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>

              <div className="meal-prep__view-toggle">
                <button
                  className={`meal-prep__view-btn ${viewMode === "grid" ? "meal-prep__view-btn--active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                >
                  ⊞
                </button>
                <button
                  className={`meal-prep__view-btn ${viewMode === "list" ? "meal-prep__view-btn--active" : ""}`}
                  onClick={() => setViewMode("list")}
                  title="List View"
                >
                  ☰
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recipe Grid/List - only show when searching in embedded mode, or always in non-embedded */}
      {(!embedded || filters.search) && (
        <>
          {filteredRecipes.length === 0 ? (
            <div className="meal-prep__empty">
              {mealPrep.recipes.length === 0 ? (
                <>
                  <div className="meal-prep__empty-icon">📖</div>
                  <h3>No recipes yet</h3>
                  <p>Start building your collection by importing a recipe from one of your trusted sources.</p>
                  <div className="meal-prep__empty-sources">
                    <p className="meal-prep__empty-sources-label">Approved sources:</p>
                    <div className="meal-prep__empty-sources-list">
                      {APPROVED_SOURCES.filter((s) => s.type === "website").map((source) => (
                        <span key={source.name} className="meal-prep__empty-source">
                          {source.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    className="meal-prep__empty-btn"
                    onClick={() => setShowImportModal(true)}
                  >
                    Import Your First Recipe
                  </button>
                </>
              ) : (
                <>
                  <div className="meal-prep__empty-icon">🔍</div>
                  <h3>No recipes match your filters</h3>
                  <p>Try adjusting your search or filters to find what you're looking for.</p>
                  <button className="meal-prep__empty-btn" onClick={clearFilters}>
                    Clear Filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className={`meal-prep__recipes meal-prep__recipes--${viewMode}`}>
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onView={() => setSelectedRecipe(recipe)}
                  onToggleFavorite={() => handleToggleFavorite(recipe.id)}
                  onAddToPlan={() => {
                    // TODO: Implement add to meal plan
                    console.log("Add to plan:", recipe.id);
                  }}
                  compact={viewMode === "list"}
                />
              ))}
            </div>
          )}

          {/* Results count */}
          {filteredRecipes.length > 0 && (
            <div className="meal-prep__count">
              Showing {filteredRecipes.length} of {mealPrep.recipes.length} recipes
            </div>
          )}
        </>
      )}

      {/* Collapsed state hint for embedded mode */}
      {embedded && !filters.search && (
        <div className="meal-prep__collapsed-hint">
          <p>{mealPrep.recipes.length} recipes available. Start typing to search.</p>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportRecipeModal
          onImport={(recipe, extractedTechniques) => {
            dispatch({ type: "ADD_RECIPE", payload: recipe });

            // Convert extracted techniques to TechniqueEntry objects and save them
            if (extractedTechniques && extractedTechniques.length > 0) {
              extractedTechniques.forEach((tech: ExtractedTechnique) => {
                // Build tips array from extracted data
                const tips: TechniqueTip[] = [];
                const now = Date.now();

                // Main description as a "how" tip
                if (tech.description) {
                  tips.push({
                    id: `tip_${now}_desc`,
                    content: tech.description,
                    source: recipe.source.name,
                    sourceUrl: recipe.sourceUrl,
                    category: "how",
                  });
                }

                // Why it works as a "why" tip
                if (tech.whyItWorks) {
                  tips.push({
                    id: `tip_${now}_why`,
                    content: tech.whyItWorks,
                    source: recipe.source.name,
                    sourceUrl: recipe.sourceUrl,
                    category: "why",
                  });
                }

                // Common mistakes
                if (tech.commonMistakes) {
                  tech.commonMistakes.forEach((mistake, i) => {
                    tips.push({
                      id: `tip_${now}_mistake_${i}`,
                      content: mistake,
                      source: recipe.source.name,
                      sourceUrl: recipe.sourceUrl,
                      category: "common_mistake",
                    });
                  });
                }

                // Key tips
                if (tech.keyTips) {
                  tech.keyTips.forEach((tip, i) => {
                    tips.push({
                      id: `tip_${now}_key_${i}`,
                      content: tip,
                      source: recipe.source.name,
                      sourceUrl: recipe.sourceUrl,
                      category: "how",
                    });
                  });
                }

                const techniqueEntry: TechniqueEntry = {
                  id: `tech_${now}_${Math.random().toString(36).slice(2, 11)}`,
                  slug: generateTechniqueSlug(tech.title),
                  subject: tech.title,
                  subjectType: "technique",
                  tips,
                  relatedRecipeIds: [recipe.id],
                  lastUpdated: new Date().toISOString(),
                  sourcesCited: [recipe.source.name],
                };

                dispatch({ type: "ADD_TECHNIQUE_ENTRY", payload: techniqueEntry });
              });
            }

            setShowImportModal(false);
          }}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {/* Meal Suggester Modal */}
      {showSuggester && (
        <div className="meal-prep__suggester-overlay">
          <MealSuggester
            recipes={mealPrep.recipes}
            kitchenProfile={mealPrep.kitchenProfile}
            onSelectRecipe={(recipe) => {
              setSelectedRecipe(recipe);
              setShowSuggester(false);
            }}
            onClose={() => setShowSuggester(false)}
          />
        </div>
      )}
    </div>
  );
}
