# Dashboard Visual Polish Plan

## Overview
Improve the dashboard's visual design by enhancing card contrast, establishing clear hierarchy, fixing typography inconsistencies, and removing the heatmap. Focus on a minimal, clean aesthetic that matches the quality of the Results and Problems pages.

## User Requirements
- **Primary focus**: Improve card contrast and visual hierarchy
- **Remove heatmap**: Activity heatmap is being removed entirely
- **Keep it minimal**: No icons or extra visual elements
- **Typography consistency**: Use patterns from Results page (uppercase labels, consistent sizing)
- **Donut chart**: Keep vertical stacked legend (current layout)

## User Preferences
1. **Priority**: Card contrast & hierarchy (most important)
2. **Design approach**: Minimal, text-focused (no icons)
3. **Heatmap**: Remove completely
4. **Chart legend**: Keep vertical stacked layout

## Current Issues Identified

### High Priority Issues
1. **Low card contrast**: Cards use `bg-surface/20` and `bg-surface/40` - too subtle
2. **No visual hierarchy**: All cards have equal visual weight
3. **Outer container styling**: Unnecessary border creates boxed-in feeling
4. **Typography inconsistencies**:
   - Stats labels use `text-sm` instead of `text-xs uppercase`
   - Spacing is inconsistent (`mt-3` then `mt-2`)
5. **Missing dashboard subtitle**: No context like Results page has

### Medium Priority Issues
1. **AI Credits badge**: Cramped styling with `px-3 py-1.5`
2. **TypeBreakdownChart**: Uses hardcoded colors instead of design tokens
3. **Back link**: Plain text instead of button styling

## Critical Files

### Files to Modify
- `app/dashboard/page.tsx` - Main dashboard structure and layout
- `components/dashboard/TypeBreakdownChart.tsx` - Chart styling and legend

### Files to Remove
- `components/dashboard/Heatmap.tsx` - No longer needed (or keep for potential future use)

### Files to Reference
- `app/results/[id]/page.tsx` - Typography patterns (uppercase labels)
- `app/globals.css` - Design tokens and color variables
- `components/ui/Button.tsx` - Button styling patterns

## Design System Reference

### Color Palette (from globals.css)
```css
--background: #0A0A0B (near-black)
--surface: #111113 (very dark gray)
--surface-hover: #18181B
--border: rgba(255, 255, 255, 0.06)
--text-primary: #FAFAFA (off-white)
--text-secondary: #71717A (muted gray)
--text-muted: #52525B (darker gray)
--accent: #3B82F6 (blue)
```

### Typography Patterns from Results Page
- Section labels: `text-xs font-medium uppercase tracking-wider text-text-secondary/60`
- Large values: `text-4xl font-semibold`
- Card titles: `text-lg font-semibold`
- Body text: `text-sm`
- Hints: `text-xs text-text-muted`

## New Dashboard Layout

### Structure (After Changes)
```
┌────────────────────────────────────────────────┐
│ Dashboard                                      │
│ Track your progress and activity across...    │ (subtitle)
│                                   AI Credits: 50 (badge)
├────────────────────────────────────────────────┤
│ ┌──────────────────┐  ┌────────────────────┐  │
│ │ QUESTIONS        │  │ QUESTIONS BY TYPE  │  │
│ │ ATTEMPTED        │  │                    │  │
│ │                  │  │  [Donut Chart]     │  │
│ │    12            │  │  • 5 Estimations   │  │
│ │                  │  │  • 4 Behaviorals   │  │
│ │ Unique questions │  │  • 3 Reasoning     │  │
│ └──────────────────┘  └────────────────────┘  │
│                                                │
│ [Back to Problems button]                      │
└────────────────────────────────────────────────┘
```

## Detailed Changes

### 1. Remove Outer Container Border

**Current:**
```tsx
<div className="mx-auto flex max-w-6xl flex-col gap-8 p-6 md:p-8
     border border-border rounded-lg bg-surface/20">
```

**New:**
```tsx
<div className="mx-auto max-w-5xl px-6 pb-12">
  <div className="flex flex-col gap-8">
    {/* Content */}
  </div>
</div>
```

