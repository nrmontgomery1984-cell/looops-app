// Shopping List - Generated from meal plan
import { useState, useMemo } from "react";
import {
  Recipe,
  MealPlan,
  ShoppingListItem,
  IngredientCategory,
} from "../../types/mealPrep";

interface ShoppingListProps {
  recipes: Recipe[];
  mealPlans: MealPlan[];
  onUpdateList: (plan: MealPlan) => void;
  onBack: () => void;
}

const CATEGORY_ORDER: IngredientCategory[] = [
  "vegetable",
  "fruit",
  "protein",
  "dairy",
  "grain",
  "spice",
  "condiment",
  "oil_fat",
  "liquid",
  "other",
];

const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  vegetable: "Vegetables",
  fruit: "Fruits",
  protein: "Meat & Protein",
  dairy: "Dairy & Eggs",
  grain: "Grains & Bread",
  spice: "Spices & Seasonings",
  condiment: "Condiments & Sauces",
  oil_fat: "Oils & Fats",
  liquid: "Liquids & Broths",
  other: "Other",
};

const CATEGORY_ICONS: Record<IngredientCategory, string> = {
  vegetable: "🥬",
  fruit: "🍎",
  protein: "🥩",
  dairy: "🧀",
  grain: "🌾",
  spice: "🧂",
  condiment: "🥫",
  oil_fat: "🫒",
  liquid: "🥛",
  other: "📦",
};

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function ShoppingList({
  recipes,
  mealPlans,
  onUpdateList,
  onBack,
}: ShoppingListProps) {
  const [showAcquired, setShowAcquired] = useState(false);
  const [customItems, setCustomItems] = useState<ShoppingListItem[]>([]);
  const [newItemText, setNewItemText] = useState("");

  // Get current week's plan
  const currentWeekOf = getWeekStart(new Date()).toISOString().split("T")[0];
  const currentPlan = mealPlans.find((p) => p.weekOf === currentWeekOf);

  // Generate shopping list from planned meals
  const generatedList = useMemo(() => {
    if (!currentPlan) return [];

    const itemMap = new Map<string, ShoppingListItem>();

    currentPlan.days.forEach((day) => {
      Object.values(day.meals).forEach((meal) => {
        if (!meal) return;

        // Handle array of snacks
        const mealsToProcess = Array.isArray(meal) ? meal : [meal];

        mealsToProcess.forEach((m) => {
          if (!m.recipeId) return;

          const recipe = recipes.find((r) => r.id === m.recipeId);
          if (!recipe) return;

          const servingsMultiplier = m.servings / recipe.servings;

          recipe.ingredients.forEach((ing) => {
            const key = `${ing.name.toLowerCase()}_${ing.unit || ""}`;
            const existing = itemMap.get(key);

            if (existing) {
              existing.totalQuantity += (ing.quantity || 0) * servingsMultiplier;
              if (!existing.recipes.includes(recipe.title)) {
                existing.recipes.push(recipe.title);
              }
            } else {
              itemMap.set(key, {
                id: `item_${key}`,
                ingredient: ing.name,
                totalQuantity: (ing.quantity || 0) * servingsMultiplier,
                unit: ing.unit || "",
                recipes: [recipe.title],
                category: ing.category || "other",
                acquired: false,
              });
            }
          });
        });
      });
    });

    return Array.from(itemMap.values());
  }, [currentPlan, recipes]);

  // Combine generated list with saved list (for acquired status) and custom items
  const shoppingList = useMemo(() => {
    const savedItems = currentPlan?.shoppingList || [];

    // Merge generated with saved (to preserve acquired status)
    const mergedGenerated = generatedList.map((item) => {
      const saved = savedItems.find((s) => s.id === item.id);
      return saved ? { ...item, acquired: saved.acquired } : item;
    });

    return [...mergedGenerated, ...customItems];
  }, [generatedList, currentPlan?.shoppingList, customItems]);

  // Group by category
  const groupedItems = useMemo(() => {
    const groups: Partial<Record<IngredientCategory, ShoppingListItem[]>> = {};

    shoppingList
      .filter((item) => showAcquired || !item.acquired)
      .forEach((item) => {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category]!.push(item);
      });

    return groups;
  }, [shoppingList, showAcquired]);

  const toggleAcquired = (itemId: string) => {
    if (!currentPlan) return;

    const updatedList = shoppingList.map((item) =>
      item.id === itemId ? { ...item, acquired: !item.acquired } : item
    );

    // Also update custom items if needed
    const isCustom = customItems.some((i) => i.id === itemId);
    if (isCustom) {
      setCustomItems(
        customItems.map((item) =>
          item.id === itemId ? { ...item, acquired: !item.acquired } : item
        )
      );
    }

    const updatedPlan: MealPlan = {
      ...currentPlan,
      shoppingList: updatedList.filter((i) => !customItems.some((c) => c.id === i.id)),
      updatedAt: new Date().toISOString(),
    };

    onUpdateList(updatedPlan);
  };

  const handleAddCustomItem = () => {
    if (!newItemText.trim()) return;

    const newItem: ShoppingListItem = {
      id: `custom_${Date.now()}`,
      ingredient: newItemText.trim(),
      totalQuantity: 1,
      unit: "",
      recipes: ["Manual"],
      category: "other",
      acquired: false,
    };

    setCustomItems([...customItems, newItem]);
    setNewItemText("");
  };

  const handleRemoveCustomItem = (itemId: string) => {
    setCustomItems(customItems.filter((i) => i.id !== itemId));
  };

  const clearAcquired = () => {
    if (!currentPlan) return;

    const updatedList = shoppingList.map((item) => ({ ...item, acquired: false }));
    setCustomItems(customItems.map((item) => ({ ...item, acquired: false })));

    const updatedPlan: MealPlan = {
      ...currentPlan,
      shoppingList: updatedList.filter((i) => !customItems.some((c) => c.id === i.id)),
      updatedAt: new Date().toISOString(),
    };

    onUpdateList(updatedPlan);
  };

  // Stats
  const totalItems = shoppingList.length;
  const acquiredItems = shoppingList.filter((i) => i.acquired).length;
  const remainingItems = totalItems - acquiredItems;

  const formatQuantity = (qty: number, unit: string) => {
    if (!qty) return "";
    const rounded = Math.round(qty * 10) / 10;
    return unit ? `${rounded} ${unit}` : `${rounded}`;
  };

  if (!currentPlan || generatedList.length === 0) {
    return (
      <div className="shopping-list">
        <div className="shopping-list__header">
          <button className="shopping-list__back" onClick={onBack}>
            ← Back
          </button>
          <div className="shopping-list__title-section">
            <h1>Shopping List</h1>
          </div>
        </div>

        <div className="shopping-list__empty">
          <span className="shopping-list__empty-icon">🛒</span>
          <h3>No Items Yet</h3>
          <p>
            Plan some meals for this week to automatically generate your shopping list.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="shopping-list">
      {/* Header */}
      <div className="shopping-list__header">
        <button className="shopping-list__back" onClick={onBack}>
          ← Back
        </button>
        <div className="shopping-list__title-section">
          <h1>Shopping List</h1>
          <p className="shopping-list__subtitle">
            {remainingItems} of {totalItems} items remaining
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="shopping-list__progress">
        <div
          className="shopping-list__progress-bar"
          style={{ width: `${totalItems > 0 ? (acquiredItems / totalItems) * 100 : 0}%` }}
        />
      </div>

      {/* Controls */}
      <div className="shopping-list__controls">
        <label className="shopping-list__toggle">
          <input
            type="checkbox"
            checked={showAcquired}
            onChange={(e) => setShowAcquired(e.target.checked)}
          />
          <span>Show acquired items</span>
        </label>
        {acquiredItems > 0 && (
          <button className="shopping-list__clear-btn" onClick={clearAcquired}>
            Clear acquired
          </button>
        )}
      </div>

      {/* Add Custom Item */}
      <div className="shopping-list__add-item">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add custom item..."
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddCustomItem();
          }}
        />
        <button
          onClick={handleAddCustomItem}
          disabled={!newItemText.trim()}
        >
          Add
        </button>
      </div>

      {/* Shopping List by Category */}
      <div className="shopping-list__content">
        {CATEGORY_ORDER.map((category) => {
          const items = groupedItems[category];
          if (!items || items.length === 0) return null;

          return (
            <div key={category} className="shopping-list__category">
              <h3 className="shopping-list__category-title">
                {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category]}
                <span className="shopping-list__category-count">({items.length})</span>
              </h3>
              <ul className="shopping-list__items">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={`shopping-list__item ${item.acquired ? "shopping-list__item--acquired" : ""}`}
                  >
                    <label className="shopping-list__item-checkbox">
                      <input
                        type="checkbox"
                        checked={item.acquired}
                        onChange={() => toggleAcquired(item.id)}
                      />
                      <span className="shopping-list__item-check">✓</span>
                    </label>
                    <div className="shopping-list__item-content">
                      <span className="shopping-list__item-name">
                        {item.ingredient}
                      </span>
                      {item.totalQuantity > 0 && (
                        <span className="shopping-list__item-qty">
                          {formatQuantity(item.totalQuantity, item.unit)}
                        </span>
                      )}
                      {item.recipes.length > 0 && item.recipes[0] !== "Manual" && (
                        <span className="shopping-list__item-recipes">
                          for {item.recipes.join(", ")}
                        </span>
                      )}
                    </div>
                    {customItems.some((c) => c.id === item.id) && (
                      <button
                        className="shopping-list__item-remove"
                        onClick={() => handleRemoveCustomItem(item.id)}
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
