// Household Info Editor - For parents to manage info visible to babysitters
import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  HouseholdInfo,
  EmergencyContact,
  KidInfo,
  DailyRoutine,
  createEmergencyContact,
  createKidInfo,
  createDailyRoutine,
} from "../../types";

interface HouseholdInfoEditorProps {
  householdInfo: HouseholdInfo;
  onUpdate: (info: HouseholdInfo) => void;
}

export function HouseholdInfoEditor({ householdInfo, onUpdate }: HouseholdInfoEditorProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<"contacts" | "kids" | "routines" | "house">("contacts");

  const handleUpdate = (updates: Partial<HouseholdInfo>) => {
    onUpdate({
      ...householdInfo,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  const infoSummary = {
    contacts: householdInfo.emergencyContacts.length,
    kids: householdInfo.kids.length,
    routines: householdInfo.routines.length,
    rules: householdInfo.houseRules.length,
  };

  return (
    <div className="household-info-editor">
      <div className="household-info-summary">
        <h4>Household Info for Babysitters</h4>
        <div className="household-info-stats">
          <span>{infoSummary.contacts} contact{infoSummary.contacts !== 1 ? "s" : ""}</span>
          <span>{infoSummary.kids} kid{infoSummary.kids !== 1 ? "s" : ""}</span>
          <span>{infoSummary.routines} routine{infoSummary.routines !== 1 ? "s" : ""}</span>
          <span>{infoSummary.rules} rule{infoSummary.rules !== 1 ? "s" : ""}</span>
        </div>
        <button
          className="babysitter-btn babysitter-btn--primary"
          onClick={() => setShowEditor(true)}
        >
          Edit Household Info
        </button>
      </div>

      {showEditor && createPortal(
        <div className="household-editor-modal-overlay" onClick={() => setShowEditor(false)}>
          <div className="household-editor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="household-editor-header">
              <h3>Edit Household Info</h3>
              <button className="household-editor-close" onClick={() => setShowEditor(false)}>×</button>
            </div>

            <div className="household-editor-tabs">
              <button
                className={`household-editor-tab ${activeTab === "contacts" ? "active" : ""}`}
                onClick={() => setActiveTab("contacts")}
              >
                Contacts
              </button>
              <button
                className={`household-editor-tab ${activeTab === "kids" ? "active" : ""}`}
                onClick={() => setActiveTab("kids")}
              >
                Kids
              </button>
              <button
                className={`household-editor-tab ${activeTab === "routines" ? "active" : ""}`}
                onClick={() => setActiveTab("routines")}
              >
                Routines
              </button>
              <button
                className={`household-editor-tab ${activeTab === "house" ? "active" : ""}`}
                onClick={() => setActiveTab("house")}
              >
                House
              </button>
            </div>

            <div className="household-editor-content">
              {activeTab === "contacts" && (
                <ContactsEditor
                  contacts={householdInfo.emergencyContacts}
                  onUpdate={(contacts) => handleUpdate({ emergencyContacts: contacts })}
                />
              )}
              {activeTab === "kids" && (
                <KidsEditor
                  kids={householdInfo.kids}
                  onUpdate={(kids) => handleUpdate({ kids })}
                />
              )}
              {activeTab === "routines" && (
                <RoutinesEditor
                  routines={householdInfo.routines}
                  onUpdate={(routines) => handleUpdate({ routines })}
                />
              )}
              {activeTab === "house" && (
                <HouseEditor
                  householdInfo={householdInfo}
                  onUpdate={handleUpdate}
                />
              )}
            </div>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}
    </div>
  );
}

// Emergency Contacts Editor
function ContactsEditor({
  contacts,
  onUpdate,
}: {
  contacts: EmergencyContact[];
  onUpdate: (contacts: EmergencyContact[]) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", relationship: "", phone: "", isPrimary: false });

  const handleAdd = () => {
    if (!formData.name || !formData.phone) return;
    const newContact = createEmergencyContact(
      formData.name,
      formData.relationship,
      formData.phone,
      formData.isPrimary
    );
    // If setting as primary, unset others
    const updatedContacts = formData.isPrimary
      ? contacts.map((c) => ({ ...c, isPrimary: false }))
      : contacts;
    onUpdate([...updatedContacts, newContact]);
    setFormData({ name: "", relationship: "", phone: "", isPrimary: false });
    setShowAddForm(false);
  };

  const handleUpdate = (contact: EmergencyContact) => {
    // If setting as primary, unset others
    const updatedContacts = contact.isPrimary
      ? contacts.map((c) => ({ ...c, isPrimary: c.id === contact.id }))
      : contacts.map((c) => (c.id === contact.id ? contact : c));
    onUpdate(updatedContacts);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    onUpdate(contacts.filter((c) => c.id !== id));
  };

  return (
    <div className="household-editor-section">
      <div className="household-editor-section-header">
        <h4>Emergency Contacts</h4>
        {!showAddForm && (
          <button className="babysitter-btn-small" onClick={() => setShowAddForm(true)}>
            + Add Contact
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="household-add-form">
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Relationship (Mom, Dad, Neighbor...)"
            value={formData.relationship}
            onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <label className="household-checkbox">
            <input
              type="checkbox"
              checked={formData.isPrimary}
              onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
            />
            Primary contact
          </label>
          <div className="household-form-actions">
            <button className="babysitter-btn-small" onClick={handleAdd}>Add</button>
            <button className="babysitter-btn-small" onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="household-list">
        {contacts.length === 0 ? (
          <p className="household-empty">No emergency contacts added yet.</p>
        ) : (
          contacts.map((contact) =>
            editingId === contact.id ? (
              <ContactEditRow
                key={contact.id}
                contact={contact}
                onSave={handleUpdate}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={contact.id} className="household-list-item">
                <div className="household-list-item-main">
                  <span className="household-list-name">
                    {contact.name}
                    {contact.isPrimary && <span className="household-badge">Primary</span>}
                  </span>
                  <span className="household-list-detail">{contact.relationship}</span>
                  <span className="household-list-detail">{contact.phone}</span>
                </div>
                <div className="household-list-actions">
                  <button className="babysitter-btn-small" onClick={() => setEditingId(contact.id)}>Edit</button>
                  <button className="babysitter-btn-small babysitter-btn-small--danger" onClick={() => handleDelete(contact.id)}>×</button>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}

function ContactEditRow({
  contact,
  onSave,
  onCancel,
}: {
  contact: EmergencyContact;
  onSave: (contact: EmergencyContact) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(contact);

  return (
    <div className="household-edit-row">
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        type="text"
        placeholder="Relationship"
        value={formData.relationship}
        onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
      />
      <input
        type="tel"
        placeholder="Phone"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
      />
      <label className="household-checkbox">
        <input
          type="checkbox"
          checked={formData.isPrimary}
          onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
        />
        Primary
      </label>
      <button className="babysitter-btn-small" onClick={() => onSave(formData)}>Save</button>
      <button className="babysitter-btn-small" onClick={onCancel}>Cancel</button>
    </div>
  );
}

// Kids Editor
function KidsEditor({
  kids,
  onUpdate,
}: {
  kids: KidInfo[];
  onUpdate: (kids: KidInfo[]) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    bedtime: "",
    allergies: "",
    notes: "",
  });

  const handleAdd = () => {
    if (!formData.name) return;
    const newKid = createKidInfo(formData.name, {
      age: formData.age ? parseInt(formData.age) : undefined,
      bedtime: formData.bedtime || undefined,
      allergies: formData.allergies ? formData.allergies.split(",").map((a) => a.trim()).filter(Boolean) : undefined,
      notes: formData.notes || undefined,
    });
    onUpdate([...kids, newKid]);
    setFormData({ name: "", age: "", bedtime: "", allergies: "", notes: "" });
    setShowAddForm(false);
  };

  const handleUpdate = (kid: KidInfo) => {
    onUpdate(kids.map((k) => (k.id === kid.id ? kid : k)));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    onUpdate(kids.filter((k) => k.id !== id));
  };

  return (
    <div className="household-editor-section">
      <div className="household-editor-section-header">
        <h4>Kids Info</h4>
        {!showAddForm && (
          <button className="babysitter-btn-small" onClick={() => setShowAddForm(true)}>
            + Add Kid
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="household-add-form">
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="Age"
            min="0"
            max="18"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          />
          <input
            type="text"
            placeholder="Bedtime (e.g., 8:00 PM)"
            value={formData.bedtime}
            onChange={(e) => setFormData({ ...formData, bedtime: e.target.value })}
          />
          <input
            type="text"
            placeholder="Allergies (comma-separated)"
            value={formData.allergies}
            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
          />
          <textarea
            placeholder="Notes (medical, preferences, etc.)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <div className="household-form-actions">
            <button className="babysitter-btn-small" onClick={handleAdd}>Add</button>
            <button className="babysitter-btn-small" onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="household-list">
        {kids.length === 0 ? (
          <p className="household-empty">No kids added yet.</p>
        ) : (
          kids.map((kid) =>
            editingId === kid.id ? (
              <KidEditRow
                key={kid.id}
                kid={kid}
                onSave={handleUpdate}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={kid.id} className="household-list-item household-list-item--vertical">
                <div className="household-list-item-header">
                  <span className="household-list-name">{kid.name}</span>
                  {kid.age !== undefined && <span className="household-list-age">Age {kid.age}</span>}
                  <div className="household-list-actions">
                    <button className="babysitter-btn-small" onClick={() => setEditingId(kid.id)}>Edit</button>
                    <button className="babysitter-btn-small babysitter-btn-small--danger" onClick={() => handleDelete(kid.id)}>×</button>
                  </div>
                </div>
                <div className="household-list-item-details">
                  {kid.bedtime && <span>Bedtime: {kid.bedtime}</span>}
                  {kid.allergies && kid.allergies.length > 0 && (
                    <span className="household-allergies">Allergies: {kid.allergies.join(", ")}</span>
                  )}
                  {kid.notes && <span className="household-notes">{kid.notes}</span>}
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}

function KidEditRow({
  kid,
  onSave,
  onCancel,
}: {
  kid: KidInfo;
  onSave: (kid: KidInfo) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    ...kid,
    age: kid.age?.toString() || "",
    allergies: kid.allergies?.join(", ") || "",
  });

  const handleSave = () => {
    onSave({
      ...kid,
      name: formData.name,
      age: formData.age ? parseInt(formData.age) : undefined,
      bedtime: formData.bedtime || undefined,
      allergies: formData.allergies ? formData.allergies.split(",").map((a) => a.trim()).filter(Boolean) : undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="household-edit-row household-edit-row--vertical">
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        type="number"
        placeholder="Age"
        min="0"
        max="18"
        value={formData.age}
        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
      />
      <input
        type="text"
        placeholder="Bedtime"
        value={formData.bedtime || ""}
        onChange={(e) => setFormData({ ...formData, bedtime: e.target.value })}
      />
      <input
        type="text"
        placeholder="Allergies (comma-separated)"
        value={formData.allergies}
        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
      />
      <textarea
        placeholder="Notes"
        value={formData.notes || ""}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      />
      <div className="household-form-actions">
        <button className="babysitter-btn-small" onClick={handleSave}>Save</button>
        <button className="babysitter-btn-small" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// Routines Editor
function RoutinesEditor({
  routines,
  onUpdate,
}: {
  routines: DailyRoutine[];
  onUpdate: (routines: DailyRoutine[]) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ time: "", activity: "", notes: "" });

  const handleAdd = () => {
    if (!formData.time || !formData.activity) return;
    const newRoutine = createDailyRoutine(formData.time, formData.activity, formData.notes || undefined);
    onUpdate([...routines, newRoutine]);
    setFormData({ time: "", activity: "", notes: "" });
    setShowAddForm(false);
  };

  const handleUpdate = (routine: DailyRoutine) => {
    onUpdate(routines.map((r) => (r.id === routine.id ? routine : r)));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    onUpdate(routines.filter((r) => r.id !== id));
  };

  return (
    <div className="household-editor-section">
      <div className="household-editor-section-header">
        <h4>Daily Routines</h4>
        {!showAddForm && (
          <button className="babysitter-btn-small" onClick={() => setShowAddForm(true)}>
            + Add Routine
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="household-add-form">
          <input
            type="text"
            placeholder="Time (e.g., 6:00 PM, After dinner)"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          />
          <input
            type="text"
            placeholder="Activity (e.g., Dinner time, Bath time)"
            value={formData.activity}
            onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
          />
          <input
            type="text"
            placeholder="Notes (optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          <div className="household-form-actions">
            <button className="babysitter-btn-small" onClick={handleAdd}>Add</button>
            <button className="babysitter-btn-small" onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="household-list">
        {routines.length === 0 ? (
          <p className="household-empty">No routines added yet. Add daily routines to help babysitters know the schedule.</p>
        ) : (
          routines.map((routine) =>
            editingId === routine.id ? (
              <RoutineEditRow
                key={routine.id}
                routine={routine}
                onSave={handleUpdate}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={routine.id} className="household-list-item">
                <div className="household-list-item-main">
                  <span className="household-list-time">{routine.time}</span>
                  <span className="household-list-activity">{routine.activity}</span>
                  {routine.notes && <span className="household-list-notes">{routine.notes}</span>}
                </div>
                <div className="household-list-actions">
                  <button className="babysitter-btn-small" onClick={() => setEditingId(routine.id)}>Edit</button>
                  <button className="babysitter-btn-small babysitter-btn-small--danger" onClick={() => handleDelete(routine.id)}>×</button>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}

function RoutineEditRow({
  routine,
  onSave,
  onCancel,
}: {
  routine: DailyRoutine;
  onSave: (routine: DailyRoutine) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(routine);

  return (
    <div className="household-edit-row">
      <input
        type="text"
        placeholder="Time"
        value={formData.time}
        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
      />
      <input
        type="text"
        placeholder="Activity"
        value={formData.activity}
        onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
      />
      <input
        type="text"
        placeholder="Notes"
        value={formData.notes || ""}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      />
      <button className="babysitter-btn-small" onClick={() => onSave(formData)}>Save</button>
      <button className="babysitter-btn-small" onClick={onCancel}>Cancel</button>
    </div>
  );
}

// House Info Editor (WiFi, rules, notes)
function HouseEditor({
  householdInfo,
  onUpdate,
}: {
  householdInfo: HouseholdInfo;
  onUpdate: (updates: Partial<HouseholdInfo>) => void;
}) {
  const [wifiName, setWifiName] = useState(householdInfo.wifiName || "");
  const [wifiPassword, setWifiPassword] = useState(householdInfo.wifiPassword || "");
  const [notes, setNotes] = useState(householdInfo.notes || "");
  const [newRule, setNewRule] = useState("");
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [editingRuleText, setEditingRuleText] = useState("");

  const handleSaveWifi = () => {
    onUpdate({
      wifiName: wifiName || undefined,
      wifiPassword: wifiPassword || undefined,
    });
  };

  const handleSaveNotes = () => {
    onUpdate({ notes: notes || undefined });
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    onUpdate({ houseRules: [...householdInfo.houseRules, newRule.trim()] });
    setNewRule("");
  };

  const handleUpdateRule = (index: number) => {
    if (!editingRuleText.trim()) return;
    const updatedRules = [...householdInfo.houseRules];
    updatedRules[index] = editingRuleText.trim();
    onUpdate({ houseRules: updatedRules });
    setEditingRuleIndex(null);
    setEditingRuleText("");
  };

  const handleDeleteRule = (index: number) => {
    const updatedRules = householdInfo.houseRules.filter((_, i) => i !== index);
    onUpdate({ houseRules: updatedRules });
  };

  return (
    <div className="household-editor-section">
      {/* WiFi Section */}
      <div className="household-subsection">
        <h4>WiFi Info</h4>
        <div className="household-wifi-form">
          <div className="household-form-group">
            <label>Network Name</label>
            <input
              type="text"
              placeholder="WiFi network name"
              value={wifiName}
              onChange={(e) => setWifiName(e.target.value)}
            />
          </div>
          <div className="household-form-group">
            <label>Password</label>
            <input
              type="text"
              placeholder="WiFi password"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
            />
          </div>
          <button className="babysitter-btn-small" onClick={handleSaveWifi}>
            Save WiFi Info
          </button>
        </div>
      </div>

      {/* House Rules Section */}
      <div className="household-subsection">
        <h4>House Rules</h4>
        <div className="household-list">
          {householdInfo.houseRules.length === 0 ? (
            <p className="household-empty">No house rules added yet.</p>
          ) : (
            householdInfo.houseRules.map((rule, index) =>
              editingRuleIndex === index ? (
                <div key={index} className="household-edit-row">
                  <input
                    type="text"
                    value={editingRuleText}
                    onChange={(e) => setEditingRuleText(e.target.value)}
                  />
                  <button className="babysitter-btn-small" onClick={() => handleUpdateRule(index)}>Save</button>
                  <button className="babysitter-btn-small" onClick={() => setEditingRuleIndex(null)}>Cancel</button>
                </div>
              ) : (
                <div key={index} className="household-list-item">
                  <span className="household-rule-text">{rule}</span>
                  <div className="household-list-actions">
                    <button
                      className="babysitter-btn-small"
                      onClick={() => {
                        setEditingRuleIndex(index);
                        setEditingRuleText(rule);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="babysitter-btn-small babysitter-btn-small--danger"
                      onClick={() => handleDeleteRule(index)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </div>
        <div className="household-add-inline">
          <input
            type="text"
            placeholder="Add a house rule..."
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddRule()}
          />
          <button className="babysitter-btn-small" onClick={handleAddRule}>Add</button>
        </div>
      </div>

      {/* General Notes Section */}
      <div className="household-subsection">
        <h4>General Notes</h4>
        <textarea
          className="household-notes-textarea"
          placeholder="Any other important information for babysitters..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button className="babysitter-btn-small" onClick={handleSaveNotes}>
          Save Notes
        </button>
      </div>
    </div>
  );
}
