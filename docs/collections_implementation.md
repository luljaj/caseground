# Collections System Implementation Plan

## Overview

Replace the current queue system with a unified **Collections** system:
- **Pre-made Collections** = Curated problem sets stored in DB
- **Custom Collections** = User-created problem sets in localStorage

---

## Summary of Decisions

| Decision | Answer |
|----------|--------|
| Terminology | "Collection" (not Course, not Queue) |
| **Collection Completion** | Boolean — has the user finished this collection? |
| **Collection Attempted** | Percentage — how many constituent problems has user ever completed? |
| Completion condition | User must play through entire collection AND have 100% Collection Attempted |
| Skip behavior | Moves to next problem; allowed if problem already completed elsewhere |
| Progress persistence | `sessionStorage` — survives refresh, cleared on navigation away |
| Submissions saved | Yes, responses are saved on each problem submission |
| Pre-made storage | Supabase `collections` table |
| Custom storage | localStorage |
| Completed collections | Supabase `user_collection_completions` table with `completed_at` |
| Badges | **None** — removed entirely |
| Exit page | **None** — user returns to `/collections` if they leave |
| Queue system | Completely removed and replaced |

---

## Phase 1: Database Schema

### Migration: `008_collections_schema.sql`

```sql
-- ============================================
-- 1. COLLECTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,                        -- Short description for card
  long_description text,                   -- Full paragraph for detail page
  
  -- Categorization
  section text NOT NULL,                   -- Section it appears in
  -- Sections: 'consulting', 'ib', 'pe', 'pm', 'corporate_strategy', 'tech',
  --           'brain_teaser', 'behavioral', 'market_sizing', 'profitability', 'technical'
  
  target_roles text[] DEFAULT '{}',        -- For recommendations: ['consulting', 'ib', ...]
  difficulty text DEFAULT 'intermediate',  -- 'beginner', 'intermediate', 'advanced'
  
  -- Content
  problem_ids uuid[] NOT NULL DEFAULT '{}', -- Ordered list of question IDs
  estimated_time_minutes integer,
  
  -- Display
  sort_order integer DEFAULT 0,
  is_featured boolean DEFAULT false,       -- Show in Recommended section
  is_published boolean DEFAULT false,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collections_section ON public.collections(section);
CREATE INDEX IF NOT EXISTS idx_collections_published ON public.collections(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_collections_featured ON public.collections(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_collections_target_roles ON public.collections USING GIN(target_roles);

-- RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collections are publicly readable"
  ON public.collections FOR SELECT USING (is_published = true);

-- ============================================
-- 2. USER COLLECTION COMPLETIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_collection_completions (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, collection_id)
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_user_collection_completions_user 
  ON public.user_collection_completions(user_id);

-- RLS
ALTER TABLE public.user_collection_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions"
  ON public.user_collection_completions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON public.user_collection_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. USER ONBOARDING PREFERENCES
-- ============================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS target_role text,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
```

---

## Phase 2: TypeScript Types

### Add to `/types/index.ts`

