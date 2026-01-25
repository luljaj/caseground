# Courses & Onboarding Implementation Plan

## Overview

Add a courses/learning paths system to Caseground with:
1. **Onboarding flow** - Role and timeline selection on first dashboard visit
2. **Courses page** - Browse and enroll in curated courses
3. **Progress tracking** - Track user progress through courses
4. **Admin interface** - Create and manage courses

---

## Terminology Decision

> **TODO**: Decide between "Course" or "Learning Path"
> 
> Current plan uses **"Course"** throughout. Replace if "Learning Path" is preferred.

---

## Phase 1: Database Schema

### Migration: `008_courses_schema.sql`

```sql
-- ============================================
-- 1. USER PREFERENCES (Onboarding data)
-- ============================================

-- Add onboarding columns to existing users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS target_role text,
  ADD COLUMN IF NOT EXISTS timeline text,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- Valid target roles (for reference, not enforced via CHECK to allow flexibility)
-- 'consulting', 'pm', 'ib', 'pe', 'corporate_strategy', 'tech'

-- Valid timelines
-- 'urgent' (<2 weeks), 'standard' (1-2 months), 'exploring' (no rush)

-- ============================================
-- 2. COURSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  slug text UNIQUE NOT NULL,              -- URL-friendly identifier
  name text NOT NULL,                      -- Display name
  description text,                        -- Short description
  long_description text,                   -- Full description for course page
  
  -- Categorization
  category text NOT NULL,                  -- 'fundamentals', 'advanced', 'bootcamp', 'specialized'
  target_roles text[] DEFAULT '{}',        -- Which roles this course is for
  skill_focus text,                        -- Primary skill: 'market-sizing', 'profitability', etc.
  difficulty text DEFAULT 'intermediate',  -- 'beginner', 'intermediate', 'advanced'
  
  -- Content
  problem_ids uuid[] NOT NULL DEFAULT '{}', -- Ordered list of question IDs
  estimated_time_minutes integer,           -- Total estimated completion time
  
  -- Display
  sort_order integer DEFAULT 0,            -- For manual ordering within categories
  is_featured boolean DEFAULT false,       -- Show in featured section
  is_published boolean DEFAULT false,      -- Only published courses are visible
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_courses_featured ON public.courses(is_featured) WHERE is_featured = true;

-- RLS: Courses readable by all, writable by admin (service role)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Courses are publicly readable"
  ON public.courses FOR SELECT USING (is_published = true);

-- ============================================
-- 3. USER COURSE PROGRESS
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  
  -- Progress tracking
  current_problem_index integer DEFAULT 0,  -- Which problem they're on (0-indexed)
  completed_problem_ids uuid[] DEFAULT '{}', -- Problems they've completed
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,                  -- NULL until course is finished
  
  -- Stats
  total_time_spent_seconds integer DEFAULT 0,
  
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_user_course_progress_user ON public.user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_active 
  ON public.user_course_progress(user_id, course_id) 
  WHERE completed_at IS NULL;

-- RLS: Users can only access their own progress
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own course progress"
  ON public.user_course_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own course progress"
  ON public.user_course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own course progress"
  ON public.user_course_progress FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Get course progress percentage
CREATE OR REPLACE FUNCTION public.get_course_progress_percent(
  p_completed_count integer,
  p_total_count integer
)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN p_total_count = 0 THEN 0
    ELSE ROUND((p_completed_count::numeric / p_total_count) * 100)::integer
  END
$$;
```

---

## Phase 2: TypeScript Types

### Add to `/types/index.ts`

```typescript
// ============================================
// USER PREFERENCES (Onboarding)
// ============================================

export type TargetRole = 
  | 'consulting'
  | 'pm'
  | 'ib'
  | 'pe'
  | 'corporate_strategy'
  | 'tech';

export type Timeline = 
  | 'urgent'      // <2 weeks
  | 'standard'    // 1-2 months  
  | 'exploring';  // No rush

export const TARGET_ROLE_LABELS: Record<TargetRole, string> = {
  consulting: 'Management Consulting',
  pm: 'Product Management',
  ib: 'Investment Banking',
  pe: 'Private Equity',
  corporate_strategy: 'Corporate Strategy',
  tech: 'Tech / Strategy',
};

export const TIMELINE_LABELS: Record<Timeline, { label: string; description: string }> = {
  urgent: { label: 'Less than 2 weeks', description: 'Fast-track preparation' },
  standard: { label: '1-2 months', description: 'Balanced preparation' },
  exploring: { label: 'Just exploring', description: 'Build skills at your pace' },
};

// ============================================
// COURSES
// ============================================

export type CourseCategory = 
  | 'fundamentals'
  | 'advanced'
  | 'bootcamp'
  | 'specialized';

export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Course {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  long_description: string | null;
  category: CourseCategory;
  target_roles: TargetRole[];
  skill_focus: string | null;
  difficulty: CourseDifficulty;
  problem_ids: string[];
  estimated_time_minutes: number | null;
  sort_order: number;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  current_problem_index: number;
  completed_problem_ids: string[];
  started_at: string;
  completed_at: string | null;
  total_time_spent_seconds: number;
}

// Extended course with user's progress
export interface CourseWithProgress extends Course {
  progress: {
    started: boolean;
    completed: boolean;
    completedCount: number;
    totalCount: number;
    percentComplete: number;
    currentProblemIndex: number;
  } | null;
}

// User preferences from onboarding
export interface UserPreferences {
  target_role: TargetRole | null;
  timeline: Timeline | null;
  onboarding_completed_at: string | null;
}
```

