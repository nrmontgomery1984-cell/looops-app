// Kitchen Profile Onboarding - Equipment Step
import React, { useState } from "react";
import { KitchenEquipment, EquipmentCategory } from "../../../types/mealPrep";

interface EquipmentStepProps {
  equipment: KitchenEquipment[];
  onChange: (equipment: KitchenEquipment[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  essential: "Essential",
  common: "Common",
  specialized: "Specialized",
  custom: "Custom",
};

const CATEGORY_ORDER: EquipmentCategory[] = ["essential", "common", "specialized", "custom"];

export function EquipmentStep({ equipment, onChange, onNext, onBack }: EquipmentStepProps) {
  const [customName, setCustomName] = useState("");

  const toggleEquipment = (id: string) => {
    onChange(
      equipment.map((eq) =>
        eq.id === id ? { ...eq, owned: !eq.owned } : eq
      )
    );
  };

  const addCustomEquipment = () => {
    if (customName.trim()) {
      const newEquipment: KitchenEquipment = {
        id: `custom_${Date.now()}`,
        name: customName.trim(),
        category: "custom",
        owned: true,
      };
      onChange([...equipment, newEquipment]);
      setCustomName("");
    }
  };

  const removeCustomEquipment = (id: string) => {
    onChange(equipment.filter((eq) => eq.id !== id));
  };

  const groupedEquipment = CATEGORY_ORDER.reduce((acc, category) => {
    acc[category] = equipment.filter((eq) => eq.category === category);
    return acc;
  }, {} as Record<EquipmentCategory, KitchenEquipment[]>);

  const ownedCount = equipment.filter((eq) => eq.owned).length;

  return (
    <div className="kitchen-onboarding__step kitchen-onboarding__equipment">
      <h2 className="kitchen-onboarding__title">
        What equipment do you have access to?
      </h2>
      <p className="kitchen-onboarding__subtitle">
        {ownedCount} item{ownedCount !== 1 ? "s" : ""} selected
      </p>

      <div className="kitchen-onboarding__equipment-list">
        {CATEGORY_ORDER.map((category) => {
          const items = groupedEquipment[category];
          if (items.length === 0 && category !== "custom") return null;

          return (
            <div key={category} className="kitchen-onboarding__equipment-category">
              <h3 className="kitchen-onboarding__category-title">
                {CATEGORY_LABELS[category]}
              </h3>
              <div className="kitchen-onboarding__equipment-grid">
                {items.map((eq) => (
                  <label
                    key={eq.id}
                    className={`kitchen-onboarding__equipment-item ${eq.owned ? "kitchen-onboarding__equipment-item--owned" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={eq.owned}
                      onChange={() => toggleEquipment(eq.id)}
                    />
                    <span className="kitchen-onboarding__equipment-check">
                      {eq.owned ? "✓" : ""}
                    </span>
                    <span className="kitchen-onboarding__equipment-name">
                      {eq.name}
                    </span>
                    {eq.category === "custom" && (
                      <button
                        className="kitchen-onboarding__equipment-remove"
                        onClick={(e) => {
                          e.preventDefault();
                          removeCustomEquipment(eq.id);
                        }}
                        title="Remove"
                      >
                        ×
                      </button>
                    )}
                  </label>
                ))}
              </div>

              {category === "custom" && (
                <div className="kitchen-onboarding__add-custom">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Add custom equipment..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomEquipment();
                      }
                    }}
                  />
                  <button
                    className="kitchen-onboarding__add-btn"
                    onClick={addCustomEquipment}
                    disabled={!customName.trim()}
                  >
                    + Add
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="kitchen-onboarding__actions">
        <button
          className="kitchen-onboarding__btn kitchen-onboarding__btn--secondary"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="kitchen-onboarding__btn kitchen-onboarding__btn--primary"
          onClick={onNext}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
