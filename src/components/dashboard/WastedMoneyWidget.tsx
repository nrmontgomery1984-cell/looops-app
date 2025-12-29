// Wasted Money Widget - Track discretionary spending that could be saved
// Categories: Eating out, Food waste, Cannabis, Impulse purchases, etc.

import React, { useState, useEffect, useMemo } from "react";

// Wasted money entry types
export type WastedCategory =
  | "eating_out"
  | "food_waste"
  | "cannabis"
  | "impulse_purchase"
  | "subscriptions_unused"
  | "convenience_fees"
  | "vending_snacks"
  | "drinks_alcohol"
  | "other";

export interface WastedMoneyEntry {
  id: string;
  description: string;
  amount: number;
  category: WastedCategory;
  date: string;
  notes?: string;
  isWasted: boolean; // User-confirmed as "wasted" vs just discretionary
  createdAt: string;
}

const CATEGORY_LABELS: Record<WastedCategory, string> = {
  eating_out: "Eating Out",
  food_waste: "Food Waste",
  cannabis: "Cannabis",
  impulse_purchase: "Impulse Buy",
  subscriptions_unused: "Unused Subscriptions",
  convenience_fees: "Convenience Fees",
  vending_snacks: "Snacks & Vending",
  drinks_alcohol: "Drinks & Alcohol",
  other: "Other",
};

const CATEGORY_ICONS: Record<WastedCategory, string> = {
  eating_out: "🍔",
  food_waste: "🗑️",
  cannabis: "🌿",
  impulse_purchase: "🛒",
  subscriptions_unused: "📺",
  convenience_fees: "💳",
  vending_snacks: "🍫",
  drinks_alcohol: "🍺",
  other: "💸",
};

type ViewMode = "dashboard" | "log" | "add";

