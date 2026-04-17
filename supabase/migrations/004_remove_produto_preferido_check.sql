-- Remove constraint hardcoded em 'produto_preferido' do clientes,
-- pois os produtos agora são dinâmicos (tabela produtos).
alter table public.clientes
  drop constraint if exists clientes_produto_preferido_check;
