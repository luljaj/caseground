# Queue Mode & Settings Enhancement Plan

## Decisions Made
- **Queue Type**: Filtered Queue (respects current track/category/"not done" filters)
- **Settings Priority**: Practice Behavior settings
- **Storage**: localStorage only (no database sync)
- **Styling**: All queue UI matches site aesthetic (zinc gradients, rounded-3xl, border-zinc-800)

---

## Implementation Status (current)
- Settings + queue state contexts are implemented in `/lib/context/SettingsContext.tsx` and `/lib/context/QueueContext.tsx`.
- Settings hook + queue hook are implemented in `/lib/hooks/useSettings.ts` and `/lib/hooks/useQueue.ts`.
- Queue UI is implemented in `/components/queue/*` and wired in `/app/layout.tsx` and `/app/problems/page.tsx`.
- Queue playback integration is wired in `/app/problems/[id]/page.tsx` and `/app/problems/[id]/results/page.tsx`.
- Dashboard settings now read/write via SettingsContext in `/app/dashboard/page.tsx`.

### Deviations / Notes
- Timer completion sound uses Web Audio API (no `/public/sounds/timer-end.mp3` asset required).
- "Add to Queue" on problem page shows a small inline notice instead of a toast.
- Queue "Next" control currently uses the same behavior as "Skip Problem" (advance without submitting).

---

## Queue Mode Implementation

### Problems Page: List View vs Queue View Toggle
The problems page has a view toggle: **List View** (default) | **Queue View**

---

### Queue View (on /problems page)

**Empty State:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  [List View]  [Queue View ✓]                              [Filters...]   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                         Your queue is empty                              │
│                                                                          │
│                            [ + Add Problems ]                            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**With Problems Added:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  [List View]  [Queue View ✓]                              [Filters...]   │
├──────────────────────────────────────────────────────────────────────────┤
│  ⋮⋮  1. Estimate the number of golf balls...    Estimations    5 min    │  ← Drag handle
│  ⋮⋮  2. How many piano tuners in Chicago?       Estimations    5 min    │
│  ⋮⋮  3. Tell me about a time you led a team     Behaviorals    3 min    │
├──────────────────────────────────────────────────────────────────────────┤
│  [ + Add More ]                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│        [Clear All]      [Shuffle]      [▶ Start Queue (3 problems)]      │
└──────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Cards styled like problem rows with drag handles (⋮⋮) on left
- Drag to reorder problems
- "Add More" button to add more problems
- Bottom bar with: Clear All, Shuffle, Start Queue

**Styling:**
- Queue cards: `bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-2xl border border-zinc-800`
- Drag handle: `text-zinc-600 hover:text-zinc-400`
- Bottom action bar: Same zinc gradient, sticky at bottom
- Buttons: Use existing Button component variants (primary for Start, ghost for others)

---

### Adding to Queue Mode (from List View)

When user clicks "+ Add Problems" from Queue View, switches to List View with banner:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🔵 Adding to Queue (3 added)                              [Done ✓]      │  ← Top banner
├──────────────────────────────────────────────────────────────────────────┤
│  [List View ✓]  [Queue View]                              [Filters...]   │
├──────────────────────────────────────────────────────────────────────────┤
│  [+]  1. Estimate the number of golf balls...   Estimations    5 min  ✓  │  ← + button, ✓ = added
│  [+]  2. How many piano tuners in Chicago?      Estimations    5 min     │
│  [+]  3. Tell me about a time you led a team    Behaviorals    3 min  ✓  │
│  ...                                                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Top banner shows "Adding to Queue (X added)" with Done button
- Each problem row gets a [+] button on left
- Clicking [+] adds to queue, shows ✓ indicator
- Filters still work to find specific problems
- Click "Done" to return to Queue View

**Styling:**
- Banner: `bg-blue-500/10 border-b border-blue-500/20` with blue accent
- [+] button: `text-zinc-500 hover:text-white` circular icon button
- ✓ indicator: `text-green-500` checkmark
- Done button: Button component ghost variant

---

### Problem Page: Add to Queue Button

