# Caseground MVP Spec

## Overview

A Leetcode-style practice platform for business interview prep. Three tracks: Estimations, Behaviorals, and Reasoning Puzzles. Users practice questions with a timer, submit text or speech responses, then see a rubric and example answer with optional AI feedback.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS (dark mode, navy/white palette)
- **Deployment:** Vercel
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth (Google OAuth)
- **Speech:** Web Speech API
- **AI Feedback:** OpenRouter API (configurable model)

## Supabase Setup

Project initialized and linked at `D:\Caseground`:

```bash
supabase login
supabase init
supabase link --project-ref nseongqdfkcggvfucyvu
```

Migrations in `supabase/migrations/`. Deploy with `supabase db push`.

---

## Architecture

### Project Structure

```
caseground/
├── app/
│   ├── layout.tsx              # Root layout, nav, auth provider
│   ├── page.tsx                # Landing page
│   ├── problems/
│   │   ├── page.tsx            # Problem list with filters/pagination
│   │   └── [id]/
│   │       ├── page.tsx        # Question page (split/stacked view)
│   │       └── results/
│   │           └── page.tsx    # Results page
│   └── dashboard/
│       └── page.tsx            # User stats + heatmap
├── components/
│   ├── layout/
│   │   ├── Nav.tsx
│   │   ├── Logo.tsx
│   │   └── AuthButton.tsx
│   ├── problems/
│   │   ├── ProblemList.tsx
│   │   ├── ProblemFilters.tsx
│   │   ├── ProblemRow.tsx
│   │   └── Pagination.tsx
│   ├── question/
│   │   ├── QuestionPane.tsx
│   │   ├── SubmissionsTab.tsx
│   │   ├── ResponseInput.tsx
│   │   ├── SpeechToggle.tsx
│   │   ├── Timer.tsx
│   │   └── SubmitButton.tsx
│   ├── results/
│   │   ├── RubricChecklist.tsx
│   │   ├── ExampleAnswer.tsx
│   │   └── AIFeedback.tsx
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   └── Heatmap.tsx
│   └── ui/
│       ├── Modal.tsx
│       ├── Button.tsx
│       ├── Spinner.tsx
│       └── Input.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── middleware.ts       # Auth middleware
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTimer.ts
│   │   ├── useSpeechToText.ts
│   │   └── useQuestions.ts
│   └── utils/
│       ├── cn.ts               # Class name utility
│       └── formatTime.ts
├── types/
│   └── index.ts                # TypeScript types
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── config.toml
├── public/
│   └── ...
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## Database Schema

### questions

```sql
create table questions (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique,
  track text not null check (track in ('estimations', 'behaviorals', 'reasoning')),
  category text not null,
  title text not null,
  prompt text not null,
  description text not null,
  rubric jsonb not null,  -- Array of checklist items
  example_answer text not null,
  suggested_time integer not null,
  companies text[] default '{}',
  created_at timestamp with time zone default now()
);

create index idx_questions_track on questions(track);
create index idx_questions_category on questions(category);
```

### users

```sql
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  ai_credits integer default 5,
  created_at timestamp with time zone default now()
);
```

### user_responses

```sql
create table user_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  response text not null,
  time_taken integer,
  ai_feedback text,
  created_at timestamp with time zone default now()
);

create index idx_user_responses_user on user_responses(user_id);
create index idx_user_responses_question on user_responses(question_id);
create index idx_user_responses_created on user_responses(created_at);
```

### Row Level Security

```sql
-- Users can only read/write their own data
alter table users enable row level security;
alter table user_responses enable row level security;

create policy "Users can view own profile"
  on users for select using (auth.uid() = id);

create policy "Users can update own profile"
  on users for update using (auth.uid() = id);

create policy "Users can view own responses"
  on user_responses for select using (auth.uid() = user_id);

create policy "Users can insert own responses"
  on user_responses for insert with check (auth.uid() = user_id);

-- Questions are public
alter table questions enable row level security;

create policy "Questions are publicly readable"
  on questions for select using (true);
```

### Database Trigger (Auto-create user on signup)

```sql
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

---

## TypeScript Types

