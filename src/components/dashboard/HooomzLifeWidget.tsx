// Hooomz Life Widget - Smart home control placeholder for Maintenance loop
import React from "react";

export function HooomzLifeWidget() {
  const quickActions = [
    { icon: "💡", label: "Lights", action: "lights" },
    { icon: "🌡️", label: "Thermostat", action: "thermostat" },
    { icon: "🔒", label: "Locks", action: "locks" },
    { icon: "📹", label: "Cameras", action: "cameras" },
  ];

  const handleAction = (action: string) => {
    // Open Hooomz Life app or web interface
    alert(`Hooomz Life: ${action} - Integration coming soon!`);
  };

  const handleOpenApp = () => {
    // Try to open Hooomz Life app or fallback to web
    window.open("https://hooomz.com/life", "_blank");
  };

  return (
    <div className="hooomz-widget hooomz-life-widget">
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
          Open Hooomz Life
        </button>
      </div>
    </div>
  );
}

export default HooomzLifeWidget;
