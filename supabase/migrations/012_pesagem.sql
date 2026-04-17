-- Migration 012: suporte a pesagem por carregamento

-- 1. Adiciona quantidade_unidades em pedidos (número de bolas/fardos negociados)
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS quantidade_unidades integer;

-- 2. Inclui status aguardando_pesagem no check de pedidos
ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;
ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_status_check
  CHECK (status IN ('em_aberto', 'confirmado', 'aguardando_pesagem', 'entregue', 'cancelado'));

-- 3. Adiciona colunas de pesagem nas paradas
ALTER TABLE public.paradas ADD COLUMN IF NOT EXISTS quantidade_unidades integer;
ALTER TABLE public.paradas ADD COLUMN IF NOT EXISTS peso_por_unidade numeric(10, 4);