```typescript
// types/index.ts

export type Track = 'estimations' | 'behaviorals' | 'reasoning';

export type EstimationsCategory = 'market-sizing' | 'volume' | 'cost-revenue';
export type BehavioralsCategory = 'easy' | 'medium' | 'hard';
export type ReasoningCategory =
  | 'logic'
  | 'Financial Statements'
  | 'Valuation'
  | 'DCF Analysis'
  | 'Merger Models'
  | 'LBO Models';

export type Category = EstimationsCategory | BehavioralsCategory | ReasoningCategory;

export interface RubricItem {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  number: number;
  track: Track;
  category: Category;
  title: string;
  prompt: string;
  description: string;
  rubric: RubricItem[];
  example_answer: string;
  suggested_time: number;
  companies: string[];
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  ai_credits: number;
  created_at: string;
}

export interface UserResponse {
  id: string;
  user_id: string;
  question_id: string;
  response: string;
  time_taken: number | null;
  ai_feedback: string | null;
  created_at: string;
}

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface FilterParams {
  track?: Track;
  category?: Category;
  completed?: boolean;
}

export interface SortParams {
  field: 'number' | 'track';
  direction: 'asc' | 'desc';
}
```

---

## Routes & Pages

### `/` — Landing Page

- Dark navy background
- Product headline (copy TBD)
- Product description (copy TBD)
- CTA button → `/problems`
- No auth required

### `/problems` — Problem List

- Filter bar: track dropdown, category dropdown, "Not done" toggle
- Sort options: by number, by track
- Table columns: number, title + prompt preview (truncated), track, category, checkmark if attempted
- 30 problems per page
- Numbered pagination (1, 2, 3...)
- No auth required to view

### `/problems/[id]` — Question Page

**Desktop layout:**
```
+---------------------------+---------------------------+
|   Left Pane               |   Right Pane              |
|   - Tab: Question         |   - Text input box        |
|   - Tab: Submissions      |   - Mic toggle            |
|                           |   (disabled while talking)|
+---------------------------+---------------------------+
|              Timer (top center)                       |
|   [Edit time] [Start/Pause] [Stop]                   |
|              [Submit] (bottom right)                  |
+-------------------------------------------------------+
```

**Mobile layout:**
```
+-------------------------------------------------------+
|   Question prompt / Submissions tabs                  |
+-------------------------------------------------------+
|   Timer (with controls)                               |
+-------------------------------------------------------+
|   Text input box                                      |
|   [Mic toggle]                                        |
+-------------------------------------------------------+
|   [Submit]                                            |
+-------------------------------------------------------+
```

**Left Pane Tabs:**
- "Question" tab: shows prompt
- "Submissions" tab: list of past attempts for this question (if authed)

**Timer behavior:**
- Countdown from `suggested_time` by default
- Editable time next to start button
- Start/Pause/Stop controls
- Flashes red at 0:00, stops flashing on Stop click
- Not enforced — can still submit after time runs out

**Submit behavior:**
- Empty response → nothing happens (button disabled or no-op)
- Not authed → modal popup "Sign in with Google" to save progress
- Authed → saves response, navigates to `/problems/[id]/results`

### `/problems/[id]/results` — Results Page

- User's submitted response displayed
- Rubric as checklist (3-5 items, manually checkable, not saved)
- Example strong answer
- "Get AI Feedback" button
  - Shows loading spinner while fetching
  - On success: displays feedback, decrements `ai_credits`
  - On failure: shows retry button, does not decrement credit
- "Try Again" button → back to `/problems/[id]`
- "Back to Problems" link → `/problems`

### `/dashboard` — Dashboard

- Stats: total questions attempted, AI credits remaining
- GitHub-style heatmap: full year, darker = more submissions that day
- Link to `/problems`

---

## Components Spec

### Nav

- Always visible: Logo (links to `/`), "Problems" (links to `/problems`), "Dashboard" (links to `/dashboard`)
- Right side: AuthButton

### AuthButton

- Signed out: "Sign In" → triggers Google OAuth modal
- Signed in: shows email or avatar, dropdown with "Sign Out"

### ProblemList

- Receives: questions array, user's completed question IDs
- Renders: table rows with ProblemRow

### ProblemFilters

