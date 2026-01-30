// TraitStatementPair - Displays two statements (one per pole) with 1-5 rating buttons

import { useReducer } from "react";
import { TraitKey } from "../../types";
import { TraitAssessmentInput } from "../../engines/traitScoring";
import { TraitStatement } from "../../data/traitStatements";

type TraitStatementPairProps = {
  statement: TraitStatement;
  value?: TraitAssessmentInput;
  onChange: (traitId: TraitKey, input: TraitAssessmentInput) => void;
};

const RATINGS = [1, 2, 3, 4, 5] as const;

type State = { left: number; right: number };
type Action = { type: "SET_LEFT"; value: number } | { type: "SET_RIGHT"; value: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LEFT":
      return { ...state, left: action.value };
    case "SET_RIGHT":
      return { ...state, right: action.value };
    default:
      return state;
  }
}

export function TraitStatementPair({
  statement,
  value,
  onChange,
}: TraitStatementPairProps) {
  const [state, dispatch] = useReducer(reducer, {
    left: value?.leftPoleResponse ?? 0,
    right: value?.rightPoleResponse ?? 0,
  });

  const handleLeft = (rating: number) => {
    dispatch({ type: "SET_LEFT", value: rating });
    onChange(statement.traitId, {
      leftPoleResponse: rating as 0 | 1 | 2 | 3 | 4 | 5,
      rightPoleResponse: state.right as 0 | 1 | 2 | 3 | 4 | 5,
    });
  };

  const handleRight = (rating: number) => {
    dispatch({ type: "SET_RIGHT", value: rating });
    onChange(statement.traitId, {
      leftPoleResponse: state.left as 0 | 1 | 2 | 3 | 4 | 5,
      rightPoleResponse: rating as 0 | 1 | 2 | 3 | 4 | 5,
    });
  };

  return (
    <div className="trait-statement-pair">
      <div className="trait-statement">
        <p className="trait-statement__text">{statement.leftStatement}</p>
        <div className="trait-statement__ratings">
          {RATINGS.map((r) => (
            <div
              key={r}
              className={`trait-rating-btn${state.left === r ? " trait-rating-btn--selected" : ""}`}
              onClick={() => handleLeft(r)}
            >
              {r}
            </div>
          ))}
        </div>
        <div className="trait-statement__scale-labels">
          <span>Strongly Disagree</span>
          <span>Strongly Agree</span>
        </div>
      </div>

      <div className="trait-statement-pair__divider" />

      <div className="trait-statement">
        <p className="trait-statement__text">{statement.rightStatement}</p>
        <div className="trait-statement__ratings">
          {RATINGS.map((r) => (
            <div
              key={r}
              className={`trait-rating-btn${state.right === r ? " trait-rating-btn--selected" : ""}`}
              onClick={() => handleRight(r)}
            >
              {r}
            </div>
          ))}
        </div>
        <div className="trait-statement__scale-labels">
          <span>Strongly Disagree</span>
          <span>Strongly Agree</span>
        </div>
      </div>
    </div>
  );
}

export default TraitStatementPair;
