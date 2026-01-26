# AI Feedback Storage Implementation Plan

## Overview

This document outlines the plan to implement a dedicated system for storing AI feedback responses in the Supabase database. The new system will support:
1. **Problem-level feedback** (existing, to be migrated) — feedback for individual problem responses
2. **Collection-level feedback** (new) — aggregate feedback for completed collections

---

## Current State Analysis

### Existing Feedback Storage
Currently, AI feedback is stored inline in the `user_responses` table:

```sql
-- Current: user_responses table
ai_feedback text  -- Stored directly on the response row
```

**Limitations of current approach:**
- No history of feedback regenerations
- Can't track feedback metadata (model used, tokens, generation time)
- No separate querying of feedback without joining responses
- Can't store collection-level aggregate feedback
- No versioning or provenance tracking

---

## Proposed Solution

### New Table: `ai_feedback`

A dedicated table to store all AI-generated feedback with full metadata and support for both problem-level and collection-level feedback.

---

## Phase 1: Database Schema

### Migration: `011_ai_feedback_schema.sql`

```sql
-- ============================================
-- 1. AI FEEDBACK TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.ai_feedback (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference (required)
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Feedback scope (exactly one must be set)
  response_id uuid REFERENCES public.user_responses(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES public.collections(id) ON DELETE CASCADE,
  
  -- Feedback type discriminator
  feedback_type text NOT NULL CHECK (feedback_type IN ('problem', 'collection')),
  
  -- Content
  content text NOT NULL,                    -- The actual feedback markdown
  
  -- Generation metadata
  model text,                               -- e.g., 'gpt-4o', 'claude-3-sonnet'
  tokens_used integer,                      -- Total tokens consumed
  generation_time_ms integer,               -- Time to generate in milliseconds
  prompt_hash text,                         -- Hash of input prompt (for caching/dedup)
  
  -- Status
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
  error_message text,                       -- If status = 'failed'
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT feedback_scope_check CHECK (
    (feedback_type = 'problem' AND response_id IS NOT NULL AND collection_id IS NULL) OR
    (feedback_type = 'collection' AND collection_id IS NOT NULL AND response_id IS NULL)
  )
);

-- ============================================
-- 2. INDEXES
-- ============================================

-- User lookups
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON public.ai_feedback(user_id);

-- Problem feedback lookups
CREATE INDEX IF NOT EXISTS idx_ai_feedback_response ON public.ai_feedback(response_id) 
  WHERE response_id IS NOT NULL;

-- Collection feedback lookups
CREATE INDEX IF NOT EXISTS idx_ai_feedback_collection ON public.ai_feedback(collection_id) 
  WHERE collection_id IS NOT NULL;

-- Type filtering
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON public.ai_feedback(feedback_type);

-- Chronological lookups
CREATE INDEX IF NOT EXISTS idx_ai_feedback_created ON public.ai_feedback(created_at DESC);

-- Get latest feedback per response (common query)
CREATE INDEX IF NOT EXISTS idx_ai_feedback_response_latest 
  ON public.ai_feedback(response_id, created_at DESC) 
  WHERE response_id IS NOT NULL AND status = 'completed';

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON public.ai_feedback FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own feedback (via API)
CREATE POLICY "Users can insert own feedback"
  ON public.ai_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback (e.g., mark as expired)
CREATE POLICY "Users can update own feedback"
  ON public.ai_feedback FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 4. HELPER FUNCTION: GET LATEST FEEDBACK
-- ============================================

-- Get the most recent feedback for a specific response
CREATE OR REPLACE FUNCTION get_latest_feedback_for_response(p_response_id uuid)
RETURNS TABLE(
  id uuid,
  content text,
  model text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    af.id,
    af.content,
    af.model,
    af.created_at
  FROM public.ai_feedback af
  WHERE af.response_id = p_response_id
    AND af.status = 'completed'
  ORDER BY af.created_at DESC
  LIMIT 1;
END;
$$;

-- Get the most recent feedback for a collection
CREATE OR REPLACE FUNCTION get_latest_feedback_for_collection(
  p_collection_id uuid,
  p_user_id uuid
)
RETURNS TABLE(
  id uuid,
  content text,
  model text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    af.id,
    af.content,
    af.model,
    af.created_at
  FROM public.ai_feedback af
  WHERE af.collection_id = p_collection_id
    AND af.user_id = p_user_id
    AND af.status = 'completed'
  ORDER BY af.created_at DESC
  LIMIT 1;
END;
$$;
```