```typescript
// ============================================
// COLLECTIONS
// ============================================

export type CollectionSection = 
  // Job Types
  | 'consulting'
  | 'ib'
  | 'pe'
  | 'pm'
  | 'corporate_strategy'
  | 'tech'
  // Specialized
  | 'brain_teaser'
  | 'behavioral'
  | 'market_sizing'
  | 'profitability'
  | 'technical';

export const COLLECTION_SECTION_LABELS: Record<CollectionSection, string> = {
  consulting: 'Consulting',
  ib: 'Investment Banking',
  pe: 'Private Equity',
  pm: 'Product Management',
  corporate_strategy: 'Corporate Strategy',
  tech: 'Tech / Strategy',
  brain_teaser: 'Brain Teasers',
  behavioral: 'Behavioral',
  market_sizing: 'Market Sizing',
  profitability: 'Profitability',
  technical: 'Technical',
};

export type CollectionDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  long_description: string | null;
  section: CollectionSection;
  target_roles: TargetRole[];
  difficulty: CollectionDifficulty;
  problem_ids: string[];
  estimated_time_minutes: number | null;
  sort_order: number;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// Collection with user's completion data
export interface CollectionWithStatus extends Collection {
  isComplete: boolean;                    // User has finished this collection (from user_collection_completions)
  completedAt: string | null;             // When user completed (from user_collection_completions)
  attemptedPercent: number;               // % of problems user has ever done (from user_responses)
  problemsAttemptedCount: number;         // Count of problems user has attempted
}

// User collection completion record (from DB)
export interface UserCollectionCompletion {
  user_id: string;
  collection_id: string;
  completed_at: string;
}

// Collection session state (stored in sessionStorage)
export interface CollectionSession {
  collectionId: string;
  collectionSlug: string;
  currentIndex: number;                   // 0-based index in problem_ids
  problemIds: string[];                   // Copy of collection's problem_ids
  completedThisSession: string[];         // Problem IDs completed this session
  skippedThisSession: string[];           // Problem IDs skipped this session
  startedAt: string;
}

// Custom collection (localStorage)
export interface CustomCollection {
  id: string;                             // Generated UUID
  name: string;
  problem_ids: string[];
  created_at: string;
  is_complete: boolean;                   // Has user completed this custom collection
}

// ============================================
// USER PREFERENCES (Onboarding)
// ============================================

export type TargetRole = 
  | 'consulting'
  | 'pm'
  | 'ib'
  | 'pe'
  | 'corporate_strategy'
  | 'tech'
  | 'other';  // For "Just exploring" skip option

export const TARGET_ROLE_LABELS: Record<TargetRole, string> = {
  consulting: 'Management Consulting',
  pm: 'Product Management',
  ib: 'Investment Banking',
  pe: 'Private Equity',
  corporate_strategy: 'Corporate Strategy',
  tech: 'Tech / Strategy',
  other: 'Other / Exploring',
};

export interface UserPreferences {
  target_role: TargetRole | null;
  onboarding_completed_at: string | null;
}
```

---

## Phase 2.5: Session Management

### Collection Session Persistence

The collection session is stored in `sessionStorage` under the key `collection_session`.

**Storage Key:** `collection_session`

**Stored Data:**
```typescript
interface CollectionSession {
  collectionId: string;
  collectionSlug: string;
  currentIndex: number;           // 0-based
  problemIds: string[];           // Copy of collection's problem_ids
  completedThisSession: string[]; // Problem IDs completed this session
  skippedThisSession: string[];   // Problem IDs skipped this session
  startedAt: string;              // ISO timestamp
}
```

### Persistence Behavior

| Scenario | Session Preserved? | Notes |
|----------|-------------------|-------|
| Page refresh (F5) | ✅ Yes | sessionStorage persists |
| Tab close + reopen | ✅ Yes | Browser restores sessionStorage |
| Navigate to different page in app | ❌ No | Manually clear on route change |
| Close browser entirely | ❌ No | sessionStorage cleared |
| Open new tab | ❌ No | sessionStorage is per-tab |

### Implementation Notes

1. **Starting a Collection:**
   - Write `CollectionSession` to `sessionStorage`
   - Navigate to first problem in collection

2. **During Collection:**
   - Read session from `sessionStorage` on each problem page
   - Update `currentIndex` and `completedThisSession` after each submission
   - Show overlay if session exists

3. **Completing Collection:**
   - Clear `sessionStorage`
   - Insert into `user_collection_completions` table
   - Navigate to `/collections/[slug]/complete`

4. **Exiting Collection (via modal):**
   - Clear `sessionStorage`
   - Navigate to `/collections`

5. **Route Change Detection:**
   - When navigating away from a problem page (e.g., clicking nav link)
   - Check if destination is not another problem in the collection
   - If so, show exit confirmation modal

---

## Phase 3: Visual Specifications

### Collection Card Ring

```
┌─────────────────────────────────────────┐
│                                         │
│    ┌──────────┐                         │
│    │   Ring   │  Collection Name        │
│    │  Visual  │  Short description...   │
│    └──────────┘                         │
│                                         │
│    8 problems • 45 min • Intermediate   │
│                                         │
└─────────────────────────────────────────┘
```

**Ring States:**

| State | Visual |
|-------|--------|
| 0% attempted | Empty ring outline (gray/muted) |
| Partial (1-99%) | Accent blue fill around circumference, proportional to attemptedPercent |
| 100% attempted but not complete | Full blue ring (all problems attempted, but collection not finished) |
| Collection complete | Full green ring + green circle center + white checkmark |

