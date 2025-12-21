// Hooomz OS Widget - Project management placeholder for Work loop
import React from "react";

export function HooomzWidget() {
  const quickActions = [
    { icon: "📊", label: "Projects", action: "projects" },
    { icon: "✅", label: "Tasks", action: "tasks" },
    { icon: "📅", label: "Timeline", action: "timeline" },
    { icon: "👥", label: "Team", action: "team" },
  ];

  const handleAction = (action: string) => {
    // Open Hooomz OS app or web interface
    alert(`Hooomz OS: ${action} - Integration coming soon!`);
  };

  const handleOpenApp = () => {
    // Try to open Hooomz OS app or fallback to web
    window.open("https://hooomz.com/os", "_blank");
  };

  return (
    <div className="hooomz-widget hooomz-os-widget">
      <div className="hooomz-header">
        <div className="hooomz-status">
          <span className="hooomz-status-dot hooomz-status--online" />
          <span className="hooomz-status-text">Connected</span>
        </div>
      </div>

      <div className="hooomz-quick-actions">
        {quickActions.map((action) => (
          <button
            key={action.action}
            className="hooomz-action-btn"
            onClick={() => handleAction(action.action)}
          >
            <span className="hooomz-action-icon">{action.icon}</span>
            <span className="hooomz-action-label">{action.label}</span>
          </button>
        ))}
      </div>

      <div className="hooomz-footer">
        <button className="hooomz-open-btn" onClick={handleOpenApp}>
          Open Hooomz OS
        </button>
      </div>
    </div>
  );
}

export default HooomzWidget;
