// Recipe Form - Manual recipe entry and editing
import React, { useState } from "react";
import {
  Recipe,
  Ingredient,
  RecipeStep,
  RecipeDifficulty,
  TechniqueLevel,
  Course,
  IngredientCategory,
  RecipeSource,
  createRecipe,
  APPROVED_SOURCES,
} from "../../types/mealPrep";

// Special quantity terms that map to small amounts
const SPECIAL_QUANTITIES: Record<string, number> = {
  "pinch": 0.0625,      // 1/16
  "a pinch": 0.0625,
  "dash": 0.0625,
  "a dash": 0.0625,
  "splash": 0.125,
  "a splash": 0.125,
  "handful": 0.5,
  "a handful": 0.5,
  "some": 1,
  "to taste": 0,
};

// Parse fraction strings like "1/2", "1 1/2", "3/4", "pinch" to decimal numbers
function parseFraction(input: string): number {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return 0;

  // Check for special quantity terms first
  if (SPECIAL_QUANTITIES[trimmed] !== undefined) {
    return SPECIAL_QUANTITIES[trimmed];
  }

  // Try parsing as plain number first
  const plainNum = parseFloat(trimmed);
  if (!isNaN(plainNum) && !trimmed.includes("/")) {
    return plainNum;
  }

  // Check for mixed number like "1 1/2"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const numerator = parseInt(mixedMatch[2], 10);
    const denominator = parseInt(mixedMatch[3], 10);
    if (denominator !== 0) {
      return whole + numerator / denominator;
    }
  }

  // Check for simple fraction like "1/2"
  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1], 10);
    const denominator = parseInt(fractionMatch[2], 10);
    if (denominator !== 0) {
      return numerator / denominator;
    }
  }

  // Fallback to parseFloat
  return parseFloat(trimmed) || 0;
}

// Convert decimal back to fraction string for display
function formatAsFraction(num: number | null | undefined): string {
  if (num === null || num === undefined) return "1";
  if (num === 0) return "0";

  const whole = Math.floor(num);
  const decimal = num - whole;

  // Common fractions mapping
  const fractions: [number, string][] = [
    [0.125, "1/8"],
    [0.25, "1/4"],
    [0.333, "1/3"],
    [0.375, "3/8"],
    [0.5, "1/2"],
    [0.625, "5/8"],
    [0.667, "2/3"],
    [0.75, "3/4"],
    [0.875, "7/8"],
  ];

  // Find closest fraction
  let closestFraction = "";
  let minDiff = 0.05; // Tolerance
  for (const [dec, frac] of fractions) {
    const diff = Math.abs(decimal - dec);
    if (diff < minDiff) {
      minDiff = diff;
      closestFraction = frac;
    }
  }

  if (closestFraction) {
    return whole > 0 ? `${whole} ${closestFraction}` : closestFraction;
  }

  // No matching fraction, return as decimal
  return num.toString();
}

interface RecipeFormProps {
  recipe?: Recipe | null;
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
}

const DIFFICULTY_OPTIONS: { value: RecipeDifficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "advanced", label: "Advanced" },
  { value: "project", label: "Project" },
];

const COURSE_OPTIONS: { value: Course; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
  { value: "dessert", label: "Dessert" },
  { value: "component", label: "Component" },
];

const INGREDIENT_CATEGORIES: { value: IngredientCategory; label: string }[] = [
  { value: "protein", label: "Protein" },
  { value: "vegetable", label: "Vegetable" },
  { value: "fruit", label: "Fruit" },
  { value: "dairy", label: "Dairy" },
  { value: "grain", label: "Grain" },
  { value: "spice", label: "Spice" },
  { value: "oil_fat", label: "Oil/Fat" },
  { value: "condiment", label: "Condiment" },
  { value: "liquid", label: "Liquid" },
  { value: "other", label: "Other" },
];

