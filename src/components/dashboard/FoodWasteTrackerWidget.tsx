// Food Waste Tracker Widget - Full tracker with automatic cost estimation
import { useMealPrep, useApp } from "../../context";
import { WasteEntry } from "../../types/mealPrep";
import { FoodWasteTracker } from "../mealprep/FoodWasteTracker";

export function FoodWasteTrackerWidget() {
  const { dispatch } = useApp();
  const mealPrep = useMealPrep();

  return (
    <FoodWasteTracker
      wasteLog={mealPrep.wasteLog}
      onAddEntry={(entry: WasteEntry) => dispatch({ type: "ADD_WASTE_ENTRY", payload: entry })}
      onUpdateEntry={(entry: WasteEntry) => dispatch({ type: "UPDATE_WASTE_ENTRY", payload: entry })}
      onDeleteEntry={(id: string) => dispatch({ type: "DELETE_WASTE_ENTRY", payload: id })}
    />
  );
}

export default FoodWasteTrackerWidget;
