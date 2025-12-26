// Tradeoff scenario component - binary choice between two loop priorities

import React from "react";
import { TradeoffScenario as TradeoffScenarioType } from "../../types";
import { LOOP_COLORS } from "../../types/core";

type TradeoffScenarioProps = {
  scenario: TradeoffScenarioType;
  selectedOption: "A" | "B" | null;
  onSelect: (scenarioId: string, option: "A" | "B") => void;
};

export function TradeoffScenario({
  scenario,
  selectedOption,
  onSelect,
}: TradeoffScenarioProps) {
  const handleSelect = (option: "A" | "B") => {
    onSelect(scenario.id, option);
  };

  return (
    <div className="tradeoff-scenario">
      <h3 className="tradeoff-scenario__title">{scenario.title}</h3>
      <p className="tradeoff-scenario__description">{scenario.description}</p>

      <div className="tradeoff-scenario__options">
        <button
          type="button"
          className={`tradeoff-option ${selectedOption === "A" ? "tradeoff-option--selected" : ""}`}
          onClick={() => handleSelect("A")}
          style={{
            borderColor:
              selectedOption === "A"
                ? LOOP_COLORS[scenario.optionA.loopFocus].border
                : undefined,
          }}
        >
          <div
            className="tradeoff-option__loop-badge"
            style={{ backgroundColor: LOOP_COLORS[scenario.optionA.loopFocus].border }}
          >
            {scenario.optionA.loopFocus}
          </div>
          <h4 className="tradeoff-option__label">{scenario.optionA.label}</h4>
          <p className="tradeoff-option__description">
            {scenario.optionA.description}
          </p>
          {selectedOption === "A" && (
            <span className="tradeoff-option__check">&#10003;</span>
          )}
        </button>

        <div className="tradeoff-scenario__vs">OR</div>

        <button
          type="button"
          className={`tradeoff-option ${selectedOption === "B" ? "tradeoff-option--selected" : ""}`}
          onClick={() => handleSelect("B")}
          style={{
            borderColor:
              selectedOption === "B"
                ? LOOP_COLORS[scenario.optionB.loopFocus].border
                : undefined,
          }}
        >
          <div
            className="tradeoff-option__loop-badge"
            style={{ backgroundColor: LOOP_COLORS[scenario.optionB.loopFocus].border }}
          >
            {scenario.optionB.loopFocus}
          </div>
          <h4 className="tradeoff-option__label">{scenario.optionB.label}</h4>
          <p className="tradeoff-option__description">
            {scenario.optionB.description}
          </p>
          {selectedOption === "B" && (
            <span className="tradeoff-option__check">&#10003;</span>
          )}
        </button>
      </div>
    </div>
  );
}

export default TradeoffScenario;
