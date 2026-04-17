-- 008_pedido_itens.sql
-- Suporte a múltiplos produtos por pedido

-- 1. Adiciona coluna itens (array de {produto, quantidade_kg, preco_kg})
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS itens jsonb;

-- 2. Converte valor_total de coluna gerada para coluna regular
--    (necessário para calcular a partir de múltiplos itens)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'pedidos'
      AND column_name  = 'valor_total'
  ) THEN
    ALTER TABLE public.pedidos DROP COLUMN valor_total;
  END IF;
  ALTER TABLE public.pedidos ADD COLUMN valor_total numeric(12, 2);
END $$;

-- 3. Popula itens e recalcula valor_total nos registros existentes
UPDATE public.pedidos
SET
  itens = jsonb_build_array(
    jsonb_build_object(
      'produto',       produto,
      'quantidade_kg', quantidade_kg,
      'preco_kg',      preco_kg
    )
  ),
  valor_total = COALESCE(quantidade_kg, 0) * COALESCE(preco_kg, 0)
WHERE itens IS NULL AND produto IS NOT NULL;
