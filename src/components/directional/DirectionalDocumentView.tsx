// Read-only view of the completed directional document

import React from "react";
import { DirectionalDocument, LoopId, ALL_LOOPS } from "../../types";
import { LOOP_COLORS } from "../../types/core";
import {
  IDENTITY_STATEMENTS,
  VALUE_DIMENSIONS,
  LOOP_THRIVING_OPTIONS,
  LOOP_NONNEGOTIABLES,
  LOOP_MINIMUM_STANDARDS,
  SEASON_OPTIONS,
  ENERGY_MANAGEMENT_OPTIONS,
  FINANCIAL_APPROACH_OPTIONS,
  TRADEOFF_SCENARIOS,
} from "../../data/directionalOptions";

type DirectionalDocumentViewProps = {
  document: DirectionalDocument;
  onEdit?: () => void;
  onExportPdf?: () => void;
};

export function DirectionalDocumentView({
  document,
  onEdit,
  onExportPdf,
}: DirectionalDocumentViewProps) {
  const { core, loops } = document;

  // Helper to get option labels from IDs
  const getIdentityLabels = (ids: string[]) =>
    ids
      .map((id) => IDENTITY_STATEMENTS.find((s) => s.id === id)?.label)
      .filter(Boolean);

  const getLoopOptionLabels = (
    loopId: LoopId,
    ids: string[],
    optionsMap: Record<LoopId, { id: string; label: string }[]>
  ) =>
    ids
      .map((id) => optionsMap[loopId]?.find((o) => o.id === id)?.label)
      .filter(Boolean);

  const getSeasonLabel = (seasonId: string) =>
    SEASON_OPTIONS.find((s) => s.id === seasonId)?.label || seasonId;

  const getSeasonIcon = (seasonId: string) =>
    SEASON_OPTIONS.find((s) => s.id === seasonId)?.icon || "";

  // Get tradeoff scenario details
  const getTradeoffDetails = (scenarioId: string) =>
    TRADEOFF_SCENARIOS.find((s) => s.id === scenarioId);

  return (
    <div className="directional-document">
      <div className="directional-document__header">
        <h2 className="directional-document__title">My Directions</h2>
        <div className="directional-document__status-row">
          <span className={`directional-document__status directional-document__status--${document.status}`}>
            {document.status === "complete" ? "Complete" : document.status === "draft" ? "In Progress" : "Needs Update"}
          </span>
          <span className="directional-document__progress">
            {document.completionProgress}% complete
          </span>
        </div>
        <div className="directional-document__meta">
          Last updated:{" "}
          {new Date(document.updatedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
        <div className="directional-document__actions">
          {onEdit && (
            <button
              type="button"
              className="directional-document__action"
              onClick={onEdit}
            >
              Edit Directions
            </button>
          )}
          {onExportPdf && (
            <button
              type="button"
              className="directional-document__action directional-document__action--secondary"
              onClick={onExportPdf}
            >
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Core Directions */}
      <section className="directional-document__section">
        <h3 className="directional-document__section-title">Core Directions</h3>

        {/* Identity */}
        <div className="directional-document__subsection">
          <h4 className="directional-document__subsection-title">
            Who I Want To Be
          </h4>
          <div className="directional-document__identity-list">
            {getIdentityLabels(core.identityStatements).map((label, i) => (
              <span key={i} className="directional-document__identity-chip">
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="directional-document__subsection">
          <h4 className="directional-document__subsection-title">My Values</h4>
          <div className="directional-document__values-grid">
            {VALUE_DIMENSIONS.map((dim) => {
              const value = core.valueSliders[dim.id];
              const position = ((value - 1) / 9) * 100;

              return (
                <div key={dim.id} className="directional-document__value-row">
                  <span className="directional-document__value-pole">
                    {dim.leftPole}
                  </span>
                  <div className="directional-document__value-bar">
                    <div
                      className="directional-document__value-marker"
                      style={{ left: `${position}%` }}
                    />
                  </div>
                  <span className="directional-document__value-pole">
                    {dim.rightPole}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priorities */}
        <div className="directional-document__subsection">
          <h4 className="directional-document__subsection-title">
            Loop Priorities
          </h4>
          <ol className="directional-document__priority-list">
            {core.tradeoffPriorities.loopPriorityRanking.map((loopId, i) => (
              <li
                key={loopId}
                className="directional-document__priority-item"
                style={{ borderLeftColor: LOOP_COLORS[loopId].border }}
              >
                <span className="directional-document__priority-rank">
                  {i + 1}
                </span>
                <span
                  className="directional-document__priority-loop"
                  style={{ color: LOOP_COLORS[loopId].border }}
                >
                  {loopId}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Resource Philosophy */}
        <div className="directional-document__subsection">
          <h4 className="directional-document__subsection-title">
            Resource Philosophy
          </h4>
          <div className="directional-document__resource-info">
            <div className="directional-document__resource-item">
              <strong>Energy Style:</strong>{" "}
              {ENERGY_MANAGEMENT_OPTIONS.find(
                (o) => o.id === core.resourcePhilosophy.energyManagement
              )?.label || core.resourcePhilosophy.energyManagement}
            </div>
            <div className="directional-document__resource-item">
              <strong>Financial Approach:</strong>{" "}
              {FINANCIAL_APPROACH_OPTIONS.find(
                (o) => o.id === core.resourcePhilosophy.financialApproach
              )?.label || core.resourcePhilosophy.financialApproach}
            </div>
          </div>
        </div>

        {/* Time Allocation */}
        <div className="directional-document__subsection">
          <h4 className="directional-document__subsection-title">
            Ideal Time Allocation
          </h4>
          <div className="directional-document__time-allocation">
            {ALL_LOOPS.map((loopId) => {
              const allocation = core.resourcePhilosophy.timeAllocation[loopId] || 0;
              return (
                <div key={loopId} className="directional-document__allocation-row">
                  <span
                    className="directional-document__allocation-loop"
                    style={{ color: LOOP_COLORS[loopId].border }}
                  >
                    {loopId}
                  </span>
                  <div className="directional-document__allocation-bar-container">
                    <div
                      className="directional-document__allocation-bar"
                      style={{
                        width: `${allocation}%`,
                        backgroundColor: LOOP_COLORS[loopId].border,
                      }}
                    />
                  </div>
                  <span className="directional-document__allocation-value">
                    {allocation}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tradeoff Decisions */}
        {core.tradeoffPriorities.conflictResolutions.length > 0 && (
          <div className="directional-document__subsection">
            <h4 className="directional-document__subsection-title">
              Tradeoff Decisions
            </h4>
            <div className="directional-document__tradeoffs">
              {core.tradeoffPriorities.conflictResolutions.map((resolution) => {
                const scenario = getTradeoffDetails(resolution.scenarioId);
                if (!scenario) return null;
                const chosenOption = resolution.chosenOption === "A" ? scenario.optionA : scenario.optionB;
                return (
                  <div key={resolution.scenarioId} className="directional-document__tradeoff-item">
                    <span className="directional-document__tradeoff-scenario">
                      {scenario.title}
                    </span>
                    <span
                      className="directional-document__tradeoff-choice"
                      style={{ color: LOOP_COLORS[chosenOption.loopFocus].border }}
                    >
                      {chosenOption.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Loop Directions */}
      <section className="directional-document__section">
        <h3 className="directional-document__section-title">Loop Directions</h3>

        {ALL_LOOPS.map((loopId) => {
          const loopDir = loops[loopId];
          if (!loopDir) return null;

          return (
            <div
              key={loopId}
              className="directional-document__loop-card"
              style={{ borderLeftColor: LOOP_COLORS[loopId].border }}
            >
              <div className="directional-document__loop-header">
                <span
                  className="directional-document__loop-name"
                  style={{ color: LOOP_COLORS[loopId].border }}
                >
                  {loopId}
                </span>
                <span className="directional-document__loop-season">
                  <span className="directional-document__season-icon">{getSeasonIcon(loopDir.currentSeason)}</span>
                  {getSeasonLabel(loopDir.currentSeason)}
                </span>
              </div>

              <div className="directional-document__loop-content">
                {/* Thriving Vision */}
                {loopDir.thrivingDescription.length > 0 && (
                  <div className="directional-document__loop-section">
                    <strong>Thriving looks like:</strong>
                    <ul>
                      {getLoopOptionLabels(
                        loopId,
                        loopDir.thrivingDescription,
                        LOOP_THRIVING_OPTIONS
                      ).map((label, i) => (
                        <li key={i}>{label}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Non-negotiables */}
                {loopDir.nonNegotiables.length > 0 && (
                  <div className="directional-document__loop-section">
                    <strong>Non-negotiables:</strong>
                    <ul>
                      {getLoopOptionLabels(
                        loopId,
                        loopDir.nonNegotiables,
                        LOOP_NONNEGOTIABLES
                      ).map((label, i) => (
                        <li key={i}>{label}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Minimum Standards */}
                {loopDir.minimumStandards.length > 0 && (
                  <div className="directional-document__loop-section">
                    <strong>Minimum standards:</strong>
                    <ul>
                      {getLoopOptionLabels(
                        loopId,
                        loopDir.minimumStandards,
                        LOOP_MINIMUM_STANDARDS
                      ).map((label, i) => (
                        <li key={i}>{label}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Assessment */}
                <div className="directional-document__loop-assessment">
                  <div className="directional-document__assessment-bar">
                    <span className="directional-document__assessment-label">
                      Satisfaction
                    </span>
                    <div className="directional-document__assessment-track">
                      <div
                        className="directional-document__assessment-fill"
                        style={{
                          width: `${loopDir.currentSatisfaction}%`,
                          backgroundColor: LOOP_COLORS[loopId].border,
                        }}
                      />
                    </div>
                    <span className="directional-document__assessment-value">
                      {loopDir.currentSatisfaction}%
                    </span>
                  </div>
                  <div className="directional-document__assessment-bar">
                    <span className="directional-document__assessment-label">
                      Current
                    </span>
                    <div className="directional-document__assessment-track">
                      <div
                        className="directional-document__assessment-fill directional-document__assessment-fill--current"
                        style={{
                          width: `${loopDir.currentAllocation}%`,
                          backgroundColor: `${LOOP_COLORS[loopId].border}80`,
                        }}
                      />
                    </div>
                    <span className="directional-document__assessment-value">
                      {loopDir.currentAllocation}%
                    </span>
                  </div>
                  <div className="directional-document__assessment-bar">
                    <span className="directional-document__assessment-label">
                      Desired
                    </span>
                    <div className="directional-document__assessment-track">
                      <div
                        className="directional-document__assessment-fill"
                        style={{
                          width: `${loopDir.desiredAllocation}%`,
                          backgroundColor: LOOP_COLORS[loopId].border,
                        }}
                      />
                    </div>
                    <span className="directional-document__assessment-value">
                      {loopDir.desiredAllocation}%
                    </span>
                  </div>
                </div>

                {/* Dependencies */}
                {(loopDir.feedsLoops.length > 0 ||
                  loopDir.drawsFromLoops.length > 0) && (
                  <div className="directional-document__loop-dependencies">
                    {loopDir.feedsLoops.length > 0 && (
                      <span>
                        Feeds: {loopDir.feedsLoops.join(", ")}
                      </span>
                    )}
                    {loopDir.drawsFromLoops.length > 0 && (
                      <span>
                        Draws from: {loopDir.drawsFromLoops.join(", ")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Generated Summary */}
      {document.generatedDocument && (
        <section className="directional-document__section">
          <h3 className="directional-document__section-title">
            AI-Generated Summary
          </h3>
          <div className="directional-document__generated">
            <p className="directional-document__summary">
              {document.generatedDocument.summary}
            </p>

            {document.generatedDocument.keyThemes.length > 0 && (
              <div className="directional-document__themes">
                <strong>Key Themes:</strong>
                <ul>
                  {document.generatedDocument.keyThemes.map((theme, i) => (
                    <li key={i}>{theme}</li>
                  ))}
                </ul>
              </div>
            )}

            {document.generatedDocument.recommendations.length > 0 && (
              <div className="directional-document__recommendations">
                <strong>Recommendations:</strong>
                <ul>
                  {document.generatedDocument.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default DirectionalDocumentView;
