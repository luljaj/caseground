-- Collections system schema

CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  long_description text,
  section text NOT NULL,
  target_roles text[] DEFAULT '{}',
  difficulty text DEFAULT 'intermediate',
  problem_ids uuid[] NOT NULL DEFAULT '{}',
  estimated_time_minutes integer,
  sort_order integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT max_problems CHECK (
    array_length(problem_ids, 1) <= 20 OR problem_ids = '{}'
  )
);

CREATE INDEX IF NOT EXISTS idx_collections_section ON public.collections(section);
CREATE INDEX IF NOT EXISTS idx_collections_published
  ON public.collections(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_collections_featured
  ON public.collections(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_collections_target_roles
  ON public.collections USING GIN(target_roles);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collections are publicly readable"
  ON public.collections FOR SELECT USING (is_published = true);

CREATE TABLE IF NOT EXISTS public.user_collection_completions (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_user_collection_completions_user
  ON public.user_collection_completions(user_id);

ALTER TABLE public.user_collection_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions"
  ON public.user_collection_completions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON public.user_collection_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS target_role text,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
