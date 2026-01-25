# Onboarding Flow Implementation Plan

## Overview

A 2-step onboarding flow on a dedicated `/onboarding` page. Collects user's target role and recommends relevant collections. Full-page experience with no header.

---

## Summary of Decisions

| Decision | Answer |
|----------|--------|
| Architecture | Dedicated `/onboarding` page (not a modal) |
| Steps | 2 steps: Role selection → Recommended collections |
| Database | PostgreSQL ENUM for `target_role` |
| Roles | 8 target roles + "Just exploring" option (saves null) |
| Trigger | Sign-up always redirects to `/onboarding` |
| Completion check | Page checks if already completed, redirects to dashboard |
| Manual navigation | Allowed even after completion (for testing) |
| Header | Hidden during onboarding |
| Logo | Caseground button in top-left, links to hero page |
| Mobile | Horizontal scroll for role cards |

---

## Flow Summary

1. **Trigger**: User signs up → redirected to `/onboarding`
2. **Step 1**: Role selection (7 options including "Just exploring")
3. **Step 2**: Recommended collections based on role
4. **On Complete**: Save preferences, redirect to collection detail or collections page
5. **On Skip**: Mark as complete, redirect to dashboard

---

## Database Schema

### Using PostgreSQL ENUM for Target Roles

```sql
-- Create the enum type for target roles
CREATE TYPE target_role_enum AS ENUM (
  'consulting',
  'pm',
  'ib',
  'pe',
  'corporate_strategy',
  'tech',
  'marketing',
  'wealth_management'
);

-- Add to existing users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS target_role target_role_enum,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
```

