# Personality-Driven Goals & Systems Integration Plan

## Executive Summary

This plan outlines how to deeply integrate the existing personality/archetype system with goal setting and habit building, using Atomic Habits framework as the foundation. The goal is to make every suggestion, breakdown, and system feel tailored to who the user is.

---

## Current State Analysis

### What Exists

| System | Status | Personality Integration |
|--------|--------|------------------------|
| **Identity Engine** | Complete | Generates archetypes, voice profiles, trait blends |
| **Goal Engine** | Complete | Uses archetype affinity for ranking only |
| **Breakdown Engine** | Complete | No personality integration |
| **Systems/Habits** | Complete | No personality integration |
| **Atomic Habits** | Data model complete | Cue/Craving/Response/Reward defined but underutilized |

### The Gap

```
UserPrototype (rich personality data)
       ↓
    [GAP] ←── Personality doesn't flow into HOW goals break down
       ↓        or HOW habits are designed
Goals & Systems (generic for all users)
```

---

## Proposed Architecture

### Personality Flow

```
UserPrototype
├── traits (15 dimensions, 0-100)
├── archetypeBlend (primary/secondary/tertiary + scores)
├── voiceProfile (tone, motivationStyle, detailLevel, timeOrientation)
└── values (5 selected)
       ↓
   ┌───┴───────────────────────────────────────┐
   ↓                    ↓                       ↓
Goal Suggestions    Goal Breakdown          System Builder
(WHAT to pursue)    (HOW to break down)     (HOW to build habits)
   ↓                    ↓                       ↓
Archetype-ranked    Archetype-phrased       Archetype-tailored
templates           milestones              cues/rewards/obstacles
```

---

## Phase 1: Archetype-Aware Goal Breakdown

### 1.1 Breakdown Strategy by Archetype

Different archetypes approach goal decomposition differently:

| Archetype | Strategy | Milestone Style | Language |
|-----------|----------|-----------------|----------|
| **Machine** | Systematic | Process-focused, measurable | "Execute phase 1", "Establish routine" |
| **Warrior** | Challenge-based | Conquest-focused, progressive | "Conquer basics", "Attack advanced" |
| **Artist** | Flow-based | Discovery-focused, expressive | "Explore foundation", "Express mastery" |
| **Scientist** | Experimental | Hypothesis-focused, iterative | "Test approach", "Measure and iterate" |
| **Stoic** | Acceptance-based | Virtue-focused, sustainable | "Accept the process", "Build resilience" |
| **Visionary** | Impact-based | Vision-focused, ambitious | "Envision outcome", "Scale impact" |

### 1.2 Implementation

**File: `src/engines/breakdownEngine.ts`**

```typescript
// NEW: Add archetype-specific breakdown generators
interface BreakdownContext {
  goal: Goal;
  archetype: ArchetypeId;
  voiceProfile: VoiceProfile;
  traits: UserTraits;
}

function generateArchetypeBreakdown(context: BreakdownContext): BreakdownSuggestion[] {
  const pattern = detectGoalPattern(context.goal);
  const strategy = getArchetypeStrategy(context.archetype, pattern);

  return strategy.milestones.map((milestone, index) => ({
    title: applyVoice(milestone.title, context.voiceProfile),
    description: applyVoice(milestone.description, context.voiceProfile),
    keyActions: generateKeyActions(milestone, context.archetype),
    effort: estimateEffort(milestone, context.traits),
    motivationalNote: getMotivation(context.archetype, index)
  }));
}
```

### 1.3 Example Output

**Goal: "Get fit this year"**

| Archetype | Q1 Milestone |
|-----------|--------------|
| Machine | "Q1: Install the System — Establish 3x/week routine, track every session" |
| Warrior | "Q1: Basic Training — Conquer the fundamentals, no excuses, no missed days" |
| Artist | "Q1: Find Your Flow — Explore different movements, discover what feels right" |
| Scientist | "Q1: Baseline & Experiment — Measure starting point, test 3 different approaches" |
| Stoic | "Q1: Accept the Journey — Build sustainable foundation, focus on what you control" |
| Visionary | "Q1: Envision Your Future Self — Train like the person you're becoming" |