- Track dropdown: All, Estimations, Behaviorals, Reasoning
- Category dropdown: changes options based on track selected
- "Not done" toggle checkbox
- Sort dropdown: by number (asc/desc), by track

### Pagination

- Numbered pages: 1, 2, 3... based on total count / 30
- Previous/Next arrows

### Timer

- Display: MM:SS countdown
- Controls: edit input (click to change), Start, Pause, Stop
- State: idle, running, paused, finished
- Finished state: flashes red until Stop clicked

### ResponseInput

- Textarea for typing
- Disabled while speech-to-text is active

### SpeechToggle

- Mic icon button
- Active state: pulsing indicator
- Click to start → disables textarea, starts listening
- Click again to stop → enables textarea, appends transcribed text

### RubricChecklist

- Receives: rubric items array
- Renders: checkboxes with labels
- Local state only (not saved to DB)

### AIFeedback

- Button: "Get AI Feedback (X credits left)"
- Loading: spinner
- Success: displays feedback text
- Error: "Failed to get feedback. Retry?" button

### Heatmap

- 52 weeks × 7 days grid
- Query `user_responses` grouped by date
- Color scale: 0 submissions (empty) → 5+ submissions (darkest)

---

## Auth Flow

1. User browses `/problems` without auth
2. Clicks into `/problems/[id]`, practices, clicks Submit
3. If not authed → Modal: "Sign in with Google to save your progress and get AI feedback"
4. Google OAuth via Supabase
5. On success: trigger creates user row with 5 AI credits
6. Response saved, redirect to results

---

## AI Feedback Flow

1. User on results page clicks "Get AI Feedback"
2. Check `ai_credits > 0`
3. If no credits → show "No credits remaining" (future: upsell)
4. If credits available → show spinner, call AI API
5. API payload: question prompt + user response + rubric
6. On success: display feedback, decrement `ai_credits`, save `ai_feedback` to `user_responses`
7. On failure: show retry button, do not decrement credit

---

## Design System

### Colors (Dark Mode)

```css
--background: #0a0f1a      /* Deep navy */
--surface: #141b2d         /* Card/panel background */
--border: #1e2a45          /* Subtle borders */
--text-primary: #ffffff    /* Primary text */
--text-secondary: #8892a6  /* Secondary/muted text */
--accent: #3b82f6          /* Blue accent for CTAs */
--success: #22c55e         /* Checkmarks, completed */
--warning: #f59e0b         /* Timer warning */
--error: #ef4444           /* Timer expired flash */
```

### Typography

- Font: Inter or system sans-serif
- Headings: bold, white
- Body: regular, white or secondary

### Spacing

- Consistent 4px base unit
- Page padding: 24px (mobile), 48px (desktop)

---

## API Routes (Next.js Route Handlers)

### `GET /api/questions`

- Query params: track, category, page, perPage, sort
- Returns: paginated questions array + total count

### `GET /api/questions/[id]`

- Returns: single question

### `POST /api/responses`

- Body: question_id, response, time_taken
- Requires auth
- Creates user_response record

### `GET /api/responses`

- Query params: question_id (optional)
- Requires auth
- Returns: user's responses (filtered by question if provided)

### `POST /api/feedback`

- Body: response_id
- Requires auth
- Checks credits, calls AI API, saves feedback, decrements credits
- Returns: feedback text or error

### `GET /api/user`

- Requires auth
- Returns: user profile including ai_credits

### `GET /api/stats`

- Requires auth
- Returns: total attempted, heatmap data (date + count)

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Feedback API (OpenRouter chat completions)
AI_API_URL=
AI_API_KEY=
DEFAULT_MODEL=

# App
NEXT_PUBLIC_APP_URL=
```

---

## MVP Scope Summary

**In scope:**
- Landing page (CTA + description placeholder)
- Problem list with filters, sort, pagination, completion status
- Question page with timer, text input, speech-to-text, submissions tab
- Results page with rubric checklist, example answer, AI feedback
- Dashboard with stats and heatmap
- Google OAuth
- 5 free AI credits per user

**Out of scope (future):**
- Company-specific question packs
- Payment for additional credits
- Additional OAuth providers
- Custom question creation
