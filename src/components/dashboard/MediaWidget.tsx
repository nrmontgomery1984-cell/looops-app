// Media Widget - Manual logging for movies, TV shows, books, games
// For the Fun loop

import React, { useState } from "react";
import { useApp, useMedia } from "../../context/AppContext";
import {
  MediaEntry,
  MediaType,
  MediaStatus,
  StreamingService,
  STREAMING_SERVICES,
  createMediaEntry,
  getMediaTypeLabel,
  getStatusLabel,
  getStatusColor,
  getRecentMedia,
  getMediaStats,
  filterMediaByType,
  filterMediaByStatus,
} from "../../types/media";

type ViewMode = "recent" | "all" | "stats" | "add";
type FilterType = "all" | MediaType;
type FilterStatus = "all" | MediaStatus;

export function MediaWidget() {
  const { dispatch } = useApp();
  const media = useMedia();
  const [view, setView] = useState<ViewMode>("recent");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [editingEntry, setEditingEntry] = useState<MediaEntry | null>(null);

  // Add/Edit form state
  const [formType, setFormType] = useState<MediaType>("movie");
  const [formTitle, setFormTitle] = useState("");
  const [formCreator, setFormCreator] = useState("");
  const [formStatus, setFormStatus] = useState<MediaStatus>("in_progress");
  const [formRating, setFormRating] = useState<number>(0);
  const [formNotes, setFormNotes] = useState("");
  const [formStreamingService, setFormStreamingService] = useState<StreamingService | "">("");

  const stats = getMediaStats(media.entries);

  const resetForm = () => {
    setFormType("movie");
    setFormTitle("");
    setFormCreator("");
    setFormStatus("in_progress");
    setFormRating(0);
    setFormNotes("");
    setFormStreamingService("");
    setEditingEntry(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const now = new Date().toISOString();

    if (editingEntry) {
      // Update existing entry
      const updated: MediaEntry = {
        ...editingEntry,
        type: formType,
        title: formTitle.trim(),
        creator: formCreator.trim() || undefined,
        status: formStatus,
        rating: formRating || undefined,
        notes: formNotes.trim() || undefined,
        streamingService: formStreamingService || undefined,
        updatedAt: now,
        completedAt: formStatus === "completed" && !editingEntry.completedAt ? now : editingEntry.completedAt,
      };
      dispatch({ type: "UPDATE_MEDIA_ENTRY", payload: updated });
    } else {
      // Create new entry
      const entry = createMediaEntry(formType, formTitle.trim(), formStatus);
      entry.creator = formCreator.trim() || undefined;
      entry.rating = formRating || undefined;
      entry.notes = formNotes.trim() || undefined;
      entry.streamingService = formStreamingService || undefined;
      if (formStatus === "in_progress") {
        entry.startedAt = now;
      } else if (formStatus === "completed") {
        entry.startedAt = now;
        entry.completedAt = now;
      }
      dispatch({ type: "ADD_MEDIA_ENTRY", payload: entry });
    }

    resetForm();
    setView("recent");
  };

  const handleEdit = (entry: MediaEntry) => {
    setEditingEntry(entry);
    setFormType(entry.type);
    setFormTitle(entry.title);
    setFormCreator(entry.creator || "");
    setFormStatus(entry.status);
    setFormRating(entry.rating || 0);
    setFormNotes(entry.notes || "");
    setFormStreamingService(entry.streamingService || "");
    setView("add");
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this entry?")) {
      dispatch({ type: "DELETE_MEDIA_ENTRY", payload: id });
    }
  };

  const handleQuickStatusChange = (entry: MediaEntry, newStatus: MediaStatus) => {
    const now = new Date().toISOString();
    const updated: MediaEntry = {
      ...entry,
      status: newStatus,
      updatedAt: now,
      startedAt: newStatus === "in_progress" && !entry.startedAt ? now : entry.startedAt,
      completedAt: newStatus === "completed" ? now : entry.completedAt,
    };
    dispatch({ type: "UPDATE_MEDIA_ENTRY", payload: updated });
  };

  // Get filtered entries
  const getFilteredEntries = () => {
    let entries = media.entries;
    if (filterType !== "all") {
      entries = filterMediaByType(entries, filterType);
    }
    if (filterStatus !== "all") {
      entries = filterMediaByStatus(entries, filterStatus);
    }
    return entries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  };

  const renderStarRating = (rating: number, onRate?: (r: number) => void) => {
    return (
      <div className="media-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`media-star ${star <= rating ? "filled" : ""} ${onRate ? "clickable" : ""}`}
            onClick={() => onRate?.(star === rating ? 0 : star)}
          >
            {star <= rating ? "★" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  const renderEntry = (entry: MediaEntry) => (
    <div key={entry.id} className="media-entry">
      <div className="media-entry-main">
        <div className="media-entry-type">{getMediaTypeLabel(entry.type)}</div>
        <div className="media-entry-title">{entry.title}</div>
        {entry.creator && <div className="media-entry-creator">{entry.creator}</div>}
        {entry.streamingService && (
          <div className="media-entry-service">
            {STREAMING_SERVICES[entry.streamingService].icon} {STREAMING_SERVICES[entry.streamingService].name}
          </div>
        )}
      </div>
      <div className="media-entry-meta">
        <span
          className="media-entry-status"
          style={{ color: getStatusColor(entry.status) }}
        >
          {getStatusLabel(entry.status)}
        </span>
        {entry.rating && renderStarRating(entry.rating)}
      </div>
      <div className="media-entry-actions">
        {entry.status === "want" && (
          <button
            className="media-action-btn"
            onClick={() => handleQuickStatusChange(entry, "in_progress")}
            title="Start"
          >
            ▶
          </button>
        )}
        {entry.status === "in_progress" && (
          <button
            className="media-action-btn"
            onClick={() => handleQuickStatusChange(entry, "completed")}
            title="Complete"
          >
            ✓
          </button>
        )}
        <button className="media-action-btn" onClick={() => handleEdit(entry)} title="Edit">
          ✎
        </button>
        <button
          className="media-action-btn media-action-btn--danger"
          onClick={() => handleDelete(entry.id)}
          title="Delete"
        >
          ×
        </button>
      </div>
    </div>
  );

  return (
    <div className="media-widget">
      {/* Header */}
      <div className="media-widget-header">
        <h3 className="media-widget-title">Media Log</h3>
        <button
          className="media-add-btn"
          onClick={() => {
            resetForm();
            setView(view === "add" ? "recent" : "add");
          }}
        >
          {view === "add" ? "Cancel" : "+ Add"}
        </button>
      </div>

      {/* Tabs */}
      {view !== "add" && (
        <div className="media-widget-tabs">
          <button
            className={`media-tab ${view === "recent" ? "active" : ""}`}
            onClick={() => setView("recent")}
          >
            Recent
          </button>
          <button
            className={`media-tab ${view === "all" ? "active" : ""}`}
            onClick={() => setView("all")}
          >
            All
          </button>
          <button
            className={`media-tab ${view === "stats" ? "active" : ""}`}
            onClick={() => setView("stats")}
          >
            Stats
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {view === "add" && (
        <form className="media-form" onSubmit={handleSubmit}>
          <div className="media-form-row">
            <label className="media-form-label">Type</label>
            <select
              className="media-form-select"
              value={formType}
              onChange={(e) => setFormType(e.target.value as MediaType)}
            >
              <option value="movie">Movie</option>
              <option value="tv_show">TV Show</option>
              <option value="book">Book</option>
              <option value="game">Game</option>
              <option value="podcast">Podcast</option>
              <option value="music_album">Album</option>
            </select>
          </div>

          <div className="media-form-row">
            <label className="media-form-label">Title</label>
            <input
              type="text"
              className="media-form-input"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Enter title..."
              required
            />
          </div>

          <div className="media-form-row">
            <label className="media-form-label">
              {formType === "movie" ? "Director" :
               formType === "tv_show" ? "Creator" :
               formType === "book" ? "Author" :
               formType === "game" ? "Developer" :
               formType === "podcast" ? "Host" : "Artist"}
            </label>
            <input
              type="text"
              className="media-form-input"
              value={formCreator}
              onChange={(e) => setFormCreator(e.target.value)}
              placeholder="Optional..."
            />
          </div>

          <div className="media-form-row">
            <label className="media-form-label">Status</label>
            <select
              className="media-form-select"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as MediaStatus)}
            >
              <option value="want">Want</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>

          {(formType === "movie" || formType === "tv_show") && (
            <div className="media-form-row">
              <label className="media-form-label">Streaming Service</label>
              <select
                className="media-form-select"
                value={formStreamingService}
                onChange={(e) => setFormStreamingService(e.target.value as StreamingService | "")}
              >
                <option value="">Select service...</option>
                {Object.entries(STREAMING_SERVICES).map(([key, { name, icon }]) => (
                  <option key={key} value={key}>
                    {icon} {name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="media-form-row">
            <label className="media-form-label">Rating</label>
            {renderStarRating(formRating, setFormRating)}
          </div>

          <div className="media-form-row">
            <label className="media-form-label">Notes</label>
            <textarea
              className="media-form-textarea"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>

          <button type="submit" className="media-form-submit">
            {editingEntry ? "Update" : "Add"} Entry
          </button>
        </form>
      )}

      {/* Recent View */}
      {view === "recent" && (
        <div className="media-recent">
          {media.entries.length === 0 ? (
            <div className="media-empty">
              <p>No media logged yet</p>
              <small>Add movies, TV shows, books, and more</small>
            </div>
          ) : (
            <div className="media-entries-list">
              {getRecentMedia(media.entries, 5).map(renderEntry)}
            </div>
          )}
        </div>
      )}

      {/* All View */}
      {view === "all" && (
        <div className="media-all">
          <div className="media-filters">
            <select
              className="media-filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
            >
              <option value="all">All Types</option>
              <option value="movie">Movies</option>
              <option value="tv_show">TV Shows</option>
              <option value="book">Books</option>
              <option value="game">Games</option>
              <option value="podcast">Podcasts</option>
              <option value="music_album">Albums</option>
            </select>
            <select
              className="media-filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            >
              <option value="all">All Status</option>
              <option value="want">Want</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>
          <div className="media-entries-list">
            {getFilteredEntries().length === 0 ? (
              <div className="media-empty">No entries match filters</div>
            ) : (
              getFilteredEntries().map(renderEntry)
            )}
          </div>
        </div>
      )}

      {/* Stats View */}
      {view === "stats" && (
        <div className="media-stats">
          <div className="media-stats-grid">
            <div className="media-stat">
              <span className="media-stat-value">{stats.total}</span>
              <span className="media-stat-label">Total</span>
            </div>
            <div className="media-stat">
              <span className="media-stat-value">{stats.byStatus.completed}</span>
              <span className="media-stat-label">Completed</span>
            </div>
            <div className="media-stat">
              <span className="media-stat-value">{stats.byStatus.in_progress}</span>
              <span className="media-stat-label">In Progress</span>
            </div>
            <div className="media-stat">
              <span className="media-stat-value">{stats.completedThisMonth}</span>
              <span className="media-stat-label">This Month</span>
            </div>
          </div>

          <div className="media-stats-breakdown">
            <h4>By Type</h4>
            <div className="media-type-list">
              {Object.entries(stats.byType).map(([type, count]) => (
                count > 0 && (
                  <div key={type} className="media-type-item">
                    <span className="media-type-name">{getMediaTypeLabel(type as MediaType)}</span>
                    <span className="media-type-count">{count}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaWidget;