---

## Phase 2: Voice-Driven Messaging

### 2.1 Voice Profile Application

The existing `VoiceProfile` should drive ALL user-facing text:

```typescript
type VoiceProfile = {
  tone: "direct" | "warm" | "philosophical" | "energetic" | "analytical";
  motivationStyle: "challenge" | "support" | "logic" | "inspiration" | "discipline";
  detailLevel: "sparse" | "moderate" | "detailed";
  timeOrientation: "immediate" | "balanced" | "long-term";
  examplePhrases: string[];
};
```

### 2.2 Implementation

**File: `src/engines/voiceEngine.ts` (NEW)**

```typescript
// Apply voice to any text
function applyVoice(text: string, profile: VoiceProfile): string {
  // Transform generic text to match voice profile
}

// Generate motivation based on style
function getMotivation(style: MotivationStyle, context: string): string {
  const motivations = {
    challenge: `This is your moment. Attack ${context}.`,
    support: `You've got this. Take ${context} one step at a time.`,
    logic: `The data shows ${context} is achievable. Here's the path.`,
    inspiration: `Imagine completing ${context}. Feel that? Now go create it.`,
    discipline: `${context}. Execute. No excuses.`
  };
  return motivations[style];
}

// Generate action verbs by archetype
function getActionVerbs(archetype: ArchetypeId): string[] {
  const verbs = {
    Machine: ["Execute", "Systematize", "Automate", "Track", "Optimize"],
    Warrior: ["Attack", "Conquer", "Dominate", "Push", "Win"],
    Artist: ["Create", "Explore", "Express", "Flow", "Craft"],
    Scientist: ["Test", "Measure", "Analyze", "Iterate", "Experiment"],
    Stoic: ["Accept", "Endure", "Focus", "Persist", "Embrace"],
    Visionary: ["Envision", "Build", "Scale", "Transform", "Launch"]
  };
  return verbs[archetype];
}
```

### 2.3 Application Points

| Location | Current | With Voice |
|----------|---------|------------|
| Goal wizard intro | Generic welcome | Archetype-specific greeting |
| Milestone titles | "Q1: Build foundation" | "Q1: Install the System" (Machine) |
| Key actions | "Define scope" | "Execute: Define scope precisely" |
| Progress messages | "Great job!" | "The system works. Keep executing." |
| Habit prompts | "Time to exercise" | "Attack your workout. No retreat." |

---

## Phase 3: Atomic Habits + Personality

### 3.1 Framework Enhancement

Fully operationalize Atomic Habits with personality awareness:

#### Cue Recommendations by Archetype

| Archetype | Preferred Cue Types | Example |
|-----------|--------------------| --------|
| Machine | Time-based, systematic | "Every day at 6:00 AM" |
| Warrior | Challenge-based | "When you feel resistance" |
| Artist | Emotional/flow-based | "When inspiration strikes" |
| Scientist | Data-triggered | "After reviewing metrics" |
| Stoic | Stoic triggers | "When you notice negative emotion" |
| Visionary | Vision-aligned | "When thinking about your goals" |

#### Reward Recommendations by Archetype

| Archetype | Reward Style | Example |
|-----------|-------------|---------|
| Machine | Completion tracking | "Check off the box, update streak" |
| Warrior | Achievement unlocks | "You've completed 10 battles" |
| Artist | Aesthetic satisfaction | "Admire what you've created" |
| Scientist | Data visualization | "Watch your progress graph climb" |
| Stoic | Virtue acknowledgment | "You did what was right" |
| Visionary | Impact reflection | "One step closer to your vision" |

### 3.2 Implementation

**File: `src/engines/habitEngine.ts` (NEW)**

```typescript
interface PersonalizedHabit {
  base: Habit;
  personalizedCue: HabitCue;
  personalizedResponse: string; // 2-minute version
  personalizedReward: string;
  motivationalPrompt: string;
  obstacleStrategies: string[]; // Archetype-specific
}