**Ring Implementation:**
- SVG circle with stroke-dasharray for percentage
- Accent blue (`#3B82F6`) for attempted progress
- Green (`#22C55E`) for collection complete (from `user_collection_completions`)
- Center checkmark uses Lucide or custom SVG

---

### Collection Detail Page (`/collections/[slug]`)

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Collections                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐                                                   │
│  │   Ring   │  Collection Name                                  │
│  │  Visual  │  Difficulty Badge                                 │
│  └──────────┘                                                   │
│                                                                 │
│  Long description paragraph explaining the collection and       │
│  its goals. This should give users context about what they'll   │
│  practice and why it's valuable for their preparation.          │
│                                                                 │
│  8 problems • Estimated 45 minutes                              │
│                                                                 │
│  ⚠️ Note: Progress is not saved. Starting this collection       │
│     will always begin from problem 1.                           │
│                                                                 │
│                              [Start Collection]                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  PROBLEMS IN THIS COLLECTION                                    │
├─────────────────────────────────────────────────────────────────┤
│  1. Problem Title Here                    Estimations    5 min  │
│  2. Another Problem Title                 Reasoning      3 min  │
│  3. Third Problem Title                   Behavioral     4 min  │
│  ...                                                            │
└─────────────────────────────────────────────────────────────────┘
```

**Notes:**
- Each problem row shows completion indicator (checkmark if in user_responses)
- If collection is complete (user has a completion record):
  - Clicking any problem navigates to `/collections/[slug]/complete` with that problem's tab selected
- If collection is NOT complete:
  - Problem list is view-only (no navigation)
- "Start Collection" button always starts from problem 1

---

### Collection Overlay (During Collection)

**Expanded State:**
```
                    ┌─────────────────────────────────────────┐
                    │  ▼ (minimize arrow)                     │
                    ├─────────────────────────────────────────┤
                    │  Market Sizing Fundamentals              │
                    │  Problem 3 of 8                          │
                    │                                         │
                    │  ████████░░░░░░░░░░░░░░  (progress bar) │
                    │                                         │
                    │        [Skip]           [Exit]          │
                    └─────────────────────────────────────────┘
```

**Minimized State:**
```
                    ┌─────────────────────────────────────────┐
                    │  ▲  Collection: 3/8                     │
                    └─────────────────────────────────────────┘
```

**Overlay features:**
- Fixed at bottom center, floats above page content
- Minimize arrow (▼) at top to collapse to minimized state
- Clicking minimized bar (▲) expands it again
- Shows collection name + current position
- Progress bar visual for completion through collection
- **Skip** — moves to next problem without saving response
  - Only allowed if problem already completed elsewhere (from user_responses)
  - Grayed out / disabled if problem not yet completed
- **Exit** — shows exit confirmation modal, then returns to `/collections`
- **No "Back" or "Next" buttons** — submitting a problem auto-advances

---

### Exit Confirmation Modal

```
┌─────────────────────────────────────────────────────────────────┐
│                      Exit Collection?                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Your submissions have been saved. Exiting will return you      │
│  to the collections page.                                       │
│                                                                 │
│                    [Cancel]    [Exit Collection]                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**On Exit:**
- Clear collection session from `sessionStorage`
- Navigate to `/collections`
- No separate exit page — user just returns to collections listing

---

### Completion Page (`/collections/[slug]/complete`)

**Route to this page when:**
- User completes the last problem in collection AND
- All problems have been completed (100% attemptedPercent)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    ┌──────────────┐                             │
│                    │   ✓ Green    │                             │
│                    │   Complete   │                             │
│                    └──────────────┘                             │
│                                                                 │
│           You completed Market Sizing Fundamentals!             │
│                                                                 │
│               Completed on January 24, 2026                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  PROBLEM RESULTS                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│  │  Problem 1  │  Problem 2  │  Problem 3  │    ...      │     │
│  │  (active)   │             │             │             │     │
│  └─────────────┴─────────────┴─────────────┴─────────────┘     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────── │
│  │  Problem 1: Market Size of Coffee in NYC                    │
│  │                                                              │
│  │  YOUR RESPONSE                                               │
│  │  ──────────────────────────────────────────────────────────  │
│  │  To estimate the market size of coffee in NYC...             │
│  │  [full user response displayed here]                         │
│  │                                                              │
│  │  EXAMPLE ANSWER                                              │
│  │  ──────────────────────────────────────────────────────────  │
│  │  [example answer displayed here]                             │
│  │                                                              │
│  │  AI FEEDBACK                                                 │
│  │  ──────────────────────────────────────────────────────────  │
│  │  [AI feedback displayed here, or button to generate]         │
│  │                                                              │
│  └─────────────────────────────────────────────────────────────  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                        [Back to Collections]                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Tab View Features:**
- Horizontal tabs for each problem in the collection
- Active tab shows full results for that problem
- Each tab contains: Your Response, Example Answer, AI Feedback
- Clicking "Problem 2" tab switches to that problem's results
- Tabs are scrollable horizontally if many problems

