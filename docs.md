# Caseground Codebase Docs

This doc is the single entry point for understanding and working in this repo.
It covers architecture, data model, flows, and common tasks.

## What this is
Caseground is a Next.js 14 (App Router) MVP for interview practice. Users browse
questions, run timed drills, submit responses, and review rubric + example answers.
Google OAuth via Supabase Auth is required for saving responses and AI feedback.

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (near-black, minimal palette)
- Supabase (Postgres + Auth)
- Web Speech API (speech-to-text)
- OpenRouter API for feedback (model set via `DEFAULT_MODEL`)

## Project Structure (high level)
- `app/` App Router pages and API routes
  - `app/page.tsx` landing
  - `app/problems/page.tsx` list + filters + pagination
  - `app/problems/[id]/page.tsx` question detail + timer + input
  - `app/problems/[id]/results/page.tsx` results + rubric + AI feedback
  - `app/dashboard/page.tsx` stats + credits + type breakdown
  - `app/api/*` Next.js route handlers
- `components/` UI building blocks
  - `components/layout/*` nav + auth
  - `components/problems/*` list + filters + pagination
  - `components/question/*` prompt pane + timer + speech
  - `components/results/*` rubric + example + AI feedback
  - `components/dashboard/*` stats + breakdown chart
  - `components/ui/*` Button, Input, Modal, Spinner
- `lib/`
  - `lib/supabase/*` server/browser clients + middleware
  - `lib/hooks/*` auth, timer, speech, questions fetch
  - `lib/utils/*` small helpers
- `types/index.ts` shared types
- `supabase/migrations/*` schema + seed data

## Local Setup
1. Install deps: `npm install`
2. Create `.env.local` from `.env.example` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AI_API_URL`
   - `AI_API_KEY`
   - `DEFAULT_MODEL`
   - `NEXT_PUBLIC_APP_URL`
3. Apply migrations to remote Supabase: `supabase db push`
4. Run dev server: `npm run dev`

Notes:
- Supabase keys are in the Supabase dashboard: Project Settings -> API.
- Google OAuth must be enabled in Supabase Auth -> Providers -> Google.
- `AI_API_URL` should point to OpenRouter chat completions (e.g. `https://openrouter.ai/api/v1/chat/completions`).
- `DEFAULT_MODEL` should be an OpenRouter model id (e.g. `openai/gpt-4o-mini`).

## Database Schema (current)
Table: `public.questions`
- `id` uuid PK
- `number` integer unique
- `track` enum: `estimations | behaviorals | reasoning`
- `category` enum (estimations: `market-sizing | volume | cost-revenue`; behaviorals: `easy | medium | hard`; reasoning: `logic | Financial Statements | Valuation | DCF Analysis | Merger Models | LBO Models`)
- `title` text (short 2-3 word title)
- `prompt` text (main question prompt)
- `description` text (extended clarification)
- `rubric` jsonb (array of `{ id, text }` items)
- `example_answer` text
- `suggested_time` integer (minutes)
- `companies` text[]
- `created_at` timestamp

Table: `public.users`
- `id` uuid PK (auth.users FK)
- `email` text
- `username` text
- `ai_credits` integer (default 5)
- `created_at` timestamp

Table: `public.user_responses`
- `id` uuid PK
- `user_id` uuid (FK users)
- `question_id` uuid (FK questions)
- `response` text
- `time_taken` integer (seconds)
- `ai_feedback` text
- `created_at` timestamp

RLS:
- Users can read/write their own `users` and `user_responses` rows.
- `questions` are publicly readable.

Triggers:
- `handle_new_user` inserts a row into `public.users` on new auth signup.

## Supabase Migrations
- `001_initial_schema.sql` creates tables, RLS, trigger.
- `002_seed_questions.sql` inserts 10 seed questions (upsert on `number`).
- `003_add_question_title_description.sql` adds `title` + `description`.

### Adding or updating questions
- Prefer SQL in a new migration to keep history.
- Required fields: `number`, `track`, `category`, `title`, `prompt`, `description`,
  `rubric`, `example_answer`, `suggested_time`, `companies`.
