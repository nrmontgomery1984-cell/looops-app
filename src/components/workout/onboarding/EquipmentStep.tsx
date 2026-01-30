// Gym Profile Onboarding - Equipment Step
import React, { useState } from "react";
import { GymEquipment, EquipmentCategory } from "../../../types/workout";

interface EquipmentStepProps {
  equipment: GymEquipment[];
  onChange: (equipment: GymEquipment[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  bodyweight: "Bodyweight",
  basic: "Basic Equipment",
  kettlebell: "Kettlebells",
  barbell: "Barbells & Dumbbells",
  machines: "Machines",
  cardio: "Cardio Equipment",
  specialty: "Specialty",
};

const CATEGORY_ORDER: EquipmentCategory[] = [
  "bodyweight",
  "basic",
  "kettlebell",
  "barbell",
  "machines",
  "cardio",
  "specialty",
];

export function EquipmentStep({ equipment, onChange, onNext, onBack }: EquipmentStepProps) {
  const [customName, setCustomName] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<EquipmentCategory>>(
    new Set(["bodyweight", "basic", "kettlebell"])
  );

  const toggleEquipment = (id: string) => {
    onChange(
      equipment.map((eq) =>
        eq.id === id ? { ...eq, owned: !eq.owned } : eq
      )
    );
  };

  const toggleCategory = (category: EquipmentCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const selectAllInCategory = (category: EquipmentCategory, select: boolean) => {
    onChange(
      equipment.map((eq) =>
        eq.category === category ? { ...eq, owned: select } : eq
      )
    );
  };

  const addCustomEquipment = () => {
    if (customName.trim()) {
      const newEquipment: GymEquipment = {
        id: `custom_${Date.now()}`,
        name: customName.trim(),
        category: "specialty",
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
  }, {} as Record<EquipmentCategory, GymEquipment[]>);

  const ownedCount = equipment.filter((eq) => eq.owned).length;

  return (
    <div className="gym-onboarding__step gym-onboarding__equipment">
      <h2 className="gym-onboarding__title">
        What equipment do you have access to?
      </h2>
      <p className="gym-onboarding__subtitle">
        {ownedCount} item{ownedCount !== 1 ? "s" : ""} selected
      </p>

      <div className="gym-onboarding__equipment-list">
        {CATEGORY_ORDER.map((category) => {
          const items = groupedEquipment[category];
          if (items.length === 0) return null;

          const isExpanded = expandedCategories.has(category);
          const ownedInCategory = items.filter((eq) => eq.owned).length;
          const isCustomCategory = items.some((eq) => eq.id.startsWith("custom_"));

          return (
            <div key={category} className="gym-onboarding__equipment-category">
              <button
                className="gym-onboarding__category-header"
                onClick={() => toggleCategory(category)}
              >
                <span className="gym-onboarding__category-title">
                  {CATEGORY_LABELS[category]}
                  <span className="gym-onboarding__category-count">
                    ({ownedInCategory}/{items.length})
                  </span>
                </span>
                <span className="gym-onboarding__category-toggle">
                  {isExpanded ? "−" : "+"}
                </span>
              </button>

              {isExpanded && (
                <>
                  <div className="gym-onboarding__category-actions">
                    <button
                      className="gym-onboarding__select-all"
                      onClick={() => selectAllInCategory(category, true)}
                    >
                      Select all
                    </button>
                    <button
                      className="gym-onboarding__select-all"
                      onClick={() => selectAllInCategory(category, false)}
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="gym-onboarding__equipment-grid">
                    {items.map((eq) => (
                      <button
                        key={eq.id}
                        type="button"
                        className={`gym-onboarding__equipment-item ${eq.owned ? "gym-onboarding__equipment-item--owned" : ""}`}
                        onClick={() => toggleEquipment(eq.id)}
                      >
                        <span className="gym-onboarding__equipment-check">
                          {eq.owned ? "✓" : ""}
                        </span>
                        <span className="gym-onboarding__equipment-name">
                          {eq.name}
                        </span>
                        {eq.id.startsWith("custom_") && (
                          <span
                            className="gym-onboarding__equipment-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCustomEquipment(eq.id);
                            }}
                            title="Remove"
                          >
                            ×
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Custom equipment input */}
        <div className="gym-onboarding__add-custom">
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
            className="gym-onboarding__add-btn"
            onClick={addCustomEquipment}
            disabled={!customName.trim()}
          >
            + Add
          </button>
        </div>
      </div>

      <div className="gym-onboarding__actions">
        <button
          className="gym-onboarding__btn gym-onboarding__btn--secondary"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="gym-onboarding__btn gym-onboarding__btn--primary"
          onClick={onNext}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