function personalizeHabit(
  habit: Habit,
  prototype: UserPrototype
): PersonalizedHabit {
  const archetype = prototype.archetypeBlend.primary;
  const voice = prototype.voiceProfile;

  return {
    base: habit,
    personalizedCue: suggestCue(habit, archetype, prototype.traits),
    personalizedResponse: frame2MinuteVersion(habit.response, voice),
    personalizedReward: suggestReward(habit, archetype),
    motivationalPrompt: getMotivation(voice.motivationStyle, habit.title),
    obstacleStrategies: getObstacleStrategies(habit, archetype)
  };
}
```

### 3.3 Habit Stacking by Personality

**Concept**: Suggest habit stacks based on archetype tendencies

| Archetype | Stacking Style | Example |
|-----------|---------------|---------|
| Machine | Systematic chains | "After A → B → C (assembly line)" |
| Warrior | Momentum builds | "Warm-up → Main battle → Cool-down" |
| Artist | Flow sequences | "Inspiration → Creation → Reflection" |
| Scientist | Experiment blocks | "Hypothesis → Test → Record" |
| Stoic | Morning/Evening rituals | "Wake → Meditate → Journal → Act" |
| Visionary | Vision reinforcement | "Review goals → Take action → Celebrate progress" |

---

## Phase 4: Trait-Based Scheduling

### 4.1 Relevant Traits for Scheduling

From the 15 personality dimensions:

| Trait | Scheduling Impact |
|-------|------------------|
| **Patient ↔ Urgent** | Sprint vs marathon approach |
| **Spontaneous ↔ Structured** | Flexible vs rigid scheduling |
| **Process ↔ Outcome** | Daily habits vs milestone-focused |
| **Conservative ↔ Experimental** | Gradual ramp vs aggressive start |
| **Reactive ↔ Proactive** | Responsive triggers vs planned times |

### 4.2 Implementation

**File: `src/engines/schedulingEngine.ts` (NEW)**

```typescript
interface SchedulingProfile {
  pacePreference: "sprint" | "steady" | "marathon";
  structureLevel: "rigid" | "flexible" | "adaptive";
  focusStyle: "daily-habits" | "weekly-goals" | "milestone-driven";
  rampUpStyle: "aggressive" | "gradual" | "test-and-adjust";
}

function deriveSchedulingProfile(traits: UserTraits): SchedulingProfile {
  return {
    pacePreference: traits.patient_urgent < 40 ? "marathon"
                  : traits.patient_urgent > 60 ? "sprint"
                  : "steady",
    structureLevel: traits.spontaneous_structured < 40 ? "flexible"
                  : traits.spontaneous_structured > 60 ? "rigid"
                  : "adaptive",
    focusStyle: traits.process_outcome < 40 ? "daily-habits"
              : traits.process_outcome > 60 ? "milestone-driven"
              : "weekly-goals",
    rampUpStyle: traits.conservative_experimental < 40 ? "gradual"
               : traits.conservative_experimental > 60 ? "aggressive"
               : "test-and-adjust"
  };
}

