-- ============================================================
-- Oriafen Academy Platform - Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor)
-- ============================================================


-- ------------------------------------------------------------
-- Users (linked to auth.users)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id             uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          text        UNIQUE NOT NULL,
  full_name      text,
  role           text        NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  pack_purchased text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Admins can read all user rows
CREATE POLICY "users_admin_select_all"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );


-- ------------------------------------------------------------
-- Dossiers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dossiers (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dossier_number text        NOT NULL,
  current_step   int         NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 6),
  status         text        NOT NULL DEFAULT 'En cours',
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE public.dossiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dossiers_select_own"
  ON public.dossiers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "dossiers_update_own"
  ON public.dossiers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "dossiers_insert_own"
  ON public.dossiers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dossiers_admin_all"
  ON public.dossiers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );


-- ------------------------------------------------------------
-- Documents  (v2 — includes per-category upload + storage)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- Human-readable name, e.g. "Pièce d'identité"
  name             text        NOT NULL,
  -- Slug matching REQUIRED_DOCUMENTS[].id, e.g. "identity"
  category         text,
  -- Supabase Storage path, e.g. "<userId>/identity/1234567890.pdf"
  file_url         text,
  file_name        text,
  status           text        NOT NULL DEFAULT 'en_attente'
                   CHECK (status IN ('valide', 'en_attente', 'manquant', 'correction_demandee')),
  rejection_reason text,
  uploaded_at      timestamptz DEFAULT now(),
  -- One document per category per student
  UNIQUE (user_id, category)
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_all_own"
  ON public.documents FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "documents_admin_all"
  ON public.documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Enable Realtime so students see live status changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;


-- ------------------------------------------------------------
-- Formation progress
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.formation_progress (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  unit_number     int         NOT NULL CHECK (unit_number BETWEEN 1 AND 5),
  hours_completed int         NOT NULL DEFAULT 0,
  completed       boolean     NOT NULL DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (user_id, unit_number)
);

ALTER TABLE public.formation_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "formation_all_own"
  ON public.formation_progress FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "formation_admin_all"
  ON public.formation_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );


-- ------------------------------------------------------------
-- Exam results
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exam_results (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exam_type    text        NOT NULL CHECK (exam_type IN ('ias1', 'commercial')),
  score        int         NOT NULL,
  passed       boolean     NOT NULL,
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exam_results_all_own"
  ON public.exam_results FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "exam_results_admin_all"
  ON public.exam_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );


-- ------------------------------------------------------------
-- Storage bucket for documents
-- Run in SQL Editor AFTER creating the bucket in
--   Storage > New bucket > Name: "documents" > Private
-- ------------------------------------------------------------

-- Allow students to upload/read their own files
CREATE POLICY "students_upload_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "students_read_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "students_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can access all documents in the bucket
CREATE POLICY "admins_all_storage"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ------------------------------------------------------------
-- Migration: add new columns to existing documents table
-- Run these if you already applied a previous version of the schema
-- ------------------------------------------------------------
-- ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS category         text;
-- ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_url         text;
-- ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_name        text;
-- ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS rejection_reason text;
-- ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_status_check;
-- ALTER TABLE public.documents ADD CONSTRAINT documents_status_check
--   CHECK (status IN ('valide', 'en_attente', 'manquant', 'correction_demandee'));
-- ALTER TABLE public.documents ADD CONSTRAINT documents_user_category_unique UNIQUE (user_id, category);
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;


-- ------------------------------------------------------------
-- Trigger: auto-create user profile on signup
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, pack_purchased)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'pack_purchased'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ------------------------------------------------------------
-- Seed: set roles for demo users (run after creating auth users)
-- ------------------------------------------------------------
-- UPDATE public.users SET role = 'admin'   WHERE email = 'admin@oriafen.com';
-- UPDATE public.users SET role = 'student', pack_purchased = 'Essentiel'
--   WHERE email = 'student@oriafen.com';
