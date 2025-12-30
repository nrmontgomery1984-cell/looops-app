// Technique Detail - Full view of a technique entry with all tips
import { useState } from "react";
import {
  TechniqueEntry,
  TechniqueTip,
  TechniqueSubjectType,
  Recipe,
  TipCategory,
  DEFAULT_KNOWLEDGE_SOURCES,
  calculateCredibilityScore,
} from "../../types/mealPrep";

interface TechniqueDetailProps {
  technique: TechniqueEntry;
  techniques: TechniqueEntry[];  // For related techniques
  recipes: Recipe[];
  onBack: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onSelectTechnique?: (technique: TechniqueEntry) => void;
  onDelete?: () => void;
  onAddTip?: () => void;
  onToggleFavorite?: () => void;
  onUpdateNotes?: (notes: string) => void;
  onToggleTipHighlight?: (tipId: string) => void;
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

// Get reputation badge based on score
function getReputationBadge(score: number): { label: string; color: string } {
  if (score >= 9) return { label: "Authoritative", color: "#22c55e" };
  if (score >= 7) return { label: "Trusted", color: "#3b82f6" };
  if (score >= 5) return { label: "Verified", color: "#8b5cf6" };
  return { label: "Community", color: "#6b7280" };
}

export function TechniqueDetail({
  technique,
  techniques,
  recipes,
  onBack,
  onSelectRecipe,
  onSelectTechnique,
  onDelete,
  onAddTip,
  onToggleFavorite,
  onUpdateNotes,
  onToggleTipHighlight,
}: TechniqueDetailProps) {
  const [showNotesEditor, setShowNotesEditor] = useState(false);
  const [notesValue, setNotesValue] = useState(technique.userNotes || "");
  const [showHighlightsOnly, setShowHighlightsOnly] = useState(false);

  // Find related recipes
  const relatedRecipes = recipes.filter((r) =>
    technique.relatedRecipeIds.includes(r.id)
  );

  // Find related techniques
  const relatedTechniques = techniques.filter((t) =>
    technique.relatedTechniqueIds?.includes(t.id)
  );

  // Find prerequisite techniques
  const prerequisiteTechniques = techniques.filter((t) =>
    technique.prerequisites?.includes(t.id)
  );

  // Calculate credibility score
  const credibilityScore = calculateCredibilityScore(technique.tips, DEFAULT_KNOWLEDGE_SOURCES);
  const credibilityBadge = getReputationBadge(credibilityScore);

  // Count highlighted tips
  const highlightedCount = technique.tips.filter(t => t.isHighlighted).length;

  // Group tips by category, optionally filtering to highlighted only
  const tipsToShow = showHighlightsOnly
    ? technique.tips.filter(t => t.isHighlighted)
    : technique.tips;

  const tipsByCategory = tipsToShow.reduce((acc, tip) => {
    if (!acc[tip.category]) acc[tip.category] = [];
    acc[tip.category].push(tip);
    return acc;
  }, {} as Record<TipCategory, TechniqueTip[]>);

  const handleSaveNotes = () => {
    if (onUpdateNotes) {
      onUpdateNotes(notesValue);
    }
    setShowNotesEditor(false);
  };

  // Get source reputation for a tip
  const getSourceReputation = (tip: TechniqueTip): number | null => {
    const source = DEFAULT_KNOWLEDGE_SOURCES.find(s =>
      s.id === tip.sourceId ||
      s.name.toLowerCase() === tip.source.toLowerCase()
    );
    return source?.reputationScore ?? null;
  };

  return (
    <div className="technique-detail">
      {/* Header */}
      <div className="technique-detail__header">
        <button className="technique-detail__back" onClick={onBack}>
          ← Back to Library
        </button>
        <div className="technique-detail__actions">
          {onToggleFavorite && (
            <button
              className={`technique-detail__favorite ${technique.isFavorite ? "technique-detail__favorite--active" : ""}`}
              onClick={onToggleFavorite}
              title={technique.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {technique.isFavorite ? "★" : "☆"}
            </button>
          )}
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
        <div className="technique-detail__title-row">
          <span
            className="technique-detail__type"
            style={{ backgroundColor: SUBJECT_TYPE_COLORS[technique.subjectType] }}
          >
            {SUBJECT_TYPE_ICONS[technique.subjectType]} {technique.subjectType}
          </span>
          {credibilityScore > 0 && (
            <span
              className="technique-detail__credibility"
              style={{ backgroundColor: credibilityBadge.color }}
              title={`Credibility Score: ${credibilityScore}/10`}
            >
              {credibilityBadge.label}
            </span>
          )}
        </div>
        <h1 className="technique-detail__title">{technique.subject}</h1>
        {technique.aliases && technique.aliases.length > 0 && (
          <p className="technique-detail__aliases">
            Also known as: {technique.aliases.join(", ")}
          </p>
        )}
        {technique.summary && (
          <p className="technique-detail__summary">{technique.summary}</p>
        )}
        <p className="technique-detail__meta">
          {technique.tips.length} tips · {technique.sourcesCited.length} sources ·
          Last updated {new Date(technique.lastUpdated).toLocaleDateString()}
        </p>
      </div>

      {/* User Notes Section */}
      <div className="technique-detail__notes-section">
        <div className="technique-detail__notes-header">
          <h3>My Notes</h3>
          {!showNotesEditor && onUpdateNotes && (
            <button
              className="technique-detail__notes-edit"
              onClick={() => setShowNotesEditor(true)}
            >
              {technique.userNotes ? "Edit" : "+ Add Notes"}
            </button>
          )}
        </div>
        {showNotesEditor ? (
          <div className="technique-detail__notes-editor">
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              placeholder="Add your personal notes about this technique..."
              rows={4}
            />
            <div className="technique-detail__notes-actions">
              <button
                className="technique-detail__notes-cancel"
                onClick={() => {
                  setNotesValue(technique.userNotes || "");
                  setShowNotesEditor(false);
                }}
              >
                Cancel
              </button>
              <button
                className="technique-detail__notes-save"
                onClick={handleSaveNotes}
              >
                Save Notes
              </button>
            </div>
          </div>
        ) : technique.userNotes ? (
          <div className="technique-detail__notes-content">
            {technique.userNotes}
          </div>
        ) : (
          <p className="technique-detail__notes-empty">
            No personal notes yet. Add your own observations, modifications, or reminders.
          </p>
        )}
      </div>

      {/* Prerequisites */}
      {prerequisiteTechniques.length > 0 && (
        <div className="technique-detail__prerequisites">
          <h3>Prerequisites</h3>
          <p className="technique-detail__prerequisites-desc">
            Master these techniques first:
          </p>
          <div className="technique-detail__prereq-list">
            {prerequisiteTechniques.map((prereq) => (
              <button
                key={prereq.id}
                className="technique-detail__prereq-chip"
                onClick={() => onSelectTechnique?.(prereq)}
              >
                {SUBJECT_TYPE_ICONS[prereq.subjectType]} {prereq.subject}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tips Filter */}
      {highlightedCount > 0 && (
        <div className="technique-detail__tips-filter">
          <button
            className={`technique-detail__filter-btn ${!showHighlightsOnly ? "technique-detail__filter-btn--active" : ""}`}
            onClick={() => setShowHighlightsOnly(false)}
          >
            All Tips ({technique.tips.length})
          </button>
          <button
            className={`technique-detail__filter-btn ${showHighlightsOnly ? "technique-detail__filter-btn--active" : ""}`}
            onClick={() => setShowHighlightsOnly(true)}
          >
            ★ Highlighted ({highlightedCount})
          </button>
        </div>
      )}

      {/* Tips by Category */}
      {tipsToShow.length === 0 ? (
        <div className="technique-detail__empty-tips">
          <span className="technique-detail__empty-icon">📚</span>
          <h3>{showHighlightsOnly ? "No highlighted tips" : "No tips yet"}</h3>
          <p>
            {showHighlightsOnly
              ? "Highlight tips you find most useful by clicking the star icon."
              : `Add tips you learn about ${technique.subject} from recipes, videos, or your own experience.`}
          </p>
          {!showHighlightsOnly && onAddTip && (
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
                {tipsByCategory[category].map((tip) => {
                  const reputation = getSourceReputation(tip);
                  return (
                    <div
                      key={tip.id}
                      className={`technique-detail__tip ${tip.isHighlighted ? "technique-detail__tip--highlighted" : ""}`}
                    >
                      <div className="technique-detail__tip-header">
                        <p className="technique-detail__tip-content">{tip.content}</p>
                        {onToggleTipHighlight && (
                          <button
                            className={`technique-detail__tip-highlight ${tip.isHighlighted ? "technique-detail__tip-highlight--active" : ""}`}
                            onClick={() => onToggleTipHighlight(tip.id)}
                            title={tip.isHighlighted ? "Remove highlight" : "Highlight this tip"}
                          >
                            {tip.isHighlighted ? "★" : "☆"}
                          </button>
                        )}
                      </div>
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
                            {reputation !== null && (
                              <span
                                className="technique-detail__tip-reputation"
                                title={`Source reputation: ${reputation}/10`}
                              >
                                ({reputation}/10)
                              </span>
                            )}
                          </span>
                        )}
                        {tip.verifiedCount && tip.verifiedCount > 0 && (
                          <span className="technique-detail__tip-verified">
                            +{tip.verifiedCount} sources agree
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
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Related Techniques (Wiki-style links) */}
      {relatedTechniques.length > 0 && (
        <div className="technique-detail__related-techniques">
          <h3>Related Techniques</h3>
          <div className="technique-detail__related-grid">
            {relatedTechniques.map((related) => (
              <button
                key={related.id}
                className="technique-detail__related-card"
                onClick={() => onSelectTechnique?.(related)}
              >
                <span className="technique-detail__related-icon">
                  {SUBJECT_TYPE_ICONS[related.subjectType]}
                </span>
                <div className="technique-detail__related-info">
                  <h4>{related.subject}</h4>
                  <span>{related.tips.length} tips</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {technique.sourcesCited.length > 0 && (
        <div className="technique-detail__sources">
          <h3>Sources</h3>
          <ul className="technique-detail__sources-list">
            {technique.sourcesCited.map((source, i) => {
              const knownSource = DEFAULT_KNOWLEDGE_SOURCES.find(
                s => s.name.toLowerCase() === source.toLowerCase()
              );
              return (
                <li key={i} className="technique-detail__source-item">
                  {source}
                  {knownSource && (
                    <span
                      className="technique-detail__source-badge"
                      style={{ backgroundColor: getReputationBadge(knownSource.reputationScore).color }}
                    >
                      {knownSource.reputationScore}/10
                    </span>
                  )}
                </li>
              );
            })}
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
