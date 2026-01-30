// Training Tip Library - Knowledge base for training concepts
import React, { useState, useMemo } from "react";
import {
  TrainingTipEntry,
  TrainingTip,
  Exercise,
  TipCategory,
  TrainingTipSubjectType,
  createTrainingTipEntry,
} from "../../types/workout";

interface TrainingTipLibraryProps {
  tips: TrainingTipEntry[];
  exercises: Exercise[];
  onAddTip: (tip: TrainingTipEntry) => void;
  onUpdateTip: (tip: TrainingTipEntry) => void;
  onDeleteTip: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onSelectExercise: (exercise: Exercise) => void;
  onBack: () => void;
}

type ViewMode = "list" | "detail" | "add" | "edit";

const TIP_CATEGORIES: { value: TipCategory; label: string; icon: string }[] = [
  { value: "technique", label: "Technique", icon: "🎯" },
  { value: "programming", label: "Programming", icon: "📊" },
  { value: "recovery", label: "Recovery", icon: "😴" },
  { value: "mindset", label: "Mindset", icon: "🧠" },
  { value: "safety", label: "Safety", icon: "🛡️" },
  { value: "sport_specific", label: "Sport Specific", icon: "🥋" },
  { value: "science", label: "Science", icon: "🔬" },
];

const SUBJECT_TYPES: { value: TrainingTipSubjectType; label: string }[] = [
  { value: "exercise", label: "Exercise" },
  { value: "muscle_group", label: "Muscle Group" },
  { value: "movement", label: "Movement Pattern" },
  { value: "concept", label: "Training Concept" },
  { value: "equipment", label: "Equipment" },
];