function suggestGoalTimeline(
  goal: Goal,
  scheduling: SchedulingProfile
): TimelineSuggestion {
  // Adjust milestone spacing based on pace
  // Suggest check-in frequency based on structure level
  // Frame milestones based on focus style
}
```

### 4.3 Example Application

**User Profile**: Patient (25), Structured (75), Process-oriented (30)
**Scheduling Profile**: Marathon pace, rigid structure, daily-habits focus

**Suggested Approach**:
- Longer timeline with smaller daily actions
- Fixed daily schedule (same time every day)
- Focus on daily habit completion over milestone achievement
- Gradual ramp-up over 4+ weeks

---

## Phase 5: System Builder Enhancement

### 5.1 Archetype-Specific Templates

Create template variations for each archetype:

**Example: "Deep Work" System**

| Archetype | Identity Statement | Key Habit Variation |
|-----------|-------------------|---------------------|
| Machine | "I am a focused execution machine" | "90-min time-blocked deep work" |
| Warrior | "I am a mental warrior who conquers distraction" | "Attack mode: no interruptions until victory" |
| Artist | "I am a creator who protects my creative space" | "Flow state ritual: music → work → emerge" |
| Scientist | "I am a researcher who values deep analysis" | "Focused experiment blocks with documentation" |
| Stoic | "I am someone who does hard things without complaint" | "Embrace difficulty, work without distraction" |
| Visionary | "I am building something that matters" | "Vision-aligned deep work sessions" |

### 5.2 Implementation

**File: `src/data/systemTemplates.ts` (ENHANCED)**

```typescript
interface ArchetypeTemplateVariation {
  archetypeId: ArchetypeId;
  identityStatement: string;
  habitVariations: Record<string, Partial<Habit>>;
  environmentTweaks: EnvironmentTweak[];
  obstacleStrategies: string[];
  motivationalPhrases: string[];
}

interface EnhancedSystemTemplate extends SystemTemplate {
  archetypeVariations: ArchetypeTemplateVariation[];
}
```

### 5.3 Dynamic Template Selection

When user opens SystemBuilder:
1. Load base template
2. Detect user's primary archetype
3. Apply archetype variation automatically
4. Allow user to customize further

---

## Phase 6: UI/UX Enhancements

### 6.1 Goal Breakdown Wizard

**Current Flow**:
1. Show generic breakdown suggestions
2. User selects which to create

**Enhanced Flow**:
1. Show archetype badge: "Breaking down as a [Machine]..."
2. Display archetype-phrased milestones
3. Show motivation message in user's voice
4. Offer "Try different style" to see other archetype breakdowns
5. Key actions use archetype verbs

### 6.2 System Builder

**Current Flow**:
1. Generic templates
2. Generic identity prompts
3. Generic habit suggestions

**Enhanced Flow**:
1. Templates pre-filtered/sorted by archetype affinity
2. Identity prompt pre-filled: "I am a [person who]..." with archetype suggestion
3. Habit cues/rewards suggested based on archetype
4. Obstacle strategies tailored to archetype weaknesses
5. Environment tweaks based on archetype needs

### 6.3 Habit Tracking

**Current Display**:
- Habit title
- Cue
- Streak
- 7-day calendar

**Enhanced Display**:
- Habit title with archetype verb ("Execute: Morning routine")
- Personalized cue
- Streak with archetype celebration ("7-day streak! The system is working.")
- Motivational prompt on completion
- Reward acknowledgment

---

## Implementation Roadmap

### Phase 1: Foundation (Core Engine Work)
- [ ] Create `voiceEngine.ts` - text transformation by voice profile
- [ ] Enhance `breakdownEngine.ts` - archetype-aware breakdown strategies
- [ ] Create `habitEngine.ts` - habit personalization functions
- [ ] Create `schedulingEngine.ts` - trait-based scheduling profiles

### Phase 2: Goal System Integration
- [ ] Update `GoalBreakdownWizard.tsx` - show archetype-phrased milestones
- [ ] Update `AnnualGoalsWizard.tsx` - voice-driven messaging
- [ ] Add archetype strategy explanations to breakdown hints
- [ ] Implement "Try different style" option

### Phase 3: Systems/Habits Integration
- [ ] Create archetype variations for all 11 system templates
- [ ] Update `SystemBuilder.tsx` - archetype-aware flow
- [ ] Enhance `HabitsTracker.tsx` - personalized display
- [ ] Add craving/reward visibility to habit cards
- [ ] Integrate `IntentionPrompt` into habit creation

### Phase 4: Polish & Feedback
- [ ] Add archetype badges/indicators throughout UI
- [ ] Implement personalized celebration messages
- [ ] Add "Why this suggestion?" explanations
- [ ] Create archetype-specific onboarding tips

---

## Data Model Changes

### New Types Needed

```typescript
// src/types/personalization.ts

