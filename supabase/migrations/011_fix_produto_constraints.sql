-- Migration 011: remove constraints hardcoded de produto e adiciona carregamento_id em pedidos

-- 1. Remove o check constraint de produto na tabela paradas
--    (produtos agora são dinâmicos, vindos da tabela 'produtos')
ALTER TABLE public.paradas
  DROP CONSTRAINT IF EXISTS paradas_produto_check;

-- 2. Remove o check constraint de produto na tabela pedidos (se ainda existir)
ALTER TABLE public.pedidos
  DROP CONSTRAINT IF EXISTS pedidos_produto_check;

-- 3. Adiciona carregamento_id em pedidos (FK para carregamentos)
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS carregamento_id uuid REFERENCES public.carregamentos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS pedidos_carregamento_id_idx ON public.pedidos (carregamento_id);