**Rationale:**
- Matches Results and Problems page patterns
- Removes boxed-in feeling
- Cleaner, more spacious layout
- Better on mobile (no double borders)

### 2. Improve Header with Subtitle

**Current:**
```tsx
<div className="flex items-center justify-between animate-fade-up">
  <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md
       bg-surface/40 border border-border/80">
```

**New:**
```tsx
<div className="flex items-center justify-between animate-fade-up">
  <div className="flex flex-col gap-2">
    <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
    <p className="text-sm text-text-secondary">
      Track your progress and activity across all question types.
    </p>
  </div>
  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg
       bg-surface/60 border border-white/10">
    <span className="text-xs font-medium text-text-secondary">AI Credits</span>
    <span className="text-base font-semibold text-text-primary">
      {stats.aiCredits}
    </span>
  </div>
</div>
```

**Changes:**
- Added subtitle for context (like Results page)
- Improved badge spacing: `px-4 py-2.5` instead of `px-3 py-1.5`
- Better contrast: `bg-surface/60 border-white/10` instead of `bg-surface/40 border-border/80`
- Text size: `text-base` instead of `text-sm` for credit number

### 3. Increase Card Contrast & Establish Hierarchy

**Current (all cards same):**
```tsx
<Card className="border-border bg-surface/40 p-8 rounded-lg
     ring-0 focus:ring-0 focus-visible:ring-0">
```

**New (differentiated by importance):**

**Primary stat card:**
```tsx
<div className="rounded-lg border border-white/5 bg-surface/50 p-8
     transition-colors hover:bg-surface/60">
```

**Secondary stat card (donut chart):**
```tsx
<div className="rounded-lg border border-border/80 bg-surface/30 p-8
     transition-colors hover:bg-surface/40">
```

**Rationale:**
- `bg-surface/50` provides better contrast than `bg-surface/40`
- `border-white/5` is more visible than `border-border`
- Different opacity levels create hierarchy
- Hover states add interactivity
- Don't need Tremor Card component (simpler with divs)

### 4. Fix Typography - Stats Card

**Current:**
```tsx
<p className="text-sm text-text-secondary">Questions Attempted</p>
<p className="text-3xl font-semibold text-text-primary mt-3">
  {stats.totalAttempted}
</p>
<p className="text-xs text-text-muted mt-2">
  Unique questions answered
</p>
```

**New:**
```tsx
<div className="space-y-4">
  <div>
    <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary/60">
      Questions Attempted
    </h3>
    <p className="text-4xl font-semibold text-text-primary mt-4">
      {stats.totalAttempted}
    </p>
  </div>
  <p className="text-xs text-text-muted">
    Unique questions answered
  </p>
</div>
```

**Changes:**
- Label: `text-xs uppercase tracking-wider` (Results page pattern)
- Value: `text-4xl` instead of `text-3xl` (more prominent)
- Consistent spacing: `space-y-4` and `mt-4`
- Better visual hierarchy

### 5. Remove Heatmap Section

**Current:**
```tsx
<div className="animate-fade-up" style={{ animationDelay: "50ms" }}>
  <Card className="border-border bg-surface/40 p-8 rounded-lg ...">
    <h2 className="text-lg font-semibold text-text-primary mb-6">
      Activity
    </h2>
    <Heatmap data={stats.heatmap} />
  </Card>
</div>
```

**Action:** Delete this entire section

**Update animation delays:**
- Stats row: Change from `100ms` to `50ms` delay

### 6. Improve TypeBreakdownChart

**Current:**
```tsx
<Card className="border-border bg-surface/40 p-8 rounded-lg ...">
  <h3 className="text-lg font-semibold text-text-primary mb-6">
    Questions by Type
  </h3>
  <div className="flex items-center gap-6">
    <div className="border border-border rounded-lg p-4 bg-background/20">
      <DonutChart ... colors={["#60a5fa", "#a78bfa", "#fbbf24"]} />
    </div>
    <div className="flex flex-col gap-3">
      {/* Legend with hardcoded colors */}
      <div className="w-3 h-3 rounded-full bg-blue-400" />
```

