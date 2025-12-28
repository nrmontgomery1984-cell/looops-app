// Recipe Card Component
import React from "react";
import {
  Recipe,
  formatTime,
  getDifficultyLabel,
  getDifficultyColor,
} from "../../types/mealPrep";

interface RecipeCardProps {
  recipe: Recipe;
  onView: () => void;
  onToggleFavorite: () => void;
  onAddToPlan?: () => void;
  compact?: boolean;
}

export function RecipeCard({
  recipe,
  onView,
  onToggleFavorite,
  onAddToPlan,
  compact = false,
}: RecipeCardProps) {
  const difficultyColor = getDifficultyColor(recipe.difficulty);
  const difficultyDots = {
    easy: 1,
    medium: 2,
    advanced: 3,
    project: 4,
  }[recipe.difficulty];

  return (
    <div className={`recipe-card ${compact ? "recipe-card--compact" : ""}`}>
      {/* Image or Placeholder */}
      <div className="recipe-card__image" onClick={onView}>
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.title} />
        ) : (
          <div className="recipe-card__placeholder">
            <span className="recipe-card__placeholder-icon">🍽️</span>
          </div>
        )}
        {recipe.isFavorite && (
          <span className="recipe-card__favorite-badge">★</span>
        )}
      </div>

      {/* Content */}
      <div className="recipe-card__content">
        <h3 className="recipe-card__title" onClick={onView}>
          {recipe.title}
        </h3>

        <div className="recipe-card__source">
          {recipe.source.name}
          {recipe.author && ` • ${recipe.author}`}
        </div>

        <div className="recipe-card__meta">
          <span className="recipe-card__time">
            <span className="recipe-card__time-icon">⏱</span>
            {formatTime(recipe.totalTime)}
          </span>
          <span className="recipe-card__divider">│</span>
          <span className="recipe-card__servings">
            <span className="recipe-card__servings-icon">🍽</span>
            {recipe.servings} servings
          </span>
        </div>

        <div className="recipe-card__difficulty">
          <span className="recipe-card__difficulty-label">Difficulty:</span>
          <span className="recipe-card__difficulty-dots">
            {Array.from({ length: 4 }).map((_, i) => (
              <span
                key={i}
                className="recipe-card__difficulty-dot"
                style={{
                  backgroundColor: i < difficultyDots ? difficultyColor : "transparent",
                  borderColor: difficultyColor,
                }}
              />
            ))}
          </span>
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && !compact && (
          <div className="recipe-card__tags">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="recipe-card__tag">
                {tag}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="recipe-card__tag recipe-card__tag--more">
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="recipe-card__actions">
          {onAddToPlan && (
            <button
              className="recipe-card__action recipe-card__action--plan"
              onClick={onAddToPlan}
              title="Add to Plan"
            >
              + Plan
            </button>
          )}
          <button
            className="recipe-card__action recipe-card__action--view"
            onClick={onView}
          >
            View
          </button>
          <button
            className={`recipe-card__action recipe-card__action--favorite ${recipe.isFavorite ? "recipe-card__action--favorited" : ""}`}
            onClick={onToggleFavorite}
            title={recipe.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {recipe.isFavorite ? "★" : "☆"}
          </button>
        </div>

        {/* Stats (if made before) */}
        {recipe.timesMade > 0 && (
          <div className="recipe-card__stats">
            <span className="recipe-card__made-count">
              Made {recipe.timesMade} time{recipe.timesMade !== 1 ? "s" : ""}
            </span>
            {recipe.rating && (
              <span className="recipe-card__rating">
                {"★".repeat(recipe.rating)}{"☆".repeat(5 - recipe.rating)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