---

## Phase 2: TypeScript Types

### Add to `/types/index.ts`

```typescript
// ============================================
// AI FEEDBACK
// ============================================

export type FeedbackType = 'problem' | 'collection';

export type FeedbackStatus = 'pending' | 'completed' | 'failed' | 'expired';

export interface AIFeedback {
  id: string;
  user_id: string;
  
  // Scope (one of these will be set)
  response_id: string | null;
  collection_id: string | null;
  
  // Type
  feedback_type: FeedbackType;
  
  // Content
  content: string;
  
  // Generation metadata
  model: string | null;
  tokens_used: number | null;
  generation_time_ms: number | null;
  prompt_hash: string | null;
  
  // Status
  status: FeedbackStatus;
  error_message: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// For creating new feedback
export interface CreateAIFeedbackInput {
  response_id?: string;
  collection_id?: string;
  feedback_type: FeedbackType;
  content: string;
  model?: string;
  tokens_used?: number;
  generation_time_ms?: number;
}

// For API responses
export interface AIFeedbackWithMeta extends AIFeedback {
  // Optional enriched data
  question_title?: string;
  collection_name?: string;
}
```

---

## Phase 3: Data Structure Design

### Problem-Level Feedback

For individual problem responses, feedback is tied to a `user_responses` row:

```
┌─────────────────────────────────────────────────────────────────┐
│                       ai_feedback (problem)                      │
├─────────────────────────────────────────────────────────────────┤
│  id: uuid                                                        │
│  user_id: uuid ─────────────────────────┐                       │
│  response_id: uuid ─────────────────────┤→ user_responses       │
│  collection_id: NULL                     │                       │
│  feedback_type: 'problem'               │                       │
│  content: "### Strengths\n- Good..."    │                       │
│  model: 'gpt-4o'                        │                       │
│  tokens_used: 450                       │                       │
│  generation_time_ms: 2340               │                       │
│  status: 'completed'                    │                       │
│  created_at: '2026-01-24T...'           │                       │
└─────────────────────────────────────────────────────────────────┘
```

### Collection-Level Feedback

For collections, feedback summarizes performance across all problems in the collection:

```
┌─────────────────────────────────────────────────────────────────┐
│                     ai_feedback (collection)                     │
├─────────────────────────────────────────────────────────────────┤
│  id: uuid                                                        │
│  user_id: uuid ─────────────────────────┐                       │
│  response_id: NULL                       │                       │
│  collection_id: uuid ───────────────────┤→ collections          │
│  feedback_type: 'collection'            │                       │
│  content: "## Collection Summary\n..."  │                       │
│  model: 'gpt-4o'                        │                       │
│  tokens_used: 800                       │                       │
│  generation_time_ms: 4200               │                       │
│  status: 'completed'                    │                       │
│  created_at: '2026-01-24T...'           │                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 4: API Routes

### New/Modified API Routes

| Route | Method | Auth | Credits | Purpose |
|-------|--------|------|---------|---------|
| `POST /api/feedback` | POST | ✅ Required | 1 credit | Generate problem feedback (modify existing) |
| `GET /api/feedback/[id]` | GET | ✅ Required | Free | Get specific feedback by ID |
| `GET /api/feedback/response/[responseId]` | GET | ✅ Required | Free | Get all feedback for a response |
| `POST /api/feedback/collection` | POST | ✅ Required | **1 credit** | Generate collection-level feedback |
| `GET /api/feedback/collection/[collectionId]` | GET | ✅ Required | Free | Get feedback for a collection |

### Credit Cost

| Feedback Type | Credit Cost | Rationale |
|---------------|-------------|-----------|
| Problem feedback | 1 credit | Single problem analysis |
| **Collection feedback** | **1 credit** | Aggregate analysis (higher token usage but same cost to user) |

### Modified `/api/feedback/route.ts`

```typescript
// Key changes:
// 1. Create new ai_feedback row instead of updating user_responses.ai_feedback
// 2. Track generation metadata (model, tokens, time)
// 3. Return the new feedback row