**New:**
```tsx
<div className="rounded-lg border border-border/80 bg-surface/30 p-8
     transition-colors hover:bg-surface/40">
  <h3 className="text-xs font-medium uppercase tracking-wider text-text-secondary/60 mb-6">
    Questions by Type
  </h3>
  <div className="flex items-center gap-8">
    <div className="border border-white/5 rounded-lg p-5 bg-surface/40">
      <DonutChart
        data={chartData}
        category="value"
        index="name"
        colors={["#60a5fa", "#a78bfa", "#fbbf24"]}
        showAnimation={true}
        showLabel={false}
        valueFormatter={(value) => `${value} question${value !== 1 ? "s" : ""}`}
        className="h-36 w-36"
      />
    </div>
    <div className="flex flex-col gap-4">
      {estimations > 0 && (
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#60a5fa" }} />
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-text-primary">
              {estimations}
            </span>
            <span className="text-sm text-text-secondary">Estimations</span>
          </div>
        </div>
      )}
      {/* Similar for behaviorals and reasoning */}
    </div>
  </div>
</div>
```

**Changes:**
- Title: Use uppercase pattern (`text-xs uppercase`)
- Remove Tremor Card, use plain div
- Chart size: `h-36 w-36` (144px - larger and more prominent)
- Chart container: Better contrast with `bg-surface/40`
- Legend spacing: `gap-8` for more breathing room
- Legend items: `gap-4` between rows
- Legend text: Larger numbers (`text-lg`) and better hierarchy
- Use inline styles for colors to ensure they work

### 7. Improve Back Link

**Current:**
```tsx
<Link
  href="/problems"
  className="text-[13px] text-text-secondary transition-colors hover:text-text-primary"
>
  Back to Problems
</Link>
```

**New:**
```tsx
<Link href="/problems">
  <Button variant="ghost" size="sm">
    Back to Problems
  </Button>
</Link>
```

**Rationale:**
- Consistent with button usage elsewhere
- Better hover/focus states
- More clickable/accessible

### 8. Grid Layout Adjustments

**Current:**
```tsx
<div className="grid gap-6 md:grid-cols-2 animate-fade-up"
     style={{ animationDelay: "100ms" }}>
```

**New:**
```tsx
<div className="grid gap-6 md:grid-cols-2 animate-fade-up"
     style={{ animationDelay: "50ms" }}>
```

**Change:** Reduce delay since heatmap is removed (was 100ms, now 50ms)

## Color & Contrast Specifications

### Card Backgrounds (in order of visual weight)