export function WastedMoneyWidget() {
  const [entries, setEntries] = useState<WastedMoneyEntry[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [editingEntry, setEditingEntry] = useState<WastedMoneyEntry | null>(null);

  // Form state
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState<WastedCategory>("eating_out");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formNotes, setFormNotes] = useState("");

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("wasted_money_entries");
    if (stored) {
      try {
        setEntries(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }

    // Also load food waste from meal prep waste log
    loadFoodWasteFromMealPrep();
  }, []);

  // Load food waste entries from meal prep
  const loadFoodWasteFromMealPrep = () => {
    try {
      const mealPrepState = localStorage.getItem("looops_mealprep_state");
      if (mealPrepState) {
        const state = JSON.parse(mealPrepState);
        if (state.wasteLog && state.wasteLog.length > 0) {
          // Import food waste entries that have costs
          const wasteWithCost = state.wasteLog.filter(
            (w: any) => w.estimatedCost && w.estimatedCost > 0
          );

          if (wasteWithCost.length > 0) {
            const existingEntries = localStorage.getItem("wasted_money_entries");
            let entries: WastedMoneyEntry[] = existingEntries
              ? JSON.parse(existingEntries)
              : [];

            // Check for entries not yet imported
            const existingWasteIds = new Set(
              entries
                .filter((e) => e.category === "food_waste")
                .map((e) => e.id)
            );

            const newEntries: WastedMoneyEntry[] = wasteWithCost
              .filter((w: any) => !existingWasteIds.has(`fw_${w.id}`))
              .map((w: any) => ({
                id: `fw_${w.id}`,
                description: `Food Waste: ${w.ingredientName}`,
                amount: w.estimatedCost,
                category: "food_waste" as WastedCategory,
                date: w.date,
                notes: w.notes || undefined,
                isWasted: true,
                createdAt: w.createdAt,
              }));

            if (newEntries.length > 0) {
              entries = [...entries, ...newEntries];
              localStorage.setItem(
                "wasted_money_entries",
                JSON.stringify(entries)
              );
              setEntries(entries);
            }
          }
        }
      }
    } catch {
      // Ignore errors
    }
  };

  // Save to localStorage
  const saveEntries = (newEntries: WastedMoneyEntry[]) => {
    localStorage.setItem("wasted_money_entries", JSON.stringify(newEntries));
    setEntries(newEntries);
  };

  // Calculate stats for current month
  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const thisMonthEntries = entries.filter((e) => {
      const date = new Date(e.date);
      return date >= startOfMonth && date <= endOfMonth;
    });

    const totalThisMonth = thisMonthEntries.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    // By category
    const byCategory: Record<WastedCategory, number> = {
      eating_out: 0,
      food_waste: 0,
      cannabis: 0,
      impulse_purchase: 0,
      subscriptions_unused: 0,
      convenience_fees: 0,
      vending_snacks: 0,
      drinks_alcohol: 0,
      other: 0,
    };

    thisMonthEntries.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    // Top category
    const sortedCategories = Object.entries(byCategory)
      .filter(([_, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1]);

    const topCategory =
      sortedCategories.length > 0 ? sortedCategories[0][0] : null;

    // Last 30 days vs previous 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const last30 = entries
      .filter((e) => new Date(e.date) >= thirtyDaysAgo)
      .reduce((sum, e) => sum + e.amount, 0);

    const prev30 = entries
      .filter(
        (e) =>
          new Date(e.date) >= sixtyDaysAgo && new Date(e.date) < thirtyDaysAgo
      )
      .reduce((sum, e) => sum + e.amount, 0);

    const trend = prev30 > 0 ? ((last30 - prev30) / prev30) * 100 : 0;

    return {
      totalThisMonth,
      byCategory,
      topCategory,
      last30,
      prev30,
      trend,
      entryCount: thisMonthEntries.length,
    };
  }, [entries]);

  // Recent entries for dashboard
  const recentEntries = useMemo(() => {
    return [...entries]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  }, [entries]);

  const resetForm = () => {
    setFormDescription("");
    setFormAmount("");
    setFormCategory("eating_out");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormNotes("");
    setEditingEntry(null);
  };

  const handleAdd = () => {
    if (!formDescription.trim() || !formAmount) return;

    if (editingEntry) {
      const updated = entries.map((e) =>
        e.id === editingEntry.id
          ? {
              ...e,
              description: formDescription.trim(),
              amount: parseFloat(formAmount) || 0,
              category: formCategory,
              date: formDate,
              notes: formNotes.trim() || undefined,
            }
          : e
      );
      saveEntries(updated);
    } else {
      const newEntry: WastedMoneyEntry = {
        id: `wm_${Date.now()}`,
        description: formDescription.trim(),
        amount: parseFloat(formAmount) || 0,
        category: formCategory,
        date: formDate,
        notes: formNotes.trim() || undefined,
        isWasted: true,
        createdAt: new Date().toISOString(),
      };
      saveEntries([newEntry, ...entries]);
    }

    resetForm();
    setViewMode("dashboard");
  };

  const handleEdit = (entry: WastedMoneyEntry) => {
    setEditingEntry(entry);
    setFormDescription(entry.description);
    setFormAmount(entry.amount.toString());
    setFormCategory(entry.category);
    setFormDate(entry.date);
    setFormNotes(entry.notes || "");
    setViewMode("add");
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this entry?")) {
      saveEntries(entries.filter((e) => e.id !== id));
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Dashboard View
  if (viewMode === "dashboard") {
    return (
      <div className="wasted-money-widget">
        <div className="wasted-money-header">
          <div className="wasted-money-title-section">
            <h2>Wasted Money</h2>
            <p className="wasted-money-subtitle">
              Track discretionary spending
            </p>
          </div>
          <button
            className="wasted-money-add-btn"
            onClick={() => setViewMode("add")}
          >
            + Add
          </button>
        </div>

        {/* Stats Cards */}
        <div className="wasted-money-stats">
          <div className="wasted-money-stat wasted-money-stat--main">
            <span className="wasted-money-stat__value">
              {formatCurrency(stats.totalThisMonth)}
            </span>
            <span className="wasted-money-stat__label">This Month</span>
          </div>
          <div className="wasted-money-stat">
            <span className="wasted-money-stat__value">
              {stats.topCategory
                ? CATEGORY_ICONS[stats.topCategory as WastedCategory]
                : "—"}
            </span>
            <span className="wasted-money-stat__label">
              {stats.topCategory
                ? CATEGORY_LABELS[stats.topCategory as WastedCategory]
                : "No data"}
            </span>
          </div>
          <div className="wasted-money-stat">
            <span
              className={`wasted-money-stat__value ${
                stats.trend > 0 ? "up" : stats.trend < 0 ? "down" : ""
              }`}
            >
              {stats.trend > 0 ? "+" : ""}
              {stats.trend.toFixed(0)}%
            </span>
            <span className="wasted-money-stat__label">vs Last 30d</span>
          </div>
        </div>

        {/* Category Breakdown */}
        {stats.entryCount > 0 && (
          <div className="wasted-money-breakdown">
            <h4>By Category</h4>
            <div className="wasted-money-categories">
              {Object.entries(stats.byCategory)
                .filter(([_, amount]) => amount > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => (
                  <div key={category} className="wasted-money-category">
                    <span className="wasted-money-category__icon">
                      {CATEGORY_ICONS[category as WastedCategory]}
                    </span>
                    <span className="wasted-money-category__name">
                      {CATEGORY_LABELS[category as WastedCategory]}
                    </span>
                    <span className="wasted-money-category__amount">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recent Entries */}
        <div className="wasted-money-recent">
          <div className="wasted-money-recent__header">
            <h4>Recent</h4>
            {entries.length > 5 && (
              <button
                className="wasted-money-view-all"
                onClick={() => setViewMode("log")}
              >
                View all ({entries.length})
              </button>
            )}
          </div>
          {recentEntries.length === 0 ? (
            <div className="wasted-money-empty">
              <p>No entries yet</p>
              <p className="wasted-money-empty__hint">
                Start tracking to see where your money goes
              </p>
            </div>
          ) : (
            <div className="wasted-money-list">
              {recentEntries.map((entry) => (
                <div key={entry.id} className="wasted-money-entry">
                  <span className="wasted-money-entry__icon">
                    {CATEGORY_ICONS[entry.category]}
                  </span>
                  <div className="wasted-money-entry__info">
                    <span className="wasted-money-entry__desc">
                      {entry.description}
                    </span>
                    <span className="wasted-money-entry__date">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                  <span className="wasted-money-entry__amount">
                    {formatCurrency(entry.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Log View
  if (viewMode === "log") {
    return (
      <div className="wasted-money-widget">
        <div className="wasted-money-header">
          <button
            className="wasted-money-back"
            onClick={() => setViewMode("dashboard")}
          >
            ← Back
          </button>
          <h2>All Entries</h2>
        </div>

        <div className="wasted-money-list wasted-money-list--full">
          {entries
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )
            .map((entry) => (
              <div key={entry.id} className="wasted-money-entry">
                <span className="wasted-money-entry__icon">
                  {CATEGORY_ICONS[entry.category]}
                </span>
                <div className="wasted-money-entry__info">
                  <span className="wasted-money-entry__desc">
                    {entry.description}
                  </span>
                  <span className="wasted-money-entry__meta">
                    {CATEGORY_LABELS[entry.category]} • {formatDate(entry.date)}
                  </span>
                </div>
                <span className="wasted-money-entry__amount">
                  {formatCurrency(entry.amount)}
                </span>
                <div className="wasted-money-entry__actions">
                  <button onClick={() => handleEdit(entry)}>Edit</button>
                  <button
                    className="delete"
                    onClick={() => handleDelete(entry.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  // Add/Edit Form
  return (
    <div className="wasted-money-widget">
      <div className="wasted-money-header">
        <button
          className="wasted-money-back"
          onClick={() => {
            resetForm();
            setViewMode("dashboard");
          }}
        >
          ← Cancel
        </button>
        <h2>{editingEntry ? "Edit Entry" : "Add Entry"}</h2>
      </div>

      <form
        className="wasted-money-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleAdd();
        }}
      >
        <div className="wasted-money-form__field">
          <label>What was it?</label>
          <input
            type="text"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="e.g., Lunch at restaurant"
            autoFocus
            required
          />
        </div>

        <div className="wasted-money-form__row">
          <div className="wasted-money-form__field">
            <label>Amount</label>
            <div className="wasted-money-form__amount-input">
              <span>$</span>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
          <div className="wasted-money-form__field">
            <label>Date</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        <div className="wasted-money-form__field">
          <label>Category</label>
          <div className="wasted-money-form__categories">
            {(Object.keys(CATEGORY_LABELS) as WastedCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                className={`wasted-money-form__category ${
                  formCategory === cat ? "active" : ""
                }`}
                onClick={() => setFormCategory(cat)}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                <span>{CATEGORY_LABELS[cat]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="wasted-money-form__field">
          <label>Notes (optional)</label>
          <textarea
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            placeholder="Any additional details..."
            rows={2}
          />
        </div>

        <div className="wasted-money-form__actions">
          <button
            type="button"
            className="wasted-money-form__btn wasted-money-form__btn--secondary"
            onClick={() => {
              resetForm();
              setViewMode("dashboard");
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="wasted-money-form__btn wasted-money-form__btn--primary"
            disabled={!formDescription.trim() || !formAmount}
          >
            {editingEntry ? "Save Changes" : "Add Entry"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WastedMoneyWidget;