**Benefits of using ENUM:**
- Database-level validation (can't insert invalid values)
- Type safety
- Smaller storage than text
- Self-documenting schema

**Note:** If you need to add new roles later:
```sql
ALTER TYPE target_role_enum ADD VALUE 'new_role';
```

---

## TypeScript Types

```typescript
// Must match the PostgreSQL enum exactly
export type TargetRole = 
  | 'consulting'
  | 'pm'
  | 'ib'
  | 'pe'
  | 'corporate_strategy'
  | 'tech'
  | 'marketing'
  | 'wealth_management';

// For display in UI
export const TARGET_ROLE_LABELS: Record<TargetRole, string> = {
  consulting: 'Management Consulting',
  pm: 'Product Management',
  ib: 'Investment Banking',
  pe: 'Private Equity',
  corporate_strategy: 'Corporate Strategy',
  tech: 'Tech / Strategy',
  marketing: 'Marketing / Brand Strategy',
  wealth_management: 'Wealth Management',
};

export const TARGET_ROLE_DESCRIPTIONS: Record<TargetRole, string> = {
  consulting: 'McKinsey, BCG, Bain, and boutique firms',
  pm: 'Product roles at tech companies',
  ib: 'Goldman, Morgan Stanley, JP Morgan, and boutiques',
  pe: 'KKR, Blackstone, Apollo, and growth equity',
  corporate_strategy: 'In-house strategy teams at F500',
  tech: 'Strategy and operations at tech companies',
  marketing: 'Brand management and go-to-market strategy',
  wealth_management: 'Private banking and asset management',
};

// "Just exploring" is NOT in the enum - it saves target_role as null

export interface UserPreferences {
  target_role: TargetRole | null;
  onboarding_completed_at: string | null;
}
```

---

## UI/UX Design Specification (For Figma)

> **Copy this section to use as a Figma Make prompt**

Design a 2-step onboarding flow for Caseground. Match the existing app's dark, premium, modern aesthetic.

---

### Screen 1: Role Selection

A full-page screen where users select their target career role.

**Content needed:**
- Title: "What role are you preparing for?"
- Subtitle: "Select your target role so we can recommend the most relevant practice collections."
- 8 selectable role cards:

| Role | Description |
|------|-------------|
| Management Consulting | McKinsey, BCG, Bain, and boutique firms |
| Product Management | Product roles at tech companies |
| Investment Banking | Goldman, Morgan Stanley, JP Morgan, and boutiques |
| Private Equity | KKR, Blackstone, Apollo, and growth equity |
| Corporate Strategy | In-house strategy teams at F500 |
| Tech / Strategy | Strategy and operations at tech companies |
| Marketing / Brand Strategy | Brand management and go-to-market strategy |
| Wealth Management | Private banking and asset management |

- "Just exploring" option (for users whose role isn't listed)
- "Continue" button (disabled until selection made)
- Progress indicator showing step 1 of 2
- Small Caseground logo in corner

---

### Screen 2: Recommended Collections

Shows 3 recommended collections based on the role selected.

**Content needed:**
- Back button to return to Screen 1
- Title: "Recommended for [Role Name]"
- Subtitle: "Based on your role, here are some collections to get you started."
- 3 collection cards, each showing:
  - Collection name
  - Short description
  - Stats: problem count, estimated time, difficulty level
  - "View" button
- "Skip to Dashboard" button
- "View All Collections" button
- Progress indicator showing step 2 of 2

---

## API Route

### `/app/api/user/preferences/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TargetRole } from "@/types";

// GET - Fetch user preferences
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { data: profile } = await supabase
    .from("users")
    .select("target_role, onboarding_completed_at")
    .eq("id", user.id)
    .single();
  
  return NextResponse.json({ 
    preferences: profile || { target_role: null, onboarding_completed_at: null }
  });
}

// POST - Save user preferences (complete onboarding)
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { target_role, skipped } = await request.json() as {
    target_role?: TargetRole;
    skipped?: boolean;
  };
  
  const updateData: Record<string, any> = {
    onboarding_completed_at: new Date().toISOString(),
  };
  
  // Only set target_role if not skipped
  if (!skipped && target_role) {
    updateData.target_role = target_role;
  }
  
  const { error: updateError } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", user.id);
  
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
```

---

## Hook

### `/lib/hooks/useOnboarding.ts`

```typescript
import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import type { TargetRole, UserPreferences } from "@/types";

export function useOnboarding() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  
  useEffect(() => {
    async function fetchPreferences() {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch("/api/user/preferences");
        if (res.ok) {
          const { preferences } = await res.json();
          setPreferences(preferences);
        }
      } catch (error) {
        console.error("Failed to fetch preferences:", error);
      }
      
      setLoading(false);
    }
    
    fetchPreferences();
  }, [user]);
  
  const completeOnboarding = async (targetRole: TargetRole | null, skipped = false) => {
    try {
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_role: targetRole, skipped }),
      });
      
      if (res.ok) {
        setPreferences({
          target_role: skipped ? null : targetRole,
          onboarding_completed_at: new Date().toISOString(),
        });
        return true;
      }
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }
    return false;
  };
  
  const hasCompletedOnboarding = !!preferences?.onboarding_completed_at;
  
  return { 
    loading, 
    preferences,
    hasCompletedOnboarding,
    completeOnboarding,
  };
}
```

---

## Routing Logic

### Sign-up Redirect

After sign-up, always redirect to `/onboarding`:

```typescript
// In auth callback or sign-up success handler
router.push('/onboarding');
```

### Onboarding Page Logic

```typescript
// app/onboarding/page.tsx
export default function OnboardingPage() {
  const router = useRouter();
  const { loading, hasCompletedOnboarding } = useOnboarding();
  
  useEffect(() => {
    // If already completed, redirect to dashboard
    // (But still allow manual navigation for testing - no forced redirect)
    if (!loading && hasCompletedOnboarding) {
      router.push('/dashboard');
    }
  }, [loading, hasCompletedOnboarding, router]);
  
  // ... rest of component
}
```

**Note:** Manual navigation to `/onboarding` after completion is allowed for testing purposes. The page will redirect to dashboard but won't block access entirely.

---

## Page Structure

### `/app/onboarding/page.tsx`

Full-page layout with no header:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Caseground Logo]                                                          │
│                                                                             │
│                                                                             │
│                          (Onboarding Content)                               │
│                                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **No header/nav** during onboarding
- **Caseground logo** in top-left corner
- Clicking logo → skips onboarding, navigates to hero page (`/`)
- Internal step state (not separate routes)

---

## Figma Design

> **TODO:** Add Figma design link here once finalized
> 
> Example: `[View Figma Design](https://www.figma.com/file/...)`

The implementing agent should reference the Figma design for exact:
- Colors and gradients
- Spacing and padding
- Typography (font, size, weight)
- Border radius and shadows
- Card layout and grid structure

---

## Visual Design

### Step 1: Role Selection

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Caseground]                                                               │
│                                                                             │
│                     What role are you preparing for?                        │
│                                                                             │
│              Select your target role so we can recommend                    │
│                the most relevant practice collections.                      │
│                                                                             │
│                                                                             │
│     ┌─────────────────────┐     ┌─────────────────────┐                     │
│     │                     │     │                     │                     │
│     │     Management      │     │      Product        │                     │
│     │     Consulting      │     │     Management      │                     │
│     │                     │     │                     │                     │
│     │  McKinsey, BCG,     │     │  Product roles at   │                     │
│     │  Bain, boutiques    │     │  tech companies     │                     │
│     │                     │     │                     │                     │
│     └─────────────────────┘     └─────────────────────┘                     │
│                                                                             │
│     ┌─────────────────────┐     ┌─────────────────────┐                     │
│     │                     │     │                     │                     │
│     │    Investment       │     │     Private         │                     │
│     │     Banking         │     │      Equity         │                     │
│     │                     │     │                     │                     │
│     │  Goldman, Morgan    │     │  KKR, Blackstone,   │                     │
│     │  Stanley, boutiques │     │  growth equity      │                     │
│     │                     │     │                     │                     │
│     └─────────────────────┘     └─────────────────────┘                     │
│                                                                             │
│     ┌─────────────────────┐     ┌─────────────────────┐                     │
│     │                     │     │                     │                     │
│     │    Corporate        │     │    Tech /           │                     │
│     │     Strategy        │     │    Strategy         │                     │
│     │                     │     │                     │                     │
│     │  In-house strategy  │     │  Strategy & ops at  │                     │
│     │  teams at F500      │     │  tech companies     │                     │
│     │                     │     │                     │                     │
│     └─────────────────────┘     └─────────────────────┘                     │
│                                                                             │
│                                                                             │
│                          [ Just exploring ]                                 │
│                                                                             │
│                                                                             │
│                                            [Continue →]                     │
│                                                                             │
│                               ● ○                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Note:** Exact grid layout pending final Figma design. The ASCII above shows only 6 of the 8 role cards for simplicity. The other roles are Marketing and Wealth Management.

