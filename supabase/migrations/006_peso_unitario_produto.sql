-- Adiciona campos de embalagem nos produtos
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS peso_unitario_kg numeric(10,2),
  ADD COLUMN IF NOT EXISTS unidade_embalagem text; -- ex: 'fardo', 'bola', 'saco'
