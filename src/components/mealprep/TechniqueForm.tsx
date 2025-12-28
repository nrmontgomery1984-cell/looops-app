// Technique Form - Add or edit a technique entry
import { useState } from "react";
import {
  TechniqueEntry,
  TechniqueTip,
  TechniqueSubjectType,
  TipCategory,
  Recipe,
  ExperienceLevel,
} from "../../types/mealPrep";

interface TechniqueFormProps {
  technique?: TechniqueEntry;
  recipes: Recipe[];
  onSave: (technique: TechniqueEntry) => void;
  onCancel: () => void;
}

const SUBJECT_TYPES: { value: TechniqueSubjectType; label: string; icon: string }[] = [
  { value: "ingredient", label: "Ingredient", icon: "🥕" },
  { value: "technique", label: "Technique", icon: "🔪" },
  { value: "dish", label: "Dish", icon: "🍲" },
  { value: "equipment", label: "Equipment", icon: "🍳" },
];

const TIP_CATEGORIES: { value: TipCategory; label: string }[] = [
  { value: "how", label: "How To" },
  { value: "why", label: "Why It Works" },
  { value: "common_mistake", label: "Common Mistake" },
  { value: "variation", label: "Variation" },
  { value: "science", label: "The Science" },
  { value: "shortcut", label: "Shortcut" },
];

const SKILL_LEVELS: ExperienceLevel[] = ["beginner", "comfortable", "experienced", "advanced"];

