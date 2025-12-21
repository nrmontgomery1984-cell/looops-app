# Looops Design System

## Brand Identity

### Philosophy
Looops aims for a **premium, tactile, focused** aesthetic. The design should feel:
- **Intentional** - Every element has purpose
- **Calm** - Reduces visual noise and anxiety
- **Physical** - Elements feel tangible, like objects you can touch
- **Professional** - Sophisticated without being corporate

### Personality
- Thoughtful, not chaotic
- Supportive, not prescriptive
- Modern, not trendy
- Warm, not clinical

---

## Color Palette

### Brand Colors (Traffic Light System)

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Coral** | `#F27059` | 242, 112, 89 | Stop, To Do, Warnings, Destructive actions |
| **Amber** | `#F4B942` | 244, 185, 66 | Wait, In Progress, RECOVER state |
| **Sage** | `#73A58C` | 115, 165, 140 | Go, Done, BUILD state, Success |
| **Navy** | `#1a1a2e` | 26, 26, 46 | Primary backgrounds, text |

### Loop State Colors

| State | Color | Hex | Meaning |
|-------|-------|-----|---------|
| BUILD | Sage Green | `#73A58C` | Active growth (Go) |
| MAINTAIN | Blue | `#5a7fb8` | Steady state (Hold) |
| RECOVER | Amber | `#F4B942` | Restoration (Wait) |
| HIBERNATE | Navy Gray | `#737390` | Dormant (Pause) |

### Loop Identity Colors

Each loop has a unique color for visual identification:

| Loop | Border | Background (12% opacity) | Text |
|------|--------|-------------------------|------|
| Health | `#73A58C` | `rgba(115, 165, 140, 0.12)` | `#5a8a72` |
| Wealth | `#F4B942` | `rgba(244, 185, 66, 0.12)` | `#c99a35` |
| Family | `#F27059` | `rgba(242, 112, 89, 0.12)` | `#d05a45` |
| Work | `#5a7fb8` | `rgba(90, 127, 184, 0.12)` | `#4a6a9a` |
| Fun | `#b87fa8` | `rgba(184, 127, 168, 0.12)` | `#9a6a8a` |
| Maintenance | `#737390` | `rgba(115, 115, 144, 0.12)` | `#5e5e78` |
| Meaning | `#a87fb8` | `rgba(168, 127, 184, 0.12)` | `#8a6a9a` |

### Theme Colors (CSS Variables)

#### Dark Theme (Default)
```css
:root {
  --color-bg: #0f0f14;
  --color-bg-secondary: #16161d;
  --color-surface: #1c1c26;
  --color-surface-elevated: #242432;
  --color-border: #2a2a3a;
  --color-text: #e8e8ed;
  --color-text-secondary: #9898a8;
  --color-text-tertiary: #686878;
}
```

#### Light Theme
```css
[data-theme="light"] {
  --color-bg: #f5f5f7;
  --color-bg-secondary: #eaeaef;
  --color-surface: #ffffff;
  --color-surface-elevated: #ffffff;
  --color-border: #d8d8e0;
  --color-text: #1a1a2e;
  --color-text-secondary: #5a5a6e;
  --color-text-tertiary: #8a8a9a;
}
```

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI",
             Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

### Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| H1 | 28px | 700 | 1.2 | -0.02em |
| H2 | 20-24px | 600 | 1.3 | -0.01em |
| H3 | 16-18px | 600 | 1.4 | 0 |
| Body | 14px | 400 | 1.5 | 0 |
| Small | 12-13px | 500 | 1.4 | 0.01em |
| Caption | 10-11px | 500 | 1.3 | 0.03em |

### Usage Guidelines
- Headers use negative letter-spacing for tighter, more impactful appearance
- Body text uses neutral spacing for readability
- Captions use positive letter-spacing for legibility at small sizes
- Use font-weight 600 for emphasis, 700 for headers only

---

## Spacing System

Based on a 4px grid:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Minimal gaps |
| `--space-2` | 8px | Tight spacing |
| `--space-3` | 12px | Standard gap |
| `--space-4` | 16px | Component padding |
| `--space-5` | 20px | Section spacing |
| `--space-6` | 24px | Large gaps |
| `--space-8` | 32px | Section margins |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small elements, pills |
| `--radius-md` | 8px | Buttons, inputs |
| `--radius-lg` | 12px | Cards, modals |
| `--radius-xl` | 16-20px | Large cards, containers |
| `--radius-full` | 50% | Circles, avatars |

---

## Shadows & Elevation

### Soft 3D Effect (New Design Language)

The "raised block" aesthetic creates tactile, physical-feeling elements:

#### Card Shadow (Resting State)
```css
box-shadow:
  0 2px 4px rgba(0, 0, 0, 0.1),
  0 4px 8px rgba(0, 0, 0, 0.08),
  0 8px 16px rgba(0, 0, 0, 0.06),
  inset 0 1px 0 rgba(255, 255, 255, 0.05);
```

#### Card Shadow (Hover/Elevated)
```css
box-shadow:
  0 4px 8px rgba(0, 0, 0, 0.12),
  0 8px 16px rgba(0, 0, 0, 0.1),
  0 16px 32px rgba(0, 0, 0, 0.08),
  inset 0 1px 0 rgba(255, 255, 255, 0.1);
```

#### Card Shadow (Pressed)
```css
box-shadow:
  0 1px 2px rgba(0, 0, 0, 0.1),
  0 2px 4px rgba(0, 0, 0, 0.08),
  inset 0 1px 0 rgba(255, 255, 255, 0.05);
```

### Gradient Technique
Use subtle gradients to simulate light direction:
```css
background: linear-gradient(145deg, var(--color-surface) 0%, var(--color-bg-secondary) 100%);
```

---

## Component Patterns

### Cards

#### Standard Card
```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
}
```

#### Elevated Card (Soft 3D)
```css
.card-elevated {
  background: linear-gradient(145deg, var(--color-surface) 0%, var(--color-bg-secondary) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 18px 20px;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.1),
    0 4px 8px rgba(0, 0, 0, 0.08),
    0 8px 16px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-elevated:hover {
  transform: translateY(-4px) scale(1.02);
  /* Enhanced shadow on hover */
}
```

### Buttons

#### Primary Button
```css
.button-primary {
  background: var(--looops-sage);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 600;
}
```

#### Secondary Button
```css
.button-secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 20px;
}
```

#### Destructive Button
```css
.button-destructive {
  background: transparent;
  color: var(--looops-coral);
  border: 1px solid var(--looops-coral);
}
```

### Icon Blocks (Soft 3D)
```css
.icon-block {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  background: linear-gradient(145deg, var(--loop-bg) 0%, rgba(0,0,0,0.1) 100%);
  border-radius: 14px;
  border: 1px solid var(--loop-color);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.15),
    0 4px 8px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.05);
}
```

### Inputs
```css
input, textarea {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 12px;
  color: var(--color-text);
}

input:focus, textarea:focus {
  outline: none;
  border-color: var(--looops-sage);
  box-shadow: 0 0 0 3px rgba(115, 165, 140, 0.15);
}
```

---

## Animation Guidelines

### Timing Functions
```css
/* Standard easing for most transitions */
transition: all 0.15s ease;

/* Smooth, premium feel for interactive elements */
transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

/* Bouncy feel for playful interactions */
transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Common Animations

#### Hover Lift
```css
.element:hover {
  transform: translateY(-2px);
}
```

#### Hover Lift + Scale (Premium)
```css
.element:hover {
  transform: translateY(-4px) scale(1.02);
}
```

#### Press Effect
```css
.element:active {
  transform: translateY(-1px) scale(0.99);
}
```

#### Fade In
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## Layout Patterns

### Sidebar + Main Content
```
┌──────────┬─────────────────────────────────┐
│          │                                 │
│ Sidebar  │        Main Content             │
│  (72px)  │                                 │
│          │                                 │
└──────────┴─────────────────────────────────┘
```

### Screen Structure
```css
.screen {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.screen-header {
  flex-shrink: 0;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
}

.screen-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
```

### Grid Layouts
```css
/* Card grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

/* Widget grid */
.widget-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}
```

---

## Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Mobile | < 768px | Single column, hidden sidebar |
| Tablet | 768px - 1024px | Compact sidebar, 2 columns |
| Desktop | > 1024px | Full sidebar, 3+ columns |

---

## Accessibility

### Color Contrast
- All text meets WCAG AA standards (4.5:1 for body, 3:1 for large text)
- Interactive elements have visible focus states
- Don't rely on color alone to convey meaning

### Focus States
```css
:focus-visible {
  outline: 2px solid var(--looops-sage);
  outline-offset: 2px;
}
```

### Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Icon Guidelines

- Use emoji for Loop icons (personality, cross-platform)
- Use SVG for UI icons (crisp, themeable)
- Icon size in sidebar: 20px
- Icon size in buttons: 16px
- Icon size in cards: 24-28px

---

## Do's and Don'ts

### Do
- Use consistent spacing (4px grid)
- Maintain visual hierarchy through size and weight
- Use color purposefully (traffic light system)
- Create depth with layered shadows
- Provide feedback on all interactions

### Don't
- Mix too many colors in one view
- Use flat, lifeless surfaces
- Skip hover/active states
- Overuse animations
- Ignore dark mode compatibility