---

## Phase 3: API Routes

### 3.1 New Route: `/app/api/courses/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/courses - List all published courses with user progress
export async function GET() {
  const supabase = await createSupabaseServerClient();
  
  // Get current user (optional - for progress)
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch published courses
  const { data: courses, error } = await supabase
    .from("courses")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // If user is logged in, fetch their progress
  let progressMap: Record<string, UserCourseProgress> = {};
  
  if (user) {
    const { data: progress } = await supabase
      .from("user_course_progress")
      .select("*")
      .eq("user_id", user.id);
    
    if (progress) {
      progressMap = Object.fromEntries(
        progress.map(p => [p.course_id, p])
      );
    }
  }
  
  // Combine courses with progress
  const coursesWithProgress = courses.map(course => ({
    ...course,
    progress: progressMap[course.id] ? {
      started: true,
      completed: progressMap[course.id].completed_at !== null,
      completedCount: progressMap[course.id].completed_problem_ids.length,
      totalCount: course.problem_ids.length,
      percentComplete: Math.round(
        (progressMap[course.id].completed_problem_ids.length / course.problem_ids.length) * 100
      ),
      currentProblemIndex: progressMap[course.id].current_problem_index,
    } : null,
  }));
  
  return NextResponse.json({ courses: coursesWithProgress });
}
```

### 3.2 New Route: `/app/api/courses/[slug]/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/courses/[slug] - Get single course with problems
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch course
  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();
  
  if (error || !course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  
  // Fetch problems in course
  const { data: problems } = await supabase
    .from("questions")
    .select("id, number, title, prompt, track, category, suggested_time")
    .in("id", course.problem_ids);
  
  // Order problems according to course.problem_ids order
  const orderedProblems = course.problem_ids
    .map(id => problems?.find(p => p.id === id))
    .filter(Boolean);
  
  // Fetch user progress if logged in
  let progress = null;
  if (user) {
    const { data } = await supabase
      .from("user_course_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .single();
    
    if (data) {
      progress = {
        started: true,
        completed: data.completed_at !== null,
        completedCount: data.completed_problem_ids.length,
        totalCount: course.problem_ids.length,
        percentComplete: Math.round(
          (data.completed_problem_ids.length / course.problem_ids.length) * 100
        ),
        currentProblemIndex: data.current_problem_index,
        completedProblemIds: data.completed_problem_ids,
      };
    }
  }
  
  return NextResponse.json({ 
    course: { ...course, progress },
    problems: orderedProblems,
  });
}
```

### 3.3 New Route: `/app/api/courses/[slug]/enroll/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST /api/courses/[slug]/enroll - Start/resume a course
export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Get course
  const { data: course } = await supabase
    .from("courses")
    .select("id, problem_ids")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();
  
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  
  // Check for existing progress
  const { data: existing } = await supabase
    .from("user_course_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .single();
  
  if (existing) {
    // Already enrolled - return current problem
    const nextProblemId = course.problem_ids[existing.current_problem_index];
    return NextResponse.json({ 
      enrolled: true,
      resuming: true,
      nextProblemId,
      currentIndex: existing.current_problem_index,
    });
  }
  
  // Create new enrollment
  const { error: insertError } = await supabase
    .from("user_course_progress")
    .insert({
      user_id: user.id,
      course_id: course.id,
      current_problem_index: 0,
      completed_problem_ids: [],
    });
  
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  
  return NextResponse.json({
    enrolled: true,
    resuming: false,
    nextProblemId: course.problem_ids[0],
    currentIndex: 0,
  });
}
```

### 3.4 New Route: `/app/api/courses/progress/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST /api/courses/progress - Update progress after completing a problem
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { course_id, problem_id, time_spent_seconds } = await request.json();
  
  if (!course_id || !problem_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  
  // Get current progress
  const { data: progress, error: fetchError } = await supabase
    .from("user_course_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_id", course_id)
    .single();
  
  if (fetchError || !progress) {
    return NextResponse.json({ error: "Not enrolled in course" }, { status: 400 });
  }
  
  // Get course to check total problems
  const { data: course } = await supabase
    .from("courses")
    .select("problem_ids")
    .eq("id", course_id)
    .single();
  
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  
  // Update progress
  const completedIds = progress.completed_problem_ids.includes(problem_id)
    ? progress.completed_problem_ids
    : [...progress.completed_problem_ids, problem_id];
  
  const nextIndex = Math.min(
    progress.current_problem_index + 1,
    course.problem_ids.length - 1
  );
  
  const isComplete = completedIds.length >= course.problem_ids.length;
  
  const { error: updateError } = await supabase
    .from("user_course_progress")
    .update({
      completed_problem_ids: completedIds,
      current_problem_index: nextIndex,
      completed_at: isComplete ? new Date().toISOString() : null,
      total_time_spent_seconds: progress.total_time_spent_seconds + (time_spent_seconds || 0),
    })
    .eq("id", progress.id);
  
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  
  return NextResponse.json({
    success: true,
    isComplete,
    nextProblemId: isComplete ? null : course.problem_ids[nextIndex],
    completedCount: completedIds.length,
    totalCount: course.problem_ids.length,
  });
}
```

### 3.5 New Route: `/app/api/user/preferences/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/user/preferences - Get user preferences
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { data: profile } = await supabase
    .from("users")
    .select("target_role, timeline, onboarding_completed_at")
    .eq("id", user.id)
    .single();
  
  return NextResponse.json({ preferences: profile });
}

