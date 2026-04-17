-- Migration 010: numeração sequencial por usuário nos pedidos
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS numero integer;

-- Backfill: atribui números em ordem de criação por usuário
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY criado_em) AS rn
  FROM public.pedidos
)
UPDATE public.pedidos p
SET numero = n.rn
FROM numbered n
WHERE p.id = n.id AND p.numero IS NULL;

-- Trigger que atribui o próximo número ao inserir
CREATE OR REPLACE FUNCTION public.assign_pedido_numero()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero
  FROM public.pedidos
  WHERE owner_id = NEW.owner_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_assign_pedido_numero ON public.pedidos;
CREATE TRIGGER trg_assign_pedido_numero
BEFORE INSERT ON public.pedidos
FOR EACH ROW
WHEN (NEW.numero IS NULL)
EXECUTE FUNCTION public.assign_pedido_numero();