**Recording Completion:**
- When user reaches this page, insert into `user_collection_completions` table
- Clear collection session from `sessionStorage`

---

### Collections Page (`/collections`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Collections                               [+ Create Custom]    │
│  Master case interviews with curated problem sets               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  YOUR CUSTOM COLLECTIONS                             (if any)   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│  │Custom 1 │ │Custom 2 │ │Custom 3 │             ← scroll      │
│  └─────────┘ └─────────┘ └─────────┘                          │
│                                                                 │
│  RECOMMENDED FOR YOU                                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│  │ Based   │ │ on your │ │  role   │             ← scroll      │
│  └─────────┘ └─────────┘ └─────────┘                          │
│                                                                 │
│  CONSULTING                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │         │ │         │ │         │ │         │  ← scroll     │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                                                                 │
│  INVESTMENT BANKING                                             │
│  ┌─────────┐ ┌─────────┐                                      │
│  │         │ │         │                         ← scroll       │
│  └─────────┘ └─────────┘                                      │
│                                                                 │
│  MARKET SIZING                                                  │
│  ...                                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Sections (in order):**
1. Your Custom Collections (if any exist in localStorage)
2. Recommended For You (`is_featured` collections in shuffled order)
3. Job Type sections: Consulting, IB, PE, PM, Corporate Strategy, Tech
4. Specialized sections: Brain Teasers, Behavioral, Market Sizing, Profitability, Technical

**Recommended Logic:**
- If user has a `target_role`, show featured collections that include that role in `target_roles`
- If user has no role or skipped onboarding, show all `is_featured` collections shuffled
- Always shuffle order to keep it fresh

---

### Dashboard Completed Collections

```
┌─────────────────────────────────────────────────────────────────┐
│  COMPLETED COLLECTIONS                                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │ ✓ Market Sizing│  │ ✓ Brain Teaser │  │ ✓ PE Bootcamp  │    │
│  │   Fundamentals │  │   Challenge    │  │                │    │
│  │  Jan 24, 2026  │  │  Jan 20, 2026  │  │  Jan 15, 2026  │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                 │
│                       [Browse Collections]                      │
└─────────────────────────────────────────────────────────────────┘
```

**Card Shows:**
- Green checkmark + collection name
- Completion date (from `user_collection_completions.completed_at`)
- Click card to view collection completion page with results

---

## Phase 4: File Structure

### New Files to Create

| File | Purpose |
|------|---------|
| **Pages** | |
| `app/collections/page.tsx` | Collections listing page |
| `app/collections/[slug]/page.tsx` | Collection detail page |
| `app/collections/[slug]/complete/page.tsx` | Completion page with tabbed results |
| **API Routes** | |
| `app/api/collections/route.ts` | List all collections |
| `app/api/collections/[slug]/route.ts` | Get single collection |
| `app/api/collections/complete/route.ts` | Mark collection complete |
| `app/api/user/preferences/route.ts` | Get/set onboarding preferences |
| **Components** | |
| `components/collections/CollectionCard.tsx` | Collection card with ring |
| `components/collections/CollectionRing.tsx` | SVG ring progress indicator |
| `components/collections/CollectionSection.tsx` | Horizontal scroll section |
| `components/collections/CollectionOverlay.tsx` | Overlay during collection (minimizable)
| `components/collections/ExitConfirmModal.tsx` | Exit confirmation |
| `components/collections/CreateCustomModal.tsx` | Create custom collection |
| `components/collections/CompletionResultsTabs.tsx` | Tabbed results view on completion page |
| `components/onboarding/OnboardingModal.tsx` | Onboarding flow |
| `components/onboarding/RoleSelector.tsx` | Role selection cards |
| `components/onboarding/RecommendedCollections.tsx` | Post-onboarding recommendations |
| `components/dashboard/CompletedCollections.tsx` | Dashboard completed section |
| **Hooks/Context** | |
| `lib/context/CollectionContext.tsx` | Active collection state |
| `lib/hooks/useCollection.ts` | Collection logic |
| `lib/hooks/useCollectionSession.ts` | sessionStorage session management |
| `lib/hooks/useCustomCollections.ts` | localStorage custom collections |
| `lib/hooks/useOnboarding.ts` | Onboarding state |

