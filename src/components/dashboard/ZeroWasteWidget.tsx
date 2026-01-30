// Zero Waste Widget - Compact widget for tracking food waste
import { useMemo } from "react";
import { useMealPrep, useApp } from "../../context";
import {
  WasteEntry,
  WASTE_REASON_LABELS,
  calculateWasteStats,
} from "../../types/mealPrep";
import { FoodWasteTracker } from "../mealprep/FoodWasteTracker";

interface ZeroWasteWidgetProps {
  expanded?: boolean;
}

export function ZeroWasteWidget({ expanded = false }: ZeroWasteWidgetProps) {
  const { dispatch } = useApp();
  const mealPrep = useMealPrep();

  const stats = useMemo(
    () => calculateWasteStats(mealPrep.wasteLog, 3),
    [mealPrep.wasteLog]
  );

  const recentEntries = useMemo(() => {
    return [...mealPrep.wasteLog]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [mealPrep.wasteLog]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Full expanded view uses FoodWasteTracker
  if (expanded) {
    return (
      <FoodWasteTracker
        wasteLog={mealPrep.wasteLog}
        onAddEntry={(entry: WasteEntry) => dispatch({ type: "ADD_WASTE_ENTRY", payload: entry })}
        onUpdateEntry={(entry: WasteEntry) => dispatch({ type: "UPDATE_WASTE_ENTRY", payload: entry })}
        onDeleteEntry={(id: string) => dispatch({ type: "DELETE_WASTE_ENTRY", payload: id })}
      />
    );
  }

  // Compact widget view
  return (
    <div className="zero-waste-widget">
      {/* Quick Stats */}
      <div className="zero-waste-widget__stats">
        <div className="zero-waste-widget__stat">
          <span className="zero-waste-widget__stat-value">{stats.totalEntries}</span>
          <span className="zero-waste-widget__stat-label">Items (3mo)</span>
        </div>
        <div className="zero-waste-widget__stat">
          <span className="zero-waste-widget__stat-value">${stats.totalEstimatedCost.toFixed(0)}</span>
          <span className="zero-waste-widget__stat-label">Est. Cost</span>
        </div>
        {stats.topWastedIngredients[0] && (
          <div className="zero-waste-widget__stat zero-waste-widget__stat--highlight">
            <span className="zero-waste-widget__stat-value">{stats.topWastedIngredients[0].name}</span>
            <span className="zero-waste-widget__stat-label">Top Offender</span>
          </div>
        )}
      </div>

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <div className="zero-waste-widget__recent">
          <h4 className="zero-waste-widget__section-title">Recent</h4>
          <div className="zero-waste-widget__entries">
            {recentEntries.map(entry => (
              <div key={entry.id} className="zero-waste-widget__entry">
                <span className="zero-waste-widget__entry-name">{entry.ingredientName}</span>
                <span className="zero-waste-widget__entry-reason">{WASTE_REASON_LABELS[entry.reason]}</span>
                <span className="zero-waste-widget__entry-date">{formatDate(entry.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentEntries.length === 0 && (
        <div className="zero-waste-widget__empty">
          <p>No waste logged yet. Track wasted food to identify patterns.</p>
        </div>
      )}
    </div>
  );
}

export default ZeroWasteWidget;
