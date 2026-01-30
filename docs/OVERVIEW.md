# Looops - Personal Operating System

## Vision

Looops is a **Personal Operating System** designed to help users manage all aspects of their life through a unified, intentional framework. Unlike traditional task managers that treat life as a flat list of todos, Looops organizes life into interconnected domains ("Loops") with explicit states, behavior systems, and goal hierarchies.

The core philosophy: **Life is not a checklist. It's a system of interconnected loops that need different levels of attention at different times.**

## Mission Statement

To provide a comprehensive life management platform that:
- Reduces cognitive overhead by organizing life into clear domains
- Supports different "modes" of engagement (BUILD, MAINTAIN, RECOVER, HIBERNATE)
- Builds sustainable habits through behavior systems rather than willpower
- Connects daily actions to meaningful long-term goals
- Adapts to the user's current life season and capacity

---

## Core Concepts

### 1. The Seven Loops

Life is organized into seven fundamental domains:

| Loop | Icon | Description | Sub-Loops |
|------|------|-------------|-----------|
| **Health** | 💪 | Biological substrate - Sleep, Move, Eat, Recovery | Exercise, Nutrition, Sleep, Medical, Mental |
| **Wealth** | 💰 | Economic survival and growth | Income, Budgeting, Investing, Saving, Bills, Planning |
| **Family** | 👨‍👩‍👧‍👦 | Kinship, parenting, duty - Relationships that define you | Partner, Parenting, Extended Family, Quality Time, Events |
| **Work** | 💼 | Career, business, contribution - How you create value | Projects, Meetings, Development, Learning, Admin, Career |
| **Fun** | 🎮 | Play, novelty, restoration - What recharges you | Hobbies, Social, Entertainment, Adventure, Creative |
| **Maintenance** | 🔧 | Environment, logistics, admin - Keeping life running | Cleaning, Repairs, Shopping, Vehicle, Organization, Home Care |
| **Meaning** | 🧘 | Spirituality, philosophy, identity - Why you do any of it | Reflection, Learning, Purpose, Practice, Gratitude |

### 2. Loop States (The Traffic Light System)

Each loop can be in one of four states, determining how much energy and attention it receives:

