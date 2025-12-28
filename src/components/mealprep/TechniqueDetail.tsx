// Technique Detail - Full view of a technique entry with all tips
import { TechniqueEntry, TechniqueTip, TechniqueSubjectType, Recipe, TipCategory } from "../../types/mealPrep";

interface TechniqueDetailProps {
  technique: TechniqueEntry;
  recipes: Recipe[];
  onBack: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onDelete?: () => void;
  onAddTip?: () => void;
}

const SUBJECT_TYPE_ICONS: Record<TechniqueSubjectType, string> = {
  ingredient: "🥕",
  technique: "🔪",
  dish: "🍲",
  equipment: "🍳",
};

const SUBJECT_TYPE_COLORS: Record<TechniqueSubjectType, string> = {
  ingredient: "#73A58C",
  technique: "#F4B942",
  dish: "#F27059",
  equipment: "#5a7fb8",
};

const TIP_CATEGORY_LABELS: Record<TipCategory, string> = {
  why: "Why It Works",
  how: "How To",
  common_mistake: "Common Mistakes",
  variation: "Variations",
  science: "The Science",
  shortcut: "Shortcuts",
};

const TIP_CATEGORY_ICONS: Record<TipCategory, string> = {
  why: "💡",
  how: "📝",
  common_mistake: "⚠️",
  variation: "🔄",
  science: "🔬",
  shortcut: "⚡",
};

export function TechniqueDetail({
  technique,
  recipes,
  onBack,
  onSelectRecipe,
  onDelete,
  onAddTip,
}: TechniqueDetailProps) {
  // Find related recipes
  const relatedRecipes = recipes.filter((r) =>
    technique.relatedRecipeIds.includes(r.id)
  );

  // Group tips by category
  const tipsByCategory = technique.tips.reduce((acc, tip) => {
    if (!acc[tip.category]) acc[tip.category] = [];
    acc[tip.category].push(tip);
    return acc;
  }, {} as Record<TipCategory, TechniqueTip[]>);

  return (
    <div className="technique-detail">
      {/* Header */}
      <div className="technique-detail__header">
        <button className="technique-detail__back" onClick={onBack}>
          ← Back to Library
        </button>
        <div className="technique-detail__actions">
          {onAddTip && (
            <button className="technique-detail__add-tip" onClick={onAddTip}>
              + Add Tip
            </button>
          )}
          {onDelete && (
            <button
              className="technique-detail__delete"
              onClick={() => {
                if (confirm("Delete this technique entry?")) {
                  onDelete();
                }
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Title & Meta */}
      <div className="technique-detail__title-section">
        <span
          className="technique-detail__type"
          style={{ backgroundColor: SUBJECT_TYPE_COLORS[technique.subjectType] }}
        >
          {SUBJECT_TYPE_ICONS[technique.subjectType]} {technique.subjectType}
        </span>
        <h1 className="technique-detail__title">{technique.subject}</h1>
        <p className="technique-detail__meta">
          {technique.tips.length} tips · {technique.sourcesCited.length} sources ·
          Last updated {new Date(technique.lastUpdated).toLocaleDateString()}
        </p>
      </div>

      {/* Tips by Category */}
      {technique.tips.length === 0 ? (
        <div className="technique-detail__empty-tips">
          <span className="technique-detail__empty-icon">📚</span>
          <h3>No tips yet</h3>
          <p>Add tips you learn about {technique.subject} from recipes, videos, or your own experience.</p>
          {onAddTip && (
            <button className="technique-detail__empty-btn" onClick={onAddTip}>
              Add Your First Tip
            </button>
          )}
        </div>
      ) : (
        <div className="technique-detail__tips">
          {(Object.keys(tipsByCategory) as TipCategory[]).map((category) => (
            <div key={category} className="technique-detail__tip-category">
              <h3 className="technique-detail__category-title">
                {TIP_CATEGORY_ICONS[category]} {TIP_CATEGORY_LABELS[category]}
              </h3>
              <div className="technique-detail__tip-list">
                {tipsByCategory[category].map((tip) => (
                  <div key={tip.id} className="technique-detail__tip">
                    <p className="technique-detail__tip-content">{tip.content}</p>
                    <div className="technique-detail__tip-meta">
                      {tip.source && (
                        <span className="technique-detail__tip-source">
                          {tip.sourceUrl ? (
                            <a href={tip.sourceUrl} target="_blank" rel="noopener noreferrer">
                              {tip.source}
                            </a>
                          ) : (
                            tip.source
                          )}
                        </span>
                      )}
                      {tip.appliesToSkillLevel && tip.appliesToSkillLevel.length > 0 && (
                        <span className="technique-detail__tip-levels">
                          For: {tip.appliesToSkillLevel.join(", ")}
                        </span>
                      )}
                      {tip.appliesToEquipment && tip.appliesToEquipment.length > 0 && (
                        <span className="technique-detail__tip-equipment">
                          Using: {tip.appliesToEquipment.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sources */}
      {technique.sourcesCited.length > 0 && (
        <div className="technique-detail__sources">
          <h3>Sources</h3>
          <ul className="technique-detail__sources-list">
            {technique.sourcesCited.map((source, i) => (
              <li key={i}>{source}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Related Recipes */}
      {relatedRecipes.length > 0 && (
        <div className="technique-detail__recipes">
          <h3>Related Recipes</h3>
          <div className="technique-detail__recipes-grid">
            {relatedRecipes.map((recipe) => (
              <button
                key={recipe.id}
                className="technique-detail__recipe-card"
                onClick={() => onSelectRecipe(recipe)}
              >
                {recipe.imageUrl && (
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="technique-detail__recipe-image"
                  />
                )}
                <div className="technique-detail__recipe-info">
                  <h4>{recipe.title}</h4>
                  <span>{recipe.source.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
