// Import Recipe Modal - Parse recipes from approved URLs
import { useState } from "react";
import {
  Recipe,
  isApprovedUrl,
  getSourceFromUrl,
  APPROVED_DOMAINS,
  createRecipe,
} from "../../types/mealPrep";

interface ImportRecipeModalProps {
  onImport: (recipe: Recipe) => void;
  onClose: () => void;
}

type ImportStep = "url" | "parsing" | "review" | "error";

interface ParsedRecipeData {
  title: string;
  author?: string;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "advanced" | "project";
  requiredEquipment: string[];
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    preparation?: string;
    optional: boolean;
    category: string;
  }>;
  steps: Array<{
    stepNumber: number;
    instruction: string;
    duration?: number;
    isActive: boolean;
    technique?: string;
    tip?: string;
  }>;
  tags: string[];
  chefNotes?: string;
  imageUrl?: string;
}

export function ImportRecipeModal({ onImport, onClose }: ImportRecipeModalProps) {
  const [step, setStep] = useState<ImportStep>("url");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRecipeData | null>(null);

  // Editable fields for review step
  const [editedTitle, setEditedTitle] = useState("");
  const [editedServings, setEditedServings] = useState(4);
  const [editedPrepTime, setEditedPrepTime] = useState(0);
  const [editedCookTime, setEditedCookTime] = useState(0);
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [editedCourse, setEditedCourse] = useState<string[]>(["dinner"]);
  const [newTag, setNewTag] = useState("");

  const COURSE_OPTIONS = ["breakfast", "lunch", "dinner", "snack", "dessert"] as const;

  const handleUrlSubmit = async () => {
    setError(null);

    // Validate URL format
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    // Check if URL is from approved source
    if (!isApprovedUrl(url)) {
      setError(
        `This URL is not from an approved source. We only import from: ${APPROVED_DOMAINS.join(", ")}`
      );
      return;
    }

    setStep("parsing");

    try {
      // Call the API to parse the recipe
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${API_BASE_URL}/api/ai/parse-recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Failed to parse recipe");
      }

      const data = await response.json();

      if (data.success && data.recipe) {
        setParsedData(data.recipe);
        setEditedTitle(data.recipe.title);
        setEditedServings(data.recipe.servings);
        setEditedPrepTime(data.recipe.prepTime);
        setEditedCookTime(data.recipe.cookTime);
        setEditedTags(data.recipe.tags || []);
        setEditedCourse(data.recipe.course || ["dinner"]);
        setStep("review");
      } else {
        throw new Error(data.error || "Failed to parse recipe");
      }
    } catch (err) {
      console.error("Recipe parse error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to parse recipe. The page might be unavailable or have an unexpected format."
      );
      setStep("error");
    }
  };

  const handleImport = () => {
    if (!parsedData) return;

    const source = getSourceFromUrl(url);
    const recipe = createRecipe({
      title: editedTitle,
      source: source || { type: "website", name: "Unknown", approved: false },
      sourceUrl: url,
      author: parsedData.author,
      prepTime: editedPrepTime,
      cookTime: editedCookTime,
      totalTime: editedPrepTime + editedCookTime,
      servings: editedServings,
      difficulty: parsedData.difficulty,
      techniqueLevel: parsedData.difficulty === "easy" ? "basic" : parsedData.difficulty === "project" ? "advanced" : "intermediate",
      requiredEquipment: parsedData.requiredEquipment,
      ingredients: parsedData.ingredients.map((ing, i) => ({
        id: `ing_${Date.now()}_${i}`,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        preparation: ing.preparation,
        optional: ing.optional,
        normalizedName: ing.name.toLowerCase(),
        category: ing.category as any || "other",
      })),
      steps: parsedData.steps,
      tags: editedTags,
      chefNotes: parsedData.chefNotes,
      imageUrl: parsedData.imageUrl,
      course: editedCourse as ("breakfast" | "lunch" | "dinner" | "snack" | "dessert")[],
    });

    onImport(recipe);
  };

  const handleRetry = () => {
    setError(null);
    setStep("url");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="import-recipe-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="import-recipe-modal__header">
          <h2>Import Recipe</h2>
          <button className="import-recipe-modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* URL Input Step */}
        {step === "url" && (
          <div className="import-recipe-modal__content">
            <div className="import-recipe-modal__url-section">
              <label className="import-recipe-modal__label">
                Paste a recipe URL from an approved source:
              </label>
              <div className="import-recipe-modal__url-input">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.seriouseats.com/..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUrlSubmit();
                    }
                  }}
                />
                <button
                  className="import-recipe-modal__submit"
                  onClick={handleUrlSubmit}
                  disabled={!url.trim()}
                >
                  Import
                </button>
              </div>
              {error && (
                <p className="import-recipe-modal__error">{error}</p>
              )}
            </div>

            <div className="import-recipe-modal__sources">
              <p className="import-recipe-modal__sources-label">Approved sources:</p>
              <div className="import-recipe-modal__sources-list">
                {APPROVED_DOMAINS.map((domain) => (
                  <span key={domain} className="import-recipe-modal__source">
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Parsing Step */}
        {step === "parsing" && (
          <div className="import-recipe-modal__content import-recipe-modal__content--centered">
            <div className="import-recipe-modal__loading">
              <div className="import-recipe-modal__spinner" />
              <p>Parsing recipe...</p>
              <p className="import-recipe-modal__loading-hint">
                This may take a moment as we extract the recipe details.
              </p>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === "review" && parsedData && (
          <div className="import-recipe-modal__content">
            <div className="import-recipe-modal__preview">
              {/* Image */}
              {parsedData.imageUrl && (
                <div className="import-recipe-modal__preview-image">
                  <img src={parsedData.imageUrl} alt={editedTitle} />
                </div>
              )}

              {/* Editable Title */}
              <div className="import-recipe-modal__field">
                <label>Title</label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                />
              </div>

              {/* Source */}
              <div className="import-recipe-modal__source-preview">
                <span className="import-recipe-modal__source-badge">
                  {getSourceFromUrl(url)?.name}
                </span>
                {parsedData.author && (
                  <span className="import-recipe-modal__author">
                    by {parsedData.author}
                  </span>
                )}
              </div>

              {/* Time Fields */}
              <div className="import-recipe-modal__row">
                <div className="import-recipe-modal__field import-recipe-modal__field--small">
                  <label>Prep Time (min)</label>
                  <input
                    type="number"
                    value={editedPrepTime}
                    onChange={(e) => setEditedPrepTime(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>
                <div className="import-recipe-modal__field import-recipe-modal__field--small">
                  <label>Cook Time (min)</label>
                  <input
                    type="number"
                    value={editedCookTime}
                    onChange={(e) => setEditedCookTime(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>
                <div className="import-recipe-modal__field import-recipe-modal__field--small">
                  <label>Servings</label>
                  <input
                    type="number"
                    value={editedServings}
                    onChange={(e) => setEditedServings(parseInt(e.target.value) || 1)}
                    min={1}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="import-recipe-modal__summary">
                <div className="import-recipe-modal__summary-item">
                  <span className="import-recipe-modal__summary-count">
                    {parsedData.ingredients.length}
                  </span>
                  <span className="import-recipe-modal__summary-label">Ingredients</span>
                </div>
                <div className="import-recipe-modal__summary-item">
                  <span className="import-recipe-modal__summary-count">
                    {parsedData.steps.length}
                  </span>
                  <span className="import-recipe-modal__summary-label">Steps</span>
                </div>
                <div className="import-recipe-modal__summary-item">
                  <span className="import-recipe-modal__summary-count">
                    {parsedData.difficulty}
                  </span>
                  <span className="import-recipe-modal__summary-label">Difficulty</span>
                </div>
              </div>

              {/* Equipment */}
              {parsedData.requiredEquipment.length > 0 && (
                <div className="import-recipe-modal__equipment">
                  <label>Required Equipment:</label>
                  <div className="import-recipe-modal__equipment-list">
                    {parsedData.requiredEquipment.map((eq) => (
                      <span key={eq} className="import-recipe-modal__equipment-item">
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Course/Category */}
              <div className="import-recipe-modal__course">
                <label>Course:</label>
                <div className="import-recipe-modal__course-options">
                  {COURSE_OPTIONS.map((course) => (
                    <label key={course} className="import-recipe-modal__course-option">
                      <input
                        type="checkbox"
                        checked={editedCourse.includes(course)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditedCourse([...editedCourse, course]);
                          } else {
                            setEditedCourse(editedCourse.filter((c) => c !== course));
                          }
                        }}
                      />
                      <span>{course}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="import-recipe-modal__tags">
                <label>Tags:</label>
                <div className="import-recipe-modal__tags-list">
                  {editedTags.map((tag) => (
                    <span key={tag} className="import-recipe-modal__tag import-recipe-modal__tag--editable">
                      {tag}
                      <button
                        className="import-recipe-modal__tag-remove"
                        onClick={() => setEditedTags(editedTags.filter((t) => t !== tag))}
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="import-recipe-modal__tag-add">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTag.trim()) {
                        e.preventDefault();
                        if (!editedTags.includes(newTag.trim())) {
                          setEditedTags([...editedTags, newTag.trim()]);
                        }
                        setNewTag("");
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTag.trim() && !editedTags.includes(newTag.trim())) {
                        setEditedTags([...editedTags, newTag.trim()]);
                        setNewTag("");
                      }
                    }}
                    disabled={!newTag.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="import-recipe-modal__actions">
              <button
                className="import-recipe-modal__btn import-recipe-modal__btn--secondary"
                onClick={handleRetry}
              >
                Try Different URL
              </button>
              <button
                className="import-recipe-modal__btn import-recipe-modal__btn--primary"
                onClick={handleImport}
              >
                Add to Collection
              </button>
            </div>
          </div>
        )}

        {/* Error Step */}
        {step === "error" && (
          <div className="import-recipe-modal__content import-recipe-modal__content--centered">
            <div className="import-recipe-modal__error-state">
              <span className="import-recipe-modal__error-icon">⚠️</span>
              <h3>Failed to import recipe</h3>
              <p>{error}</p>
              <button
                className="import-recipe-modal__btn import-recipe-modal__btn--primary"
                onClick={handleRetry}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
