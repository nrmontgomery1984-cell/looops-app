// DecisionRegister - List view of all logged decisions with filtering

import React, { useState, useMemo } from "react";
import { useDecisionsList } from "../../context";
import { DecisionCard } from "./DecisionCard";
import {
  Decision,
  DecisionStatus,
  DecisionChoice,
  LoopId,
  ALL_LOOPS,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
} from "../../types";

type SortOption = "date" | "confidence" | "loop";
type SortDirection = "asc" | "desc";

interface DecisionRegisterProps {
  onViewDecision: (decision: Decision) => void;
  onStartNew: () => void;
}

export function DecisionRegister({
  onViewDecision,
  onStartNew,
}: DecisionRegisterProps) {
  const decisions = useDecisionsList();

  // Filter state
  const [filterLoop, setFilterLoop] = useState<LoopId | "all">("all");
  const [filterStatus, setFilterStatus] = useState<DecisionStatus | "all">("all");
  const [filterChoice, setFilterChoice] = useState<DecisionChoice | "all">("all");
  const [showNeedsReview, setShowNeedsReview] = useState(false);

  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  // Check if a decision needs review
  const needsReview = (d: Decision) =>
    d.status === "decided" &&
    !d.outcome &&
    new Date().getTime() - new Date(d.createdAt).getTime() >
      30 * 24 * 60 * 60 * 1000;

  // Filtered and sorted decisions
  const filteredDecisions = useMemo(() => {
    let result = [...decisions];

    // Apply filters
    if (filterLoop !== "all") {
      result = result.filter((d) => d.loop === filterLoop);
    }
    if (filterStatus !== "all") {
      result = result.filter((d) => d.status === filterStatus);
    }
    if (filterChoice !== "all") {
      result = result.filter((d) => d.finalChoice === filterChoice);
    }
    if (showNeedsReview) {
      result = result.filter(needsReview);
    }

    // Apply sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "date":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "confidence":
          cmp = a.confidenceLevel - b.confidenceLevel;
          break;
        case "loop":
          cmp = a.loop.localeCompare(b.loop);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [decisions, filterLoop, filterStatus, filterChoice, showNeedsReview, sortBy, sortDir]);

  // Count decisions needing review
  const needsReviewCount = decisions.filter(needsReview).length;

  // Stats
  const stats = useMemo(() => {
    return {
      total: decisions.length,
      pending: decisions.filter((d) => d.status === "pending").length,
      decided: decisions.filter((d) => d.status === "decided").length,
      reviewed: decisions.filter((d) => d.status === "reviewed").length,
      proceeded: decisions.filter((d) => d.finalChoice === "proceed").length,
      declined: decisions.filter((d) => d.finalChoice === "decline").length,
      deferred: decisions.filter((d) => d.finalChoice === "defer").length,
    };
  }, [decisions]);

  if (decisions.length === 0) {
    return (
      <div className="decision-register-empty">
        <div className="empty-icon">🤔</div>
        <h3>No decisions yet</h3>
        <p>
          Start making better decisions with structured thinking. Your decision
          register will help you learn from past choices.
        </p>
        <button className="survey-btn survey-btn--primary" onClick={onStartNew}>
          Make Your First Decision
        </button>
      </div>
    );
  }

  return (
    <div className="decision-register">
      {/* Stats Bar */}
      <div className="decision-register-stats">
        <div className="stat-item">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item stat-item--proceed">
          <span className="stat-value">{stats.proceeded}</span>
          <span className="stat-label">Proceeded</span>
        </div>
        <div className="stat-item stat-item--decline">
          <span className="stat-value">{stats.declined}</span>
          <span className="stat-label">Declined</span>
        </div>
        <div className="stat-item stat-item--defer">
          <span className="stat-value">{stats.deferred}</span>
          <span className="stat-label">Deferred</span>
        </div>
        {needsReviewCount > 0 && (
          <div className="stat-item stat-item--review">
            <span className="stat-value">{needsReviewCount}</span>
            <span className="stat-label">Need Review</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="decision-register-filters">
        <div className="filter-row">
          {/* Loop Filter */}
          <div className="filter-group">
            <label>Loop</label>
            <select
              value={filterLoop}
              onChange={(e) => setFilterLoop(e.target.value as LoopId | "all")}
              className="filter-select"
            >
              <option value="all">All Loops</option>
              {ALL_LOOPS.map((loop) => (
                <option key={loop} value={loop}>
                  {LOOP_DEFINITIONS[loop].icon} {loop}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as DecisionStatus | "all")
              }
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="decided">Decided</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </div>

          {/* Choice Filter */}
          <div className="filter-group">
            <label>Choice</label>
            <select
              value={filterChoice}
              onChange={(e) =>
                setFilterChoice(e.target.value as DecisionChoice | "all")
              }
              className="filter-select"
            >
              <option value="all">All Choices</option>
              <option value="proceed">Proceeded</option>
              <option value="decline">Declined</option>
              <option value="defer">Deferred</option>
            </select>
          </div>

          {/* Sort */}
          <div className="filter-group">
            <label>Sort by</label>
            <select
              value={`${sortBy}-${sortDir}`}
              onChange={(e) => {
                const [by, dir] = e.target.value.split("-");
                setSortBy(by as SortOption);
                setSortDir(dir as SortDirection);
              }}
              className="filter-select"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="confidence-desc">Highest Confidence</option>
              <option value="confidence-asc">Lowest Confidence</option>
              <option value="loop-asc">Loop A-Z</option>
            </select>
          </div>
        </div>

        {/* Needs Review Toggle */}
        {needsReviewCount > 0 && (
          <div className="filter-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showNeedsReview}
                onChange={(e) => setShowNeedsReview(e.target.checked)}
              />
              <span className="toggle-text">
                Show only decisions needing review ({needsReviewCount})
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="decision-register-count">
        Showing {filteredDecisions.length} of {decisions.length} decisions
      </div>

      {/* Decision Cards */}
      <div className="decision-register-grid">
        {filteredDecisions.map((decision) => (
          <DecisionCard
            key={decision.id}
            decision={decision}
            onClick={() => onViewDecision(decision)}
          />
        ))}
      </div>

      {filteredDecisions.length === 0 && decisions.length > 0 && (
        <div className="decision-register-no-results">
          <p>No decisions match your filters.</p>
          <button
            className="survey-btn survey-btn--ghost"
            onClick={() => {
              setFilterLoop("all");
              setFilterStatus("all");
              setFilterChoice("all");
              setShowNeedsReview(false);
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
