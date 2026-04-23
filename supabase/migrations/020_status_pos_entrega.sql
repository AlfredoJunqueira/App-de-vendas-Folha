-- Adiciona status pós-entrega para rastreamento do processo burocrático
ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;
ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_status_check
  CHECK (status IN (
    'em_aberto',
    'confirmado',
    'aguardando_pesagem',
    'entregue',
    'aguardando_nf',
    'aguardando_boleto',
    'finalizado',
    'cancelado'
  ));
