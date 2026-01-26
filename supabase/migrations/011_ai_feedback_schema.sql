-- AI feedback storage
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_type_enum') THEN
    CREATE TYPE public.feedback_type_enum AS ENUM ('problem', 'collection');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_status_enum') THEN
    CREATE TYPE public.feedback_status_enum AS ENUM ('pending', 'completed', 'failed', 'expired');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  response_id uuid REFERENCES public.user_responses(id) ON DELETE CASCADE,
  collection_id uuid,
  feedback_type public.feedback_type_enum NOT NULL,
  content text NOT NULL,
  model text,
  tokens_used integer,
  generation_time_ms integer,
  prompt_hash text,
  status public.feedback_status_enum NOT NULL DEFAULT 'completed',
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT feedback_scope_check CHECK (
    (feedback_type = 'problem' AND response_id IS NOT NULL AND collection_id IS NULL) OR
    (feedback_type = 'collection' AND collection_id IS NOT NULL AND response_id IS NULL)
  )
);

DO $$
BEGIN
  IF to_regclass('public.collections') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'ai_feedback_collection_id_fkey'
    ) THEN
      ALTER TABLE public.ai_feedback
        ADD CONSTRAINT ai_feedback_collection_id_fkey
        FOREIGN KEY (collection_id) REFERENCES public.collections(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON public.ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_response ON public.ai_feedback(response_id)
  WHERE response_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_feedback_collection ON public.ai_feedback(collection_id)
  WHERE collection_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON public.ai_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_created ON public.ai_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_response_latest
  ON public.ai_feedback(response_id, created_at DESC)
  WHERE response_id IS NOT NULL AND status = 'completed';

ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON public.ai_feedback FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON public.ai_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback"
  ON public.ai_feedback FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_latest_feedback_for_response(p_response_id uuid)
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

CREATE OR REPLACE FUNCTION public.get_latest_feedback_for_collection(
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
