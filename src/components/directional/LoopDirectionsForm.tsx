// Loop-specific directions form for intake

import React from "react";
import { LoopId, LoopDirections, LoopSeason, LoopOption, ALL_LOOPS } from "../../types";
import { LOOP_COLORS } from "../../types/core";
import {
  LOOP_THRIVING_OPTIONS,
  LOOP_NONNEGOTIABLES,
  LOOP_MINIMUM_STANDARDS,
  SEASON_OPTIONS,
} from "../../data/directionalOptions";

type LoopDirectionsFormProps = {
  loopId: LoopId;
  directions: LoopDirections;
  step: "thriving" | "nonnegotiables" | "standards" | "assessment" | "dependencies" | "season";
  onChange: (directions: Partial<LoopDirections>) => void;
};

function OptionSelector({
  options,
  selectedIds,
  onChange,
  maxSelections = 5,
}: {
  options: LoopOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxSelections?: number;
}) {
  const handleToggle = (optionId: string) => {
    const isSelected = selectedIds.includes(optionId);
    if (isSelected) {
      onChange(selectedIds.filter((id) => id !== optionId));
    } else if (selectedIds.length < maxSelections) {
      onChange([...selectedIds, optionId]);
    }
  };

  return (
    <div className="loop-option-selector">
      <div className="loop-option-selector__counter">
        {selectedIds.length} of {maxSelections} selected
      </div>
      <div className="loop-option-selector__options">
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          const isDisabled = !isSelected && selectedIds.length >= maxSelections;

          return (
            <button
              key={option.id}
              type="button"
              className={`loop-option ${isSelected ? "loop-option--selected" : ""} ${isDisabled ? "loop-option--disabled" : ""}`}
              onClick={() => handleToggle(option.id)}
              disabled={isDisabled}
            >
              <span className="loop-option__label">{option.label}</span>
              {option.description && (
                <span className="loop-option__description">
                  {option.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LoopDirectionsForm({
  loopId,
  directions,
  step,
  onChange,
}: LoopDirectionsFormProps) {
  const loopColor = LOOP_COLORS[loopId].border;
  const thrivingOptions = LOOP_THRIVING_OPTIONS[loopId] || [];
  const nonnegotiableOptions = LOOP_NONNEGOTIABLES[loopId] || [];
  const standardOptions = LOOP_MINIMUM_STANDARDS[loopId] || [];

  const renderStep = () => {
    switch (step) {
      case "thriving":
        return (
          <div className="loop-directions-step">
            <h3 className="loop-directions-step__title">
              Vision of Thriving
            </h3>
            <p className="loop-directions-step__description">
              When your {loopId} loop is thriving, what does that look like?
              Select the statements that resonate most.
            </p>
            <OptionSelector
              options={thrivingOptions}
              selectedIds={directions.thrivingDescription}
              onChange={(ids) => onChange({ thrivingDescription: ids })}
              maxSelections={5}
            />
          </div>
        );

      case "nonnegotiables":
        return (
          <div className="loop-directions-step">
            <h3 className="loop-directions-step__title">Non-Negotiables</h3>
            <p className="loop-directions-step__description">
              What are the absolute minimums for your {loopId} loop? These are
              things you must protect even in difficult times.
            </p>
            <OptionSelector
              options={nonnegotiableOptions}
              selectedIds={directions.nonNegotiables}
              onChange={(ids) => onChange({ nonNegotiables: ids })}
              maxSelections={4}
            />
          </div>
        );

      case "standards":
        return (
          <div className="loop-directions-step">
            <h3 className="loop-directions-step__title">Minimum Standards</h3>
            <p className="loop-directions-step__description">
              When you're not at your best, what's your acceptable baseline for{" "}
              {loopId}?
            </p>
            <OptionSelector
              options={standardOptions}
              selectedIds={directions.minimumStandards}
              onChange={(ids) => onChange({ minimumStandards: ids })}
              maxSelections={4}
            />
          </div>
        );

      case "assessment":
        return (
          <div className="loop-directions-step">
            <h3 className="loop-directions-step__title">Current Assessment</h3>
            <p className="loop-directions-step__description">
              How are things currently going in your {loopId} loop?
            </p>

            <div className="loop-assessment">
              <div className="loop-assessment__slider">
                <label className="loop-assessment__label">
                  Current Allocation
                  <span className="loop-assessment__value">
                    {directions.currentAllocation}%
                  </span>
                </label>
                <p className="loop-assessment__hint">
                  How much of your time/energy does {loopId} currently get?
                </p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={directions.currentAllocation}
                  onChange={(e) =>
                    onChange({ currentAllocation: parseInt(e.target.value, 10) })
                  }
                  className="loop-assessment__input"
                  style={{ accentColor: loopColor }}
                />
              </div>

              <div className="loop-assessment__slider">
                <label className="loop-assessment__label">
                  Desired Allocation
                  <span className="loop-assessment__value">
                    {directions.desiredAllocation}%
                  </span>
                </label>
                <p className="loop-assessment__hint">
                  How much should {loopId} ideally get?
                </p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={directions.desiredAllocation}
                  onChange={(e) =>
                    onChange({ desiredAllocation: parseInt(e.target.value, 10) })
                  }
                  className="loop-assessment__input"
                  style={{ accentColor: loopColor }}
                />
              </div>

              <div className="loop-assessment__slider">
                <label className="loop-assessment__label">
                  Current Satisfaction
                  <span className="loop-assessment__value">
                    {directions.currentSatisfaction}%
                  </span>
                </label>
                <p className="loop-assessment__hint">
                  How satisfied are you with your {loopId} loop right now?
                </p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={directions.currentSatisfaction}
                  onChange={(e) =>
                    onChange({
                      currentSatisfaction: parseInt(e.target.value, 10),
                    })
                  }
                  className="loop-assessment__input"
                  style={{ accentColor: loopColor }}
                />
              </div>
            </div>
          </div>
        );

      case "dependencies":
        return (
          <div className="loop-directions-step">
            <h3 className="loop-directions-step__title">Loop Dependencies</h3>
            <p className="loop-directions-step__description">
              How does {loopId} relate to your other loops?
            </p>

            <div className="loop-dependencies">
              <div className="loop-dependencies__section">
                <h4 className="loop-dependencies__heading">
                  {loopId} feeds into...
                </h4>
                <p className="loop-dependencies__hint">
                  Which loops benefit when {loopId} is strong?
                </p>
                <div className="loop-dependencies__chips">
                  {ALL_LOOPS.filter((id) => id !== loopId).map((id) => (
                    <button
                      key={id}
                      type="button"
                      className={`loop-dependency-chip ${directions.feedsLoops.includes(id) ? "loop-dependency-chip--selected" : ""}`}
                      onClick={() => {
                        const feeds = directions.feedsLoops.includes(id)
                          ? directions.feedsLoops.filter((l) => l !== id)
                          : [...directions.feedsLoops, id];
                        onChange({ feedsLoops: feeds });
                      }}
                      style={{
                        borderColor: directions.feedsLoops.includes(id)
                          ? LOOP_COLORS[id].border
                          : undefined,
                        backgroundColor: directions.feedsLoops.includes(id)
                          ? LOOP_COLORS[id].bg
                          : undefined,
                      }}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="loop-dependencies__section">
                <h4 className="loop-dependencies__heading">
                  {loopId} draws from...
                </h4>
                <p className="loop-dependencies__hint">
                  Which loops does {loopId} depend on?
                </p>
                <div className="loop-dependencies__chips">
                  {ALL_LOOPS.filter((id) => id !== loopId).map((id) => (
                    <button
                      key={id}
                      type="button"
                      className={`loop-dependency-chip ${directions.drawsFromLoops.includes(id) ? "loop-dependency-chip--selected" : ""}`}
                      onClick={() => {
                        const draws = directions.drawsFromLoops.includes(id)
                          ? directions.drawsFromLoops.filter((l) => l !== id)
                          : [...directions.drawsFromLoops, id];
                        onChange({ drawsFromLoops: draws });
                      }}
                      style={{
                        borderColor: directions.drawsFromLoops.includes(id)
                          ? LOOP_COLORS[id].border
                          : undefined,
                        backgroundColor: directions.drawsFromLoops.includes(id)
                          ? LOOP_COLORS[id].bg
                          : undefined,
                      }}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "season":
        return (
          <div className="loop-directions-step">
            <h3 className="loop-directions-step__title">Current Season</h3>
            <p className="loop-directions-step__description">
              What season is your {loopId} loop in right now?
            </p>

            <div className="loop-season-selector">
              {SEASON_OPTIONS.map((season) => (
                <button
                  key={season.id}
                  type="button"
                  className={`loop-season-option ${directions.currentSeason === season.id ? "loop-season-option--selected" : ""}`}
                  onClick={() =>
                    onChange({ currentSeason: season.id as LoopSeason })
                  }
                  style={{
                    borderColor:
                      directions.currentSeason === season.id
                        ? loopColor
                        : undefined,
                  }}
                >
                  <span className="loop-season-option__icon">{season.icon}</span>
                  <span className="loop-season-option__label">
                    {season.label}
                  </span>
                  <span className="loop-season-option__description">
                    {season.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="loop-directions-form"
      style={{ borderTopColor: loopColor }}
    >
      <div
        className="loop-directions-form__header"
        style={{ backgroundColor: `${loopColor}15` }}
      >
        <span
          className="loop-directions-form__loop-badge"
          style={{ backgroundColor: loopColor }}
        >
          {loopId}
        </span>
      </div>
      {renderStep()}
    </div>
  );
}

export default LoopDirectionsForm;