- When using the seed approach, include `on conflict (number) do update` to avoid
  duplicates.

## API Routes
All routes live in `app/api/*`.

- `GET /api/questions`
  - Query: `track`, `category`, `page`, `perPage`, `sort`, `direction`
  - Returns `{ questions, total }`
- `GET /api/questions/[id]`
  - Returns `{ question }`
- `GET /api/responses`
  - Requires auth. Optional `question_id` filter.
  - Returns `{ responses }`
- `POST /api/responses`
  - Requires auth. Body: `{ question_id, response, time_taken }`
  - Returns the created response row
- `POST /api/feedback`
  - Requires auth. Body: `{ response_id }`
  - Checks `ai_credits`, calls external AI API, saves `ai_feedback`, decrements credit
  - Returns `{ feedback, creditsRemaining }`
- `GET /api/user`
  - Requires auth. Returns `{ user }`
- `GET /api/stats`
  - Requires auth. Returns `{ totalAttempted, aiCredits, byType, subscription }`

## Auth Flow
- Client uses Supabase OAuth (Google) from `components/layout/AuthProvider.tsx`.
- Session is stored in cookies, refreshed via `middleware.ts`.
- Question submission requires auth; unauthenticated users see a modal.

## UI Flows
- **Landing** (`/`): intro + CTA to problems
- **Problems** (`/problems`): table-first list with title + prompt preview, filters + sorting + pagination, optional "Not done" toggle
- **Collections**: standardized practice sets (curated in DB + custom local) with ordered playback and completion tracking
- **Question** (`/problems/[id]`):
  - Question tab (title, prompt, description)
  - Submissions tab (requires auth)
  - Timer and response input (speech-to-text supported)
- **Results** (`/problems/[id]/results`): response summary + rubric + example + AI feedback
- **Dashboard** (`/dashboard`): total attempted + credits + type breakdown

## Collections
- **Standardized practice mode:** collections replace queue mode for multi-problem sessions.
- **Sources:** curated collections live in Supabase; custom collections can be stored locally.
- **Playback:** starting a collection advances through the ordered problems; submissions are saved as usual.
- **Progress:** session progress lives in `sessionStorage`; completions are stored in `user_collection_completions`.
- **Limits:** max 20 problems per collection.

## Speech-to-text
- Hook: `lib/hooks/useSpeechToText.ts`
- Uses `window.SpeechRecognition` or `webkitSpeechRecognition`.
- When active, typing is disabled and transcripts are appended to the response.
- Mic stays active until the user clicks stop; the hook auto-restarts recognition
  on `onend` while listening to avoid single-sentence cutoff.

## Timer
- Hook: `lib/hooks/useTimer.ts`
- Default uses `question.suggested_time * 60`.
- Status: `idle | running | paused | finished`.
- When finished, timer pulses red until stopped.

## Styling
- Tailwind with design tokens in `app/globals.css` (near-black palette, muted accents).
- Visual language: purposeful minimalism + subtle depth (tight table layout,
  subtle borders, 4–6px radius, 150–200ms transitions).
- Typeface: Inter via `app/layout.tsx`.
- Utility helper: `lib/utils/cn.ts` for class merging.

## Common Tasks
- **Add new question fields:** Update types in `types/index.ts`, update any UI reads,
  and add a migration to backfill existing data.
- **Change filters/sorting:** Update `components/problems/ProblemFilters.tsx` and
  `/api/questions` query logic.
- **Adjust AI feedback provider:** Update `app/api/feedback/route.ts` to match
  the external API contract.
- **Enum conventions:** Use Postgres enums for constrained fields (e.g. `track`, `category`, `target_role`) in new migrations.

## Troubleshooting
- "Unsupported provider" during Google auth: enable Google provider in Supabase
  Auth -> Providers and ensure redirect URLs are set.
- Missing Supabase env vars: set `.env.local` (see `.env.example`).

## Commands
- `npm run dev` start dev server
- `supabase db push` apply migrations to linked project
- `supabase db reset` reset local DB and apply migrations
