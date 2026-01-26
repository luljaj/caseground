DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'target_role_enum') THEN
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
  END IF;
END $$;

ALTER TABLE public.users
  ALTER COLUMN target_role TYPE target_role_enum
  USING (
    CASE
      WHEN target_role IN (
        'consulting',
        'pm',
        'ib',
        'pe',
        'corporate_strategy',
        'tech',
        'marketing',
        'wealth_management'
      )
      THEN target_role::target_role_enum
      ELSE NULL
    END
  );
