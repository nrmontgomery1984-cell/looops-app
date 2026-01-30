// Recipe Detail View Component
import React, { useState, useEffect, useRef } from "react";
import { useApp, useKitchenProfile } from "../../context";
import {
  Recipe,
  formatTime,
  getDifficultyLabel,
  getDifficultyColor,
} from "../../types/mealPrep";

interface RecipeDetailProps {
  recipe: Recipe;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: (recipeId: string) => void;
}

export function RecipeDetail({ recipe, onClose, onEdit, onDelete }: RecipeDetailProps) {
  const { dispatch } = useApp();
  const kitchenProfile = useKitchenProfile();

  const [servings, setServings] = useState(recipe.servings);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [userNotes, setUserNotes] = useState(recipe.userNotes || "");
  const [showNotesEditor, setShowNotesEditor] = useState(false);
  const [rating, setRating] = useState(recipe.rating || 0);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);

  // Cook mode state (prevents screen from sleeping)
  const [cookModeActive, setCookModeActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Wake Lock effect for cook mode
  useEffect(() => {
    const requestWakeLock = async () => {
      if (cookModeActive && "wakeLock" in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
          wakeLockRef.current.addEventListener("release", () => {
            // Wake lock was released (e.g., tab became hidden)
          });
        } catch (err) {
          // Wake lock request failed (e.g., low battery)
          console.log("Wake lock request failed:", err);
        }
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        } catch (err) {
          console.log("Wake lock release failed:", err);
        }
      }
    };

    if (cookModeActive) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // Re-acquire wake lock when tab becomes visible again
    const handleVisibilityChange = () => {
      if (cookModeActive && document.visibilityState === "visible") {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [cookModeActive]);

  // Cleanup wake lock when component unmounts
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  const scaleFactor = servings / recipe.servings;

  // Check if user has required equipment
  const missingEquipment = recipe.requiredEquipment.filter((eq) => {
    if (!kitchenProfile) return false;
    return !kitchenProfile.equipment.some(
      (ue) => ue.owned && ue.name.toLowerCase().includes(eq.toLowerCase())
    );
  });

  const toggleIngredient = (id: string) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedIngredients(newChecked);
  };

  const toggleStep = (stepNumber: number) => {
    const newChecked = new Set(checkedSteps);
    if (newChecked.has(stepNumber)) {
      newChecked.delete(stepNumber);
    } else {
      newChecked.add(stepNumber);
    }
    setCheckedSteps(newChecked);
  };

  const handleToggleFavorite = () => {
    dispatch({ type: "TOGGLE_RECIPE_FAVORITE", payload: recipe.id });
  };

  const handleLogMade = () => {
    dispatch({
      type: "LOG_RECIPE_MADE",
      payload: { recipeId: recipe.id, date: new Date().toISOString() },
    });
  };

  const handleSaveNotes = () => {
    dispatch({
      type: "UPDATE_RECIPE",
      payload: { ...recipe, userNotes },
    });
    setShowNotesEditor(false);
  };

  const handleSaveRating = (newRating: number) => {
    setRating(newRating);
    dispatch({
      type: "UPDATE_RECIPE",
      payload: { ...recipe, rating: newRating },
    });
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setDeleteStep(1);
  };

  const handleDeleteConfirm = () => {
    if (deleteStep === 1) {
      setDeleteStep(2);
    } else {
      // Step 2 - actually delete
      if (onDelete) {
        onDelete(recipe.id);
      }
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeleteStep(1);
  };

  const formatQuantity = (quantity: number | null | undefined): string => {
    if (quantity === null || quantity === undefined) return "1";
    const scaled = quantity * scaleFactor;

    // Special small quantities (when not scaled or scaled to similar values)
    if (scaled === 0) return "to taste";
    if (Math.abs(scaled - 0.0625) < 0.02) return "pinch";

    // Handle whole numbers
    if (scaled === Math.floor(scaled)) {
      return scaled.toString();
    }

    // Common fractions with Unicode symbols
    const fractions: [number, string][] = [
      [0.125, "⅛"],
      [0.25, "¼"],
      [0.333, "⅓"],
      [0.375, "⅜"],
      [0.5, "½"],
      [0.625, "⅝"],
      [0.667, "⅔"],
      [0.75, "¾"],
      [0.875, "⅞"],
    ];

    const whole = Math.floor(scaled);
    const decimal = scaled - whole;

    // Find closest matching fraction
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

    return scaled.toFixed(1);
  };

  return (
    <div className="recipe-detail">
      {/* Header */}
      <div className="recipe-detail__header">
        <button className="recipe-detail__back" onClick={onClose}>
          ← Back
        </button>
        <div className="recipe-detail__actions">
          <button
            className={`recipe-detail__action recipe-detail__action--cook-mode ${cookModeActive ? "recipe-detail__action--cook-mode-active" : ""}`}
            onClick={() => setCookModeActive(!cookModeActive)}
            title={cookModeActive ? "Turn off Cook Mode (screen will sleep)" : "Turn on Cook Mode (keeps screen on)"}
          >
            {cookModeActive ? "🍳 Cooking" : "🍳 Cook"}
          </button>
          <button
            className={`recipe-detail__action ${recipe.isFavorite ? "recipe-detail__action--active" : ""}`}
            onClick={handleToggleFavorite}
            title={recipe.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {recipe.isFavorite ? "★" : "☆"}
          </button>
          {onEdit && (
            <button className="recipe-detail__action" onClick={onEdit}>
              Edit
            </button>
          )}
          {onDelete && (
            <button
              className="recipe-detail__action recipe-detail__action--delete"
              onClick={handleDeleteClick}
              title="Delete recipe"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="recipe-detail__delete-modal-overlay" onClick={handleDeleteCancel}>
          <div className="recipe-detail__delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="recipe-detail__delete-modal-icon">
              {deleteStep === 1 ? "⚠️" : "🗑️"}
            </div>
            <h3 className="recipe-detail__delete-modal-title">
              {deleteStep === 1 ? "Delete Recipe?" : "Are you absolutely sure?"}
            </h3>
            <p className="recipe-detail__delete-modal-text">
              {deleteStep === 1
                ? `This will permanently delete "${recipe.title}" from your collection.`
                : "This action cannot be undone. The recipe will be permanently removed."}
            </p>
            <div className="recipe-detail__delete-modal-actions">
              <button
                type="button"
                className="recipe-detail__delete-modal-btn recipe-detail__delete-modal-btn--cancel"
                onClick={handleDeleteCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="recipe-detail__delete-modal-btn recipe-detail__delete-modal-btn--confirm"
                onClick={handleDeleteConfirm}
              >
                {deleteStep === 1 ? "Yes, Delete" : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="recipe-detail__hero">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="recipe-detail__image"
          />
        ) : (
          <div className="recipe-detail__placeholder">
            <span>🍽️</span>
          </div>
        )}
      </div>

      {/* Title & Meta */}
      <div className="recipe-detail__title-section">
        <h1 className="recipe-detail__title">{recipe.title}</h1>

        <div className="recipe-detail__source">
          <span className="recipe-detail__source-name">{recipe.source.name}</span>
          {recipe.author && (
            <span className="recipe-detail__author">by {recipe.author}</span>
          )}
          {recipe.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="recipe-detail__source-link"
            >
              View Original →
            </a>
          )}
        </div>

        {/* Time & Difficulty */}
        <div className="recipe-detail__meta-row">
          <div className="recipe-detail__time-breakdown">
            <div className="recipe-detail__time-item">
              <span className="recipe-detail__time-label">Prep</span>
              <span className="recipe-detail__time-value">{formatTime(recipe.prepTime)}</span>
            </div>
            <div className="recipe-detail__time-item">
              <span className="recipe-detail__time-label">Cook</span>
              <span className="recipe-detail__time-value">{formatTime(recipe.cookTime)}</span>
            </div>
            <div className="recipe-detail__time-item recipe-detail__time-item--total">
              <span className="recipe-detail__time-label">Total</span>
              <span className="recipe-detail__time-value">{formatTime(recipe.totalTime)}</span>
            </div>
          </div>

          <div
            className="recipe-detail__difficulty"
            style={{ borderColor: getDifficultyColor(recipe.difficulty) }}
          >
            <span
              className="recipe-detail__difficulty-badge"
              style={{ backgroundColor: getDifficultyColor(recipe.difficulty) }}
            >
              {getDifficultyLabel(recipe.difficulty)}
            </span>
          </div>
        </div>

        {/* Servings Control */}
        <div className="recipe-detail__servings">
          <span className="recipe-detail__servings-label">Servings:</span>
          <div className="recipe-detail__servings-control">
            <button
              className="recipe-detail__servings-btn"
              onClick={() => setServings(Math.max(1, servings - 1))}
              disabled={servings <= 1}
            >
              −
            </button>
            <span className="recipe-detail__servings-value">{servings}</span>
            <button
              className="recipe-detail__servings-btn"
              onClick={() => setServings(servings + 1)}
            >
              +
            </button>
          </div>
          {servings !== recipe.servings && (
            <button
              className="recipe-detail__servings-reset"
              onClick={() => setServings(recipe.servings)}
            >
              Reset to {recipe.servings}
            </button>
          )}
        </div>

        {/* Equipment Warning */}
        {missingEquipment.length > 0 && (
          <div className="recipe-detail__warning">
            <span className="recipe-detail__warning-icon">⚠️</span>
            <span className="recipe-detail__warning-text">
              Requires equipment you may not have: {missingEquipment.join(", ")}
            </span>
          </div>
        )}

        {/* Required Equipment */}
        {recipe.requiredEquipment.length > 0 && (
          <div className="recipe-detail__equipment">
            <h3 className="recipe-detail__section-title">Equipment Needed</h3>
            <div className="recipe-detail__equipment-list">
              {recipe.requiredEquipment.map((eq) => (
                <span
                  key={eq}
                  className={`recipe-detail__equipment-item ${missingEquipment.includes(eq) ? "recipe-detail__equipment-item--missing" : ""}`}
                >
                  {eq}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ingredients */}
      <div className="recipe-detail__ingredients">
        <h2 className="recipe-detail__section-title">
          Ingredients
          <span className="recipe-detail__section-count">
            {checkedIngredients.size}/{recipe.ingredients.length}
          </span>
        </h2>
        <ul className="recipe-detail__ingredient-list">
          {recipe.ingredients.map((ing) => (
            <li
              key={ing.id}
              className={`recipe-detail__ingredient ${checkedIngredients.has(ing.id) ? "recipe-detail__ingredient--checked" : ""} ${ing.optional ? "recipe-detail__ingredient--optional" : ""}`}
              onClick={() => toggleIngredient(ing.id)}
            >
              <span className="recipe-detail__ingredient-check">
                {checkedIngredients.has(ing.id) ? "✓" : ""}
              </span>
              <span className="recipe-detail__ingredient-quantity">
                {formatQuantity(ing.quantity)} {ing.unit}
              </span>
              <span className="recipe-detail__ingredient-name">
                {ing.name}
                {ing.preparation && (
                  <span className="recipe-detail__ingredient-prep">, {ing.preparation}</span>
                )}
              </span>
              {ing.optional && (
                <span className="recipe-detail__ingredient-optional">(optional)</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Instructions */}
      <div className="recipe-detail__instructions">
        <h2 className="recipe-detail__section-title">
          Instructions
          <span className="recipe-detail__section-count">
            {checkedSteps.size}/{recipe.steps.length}
          </span>
        </h2>
        <ol className="recipe-detail__step-list">
          {recipe.steps.map((step) => (
            <li
              key={step.stepNumber}
              className={`recipe-detail__step ${checkedSteps.has(step.stepNumber) ? "recipe-detail__step--checked" : ""} ${!step.isActive ? "recipe-detail__step--passive" : ""}`}
              onClick={() => toggleStep(step.stepNumber)}
            >
              <div className="recipe-detail__step-header">
                <span className="recipe-detail__step-number">{step.stepNumber}</span>
                {step.duration && (
                  <span className="recipe-detail__step-duration">
                    {step.isActive ? "⏱" : "⏸"} {formatTime(step.duration)}
                  </span>
                )}
                {step.technique && (
                  <span className="recipe-detail__step-technique">{step.technique}</span>
                )}
              </div>
              <p className="recipe-detail__step-instruction">{step.instruction}</p>
              {step.tip && (
                <div className="recipe-detail__step-tip">
                  <span className="recipe-detail__step-tip-icon">💡</span>
                  {step.tip}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Chef Notes */}
      {recipe.chefNotes && (
        <div className="recipe-detail__chef-notes">
          <h2 className="recipe-detail__section-title">Chef's Notes</h2>
          <p className="recipe-detail__notes-text">{recipe.chefNotes}</p>
        </div>
      )}

      {/* User Notes */}
      <div className="recipe-detail__user-notes">
        <h2 className="recipe-detail__section-title">
          My Notes
          {!showNotesEditor && (
            <button
              className="recipe-detail__notes-edit"
              onClick={() => setShowNotesEditor(true)}
            >
              {userNotes ? "Edit" : "+ Add Notes"}
            </button>
          )}
        </h2>
        {showNotesEditor ? (
          <div className="recipe-detail__notes-editor">
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Add your personal notes, modifications, or tips..."
              rows={4}
            />
            <div className="recipe-detail__notes-actions">
              <button
                className="recipe-detail__notes-cancel"
                onClick={() => {
                  setUserNotes(recipe.userNotes || "");
                  setShowNotesEditor(false);
                }}
              >
                Cancel
              </button>
              <button
                className="recipe-detail__notes-save"
                onClick={handleSaveNotes}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          userNotes && (
            <p className="recipe-detail__notes-text">{userNotes}</p>
          )
        )}
      </div>

      {/* Rating & Stats */}
      <div className="recipe-detail__footer">
        <div className="recipe-detail__rating">
          <span className="recipe-detail__rating-label">Rate this recipe:</span>
          <div className="recipe-detail__rating-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`recipe-detail__rating-star ${star <= rating ? "recipe-detail__rating-star--active" : ""}`}
                onClick={() => handleSaveRating(star)}
              >
                {star <= rating ? "★" : "☆"}
              </button>
            ))}
          </div>
        </div>

        <div className="recipe-detail__stats">
          {recipe.timesMade > 0 && (
            <span className="recipe-detail__stat">
              Made {recipe.timesMade} time{recipe.timesMade !== 1 ? "s" : ""}
            </span>
          )}
          {recipe.lastMade && (
            <span className="recipe-detail__stat">
              Last made: {new Date(recipe.lastMade).toLocaleDateString()}
            </span>
          )}
        </div>

        <button
          className="recipe-detail__made-btn"
          onClick={handleLogMade}
        >
          I Made This!
        </button>
      </div>

      {/* Nutrition (if available) */}
      {recipe.nutrition && (
        <div className="recipe-detail__nutrition">
          <h2 className="recipe-detail__section-title">Nutrition</h2>
          <div className="recipe-detail__nutrition-grid">
            {recipe.nutrition.calories && (
              <div className="recipe-detail__nutrition-item">
                <span className="recipe-detail__nutrition-value">{recipe.nutrition.calories}</span>
                <span className="recipe-detail__nutrition-label">Calories</span>
              </div>
            )}
            {recipe.nutrition.protein && (
              <div className="recipe-detail__nutrition-item">
                <span className="recipe-detail__nutrition-value">{recipe.nutrition.protein}g</span>
                <span className="recipe-detail__nutrition-label">Protein</span>
              </div>
            )}
            {recipe.nutrition.carbs && (
              <div className="recipe-detail__nutrition-item">
                <span className="recipe-detail__nutrition-value">{recipe.nutrition.carbs}g</span>
                <span className="recipe-detail__nutrition-label">Carbs</span>
              </div>
            )}
            {recipe.nutrition.fat && (
              <div className="recipe-detail__nutrition-item">
                <span className="recipe-detail__nutrition-value">{recipe.nutrition.fat}g</span>
                <span className="recipe-detail__nutrition-label">Fat</span>
              </div>
            )}
          </div>
          {recipe.nutrition.perServing && (
            <p className="recipe-detail__nutrition-note">Per serving</p>
          )}
        </div>
      )}

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div className="recipe-detail__tags">
          {recipe.tags.map((tag) => (
            <span key={tag} className="recipe-detail__tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