On individual problem page, add "Add to Queue" button that:
- Adds current problem to queue
- Shows confirmation toast
- If queue view hasn't been visited, creates new queue with this problem

---

### Queue Playback Behavior

**Flow during queue:**
1. Problem loads → timer auto-starts (if global setting enabled)
2. User types response and submits
3. **Immediately advances to next problem** (skips results page)
4. Repeat until queue complete
5. **Queue Complete screen** shows summary with option to review individual results

**Auto-advance setting**: Optional setting to show results briefly before advancing (configurable delay)

**After queue complete**: User can go back to review any problem's results individually

---

### Queue Playback Overlay (Bottom Center)

When queue is started (playing), overlay appears:

```
                    ┌─────────────────────────────────────┐
                    │  ─  Queue: Problem 1 of 3   ⏱ 04:32 │  ← Collapsed bar
                    └─────────────────────────────────────┘
                                     ↓ Click to expand
┌──────────────────────────────────────────────────────────────────────────┐
│                              Queue Mode                              ─   │
├──────────────────────────────────────────────────────────────────────────┤
│                          Problem 1 of 3                                  │
│  ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  33%          │
├──────────────────────────────────────────────────────────────────────────┤
│                             ⏱ 04:32                                     │
├──────────────────────────────────────────────────────────────────────────┤
│              [Skip Problem]     [Next →]     [Exit Queue]                │
└──────────────────────────────────────────────────────────────────────────┘
```

**Position**: Fixed bottom center, slides up from bottom edge
**Collapsed State**: Thin bar showing position + timer, click to expand
**Visibility**: Shows on all pages while queue active
**Styling**: Zinc gradient (`bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800`)

**Completion State:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Queue Complete! 🎉                              │
├──────────────────────────────────────────────────────────────────────────┤
│                        3 problems finished                               │
│                        Total time: 14:23                                 │
├──────────────────────────────────────────────────────────────────────────┤
│  Completed Problems:                                                     │
│  ✓ Estimate golf balls in the US          [View Results]                 │
│  ✓ Piano tuners in Chicago                [View Results]                 │
│  ✓ Tell me about leading a team           [View Results]                 │
├──────────────────────────────────────────────────────────────────────────┤
│                          [Back to Problems]                              │
└──────────────────────────────────────────────────────────────────────────┘
```

Clicking "View Results" opens that problem's results page.

---

### Queue State (localStorage)
```typescript
interface QueueState {
  // Queue building state
  problemIds: number[];        // Ordered list of problem IDs in queue
  isAddingMode: boolean;       // True when in "Adding to Queue" mode

  // Playback state
  isPlaying: boolean;          // True when queue is actively running
  currentIndex: number;        // Current position in queue
  collapsed: boolean;          // Overlay collapsed or expanded
  startTime: number;           // When queue was started
  completedCount: number;      // Problems completed this session
}
```

---

## Settings to Implement

### Practice Behavior Settings
| Setting | Key | Type | Default |
|---------|-----|------|---------|
| Auto-start Timer | `autoStartTimer` | boolean | true |
| Timer Sound | `timerSound` | boolean | false |

### Queue-Specific Settings (shown in Queue View)
| Setting | Key | Type | Default |
|---------|-----|------|---------|
| Skip Completed Problems | `skipCompleted` | boolean | true |
| Show Results Between Problems | `showResultsBetween` | boolean | false |
| Results Display Time | `resultsDelay` | number (seconds) | 5 |

### Settings Storage
```typescript
interface Settings {
  // Global Practice Behavior
  autoStartTimer: boolean;
  timerSound: boolean;
  speechToTextReady: boolean;
  showPracticeTips: boolean;