// After AI generation succeeds:
const startTime = Date.now();
// ... AI call ...
const generationTime = Date.now() - startTime;

const { data: feedbackRow, error: insertError } = await supabase
  .from('ai_feedback')
  .insert({
    user_id: user.id,
    response_id: responseId,
    feedback_type: 'problem',
    content: cleanedFeedback,
    model: defaultModel,
    tokens_used: aiResponse.usage?.total_tokens ?? null,
    generation_time_ms: generationTime,
    status: 'completed',
  })
  .select()
  .single();

// Also update user_responses.ai_feedback for backwards compatibility
await supabase
  .from('user_responses')
  .update({ ai_feedback: cleanedFeedback })
  .eq('id', responseId)
  .eq('user_id', user.id);
```

### New `/api/feedback/collection/route.ts` — Full Implementation

```typescript
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  
  // ============================================
  // 1. AUTHENTICATION
  // ============================================
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ============================================
  // 2. PARSE REQUEST
  // ============================================
  const body = await request.json();
  const collectionId = body?.collection_id as string | undefined;

  if (!collectionId) {
    return NextResponse.json(
      { error: "Missing collection_id." },
      { status: 400 }
    );
  }

  // ============================================
  // 3. DEDUCT CREDIT (1 credit for collection feedback)
  // ============================================
  const { data: deductResult, error: deductError } = await supabase.rpc(
    "deduct_credit_atomic",
    { p_user_id: user.id }
  );

  if (deductError || !deductResult?.success) {
    const reason = deductResult?.reason || "deduction_failed";

    if (reason === "rate_limited") {
      return NextResponse.json(
        {
          error: "Please wait before generating more feedback.",
          retry_after: deductResult.retry_after,
        },
        { status: 429 }
      );
    }

    if (reason === "no_credits") {
      return NextResponse.json(
        { error: "No credits remaining.", credits_remaining: 0 },
        { status: 400 }
      );
    }

    if (reason === "monthly_limit_exceeded") {
      return NextResponse.json(
        { error: "Monthly usage limit reached. Please try again next month." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Unable to process request." },
      { status: 500 }
    );
  }

  const wasSubscription = deductResult.is_subscription;
  const refundCredit = async () => {
    await supabase.rpc("refund_credit", {
      p_user_id: user.id,
      p_was_subscription: wasSubscription,
    });
  };

  // ============================================
  // 4. VERIFY COLLECTION EXISTS & USER COMPLETED IT
  // ============================================
  const { data: collection, error: collectionError } = await supabase
    .from("collections")
    .select("id, name, problem_ids")
    .eq("id", collectionId)
    .single();

  if (collectionError || !collection) {
    await refundCredit();
    return NextResponse.json(
      { error: "Collection not found." },
      { status: 404 }
    );
  }

  // Check if user has completed this collection
  const { data: completion } = await supabase
    .from("user_collection_completions")
    .select("completed_at")
    .eq("user_id", user.id)
    .eq("collection_id", collectionId)
    .single();

  if (!completion) {
    await refundCredit();
    return NextResponse.json(
      { error: "You must complete the collection before requesting feedback." },
      { status: 400 }
    );
  }

  // ============================================
  // 5. FETCH ALL USER RESPONSES FOR COLLECTION PROBLEMS
  // ============================================
  const problemIds = collection.problem_ids as string[];
  
  const { data: responses, error: responsesError } = await supabase
    .from("user_responses")
    .select(`
      id,
      question_id,
      response,
      ai_feedback,
      questions!inner (
        title,
        prompt,
        rubric
      )
    `)
    .eq("user_id", user.id)
    .in("question_id", problemIds)
    .order("created_at", { ascending: true });

  if (responsesError || !responses || responses.length === 0) {
    await refundCredit();
    return NextResponse.json(
      { error: "No responses found for this collection." },
      { status: 404 }
    );
  }

  // ============================================
  // 6. BUILD AGGREGATE PROMPT
  // ============================================
  const systemPrompt = `You are an interview coach providing aggregate feedback on a completed case interview practice collection.

## Instructions
- Analyze the user's performance across ALL problems in this collection
- Identify patterns: consistent strengths and recurring weaknesses
- Provide actionable recommendations for improvement
- Be encouraging but honest
- Keep the summary concise (max 500 words)

## Format
Use this structure:

### Overall Performance
[1-2 sentence summary of overall performance]

### Consistent Strengths
- [strength 1]
- [strength 2]

### Areas for Improvement
- [improvement 1]
- [improvement 2]

### Recommended Next Steps
[2-3 specific actions the user should take]`;

  // Build user prompt with all responses
  let userPrompt = `# Collection: ${collection.name}\n\n`;
  userPrompt += `The user completed ${responses.length} problems. Here are their responses and any individual feedback received:\n\n`;

  responses.forEach((r, index) => {
    const question = r.questions as { title: string; prompt: string };
    userPrompt += `## Problem ${index + 1}: ${question.title}\n`;
    userPrompt += `**Question:** ${question.prompt.slice(0, 200)}...\n\n`;
    userPrompt += `**User's Response:**\n${r.response.slice(0, 500)}${r.response.length > 500 ? '...' : ''}\n\n`;
    if (r.ai_feedback) {
      userPrompt += `**Individual Feedback Summary:**\n${r.ai_feedback.slice(0, 300)}...\n\n`;
    }
    userPrompt += `---\n\n`;
  });

  userPrompt += `\nProvide aggregate feedback analyzing patterns across all ${responses.length} problems.`;

  // ============================================
  // 7. CALL AI API
  // ============================================
  const apiUrl = process.env.AI_API_URL;
  const apiKey = process.env.AI_API_KEY;
  const defaultModel = process.env.DEFAULT_MODEL?.trim();

  if (!apiUrl || !apiKey || !defaultModel) {
    await refundCredit();
    return NextResponse.json(
      { error: "AI API not configured." },
      { status: 500 }
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "X-Title": "Caseground",
  };

  const referer = process.env.NEXT_PUBLIC_APP_URL;
  if (referer) {
    headers["HTTP-Referer"] = referer;
  }

  const startTime = Date.now();

  const aiResponse = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: defaultModel,
      temperature: 0.4,
      max_tokens: 600, // Slightly higher for collection summary
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const generationTime = Date.now() - startTime;
  const rawText = await aiResponse.text();

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = null;
  }

  // Extract content from various AI response formats
  const content =
    typeof parsed === "object" && parsed !== null
      ? (parsed as { choices?: { message?: { content?: string } }[] })
          ?.choices?.[0]?.message?.content ?? rawText
      : rawText;

  const feedback =
    typeof content === "string" ? content : JSON.stringify(content ?? rawText);

  if (!aiResponse.ok) {
    await refundCredit();
    return NextResponse.json(
      { error: "AI API error. Please try again." },
      { status: 502 }
    );
  }

  const cleanedFeedback = feedback.trim();

  if (!cleanedFeedback) {
    await refundCredit();
    return NextResponse.json(
      { error: "AI API returned empty feedback." },
      { status: 502 }
    );
  }

  // ============================================
  // 8. STORE IN AI_FEEDBACK TABLE
  // ============================================
  const { data: feedbackRow, error: insertError } = await supabase
    .from("ai_feedback")
    .insert({
      user_id: user.id,
      collection_id: collectionId,
      response_id: null, // Not a problem-level feedback
      feedback_type: "collection",
      content: cleanedFeedback,
      model: defaultModel,
      tokens_used:
        (parsed as { usage?: { total_tokens?: number } })?.usage?.total_tokens ?? null,
      generation_time_ms: generationTime,
      status: "completed",
    })
    .select()
    .single();

  if (insertError) {
    // Don't refund — feedback was generated, just storage failed
    console.error("Failed to store collection feedback:", insertError);
    // Still return the feedback to user
  }

  // ============================================
  // 9. RETURN RESPONSE
  // ============================================
  return NextResponse.json({
    feedback: cleanedFeedback,
    feedback_id: feedbackRow?.id ?? null,
    creditsRemaining: wasSubscription ? null : deductResult.credits_remaining,
  });
}
```

### Error Handling Patterns

| Error Scenario | HTTP Status | Response |
|---------------|-------------|----------|
| Not authenticated | 401 | `{ error: "Unauthorized" }` |
| Missing required field | 400 | `{ error: "Missing collection_id." }` |
| No credits | 400 | `{ error: "No credits remaining.", credits_remaining: 0 }` |
| Rate limited | 429 | `{ error: "Please wait...", retry_after: N }` |
| Collection not found | 404 | `{ error: "Collection not found." }` |
| Collection not completed | 400 | `{ error: "You must complete the collection..." }` |
| AI API error | 502 | `{ error: "AI API error. Please try again." }` |
| AI returns empty | 502 | `{ error: "AI API returned empty feedback." }` |

### Refund Logic

Credits are refunded if the failure occurs **before** AI generation completes:
- ✅ Refund: Auth failure, validation failure, collection not found, AI API error
- ❌ No refund: Storage failure after successful AI generation (user still gets feedback)

---

## Phase 5: Migration Strategy

### Backward Compatibility

To maintain backward compatibility during migration:

1. **Keep `user_responses.ai_feedback`** — Continue writing to this column for now
2. **Dual-write pattern** — Write to both old column and new table
3. **Read from new table** — Update UI to prefer new table data
4. **Future cleanup** — Eventually deprecate `user_responses.ai_feedback`

### Data Migration (Optional)

If you want to migrate existing feedback to the new table:

```sql
-- Migration script to copy existing feedback
INSERT INTO public.ai_feedback (
  user_id,
  response_id,
  feedback_type,
  content,
  status,
  created_at
)
SELECT 
  ur.user_id,
  ur.id,
  'problem',
  ur.ai_feedback,
  'completed',
  ur.created_at
FROM public.user_responses ur
WHERE ur.ai_feedback IS NOT NULL
ON CONFLICT DO NOTHING;
```

---

## Phase 6: Collection Feedback Feature

### Credit Cost

| Type | Cost | Rationale |
|------|------|-----------|
| **Collection feedback** | **1 credit** | Same as individual problem feedback — keeps pricing simple for users |

### When to Generate Collection Feedback

Collection-level feedback is generated when:
1. User completes all problems in a collection
2. User explicitly requests collection feedback (button on completion page)

**Note:** Collection feedback is **on-demand only** — not automatically generated. This:
- Saves credits for users who don't want aggregate feedback
- Gives users control over when to use credits
- Reduces unnecessary AI API costs

### Token Budget

| Component | Max Tokens | Notes |
|-----------|------------|-------|
| System prompt | ~200 | Fixed instruction set |
| User prompt (per problem) | ~300 | Truncated response + feedback excerpts |
| User prompt (total, 8 problems) | ~2,400 | Keeps within context limits |
| AI response | 600 | `max_tokens: 600` in API call |
| **Total context** | ~3,200 | Well within model limits |

**Truncation Strategy:**
- User response: First 500 characters + "..."
- Individual feedback: First 300 characters + "..."
- Question prompt: First 200 characters + "..."

### Collection Feedback Prompt Template

**System Prompt:**
```
You are an interview coach providing aggregate feedback on a completed case interview practice collection.

## Instructions
- Analyze the user's performance across ALL problems in this collection
- Identify patterns: consistent strengths and recurring weaknesses
- Provide actionable recommendations for improvement
- Be encouraging but honest
- Keep the summary concise (max 500 words)

## Format
Use this structure:

### Overall Performance
[1-2 sentence summary of overall performance]

### Consistent Strengths
- [strength 1]
- [strength 2]

### Areas for Improvement
- [improvement 1]
- [improvement 2]

### Recommended Next Steps
[2-3 specific actions the user should take]
```

**User Prompt Structure:**
```
# Collection: [Collection Name]

The user completed [X] problems. Here are their responses and any individual feedback received:

## Problem 1: [Title]
**Question:** [First 200 chars of prompt]...
**User's Response:** [First 500 chars of response]...
**Individual Feedback Summary:** [First 300 chars if exists]...

---

## Problem 2: [Title]
...

---

Provide aggregate feedback analyzing patterns across all [X] problems.
```

---

## Phase 7: File Structure Updates

### New Files

| File | Purpose |
|------|---------|
| `app/api/feedback/[id]/route.ts` | Get specific feedback |
| `app/api/feedback/response/[responseId]/route.ts` | Get feedback history for response |
| `app/api/feedback/collection/route.ts` | Generate/get collection feedback |
| `components/results/FeedbackHistory.tsx` | Show feedback generation history |
| `components/collections/CollectionFeedback.tsx` | Collection-level feedback display |

### Modified Files

| File | Changes |
|------|---------|
| `types/index.ts` | Add `AIFeedback` types |
| `app/api/feedback/route.ts` | Write to new table + metadata tracking |
| `components/results/AIFeedback.tsx` | Use new table, show metadata |
| `app/collections/[slug]/complete/page.tsx` | Add collection feedback option |

---

## Phase 8: Implementation Order

1. **Database migration** — Create `ai_feedback` table
2. **Types** — Add TypeScript definitions
3. **API route update** — Modify `/api/feedback` for dual-write
4. **UI update** — Update `AIFeedback.tsx` to read from new table
5. **Feedback history** — Show past feedback generations
6. **Collection feedback API** — New endpoint for collection feedback
7. **Collection completion UI** — Integrate collection feedback
8. **Migration script** — Migrate existing feedback (optional)
9. **Cleanup** — Remove old column usage (future)

---

## Database Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │     │  user_responses │     │   collections   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │◄────│ user_id         │     │ id              │
│ email           │     │ question_id     │     │ name            │
│ ai_credits      │     │ response        │     │ problem_ids     │
│ ...             │     │ ai_feedback     │ (*)│ ...             │
└─────────────────┘     │ ...             │     └─────────────────┘
        │               └─────────────────┘              │
        │                       │                        │
        │                       ▼                        │
        │               ┌─────────────────┐              │
        └──────────────►│   ai_feedback   │◄─────────────┘
                        ├─────────────────┤
                        │ id              │
                        │ user_id ────────┤→ users.id
                        │ response_id ────┤→ user_responses.id (nullable)
                        │ collection_id ──┤→ collections.id (nullable)
                        │ feedback_type   │ ('problem' | 'collection')
                        │ content         │
                        │ model           │
                        │ tokens_used     │
                        │ generation_time │
                        │ status          │
                        │ created_at      │
                        └─────────────────┘
                        
(*) user_responses.ai_feedback kept for backward compatibility
```

---

## Summary

| Component | Description |
|-----------|-------------|
| **Table** | `ai_feedback` — stores all AI-generated feedback |
| **Problem feedback** | Links to `response_id`, `feedback_type = 'problem'` |
| **Collection feedback** | Links to `collection_id`, `feedback_type = 'collection'` |
| **Metadata** | Model, tokens, generation time, prompt hash |
| **History** | Multiple feedback entries per response/collection supported |
| **Migration** | Dual-write for backward compatibility |

---

## Open Questions

| Question | Recommended Answer |
|----------|-------------------|
| Keep feedback history or only latest? | **Keep history** — allows regeneration tracking |
| Migrate old feedback to new table? | **Yes** — for consistent querying |
| Show generation metadata to users? | **Optional** — could show model/time as "Details" |
| Collection feedback: auto or on-demand? | **On-demand** — save AI credits, user control |
| Rate limit collection feedback? | **Yes** — use same deduct_credit_atomic pattern |

---

## Notes

- This plan is designed to be **non-breaking** — existing functionality continues to work
- The new table enables **richer features** like feedback history and analytics
- Collection feedback is a **new capability** enabled by the collections feature
- Consider adding a **feedback quality rating** in the future (thumbs up/down)
