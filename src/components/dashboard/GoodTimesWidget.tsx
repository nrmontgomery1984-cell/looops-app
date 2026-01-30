// Good Times Widget - Log and remember memorable moments and fun experiences
import React, { useState, useEffect } from "react";

interface GoodTime {
  id: string;
  title: string;
  description?: string;
  date: string;
  mood: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  createdAt: string;
}

const MOOD_EMOJIS: Record<number, string> = {
  1: "😊",
  2: "😄",
  3: "🥳",
  4: "🤩",
  5: "🎉",
};

const MOOD_LABELS: Record<number, string> = {
  1: "Nice",
  2: "Good",
  3: "Great",
  4: "Amazing",
  5: "Epic",
};

export function GoodTimesWidget() {
  const [goodTimes, setGoodTimes] = useState<GoodTime[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formMood, setFormMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [formTags, setFormTags] = useState("");

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("goodtimes_entries");
    if (stored) {
      try {
        setGoodTimes(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save to localStorage
  const saveGoodTimes = (entries: GoodTime[]) => {
    localStorage.setItem("goodtimes_entries", JSON.stringify(entries));
    setGoodTimes(entries);
  };

  const handleAdd = () => {
    if (!formTitle.trim()) return;

    const newEntry: GoodTime = {
      id: `gt_${Date.now()}`,
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      date: new Date().toISOString().split("T")[0],
      mood: formMood,
      tags: formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      createdAt: new Date().toISOString(),
    };

    saveGoodTimes([newEntry, ...goodTimes]);
    setFormTitle("");
    setFormDescription("");
    setFormMood(3);
    setFormTags("");
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    saveGoodTimes(goodTimes.filter((gt) => gt.id !== id));
  };

  // Stats
  const thisWeek = goodTimes.filter((gt) => {
    const entryDate = new Date(gt.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate >= weekAgo;
  });

  const avgMood =
    thisWeek.length > 0
      ? Math.round(thisWeek.reduce((sum, gt) => sum + gt.mood, 0) / thisWeek.length)
      : 0;

  return (
    <div className="goodtimes-widget">
      {/* Stats Header */}
      <div className="goodtimes-stats">
        <div className="goodtimes-stat">
          <span className="goodtimes-stat-value">{thisWeek.length}</span>
          <span className="goodtimes-stat-label">This Week</span>
        </div>
        <div className="goodtimes-stat">
          <span className="goodtimes-stat-value">{goodTimes.length}</span>
          <span className="goodtimes-stat-label">Total</span>
        </div>
        {avgMood > 0 && (
          <div className="goodtimes-stat">
            <span className="goodtimes-stat-value">{MOOD_EMOJIS[avgMood]}</span>
            <span className="goodtimes-stat-label">Avg Vibe</span>
          </div>
        )}
      </div>

      {/* Add Form */}
      {showAddForm ? (
        <div className="goodtimes-form">
          <input
            type="text"
            className="goodtimes-input"
            placeholder="What was the good time?"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className="goodtimes-textarea"
            placeholder="Details (optional)"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            rows={2}
          />
          <div className="goodtimes-mood-picker">
            <span className="goodtimes-mood-label">How good was it?</span>
            <div className="goodtimes-mood-options">
              {([1, 2, 3, 4, 5] as const).map((level) => (
                <button
                  key={level}
                  className={`goodtimes-mood-btn ${formMood === level ? "active" : ""}`}
                  onClick={() => setFormMood(level)}
                  title={MOOD_LABELS[level]}
                >
                  {MOOD_EMOJIS[level]}
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            className="goodtimes-input"
            placeholder="Tags (comma separated)"
            value={formTags}
            onChange={(e) => setFormTags(e.target.value)}
          />
          <div className="goodtimes-form-actions">
            <button className="goodtimes-save-btn" onClick={handleAdd} disabled={!formTitle.trim()}>
              Save Memory
            </button>
            <button className="goodtimes-cancel-btn" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className="goodtimes-add-btn" onClick={() => setShowAddForm(true)}>
          + Log a Good Time
        </button>
      )}

      {/* Recent Good Times */}
      <div className="goodtimes-list">
        {goodTimes.slice(0, 5).map((gt) => (
          <div key={gt.id} className="goodtimes-entry">
            <div className="goodtimes-entry-header">
              <span className="goodtimes-entry-mood">{MOOD_EMOJIS[gt.mood]}</span>
              <span className="goodtimes-entry-title">{gt.title}</span>
              <button
                className="goodtimes-entry-delete"
                onClick={() => handleDelete(gt.id)}
                title="Delete"
              >
                ×
              </button>
            </div>
            {gt.description && (
              <p className="goodtimes-entry-desc">{gt.description}</p>
            )}
            <div className="goodtimes-entry-meta">
              <span className="goodtimes-entry-date">
                {new Date(gt.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {gt.tags.length > 0 && (
                <div className="goodtimes-entry-tags">
                  {gt.tags.map((tag) => (
                    <span key={tag} className="goodtimes-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {goodTimes.length === 0 && !showAddForm && (
        <div className="goodtimes-empty">
          <span className="goodtimes-empty-icon">🌟</span>
          <p>No good times logged yet</p>
          <p className="goodtimes-empty-hint">Start capturing your favorite moments!</p>
        </div>
      )}
    </div>
  );
}

export default GoodTimesWidget;