### Files to Remove (Queue System)

| File | Reason |
|------|--------|
| `lib/context/QueueContext.tsx` | Replaced by CollectionContext |
| `lib/hooks/useQueue.ts` | Replaced by useCollection |
| `components/queue/QueueOverlay.tsx` | Replaced by CollectionOverlay |
| `components/queue/QueueView.tsx` | Removed |
| `components/queue/QueueCard.tsx` | Removed |
| `components/queue/QueueProgress.tsx` | Removed |
| `components/queue/QueueComplete.tsx` | Replaced by completion page |
| `components/queue/AddToQueueBanner.tsx` | Removed |

### Files to Modify

| File | Changes |
|------|---------|
| `types/index.ts` | Add collection + preference types |
| `app/dashboard/page.tsx` | Add onboarding trigger, completed collections |
| `app/layout.tsx` | Replace QueueProvider with CollectionProvider |
| `components/layout/Nav.tsx` | Add Collections link, remove Queue |
| `app/problems/page.tsx` | Remove queue view toggle |
| `app/problems/[id]/page.tsx` | Update for collection mode |
| `app/problems/[id]/results/page.tsx` | Update for collection flow |

---

## Phase 5: Onboarding Flow

> **See `onboarding_implementation.md` for detailed onboarding specifications.**

### Summary

- **2-step flow** (Role Selection → Recommended Collections)
- Triggers on first dashboard visit (no `onboarding_completed_at`)
- User can skip at any step → marked complete, never shows again
- "Just exploring? Skip for now" saves `other` as target_role
- User can edit target_role later from Dashboard settings

---

## Phase 6: Implementation Order

1. **Database migration** — Collections table + user_collection_completions table
2. **Types** — Add TypeScript definitions (Collection, CollectionSession, etc.)
3. **Remove queue system** — Delete all queue files
4. **Session hook** — `useCollectionSession` for sessionStorage management
5. **Collection context/hooks** — Core state management
6. **API routes** — Collections CRUD + complete endpoint
7. **Collections page** — Listing with sections
8. **Collection detail page** — View + Start
9. **Collection overlay** — Minimizable overlay during collection flow
10. **Problem page updates** — Auto-advance on submit (no results shown)
11. **Completion page** — Tabbed results view
12. **Onboarding modal** — 2-step flow (see onboarding_implementation.md)
13. **Dashboard updates** — Completed collections section + preferences
14. **Custom collections** — Create + manage in localStorage
15. **Nav updates** — Add Collections, remove queue references

---

## Open Questions (Resolved)

| Question | Answer |
|----------|--------|
| Terminology | Collection |
| Collection Completion | Boolean — has user finished collection? |
| Collection Attempted | Percentage — how many problems completed from user_responses |
| Completion condition | Must play through entire collection AND have 100% attempted |
| Ring colors | Gray (0%), Blue (partial), Green (complete) |
| Session persistence | `sessionStorage` — survives refresh, cleared on nav away |
| Badges | **Removed entirely** |
| Exit page | **Removed** — just return to collections listing |
| Skip behavior | Allowed only if problem already completed; prevents collection completion otherwise |
| Admin interface | None — manage via Supabase |
| Queue system | Completely removed |
| Custom collections | localStorage, own section, green checkmark on complete |
| Onboarding skip | Never ask again |
| Recommendations | `is_featured` collections shuffled |
| Mid-collection results | None — results only shown on completion page |
| Auto-advance | Submitting problem auto-goes to next, no "Next" button |

---

## Notes

- This replaces the entire queue system
- All "queue" terminology becomes "collection"
- Queue overlay → Collection overlay (minimizable)
- Queue view on /problems → removed
- Custom collections = what queues used to be (localStorage)
- Pre-made collections = curated by you (database)
- No separate exit page — exit just returns to /collections
- No individual problem results during collection — all shown at end
