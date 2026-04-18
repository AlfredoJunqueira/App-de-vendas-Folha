ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'colaborador')),
  ADD COLUMN IF NOT EXISTS employer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
