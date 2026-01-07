// DecisionsScreen - Main container for Decisions module
// Provides tab navigation between Decision Coach, Quick Decisions, and Register

import React, { useState } from "react";
import { DecisionCoach } from "./DecisionCoach";
import { QuickDecisionFlow } from "./QuickDecisionFlow";
import { DecisionRegister } from "./DecisionRegister";
import { DecisionDetail } from "./DecisionDetail";
import { Decision } from "../../types";

type DecisionTab = "register" | "coach" | "quick";
type ViewMode = "list" | "coach" | "quick" | "detail";

export function DecisionsScreen() {
  const [activeTab, setActiveTab] = useState<DecisionTab>("register");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);

  const handleStartCoach = () => {
    setViewMode("coach");
  };

  const handleStartQuick = () => {
    setViewMode("quick");
  };

  const handleComplete = () => {
    setViewMode("list");
    setActiveTab("register");
  };

  const handleCancel = () => {
    setViewMode("list");
  };

  const handlePromoteToFull = () => {
    setViewMode("coach");
  };

  const handleViewDecision = (decision: Decision) => {
    setSelectedDecision(decision);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setSelectedDecision(null);
    setViewMode("list");
  };

  // Decision Coach - full screen conversational flow
  if (viewMode === "coach") {
    return (
      <DecisionCoach
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    );
  }

  // Quick Decision - streamlined flow
  if (viewMode === "quick") {
    return (
      <QuickDecisionFlow
        onComplete={handleComplete}
        onCancel={handleCancel}
        onPromoteToFull={handlePromoteToFull}
      />
    );
  }

  // Detail view mode
  if (viewMode === "detail" && selectedDecision) {
    return (
      <DecisionDetail
        decision={selectedDecision}
        onBack={handleBackToList}
        onUpdated={(updated) => setSelectedDecision(updated)}
      />
    );
  }

  // List/Register mode
  return (
    <div className="decisions-screen">
      <div className="decisions-header">
        <h1>Decisions</h1>
        <p className="decisions-subtitle">
          Make better decisions with structured thinking
        </p>
      </div>

      <div className="decisions-tabs">
        <button
          className={`decisions-tab ${activeTab === "register" ? "decisions-tab--active" : ""}`}
          onClick={() => setActiveTab("register")}
        >
          Decision Register
        </button>
        <div className="decisions-tab-divider" />
        <button
          className={`decisions-tab decisions-tab--action ${activeTab === "coach" ? "decisions-tab--active" : ""}`}
          onClick={handleStartCoach}
        >
          <span className="tab-icon">🧠</span>
          Decision Coach
        </button>
        <button
          className={`decisions-tab decisions-tab--action ${activeTab === "quick" ? "decisions-tab--active" : ""}`}
          onClick={handleStartQuick}
        >
          <span className="tab-icon">⚡</span>
          Quick Decision
        </button>
      </div>

      <div className="decisions-intro">
        <div className="intro-card intro-card--coach" onClick={handleStartCoach}>
          <div className="intro-icon">🧠</div>
          <div className="intro-content">
            <h3>Decision Coach</h3>
            <p>
              Full guided experience with bias detection, pattern matching,
              and behavioral economics insights. Best for important or complex decisions.
            </p>
            <span className="intro-time">~10-15 minutes</span>
          </div>
        </div>

        <div className="intro-card intro-card--quick" onClick={handleStartQuick}>
          <div className="intro-icon">⚡</div>
          <div className="intro-content">
            <h3>Quick Decision</h3>
            <p>
              Fast 4-question capture for simpler decisions.
              Get the essentials documented without the full analysis.
            </p>
            <span className="intro-time">~2-3 minutes</span>
          </div>
        </div>
      </div>

      <div className="decisions-content">
        {activeTab === "register" && (
          <DecisionRegister
            onViewDecision={handleViewDecision}
            onStartNew={handleStartCoach}
          />
        )}
      </div>
    </div>
  );
}