  // Queue Settings
  skipCompleted: boolean;
  showResultsBetween: boolean;
  resultsDelay: number;
}
```

---

## Implementation Steps

### Step 1: Settings Context & Hook
1. Create `/lib/context/SettingsContext.tsx`
2. Create `/lib/hooks/useSettings.ts`
3. Wrap app in `SettingsProvider` in layout
4. Migrate existing dashboard settings to new system

### Step 2: Wire Existing Settings
1. Auto-start timer in `/app/problems/[id]/page.tsx`
2. Speech-to-text ready in problem page
3. Practice tips display (if UI exists)

### Step 3: Queue System
1. Create `/lib/context/QueueContext.tsx`
2. Create `/lib/hooks/useQueue.ts`
3. Add queue initialization from problems list
4. Add "Next Problem" to results page
5. Add queue indicator to problem page

### Step 4: Timer Sound
1. Add audio file for timer completion
2. Play sound in timer hook when time expires

### Step 5: Update Dashboard Settings UI
1. Add new settings toggles
2. Group by category
3. Match existing toggle styling

---

## Files to Create

| File | Purpose |
|------|---------|
| `/lib/context/SettingsContext.tsx` | Global settings provider |
| `/lib/hooks/useSettings.ts` | Settings access hook |
| `/lib/context/QueueContext.tsx` | Queue state provider |
| `/lib/hooks/useQueue.ts` | Queue logic (add, remove, reorder, play, skip) |
| `/components/queue/QueueOverlay.tsx` | Floating playback overlay (bottom center) |
| `/components/queue/QueueView.tsx` | Queue View for problems page |
| `/components/queue/QueueCard.tsx` | Draggable queue item card |
| `/components/queue/QueueProgress.tsx` | Progress bar sub-component |
| `/components/queue/QueueComplete.tsx` | Completion state display |
| `/components/queue/AddToQueueBanner.tsx` | "Adding to Queue" top banner |
| `/public/sounds/timer-end.mp3` | Timer completion sound |

## Files to Modify

| File | Changes |
|------|---------|
| `/app/layout.tsx` | Wrap with SettingsProvider, QueueProvider, render QueueOverlay |
| `/app/dashboard/page.tsx` | Expand settings UI, use new hook |
| `/app/problems/page.tsx` | Add List/Queue view toggle, conditionally render QueueView |
| `/app/problems/[id]/page.tsx` | Wire auto-start timer, add "Add to Queue" button |
| `/app/problems/[id]/results/page.tsx` | Queue overlay handles "Next Problem" |
| `/components/question/ProblemCard.tsx` | Wire timer settings |
| `/components/problems/ProblemRow.tsx` | Add [+] button when in adding mode |
| `/components/problems/ProblemFilters.tsx` | Add view toggle (List/Queue) |
| `/lib/hooks/useTimer.ts` | Add sound on completion, sync with queue

---

## Verification Steps

### Queue Building
1. Go to problems list → verify List View is default
2. Click "Queue View" toggle → see empty queue state
3. Click "+ Add Problems" → switches to List View with banner
4. Verify banner shows "Adding to Queue (0 added)"
5. Click [+] on a problem → adds to queue, shows ✓, banner updates count
6. Use filters to find specific problems → filters work normally
7. Click "Done" → returns to Queue View showing added problems
8. Drag a problem card → reorders the queue
9. Click "Shuffle" → randomizes order
10. Click "Clear All" → empties queue

### Queue Playback
1. With problems in queue, click "Start Queue"
2. Verify first problem loads, overlay slides up from bottom
3. Overlay shows "Problem 1 of X" with progress bar and timer
4. Click collapse (─) → minimizes to thin bar with position + timer
5. Click bar → expands back to full overlay
6. Click "Skip Problem" → advances to next without submitting
7. Submit response → immediately advances to next problem (skips results)
8. Complete all → overlay shows "Queue Complete!" with stats and review links
9. Click "View Results" on any problem → opens that problem's results page
10. Click "Exit Queue" mid-queue → returns to problems list

### Add from Problem Page
1. Go to individual problem page
2. Click "Add to Queue" button
3. Verify toast confirmation
4. Go to Queue View → problem is in queue

### Settings
1. Go to dashboard settings section
2. Toggle "Auto-start timer" ON → timer starts on problem load
3. Toggle "Timer sound" ON → sound plays when timer ends
4. Refresh page → settings persist

### Edge Cases
- Empty queue → "Start Queue" button disabled
- Exit queue → queue state preserved (can resume)
- Queue overlay doesn't block problem content
- Adding duplicate problem → shows already added indicator