1. **Primary stat card** (most prominent):
   - Background: `bg-surface/50` (50% opacity of #111113)
   - Border: `border-white/5` (5% white overlay)
   - Computed: ~#89898C background, subtle white border

2. **Secondary stat card** (supporting content):
   - Background: `bg-surface/30` (30% opacity)
   - Border: `border-border/80` (80% of #FFFFFF0F)
   - Computed: Lighter, more subtle than primary

3. **Chart container** (inner element):
   - Background: `bg-surface/40`
   - Border: `border-white/5`
   - Creates depth within the card

### Typography Contrast Levels

1. **Headers**: `text-text-primary` (#FAFAFA) - highest contrast
2. **Values**: `text-text-primary` - same as headers
3. **Labels**: `text-text-secondary/60` (#71717A at 60%) - reduced opacity
4. **Hints**: `text-text-muted` (#52525B) - lowest contrast

## API Changes

### Update Response Type

Since heatmap is removed, optionally update API to not fetch heatmap data (for performance).

**Current (app/api/stats/route.ts):**
```typescript
return NextResponse.json({
  totalAttempted,
  aiCredits: profile.ai_credits,
  heatmap,  // Can remove this
  byType,
});
```

**Optional change:**
```typescript
return NextResponse.json({
  totalAttempted,
  aiCredits: profile.ai_credits,
  byType,
});
```

**Dashboard type update:**
```typescript
type StatsPayload = {
  totalAttempted: number;
  aiCredits: number;
  byType: {
    estimations: number;
    behaviorals: number;
    reasoning: number;
  };
  // heatmap removed
};
```

**Note:** Can keep heatmap in API for backward compatibility, just don't render it.

## Responsive Behavior

### Mobile (< 768px)
- Header: Stack title and badge vertically
- Stats grid: Single column (cards stack)
- Donut chart: Reduce to `h-32 w-32`
- Legend: Keep vertical, reduce font sizes

### Tablet (768px - 1024px)
- Header: Keep horizontal layout
- Stats grid: 2 columns
- Chart: Full size `h-36 w-36`

### Desktop (>= 1024px)
- All elements at full size
- Max width: `max-w-5xl` (1024px)

## Implementation Steps

1. **Update dashboard container**
   - Remove outer border and background
   - Update max-width and padding
   - Adjust overall spacing

2. **Improve header section**
   - Add subtitle below title
   - Enhance AI Credits badge styling
   - Fix animation

3. **Remove heatmap**
   - Delete heatmap section from dashboard
   - Update animation delays for remaining sections
   - Optionally remove heatmap from API response

4. **Enhance stats card**
   - Update typography (uppercase label, larger value)
   - Improve card background and border
   - Add hover state
   - Remove Tremor Card wrapper

5. **Polish TypeBreakdownChart**
   - Update title to uppercase
   - Increase chart size
   - Improve legend spacing and typography
   - Better container styling
   - Remove Tremor Card wrapper

6. **Update back link**
   - Replace with Button component
   - Use ghost variant

7. **Test responsive behavior**
   - Verify mobile layout
   - Check tablet view
   - Test animations

## Testing & Verification

### Visual Checks
1. **Card contrast**: Cards should be clearly distinguishable from background
2. **Typography**: All labels should be uppercase with consistent sizing
3. **Spacing**: Consistent gaps between elements (gap-6, gap-8)
4. **Hover states**: Cards and buttons should have subtle hover effects
5. **Responsive**: Layout should work on mobile, tablet, desktop

### Functional Checks
1. **Data display**: Stats should show correct numbers
2. **Donut chart**: Should display with correct colors
3. **Legend**: Should match chart segments
4. **Navigation**: Back button should work
5. **Animations**: Smooth fade-in on page load

### Browser Testing
- Chrome (primary)
- Firefox
- Safari

## File Summary

### Files to Modify
- `app/dashboard/page.tsx` (~120 lines)
  - Remove heatmap section
  - Update header with subtitle
  - Improve card styling
  - Fix typography
  - Update animation delays

- `components/dashboard/TypeBreakdownChart.tsx` (~100 lines)
  - Update title styling
  - Increase chart size
  - Improve legend layout
  - Better container styling

- `app/api/stats/route.ts` (optional, ~95 lines)
  - Can remove heatmap from response
  - Or leave for backward compatibility

### Files to Reference
- `app/results/[id]/page.tsx` (typography patterns)
- `app/globals.css` (design tokens)
- `components/ui/Button.tsx` (button styles)

### Files to Keep (No Changes)
- `components/dashboard/Heatmap.tsx` (keep in case needed later)

## Expected Visual Result

**Before:**
- Boxed-in dashboard with outer border
- Low contrast cards (hard to distinguish)
- Heatmap takes up vertical space
- Inconsistent typography
- Small AI Credits badge

**After:**
- Clean, spacious layout without outer border
- Clear visual hierarchy with better card contrast
- Focused on stats and type breakdown (no heatmap)
- Consistent typography matching Results page
- Prominent AI Credits badge
- Larger, more readable donut chart

## Design Principles Applied

✅ **Consistent with app design**: Matches Results and Problems pages
✅ **Clear hierarchy**: Different card weights create visual priority
✅ **Better contrast**: Cards stand out from background
✅ **Minimal aesthetic**: No icons, clean and focused
✅ **Typography consistency**: Uppercase labels throughout
✅ **Responsive**: Works on all screen sizes
✅ **Performance**: Removed unused heatmap rendering
✅ **Accessibility**: Proper semantic HTML, good contrast ratios

## Notes

- Heatmap removal is a significant UX change - user may want to add it back later
- Kept Heatmap component file in case it's needed in the future
- Can always re-add heatmap in a separate "Activity" page if analytics are needed
- Focus is now purely on quick stats overview
