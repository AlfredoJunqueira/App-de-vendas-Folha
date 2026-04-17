-- Migration 015: suporte a múltiplos produtos por parada

-- 1. Adiciona coluna itens (array de {produto, quantidade_kg, quantidade_unidades?})
ALTER TABLE public.paradas ADD COLUMN IF NOT EXISTS itens jsonb;

-- 2. Adiciona pedido_id para vincular parada diretamente ao pedido de origem
ALTER TABLE public.paradas ADD COLUMN IF NOT EXISTS pedido_id uuid REFERENCES public.pedidos(id) ON DELETE SET NULL;

-- 3. Torna produto e quantidade_kg nullable (paradas multi-produto usam apenas itens)
ALTER TABLE public.paradas ALTER COLUMN produto DROP NOT NULL;
ALTER TABLE public.paradas ALTER COLUMN quantidade_kg DROP NOT NULL;

CREATE INDEX IF NOT EXISTS paradas_pedido_id_idx ON public.paradas (pedido_id);
