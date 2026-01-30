// Special Dates Widget - Track important dates like birthdays, anniversaries, etc.
// For Family loop

import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Person,
  SpecialDate,
  SpecialDateType,
  SpecialDateCategory,
  createPerson,
  createSpecialDate,
  getDateTypeIcon,
  getUpcomingSpecialDates,
  getYearsSince,
} from "../../types";

interface SpecialDatesWidgetProps {
  people: Person[];
  dates: SpecialDate[];
  onAddPerson: (person: Person) => void;
  onUpdatePerson: (person: Person) => void;
  onDeletePerson: (personId: string) => void;
  onAddDate: (date: SpecialDate) => void;
  onUpdateDate: (date: SpecialDate) => void;
  onDeleteDate: (dateId: string) => void;
}

export function SpecialDatesWidget({
  people,
  dates,
  onAddPerson,
  onUpdatePerson,
  onDeletePerson,
  onAddDate,
  onUpdateDate,
  onDeleteDate,
}: SpecialDatesWidgetProps) {
  const [showAddDateModal, setShowAddDateModal] = useState(false);
  const [showManagePeople, setShowManagePeople] = useState(false);
  const [showAllDates, setShowAllDates] = useState(false);
  const [editingDate, setEditingDate] = useState<SpecialDate | null>(null);

  // Get upcoming dates (next 30 days)
  const upcomingDates = useMemo(
    () => getUpcomingSpecialDates(dates, 30),
    [dates]
  );

  // Group dates by person for display
  const datesByPerson = useMemo(() => {
    const grouped: Record<string, SpecialDate[]> = {};
    dates.forEach((d) => {
      if (!grouped[d.personId]) grouped[d.personId] = [];
      grouped[d.personId].push(d);
    });
    return grouped;
  }, [dates]);

  return (
    <div className="special-dates-widget">
      {/* Upcoming Dates Section */}
      <div className="special-dates-upcoming">
        <h4 className="special-dates-section-title">Upcoming</h4>
        {upcomingDates.length === 0 ? (
          <p className="special-dates-empty">No upcoming dates in the next 30 days</p>
        ) : (
          <div className="special-dates-list">
            {upcomingDates.slice(0, 5).map((d) => (
              <UpcomingDateItem
                key={d.id}
                date={d}
                onEdit={() => setEditingDate(d)}
              />
            ))}
            {upcomingDates.length > 5 && (
              <button
                className="special-dates-show-more"
                onClick={() => setShowAllDates(true)}
              >
                +{upcomingDates.length - 5} more
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="special-dates-actions">
        <button
          className="special-dates-btn special-dates-btn--primary"
          onClick={() => setShowAddDateModal(true)}
        >
          + Add Date
        </button>
        <button
          className="special-dates-btn"
          onClick={() => setShowAllDates(!showAllDates)}
        >
          {showAllDates ? "Hide All" : "View All"}
        </button>
        <button
          className="special-dates-btn"
          onClick={() => setShowManagePeople(!showManagePeople)}
        >
          People
        </button>
      </div>

      {/* All Dates Section */}
      {showAllDates && (
        <div className="special-dates-all">
          <h4 className="special-dates-section-title">
            All Special Dates ({dates.length})
          </h4>
          {dates.length === 0 ? (
            <p className="special-dates-empty">No dates added yet</p>
          ) : (
            <div className="special-dates-all-list">
              {dates
                .sort((a, b) => {
                  // Sort by month/day
                  const [, aMonth, aDay] = a.date.split("-").map(Number);
                  const [, bMonth, bDay] = b.date.split("-").map(Number);
                  return aMonth * 100 + aDay - (bMonth * 100 + bDay);
                })
                .map((d) => (
                  <div key={d.id} className="special-dates-all-item">
                    <span className="special-dates-all-icon">
                      {getDateTypeIcon(d.type)}
                    </span>
                    <span className="special-dates-all-date">
                      {formatMonthDay(d.date)}
                    </span>
                    <span className="special-dates-all-title">{d.title}</span>
                    <span className="special-dates-all-person">{d.personName}</span>
                    <button
                      className="special-dates-all-edit"
                      onClick={() => setEditingDate(d)}
                    >
                      Edit
                    </button>
                    <button
                      className="special-dates-all-delete"
                      onClick={() => onDeleteDate(d.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* People Management */}
      {showManagePeople && (
        <PeopleManager
          people={people}
          datesByPerson={datesByPerson}
          onAdd={onAddPerson}
          onUpdate={onUpdatePerson}
          onDelete={onDeletePerson}
          onClose={() => setShowManagePeople(false)}
        />
      )}

      {/* Add/Edit Date Modal */}
      {(showAddDateModal || editingDate) &&
        createPortal(
          <DateFormModal
            people={people}
            existingDate={editingDate}
            onSave={(date) => {
              if (editingDate) {
                onUpdateDate(date);
              } else {
                onAddDate(date);
              }
              setShowAddDateModal(false);
              setEditingDate(null);
            }}
            onDelete={
              editingDate
                ? () => {
                    onDeleteDate(editingDate.id);
                    setEditingDate(null);
                  }
                : undefined
            }
            onClose={() => {
              setShowAddDateModal(false);
              setEditingDate(null);
            }}
            onAddPerson={onAddPerson}
          />,
          document.getElementById("modal-root") || document.body
        )}
    </div>
  );
}

// Helper to format month/day
function formatMonthDay(dateStr: string): string {
  const [, month, day] = dateStr.split("-").map(Number);
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${monthNames[month - 1]} ${day}`;
}

// Helper to get days until date
function getDaysUntil(dateStr: string): number {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [, month, day] = dateStr.split("-").map(Number);
  let targetDate = new Date(currentYear, month - 1, day);

  // If the date has passed this year, use next year
  if (targetDate < today) {
    targetDate = new Date(currentYear + 1, month - 1, day);
  }

  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Upcoming Date Item Component
function UpcomingDateItem({
  date,
  onEdit,
}: {
  date: SpecialDate;
  onEdit: () => void;
}) {
  const daysUntil = getDaysUntil(date.date);
  const years = getYearsSince(date);

  let timeText = "";
  if (daysUntil === 0) {
    timeText = "Today!";
  } else if (daysUntil === 1) {
    timeText = "Tomorrow";
  } else {
    timeText = `In ${daysUntil} days`;
  }

  return (
    <div
      className={`special-dates-upcoming-item ${
        daysUntil === 0 ? "special-dates-upcoming-item--today" : ""
      }`}
      onClick={onEdit}
    >
      <span className="special-dates-upcoming-icon">
        {getDateTypeIcon(date.type)}
      </span>
      <div className="special-dates-upcoming-content">
        <span className="special-dates-upcoming-title">{date.title}</span>
        <span className="special-dates-upcoming-meta">
          {formatMonthDay(date.date)}
          {years !== null && ` (${years + 1} years)`}
        </span>
      </div>
      <span
        className={`special-dates-upcoming-time ${
          daysUntil <= 7 ? "special-dates-upcoming-time--soon" : ""
        }`}
      >
        {timeText}
      </span>
    </div>
  );
}

// Date Form Modal
function DateFormModal({
  people,
  existingDate,
  onSave,
  onDelete,
  onClose,
  onAddPerson,
}: {
  people: Person[];
  existingDate: SpecialDate | null;
  onSave: (date: SpecialDate) => void;
  onDelete?: () => void;
  onClose: () => void;
  onAddPerson: (person: Person) => void;
}) {
  const [personId, setPersonId] = useState(existingDate?.personId || "");
  const [type, setType] = useState<SpecialDateType>(existingDate?.type || "birthday");
  const [title, setTitle] = useState(existingDate?.title || "");
  const [date, setDate] = useState(existingDate?.date || "");
  const [year, setYear] = useState(existingDate?.year?.toString() || "");
  const [recurring, setRecurring] = useState(existingDate?.recurring ?? true);
  const [reminderAction, setReminderAction] = useState<NonNullable<SpecialDate["reminderAction"]>>(
    existingDate?.reminderAction || "call"
  );
  const [notes, setNotes] = useState(existingDate?.notes || "");
  const [showNewPerson, setShowNewPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonRelationship, setNewPersonRelationship] = useState("");

  // Add class to body while modal is open
  React.useEffect(() => {
    document.body.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, []);

  const selectedPerson = people.find((p) => p.id === personId);

  // Auto-generate title based on type and person
  React.useEffect(() => {
    if (!existingDate && selectedPerson && type) {
      const person = selectedPerson;
      switch (type) {
        case "birthday":
          setTitle(`${person.name}'s Birthday`);
          break;
        case "wedding_anniversary":
          setTitle(`${person.name}'s Wedding Anniversary`);
          break;
        case "death_anniversary":
          setTitle(`Remembering ${person.name}`);
          break;
        case "birth_of_child":
          setTitle(`${person.name}'s Birthday`);
          break;
        case "graduation":
          setTitle(`${person.name}'s Graduation`);
          break;
        default:
          break;
      }
    }
  }, [type, personId, selectedPerson, existingDate]);

  const handleAddNewPerson = () => {
    if (!newPersonName.trim()) return;
    const person = createPerson(
      newPersonName.trim(),
      newPersonRelationship.trim() || "Friend",
      "friend"
    );
    onAddPerson(person);
    setPersonId(person.id);
    setShowNewPerson(false);
    setNewPersonName("");
    setNewPersonRelationship("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId || !date || !title) return;

    const person = people.find((p) => p.id === personId);
    if (!person) return;

    if (existingDate) {
      onSave({
        ...existingDate,
        personId,
        personName: person.name,
        type,
        title,
        date,
        year: year ? parseInt(year) : undefined,
        recurring,
        reminderAction: reminderAction as SpecialDate["reminderAction"],
        notes: notes || undefined,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const newDate = createSpecialDate(personId, person.name, type, title, date, {
        year: year ? parseInt(year) : undefined,
        recurring,
        reminderAction: reminderAction as SpecialDate["reminderAction"],
        notes: notes || undefined,
      });
      onSave(newDate);
    }
  };

  return (
    <div className="special-dates-modal-overlay" onClick={onClose}>
      <div className="special-dates-modal" onClick={(e) => e.stopPropagation()}>
        <div className="special-dates-modal-header">
          <h3>{existingDate ? "Edit Special Date" : "Add Special Date"}</h3>
          <button className="special-dates-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Person Selection */}
          <div className="special-dates-form-group">
            <label>Person</label>
            {showNewPerson ? (
              <div className="special-dates-new-person">
                <input
                  type="text"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="Name"
                  autoFocus
                />
                <input
                  type="text"
                  value={newPersonRelationship}
                  onChange={(e) => setNewPersonRelationship(e.target.value)}
                  placeholder="Relationship (e.g., Mom, Friend)"
                />
                <button
                  type="button"
                  className="special-dates-btn-small"
                  onClick={handleAddNewPerson}
                >
                  Add
                </button>
                <button
                  type="button"
                  className="special-dates-btn-small"
                  onClick={() => setShowNewPerson(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="special-dates-person-select">
                <select
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                  required
                >
                  <option value="">Select a person...</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.relationship})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="special-dates-btn-small"
                  onClick={() => setShowNewPerson(true)}
                >
                  + New
                </button>
              </div>
            )}
          </div>

          {/* Date Type */}
          <div className="special-dates-form-group">
            <label>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as SpecialDateType)}
            >
              <option value="birthday">Birthday</option>
              <option value="wedding_anniversary">Wedding Anniversary</option>
              <option value="death_anniversary">Remembrance Day</option>
              <option value="birth_of_child">Child's Birthday</option>
              <option value="graduation">Graduation</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Title */}
          <div className="special-dates-form-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Mom's Birthday"
              required
            />
          </div>

          {/* Date */}
          <div className="special-dates-form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Year (optional) */}
          <div className="special-dates-form-group">
            <label>
              Year (optional)
              <span className="special-dates-form-hint">
                For tracking anniversaries
              </span>
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g., 1984"
              min="1900"
              max={new Date().getFullYear()}
            />
          </div>

          {/* Recurring */}
          <div className="special-dates-form-group special-dates-form-group--inline">
            <label>
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
              />
              Remind me every year
            </label>
          </div>

          {/* Reminder Action */}
          <div className="special-dates-form-group">
            <label>Reminder Action</label>
            <select
              value={reminderAction}
              onChange={(e) => setReminderAction(e.target.value as "call" | "text" | "visit" | "gift" | "other")}
            >
              <option value="call">Call</option>
              <option value="text">Text</option>
              <option value="visit">Visit</option>
              <option value="gift">Send a gift</option>
              <option value="other">Just remember</option>
            </select>
          </div>

          {/* Notes */}
          <div className="special-dates-form-group">
            <label>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Gift ideas, memories, etc."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="special-dates-modal-actions">
            {onDelete && (
              <button
                type="button"
                className="special-dates-btn special-dates-btn--danger"
                onClick={onDelete}
              >
                Delete
              </button>
            )}
            <div className="special-dates-modal-actions-right">
              <button
                type="button"
                className="special-dates-btn"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="special-dates-btn special-dates-btn--primary"
                disabled={!personId || !date || !title}
              >
                {existingDate ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// People Manager
function PeopleManager({
  people,
  datesByPerson,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
}: {
  people: Person[];
  datesByPerson: Record<string, SpecialDate[]>;
  onAdd: (person: Person) => void;
  onUpdate: (person: Person) => void;
  onDelete: (personId: string) => void;
  onClose: () => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelationship, setNewRelationship] = useState("");
  const [newCategory, setNewCategory] = useState<SpecialDateCategory>("family");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRelationship, setEditRelationship] = useState("");

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const person = createPerson(
      newName.trim(),
      newRelationship.trim() || "Friend",
      newCategory
    );
    onAdd(person);
    setNewName("");
    setNewRelationship("");
    setNewCategory("family");
    setShowAddForm(false);
  };

  const handleUpdatePerson = (person: Person) => {
    onUpdate({
      ...person,
      name: editName,
      relationship: editRelationship,
      updatedAt: new Date().toISOString(),
    });
    setEditingId(null);
  };

  return (
    <div className="special-dates-manager">
      <div className="special-dates-manager-header">
        <h4>People ({people.length})</h4>
        <button className="special-dates-btn-icon" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="special-dates-manager-list">
        {people.map((person) => (
          <div key={person.id} className="special-dates-manager-item">
            {editingId === person.id ? (
              <div className="special-dates-manager-edit">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={editRelationship}
                  onChange={(e) => setEditRelationship(e.target.value)}
                  placeholder="Relationship"
                />
                <button
                  className="special-dates-btn-small"
                  onClick={() => handleUpdatePerson(person)}
                >
                  Save
                </button>
                <button
                  className="special-dates-btn-small"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className="special-dates-manager-info">
                  <span className="special-dates-manager-name">{person.name}</span>
                  <span className="special-dates-manager-relationship">
                    {person.relationship}
                  </span>
                  <span className="special-dates-manager-count">
                    {datesByPerson[person.id]?.length || 0} dates
                  </span>
                </div>
                <div className="special-dates-manager-actions">
                  <button
                    className="special-dates-btn-small"
                    onClick={() => {
                      setEditingId(person.id);
                      setEditName(person.name);
                      setEditRelationship(person.relationship);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="special-dates-btn-small special-dates-btn-small--danger"
                    onClick={() => {
                      if (
                        (datesByPerson[person.id]?.length || 0) > 0 &&
                        !window.confirm(
                          `Delete ${person.name}? This will also delete their ${datesByPerson[person.id]?.length} special date(s).`
                        )
                      ) {
                        return;
                      }
                      onDelete(person.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {showAddForm ? (
        <form className="special-dates-manager-add" onSubmit={handleAddPerson}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            required
            autoFocus
          />
          <input
            type="text"
            value={newRelationship}
            onChange={(e) => setNewRelationship(e.target.value)}
            placeholder="Relationship (e.g., Mom)"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as SpecialDateCategory)}
          >
            <option value="family">Family</option>
            <option value="friend">Friend</option>
            <option value="colleague">Colleague</option>
            <option value="other">Other</option>
          </select>
          <button type="submit" className="special-dates-btn-small">
            Add
          </button>
          <button
            type="button"
            className="special-dates-btn-small"
            onClick={() => setShowAddForm(false)}
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          className="special-dates-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add Person
        </button>
      )}
    </div>
  );
}
