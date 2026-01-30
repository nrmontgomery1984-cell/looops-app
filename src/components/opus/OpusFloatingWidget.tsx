// Opus Floating Widget - Expandable chat button that opens the full Opus panel
import React, { useState } from "react";
import { OpusChatPanel } from "./OpusChatPanel";
import { OpusDomainId } from "../../opus/types/opus-types";
import "./OpusFloatingWidget.css";

interface OpusFloatingWidgetProps {
  defaultDomain?: OpusDomainId;
  position?: "bottom-right" | "bottom-left";
}

export function OpusFloatingWidget({
  defaultDomain = "Life",
  position = "bottom-right",
}: OpusFloatingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`opus-floating-widget opus-floating-widget--${position}`}>
      {isOpen ? (
        <div className="opus-floating-widget__panel">
          <OpusChatPanel
            initialDomain={defaultDomain}
            onClose={() => setIsOpen(false)}
          />
        </div>
      ) : (
        <button
          className="opus-floating-widget__trigger"
          onClick={() => setIsOpen(true)}
          title="Talk to Opus"
        >
          <span className="opus-floating-widget__icon">✦</span>
          <span className="opus-floating-widget__label">Opus</span>
        </button>
      )}
    </div>
  );
}

export default OpusFloatingWidget;