type BreakdownStrategy = {
  archetypeId: ArchetypeId;
  approachName: string;
  milestoneStyle: string;
  verbSet: string[];
  motivationPhrases: string[];
};

type SchedulingProfile = {
  pacePreference: "sprint" | "steady" | "marathon";
  structureLevel: "rigid" | "flexible" | "adaptive";
  focusStyle: "daily-habits" | "weekly-goals" | "milestone-driven";
  rampUpStyle: "aggressive" | "gradual" | "test-and-adjust";
};

type PersonalizedHabit = {
  base: Habit;
  personalizedCue: HabitCue;
  personalizedResponse: string;
  personalizedReward: string;
  motivationalPrompt: string;
  obstacleStrategies: string[];
};

type ArchetypeTemplateVariation = {
  archetypeId: ArchetypeId;
  identityStatement: string;
  habitVariations: Record<string, Partial<Habit>>;
  environmentTweaks: EnvironmentTweak[];
  obstacleStrategies: string[];
};
```

### Engine Function Signatures

```typescript
// voiceEngine.ts
function applyVoice(text: string, profile: VoiceProfile): string;
function getMotivation(style: MotivationStyle, context: string): string;
function getActionVerbs(archetype: ArchetypeId): string[];
function celebrateCompletion(archetype: ArchetypeId, streak: number): string;

// breakdownEngine.ts (enhanced)
function generateArchetypeBreakdown(goal: Goal, prototype: UserPrototype): BreakdownSuggestion[];
function getBreakdownStrategy(archetype: ArchetypeId): BreakdownStrategy;

// habitEngine.ts
function personalizeHabit(habit: Habit, prototype: UserPrototype): PersonalizedHabit;
function suggestCue(habit: Habit, archetype: ArchetypeId): HabitCue;
function suggestReward(habit: Habit, archetype: ArchetypeId): string;
function getObstacleStrategies(habit: Habit, archetype: ArchetypeId): string[];

// schedulingEngine.ts
function deriveSchedulingProfile(traits: UserTraits): SchedulingProfile;
function suggestGoalTimeline(goal: Goal, profile: SchedulingProfile): TimelineSuggestion;
function suggestHabitFrequency(habit: Habit, profile: SchedulingProfile): HabitFrequency;
```

---

## Success Metrics

### User Experience
- Goals feel personally relevant (not generic)
- Habit suggestions match how user thinks
- Motivation messages resonate with user's style
- Obstacle strategies address user's specific weaknesses

### Technical
- All user-facing text passes through voice engine
- Archetype influences every suggestion
- Trait scores affect scheduling recommendations
- System templates have archetype variations

### Engagement
- Higher goal completion rates
- Better habit streak retention
- Increased system adoption
- More time spent in goal/system builders

---

## Open Questions

1. **AI Integration**: Should we use Claude API for dynamic text generation, or keep it rule-based?
   - Recommendation: Start rule-based, add AI as optional "deep personalization" feature

2. **Archetype Fluidity**: Should users be able to temporarily "try on" different archetypes?
   - Recommendation: Yes, add "Try as [Archetype]" option in breakdowns

3. **Learning System**: Should the app learn from user behavior and adjust archetype over time?
   - Recommendation: Phase 2 feature - track what works and suggest archetype refinements

4. **Hybrid Archetypes**: How deeply should we blend primary + secondary archetypes?
   - Recommendation: Primary drives structure, secondary influences tone variations

---

## Next Steps

1. Review and approve this plan
2. Prioritize phases (suggest starting with Phase 1 + 2)
3. Create detailed tickets for each implementation item
4. Begin with `voiceEngine.ts` as foundation for all other work
