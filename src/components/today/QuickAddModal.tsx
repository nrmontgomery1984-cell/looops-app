// Quick Add Modal - Fast task creation from Today/Calendar view

import React, { useState } from "react";
import { LoopId, ALL_LOOPS, LOOP_DEFINITIONS, LOOP_COLORS } from "../../types";

type QuickAddModalProps = {
  date: string;
  onSubmit: (title: string, loopId: LoopId) => void;
  onClose: () => void;
  defaultLoop?: LoopId; // Optional: pre-select a loop (contextual from gesture)
};

export function QuickAddModal({ date, onSubmit, onClose, defaultLoop }: QuickAddModalProps) {
  const [title, setTitle] = useState("");
  const [selectedLoop, setSelectedLoop] = useState<LoopId>(defaultLoop || "Work");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit(title, selectedLoop);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="quick-add-modal" onClick={(e) => e.stopPropagation()}>
        <div className="quick-add-header">
          <h3>Add Task</h3>
          <span className="quick-add-date">{formattedDate}</span>
          <button className="quick-add-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="quick-add-field">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="quick-add-input"
            />
          </div>

          <div className="quick-add-field">
            <label>Loop</label>
            <div className="quick-add-loops">
              {ALL_LOOPS.map((loopId) => {
                const loop = LOOP_DEFINITIONS[loopId];
                const colors = LOOP_COLORS[loopId];
                const isSelected = selectedLoop === loopId;

                return (
                  <button
                    key={loopId}
                    type="button"
                    className={`quick-add-loop-btn ${isSelected ? "selected" : ""}`}
                    style={{
                      backgroundColor: isSelected ? colors.bg : "transparent",
                      borderColor: colors.border,
                      color: isSelected ? colors.text : "var(--color-text-secondary)",
                    }}
                    onClick={() => setSelectedLoop(loopId)}
                  >
                    {loop.icon}
                  </button>
                );
              })}
            </div>
            <span className="quick-add-loop-name">
              {LOOP_DEFINITIONS[selectedLoop].name}
            </span>
          </div>

          <div className="quick-add-actions">
            <button type="button" className="quick-add-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="quick-add-submit"
              disabled={!title.trim()}
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickAddModal;