// POST /api/user/preferences - Save user preferences (onboarding)
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { target_role, timeline } = await request.json();
  
  const { error: updateError } = await supabase
    .from("users")
    .update({
      target_role,
      timeline,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
```

---

## Phase 4: Onboarding Flow

### 4.1 New Component: `/components/onboarding/OnboardingModal.tsx`

Modal that appears on first dashboard visit. Three steps:
1. **Role Selection** - Card-based single select
2. **Timeline Selection** - Card-based single select  
3. **Recommended Courses** - Show 3-4 courses based on role

**Key features:**
- Full-screen modal overlay
- Step indicator (1/3, 2/3, 3/3)
- Smooth transitions between steps
- "Skip for now" option
- Stores preferences via `/api/user/preferences`

### 4.2 Hook: `/lib/hooks/useOnboarding.ts`

```typescript
import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

export function useOnboarding() {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function checkOnboarding() {
      if (!user) {
        setLoading(false);
        return;
      }
      
      const res = await fetch("/api/user/preferences");
      if (res.ok) {
        const { preferences } = await res.json();
        setNeedsOnboarding(!preferences?.onboarding_completed_at);
      }
      setLoading(false);
    }
    
    checkOnboarding();
  }, [user]);
  
  return { needsOnboarding, loading, setNeedsOnboarding };
}
```

### 4.3 Update: `/app/dashboard/page.tsx`

Add onboarding modal trigger:

```typescript
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import OnboardingModal from "@/components/onboarding/OnboardingModal";

// Inside component:
const { needsOnboarding, setNeedsOnboarding } = useOnboarding();

// In render:
{needsOnboarding && (
  <OnboardingModal onComplete={() => setNeedsOnboarding(false)} />
)}
```

---

## Phase 5: Courses Page

### 5.1 New Page: `/app/courses/page.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Courses                                                        │
│  Master case interviews with structured learning paths          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FEATURED                                              [See All]│
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ Course 1│ │ Course 2│ │ Course 3│ │ Course 4│   ← scroll   │
│  │ ████░░░ │ │ ░░░░░░░ │ │ █████░░ │ │ ░░░░░░░ │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                                                                 │
│  FUNDAMENTALS                                          [See All]│
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│  │ Market  │ │ Profit  │ │ Brain   │            ← scroll       │
│  │ Sizing  │ │ ability │ │ teasers │                          │
│  └─────────┘ └─────────┘ └─────────┘                          │
│                                                                 │
│  ADVANCED                                              [See All]│
│  ┌─────────┐ ┌─────────┐                                      │
│  │ M&A     │ │ LBO     │                        ← scroll       │
│  │ Cases   │ │ Modeling│                                      │
│  └─────────┘ └─────────┘                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Horizontal scrollable sections by category
- Course cards with progress bars
- "Continue" button for in-progress courses
- "Start" button for new courses
- Difficulty badges
- Estimated time display

### 5.2 New Component: `/components/courses/CourseCard.tsx`

Card displaying:
- Course name
- Description (truncated)
- Difficulty badge
- Problem count and estimated time
- Progress bar (if started)
- "Start" / "Continue" button