| State | Color | Description | Use When |
|-------|-------|-------------|----------|
| **BUILD** | Sage Green (#73A58C) | Active growth and expansion | You want to level up in this area |
| **MAINTAIN** | Blue (#5a7fb8) | Steady state, hold the line | Things are working, keep them running |
| **RECOVER** | Amber (#F4B942) | Restoration and healing | Something broke, needs attention |
| **HIBERNATE** | Navy Gray (#737390) | Dormant, minimal effort | Intentionally deprioritizing |

### 3. Behavior Systems

Systems are collections of habits that work together toward a goal. Rather than tracking individual habits in isolation, Looops groups them into coherent systems:

- **System**: A named collection of related habits (e.g., "Morning Routine", "Fitness Protocol")
- **Habits**: Individual recurring behaviors with flexible frequencies
- **Implementation Intentions**: "When X, I will Y" statements that trigger habits
- **System Health**: Calculated score based on habit completion rates

### 4. Goal Hierarchy

Goals cascade from long-term vision to daily actions:

```
Annual Goals (North Star)
    └── Quarterly Goals (Milestones)
        └── Monthly Goals (Checkpoints)
            └── Weekly Goals (Sprints)
                └── Daily Goals (Actions)
```

### 5. User Prototypes (Archetypes)

During onboarding, users are assessed across four dimensions to create their "prototype":
- **Order vs Chaos**: Preference for structure
- **Builder vs Maintainer**: Growth vs stability orientation
- **Solo vs Social**: Independence vs collaboration
- **Sprint vs Marathon**: Burst vs sustained effort

This creates 16 possible archetypes that influence how the app presents information and suggestions.

---

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **CSS3** - Styling (no CSS framework, custom design system)

### State Management
- **React Context + useReducer** - Global state management
- **localStorage** - Persistence layer

### Architecture
```
src/
├── App.tsx                 # Main application component
├── index.css              # Global styles and design system
├── types/                 # TypeScript type definitions
│   ├── index.ts          # Re-exports
│   ├── core.ts           # Core types (Loops, States, etc.)
│   ├── tasks.ts          # Task-related types
│   ├── goals.ts          # Goal hierarchy types
│   ├── systems.ts        # Systems & Habits types
│   └── widgets.ts        # Dashboard widget types
├── context/              # React Context providers
│   ├── AppContext.tsx    # Main state management
│   └── index.ts          # Re-exports
├── components/           # React components
│   ├── common/          # Shared UI components
│   ├── dashboard/       # Loop dashboard & widgets
│   ├── goals/           # Goal management
│   ├── layout/          # Sidebar, header, etc.
│   ├── loops/           # Loop visualization
│   ├── onboarding/      # User onboarding flow
│   ├── routines/        # Routine management
│   ├── systems/         # Systems & Habits
│   ├── tasks/           # Task management
│   └── today/           # Today view components
├── engines/             # Business logic
│   ├── archetypeEngine.ts    # Prototype calculation
│   ├── frameEngine.ts        # Task framing
│   └── stateEngine.ts        # Loop state logic
├── storage/             # Persistence utilities
│   └── index.ts
├── hooks/               # Custom React hooks
└── data/               # Static data and templates
```

### Key Dependencies
```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "typescript": "^5.x",
  "vite": "^5.x"
}
```

---

## Current Feature Status

### Fully Implemented
- [x] **Loop Visualization** - Interactive radial diagram showing all 7 loops
- [x] **Loop State Management** - Set BUILD/MAINTAIN/RECOVER/HIBERNATE per loop
- [x] **Task Management** - Full CRUD with loop assignment, priorities, due dates
- [x] **Today View** - Stack view and calendar view of today's tasks
- [x] **Onboarding Flow** - Multi-step wizard with archetype assessment
- [x] **Goal Hierarchy** - Annual/Quarterly/Monthly/Weekly goal planning
- [x] **Routines** - Morning/evening routine builder with step tracking
- [x] **Systems & Habits** - Create systems, add habits, track completions
- [x] **Loop Dashboards** - Per-loop dashboards with customizable widgets
- [x] **Widget System** - Add/remove widgets (Tasks, Habits, Goals, Notes, System Health)
- [x] **Theme Support** - Dark/Light mode with localStorage persistence
- [x] **Profile Screen** - User info, archetype display, appearance settings

### Partially Implemented
- [ ] **History View** - UI exists but data aggregation incomplete
- [ ] **Planning View** - Goals work, loop states work, weekly planning incomplete
- [ ] **Challenges** - Data model exists, UI incomplete

### Not Yet Implemented
- [ ] **Data Export/Import**
- [ ] **Backend/Cloud Sync**
- [ ] **Mobile Responsiveness** (partial)
- [ ] **Notifications/Reminders**
- [ ] **Analytics Dashboard**
- [ ] **Recurring Tasks**

---

## Data Persistence

Currently using **localStorage** with the following keys:
- `looops-app-state` - Main application state
- `looops-theme` - Theme preference (dark/light)

State is automatically saved on every change via a useEffect in AppContext.

---

## Running the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Development server runs at `http://localhost:5173`

Use `?bypass=true` query parameter to skip onboarding during development.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app component, routing, screen rendering |
| `src/context/AppContext.tsx` | Global state, reducer, actions |
| `src/types/core.ts` | Loop definitions, colors, states |
| `src/types/systems.ts` | System, Habit, Completion types |
| `src/types/widgets.ts` | Dashboard widget definitions |
| `src/index.css` | Complete design system |
| `src/components/dashboard/LoopDashboard.tsx` | Per-loop dashboard |
| `src/components/systems/SystemsScreen.tsx` | Systems & Habits main screen |
| `src/components/loops/LoopsVisualization.tsx` | Radial loop diagram |

---

## Version History

- **v0.1.0** - Initial implementation with core loop management
- **v0.2.0** - Added Systems & Habits feature
- **v0.3.0** - Added Loop Dashboards with widget system
- **Current** - Soft 3D design refresh, documentation setup
