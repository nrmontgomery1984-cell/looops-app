// Recipe Detail View Component
import React, { useState } from "react";
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
}

export function RecipeDetail({ recipe, onClose, onEdit }: RecipeDetailProps) {
  const { dispatch } = useApp();
  const kitchenProfile = useKitchenProfile();

  const [servings, setServings] = useState(recipe.servings);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [userNotes, setUserNotes] = useState(recipe.userNotes || "");
  const [showNotesEditor, setShowNotesEditor] = useState(false);
  const [rating, setRating] = useState(recipe.rating || 0);

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

  const formatQuantity = (quantity: number): string => {
    const scaled = quantity * scaleFactor;
    // Handle fractions nicely
    if (scaled === Math.floor(scaled)) {
      return scaled.toString();
    }
    // Common fractions
    const fractions: Record<number, string> = {
      0.25: "¼",
      0.33: "⅓",
      0.5: "½",
      0.67: "⅔",
      0.75: "¾",
    };
    const decimal = scaled - Math.floor(scaled);
    for (const [dec, frac] of Object.entries(fractions)) {
      if (Math.abs(decimal - parseFloat(dec)) < 0.05) {
        return Math.floor(scaled) > 0
          ? `${Math.floor(scaled)} ${frac}`
          : frac;
      }
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
        </div>
      </div>

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
