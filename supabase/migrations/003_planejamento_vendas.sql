-- ============================================================
-- Planejamento de Vendas Mensal
-- ============================================================

create table public.planejamentos_mensais (
  id               uuid primary key default gen_random_uuid(),
  mes              text not null,                       -- "YYYY-MM"
  cliente_id       uuid not null references public.clientes(id) on delete cascade,
  produto          text not null,                       -- valor do produto (ex: 'feno', 'pre_secado')
  unidade          text not null default 'kg',
  meta_volume      numeric(12, 2) not null default 0,
  media_historica  numeric(12, 2),
  tipo_mix         text not null check (tipo_mix in ('principal', 'ocasional')),
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),
  owner_id         uuid not null references auth.users(id)
);

-- Garante que só existe uma meta por mes/cliente/produto por usuário
create unique index planejamentos_mensais_unico
  on public.planejamentos_mensais (owner_id, mes, cliente_id, produto);

create index on public.planejamentos_mensais (owner_id, mes);
create index on public.planejamentos_mensais (cliente_id);

alter table public.planejamentos_mensais enable row level security;

create policy "representante_crud_planejamentos" on public.planejamentos_mensais
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
