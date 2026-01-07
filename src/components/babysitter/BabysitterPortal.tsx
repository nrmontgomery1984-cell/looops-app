// Babysitter Portal - PIN-protected access for babysitters
// Provides limited access to household info, hour logging, and schedule

import React, { useState, useEffect } from "react";
import { AppProvider, FirebaseSyncProvider, useBabysitterPortal, useApp } from "../../context";
import {
  Caregiver,
  BabysitterSession,
  HouseholdInfo,
  ScheduleEntry,
  createBabysitterSession,
  calculateBabysitterSummary,
  getISOWeekNumber,
  generatePaymentReferenceCode,
  formatCurrency,
  formatHours,
} from "../../types";

// Local storage key for babysitter session
const BABYSITTER_SESSION_KEY = "looops_babysitter_session";

type BabysitterSessionData = {
  caregiverId: string;
  caregiverName: string;
  enteredAt: string;
  expiresAt: string;
};

// Check if session is valid
function getValidSession(): BabysitterSessionData | null {
  try {
    const saved = localStorage.getItem(BABYSITTER_SESSION_KEY);
    if (!saved) return null;
    const session = JSON.parse(saved) as BabysitterSessionData;
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(BABYSITTER_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

// Save session
function saveSession(caregiverId: string, caregiverName: string) {
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  const session: BabysitterSessionData = {
    caregiverId,
    caregiverName,
    enteredAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
  localStorage.setItem(BABYSITTER_SESSION_KEY, JSON.stringify(session));
  return session;
}

// Clear session
function clearSession() {
  localStorage.removeItem(BABYSITTER_SESSION_KEY);
}

// Login Screen
function LoginScreen({
  onSuccess,
}: {
  onSuccess: (caregiverId: string, caregiverName: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { pins, caregivers } = useBabysitterPortal();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Find matching username and password
    const access = pins.find(
      (p) => p.username.toLowerCase() === username.toLowerCase() && p.password === password
    );
    if (!access) {
      setError("Invalid username or password. Please try again.");
      setIsLoading(false);
      return;
    }

    // Find the caregiver
    const caregiver = caregivers.find((c) => c.id === access.caregiverId);
    if (!caregiver) {
      setError("Caregiver not found. Please contact the family.");
      setIsLoading(false);
      return;
    }

    // Success!
    onSuccess(caregiver.id, caregiver.name);
  };

  return (
    <div className="babysitter-portal-login">
      <div className="babysitter-portal-login-card">
        <div className="babysitter-portal-logo">
          <span className="logo-icon">👶</span>
          <h1>Babysitter Portal</h1>
        </div>

        <p className="babysitter-portal-subtitle">
          Sign in to access household information
        </p>

        <form onSubmit={handleSubmit} className="babysitter-portal-form">
          <div className="login-input-container">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              placeholder="Username"
              className="login-input"
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="login-input-container">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="login-input"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="login-submit-btn"
            disabled={!username || !password || isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="babysitter-portal-help">
          Don't have login credentials? Ask the family to create them for you.
        </p>
      </div>
    </div>
  );
}

// Babysitter Dashboard (after login)
function BabysitterDashboard({
  session,
  onLogout,
}: {
  session: BabysitterSessionData;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"info" | "hours" | "schedule">("info");
  const { householdInfo, sessions, caregivers, schedule } = useBabysitterPortal();
  const { dispatch } = useApp();

  // Get this babysitter's sessions
  const mySessions = sessions.filter((s) => s.caregiverId === session.caregiverId);
  const mySchedule = schedule.filter((s) => s.caregiverId === session.caregiverId);
  const myCaregiver = caregivers.find((c) => c.id === session.caregiverId);

  // Calculate my stats
  const myStats = calculateBabysitterSummary(mySessions);

  // Log hours handler
  const handleLogHours = (date: string, hours: number, notes?: string) => {
    if (!myCaregiver) return;
    const newSession = createBabysitterSession(
      session.caregiverId,
      session.caregiverName,
      date,
      hours,
      myCaregiver.hourlyRate,
      notes
    );
    dispatch({ type: "ADD_BABYSITTER_SESSION", payload: newSession });
  };

  // Confirm schedule entry
  const handleConfirmSchedule = (entryId: string) => {
    const entry = schedule.find((e) => e.id === entryId);
    if (!entry) return;
    dispatch({
      type: "UPDATE_SCHEDULE_ENTRY",
      payload: { ...entry, status: "confirmed", updatedAt: new Date().toISOString() },
    });
  };

  return (
    <div className="babysitter-dashboard">
      <header className="babysitter-dashboard-header">
        <div className="babysitter-dashboard-title">
          <span className="welcome-text">Welcome, {session.caregiverName}</span>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          Log Out
        </button>
      </header>

      <nav className="babysitter-dashboard-nav">
        <button
          className={`nav-tab ${activeTab === "info" ? "active" : ""}`}
          onClick={() => setActiveTab("info")}
        >
          Household Info
        </button>
        <button
          className={`nav-tab ${activeTab === "hours" ? "active" : ""}`}
          onClick={() => setActiveTab("hours")}
        >
          My Hours
        </button>
        <button
          className={`nav-tab ${activeTab === "schedule" ? "active" : ""}`}
          onClick={() => setActiveTab("schedule")}
        >
          Schedule
        </button>
      </nav>

      <main className="babysitter-dashboard-content">
        {activeTab === "info" && (
          <HouseholdInfoTab householdInfo={householdInfo} />
        )}
        {activeTab === "hours" && (
          <HoursTab
            sessions={mySessions}
            stats={myStats}
            rate={myCaregiver?.hourlyRate || 15}
            caregiverName={session.caregiverName}
            onLogHours={handleLogHours}
          />
        )}
        {activeTab === "schedule" && (
          <ScheduleTab
            schedule={mySchedule}
            onConfirm={handleConfirmSchedule}
          />
        )}
      </main>
    </div>
  );
}

// Household Info Tab
function HouseholdInfoTab({ householdInfo }: { householdInfo: HouseholdInfo }) {
  const hasEmergencyContacts = householdInfo.emergencyContacts.length > 0;
  const hasKids = householdInfo.kids.length > 0;
  const hasRoutines = householdInfo.routines.length > 0;
  const hasRules = householdInfo.houseRules.length > 0;

  if (!hasEmergencyContacts && !hasKids && !hasRoutines && !hasRules && !householdInfo.wifiPassword) {
    return (
      <div className="babysitter-empty-state">
        <span className="empty-icon">📋</span>
        <h3>No household info yet</h3>
        <p>The family hasn't added any household information yet.</p>
      </div>
    );
  }

  return (
    <div className="household-info-view">
      {/* Emergency Contacts - Always First */}
      {hasEmergencyContacts && (
        <section className="info-section info-section--emergency">
          <h2>Emergency Contacts</h2>
          <div className="contacts-list">
            {householdInfo.emergencyContacts
              .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
              .map((contact) => (
                <div key={contact.id} className="contact-card">
                  <div className="contact-header">
                    <span className="contact-name">{contact.name}</span>
                    {contact.isPrimary && (
                      <span className="primary-badge">Primary</span>
                    )}
                  </div>
                  <span className="contact-relationship">{contact.relationship}</span>
                  <a href={`tel:${contact.phone}`} className="contact-phone">
                    {contact.phone}
                  </a>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Kids */}
      {hasKids && (
        <section className="info-section">
          <h2>Kids</h2>
          <div className="kids-list">
            {householdInfo.kids.map((kid) => (
              <div key={kid.id} className="kid-card">
                <div className="kid-header">
                  <span className="kid-name">{kid.name}</span>
                  {kid.age && <span className="kid-age">{kid.age} years old</span>}
                </div>
                {kid.bedtime && (
                  <div className="kid-detail">
                    <span className="detail-label">Bedtime:</span>
                    <span className="detail-value">{kid.bedtime}</span>
                  </div>
                )}
                {kid.allergies && kid.allergies.length > 0 && (
                  <div className="kid-detail kid-detail--warning">
                    <span className="detail-label">Allergies:</span>
                    <span className="detail-value">{kid.allergies.join(", ")}</span>
                  </div>
                )}
                {kid.medications && kid.medications.length > 0 && (
                  <div className="kid-detail">
                    <span className="detail-label">Medications:</span>
                    <span className="detail-value">{kid.medications.join(", ")}</span>
                  </div>
                )}
                {kid.notes && (
                  <div className="kid-notes">{kid.notes}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* WiFi */}
      {householdInfo.wifiPassword && (
        <section className="info-section info-section--wifi">
          <h2>WiFi</h2>
          <div className="wifi-info">
            {householdInfo.wifiName && (
              <div className="wifi-row">
                <span className="wifi-label">Network:</span>
                <span className="wifi-value">{householdInfo.wifiName}</span>
              </div>
            )}
            <div className="wifi-row">
              <span className="wifi-label">Password:</span>
              <span className="wifi-value wifi-password">{householdInfo.wifiPassword}</span>
            </div>
          </div>
        </section>
      )}

      {/* Routines */}
      {hasRoutines && (
        <section className="info-section">
          <h2>Daily Routines</h2>
          <div className="routines-list">
            {householdInfo.routines.map((routine) => (
              <div key={routine.id} className="routine-item">
                <span className="routine-time">{routine.time}</span>
                <span className="routine-activity">{routine.activity}</span>
                {routine.notes && (
                  <span className="routine-notes">{routine.notes}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* House Rules */}
      {hasRules && (
        <section className="info-section">
          <h2>House Rules</h2>
          <ul className="rules-list">
            {householdInfo.houseRules.map((rule, idx) => (
              <li key={idx} className="rule-item">{rule}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Notes */}
      {householdInfo.notes && (
        <section className="info-section">
          <h2>Additional Notes</h2>
          <div className="notes-content">{householdInfo.notes}</div>
        </section>
      )}
    </div>
  );
}

// Hours Tab
function HoursTab({
  sessions,
  stats,
  rate,
  caregiverName,
  onLogHours,
}: {
  sessions: BabysitterSession[];
  stats: ReturnType<typeof calculateBabysitterSummary>;
  rate: number;
  caregiverName: string;
  onLogHours: (date: string, hours: number, notes?: string) => void;
}) {
  const [showLogForm, setShowLogForm] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logHours, setLogHours] = useState("");
  const [logNotes, setLogNotes] = useState("");

  // Calculate unpaid amount and reference code
  const unpaidSessions = sessions.filter(s => s.paymentStatus !== "paid");
  const unpaidAmount = unpaidSessions.reduce((sum, s) => sum + s.amount, 0);
  const currentWeek = getISOWeekNumber(new Date());
  const referenceCode = generatePaymentReferenceCode(caregiverName, currentWeek);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logHours) return;
    onLogHours(logDate, parseFloat(logHours), logNotes || undefined);
    setShowLogForm(false);
    setLogHours("");
    setLogNotes("");
  };

  return (
    <div className="hours-tab">
      {/* Payment Reference Code */}
      {unpaidAmount > 0 && (
        <div className="hours-payment-info">
          <div className="hours-payment-header">
            <span className="hours-payment-label">Unpaid Balance</span>
            <span className="hours-payment-amount">{formatCurrency(unpaidAmount)}</span>
          </div>
          <div className="hours-payment-ref">
            <span className="hours-payment-ref-label">Your payment reference code:</span>
            <span className="hours-payment-ref-code">{referenceCode}</span>
          </div>
          <p className="hours-payment-hint">
            Ask the family to include this code in the e-transfer memo
          </p>
        </div>
      )}

      {/* Stats Summary */}
      <div className="hours-stats">
        <div className="stat-card">
          <span className="stat-label">This Week</span>
          <span className="stat-value">{formatHours(stats.currentWeek.totalHours)}</span>
          <span className="stat-amount">{formatCurrency(stats.currentWeek.totalAmount)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">This Month</span>
          <span className="stat-value">{formatHours(stats.currentMonth.totalHours)}</span>
          <span className="stat-amount">{formatCurrency(stats.currentMonth.totalAmount)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">This Year</span>
          <span className="stat-value">{formatHours(stats.yearToDate.totalHours)}</span>
          <span className="stat-amount">{formatCurrency(stats.yearToDate.totalAmount)}</span>
        </div>
      </div>

      {/* Log Hours Button */}
      {!showLogForm && (
        <button className="log-hours-btn" onClick={() => setShowLogForm(true)}>
          + Log Hours
        </button>
      )}

      {/* Log Hours Form */}
      {showLogForm && (
        <form className="log-hours-form" onSubmit={handleSubmit}>
          <h3>Log Hours</h3>
          <div className="form-row">
            <label>Date</label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>Hours</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              value={logHours}
              onChange={(e) => setLogHours(e.target.value)}
              placeholder="e.g., 3.5"
              required
            />
          </div>
          <div className="form-row">
            <label>Notes (optional)</label>
            <input
              type="text"
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              placeholder="e.g., Date night"
            />
          </div>
          {logHours && (
            <div className="form-preview">
              Estimated: {formatCurrency(parseFloat(logHours) * rate)}
            </div>
          )}
          <div className="form-actions">
            <button type="button" onClick={() => setShowLogForm(false)}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={!logHours}>
              Save
            </button>
          </div>
        </form>
      )}

      {/* Recent Sessions */}
      <div className="sessions-history">
        <h3>Recent Sessions</h3>
        {sessions.length === 0 ? (
          <p className="no-sessions">No sessions logged yet.</p>
        ) : (
          <div className="sessions-list">
            {sessions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 10)
              .map((session) => (
                <div key={session.id} className="session-item">
                  <span className="session-date">
                    {new Date(session.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="session-hours">{formatHours(session.hours)}</span>
                  <span className="session-amount">{formatCurrency(session.amount)}</span>
                  {session.notes && (
                    <span className="session-notes">{session.notes}</span>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Schedule Tab
function ScheduleTab({
  schedule,
  onConfirm,
}: {
  schedule: ScheduleEntry[];
  onConfirm: (entryId: string) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const upcomingSchedule = schedule
    .filter((e) => e.date >= today && e.status !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date));

  const pastSchedule = schedule
    .filter((e) => e.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="schedule-tab">
      <section className="schedule-section">
        <h3>Upcoming</h3>
        {upcomingSchedule.length === 0 ? (
          <p className="no-schedule">No upcoming sessions scheduled.</p>
        ) : (
          <div className="schedule-list">
            {upcomingSchedule.map((entry) => (
              <div key={entry.id} className={`schedule-item schedule-item--${entry.status}`}>
                <div className="schedule-date">
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="schedule-time">
                  {entry.startTime} - {entry.endTime}
                </div>
                {entry.notes && (
                  <div className="schedule-notes">{entry.notes}</div>
                )}
                <div className="schedule-status">
                  {entry.status === "pending" ? (
                    <button className="confirm-btn" onClick={() => onConfirm(entry.id)}>
                      Confirm
                    </button>
                  ) : (
                    <span className="status-badge status-badge--confirmed">Confirmed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {pastSchedule.length > 0 && (
        <section className="schedule-section">
          <h3>Past Sessions</h3>
          <div className="schedule-list schedule-list--past">
            {pastSchedule.map((entry) => (
              <div key={entry.id} className="schedule-item schedule-item--past">
                <div className="schedule-date">
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="schedule-time">
                  {entry.startTime} - {entry.endTime}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Main Portal Component (with its own provider context)
function BabysitterPortalContent() {
  const [session, setSession] = useState<BabysitterSessionData | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const existingSession = getValidSession();
    if (existingSession) {
      setSession(existingSession);
    }
    setIsChecking(false);
  }, []);

  const handleLoginSuccess = (caregiverId: string, caregiverName: string) => {
    const newSession = saveSession(caregiverId, caregiverName);
    setSession(newSession);
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  if (isChecking) {
    return (
      <div className="babysitter-portal-loading">
        <span className="loading-spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onSuccess={handleLoginSuccess} />;
  }

  return <BabysitterDashboard session={session} onLogout={handleLogout} />;
}

// Export the portal wrapped with providers
// Note: Babysitter portal uses null userId since it doesn't have Firebase auth
// The babysitter accesses the household's local data via PIN, not their own account
export function BabysitterPortal() {
  return (
    <AppProvider>
      <FirebaseSyncProvider userId={null}>
        <BabysitterPortalContent />
      </FirebaseSyncProvider>
    </AppProvider>
  );
}

export default BabysitterPortal;