**Desktop Layout:**
- Grid layout for the 8 main role cards (exact columns TBD from Figma)
- "Just exploring" as a smaller/subtle selectable option at the bottom (works like selecting a role)

**Mobile Layout:**
- Horizontal scroll for role cards

**Interactions:**
- Single click to select a role card
- Selected card has accent border/highlight
- "Continue" button disabled until a role is selected
- "Just exploring" is a selectable option → works like a role card, proceeds to Step 2, shows featured collections, saves `target_role` as `null`
- Press Escape → skip onboarding entirely, mark complete (no role saved), navigate to `/dashboard`
- Click Caseground logo → navigates to hero page (`/`)
- Progress dots at bottom (● ○ for step 1 of 2)

**Browser Back Button (Step 1):**
- Navigates to login page

---

### Step 2: Recommended Collections

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Caseground]                                                               │
│                                                                             │
│  [← Back]                Recommended for Consulting                         │
│                                                                             │
│                Based on your role, here are some collections                │
│                        to get you started.                                  │
│                                                                             │
│                                                                             │
│     ┌───────────────────────────────────────────────────────────────────┐   │
│     │                                                                   │   │
│     │   Market Sizing Fundamentals                                      │   │
│     │   Master the basics of market sizing estimation                   │   │
│     │                                                                   │   │
│     │   8 problems  •  45 min  •  Beginner                     [View]   │   │
│     │                                                                   │   │
│     └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│     ┌───────────────────────────────────────────────────────────────────┐   │
│     │                                                                   │   │
│     │   Profitability Deep Dive                                         │   │
│     │   Analyze profit drivers and cost structures                      │   │
│     │                                                                   │   │
│     │   10 problems  •  60 min  •  Intermediate                [View]   │   │
│     │                                                                   │   │
│     └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│     ┌───────────────────────────────────────────────────────────────────┐   │
│     │                                                                   │   │
│     │   Consulting Case Bootcamp                                        │   │
│     │   Full case practice for interview prep                           │   │
│     │                                                                   │   │
│     │   15 problems  •  90 min  •  Advanced                    [View]   │   │
│     │                                                                   │   │
│     └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                                                                             │
│               [Skip to Dashboard]         [View All Collections]            │
│                                                                             │
│                               ○ ●                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Card Design:**
- Simplified cards (no completion ring for onboarding)
- Shows: name, description, stats (problems, time, difficulty)
- "View" button to navigate to collection detail page

**Navigation:**
- "← Back" button → returns to Step 1 with previously selected role still highlighted
- "View" button → marks onboarding complete, navigates to `/collections/[slug]`
- "Skip to Dashboard" → marks onboarding complete, closes onboarding, navigates to `/dashboard`
- "View All Collections" → marks onboarding complete, navigates to `/collections`
- Click Caseground logo → navigates to hero page (`/`)
- Press Escape → same as skip to dashboard
- Progress dots at bottom (○ ● for step 2 of 2)

**Browser Back Button (Step 2):**
- Returns to Step 1 (role selection)

**Collection Selection:**
- Show collections matching user's selected role (from `target_roles` array)
- If fewer than 3 collections for role, pad with featured collections
- If "Just Exploring" selected, show featured collections
- If no collections available at all, show placeholder cards

---

### Empty Collection Placeholder

