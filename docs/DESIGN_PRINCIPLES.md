# Design Principles

A guide to Caseground's visual language. Clean, focused, professional.

---

## Philosophy

**Reduce, don't decorate.** Every element must earn its place. If it doesn't serve the user, remove it.

Inspired by Linear's approach: software should feel fast, intentional, and refined. No visual noise. No unnecessary flourishes. Just clarity.

---

## Core Principles

### 1. Purposeful Minimalism

Strip away everything that doesn't directly help the user accomplish their goal.

- **No decorative elements** — borders, shadows, and dividers only when they improve comprehension
- **Generous whitespace** — let content breathe; density is not efficiency
- **Single focal point** — each view should have one clear primary action

### 2. Subtle Depth

Create hierarchy through restraint, not excess.

- Use **opacity and blur** over hard shadows
- Prefer **1-2px borders** with low opacity (`border-white/5` or `border-white/10`)
- Background layers should be **barely distinguishable** — think 2-4% brightness difference
- Elevation through **context**, not drop shadows

### 3. Muted Color Palette

Color is information, not decoration.

```
Background:     #0A0A0B (near-black, slight warmth)
Surface:        #111113 (cards, modals)
Surface Hover:  #18181B (interactive states)
Border:         rgba(255, 255, 255, 0.06)
Text Primary:   #FAFAFA (not pure white)
Text Secondary: #71717A (zinc-500)
Text Muted:     #52525B (zinc-600)
Accent:         #3B82F6 (blue-500, use sparingly)
Success:        #22C55E
Warning:        #EAB308
Error:          #EF4444
```

**Rules:**
- Accent colors appear only on primary actions and active states
- Status colors are functional, never decorative
- Avoid gradients unless they serve a clear purpose

### 4. Typography

Clean, systematic, legible.

**Font Stack:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Scale:**
| Use Case      | Size    | Weight | Line Height |
|---------------|---------|--------|-------------|
| Display       | 32-48px | 600    | 1.1         |
| Heading       | 20-24px | 600    | 1.2         |
| Subheading    | 16-18px | 500    | 1.3         |
| Body          | 14-15px | 400    | 1.5         |
| Caption       | 12-13px | 400    | 1.4         |
| Mono/Code     | 13px    | 400    | 1.5         |

**Guidelines:**
- Limit to 2-3 font weights per view
- Use `tracking-tight` (-0.02em) for headings
- Body text should never exceed 65-75 characters per line

### 5. Motion & Interaction

Fast, functional, invisible.

- **Transitions:** 150-200ms for micro-interactions, 300ms for layout changes
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` — smooth deceleration
- **Hover states:** Subtle background shift, never jarring
- **Loading:** Skeleton screens over spinners when possible

```css
transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
```

**Avoid:**
- Bounce effects
- Long animations (>400ms)
- Motion that blocks user progress

### 6. Spacing System

Consistent, mathematical, predictable.

Base unit: **4px**

```
4px   — tight grouping (icon + label)
8px   — related elements
12px  — component padding (small)
16px  — component padding (default)
24px  — section separation
32px  — major sections
48px  — page sections
64px  — large page margins
```

Use Tailwind spacing: `p-3` (12px), `p-4` (16px), `gap-6` (24px), etc.

### 7. Component Patterns

#### Buttons
- **Primary:** Solid accent color, white text. One per view.
- **Secondary:** Transparent with subtle border, muted text.
- **Ghost:** No background, text only. For tertiary actions.
- **Destructive:** Red, but muted. Never bright.

```
Padding: px-4 py-2 (default), px-3 py-1.5 (small)
Radius: rounded-md (6px)
```

#### Cards
- Background: 1 step lighter than page
- Border: `border border-white/5`
- Padding: `p-4` or `p-6`
- No shadow unless elevated (modals, dropdowns)

#### Inputs
- Background: Transparent or `bg-white/5`
- Border: `border-white/10`, focus: `border-white/20`
- Height: 36-40px
- Placeholder: `text-zinc-500`

#### Tables
- Minimal borders — horizontal dividers only
- Row hover: `bg-white/[0.02]`
- Header: `text-xs uppercase tracking-wider text-zinc-500`

---

## Anti-Patterns

What we **don't** do:

| Avoid | Instead |
|-------|---------|
| Heavy drop shadows | Subtle borders or backdrop blur |
| Colorful gradients | Solid, muted backgrounds |
| Rounded-full buttons | `rounded-md` or `rounded-lg` |
| Multiple accent colors | Single accent, use sparingly |
| Icon overload | Icons only when they clarify meaning |
| Busy hover states | Single property change (bg or opacity) |
| Pure black (#000) | Near-black with warmth (#0A0A0B) |
| Pure white (#FFF) | Off-white (#FAFAFA) |

---

## Accessibility

Minimalism doesn't mean inaccessible.

- Maintain **4.5:1** contrast ratio for body text
- Focus states must be **visible** — use ring or outline
- Touch targets: minimum **44x44px**
- Don't rely on color alone for status — include icons or text

---

## Reference

**Inspiration:**
- [Linear](https://linear.app) — The gold standard
- [Vercel](https://vercel.com) — Clean, developer-focused
- [Raycast](https://raycast.com) — Speed and elegance
- [Supabase](https://supabase.com) — Dark mode done right

---

*Less interface, more focus.*