export function TechniqueForm({
  technique,
  recipes,
  onSave,
  onCancel,
}: TechniqueFormProps) {
  const isEditing = !!technique;

  const [subject, setSubject] = useState(technique?.subject || "");
  const [subjectType, setSubjectType] = useState<TechniqueSubjectType>(
    technique?.subjectType || "technique"
  );
  const [tips, setTips] = useState<TechniqueTip[]>(technique?.tips || []);
  const [relatedRecipeIds, setRelatedRecipeIds] = useState<string[]>(
    technique?.relatedRecipeIds || []
  );
  const [sourcesCited, setSourcesCited] = useState<string[]>(
    technique?.sourcesCited || []
  );

  // New tip form state
  const [newTipContent, setNewTipContent] = useState("");
  const [newTipCategory, setNewTipCategory] = useState<TipCategory>("how");
  const [newTipSource, setNewTipSource] = useState("");
  const [newTipSourceUrl, setNewTipSourceUrl] = useState("");
  const [newTipSkillLevels, setNewTipSkillLevels] = useState<ExperienceLevel[]>([]);
  const [newTipEquipment, setNewTipEquipment] = useState("");

  // New source input
  const [newSource, setNewSource] = useState("");

  const handleAddTip = () => {
    if (!newTipContent.trim()) return;

    const newTip: TechniqueTip = {
      id: `tip_${Date.now()}`,
      content: newTipContent.trim(),
      source: newTipSource.trim(),
      sourceUrl: newTipSourceUrl.trim() || undefined,
      category: newTipCategory,
      appliesToSkillLevel: newTipSkillLevels.length > 0 ? newTipSkillLevels : undefined,
      appliesToEquipment: newTipEquipment.trim()
        ? newTipEquipment.split(",").map((e) => e.trim())
        : undefined,
    };

    setTips([...tips, newTip]);

    // Add source if not already cited
    if (newTipSource.trim() && !sourcesCited.includes(newTipSource.trim())) {
      setSourcesCited([...sourcesCited, newTipSource.trim()]);
    }

    // Reset form
    setNewTipContent("");
    setNewTipSource("");
    setNewTipSourceUrl("");
    setNewTipCategory("how");
    setNewTipSkillLevels([]);
    setNewTipEquipment("");
  };

  const handleRemoveTip = (tipId: string) => {
    setTips(tips.filter((t) => t.id !== tipId));
  };

  const handleAddSource = () => {
    if (newSource.trim() && !sourcesCited.includes(newSource.trim())) {
      setSourcesCited([...sourcesCited, newSource.trim()]);
      setNewSource("");
    }
  };

  const handleRemoveSource = (source: string) => {
    setSourcesCited(sourcesCited.filter((s) => s !== source));
  };

  const toggleRecipe = (recipeId: string) => {
    if (relatedRecipeIds.includes(recipeId)) {
      setRelatedRecipeIds(relatedRecipeIds.filter((id) => id !== recipeId));
    } else {
      setRelatedRecipeIds([...relatedRecipeIds, recipeId]);
    }
  };

  const toggleSkillLevel = (level: ExperienceLevel) => {
    if (newTipSkillLevels.includes(level)) {
      setNewTipSkillLevels(newTipSkillLevels.filter((l) => l !== level));
    } else {
      setNewTipSkillLevels([...newTipSkillLevels, level]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) return;

    const techniqueData: TechniqueEntry = {
      id: technique?.id || `tech_${Date.now()}`,
      subject: subject.trim(),
      subjectType,
      tips,
      relatedRecipeIds,
      lastUpdated: new Date().toISOString(),
      sourcesCited,
    };

    onSave(techniqueData);
  };

  return (
    <div className="technique-form">
      <div className="technique-form__header">
        <h2>{isEditing ? "Edit Technique" : "Add Technique Entry"}</h2>
        <button className="technique-form__close" onClick={onCancel}>
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="technique-form__content">
        {/* Subject */}
        <div className="technique-form__field">
          <label>Subject *</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Searing, Chicken Breast, Cast Iron Pan..."
            required
          />
        </div>

        {/* Subject Type */}
        <div className="technique-form__field">
          <label>Type</label>
          <div className="technique-form__type-options">
            {SUBJECT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                className={`technique-form__type-btn ${subjectType === type.value ? "technique-form__type-btn--active" : ""}`}
                onClick={() => setSubjectType(type.value)}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="technique-form__section">
          <h3>Tips ({tips.length})</h3>

          {/* Existing Tips */}
          {tips.length > 0 && (
            <div className="technique-form__tips-list">
              {tips.map((tip) => (
                <div key={tip.id} className="technique-form__tip-item">
                  <div className="technique-form__tip-content">
                    <span className="technique-form__tip-category">{tip.category}</span>
                    <p>{tip.content}</p>
                    {tip.source && (
                      <span className="technique-form__tip-source">— {tip.source}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="technique-form__tip-remove"
                    onClick={() => handleRemoveTip(tip.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Tip */}
          <div className="technique-form__add-tip">
            <h4>Add a Tip</h4>

            <div className="technique-form__field">
              <label>Tip Content *</label>
              <textarea
                value={newTipContent}
                onChange={(e) => setNewTipContent(e.target.value)}
                placeholder="What did you learn?"
                rows={2}
              />
            </div>

            <div className="technique-form__row">
              <div className="technique-form__field">
                <label>Category</label>
                <select
                  value={newTipCategory}
                  onChange={(e) => setNewTipCategory(e.target.value as TipCategory)}
                >
                  {TIP_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="technique-form__field technique-form__field--grow">
                <label>Source</label>
                <input
                  type="text"
                  value={newTipSource}
                  onChange={(e) => setNewTipSource(e.target.value)}
                  placeholder="e.g., Serious Eats, Chris Young"
                />
              </div>
            </div>

            <div className="technique-form__field">
              <label>Source URL (optional)</label>
              <input
                type="url"
                value={newTipSourceUrl}
                onChange={(e) => setNewTipSourceUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="technique-form__field">
              <label>Applies to Skill Levels (optional)</label>
              <div className="technique-form__skill-levels">
                {SKILL_LEVELS.map((level) => (
                  <label key={level} className="technique-form__checkbox">
                    <input
                      type="checkbox"
                      checked={newTipSkillLevels.includes(level)}
                      onChange={() => toggleSkillLevel(level)}
                    />
                    <span>{level}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="technique-form__field">
              <label>Equipment (optional, comma separated)</label>
              <input
                type="text"
                value={newTipEquipment}
                onChange={(e) => setNewTipEquipment(e.target.value)}
                placeholder="e.g., Cast iron pan, Thermometer"
              />
            </div>

            <button
              type="button"
              className="technique-form__add-tip-btn"
              onClick={handleAddTip}
              disabled={!newTipContent.trim()}
            >
              + Add Tip
            </button>
          </div>
        </div>

        {/* Sources */}
        <div className="technique-form__section">
          <h3>Sources Cited ({sourcesCited.length})</h3>
          {sourcesCited.length > 0 && (
            <div className="technique-form__sources-list">
              {sourcesCited.map((source) => (
                <div key={source} className="technique-form__source-item">
                  <span>{source}</span>
                  <button
                    type="button"
                    className="technique-form__source-remove"
                    onClick={() => handleRemoveSource(source)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="technique-form__add-source">
            <input
              type="text"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="Add source..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSource();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddSource}
              disabled={!newSource.trim()}
            >
              Add
            </button>
          </div>
        </div>

        {/* Related Recipes */}
        {recipes.length > 0 && (
          <div className="technique-form__section">
            <h3>Related Recipes</h3>
            <div className="technique-form__recipes">
              {recipes.slice(0, 10).map((recipe) => (
                <label key={recipe.id} className="technique-form__recipe-option">
                  <input
                    type="checkbox"
                    checked={relatedRecipeIds.includes(recipe.id)}
                    onChange={() => toggleRecipe(recipe.id)}
                  />
                  <span>{recipe.title}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="technique-form__actions">
          <button
            type="button"
            className="technique-form__btn technique-form__btn--secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="technique-form__btn technique-form__btn--primary"
            disabled={!subject.trim()}
          >
            {isEditing ? "Save Changes" : "Add Entry"}
          </button>
        </div>
      </form>
    </div>
  );
}
