// Babysitter Widget - Track babysitting sessions for Family loop
// TODO: Widget styling needs redesign (noted for future pass)

import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Caregiver,
  BabysitterSession,
  BabysitterAccess,
  BabysitterPayment,
  HouseholdInfo,
  ScheduleEntry,
  createBabysitterSession,
  createCaregiver,
  createBabysitterAccess,
  createScheduleEntry,
  createBabysitterPayment,
  calculateBabysitterSummary,
  getSessionsByWeek,
  getISOWeekNumber,
  generatePaymentReferenceCode,
  formatCurrency,
  formatHours,
} from "../../types";
import { HouseholdInfoEditor } from "../babysitter";

interface BabysitterWidgetProps {
  caregivers: Caregiver[];
  sessions: BabysitterSession[];
  pins?: BabysitterAccess[];
  householdInfo?: HouseholdInfo;
  schedule?: ScheduleEntry[];
  onAddSession: (session: BabysitterSession) => void;
  onUpdateSession: (session: BabysitterSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onAddCaregiver: (caregiver: Caregiver) => void;
  onUpdateCaregiver: (caregiver: Caregiver) => void;
  onDeactivateCaregiver: (caregiverId: string) => void;
  onAddPin?: (pin: BabysitterAccess) => void;
  onDeletePin?: (caregiverId: string) => void;
  onUpdateHouseholdInfo?: (info: HouseholdInfo) => void;
  onAddScheduleEntry?: (entry: ScheduleEntry) => void;
  onUpdateScheduleEntry?: (entry: ScheduleEntry) => void;
  onDeleteScheduleEntry?: (entryId: string) => void;
}

export function BabysitterWidget({
  caregivers,
  sessions,
  pins = [],
  householdInfo,
  schedule = [],
  onAddSession,
  onUpdateSession,
  onDeleteSession,
  onAddCaregiver,
  onUpdateCaregiver,
  onDeactivateCaregiver,
  onAddPin,
  onDeletePin,
  onUpdateHouseholdInfo,
  onAddScheduleEntry,
  onUpdateScheduleEntry,
  onDeleteScheduleEntry,
}: BabysitterWidgetProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageCaregivers, setShowManageCaregivers] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPinManager, setShowPinManager] = useState(false);
  const [showScheduleManager, setShowScheduleManager] = useState(false);
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
        {onAddPin && (
          <button
            className="babysitter-btn babysitter-btn--portal"
            onClick={() => setShowPinManager(!showPinManager)}
            title="Manage babysitter portal access"
          >
            Portal
          </button>
        )}
        {onAddScheduleEntry && (
          <button
            className="babysitter-btn babysitter-btn--schedule"
            onClick={() => setShowScheduleManager(!showScheduleManager)}
            title="Schedule upcoming babysitting"
          >
            Schedule
          </button>
        )}
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
                      <span className={`babysitter-payment-badge babysitter-payment-badge--${session.paymentStatus || "unpaid"}`}>
                        {session.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                      </span>
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

      {/* Unpaid Summary with Reference Codes */}
      {(() => {
        // Group unpaid sessions by caregiver and week
        const unpaidSessions = sessions.filter(s => s.paymentStatus !== "paid");
        if (unpaidSessions.length === 0) return null;

        const unpaidByCaregiver = new Map<string, { name: string; sessions: BabysitterSession[]; total: number }>();
        for (const session of unpaidSessions) {
          if (!unpaidByCaregiver.has(session.caregiverId)) {
            unpaidByCaregiver.set(session.caregiverId, { name: session.caregiverName, sessions: [], total: 0 });
          }
          const entry = unpaidByCaregiver.get(session.caregiverId)!;
          entry.sessions.push(session);
          entry.total += session.amount;
        }

        const now = new Date();
        const currentWeek = getISOWeekNumber(now);

        return (
          <div className="babysitter-payments-summary">
            <h4>Unpaid Sessions</h4>
            <div className="babysitter-payments-list">
              {Array.from(unpaidByCaregiver.entries()).map(([caregiverId, data]) => {
                const refCode = generatePaymentReferenceCode(data.name, currentWeek);
                return (
                  <div key={caregiverId} className="babysitter-payment-item">
                    <div className="babysitter-payment-info">
                      <span className="babysitter-payment-name">{data.name}</span>
                      <span className="babysitter-payment-sessions">{data.sessions.length} session{data.sessions.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="babysitter-payment-details">
                      <span className="babysitter-payment-total">{formatCurrency(data.total)}</span>
                      <span className="babysitter-payment-ref" title="Use this code in e-transfer memo">
                        Ref: <strong>{refCode}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="babysitter-payments-hint">
              Include the reference code in your e-transfer memo for automatic matching.
            </p>
          </div>
        );
      })()}

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

      {/* Credential Manager for Babysitter Portal */}
      {showPinManager && onAddPin && onDeletePin && (
        <CredentialManager
          caregivers={activeCaregivers}
          pins={pins}
          onAddPin={onAddPin}
          onDeletePin={onDeletePin}
          onClose={() => setShowPinManager(false)}
        />
      )}

      {/* Schedule Manager for parents */}
      {showScheduleManager && onAddScheduleEntry && onUpdateScheduleEntry && onDeleteScheduleEntry && (
        <ScheduleManager
          caregivers={activeCaregivers}
          schedule={schedule}
          onAdd={onAddScheduleEntry}
          onUpdate={onUpdateScheduleEntry}
          onDelete={onDeleteScheduleEntry}
          onClose={() => setShowScheduleManager(false)}
        />
      )}

      {/* Household Info Editor for parents */}
      {householdInfo && onUpdateHouseholdInfo && (
        <HouseholdInfoEditor
          householdInfo={householdInfo}
          onUpdate={onUpdateHouseholdInfo}
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

// Credential Manager for Babysitter Portal
function CredentialManager({
  caregivers,
  pins,
  onAddPin,
  onDeletePin,
  onClose,
}: {
  caregivers: Caregiver[];
  pins: BabysitterAccess[];
  onAddPin: (pin: BabysitterAccess) => void;
  onDeletePin: (caregiverId: string) => void;
  onClose: () => void;
}) {
  const [editingCaregiver, setEditingCaregiver] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleCreateCredentials = (caregiver: Caregiver) => {
    setError("");

    // Validate username uniqueness
    const existingUsername = pins.find(
      (p) => p.username.toLowerCase() === username.toLowerCase() && p.caregiverId !== caregiver.id
    );
    if (existingUsername) {
      setError("Username already exists. Please choose a different one.");
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    const newAccess = createBabysitterAccess(caregiver.id, username.trim(), password);
    onAddPin(newAccess);
    setEditingCaregiver(null);
    setUsername("");
    setPassword("");
  };

  const startEditing = (caregiver: Caregiver) => {
    // Pre-fill username with caregiver's first name in lowercase
    setUsername(caregiver.name.split(" ")[0].toLowerCase());
    setPassword("");
    setError("");
    setEditingCaregiver(caregiver.id);
  };

  const cancelEditing = () => {
    setEditingCaregiver(null);
    setUsername("");
    setPassword("");
    setError("");
  };

  const getCredentialsForCaregiver = (caregiverId: string) => {
    return pins.find((p) => p.caregiverId === caregiverId);
  };

  const portalUrl = `${window.location.origin}/babysitter`;

  return (
    <div className="babysitter-pin-manager">
      <div className="babysitter-pin-manager-header">
        <h4>Babysitter Portal Access</h4>
        <button className="babysitter-btn-icon" onClick={onClose}>×</button>
      </div>

      <div className="babysitter-pin-manager-info">
        <p>Create login credentials for babysitters to access their portal where they can:</p>
        <ul>
          <li>View household info & emergency contacts</li>
          <li>Log their own hours</li>
          <li>View and confirm their schedule</li>
        </ul>
        <div className="babysitter-portal-url">
          <span className="portal-url-label">Portal URL:</span>
          <a href={portalUrl} target="_blank" rel="noopener noreferrer">
            {portalUrl}
          </a>
        </div>
      </div>

      <div className="babysitter-pin-list">
        {caregivers.map((caregiver) => {
          const access = getCredentialsForCaregiver(caregiver.id);
          const isEditing = editingCaregiver === caregiver.id;

          return (
            <div key={caregiver.id} className="babysitter-pin-item">
              <span className="babysitter-pin-name">{caregiver.name}</span>
              {access ? (
                <div className="babysitter-pin-controls">
                  <span className="babysitter-credential-info">
                    <strong>{access.username}</strong>
                  </span>
                  <button
                    className="babysitter-btn-small babysitter-btn-small--danger"
                    onClick={() => onDeletePin(caregiver.id)}
                    title="Revoke access"
                  >
                    Revoke
                  </button>
                </div>
              ) : isEditing ? (
                <div className="babysitter-credential-form">
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="babysitter-credential-input"
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="babysitter-credential-input"
                  />
                  {error && <span className="babysitter-credential-error">{error}</span>}
                  <div className="babysitter-credential-actions">
                    <button
                      className="babysitter-btn-small babysitter-btn-small--primary"
                      onClick={() => handleCreateCredentials(caregiver)}
                    >
                      Save
                    </button>
                    <button
                      className="babysitter-btn-small"
                      onClick={cancelEditing}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="babysitter-btn-small"
                  onClick={() => startEditing(caregiver)}
                >
                  Create Login
                </button>
              )}
            </div>
          );
        })}
      </div>

      {caregivers.length === 0 && (
        <p className="babysitter-pin-empty">
          Add caregivers first to create portal logins.
        </p>
      )}
    </div>
  );
}

// Schedule Manager for parents to create/manage babysitting schedule with calendar view
function ScheduleManager({
  caregivers,
  schedule,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
}: {
  caregivers: Caregiver[];
  schedule: ScheduleEntry[];
  onAdd: (entry: ScheduleEntry) => void;
  onUpdate: (entry: ScheduleEntry) => void;
  onDelete: (entryId: string) => void;
  onClose: () => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    caregiverId: caregivers[0]?.id || "",
    startTime: "18:00",
    endTime: "22:00",
    notes: "",
  });

  // Get calendar days for the current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End on Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean; isToday: boolean }[] = [];
    const current = new Date(startDate);
    const today = new Date().toISOString().split("T")[0];

    while (current <= endDate) {
      const dateStr = current.toISOString().split("T")[0];
      days.push({
        date: new Date(current),
        dateStr,
        isCurrentMonth: current.getMonth() === month,
        isToday: dateStr === today,
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentMonth]);

  // Group schedule entries by date
  const scheduleByDate = useMemo(() => {
    const map: Record<string, ScheduleEntry[]> = {};
    schedule.forEach((entry) => {
      if (!map[entry.date]) map[entry.date] = [];
      map[entry.date].push(entry);
    });
    return map;
  }, [schedule]);

  // Get entries for selected date
  const selectedDateEntries = useMemo(() => {
    if (!selectedDate) return [];
    return scheduleByDate[selectedDate] || [];
  }, [selectedDate, scheduleByDate]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setShowAddForm(false);
  };

  const handleAdd = () => {
    if (!selectedDate) return;
    const caregiver = caregivers.find((c) => c.id === formData.caregiverId);
    if (!caregiver) return;

    const entry = createScheduleEntry(
      formData.caregiverId,
      caregiver.name,
      selectedDate,
      formData.startTime,
      formData.endTime,
      formData.notes || undefined
    );
    onAdd(entry);
    setFormData({
      caregiverId: caregivers[0]?.id || "",
      startTime: "18:00",
      endTime: "22:00",
      notes: "",
    });
    setShowAddForm(false);
  };

  const formatDateLong = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: ScheduleEntry["status"]) => {
    switch (status) {
      case "confirmed":
        return "var(--looops-sage)";
      case "cancelled":
        return "var(--looops-coral)";
      default:
        return "var(--color-accent)";
    }
  };

  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="babysitter-schedule-manager babysitter-schedule-manager--calendar">
      <div className="babysitter-schedule-header">
        <h4>Babysitting Schedule</h4>
        <button className="babysitter-btn-icon" onClick={onClose}>×</button>
      </div>

      {/* Calendar Navigation */}
      <div className="schedule-calendar-nav">
        <button className="schedule-nav-btn" onClick={handlePrevMonth}>‹</button>
        <span className="schedule-month-name">{monthName}</span>
        <button className="schedule-nav-btn" onClick={handleNextMonth}>›</button>
      </div>

      {/* Calendar Grid */}
      <div className="schedule-calendar">
        <div className="schedule-calendar-header">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="schedule-calendar-day-name">{day}</div>
          ))}
        </div>
        <div className="schedule-calendar-grid">
          {calendarDays.map(({ dateStr, date, isCurrentMonth, isToday }) => {
            const entries = scheduleByDate[dateStr] || [];
            const hasSchedule = entries.length > 0;
            const isSelected = selectedDate === dateStr;
            const isPast = dateStr < new Date().toISOString().split("T")[0];

            return (
              <div
                key={dateStr}
                className={`schedule-calendar-day ${!isCurrentMonth ? "schedule-calendar-day--other" : ""} ${isToday ? "schedule-calendar-day--today" : ""} ${isSelected ? "schedule-calendar-day--selected" : ""} ${isPast ? "schedule-calendar-day--past" : ""}`}
                onClick={() => handleDayClick(dateStr)}
              >
                <span className="schedule-calendar-day-number">{date.getDate()}</span>
                {hasSchedule && (
                  <div className="schedule-calendar-day-indicators">
                    {entries.slice(0, 3).map((entry, i) => (
                      <span
                        key={i}
                        className="schedule-calendar-dot"
                        style={{ backgroundColor: getStatusColor(entry.status) }}
                        title={`${entry.caregiverName}: ${entry.startTime}-${entry.endTime}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="schedule-day-details">
          <div className="schedule-day-details-header">
            <h5>{formatDateLong(selectedDate)}</h5>
            {caregivers.length > 0 && !showAddForm && (
              <button
                className="babysitter-btn-small"
                onClick={() => setShowAddForm(true)}
              >
                + Add
              </button>
            )}
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="schedule-add-form">
              <select
                value={formData.caregiverId}
                onChange={(e) => setFormData({ ...formData, caregiverId: e.target.value })}
              >
                {caregivers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="schedule-preset-shifts">
                <button
                  type="button"
                  className="schedule-preset-btn"
                  onClick={() => setFormData({ ...formData, startTime: "07:45", endTime: "17:30" })}
                >
                  Full Day
                </button>
                <button
                  type="button"
                  className="schedule-preset-btn"
                  onClick={() => setFormData({ ...formData, startTime: "07:45", endTime: "12:00" })}
                >
                  AM Half
                </button>
                <button
                  type="button"
                  className="schedule-preset-btn"
                  onClick={() => setFormData({ ...formData, startTime: "12:00", endTime: "17:30" })}
                >
                  PM Half
                </button>
              </div>
              <div className="schedule-time-row">
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
                <span>to</span>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
              <div className="schedule-form-buttons">
                <button className="babysitter-btn-small babysitter-btn--primary" onClick={handleAdd}>Add</button>
                <button className="babysitter-btn-small" onClick={() => setShowAddForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Entries for selected date */}
          {selectedDateEntries.length === 0 && !showAddForm ? (
            <p className="schedule-no-entries">No babysitting scheduled for this day.</p>
          ) : (
            <div className="schedule-entries-list">
              {selectedDateEntries.map((entry) => (
                <div key={entry.id} className="schedule-entry-card">
                  <div className="schedule-entry-main">
                    <span className="schedule-entry-caregiver">{entry.caregiverName}</span>
                    <span className="schedule-entry-time">{entry.startTime} - {entry.endTime}</span>
                    <span
                      className="schedule-entry-status"
                      style={{ color: getStatusColor(entry.status) }}
                    >
                      {entry.status}
                    </span>
                  </div>
                  {entry.notes && (
                    <span className="schedule-entry-notes">{entry.notes}</span>
                  )}
                  <div className="schedule-entry-actions">
                    {entry.status === "pending" && (
                      <button
                        className="babysitter-btn-small"
                        onClick={() => onUpdate({ ...entry, status: "cancelled" })}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      className="babysitter-btn-small babysitter-btn-small--danger"
                      onClick={() => onDelete(entry.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedDate && (
        <p className="schedule-hint">Click on a day to view or add babysitting</p>
      )}

      {caregivers.length === 0 && (
        <p className="babysitter-schedule-empty">
          Add caregivers first to schedule babysitting.
        </p>
      )}
    </div>
  );
}
