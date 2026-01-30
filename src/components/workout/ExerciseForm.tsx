// Exercise Form - Add/Edit exercise
import React, { useState } from "react";
import {
  Exercise,
  ExerciseDifficulty,
  MuscleGroup,
  MovementPattern,
  ExerciseCategory,
  GymProfile,
  createExercise,
  getMuscleGroupLabel,
  getMovementPatternLabel,
} from "../../types/workout";

interface ExerciseFormProps {
  exercise?: Exercise | null;
  gymProfile: GymProfile | null;
  onSave: (exercise: Exercise) => void;
  onCancel: () => void;
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  "chest", "back", "shoulders", "biceps", "triceps", "forearms",
  "core", "quads", "hamstrings", "glutes", "calves", "grip", "full_body"
];

const MOVEMENT_PATTERNS: MovementPattern[] = [
  "push", "pull", "squat", "hinge", "lunge", "carry",
  "rotation", "isometric", "plyometric", "cardio"
];

const CATEGORIES: ExerciseCategory[] = [
  "strength", "power", "hypertrophy", "endurance",
  "mobility", "stability", "conditioning", "sport_specific"
];

const DIFFICULTIES: ExerciseDifficulty[] = [
  "beginner", "intermediate", "advanced", "elite"
];

export function ExerciseForm({
  exercise,
  gymProfile,
  onSave,
  onCancel,
}: ExerciseFormProps) {
  const [name, setName] = useState(exercise?.name || "");
  const [description, setDescription] = useState(exercise?.description || "");
  const [primaryMuscles, setPrimaryMuscles] = useState<MuscleGroup[]>(
    exercise?.primaryMuscles || []
  );
  const [secondaryMuscles, setSecondaryMuscles] = useState<MuscleGroup[]>(
    exercise?.secondaryMuscles || []
  );
  const [movementPattern, setMovementPattern] = useState<MovementPattern>(
    exercise?.movementPattern || "push"
  );
  const [category, setCategory] = useState<ExerciseCategory>(
    exercise?.category || "strength"
  );
  const [difficulty, setDifficulty] = useState<ExerciseDifficulty>(
    exercise?.difficulty || "intermediate"
  );
  const [requiredEquipment, setRequiredEquipment] = useState<string[]>(
    exercise?.requiredEquipment || []
  );
  const [defaultSets, setDefaultSets] = useState(exercise?.defaultSets || 3);
  const [defaultReps, setDefaultReps] = useState(exercise?.defaultReps || "8-12");
  const [defaultRest, setDefaultRest] = useState(exercise?.defaultRest || 90);
  const [tempo, setTempo] = useState(exercise?.tempo || "");
  const [cues, setCues] = useState<string[]>(exercise?.cues || [""]);
  const [commonMistakes, setCommonMistakes] = useState<string[]>(
    exercise?.commonMistakes || []
  );
  const [variations, setVariations] = useState<string[]>(
    exercise?.variations || []
  );
  const [tags, setTags] = useState<string[]>(exercise?.tags || []);
  const [newTag, setNewTag] = useState("");
  const [newCue, setNewCue] = useState("");
  const [newMistake, setNewMistake] = useState("");
  const [newVariation, setNewVariation] = useState("");
  const [noiseLevel, setNoiseLevel] = useState<"silent" | "quiet" | "moderate" | "loud">(
    exercise?.noiseLevel || "quiet"
  );
  const [spaceRequired, setSpaceRequired] = useState<"minimal" | "moderate" | "large">(
    exercise?.spaceRequired || "minimal"
  );

  const availableEquipment = gymProfile?.equipment
    .filter((eq) => eq.owned)
    .map((eq) => eq.id) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter an exercise name");
      return;
    }

    if (primaryMuscles.length === 0) {
      alert("Please select at least one primary muscle");
      return;
    }

    const exerciseData = createExercise({
      id: exercise?.id,
      name: name.trim(),
      description: description.trim() || undefined,
      primaryMuscles,
      secondaryMuscles,
      movementPattern,
      category,
      difficulty,
      requiredEquipment,
      defaultSets,
      defaultReps,
      defaultRest,
      tempo: tempo.trim() || undefined,
      cues: cues.filter((c) => c.trim()),
      commonMistakes: commonMistakes.filter((m) => m.trim()),
      variations: variations.filter((v) => v.trim()),
      tags,
      noiseLevel,
      spaceRequired,
      isFavorite: exercise?.isFavorite || false,
      timesPerformed: exercise?.timesPerformed || 0,
      lastPerformed: exercise?.lastPerformed,
      personalRecord: exercise?.personalRecord,
      createdAt: exercise?.createdAt,
    });

    onSave(exerciseData);
  };

  const toggleMuscle = (muscle: MuscleGroup, isPrimary: boolean) => {
    if (isPrimary) {
      if (primaryMuscles.includes(muscle)) {
        setPrimaryMuscles(primaryMuscles.filter((m) => m !== muscle));
      } else {
        setPrimaryMuscles([...primaryMuscles, muscle]);
        // Remove from secondary if it was there
        setSecondaryMuscles(secondaryMuscles.filter((m) => m !== muscle));
      }
    } else {
      if (secondaryMuscles.includes(muscle)) {
        setSecondaryMuscles(secondaryMuscles.filter((m) => m !== muscle));
      } else {
        setSecondaryMuscles([...secondaryMuscles, muscle]);
        // Remove from primary if it was there
        setPrimaryMuscles(primaryMuscles.filter((m) => m !== muscle));
      }
    }
  };

  const toggleEquipment = (equipmentId: string) => {
    if (requiredEquipment.includes(equipmentId)) {
      setRequiredEquipment(requiredEquipment.filter((e) => e !== equipmentId));
    } else {
      setRequiredEquipment([...requiredEquipment, equipmentId]);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const addCue = () => {
    if (newCue.trim()) {
      setCues([...cues, newCue.trim()]);
      setNewCue("");
    }
  };

  const addMistake = () => {
    if (newMistake.trim()) {
      setCommonMistakes([...commonMistakes, newMistake.trim()]);
      setNewMistake("");
    }
  };

  const addVariation = () => {
    if (newVariation.trim()) {
      setVariations([...variations, newVariation.trim()]);
      setNewVariation("");
    }
  };

  return (
    <div className="exercise-form">
      <div className="exercise-form__header">
        <button className="exercise-form__back" onClick={onCancel}>
          ← Cancel
        </button>
        <h2>{exercise ? "Edit Exercise" : "Add Exercise"}</h2>
      </div>

      <form onSubmit={handleSubmit} className="exercise-form__content">
        {/* Basic Info */}
        <div className="exercise-form__section">
          <h3>Basic Info</h3>

          <div className="exercise-form__field">
            <label>Exercise Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Goblet Squat"
              required
            />
          </div>

          <div className="exercise-form__field">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the exercise..."
              rows={3}
            />
          </div>
        </div>

        {/* Classification */}
        <div className="exercise-form__section">
          <h3>Classification</h3>

          <div className="exercise-form__row">
            <div className="exercise-form__field">
              <label>Movement Pattern</label>
              <select
                value={movementPattern}
                onChange={(e) => setMovementPattern(e.target.value as MovementPattern)}
              >
                {MOVEMENT_PATTERNS.map((pattern) => (
                  <option key={pattern} value={pattern}>
                    {getMovementPatternLabel(pattern)}
                  </option>
                ))}
              </select>
            </div>

            <div className="exercise-form__field">
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1).replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="exercise-form__field">
              <label>Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as ExerciseDifficulty)}
              >
                {DIFFICULTIES.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Muscles */}
        <div className="exercise-form__section">
          <h3>Target Muscles *</h3>

          <div className="exercise-form__field">
            <label>Primary Muscles (click to select)</label>
            <div className="exercise-form__muscle-grid">
              {MUSCLE_GROUPS.map((muscle) => (
                <button
                  key={muscle}
                  type="button"
                  className={`exercise-form__muscle-btn ${
                    primaryMuscles.includes(muscle) ? "exercise-form__muscle-btn--primary" : ""
                  } ${secondaryMuscles.includes(muscle) ? "exercise-form__muscle-btn--secondary" : ""}`}
                  onClick={() => toggleMuscle(muscle, true)}
                >
                  {getMuscleGroupLabel(muscle)}
                </button>
              ))}
            </div>
          </div>

          <div className="exercise-form__field">
            <label>Secondary Muscles (click to select)</label>
            <div className="exercise-form__muscle-grid">
              {MUSCLE_GROUPS.filter((m) => !primaryMuscles.includes(m)).map((muscle) => (
                <button
                  key={muscle}
                  type="button"
                  className={`exercise-form__muscle-btn ${
                    secondaryMuscles.includes(muscle) ? "exercise-form__muscle-btn--secondary" : ""
                  }`}
                  onClick={() => toggleMuscle(muscle, false)}
                >
                  {getMuscleGroupLabel(muscle)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Equipment */}
        <div className="exercise-form__section">
          <h3>Equipment Required</h3>

          <div className="exercise-form__equipment-grid">
            <button
              type="button"
              className={`exercise-form__equipment-btn ${
                requiredEquipment.length === 0 ? "exercise-form__equipment-btn--selected" : ""
              }`}
              onClick={() => setRequiredEquipment([])}
            >
              Bodyweight Only
            </button>
            {gymProfile?.equipment.filter((eq) => eq.owned).map((eq) => (
              <button
                key={eq.id}
                type="button"
                className={`exercise-form__equipment-btn ${
                  requiredEquipment.includes(eq.id) ? "exercise-form__equipment-btn--selected" : ""
                }`}
                onClick={() => toggleEquipment(eq.id)}
              >
                {eq.name}
              </button>
            ))}
          </div>
        </div>

        {/* Programming */}
        <div className="exercise-form__section">
          <h3>Default Programming</h3>

          <div className="exercise-form__row">
            <div className="exercise-form__field exercise-form__field--small">
              <label>Sets</label>
              <input
                type="number"
                value={defaultSets}
                onChange={(e) => setDefaultSets(parseInt(e.target.value) || 3)}
                min={1}
                max={10}
              />
            </div>

            <div className="exercise-form__field exercise-form__field--small">
              <label>Reps</label>
              <input
                type="text"
                value={defaultReps}
                onChange={(e) => setDefaultReps(e.target.value)}
                placeholder="8-12 or 30s"
              />
            </div>

            <div className="exercise-form__field exercise-form__field--small">
              <label>Rest (sec)</label>
              <input
                type="number"
                value={defaultRest}
                onChange={(e) => setDefaultRest(parseInt(e.target.value) || 90)}
                min={0}
                step={15}
              />
            </div>

            <div className="exercise-form__field exercise-form__field--small">
              <label>Tempo</label>
              <input
                type="text"
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                placeholder="3-1-2-0"
              />
            </div>
          </div>
        </div>

        {/* Constraints */}
        <div className="exercise-form__section">
          <h3>Constraints</h3>

          <div className="exercise-form__row">
            <div className="exercise-form__field">
              <label>Noise Level</label>
              <select
                value={noiseLevel}
                onChange={(e) => setNoiseLevel(e.target.value as any)}
              >
                <option value="silent">Silent</option>
                <option value="quiet">Quiet</option>
                <option value="moderate">Moderate</option>
                <option value="loud">Loud</option>
              </select>
            </div>

            <div className="exercise-form__field">
              <label>Space Required</label>
              <select
                value={spaceRequired}
                onChange={(e) => setSpaceRequired(e.target.value as any)}
              >
                <option value="minimal">Minimal</option>
                <option value="moderate">Moderate</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>

        {/* Coaching Cues */}
        <div className="exercise-form__section">
          <h3>Coaching Cues</h3>
          <div className="exercise-form__list">
            {cues.map((cue, index) => (
              <div key={index} className="exercise-form__list-item">
                <span>{cue}</span>
                <button
                  type="button"
                  onClick={() => setCues(cues.filter((_, i) => i !== index))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="exercise-form__add-item">
            <input
              type="text"
              value={newCue}
              onChange={(e) => setNewCue(e.target.value)}
              placeholder="Add a coaching cue..."
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCue())}
            />
            <button type="button" onClick={addCue}>Add</button>
          </div>
        </div>

        {/* Common Mistakes */}
        <div className="exercise-form__section">
          <h3>Common Mistakes</h3>
          <div className="exercise-form__list">
            {commonMistakes.map((mistake, index) => (
              <div key={index} className="exercise-form__list-item">
                <span>⚠️ {mistake}</span>
                <button
                  type="button"
                  onClick={() => setCommonMistakes(commonMistakes.filter((_, i) => i !== index))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="exercise-form__add-item">
            <input
              type="text"
              value={newMistake}
              onChange={(e) => setNewMistake(e.target.value)}
              placeholder="Add a common mistake..."
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMistake())}
            />
            <button type="button" onClick={addMistake}>Add</button>
          </div>
        </div>

        {/* Variations */}
        <div className="exercise-form__section">
          <h3>Variations</h3>
          <div className="exercise-form__list">
            {variations.map((variation, index) => (
              <div key={index} className="exercise-form__list-item">
                <span>{variation}</span>
                <button
                  type="button"
                  onClick={() => setVariations(variations.filter((_, i) => i !== index))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="exercise-form__add-item">
            <input
              type="text"
              value={newVariation}
              onChange={(e) => setNewVariation(e.target.value)}
              placeholder="Add a variation..."
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVariation())}
            />
            <button type="button" onClick={addVariation}>Add</button>
          </div>
        </div>

        {/* Tags */}
        <div className="exercise-form__section">
          <h3>Tags</h3>
          <div className="exercise-form__tags">
            {tags.map((tag) => (
              <span key={tag} className="exercise-form__tag">
                {tag}
                <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="exercise-form__add-item">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag..."
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            />
            <button type="button" onClick={addTag}>Add</button>
          </div>
        </div>

        {/* Submit */}
        <div className="exercise-form__actions">
          <button type="button" className="exercise-form__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="exercise-form__submit">
            {exercise ? "Save Changes" : "Add Exercise"}
          </button>
        </div>
      </form>
    </div>
  );
}
