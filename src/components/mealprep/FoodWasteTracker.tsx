// Food Waste Tracker - Track wasted ingredients and identify patterns
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  WasteEntry,
  WasteReason,
  WASTE_REASON_LABELS,
  calculateWasteStats,
  createWasteEntry,
  estimateIngredientCost,
  syncWasteToExpenses,
  removeWasteTransaction,
} from "../../types/mealPrep";

interface FoodWasteTrackerProps {
  wasteLog: WasteEntry[];
  onAddEntry: (entry: WasteEntry) => void;
  onUpdateEntry: (entry: WasteEntry) => void;
  onDeleteEntry: (id: string) => void;
}

type ViewMode = "dashboard" | "log" | "add";

const COMMON_UNITS = ["whole", "cups", "lbs", "oz", "bunch", "bag", "container", "pieces"];

export function FoodWasteTracker({
  wasteLog,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}: FoodWasteTrackerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [editingEntry, setEditingEntry] = useState<WasteEntry | null>(null);

  // Filter states
  const [filterReason, setFilterReason] = useState<WasteReason | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [ingredientName, setIngredientName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("whole");
  const [reason, setReason] = useState<WasteReason>("expired");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [costIsAutoEstimate, setCostIsAutoEstimate] = useState(false);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Auto-estimate cost when ingredient, quantity, or unit changes
  const updateCostEstimate = useCallback(() => {
    // Only auto-update if user hasn't manually entered a cost
    if (!costIsAutoEstimate && estimatedCost !== "") return;

    if (ingredientName.trim()) {
      const qty = parseFloat(quantity) || 1;
      const estimate = estimateIngredientCost(ingredientName, qty, unit);
      if (estimate !== null) {
        setEstimatedCost(estimate.toFixed(2));
        setCostIsAutoEstimate(true);
      }
    }
  }, [ingredientName, quantity, unit, costIsAutoEstimate, estimatedCost]);

  // Debounce the cost estimation
  useEffect(() => {
    const timer = setTimeout(updateCostEstimate, 300);
    return () => clearTimeout(timer);
  }, [updateCostEstimate]);

  // Handle manual cost input
  const handleCostChange = (value: string) => {
    setEstimatedCost(value);
    setCostIsAutoEstimate(false); // User is manually editing
  };

  // Calculate stats
  const stats = useMemo(() => calculateWasteStats(wasteLog, 3), [wasteLog]);

  // Filter entries for log view
  const filteredEntries = useMemo(() => {
    return wasteLog
      .filter(entry => {
        if (filterReason !== "all" && entry.reason !== filterReason) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return entry.ingredientName.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [wasteLog, filterReason, searchQuery]);

  // Recent entries for dashboard
  const recentEntries = useMemo(() => {
    return [...wasteLog]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [wasteLog]);

  const resetForm = () => {
    setIngredientName("");
    setQuantity("");
    setUnit("whole");
    setReason("expired");
    setEstimatedCost("");
    setCostIsAutoEstimate(false);
    setNotes("");
    setDate(new Date().toISOString().split("T")[0]);
    setEditingEntry(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientName.trim()) return;

    if (editingEntry) {
      const updatedEntry: WasteEntry = {
        ...editingEntry,
        ingredientName: ingredientName.trim(),
        normalizedName: ingredientName.toLowerCase().replace(/[^a-z0-9]/g, " ").trim(),
        quantity: parseFloat(quantity) || 1,
        unit,
        reason,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        notes: notes.trim() || undefined,
        date,
      };
      onUpdateEntry(updatedEntry);
      // Sync to expense tracker
      syncWasteToExpenses(updatedEntry);
    } else {
      const entry = createWasteEntry({
        ingredientName: ingredientName.trim(),
        quantity: parseFloat(quantity) || 1,
        unit,
        reason,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        notes: notes.trim() || undefined,
        date,
      });
      onAddEntry(entry);
      // Sync to expense tracker
      syncWasteToExpenses(entry);
    }

    resetForm();
    setViewMode("dashboard");
  };

  const handleEdit = (entry: WasteEntry) => {
    setEditingEntry(entry);
    setIngredientName(entry.ingredientName);
    setQuantity(entry.quantity.toString());
    setUnit(entry.unit);
    setReason(entry.reason);
    setEstimatedCost(entry.estimatedCost?.toString() || "");
    setCostIsAutoEstimate(false); // When editing, treat existing cost as manual
    setNotes(entry.notes || "");
    setDate(entry.date);
    setViewMode("add");
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this waste entry?")) {
      onDeleteEntry(id);
      // Also remove from expense tracker
      removeWasteTransaction(id);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Dashboard View
  if (viewMode === "dashboard") {
    return (
      <div className="food-waste-tracker">
        <div className="food-waste-tracker__header">
          <div className="food-waste-tracker__title-section">
            <h1>No Waste</h1>
            <p className="food-waste-tracker__subtitle">
              Track wasted food to identify patterns and save money
            </p>
          </div>
          <button
            className="food-waste-tracker__add-btn"
            onClick={() => setViewMode("add")}
          >
            + Log Waste
          </button>
        </div>

        {/* Stats Cards */}
        <div className="waste-stats-grid">
          <div className="waste-stats-card">
            <span className="waste-stats-card__value">{stats.totalEntries}</span>
            <span className="waste-stats-card__label">Items wasted (3 mo)</span>
          </div>
          <div className="waste-stats-card">
            <span className="waste-stats-card__value">
              ${stats.totalEstimatedCost.toFixed(2)}
            </span>
            <span className="waste-stats-card__label">Est. cost (3 mo)</span>
          </div>
          <div className="waste-stats-card waste-stats-card--highlight">
            <span className="waste-stats-card__value">
              {stats.topWastedIngredients[0]?.name || "—"}
            </span>
            <span className="waste-stats-card__label">Most wasted</span>
          </div>
        </div>

        {/* Top Offenders */}
        {stats.topWastedIngredients.length > 0 && (
          <div className="waste-section">
            <h3 className="waste-section__title">Top Offenders</h3>
            <div className="waste-offenders-list">
              {stats.topWastedIngredients.map((item, index) => (
                <div key={item.name} className="waste-offender-item">
                  <span className="waste-offender-item__rank">#{index + 1}</span>
                  <span className="waste-offender-item__name">{item.name}</span>
                  <span className="waste-offender-item__count">
                    {item.count}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Entries */}
        <div className="waste-section">
          <div className="waste-section__header">
            <h3 className="waste-section__title">Recent</h3>
            {wasteLog.length > 5 && (
              <button
                className="waste-section__link"
                onClick={() => setViewMode("log")}
              >
                View all ({wasteLog.length})
              </button>
            )}
          </div>
          {recentEntries.length === 0 ? (
            <div className="waste-empty">
              <p>No waste logged yet.</p>
              <p className="waste-empty__hint">
                Start tracking to identify patterns and reduce food waste.
              </p>
            </div>
          ) : (
            <div className="waste-entry-list">
              {recentEntries.map(entry => (
                <div key={entry.id} className="waste-entry-item">
                  <div className="waste-entry-item__main">
                    <span className="waste-entry-item__name">
                      {entry.ingredientName}
                    </span>
                    <span className="waste-entry-item__quantity">
                      {entry.quantity} {entry.unit}
                    </span>
                  </div>
                  <div className="waste-entry-item__meta">
                    <span className="waste-entry-item__reason">
                      {WASTE_REASON_LABELS[entry.reason]}
                    </span>
                    <span className="waste-entry-item__date">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                  <div className="waste-entry-item__actions">
                    <button
                      className="waste-entry-item__action"
                      onClick={() => handleEdit(entry)}
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      className="waste-entry-item__action waste-entry-item__action--delete"
                      onClick={() => handleDelete(entry.id)}
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Waste by Reason */}
        {stats.totalEntries > 0 && (
          <div className="waste-section">
            <h3 className="waste-section__title">By Reason</h3>
            <div className="waste-reasons-grid">
              {(Object.keys(WASTE_REASON_LABELS) as WasteReason[]).map(r => {
                const count = stats.wasteByReason[r];
                if (count === 0) return null;
                return (
                  <div key={r} className="waste-reason-item">
                    <span className="waste-reason-item__label">
                      {WASTE_REASON_LABELS[r]}
                    </span>
                    <span className="waste-reason-item__count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Log View
  if (viewMode === "log") {
    return (
      <div className="food-waste-tracker">
        <div className="food-waste-tracker__header">
          <button
            className="food-waste-tracker__back"
            onClick={() => setViewMode("dashboard")}
          >
            ← Back
          </button>
          <h1>Waste Log</h1>
        </div>

        {/* Filters */}
        <div className="waste-filters">
          <input
            type="text"
            className="waste-filters__search"
            placeholder="Search ingredients..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select
            className="waste-filters__select"
            value={filterReason}
            onChange={e => setFilterReason(e.target.value as WasteReason | "all")}
          >
            <option value="all">All reasons</option>
            {(Object.keys(WASTE_REASON_LABELS) as WasteReason[]).map(r => (
              <option key={r} value={r}>{WASTE_REASON_LABELS[r]}</option>
            ))}
          </select>
        </div>

        {/* Entries List */}
        <div className="waste-entry-list">
          {filteredEntries.length === 0 ? (
            <div className="waste-empty">
              <p>No entries found.</p>
            </div>
          ) : (
            filteredEntries.map(entry => (
              <div key={entry.id} className="waste-entry-item">
                <div className="waste-entry-item__main">
                  <span className="waste-entry-item__name">
                    {entry.ingredientName}
                  </span>
                  <span className="waste-entry-item__quantity">
                    {entry.quantity} {entry.unit}
                  </span>
                </div>
                <div className="waste-entry-item__meta">
                  <span className="waste-entry-item__reason">
                    {WASTE_REASON_LABELS[entry.reason]}
                  </span>
                  <span className="waste-entry-item__date">
                    {formatDate(entry.date)}
                  </span>
                  {entry.estimatedCost && (
                    <span className="waste-entry-item__cost">
                      ${entry.estimatedCost.toFixed(2)}
                    </span>
                  )}
                </div>
                {entry.notes && (
                  <div className="waste-entry-item__notes">{entry.notes}</div>
                )}
                <div className="waste-entry-item__actions">
                  <button
                    className="waste-entry-item__action"
                    onClick={() => handleEdit(entry)}
                  >
                    Edit
                  </button>
                  <button
                    className="waste-entry-item__action waste-entry-item__action--delete"
                    onClick={() => handleDelete(entry.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Add/Edit Form View
  return (
    <div className="food-waste-tracker">
      <div className="food-waste-tracker__header">
        <button
          className="food-waste-tracker__back"
          onClick={() => {
            resetForm();
            setViewMode("dashboard");
          }}
        >
          ← Cancel
        </button>
        <h1>{editingEntry ? "Edit Entry" : "Log Waste"}</h1>
      </div>

      <form className="waste-entry-form" onSubmit={handleSubmit}>
        <div className="waste-entry-form__field">
          <label>What did you throw out?</label>
          <input
            type="text"
            value={ingredientName}
            onChange={e => setIngredientName(e.target.value)}
            placeholder="e.g., green peppers, milk, cilantro"
            required
            autoFocus
          />
        </div>

        <div className="waste-entry-form__row">
          <div className="waste-entry-form__field waste-entry-form__field--half">
            <label>Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="1"
              min="0.1"
              step="0.1"
            />
          </div>
          <div className="waste-entry-form__field waste-entry-form__field--half">
            <label>Unit</label>
            <select value={unit} onChange={e => setUnit(e.target.value)}>
              {COMMON_UNITS.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="waste-entry-form__field">
          <label>Why?</label>
          <div className="waste-entry-form__reason-grid">
            {(Object.keys(WASTE_REASON_LABELS) as WasteReason[]).map(r => (
              <button
                key={r}
                type="button"
                className={`waste-entry-form__reason-btn ${reason === r ? "waste-entry-form__reason-btn--active" : ""}`}
                onClick={() => setReason(r)}
              >
                {WASTE_REASON_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        <div className="waste-entry-form__field">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div className="waste-entry-form__field">
          <label>
            Estimated cost
            {costIsAutoEstimate && estimatedCost && (
              <span className="waste-entry-form__auto-hint"> (auto-estimated)</span>
            )}
          </label>
          <div className="waste-entry-form__cost-input">
            <span className="waste-entry-form__cost-symbol">$</span>
            <input
              type="number"
              value={estimatedCost}
              onChange={e => handleCostChange(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="waste-entry-form__field">
          <label>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any additional details..."
            rows={2}
          />
        </div>

        <div className="waste-entry-form__actions">
          <button
            type="button"
            className="waste-entry-form__btn waste-entry-form__btn--secondary"
            onClick={() => {
              resetForm();
              setViewMode("dashboard");
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="waste-entry-form__btn waste-entry-form__btn--primary"
            disabled={!ingredientName.trim()}
          >
            {editingEntry ? "Save Changes" : "Log Waste"}
          </button>
        </div>
      </form>
    </div>
  );
}
