// Babysitter Widget - Track babysitting sessions for Family loop
// TODO: Widget styling needs redesign (noted for future pass)

import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Caregiver,
  BabysitterSession,
  createBabysitterSession,
  createCaregiver,
  calculateBabysitterSummary,
  getSessionsByWeek,
  formatCurrency,
  formatHours,
} from "../../types";

interface BabysitterWidgetProps {
  caregivers: Caregiver[];
  sessions: BabysitterSession[];
  onAddSession: (session: BabysitterSession) => void;
  onUpdateSession: (session: BabysitterSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onAddCaregiver: (caregiver: Caregiver) => void;
  onUpdateCaregiver: (caregiver: Caregiver) => void;
  onDeactivateCaregiver: (caregiverId: string) => void;
}

export function BabysitterWidget({
  caregivers,
  sessions,
  onAddSession,
  onUpdateSession,
  onDeleteSession,
  onAddCaregiver,
  onUpdateCaregiver,
  onDeactivateCaregiver,
}: BabysitterWidgetProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageCaregivers, setShowManageCaregivers] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterCaregiverId, setFilterCaregiverId] = useState<string>("all");
  const [editingSession, setEditingSession] = useState<BabysitterSession | null>(null);

  const activeCaregivers = caregivers.filter((c) => c.active);

  // Filter sessions by selected caregiver
  const filteredSessions = useMemo(() => {
    if (filterCaregiverId === "all") return sessions;
    return sessions.filter((s) => s.caregiverId === filterCaregiverId);
  }, [sessions, filterCaregiverId]);

  const summary = useMemo(() => calculateBabysitterSummary(filteredSessions), [filteredSessions]);
  const weekSessions = useMemo(() => getSessionsByWeek(filteredSessions), [filteredSessions]);

  // Get week dates for display
  const weekDates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);

    const dates: { date: string; dayName: string; isToday: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      dates.push({
        date: dateStr,
        dayName: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
        isToday: dateStr === today.toISOString().split("T")[0],
      });
    }
    return dates;
  }, []);

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setShowAddModal(true);
  };

  // Get unique caregivers from sessions for filter (includes inactive ones who have sessions)
  const caregiversWithSessions = useMemo(() => {
    const uniqueIds = [...new Set(sessions.map((s) => s.caregiverId))];
    return uniqueIds.map((id) => {
      const caregiver = caregivers.find((c) => c.id === id);
      const session = sessions.find((s) => s.caregiverId === id);
      return {
        id,
        name: caregiver?.name || session?.caregiverName || "Unknown",
      };
    });
  }, [sessions, caregivers]);

  return (
    <div className="babysitter-widget">
      {/* Filter by Caregiver */}
      {caregiversWithSessions.length > 1 && (
        <div className="babysitter-filter">
          <label className="babysitter-filter-label">Filter:</label>
          <select
            className="babysitter-filter-select"
            value={filterCaregiverId}
            onChange={(e) => setFilterCaregiverId(e.target.value)}
          >
            <option value="all">All Caregivers</option>
            {caregiversWithSessions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Weekly View */}
      <div className="babysitter-week-grid">
        {weekDates.map(({ date, dayName, isToday }) => {
          const daySessions = weekSessions[date] || [];
          const totalHours = daySessions.reduce((sum, s) => sum + s.hours, 0);
          const caregiverNames = [...new Set(daySessions.map((s) => s.caregiverName))];

          return (
            <div
              key={date}
              className={`babysitter-day ${isToday ? "babysitter-day--today" : ""} ${
                daySessions.length > 0 ? "babysitter-day--has-sessions" : ""
              }`}
              onClick={() => handleDayClick(date)}
            >
              <span className="babysitter-day-name">{dayName}</span>
              {daySessions.length > 0 ? (
                <>
                  <span className="babysitter-day-hours">{formatHours(totalHours)}</span>
                  <span className="babysitter-day-caregiver">
                    {caregiverNames.join(", ")}
                  </span>
                </>
              ) : (
                <span className="babysitter-day-empty">-</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Section */}
      <div className="babysitter-summary">
        <div className="babysitter-summary-item">
          <span className="babysitter-summary-label">This Week</span>
          <span className="babysitter-summary-value">
            {formatHours(summary.currentWeek.totalHours)} / {formatCurrency(summary.currentWeek.totalAmount)}
          </span>
        </div>
        <div className="babysitter-summary-item">
          <span className="babysitter-summary-label">This Month</span>
          <span className="babysitter-summary-value">
            {formatHours(summary.currentMonth.totalHours)} / {formatCurrency(summary.currentMonth.totalAmount)}
          </span>
        </div>
        <div className="babysitter-summary-item">
          <span className="babysitter-summary-label">YTD</span>
          <span className="babysitter-summary-value">
            {formatHours(summary.yearToDate.totalHours)} / {formatCurrency(summary.yearToDate.totalAmount)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="babysitter-actions">
        <button
          className="babysitter-btn babysitter-btn--primary"
          onClick={() => {
            setSelectedDate(new Date().toISOString().split("T")[0]);
            setShowAddModal(true);
          }}
        >
          + Log Hours
        </button>
        <button
          className="babysitter-btn"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? "Hide History" : "History"}
        </button>
        <button
          className="babysitter-btn"
          onClick={() => setShowManageCaregivers(!showManageCaregivers)}
        >
          Manage
        </button>
      </div>

      {/* History Section */}
      {showHistory && (
        <div className="babysitter-history">
          <h4>
            Recent Sessions
            {filterCaregiverId !== "all" && (
              <span className="babysitter-history-filter-label">
                {" "}({caregiversWithSessions.find((c) => c.id === filterCaregiverId)?.name})
              </span>
            )}
          </h4>
          {filteredSessions.length === 0 ? (
            <p className="babysitter-empty">
              {filterCaregiverId !== "all" ? "No sessions for this caregiver" : "No sessions logged yet"}
            </p>
          ) : (
            <div className="babysitter-history-list">
              {filteredSessions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((session) => (
                  editingSession?.id === session.id ? (
                    <EditSessionRow
                      key={session.id}
                      session={session}
                      caregivers={caregivers}
                      onSave={(updated) => {
                        onUpdateSession(updated);
                        setEditingSession(null);
                      }}
                      onCancel={() => setEditingSession(null)}
                    />
                  ) : (
                    <div key={session.id} className="babysitter-history-item">
                      <span className="babysitter-history-date">
                        {new Date(session.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="babysitter-history-caregiver">{session.caregiverName}</span>
                      <span className="babysitter-history-hours">{formatHours(session.hours)}</span>
                      <span className="babysitter-history-amount">{formatCurrency(session.amount)}</span>
                      <button
                        className="babysitter-history-edit"
                        onClick={() => setEditingSession(session)}
                        title="Edit session"
                      >
                        Edit
                      </button>
                      <button
                        className="babysitter-history-delete"
                        onClick={() => onDeleteSession(session.id)}
                        title="Delete session"
                      >
                        ×
                      </button>
                    </div>
                  )
                ))}
            </div>
          )}
        </div>
      )}

      {/* Caregiver Management */}
      {showManageCaregivers && (
        <CaregiverManager
          caregivers={caregivers}
          onAdd={onAddCaregiver}
          onUpdate={onUpdateCaregiver}
          onDeactivate={onDeactivateCaregiver}
          onClose={() => setShowManageCaregivers(false)}
        />
      )}

      {/* Add Session Modal - rendered via Portal to modal-root outside React app */}
      {showAddModal && createPortal(
        <AddSessionModal
          caregivers={activeCaregivers}
          initialDate={selectedDate || new Date().toISOString().split("T")[0]}
          onAdd={(session) => {
            onAddSession(session);
            setShowAddModal(false);
            setSelectedDate(null);
          }}
          onClose={() => {
            setShowAddModal(false);
            setSelectedDate(null);
          }}
        />,
        document.getElementById('modal-root') || document.body
      )}
    </div>
  );
}

// Add Session Modal
function AddSessionModal({
  caregivers,
  initialDate,
  onAdd,
  onClose,
}: {
  caregivers: Caregiver[];
  initialDate: string;
  onAdd: (session: BabysitterSession) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(initialDate);
  const [caregiverId, setCaregiverId] = useState(caregivers[0]?.id || "");
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");

  // Add class to body to disable transforms while modal is open
  React.useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const selectedCaregiver = caregivers.find((c) => c.id === caregiverId);
  const calculatedAmount = selectedCaregiver && hours ? parseFloat(hours) * selectedCaregiver.hourlyRate : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caregiverId || !hours || !selectedCaregiver) return;

    const session = createBabysitterSession(
      caregiverId,
      selectedCaregiver.name,
      date,
      parseFloat(hours),
      selectedCaregiver.hourlyRate,
      notes || undefined
    );
    onAdd(session);
  };

  // Show message if no caregivers exist
  if (caregivers.length === 0) {
    return (
      <div className="babysitter-modal-overlay" onClick={onClose}>
        <div className="babysitter-modal" onClick={(e) => e.stopPropagation()}>
          <div className="babysitter-modal-header">
            <h3>Log Babysitting Hours</h3>
            <button className="babysitter-modal-close" onClick={onClose}>×</button>
          </div>
          <div className="babysitter-modal-empty">
            <p>No caregivers added yet.</p>
            <p>Please add a caregiver first using the "Manage" button.</p>
            <button className="babysitter-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="babysitter-modal-overlay" onClick={onClose}>
      <div className="babysitter-modal" onClick={(e) => e.stopPropagation()}>
        <div className="babysitter-modal-header">
          <h3>Log Babysitting Hours</h3>
          <button className="babysitter-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="babysitter-form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="babysitter-form-group">
            <label>Caregiver</label>
            <select
              value={caregiverId}
              onChange={(e) => setCaregiverId(e.target.value)}
              required
            >
              {caregivers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({formatCurrency(c.hourlyRate)}/hr)
                </option>
              ))}
            </select>
          </div>
          <div className="babysitter-form-group">
            <label>Hours</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g., 3.5"
              required
            />
          </div>
          <div className="babysitter-form-group">
            <label>Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Date night"
            />
          </div>
          {hours && selectedCaregiver && (
            <div className="babysitter-calculated">
              Total: {formatCurrency(calculatedAmount)}
            </div>
          )}
          <div className="babysitter-modal-actions">
            <button type="button" className="babysitter-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="babysitter-btn babysitter-btn--primary"
              disabled={!caregiverId || !hours}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Session Row (inline edit in history)
function EditSessionRow({
  session,
  caregivers,
  onSave,
  onCancel,
}: {
  session: BabysitterSession;
  caregivers: Caregiver[];
  onSave: (session: BabysitterSession) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(session.date);
  const [hours, setHours] = useState(session.hours.toString());
  const [caregiverId, setCaregiverId] = useState(session.caregiverId);

  const selectedCaregiver = caregivers.find((c) => c.id === caregiverId);
  const hourlyRate = selectedCaregiver?.hourlyRate || session.amount / session.hours;
  const calculatedAmount = parseFloat(hours) * hourlyRate;

  const handleSave = () => {
    if (!hours || parseFloat(hours) <= 0) return;
    onSave({
      ...session,
      date,
      hours: parseFloat(hours),
      caregiverId,
      caregiverName: selectedCaregiver?.name || session.caregiverName,
      amount: calculatedAmount,
    });
  };

  return (
    <div className="babysitter-history-item babysitter-history-item--editing">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="babysitter-edit-date"
      />
      <select
        value={caregiverId}
        onChange={(e) => setCaregiverId(e.target.value)}
        className="babysitter-edit-caregiver"
      >
        {caregivers.filter(c => c.active).map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input
        type="number"
        step="0.5"
        min="0.5"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        className="babysitter-edit-hours"
      />
      <span className="babysitter-edit-amount">{formatCurrency(calculatedAmount || 0)}</span>
      <button className="babysitter-btn-small" onClick={handleSave}>Save</button>
      <button className="babysitter-btn-small" onClick={onCancel}>Cancel</button>
    </div>
  );
}

// Caregiver Manager
function CaregiverManager({
  caregivers,
  onAdd,
  onUpdate,
  onDeactivate,
  onClose,
}: {
  caregivers: Caregiver[];
  onAdd: (caregiver: Caregiver) => void;
  onUpdate: (caregiver: Caregiver) => void;
  onDeactivate: (caregiverId: string) => void;
  onClose: () => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRate, setNewRate] = useState("15");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState("");

  const handleAddCaregiver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const caregiver = createCaregiver(newName.trim(), parseFloat(newRate) || 15);
    onAdd(caregiver);
    setNewName("");
    setNewRate("15");
    setShowAddForm(false);
  };

  const handleUpdateRate = (caregiver: Caregiver) => {
    const newHourlyRate = parseFloat(editRate);
    if (isNaN(newHourlyRate) || newHourlyRate <= 0) return;
    onUpdate({
      ...caregiver,
      hourlyRate: newHourlyRate,
      updatedAt: new Date().toISOString(),
    });
    setEditingId(null);
    setEditRate("");
  };

  return (
    <div className="babysitter-manager">
      <div className="babysitter-manager-header">
        <h4>Caregivers</h4>
        <button className="babysitter-btn-icon" onClick={onClose}>×</button>
      </div>
      <div className="babysitter-manager-list">
        {caregivers.map((caregiver) => (
          <div
            key={caregiver.id}
            className={`babysitter-manager-item ${!caregiver.active ? "babysitter-manager-item--inactive" : ""}`}
          >
            <span className="babysitter-manager-name">{caregiver.name}</span>
            {editingId === caregiver.id ? (
              <div className="babysitter-manager-edit">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={editRate}
                  onChange={(e) => setEditRate(e.target.value)}
                  className="babysitter-manager-input"
                />
                <button
                  className="babysitter-btn-small"
                  onClick={() => handleUpdateRate(caregiver)}
                >
                  Save
                </button>
                <button
                  className="babysitter-btn-small"
                  onClick={() => {
                    setEditingId(null);
                    setEditRate("");
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="babysitter-manager-actions">
                <span className="babysitter-manager-rate">
                  {formatCurrency(caregiver.hourlyRate)}/hr
                </span>
                {caregiver.active && (
                  <>
                    <button
                      className="babysitter-btn-small"
                      onClick={() => {
                        setEditingId(caregiver.id);
                        setEditRate(caregiver.hourlyRate.toString());
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="babysitter-btn-small babysitter-btn-small--danger"
                      onClick={() => onDeactivate(caregiver.id)}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {showAddForm ? (
        <form className="babysitter-manager-add" onSubmit={handleAddCaregiver}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            required
          />
          <input
            type="number"
            step="0.5"
            min="1"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            placeholder="Rate"
          />
          <button type="submit" className="babysitter-btn-small">Add</button>
          <button
            type="button"
            className="babysitter-btn-small"
            onClick={() => setShowAddForm(false)}
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          className="babysitter-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add Caregiver
        </button>
      )}
    </div>
  );
}
