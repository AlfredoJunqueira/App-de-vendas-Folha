-- Adiciona campo local_carregamento_id na tabela carregamentos
ALTER TABLE public.carregamentos
  ADD COLUMN IF NOT EXISTS local_carregamento_id uuid REFERENCES public.locais_carregamento(id) ON DELETE SET NULL;
