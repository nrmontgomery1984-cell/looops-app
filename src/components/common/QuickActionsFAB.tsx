// QuickActionsFAB - Floating action button with multiple quick actions
// Combines quick task add and week day types editing

import React, { useState } from "react";
import { WeekDayTypesEditor } from "../planning/WeekDayTypesEditor";
import { LoopId, ALL_LOOPS, LOOP_DEFINITIONS, LOOP_COLORS, Task } from "../../types";
import { useApp } from "../../context";

interface QuickActionsFABProps {
  onAddTask?: (task: Task) => void;
}

export function QuickActionsFAB({ onAddTask }: QuickActionsFABProps) {
  const { dispatch } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [showDayTypes, setShowDayTypes] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Quick add state
  const [title, setTitle] = useState("");
  const [selectedLoop, setSelectedLoop] = useState<LoopId>("Work");

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const newTask: Task = {
        id: `task_${Date.now()}`,
        title: title.trim(),
        loop: selectedLoop,
        priority: 3,
        status: "todo",
        order: 0,
        dueDate: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      };

      if (onAddTask) {
        onAddTask(newTask);
      } else {
        dispatch({ type: "ADD_TASK", payload: newTask });
      }

      setTitle("");
      setShowQuickAdd(false);
      setIsOpen(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowDayTypes(false);
    setShowQuickAdd(false);
    setTitle("");
  };

  return (
    <>
      {/* Main FAB */}
      <div className={`quick-actions-fab ${isOpen ? "open" : ""}`}>
        {/* Action buttons that appear when open */}
        {isOpen && (
          <div className="quick-actions-menu">
            <button
              className="quick-action-item"
              onClick={() => {
                setShowQuickAdd(true);
                setIsOpen(false);
              }}
              title="Add Task"
            >
              <span className="quick-action-icon">+</span>
              <span className="quick-action-label">Add Task</span>
            </button>
            <button
              className="quick-action-item"
              onClick={() => {
                setShowDayTypes(true);
                setIsOpen(false);
              }}
              title="Edit Day Types"
            >
              <span className="quick-action-icon">📅</span>
              <span className="quick-action-label">Day Types</span>
            </button>
          </div>
        )}

        {/* Main button */}
        <button
          className="quick-actions-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
        >
          <span className={`quick-actions-icon ${isOpen ? "rotated" : ""}`}>
            {isOpen ? "×" : "+"}
          </span>
        </button>
      </div>

      {/* Backdrop when open */}
      {isOpen && (
        <div className="quick-actions-backdrop" onClick={handleClose} />
      )}

      {/* Day Types Modal */}
      {showDayTypes && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="week-types-modal" onClick={(e) => e.stopPropagation()}>
            <WeekDayTypesEditor onClose={handleClose} />
          </div>
        </div>
      )}

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="quick-add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quick-add-header">
              <h3>Add Task</h3>
              <span className="quick-add-date">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <button className="quick-add-close" onClick={handleClose}>
                ×
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit}>
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
                <button type="button" className="quick-add-cancel" onClick={handleClose}>
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
      )}
    </>
  );
}

export default QuickActionsFAB;