export function RecipeForm({ recipe, onSave, onCancel }: RecipeFormProps) {
  const isEditing = !!recipe;

  // Form state
  const [title, setTitle] = useState(recipe?.title || "");
  const [sourceType, setSourceType] = useState<"cookbook" | "manual">(
    recipe?.source.type === "cookbook" ? "cookbook" : "manual"
  );
  const [sourceName, setSourceName] = useState(recipe?.source.name || "");
  const [author, setAuthor] = useState(recipe?.author || "");
  const [prepTime, setPrepTime] = useState(recipe?.prepTime || 0);
  const [cookTime, setCookTime] = useState(recipe?.cookTime || 0);
  const [servings, setServings] = useState(recipe?.servings || 4);
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>(recipe?.difficulty || "medium");
  const [courses, setCourses] = useState<Course[]>(recipe?.course || ["dinner"]);
  const [tags, setTags] = useState<string[]>(recipe?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [cuisine, setCuisine] = useState(recipe?.cuisine || "");
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients || []
  );
  // Track quantity display strings (to allow typing fractions like "1/2")
  const [quantityStrings, setQuantityStrings] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      if (recipe?.ingredients) {
        recipe.ingredients.forEach((ing) => {
          initial[ing.id] = formatAsFraction(ing.quantity);
        });
      }
      return initial;
    }
  );
  const [steps, setSteps] = useState<RecipeStep[]>(
    recipe?.steps || []
  );
  const [chefNotes, setChefNotes] = useState(recipe?.chefNotes || "");
  const [requiredEquipment, setRequiredEquipment] = useState<string[]>(
    recipe?.requiredEquipment || []
  );
  const [equipmentInput, setEquipmentInput] = useState("");

  // Cookbook sources from approved list
  const cookbookSources = APPROVED_SOURCES.filter((s) => s.type === "cookbook");

  const handleAddIngredient = () => {
    const newId = `ing_${Date.now()}`;
    const newIngredient: Ingredient = {
      id: newId,
      name: "",
      quantity: 1,
      unit: "",
      optional: false,
      normalizedName: "",
      category: "other",
    };
    setIngredients([...ingredients, newIngredient]);
    setQuantityStrings((prev) => ({ ...prev, [newId]: "1" }));
  };

  const handleUpdateIngredient = (index: number, updates: Partial<Ingredient>) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], ...updates };
    if (updates.name) {
      newIngredients[index].normalizedName = updates.name.toLowerCase();
    }
    setIngredients(newIngredients);
  };

  const handleQuantityChange = (index: number, value: string) => {
    const ing = ingredients[index];
    // Update the display string
    setQuantityStrings((prev) => ({ ...prev, [ing.id]: value }));
    // Parse and update the numeric quantity
    const numericValue = parseFraction(value);
    handleUpdateIngredient(index, { quantity: numericValue });
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleAddStep = () => {
    const newStep: RecipeStep = {
      stepNumber: steps.length + 1,
      instruction: "",
      isActive: true,
    };
    setSteps([...steps, newStep]);
  };

  const handleUpdateStep = (index: number, updates: Partial<RecipeStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Renumber steps
    newSteps.forEach((step, i) => {
      step.stepNumber = i + 1;
    });
    setSteps(newSteps);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAddEquipment = () => {
    if (equipmentInput.trim() && !requiredEquipment.includes(equipmentInput.trim())) {
      setRequiredEquipment([...requiredEquipment, equipmentInput.trim()]);
      setEquipmentInput("");
    }
  };

  const handleRemoveEquipment = (eq: string) => {
    setRequiredEquipment(requiredEquipment.filter((e) => e !== eq));
  };

  const toggleCourse = (course: Course) => {
    if (courses.includes(course)) {
      setCourses(courses.filter((c) => c !== course));
    } else {
      setCourses([...courses, course]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a recipe title");
      return;
    }

    if (ingredients.length === 0) {
      alert("Please add at least one ingredient");
      return;
    }

    if (steps.length === 0) {
      alert("Please add at least one step");
      return;
    }

    const source: RecipeSource = {
      type: sourceType,
      name: sourceType === "cookbook" ? sourceName : "Manual Entry",
      approved: true,
    };

    const techniqueLevel: TechniqueLevel =
      difficulty === "easy" ? "basic" :
      difficulty === "project" ? "advanced" : "intermediate";

    const recipeData = createRecipe({
      id: recipe?.id,
      title: title.trim(),
      source,
      author: author.trim() || undefined,
      cookbook: sourceType === "cookbook" ? sourceName : undefined,
      prepTime,
      cookTime,
      totalTime: prepTime + cookTime,
      servings,
      difficulty,
      techniqueLevel,
      course: courses.length > 0 ? courses : ["dinner"],
      tags,
      cuisine: cuisine.trim() || undefined,
      ingredients: ingredients.filter((i) => i.name.trim()),
      steps: steps.filter((s) => s.instruction.trim()),
      chefNotes: chefNotes.trim() || undefined,
      requiredEquipment,
      scalable: true,
      createdAt: recipe?.createdAt,
      isFavorite: recipe?.isFavorite || false,
      rating: recipe?.rating,
      timesMade: recipe?.timesMade || 0,
      lastMade: recipe?.lastMade,
    });

    onSave(recipeData);
  };

  return (
    <form className="recipe-form" onSubmit={handleSubmit}>
      {/* Header */}
      <div className="recipe-form__header">
        <h2>{isEditing ? "Edit Recipe" : "Add Recipe"}</h2>
        <button
          type="button"
          className="recipe-form__close"
          onClick={onCancel}
        >
          ×
        </button>
      </div>

      <div className="recipe-form__content">
        {/* Basic Info */}
        <section className="recipe-form__section">
          <h3 className="recipe-form__section-title">Basic Information</h3>

          <div className="recipe-form__field">
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Recipe title"
              required
            />
          </div>

          <div className="recipe-form__row">
            <div className="recipe-form__field">
              <label>Source Type</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as "cookbook" | "manual")}
              >
                <option value="manual">Manual Entry</option>
                <option value="cookbook">Cookbook</option>
              </select>
            </div>

            {sourceType === "cookbook" && (
              <div className="recipe-form__field">
                <label>Cookbook</label>
                <select
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                >
                  <option value="">Select cookbook...</option>
                  {cookbookSources.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            <div className="recipe-form__field">
              <label>Author (optional)</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Recipe author"
              />
            </div>
          </div>
        </section>

        {/* Timing & Servings */}
        <section className="recipe-form__section">
          <h3 className="recipe-form__section-title">Timing & Servings</h3>

          <div className="recipe-form__row">
            <div className="recipe-form__field recipe-form__field--small">
              <label>Prep Time (min)</label>
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
            <div className="recipe-form__field recipe-form__field--small">
              <label>Cook Time (min)</label>
              <input
                type="number"
                value={cookTime}
                onChange={(e) => setCookTime(parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
            <div className="recipe-form__field recipe-form__field--small">
              <label>Servings</label>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
            <div className="recipe-form__field recipe-form__field--small">
              <label>Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as RecipeDifficulty)}
              >
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Categorization */}
        <section className="recipe-form__section">
          <h3 className="recipe-form__section-title">Categorization</h3>

          <div className="recipe-form__field">
            <label>Courses</label>
            <div className="recipe-form__course-options">
              {COURSE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`recipe-form__course-option ${courses.includes(opt.value) ? "recipe-form__course-option--selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={courses.includes(opt.value)}
                    onChange={() => toggleCourse(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="recipe-form__row">
            <div className="recipe-form__field">
              <label>Cuisine (optional)</label>
              <input
                type="text"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder="e.g., Italian, Mexican, Japanese"
              />
            </div>
          </div>

          <div className="recipe-form__field">
            <label>Tags</label>
            <div className="recipe-form__tags-input">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <button type="button" onClick={handleAddTag}>
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="recipe-form__tags-list">
                {tags.map((tag) => (
                  <span key={tag} className="recipe-form__tag">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Equipment */}
        <section className="recipe-form__section">
          <h3 className="recipe-form__section-title">Required Equipment</h3>

          <div className="recipe-form__field">
            <div className="recipe-form__equipment-input">
              <input
                type="text"
                value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
                placeholder="e.g., Dutch oven, Immersion blender"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddEquipment();
                  }
                }}
              />
              <button type="button" onClick={handleAddEquipment}>
                Add
              </button>
            </div>
            {requiredEquipment.length > 0 && (
              <div className="recipe-form__equipment-list">
                {requiredEquipment.map((eq) => (
                  <span key={eq} className="recipe-form__equipment-item">
                    {eq}
                    <button type="button" onClick={() => handleRemoveEquipment(eq)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Ingredients */}
        <section className="recipe-form__section">
          <h3 className="recipe-form__section-title">
            Ingredients
            <button
              type="button"
              className="recipe-form__add-btn"
              onClick={handleAddIngredient}
            >
              + Add Ingredient
            </button>
          </h3>

          <div className="recipe-form__ingredients">
            {ingredients.map((ing, index) => (
              <div key={ing.id} className="recipe-form__ingredient">
                <div className="recipe-form__ingredient-row">
                  <div className="recipe-form__qty-wrapper">
                    <input
                      type="text"
                      value={quantityStrings[ing.id] ?? formatAsFraction(ing.quantity)}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      placeholder="1/2"
                      className="recipe-form__ingredient-qty"
                    />
                    <select
                      className="recipe-form__qty-preset"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          const currentValue = (quantityStrings[ing.id] ?? formatAsFraction(ing.quantity)).trim();
                          const selectedFraction = e.target.value;

                          // If current value is a whole number and we're adding a fraction, combine them
                          if (currentValue && /^\d+$/.test(currentValue) && selectedFraction.includes("/")) {
                            handleQuantityChange(index, `${currentValue} ${selectedFraction}`);
                          } else {
                            // Otherwise replace the value
                            handleQuantityChange(index, selectedFraction);
                          }
                        }
                      }}
                      title="Quick fraction select"
                    >
                      <option value="">⌄</option>
                      <option value="pinch">pinch</option>
                      <option value="1/8">⅛</option>
                      <option value="1/4">¼</option>
                      <option value="1/3">⅓</option>
                      <option value="1/2">½</option>
                      <option value="2/3">⅔</option>
                      <option value="3/4">¾</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={(e) => handleUpdateIngredient(index, { unit: e.target.value })}
                    placeholder="Unit"
                    className="recipe-form__ingredient-unit"
                  />
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => handleUpdateIngredient(index, { name: e.target.value })}
                    placeholder="Ingredient name"
                    className="recipe-form__ingredient-name"
                  />
                  <select
                    value={ing.category}
                    onChange={(e) =>
                      handleUpdateIngredient(index, { category: e.target.value as IngredientCategory })
                    }
                    className="recipe-form__ingredient-category"
                  >
                    {INGREDIENT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <label className="recipe-form__ingredient-optional">
                    <input
                      type="checkbox"
                      checked={ing.optional}
                      onChange={(e) =>
                        handleUpdateIngredient(index, { optional: e.target.checked })
                      }
                    />
                    Optional
                  </label>
                  <button
                    type="button"
                    className="recipe-form__remove-btn"
                    onClick={() => handleRemoveIngredient(index)}
                  >
                    ×
                  </button>
                </div>
                <input
                  type="text"
                  value={ing.preparation || ""}
                  onChange={(e) =>
                    handleUpdateIngredient(index, { preparation: e.target.value })
                  }
                  placeholder="Preparation (e.g., minced, room temperature)"
                  className="recipe-form__ingredient-prep"
                />
              </div>
            ))}

            {ingredients.length === 0 && (
              <p className="recipe-form__empty">
                No ingredients yet. Click "Add Ingredient" to start.
              </p>
            )}
          </div>
        </section>

        {/* Steps */}
        <section className="recipe-form__section">
          <h3 className="recipe-form__section-title">
            Instructions
            <button
              type="button"
              className="recipe-form__add-btn"
              onClick={handleAddStep}
            >
              + Add Step
            </button>
          </h3>

          <div className="recipe-form__steps">
            {steps.map((step, index) => (
              <div key={index} className="recipe-form__step">
                <div className="recipe-form__step-header">
                  <span className="recipe-form__step-number">{step.stepNumber}</span>
                  <div className="recipe-form__step-meta">
                    <input
                      type="number"
                      value={step.duration || ""}
                      onChange={(e) =>
                        handleUpdateStep(index, {
                          duration: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Duration (min)"
                      className="recipe-form__step-duration"
                      min="0"
                    />
                    <label className="recipe-form__step-active">
                      <input
                        type="checkbox"
                        checked={step.isActive}
                        onChange={(e) =>
                          handleUpdateStep(index, { isActive: e.target.checked })
                        }
                      />
                      Active
                    </label>
                  </div>
                  <button
                    type="button"
                    className="recipe-form__remove-btn"
                    onClick={() => handleRemoveStep(index)}
                  >
                    ×
                  </button>
                </div>
                <textarea
                  value={step.instruction}
                  onChange={(e) =>
                    handleUpdateStep(index, { instruction: e.target.value })
                  }
                  placeholder="Describe this step..."
                  rows={3}
                />
                <div className="recipe-form__step-extras">
                  <input
                    type="text"
                    value={step.technique || ""}
                    onChange={(e) =>
                      handleUpdateStep(index, { technique: e.target.value })
                    }
                    placeholder="Technique (e.g., sear, braise)"
                    className="recipe-form__step-technique"
                  />
                  <input
                    type="text"
                    value={step.tip || ""}
                    onChange={(e) => handleUpdateStep(index, { tip: e.target.value })}
                    placeholder="Tip (optional)"
                    className="recipe-form__step-tip"
                  />
                </div>
              </div>
            ))}

            {steps.length === 0 && (
              <p className="recipe-form__empty">
                No steps yet. Click "Add Step" to start.
              </p>
            )}
          </div>
        </section>

        {/* Chef Notes */}
        <section className="recipe-form__section">
          <h3 className="recipe-form__section-title">Chef's Notes (optional)</h3>
          <textarea
            value={chefNotes}
            onChange={(e) => setChefNotes(e.target.value)}
            placeholder="Add any notes, tips, or variations..."
            rows={4}
          />
        </section>
      </div>

      {/* Actions */}
      <div className="recipe-form__actions">
        <button
          type="button"
          className="recipe-form__btn recipe-form__btn--secondary"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="recipe-form__btn recipe-form__btn--primary"
        >
          {isEditing ? "Save Changes" : "Add Recipe"}
        </button>
      </div>
    </form>
  );
}