export function TrainingTipLibrary({
  tips,
  exercises,
  onAddTip,
  onUpdateTip,
  onDeleteTip,
  onToggleFavorite,
  onSelectExercise,
  onBack,
}: TrainingTipLibraryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedTip, setSelectedTip] = useState<TrainingTipEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<TipCategory | "">("");
  const [filterFavorites, setFilterFavorites] = useState(false);

  // Form state for add/edit
  const [formSubject, setFormSubject] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formSubjectType, setFormSubjectType] = useState<TrainingTipSubjectType>("concept");
  const [formTips, setFormTips] = useState<TrainingTip[]>([]);
  const [newTipContent, setNewTipContent] = useState("");
  const [newTipCategory, setNewTipCategory] = useState<TipCategory>("technique");
  const [newTipSource, setNewTipSource] = useState("");

  const filteredTips = useMemo(() => {
    let filtered = [...tips];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.subject.toLowerCase().includes(query) ||
          t.summary?.toLowerCase().includes(query) ||
          t.tips.some((tip) => tip.content.toLowerCase().includes(query))
      );
    }

    if (filterCategory) {
      filtered = filtered.filter((t) =>
        t.tips.some((tip) => tip.category === filterCategory)
      );
    }

    if (filterFavorites) {
      filtered = filtered.filter((t) => t.isFavorite);
    }

    return filtered.sort((a, b) => a.subject.localeCompare(b.subject));
  }, [tips, searchQuery, filterCategory, filterFavorites]);

  const handleViewTip = (tip: TrainingTipEntry) => {
    setSelectedTip(tip);
    setViewMode("detail");
  };

  const handleEditTip = (tip: TrainingTipEntry) => {
    setSelectedTip(tip);
    setFormSubject(tip.subject);
    setFormSummary(tip.summary || "");
    setFormSubjectType(tip.subjectType);
    setFormTips([...tip.tips]);
    setViewMode("edit");
  };

  const handleAddNew = () => {
    setSelectedTip(null);
    setFormSubject("");
    setFormSummary("");
    setFormSubjectType("concept");
    setFormTips([]);
    setViewMode("add");
  };

  const handleSave = () => {
    if (!formSubject.trim()) {
      alert("Please enter a subject");
      return;
    }

    const entry = createTrainingTipEntry({
      id: selectedTip?.id,
      subject: formSubject.trim(),
      summary: formSummary.trim() || undefined,
      subjectType: formSubjectType,
      tips: formTips,
      relatedExerciseIds: selectedTip?.relatedExerciseIds || [],
      sourcesCited: [...new Set(formTips.map((t) => t.source).filter(Boolean))],
      isFavorite: selectedTip?.isFavorite,
    });

    if (viewMode === "edit" && selectedTip) {
      onUpdateTip(entry);
    } else {
      onAddTip(entry);
    }

    setViewMode("list");
    setSelectedTip(null);
  };

  const handleAddTipItem = () => {
    if (!newTipContent.trim()) return;

    const newTip: TrainingTip = {
      id: `tip_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      content: newTipContent.trim(),
      category: newTipCategory,
      source: newTipSource.trim() || "Personal",
      addedAt: new Date().toISOString(),
    };

    setFormTips([...formTips, newTip]);
    setNewTipContent("");
    setNewTipSource("");
  };

  const handleRemoveTipItem = (tipId: string) => {
    setFormTips(formTips.filter((t) => t.id !== tipId));
  };

  const getCategoryIcon = (category: TipCategory): string => {
    return TIP_CATEGORIES.find((c) => c.value === category)?.icon || "💡";
  };

  // List View
  if (viewMode === "list") {
    return (
      <div className="training-tips">
        <div className="training-tips__header">
          <button className="training-tips__back" onClick={onBack}>
            ← Back
          </button>
          <h2>Training Tips</h2>
          <button className="training-tips__add" onClick={handleAddNew}>
            + Add Tip
          </button>
        </div>

        <div className="training-tips__filters">
          <div className="training-tips__search">
            <span className="training-tips__search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search tips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="training-tips__filter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as TipCategory | "")}
          >
            <option value="">All Categories</option>
            {TIP_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>

          <button
            className={`training-tips__favorite-filter ${filterFavorites ? "active" : ""}`}
            onClick={() => setFilterFavorites(!filterFavorites)}
          >
            {filterFavorites ? "★" : "☆"} Favorites
          </button>
        </div>

        {filteredTips.length === 0 ? (
          <div className="training-tips__empty">
            {tips.length === 0 ? (
              <>
                <div className="training-tips__empty-icon">📚</div>
                <h3>No training tips yet</h3>
                <p>Start building your knowledge base by adding training tips.</p>
                <button className="training-tips__empty-btn" onClick={handleAddNew}>
                  Add Your First Tip
                </button>
              </>
            ) : (
              <>
                <div className="training-tips__empty-icon">🔍</div>
                <h3>No tips match your filters</h3>
                <button
                  className="training-tips__empty-btn"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterCategory("");
                    setFilterFavorites(false);
                  }}
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="training-tips__list">
            {filteredTips.map((tip) => (
              <div
                key={tip.id}
                className="training-tips__item"
                onClick={() => handleViewTip(tip)}
              >
                <div className="training-tips__item-header">
                  <h3 className="training-tips__item-subject">{tip.subject}</h3>
                  <button
                    className={`training-tips__item-favorite ${tip.isFavorite ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(tip.id);
                    }}
                  >
                    {tip.isFavorite ? "★" : "☆"}
                  </button>
                </div>
                {tip.summary && (
                  <p className="training-tips__item-summary">{tip.summary}</p>
                )}
                <div className="training-tips__item-meta">
                  <span className="training-tips__item-type">{tip.subjectType}</span>
                  <span className="training-tips__item-count">{tip.tips.length} tips</span>
                  <div className="training-tips__item-categories">
                    {[...new Set(tip.tips.map((t) => t.category))].slice(0, 3).map((cat) => (
                      <span key={cat} className="training-tips__category-badge">
                        {getCategoryIcon(cat)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Detail View
  if (viewMode === "detail" && selectedTip) {
    const relatedExercises = exercises.filter((e) =>
      selectedTip.relatedExerciseIds.includes(e.id)
    );

    return (
      <div className="training-tips">
        <div className="training-tips__header">
          <button className="training-tips__back" onClick={() => setViewMode("list")}>
            ← Back
          </button>
          <div className="training-tips__header-actions">
            <button
              className="training-tips__edit"
              onClick={() => handleEditTip(selectedTip)}
            >
              Edit
            </button>
            <button
              className="training-tips__delete"
              onClick={() => {
                if (confirm(`Delete "${selectedTip.subject}"?`)) {
                  onDeleteTip(selectedTip.id);
                  setViewMode("list");
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>

        <div className="training-tips__detail">
          <div className="training-tips__detail-header">
            <h1>{selectedTip.subject}</h1>
            <button
              className={`training-tips__favorite-btn ${selectedTip.isFavorite ? "active" : ""}`}
              onClick={() => onToggleFavorite(selectedTip.id)}
            >
              {selectedTip.isFavorite ? "★ Favorited" : "☆ Add to Favorites"}
            </button>
          </div>

          {selectedTip.summary && (
            <p className="training-tips__detail-summary">{selectedTip.summary}</p>
          )}

          <div className="training-tips__detail-tips">
            <h3>Tips & Knowledge</h3>
            {selectedTip.tips.map((tip) => (
              <div key={tip.id} className="training-tips__tip-card">
                <div className="training-tips__tip-header">
                  <span className="training-tips__tip-category">
                    {getCategoryIcon(tip.category)} {tip.category}
                  </span>
                  {tip.isHighlighted && (
                    <span className="training-tips__tip-highlighted">⭐ Highlighted</span>
                  )}
                </div>
                <p className="training-tips__tip-content">{tip.content}</p>
                {tip.source && (
                  <span className="training-tips__tip-source">— {tip.source}</span>
                )}
              </div>
            ))}
          </div>

          {relatedExercises.length > 0 && (
            <div className="training-tips__detail-exercises">
              <h3>Related Exercises</h3>
              <div className="training-tips__exercise-list">
                {relatedExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    className="training-tips__exercise-btn"
                    onClick={() => onSelectExercise(exercise)}
                  >
                    {exercise.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedTip.userNotes && (
            <div className="training-tips__detail-notes">
              <h3>My Notes</h3>
              <p>{selectedTip.userNotes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Add/Edit View
  return (
    <div className="training-tips">
      <div className="training-tips__header">
        <button className="training-tips__back" onClick={() => setViewMode("list")}>
          ← Cancel
        </button>
        <h2>{viewMode === "edit" ? "Edit Training Tip" : "Add Training Tip"}</h2>
      </div>

      <div className="training-tips__form">
        <div className="training-tips__form-section">
          <label>Subject *</label>
          <input
            type="text"
            value={formSubject}
            onChange={(e) => setFormSubject(e.target.value)}
            placeholder="e.g., Hip Hinge Mechanics, Tempo Training, etc."
          />
        </div>

        <div className="training-tips__form-section">
          <label>Subject Type</label>
          <select
            value={formSubjectType}
            onChange={(e) => setFormSubjectType(e.target.value as TrainingTipSubjectType)}
          >
            {SUBJECT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="training-tips__form-section">
          <label>Summary</label>
          <textarea
            value={formSummary}
            onChange={(e) => setFormSummary(e.target.value)}
            placeholder="Brief overview of this topic..."
            rows={3}
          />
        </div>

        <div className="training-tips__form-section">
          <label>Tips ({formTips.length})</label>
          <div className="training-tips__tip-list">
            {formTips.map((tip) => (
              <div key={tip.id} className="training-tips__tip-item">
                <div className="training-tips__tip-item-header">
                  <span>{getCategoryIcon(tip.category)} {tip.category}</span>
                  <button type="button" onClick={() => handleRemoveTipItem(tip.id)}>
                    ×
                  </button>
                </div>
                <p>{tip.content}</p>
                {tip.source && <small>— {tip.source}</small>}
              </div>
            ))}
          </div>

          <div className="training-tips__add-tip">
            <textarea
              value={newTipContent}
              onChange={(e) => setNewTipContent(e.target.value)}
              placeholder="Add a tip or piece of knowledge..."
              rows={2}
            />
            <div className="training-tips__add-tip-row">
              <select
                value={newTipCategory}
                onChange={(e) => setNewTipCategory(e.target.value as TipCategory)}
              >
                {TIP_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newTipSource}
                onChange={(e) => setNewTipSource(e.target.value)}
                placeholder="Source (optional)"
              />
              <button type="button" onClick={handleAddTipItem}>
                Add Tip
              </button>
            </div>
          </div>
        </div>

        <div className="training-tips__form-actions">
          <button
            type="button"
            className="training-tips__cancel"
            onClick={() => setViewMode("list")}
          >
            Cancel
          </button>
          <button type="button" className="training-tips__save" onClick={handleSave}>
            {viewMode === "edit" ? "Save Changes" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
