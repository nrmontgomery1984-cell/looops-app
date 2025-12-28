// Technique Library - Browse and manage cooking techniques
import { useState, useMemo } from "react";
import { TechniqueEntry, TechniqueSubjectType, Recipe } from "../../types/mealPrep";
import { TechniqueCard } from "./TechniqueCard";
import { TechniqueDetail } from "./TechniqueDetail";
import { TechniqueForm } from "./TechniqueForm";

interface TechniqueLibraryProps {
  techniques: TechniqueEntry[];
  recipes: Recipe[];
  onAddTechnique: (technique: TechniqueEntry) => void;
  onUpdateTechnique: (technique: TechniqueEntry) => void;
  onDeleteTechnique: (id: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onBack: () => void;
}

const SUBJECT_TYPE_LABELS: Record<TechniqueSubjectType, string> = {
  ingredient: "Ingredients",
  technique: "Techniques",
  dish: "Dishes",
  equipment: "Equipment",
};

export function TechniqueLibrary({
  techniques,
  recipes,
  onAddTechnique,
  onUpdateTechnique,
  onDeleteTechnique,
  onSelectRecipe,
  onBack,
}: TechniqueLibraryProps) {
  const [view, setView] = useState<"list" | "detail" | "form">("list");
  const [selectedTechnique, setSelectedTechnique] = useState<TechniqueEntry | null>(null);
  const [editingTechnique, setEditingTechnique] = useState<TechniqueEntry | undefined>(undefined);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TechniqueSubjectType | "all">("all");

  // Get unique types that have techniques
  const availableTypes = useMemo(() => {
    const types = new Set<TechniqueSubjectType>();
    techniques.forEach((t) => types.add(t.subjectType));
    return Array.from(types).sort();
  }, [techniques]);

  // Filter techniques
  const filteredTechniques = useMemo(() => {
    return techniques.filter((t) => {
      if (typeFilter !== "all" && t.subjectType !== typeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          t.subject.toLowerCase().includes(q) ||
          t.tips.some((tip) => tip.content.toLowerCase().includes(q)) ||
          t.sourcesCited.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [techniques, typeFilter, searchQuery]);

  // Group by type for display
  const groupedTechniques = useMemo(() => {
    if (typeFilter !== "all") {
      return { [typeFilter]: filteredTechniques };
    }

    const groups: Partial<Record<TechniqueSubjectType, TechniqueEntry[]>> = {};
    filteredTechniques.forEach((t) => {
      if (!groups[t.subjectType]) groups[t.subjectType] = [];
      groups[t.subjectType]!.push(t);
    });
    return groups;
  }, [filteredTechniques, typeFilter]);

  const handleSelectTechnique = (technique: TechniqueEntry) => {
    setSelectedTechnique(technique);
    setView("detail");
  };

  const handleAddNew = () => {
    setEditingTechnique(undefined);
    setView("form");
  };

  const handleEdit = () => {
    if (selectedTechnique) {
      setEditingTechnique(selectedTechnique);
      setView("form");
    }
  };

  const handleSave = (technique: TechniqueEntry) => {
    if (editingTechnique) {
      onUpdateTechnique(technique);
    } else {
      onAddTechnique(technique);
    }
    setView("list");
    setEditingTechnique(undefined);
    setSelectedTechnique(null);
  };

  const handleDelete = () => {
    if (selectedTechnique) {
      onDeleteTechnique(selectedTechnique.id);
      setView("list");
      setSelectedTechnique(null);
    }
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedTechnique(null);
    setEditingTechnique(undefined);
  };

  // Render Form View
  if (view === "form") {
    return (
      <div className="technique-library technique-library--form">
        <TechniqueForm
          technique={editingTechnique}
          recipes={recipes}
          onSave={handleSave}
          onCancel={handleBackToList}
        />
      </div>
    );
  }

  // Render Detail View
  if (view === "detail" && selectedTechnique) {
    return (
      <div className="technique-library technique-library--detail">
        <TechniqueDetail
          technique={selectedTechnique}
          recipes={recipes}
          onBack={handleBackToList}
          onSelectRecipe={onSelectRecipe}
          onDelete={handleDelete}
          onAddTip={handleEdit}
        />
        <div className="technique-library__detail-actions">
          <button
            className="technique-library__edit-btn"
            onClick={handleEdit}
          >
            Edit Entry
          </button>
        </div>
      </div>
    );
  }

  // Render List View
  return (
    <div className="technique-library">
      {/* Header */}
      <div className="technique-library__header">
        <button className="technique-library__back" onClick={onBack}>
          ← Back
        </button>
        <div className="technique-library__title-section">
          <h1>Technique Library</h1>
          <p className="technique-library__subtitle">
            {techniques.length} entr{techniques.length !== 1 ? "ies" : "y"} ·{" "}
            {techniques.reduce((sum, t) => sum + t.tips.length, 0)} tips
          </p>
        </div>
        <button
          className="technique-library__add-btn"
          onClick={handleAddNew}
        >
          + Add Entry
        </button>
      </div>

      {/* Filters */}
      <div className="technique-library__filters">
        <div className="technique-library__search">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search techniques, tips, sources..."
          />
        </div>

        <div className="technique-library__filter-group">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TechniqueSubjectType | "all")}
            className="technique-library__filter"
          >
            <option value="all">All Types</option>
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {SUBJECT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {filteredTechniques.length === 0 ? (
        <div className="technique-library__empty">
          {techniques.length === 0 ? (
            <>
              <span className="technique-library__empty-icon">📚</span>
              <h3>Start Your Technique Library</h3>
              <p>
                Collect tips and knowledge about ingredients, techniques, dishes, and equipment.
                Build your personal culinary knowledge base from recipes and videos.
              </p>
              <button
                className="technique-library__empty-btn"
                onClick={handleAddNew}
              >
                Add Your First Entry
              </button>
            </>
          ) : (
            <>
              <span className="technique-library__empty-icon">🔍</span>
              <h3>No Matching Entries</h3>
              <p>Try adjusting your filters or search query.</p>
              <button
                className="technique-library__empty-btn"
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                }}
              >
                Clear Filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="technique-library__content">
          {(Object.keys(groupedTechniques) as TechniqueSubjectType[]).map((type) => {
            const techs = groupedTechniques[type];
            if (!techs || techs.length === 0) return null;

            return (
              <div key={type} className="technique-library__category">
                {typeFilter === "all" && (
                  <h2 className="technique-library__category-title">
                    {SUBJECT_TYPE_LABELS[type]}
                    <span className="technique-library__category-count">
                      ({techs.length})
                    </span>
                  </h2>
                )}
                <div className="technique-library__grid">
                  {techs.map((technique) => (
                    <TechniqueCard
                      key={technique.id}
                      technique={technique}
                      onSelect={handleSelectTechnique}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