### 5.3 New Component: `/components/courses/CourseSection.tsx`

Horizontal scrollable section with:
- Section title
- "See All" link (optional)
- Scrollable container of CourseCards
- Scroll indicators (fade on edges)

### 5.4 New Page: `/app/courses/[slug]/page.tsx`

Course detail page showing:
- Course header (name, description, stats)
- Problem list with completion indicators
- "Start Course" / "Continue" / "Restart" button
- Back to courses link

---

## Phase 6: Admin Interface

### 6.1 New Page: `/app/admin/courses/page.tsx`

**Protected route** (check for admin role or specific email)

Features:
- List all courses (published and unpublished)
- Create new course button
- Edit/Delete actions
- Publish/Unpublish toggle

### 6.2 New Page: `/app/admin/courses/[id]/edit/page.tsx`

Course editor with:
- Basic info (name, slug, description)
- Category and difficulty dropdowns
- Target roles multi-select
- Problem selector (search and add from questions)
- Drag-to-reorder problems
- Preview mode
- Publish toggle

### 6.3 Admin API Routes

- `GET /api/admin/courses` - List all courses (including unpublished)
- `POST /api/admin/courses` - Create course
- `PUT /api/admin/courses/[id]` - Update course
- `DELETE /api/admin/courses/[id]` - Delete course

**Note:** These routes need admin authentication check.

---

## Phase 7: Integration Points

### 7.1 Dashboard Updates

Add "Active Course" card to dashboard:

```
┌────────────────────────────────────────┐
│  CURRENT COURSE                        │
│  Market Sizing Fundamentals            │
│  ████████░░░░░░░░░░░░░░  3/8 complete  │
│                                        │
│  [Continue]           [Switch Course]  │
└────────────────────────────────────────┘
```

### 7.2 Problem Page Updates

When user is in a course:
- Show course context indicator
- After submission, offer "Next in Course" option
- Track time for course progress

### 7.3 Navigation Updates

Add "Courses" link to Nav component (after "Problems", before "Dashboard").

---

## File Summary

### New Files

| File | Purpose |
|------|---------|
| `supabase/migrations/008_courses_schema.sql` | Database schema |
| `app/courses/page.tsx` | Courses listing page |
| `app/courses/[slug]/page.tsx` | Course detail page |
| `app/admin/courses/page.tsx` | Admin course list |
| `app/admin/courses/[id]/edit/page.tsx` | Admin course editor |
| `app/api/courses/route.ts` | List courses |
| `app/api/courses/[slug]/route.ts` | Get course detail |
| `app/api/courses/[slug]/enroll/route.ts` | Enroll in course |
| `app/api/courses/progress/route.ts` | Update progress |
| `app/api/user/preferences/route.ts` | User preferences |
| `app/api/admin/courses/route.ts` | Admin course CRUD |
| `components/courses/CourseCard.tsx` | Course card component |
| `components/courses/CourseSection.tsx` | Scrollable section |
| `components/courses/CourseProgress.tsx` | Progress bar |
| `components/onboarding/OnboardingModal.tsx` | Onboarding flow |
| `components/onboarding/RoleSelector.tsx` | Role selection step |
| `components/onboarding/TimelineSelector.tsx` | Timeline step |
| `lib/hooks/useOnboarding.ts` | Onboarding state hook |

### Modified Files

| File | Changes |
|------|---------|
| `types/index.ts` | Add course/preference types |
| `app/dashboard/page.tsx` | Add onboarding trigger, active course card |
| `components/layout/Nav.tsx` | Add Courses link |
| `app/problems/[id]/page.tsx` | Course context indicator |
| `app/problems/[id]/results/page.tsx` | "Next in Course" option |

---

## Implementation Order

1. **Database migration** - Create tables
2. **Types** - Add TypeScript definitions
3. **API routes** - Courses + preferences
4. **Courses page** - Basic listing
5. **Course detail page** - View course problems
6. **Onboarding modal** - Role/timeline selection
7. **Dashboard integration** - Active course card
8. **Admin interface** - Course management
9. **Problem page integration** - Course flow

---

## Design Notes

- Match existing Caseground aesthetic (zinc gradients, dark theme)
- Use existing Button, Card patterns from `components/ui/`
- Course cards should feel like premium, curated content
- Progress bars use accent color (#3B82F6 or violet)
- Horizontal scroll sections use subtle edge fades
- Mobile responsive with vertical layout on small screens

---

## Questions to Resolve

1. [ ] Final terminology: "Course" or "Learning Path"?
2. [ ] Admin access: Based on email whitelist or role column?
3. [ ] Should completed courses be re-startable?
4. [ ] Show course completion certificates/badges?
5. [ ] Recommend courses based on user's weak areas (from AI feedback)?
