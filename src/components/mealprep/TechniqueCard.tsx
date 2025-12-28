// Technique Card - Display a technique entry from the library
import { TechniqueEntry, TechniqueSubjectType } from "../../types/mealPrep";

interface TechniqueCardProps {
  technique: TechniqueEntry;
  onSelect: (technique: TechniqueEntry) => void;
}

const SUBJECT_TYPE_ICONS: Record<TechniqueSubjectType, string> = {
  ingredient: "🥕",
  technique: "🔪",
  dish: "🍲",
  equipment: "🍳",
};

const SUBJECT_TYPE_COLORS: Record<TechniqueSubjectType, string> = {
  ingredient: "#73A58C",   // Sage
  technique: "#F4B942",    // Amber
  dish: "#F27059",         // Coral
  equipment: "#5a7fb8",    // Blue
};

export function TechniqueCard({ technique, onSelect }: TechniqueCardProps) {
  return (
    <button
      className="technique-card"
      onClick={() => onSelect(technique)}
    >
      <div className="technique-card__header">
        <span
          className="technique-card__type"
          style={{ backgroundColor: SUBJECT_TYPE_COLORS[technique.subjectType] }}
        >
          {SUBJECT_TYPE_ICONS[technique.subjectType]} {technique.subjectType}
        </span>
      </div>

      <h3 className="technique-card__title">{technique.subject}</h3>

      <div className="technique-card__tips-summary">
        <span className="technique-card__tip-count">
          {technique.tips.length} tip{technique.tips.length !== 1 ? "s" : ""}
        </span>
        {technique.tips.length > 0 && (
          <p className="technique-card__tip-preview">
            {technique.tips[0].content.substring(0, 80)}
            {technique.tips[0].content.length > 80 ? "..." : ""}
          </p>
        )}
      </div>

      {technique.relatedRecipeIds.length > 0 && (
        <div className="technique-card__recipes">
          <span className="technique-card__recipes-count">
            {technique.relatedRecipeIds.length} related recipe{technique.relatedRecipeIds.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div className="technique-card__meta">
        <span className="technique-card__sources">
          {technique.sourcesCited.length} source{technique.sourcesCited.length !== 1 ? "s" : ""}
        </span>
        <span className="technique-card__date">
          Updated {new Date(technique.lastUpdated).toLocaleDateString()}
        </span>
      </div>
    </button>
  );
}