If there are no collections to show (e.g., no featured collections exist):

```
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   No collections available                                        │
│   Check back soon for curated practice sets                       │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Recommendation Logic

```typescript
async function getRecommendedCollections(targetRole: TargetRole): Promise<Collection[]> {
  // If "Just Exploring", get featured collections
  if (targetRole === 'other') {
    return getFeaturedCollections();
  }
  
  // Get collections matching user's role
  const { data: roleCollections } = await supabase
    .from("collections")
    .select("*")
    .eq("is_published", true)
    .contains("target_roles", [targetRole])
    .order("sort_order", { ascending: true })
    .limit(3);
  
  const collections = roleCollections || [];
  
  // If we have 3 or more, return first 3
  if (collections.length >= 3) {
    return collections.slice(0, 3);
  }
  
  // Pad with featured collections to always show 3
  const needed = 3 - collections.length;
  const existingIds = collections.map(c => c.id);
  
  const { data: featuredCollections } = await supabase
    .from("collections")
    .select("*")
    .eq("is_published", true)
    .eq("is_featured", true)
    .not("id", "in", `(${existingIds.join(",")})`) // Exclude already selected
    .order("sort_order", { ascending: true })
    .limit(needed);
  
  return [...collections, ...(featuredCollections || [])];
}

async function getFeaturedCollections(): Promise<Collection[]> {
  const { data } = await supabase
    .from("collections")
    .select("*")
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .limit(3);
  
  return data || [];
}
```

---

## Dashboard Integration

### Preferences Section

Add a "Preferences" section/card on the dashboard (always visible):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  PREFERENCES                                                                │
│  ───────────────────────────────────────────────────────────────────────    │
│                                                                             │
│  Target Role                                                                │
│  [▼ Management Consulting                                  ] [Save]         │
│                                                                             │
│  Used to recommend relevant collections.                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Implementation:**
- Dedicated card/section on dashboard
- Dropdown with all 7 role options
- If user skipped onboarding (no role set), show "Select a role" as placeholder
- "Save" button next to dropdown to save changes
- On save, call `POST /api/user/preferences` with new role
- Show subtle success feedback (checkmark or brief toast)

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/onboarding/page.tsx` | Main onboarding page (2-step flow) |
| `app/api/user/preferences/route.ts` | Get/set user preferences |
| `components/onboarding/RoleSelector.tsx` | Step 1: Role selection cards |
| `components/onboarding/RecommendedCollections.tsx` | Step 2: Collection cards |
| `components/dashboard/PreferencesCard.tsx` | Dashboard preferences section |
| `lib/hooks/useOnboarding.ts` | Onboarding state management |

---

## Files to Modify

| File | Changes |
|------|---------|
| `types/index.ts` | Add TargetRole enum type and labels |
| `app/dashboard/page.tsx` | Add preferences card |
| Auth callback/handler | Redirect to /onboarding after sign-up |

---

## Behavior Summary

| Action | Result |
|--------|--------|
| Sign up | Always redirect to `/onboarding` |
| Already completed onboarding | Redirect to `/dashboard` (but allow manual navigation) |
| Click Caseground logo | Navigate to hero page (`/`) |
| Press Escape (any step) | Skip onboarding, mark complete (no role saved), navigate to `/dashboard` |
| Select "Just exploring" + Continue (Step 1) | Go to Step 2, show featured collections, save `null` as role on completion |
| Select any role + Continue (Step 1) | Go to Step 2 |
| Click "← Back" (Step 2) | Return to Step 1, preserve selected role |
| Click "View" on collection (Step 2) | Mark complete, navigate to `/collections/[slug]` |
| Click "Skip to Dashboard" (Step 2) | Mark complete, navigate to `/dashboard` |
| Click "View All Collections" (Step 2) | Mark complete, navigate to `/collections` |
| Browser back (Step 2) | Return to Step 1 |
| Browser back (Step 1) | Navigate to login page |

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| User refreshes during onboarding | Page reloads at Step 1 (state not persisted) |
| User logs out and back in | If onboarding not completed, shown again |
| User manually navigates to /onboarding after completion | Allowed (for testing), but redirect to dashboard |
| No collections for selected role | Pad with featured collections |
| No featured collections exist | Show placeholder cards |
| User selects "Just Exploring" | Show featured collections on Step 2 |

---

## Notes

- This is a dedicated page, not a modal overlay
- Full-page experience with no header
- Only Caseground logo visible in top-left
- Internal step state (single route `/onboarding`, not separate routes)
- Mobile: horizontal scroll for role cards
- PostgreSQL ENUM ensures type safety at database level
- Dashboard preferences section always visible for role editing
